const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/db');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { name, email, phone, password, role, roll_no, department } = req.body;

  if (!name || !password || (!email && !phone)) {
    return res.status(400).json({ error: 'Name, password, and email or phone are required' });
  }

  if (!['teacher', 'student'].includes(role)) {
    return res.status(400).json({ error: 'Role must be teacher or student' });
  }

  // Students must provide roll number and department
  if (role === 'student') {
    if (!roll_no || !roll_no.trim()) {
      return res.status(400).json({ error: 'Roll number is required for students' });
    }
    if (!department || !department.trim()) {
      return res.status(400).json({ error: 'Department is required for students' });
    }
  }

  try {
    const query = email
      ? supabase.from('users').select('id').eq('email', email)
      : supabase.from('users').select('id').eq('phone', phone);

    const { data: existing } = await query.single();
    if (existing) {
      return res.status(409).json({ error: 'User already exists with this email or phone' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name, email, phone, password_hash, role,
        ...(role === 'student' ? { roll_no, department } : {})
      })
      .select('id, name, email, phone, role, roll_no, department, created_at')
      .single();

    if (error) throw error;

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// ── Login ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, phone, password } = req.body;

  if (!password || (!email && !phone)) {
    return res.status(400).json({ error: 'Password and email or phone are required' });
  }

  try {
    // Find user by email or phone
    const { data: user, error } = email
      ? await supabase.from('users').select('*').eq('email', email).single()
      : await supabase.from('users').select('*').eq('phone', phone).single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Sign a JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Don't send the password hash back
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;