const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const supabase = require('../config/db');
const { sendEmail } = require('../config/email');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

// Register
router.post('/register', validate(schemas.register), async (req, res) => {
  const { name, email, phone, password, role, roll_no, department, year, institutionId, devBypass } = req.body;
  // Validation already handled by middleware — no manual checks needed here

  try {
    // Fetch institution to check allowed domain
    const { data: institution, error: instError } = await supabase
      .from('institutions')
      .select('id, name, allowed_email_domain')
      .eq('id', institutionId)
      .single();

    if (instError || !institution) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    // Domain validation (skip if devBypass is set and we're not in production)
    const bypassAllowed = process.env.NODE_ENV !== 'production' && devBypass === true;
    if (institution.allowed_email_domain && !bypassAllowed) {
      const domain = institution.allowed_email_domain.startsWith('@')
        ? institution.allowed_email_domain
        : `@${institution.allowed_email_domain}`;
      if (!email.toLowerCase().endsWith(domain.toLowerCase())) {
        return res.status(403).json({
          error: `Only emails ending with ${domain} are allowed for this institution`
        });
      }
    }

    const query = supabase.from('users').select('id').eq('email', email);
    const { data: existing } = await query.single();
    if (existing) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Resolve department name → department_id FK
    let department_id = null;
    if (department) {
      const { data: deptRow } = await supabase
        .from('departments')
        .select('id')
        .eq('institution_id', institutionId)
        .eq('name', department)
        .single();
      department_id = deptRow?.id || null;
    }

    // Generate verification token
    const verification_token = crypto.randomBytes(32).toString('hex');
    const verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name, email, phone, password_hash, role,
        institution_id: institutionId,
        email_verified: false,
        verification_token,
        verification_token_expires,
        department_id,
        ...(role === 'student' ? { roll_no, department, year: Number(year) } : { department })
      })
      .select('id, name, email, phone, role, roll_no, department, year, institution_id, email_verified, created_at')
      .single();

    if (error) throw error;

    // Send verification email
    await sendEmail('emailVerification', {
      name,
      email,
      institutionName: institution.name,
      token: verification_token
    });

    res.status(201).json({
      requiresVerification: true,
      message: 'Account created. Please check your email to verify your account.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Verify email
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) return res.status(400).json({ error: 'Token is required' });

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, institution_id, verification_token_expires, email_verified')
      .eq('verification_token', token)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: 'Invalid or expired verification link' });
    }

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    if (new Date(user.verification_token_expires) < new Date()) {
      return res.status(400).json({ error: 'Verification link has expired. Please register again.' });
    }

    await supabase
      .from('users')
      .update({ email_verified: true, verification_token: null, verification_token_expires: null })
      .eq('id', user.id);

    const jwtToken = jwt.sign(
      { id: user.id, role: user.role, institutionId: user.institution_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token: jwtToken, user: { ...user, email_verified: true } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Super admin login (no institution required)
router.post('/superadmin-login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'admin')
      .is('institution_id', null)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, institutionId: null },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, verification_token, verification_token_expires, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Login
router.post('/login', validate(schemas.login), async (req, res) => {
  const { email, phone, password, institutionId } = req.body;

  try {
    let query = supabase.from('users').select('*').eq('institution_id', institutionId);
    if (email) query = query.eq('email', email);
    else query = query.eq('phone', phone);

    const { data: user, error } = await query.single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Block unverified users (admins are pre-verified)
    if (user.role !== 'admin' && !user.email_verified) {
      return res.status(403).json({
        error: 'Please verify your email before signing in.',
        requiresVerification: true
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, institutionId: user.institution_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, verification_token, verification_token_expires, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
