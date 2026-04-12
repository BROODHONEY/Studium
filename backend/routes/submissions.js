const express = require('express');
const supabase = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Helper: verify membership and return role
async function getMembership(groupId, userId) {
  const { data } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();
  return data;
}

// ── List assignments for a group ──────────────────────
router.get('/:groupId', async (req, res) => {
  try {
    const membership = await getMembership(req.params.groupId, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });

    const { data, error } = await supabase
      .from('assignments')
      .select('*, users!created_by(id, name)')
      .eq('group_id', req.params.groupId)
      .order('due_date', { ascending: true });

    if (error) throw error;

    // For students: attach their own submission count
    if (membership.role === 'student') {
      const ids = data.map(a => a.id);
      const { data: subs } = await supabase
        .from('assignment_submissions')
        .select('assignment_id, attempt')
        .eq('user_id', req.user.id)
        .in('assignment_id', ids);

      const subMap = {};
      (subs || []).forEach(s => {
        subMap[s.assignment_id] = (subMap[s.assignment_id] || 0) + 1;
      });
      return res.json(data.map(a => ({ ...a, my_submissions: subMap[a.id] || 0 })));
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch assignments' });
  }
});

// ── Create assignment (teacher/admin only) ────────────
router.post('/:groupId', async (req, res) => {
  try {
    const membership = await getMembership(req.params.groupId, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    if (membership.role === 'student') return res.status(403).json({ error: 'Only teachers can create assignments' });

    const { title, description, due_date } = req.body;
    if (!title || !due_date) return res.status(400).json({ error: 'title and due_date are required' });

    const { data, error } = await supabase
      .from('assignments')
      .insert({ group_id: req.params.groupId, title, description, due_date, created_by: req.user.id })
      .select('*, users!created_by(id, name)')
      .single();

    if (error) throw error;

    // Auto-create a due entry so it appears on the Due Dates page
    const { data: due } = await supabase
      .from('dues')
      .insert({
        group_id: req.params.groupId,
        created_by: req.user.id,
        title,
        description,
        due_date,
        category: 'assignment',
        ref_id: data.id,
        ref_type: 'assignment',
      })
      .select('id')
      .single();

    const io = req.app.get('io');
    if (io && due) io.to(req.params.groupId).emit('new_due', { ...due, group_id: req.params.groupId });

    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create assignment' });
  }
});

// ── Update assignment (teacher/admin only) ────────────
router.put('/:groupId/:assignmentId', async (req, res) => {
  try {
    const membership = await getMembership(req.params.groupId, req.user.id);
    if (!membership || membership.role === 'student') return res.status(403).json({ error: 'Forbidden' });

    const { title, description, due_date } = req.body;
    if (!title || !due_date) return res.status(400).json({ error: 'title and due_date are required' });

    const { data, error } = await supabase
      .from('assignments')
      .update({ title, description, due_date })
      .eq('id', req.params.assignmentId)
      .eq('group_id', req.params.groupId)
      .select('*, users!created_by(id, name)')
      .single();

    if (error) throw error;

    // Sync the linked due entry
    await supabase.from('dues')
      .update({ title, description, due_date })
      .eq('ref_id', req.params.assignmentId)
      .eq('ref_type', 'assignment');

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update assignment' });
  }
});

// ── Delete assignment (teacher/admin only) ────────────
router.delete('/:groupId/:assignmentId', async (req, res) => {
  try {
    const membership = await getMembership(req.params.groupId, req.user.id);
    if (!membership || membership.role === 'student') return res.status(403).json({ error: 'Forbidden' });

    // Remove linked due entry
    await supabase.from('dues')
      .delete()
      .eq('ref_id', req.params.assignmentId)
      .eq('ref_type', 'assignment')
      .eq('group_id', req.params.groupId);

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', req.params.assignmentId)
      .eq('group_id', req.params.groupId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete assignment' });
  }
});

// ── Submit (student, max 2 attempts) ─────────────────
router.post('/:groupId/:assignmentId/submit', async (req, res) => {
  try {
    const membership = await getMembership(req.params.groupId, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member' });
    if (membership.role !== 'student') return res.status(403).json({ error: 'Only students can submit' });

    // Count existing submissions
    const { data: existing } = await supabase
      .from('assignment_submissions')
      .select('id, attempt')
      .eq('assignment_id', req.params.assignmentId)
      .eq('user_id', req.user.id)
      .order('attempt', { ascending: false });

    if (existing && existing.length >= 2) {
      return res.status(400).json({ error: 'Maximum 2 submissions allowed' });
    }

    const attempt = (existing?.length || 0) + 1;
    const { note } = req.body;

    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert({ assignment_id: req.params.assignmentId, user_id: req.user.id, attempt, note })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not submit' });
  }
});

// ── Get submission report (teacher/admin only) ────────
router.get('/:groupId/:assignmentId/report', async (req, res) => {
  try {
    const membership = await getMembership(req.params.groupId, req.user.id);
    if (!membership || membership.role === 'student') return res.status(403).json({ error: 'Forbidden' });

    // Get all students in the group
    const { data: members } = await supabase
      .from('group_members')
      .select('users(id, name, roll_no, email)')
      .eq('group_id', req.params.groupId)
      .eq('role', 'student');

    // Get all submissions for this assignment
    const { data: subs } = await supabase
      .from('assignment_submissions')
      .select('user_id, attempt, submitted_at, note')
      .eq('assignment_id', req.params.assignmentId)
      .order('attempt', { ascending: true });

    const subMap = {};
    (subs || []).forEach(s => {
      if (!subMap[s.user_id]) subMap[s.user_id] = [];
      subMap[s.user_id].push(s);
    });

    const report = (members || []).map(m => {
      const u = m.users;
      const userSubs = subMap[u.id] || [];
      return {
        id: u.id,
        name: u.name,
        roll_no: u.roll_no || '—',
        email: u.email,
        submitted: userSubs.length > 0,
        attempts: userSubs.length,
        last_submitted_at: userSubs[userSubs.length - 1]?.submitted_at || null,
        note: userSubs[userSubs.length - 1]?.note || '',
      };
    });

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch report' });
  }
});

module.exports = router;
