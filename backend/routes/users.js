const express = require('express');
const bcrypt  = require('bcryptjs');
const multer  = require('multer');
const supabase = require('../config/db');
const auth = require('../middleware/auth');
const { uploadAndSign, buildStoragePath } = require('../services/storageService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_, file, cb) => {
    const allowed = ['application/pdf','image/jpeg','image/png','image/gif','image/webp'];
    cb(allowed.includes(file.mimetype) ? null : new Error('File type not allowed'), allowed.includes(file.mimetype));
  },
});

const router = express.Router();

// POST /api/users/me/attachments — must be before GET /:id to avoid "me" being treated as an id
router.post('/me/attachments', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  try {
    const { originalname, mimetype, buffer } = req.file;
    const storagePath = buildStoragePath(`profile-attachments/${req.user.id}`, originalname);
    const signedUrl = await uploadAndSign(storagePath, buffer, mimetype);
    res.json({ url: signedUrl, name: originalname, type: mimetype });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// PATCH /api/users/me — must be before GET /:id
router.patch('/me', auth, async (req, res) => {
  const { name, department, year, cgpa, achievements, internships, certificates, semester_marks } = req.body;
  const updates = {};

  if (name !== undefined)            updates.name            = name.trim();
  if (department !== undefined)      updates.department      = department.trim();
  if (year !== undefined)            updates.year            = year;
  if (cgpa !== undefined)            updates.cgpa            = cgpa === '' ? null : Number(cgpa);
  if (achievements !== undefined)    updates.achievements    = achievements;
  if (internships !== undefined)     updates.internships     = internships;
  if (certificates !== undefined)    updates.certificates    = certificates;
  if (semester_marks !== undefined)  updates.semester_marks  = semester_marks;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, name, email, phone, role, roll_no, department, year, cgpa, achievements, internships, certificates, semester_marks, created_at')
      .single();

    if (error) {
      // If semester_marks column doesn't exist yet, retry without it
      if (error.message?.includes('semester_marks') && updates.semester_marks !== undefined) {
        const { semester_marks: _sm, ...safeUpdates } = updates;
        const { data: user2, error: err2 } = await supabase
          .from('users')
          .update(safeUpdates)
          .eq('id', req.user.id)
          .select('id, name, email, phone, role, roll_no, department, year, cgpa, achievements, internships, certificates, created_at')
          .single();
        if (err2) throw err2;
        return res.json(user2);
      }
      throw error;
    }
    res.json(user);
  } catch (err) {
    console.error('PATCH /me error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// PATCH /api/users/me/password — must be before GET /:id
router.patch('/me/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both current and new password are required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  try {
    const { data: user, error } = await supabase.from('users').select('password_hash').eq('id', req.user.id).single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const password_hash = await bcrypt.hash(newPassword, 10);
    const { error: updateErr } = await supabase.from('users').update({ password_hash }).eq('id', req.user.id);
    if (updateErr) throw updateErr;
    res.json({ message: 'Password updated' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Something went wrong' }); }
});

// GET /api/users/public/:id — no auth required, for shared profile links
router.get('/public/:id', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, role, roll_no, department, year, cgpa, achievements, internships, certificates')
      .eq('id', req.params.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/users/:id — must be LAST so /me routes aren't swallowed
router.get('/:id', auth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, roll_no, department, year, cgpa, achievements, internships, certificates, created_at')
      .eq('id', req.params.id)
      .eq('institution_id', req.user.institutionId) // CRITICAL: Only access users from same institution
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
