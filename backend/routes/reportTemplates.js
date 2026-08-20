const express = require('express');
const multer = require('multer');
const supabase = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { uploadAndSign, buildStoragePath } = require('../services/storageService');

const router = express.Router();
router.use(authMiddleware);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ── Get report template (admin only) ──────────────────
router.get('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    if (!req.user.institution_id) {
      console.error('User missing institution_id:', req.user);
      return res.status(400).json({ 
        error: 'Your account is not associated with an institution. Please contact support.' 
      });
    }

    const { data, error } = await supabase
      .from('report_templates')
      .select('*')
      .eq('institution_id', req.user.institution_id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching template:', error);
      throw error;
    }

    // Return default template if none exists
    if (!data) {
      return res.json({
        college_name: '',
        show_college_name: true,
        college_name_position: 'top-center',
        logo_url: null,
        logo_position: 'top-center',
        logo_size: 'medium',
        font_size: 12,
        header_color: '#FF6B35',
        show_logo: true,
      });
    }

    res.json(data);
  } catch (err) {
    console.error('Error in GET /report-templates:', err);
    res.status(500).json({ error: 'Could not fetch template' });
  }
});

// ── Save/Update report template (admin only) ──────────
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    // Check if user has institution_id
    if (!req.user.institution_id) {
      console.error('User missing institution_id:', req.user);
      return res.status(400).json({ 
        error: 'Your account is not associated with an institution. Please contact support.' 
      });
    }

    const {
      college_name,
      show_college_name,
      college_name_position,
      subtitle,
      show_subtitle,
      logo_url,
      logo_position,
      logo_size,
      font_size,
      header_color,
      show_logo,
      header_text,
      show_header_text,
      footer_text,
      show_footer_text,
    } = req.body;

    console.log('Saving template for institution:', req.user.institution_id);

    // Check if template exists
    const { data: existing, error: selectError } = await supabase
      .from('report_templates')
      .select('id')
      .eq('institution_id', req.user.institution_id)
      .maybeSingle();

    if (selectError) {
      console.error('Error checking existing template:', selectError);
      throw selectError;
    }

    const templateData = {
      institution_id: req.user.institution_id,
      college_name: college_name || '',
      show_college_name: show_college_name !== false,
      college_name_position: college_name_position || 'top-center',
      subtitle: subtitle || '',
      show_subtitle: show_subtitle === true,
      logo_url: logo_url || null,
      logo_position: logo_position || 'top-center',
      logo_size: logo_size || 'medium',
      font_size: parseInt(font_size) || 12,
      header_color: header_color || '#FF6B35',
      show_logo: show_logo !== false,
      header_text: header_text || '',
      show_header_text: show_header_text === true,
      footer_text: footer_text || '',
      show_footer_text: show_footer_text === true,
    };

    let data, error;

    if (existing) {
      console.log('Updating existing template:', existing.id);
      ({ data, error } = await supabase
        .from('report_templates')
        .update(templateData)
        .eq('id', existing.id)
        .select()
        .single());
    } else {
      console.log('Creating new template for institution:', req.user.institution_id);
      ({ data, error } = await supabase
        .from('report_templates')
        .insert(templateData)
        .select()
        .single());
    }

    if (error) {
      console.error('Error saving template:', error);
      throw error;
    }
    
    console.log('Template saved successfully:', data.id);
    res.json(data);
  } catch (err) {
    console.error('Failed to save template:', err);
    
    // Provide more specific error messages
    if (err.code === '42P01') {
      return res.status(500).json({ 
        error: 'Database table not found. Please run the migration to create report_templates table.' 
      });
    }
    
    if (err.code === '23503') {
      return res.status(400).json({ 
        error: 'Invalid institution_id. Please ensure your user account is properly configured.' 
      });
    }

    if (err.code === '22P02') {
      return res.status(400).json({ 
        error: 'Invalid data format. Please check your institution configuration.' 
      });
    }
    
    res.status(500).json({ 
      error: err.message || 'Could not save template',
      details: process.env.NODE_ENV === 'development' ? err : undefined
    });
  }
});

// ── Upload logo (admin only) ──────────────────────────
router.post('/upload-logo', upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { originalname, mimetype, buffer } = req.file;
    const storagePath = buildStoragePath(
      `logos/${req.user.institution_id}`,
      originalname
    );

    const signedUrl = await uploadAndSign(storagePath, buffer, mimetype);
    res.json({ url: signedUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ── Get template for teachers (read-only) ─────────────
router.get('/public', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('report_templates')
      .select('*')
      .eq('institution_id', req.user.institution_id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Return default template if none exists
    if (!data) {
      return res.json({
        college_name: '',
        show_college_name: false,
        logo_url: null,
        show_logo: false,
        font_size: 12,
        header_color: '#FF6B35',
      });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch template' });
  }
});

module.exports = router;
