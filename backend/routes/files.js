const express = require('express');
const multer = require('multer');
const supabase = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Store file in memory as a buffer (not on disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// ── Upload a file to a group ───────────────────────────
router.post('/:groupId', upload.single('file'), async (req, res) => {
  const { groupId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    // Verify membership
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', req.user.id)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Only teachers can upload files
    if (membership.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can upload files' });
    }

    const { originalname, mimetype, buffer, size } = req.file;

    // Build a unique storage path: groupId/timestamp-filename
    const timestamp = Date.now();
    const safeName = originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const storagePath = `${groupId}/${timestamp}-${safeName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('acadex-files')
      .upload(storagePath, buffer, {
        contentType: mimetype,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get a signed URL valid for 1 year (files are semi-permanent)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('acadex-files')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

    if (signedError) throw signedError;

    // Save file record to DB
    const { data: file, error: dbError } = await supabase
      .from('files')
      .insert({
        group_id: groupId,
        uploaded_by: req.user.id,
        filename: originalname,
        file_url: signedData.signedUrl,
        file_type: mimetype,
        size_bytes: size,
        storage_path: storagePath
      })
      .select(`
        id, filename, file_url, file_type, size_bytes, created_at,
        users!uploaded_by (id, name)
      `)
      .single();

    if (dbError) throw dbError;

    res.status(201).json(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Could not upload file' });
  }
});

// ── List all files in a group ──────────────────────────
router.get('/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    // Verify membership
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', req.user.id)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const { data: files, error } = await supabase
      .from('files')
      .select(`
        id, filename, file_url, file_type, size_bytes, created_at,
        users!uploaded_by (id, name)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch files' });
  }
});

// ── Delete a file (teacher/uploader only) ─────────────
router.delete('/:groupId/:fileId', async (req, res) => {
  const { groupId, fileId } = req.params;

  try {
    // Get the file record
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('group_id', groupId)
      .single();

    if (fetchError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Only the uploader or a teacher can delete
    if (file.uploaded_by !== req.user.id && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Not authorised to delete this file' });
    }

    // Delete from Supabase Storage
    await supabase.storage
      .from('acadex-files')
      .remove([file.storage_path]);

    // Delete from DB
    await supabase.from('files').delete().eq('id', fileId);

    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete file' });
  }
});

// ── Multer error handler ───────────────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 20MB' });
    }
  }
  if (err.message === 'File type not allowed') {
    return res.status(400).json({ error: 'File type not allowed' });
  }
  next(err);
});

module.exports = router;