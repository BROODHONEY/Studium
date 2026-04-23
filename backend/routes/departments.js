const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticate = require('../middleware/auth');

// PUBLIC: Get departments by institution ID (used on signup page, no auth required)
router.get('/public', async (req, res) => {
  const { institutionId } = req.query;
  if (!institutionId) {
    return res.status(400).json({ error: 'institutionId is required' });
  }
  try {
    const { data: departments, error } = await db
      .from('departments')
      .select('id, name, code')
      .eq('institution_id', institutionId)
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(departments || []);
  } catch (error) {
    console.error('Error fetching public departments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all departments for institution (authenticated)
router.get('/', authenticate, async (req, res) => {
  try {
    const { data: departments, error } = await db
      .from('departments')
      .select(`
        *,
        head_teacher:users!head_teacher_id(name)
      `)
      .eq('institution_id', req.user.institutionId)
      .order('name', { ascending: true });

    if (error) throw error;
    
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single department
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data: department, error } = await db
      .from('departments')
      .select(`
        *,
        head_teacher:users!head_teacher_id(name)
      `)
      .eq('id', req.params.id)
      .eq('institution_id', req.user.institutionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Department not found' });
      }
      throw error;
    }
    
    res.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create department (admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { name, code, description, headTeacherId } = req.body;
    
    const { data, error } = await db
      .from('departments')
      .insert({
        institution_id: req.user.institutionId,
        name,
        code,
        description,
        head_teacher_id: headTeacherId || null
      })
      .select()
      .single();

    if (error) throw error;
    
    res.status(201).json({ departmentId: data.id, message: 'Department created' });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update department
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { name, code, description, headTeacherId } = req.body;
    
    const { data, error } = await db
      .from('departments')
      .update({
        name,
        code,
        description,
        head_teacher_id: headTeacherId || null
      })
      .eq('id', req.params.id)
      .eq('institution_id', req.user.institutionId)
      .select();

    if (error) throw error;
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json({ message: 'Department updated' });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
