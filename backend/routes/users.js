const express = require('express');
const bcrypt  = require('bcryptjs');
const supabase = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:id — view any user's profile
router.get('/:id', auth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, roll_no, department, year, created_at')
      .eq('id', req.params.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// PATCH /api/users/me — update own profile
router.patch('/me', auth, async (req, res) => {
  const { name, department, year } = req.body;
  const updates = {};

  if (name !== undefined)       updates.name       = name.trim();
  if (department !== undefined) updates.department = department.trim();
  if (year !== undefined)       updates.year       = year;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, name, email, phone, role, roll_no, department, year, created_at')
      .single();

    if (error) throw error;
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// PATCH /api/users/me/password — change own password
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

module.exports = router;
