const express = require('express');
const supabase = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ── Get all announcements for a group ─────────────────
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
      .from('announcements')
      .select(`
        id, title, content, created_at,
        users!created_by (id, name)
      `)
      .eq('group_id', req.params.groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch announcements' });
  }
});

// ── Create an announcement (admin/teacher only) ────────
router.post('/:groupId', async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
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
      return res.status(403).json({ error: 'Only teachers can make announcements' });
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        group_id: req.params.groupId,
        created_by: req.user.id,
        title,
        content
      })
      .select(`
        id, title, content, created_at,
        users!created_by (id, name)
      `)
      .single();

    if (error) throw error;

    // Broadcast to group via socket
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.groupId).emit('new_announcement', data);
    }

    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create announcement' });
  }
});

// ── Update an announcement (admin/creator only) ──────
router.put('/:groupId/:id', async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const { data: announcement } = await supabase
      .from('announcements')
      .select('created_by')
      .eq('id', req.params.id)
      .single();

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', req.params.groupId)
      .eq('user_id', req.user.id)
      .single();

    const isAdmin   = membership?.role === 'admin';
    const isCreator = announcement.created_by === req.user.id;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ error: 'Not authorised to edit this announcement' });
    }

    const { data, error } = await supabase
      .from('announcements')
      .update({ title, content })
      .eq('id', req.params.id)
      .select(`
        id, title, content, created_at,
        users!created_by (id, name)
      `)
      .single();

    if (error) throw error;

    // Broadcast update to group via socket
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.groupId).emit('update_announcement', data);
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update announcement' });
  }
});

// ── Delete an announcement (admin/creator only) ────────
router.delete('/:groupId/:id', async (req, res) => {
  try {
    const { data: announcement } = await supabase
      .from('announcements')
      .select('created_by')
      .eq('id', req.params.id)
      .single();

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', req.params.groupId)
      .eq('user_id', req.user.id)
      .single();

    const isAdmin   = membership?.role === 'admin';
    const isCreator = announcement.created_by === req.user.id;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ error: 'Not authorised to delete this announcement' });
    }

    await supabase.from('announcements').delete().eq('id', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete announcement' });
  }
});

module.exports = router;