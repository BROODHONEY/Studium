const express = require('express');
const supabase = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ── Get all dues for a group ───────────────────────────
router.get('/:groupId', async (req, res) => {
  try {
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', req.params.groupId)
      .eq('user_id', req.user.id)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const { data, error } = await supabase
      .from('dues')
      .select(`
        id, group_id, title, description, due_date, created_at,
        users!created_by (id, name)
      `)
      .eq('group_id', req.params.groupId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch dues' });
  }
});

// ── Create a due (admin/teacher only) ─────────────────
router.post('/:groupId', async (req, res) => {
  const { title, description, due_date } = req.body;

  if (!title || !due_date) {
    return res.status(400).json({ error: 'Title and due date are required' });
  }

  try {
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', req.params.groupId)
      .eq('user_id', req.user.id)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    if (membership.role === 'student') {
      return res.status(403).json({ error: 'Only teachers can create dues' });
    }

    const { data, error } = await supabase
      .from('dues')
      .insert({
        group_id: req.params.groupId,
        created_by: req.user.id,
        title,
        description,
        due_date
      })
      .select(`
        id, group_id, title, description, due_date, created_at,
        users!created_by (id, name)
      `)
      .single();

    if (error) throw error;

    const io = req.app.get('io');
    if (io) {
      io.to(req.params.groupId).emit('new_due', { ...data, group_id: req.params.groupId });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create due' });
  }
});

// ── Update a due (admin/creator only) ─────────────────
router.put('/:groupId/:id', async (req, res) => {
  const { title, description, due_date } = req.body;

  if (!title || !due_date) {
    return res.status(400).json({ error: 'Title and due date are required' });
  }

  try {
    const { data: due } = await supabase
      .from('dues')
      .select('created_by')
      .eq('id', req.params.id)
      .single();

    if (!due) {
      return res.status(404).json({ error: 'Due not found' });
    }

    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', req.params.groupId)
      .eq('user_id', req.user.id)
      .single();

    const isAdmin   = membership?.role === 'admin';
    const isCreator = due.created_by === req.user.id;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ error: 'Not authorised to edit this due' });
    }

    const { data, error } = await supabase
      .from('dues')
      .update({ title, description, due_date })
      .eq('id', req.params.id)
      .select(`
        id, title, description, due_date, created_at,
        users!created_by (id, name)
      `)
      .single();

    if (error) throw error;

    // Broadcast update to group via socket
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.groupId).emit('update_due', data);
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update due' });
  }
});

// ── Delete a due (admin/creator only) ─────────────────
router.delete('/:groupId/:id', async (req, res) => {
  try {
    const { data: due } = await supabase
      .from('dues')
      .select('created_by')
      .eq('id', req.params.id)
      .single();

    if (!due) return res.status(404).json({ error: 'Due not found' });

    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', req.params.groupId)
      .eq('user_id', req.user.id)
      .single();

    const isAdmin   = membership?.role === 'admin';
    const isCreator = due.created_by === req.user.id;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ error: 'Not authorised' });
    }

    await supabase.from('dues').delete().eq('id', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete due' });
  }
});

module.exports = router;