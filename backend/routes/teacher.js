const express = require('express');
const supabase = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// Middleware: only teachers/admins can access
const teacherOnly = (req, res, next) => {
  if (req.user?.role !== 'teacher' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Teacher access required' });
  }
  next();
};

// GET /api/teacher/students — list all students with filters
router.get('/students', auth, teacherOnly, async (req, res) => {
  try {
    const { name, roll_no, department, year, cgpa_min, cgpa_max, achievement_min, cert_min } = req.query;

    let query = supabase
      .from('users')
      .select('id, name, email, roll_no, department, year, cgpa, achievements, internships, certificates, semester_marks, created_at')
      .eq('role', 'student')
      .eq('institution_id', req.user.institution_id); // CRITICAL: Filter by institution

    if (name)        query = query.ilike('name', `%${name}%`);
    if (roll_no)     query = query.ilike('roll_no', `%${roll_no}%`);
    if (department)  query = query.ilike('department', `%${department}%`);
    if (year)        query = query.eq('year', parseInt(year));
    if (cgpa_min)    query = query.gte('cgpa', parseFloat(cgpa_min));
    if (cgpa_max)    query = query.lte('cgpa', parseFloat(cgpa_max));

    const { data: students, error } = await query.order('name');
    if (error) throw error;

    // Filter by achievement/cert counts (computed fields)
    let result = students || [];
    if (achievement_min) {
      result = result.filter(s => (s.achievements?.length || 0) >= parseInt(achievement_min));
    }
    if (cert_min) {
      result = result.filter(s => (s.certificates?.length || 0) >= parseInt(cert_min));
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/teacher/students/:id — full student profile
router.get('/students/:id', auth, teacherOnly, async (req, res) => {
  try {
    const { data: student, error } = await supabase
      .from('users')
      .select('id, name, email, roll_no, department, year, cgpa, achievements, internships, certificates, semester_marks, created_at')
      .eq('id', req.params.id)
      .eq('role', 'student')
      .eq('institution_id', req.user.institution_id) // CRITICAL: Filter by institution
      .single();

    if (error || !student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// GET /api/teacher/selection-groups — list saved selection groups
router.get('/selection-groups', auth, teacherOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('teacher_selection_groups')
      .select('*')
      .eq('teacher_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch selection groups' });
  }
});

// POST /api/teacher/selection-groups — create a selection group
router.post('/selection-groups', auth, teacherOnly, async (req, res) => {
  const { name, student_ids } = req.body;
  if (!name || !Array.isArray(student_ids)) {
    return res.status(400).json({ error: 'name and student_ids required' });
  }
  try {
    const { data, error } = await supabase
      .from('teacher_selection_groups')
      .insert({ teacher_id: req.user.id, name, student_ids })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create selection group' });
  }
});

// PATCH /api/teacher/selection-groups/:id — update a selection group
router.patch('/selection-groups/:id', auth, teacherOnly, async (req, res) => {
  const { name, student_ids } = req.body;
  try {
    const { data, error } = await supabase
      .from('teacher_selection_groups')
      .update({ name, student_ids })
      .eq('id', req.params.id)
      .eq('teacher_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update selection group' });
  }
});

// DELETE /api/teacher/selection-groups/:id
router.delete('/selection-groups/:id', auth, teacherOnly, async (req, res) => {
  try {
    const { error } = await supabase
      .from('teacher_selection_groups')
      .delete()
      .eq('id', req.params.id)
      .eq('teacher_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete selection group' });
  }
});

module.exports = router;
