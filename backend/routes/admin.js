const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth');

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(requireAdmin);

// ============================================
// DEPARTMENTS
// ============================================

// Get all departments for the institution
router.get('/departments', async (req, res) => {
  try {
    const { data: departments, error } = await db
      .from('departments')
      .select('*')
      .eq('institution_id', req.user.institution_id)
      .order('name');

    if (error) throw error;

    res.json(departments || []);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create department
router.post('/departments', async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const { data: department, error } = await db
      .from('departments')
      .insert({
        name,
        code: code || null,
        description: description || null,
        institution_id: req.user.institution_id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update department
router.put('/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    const { data: department, error } = await db
      .from('departments')
      .update({
        name,
        code: code || null,
        description: description || null
      })
      .eq('id', id)
      .eq('institution_id', req.user.institution_id)
      .select()
      .single();

    if (error) throw error;

    res.json(department);
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete department
router.delete('/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await db
      .from('departments')
      .delete()
      .eq('id', id)
      .eq('institution_id', req.user.institution_id);

    if (error) throw error;

    res.json({ success: true, message: 'Department deleted' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// USERS
// ============================================

// Get all users for the institution
router.get('/users', async (req, res) => {
  try {
    const { data: users, error } = await db
      .from('users')
      .select(`
        id, 
        name, 
        email, 
        role, 
        department_id, 
        faculty_role, 
        roll_no, 
        year, 
        created_at,
        departments:department_id (name)
      `)
      .eq('institution_id', req.user.institution_id)
      .order('name');

    if (error) throw error;

    // Format the response to include department name
    const formattedUsers = (users || []).map(user => ({
      ...user,
      department: user.departments?.name || null
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create user
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role, department_id, faculty_role, roll_no, year } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ error: 'Role must be student or teacher' });
    }

    // Check if email already exists
    const { data: existing, error: checkError } = await db
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error } = await db
      .from('users')
      .insert({
        name,
        email,
        password_hash,
        role,
        department_id: department_id || null,
        faculty_role: role === 'teacher' ? (faculty_role || null) : null,
        roll_no: role === 'student' ? (roll_no || null) : null,
        year: role === 'student' ? (year ? parseInt(year) : null) : null,
        institution_id: req.user.institution_id
      })
      .select('id, name, email, role, department_id, faculty_role, roll_no, year')
      .single();

    if (error) throw error;

    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, department_id, faculty_role, roll_no, year } = req.body;

    const updateData = {
      name,
      email,
      role,
      department_id: department_id || null,
      faculty_role: role === 'teacher' ? (faculty_role || null) : null,
      roll_no: role === 'student' ? (roll_no || null) : null,
      year: role === 'student' ? (year ? parseInt(year) : null) : null
    };

    // If password is provided, hash it
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    const { data: user, error } = await db
      .from('users')
      .update(updateData)
      .eq('id', id)
      .eq('institution_id', req.user.institution_id)
      .select('id, name, email, role, department_id, faculty_role, roll_no, year')
      .single();

    if (error) throw error;

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting self
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const { error } = await db
      .from('users')
      .delete()
      .eq('id', id)
      .eq('institution_id', req.user.institution_id);

    if (error) throw error;

    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
