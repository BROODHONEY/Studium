const express = require('express');
const supabase = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const VALID_TAGS = ['general', 'urgent', 'exam', 'assignment', 'event'];
const SELECT_FIELDS = `id, title, content, tag, scheduled_at, published, created_at, users!created_by (id, name)`;
const SELECT_FALLBACK = `id, title, content, created_at, users!created_by (id, name)`;

const normalize = (a) => ({
  ...a,
  tag: a.tag || 'general',
  published: a.published ?? true,
  scheduled_at: a.scheduled_at || null,
});

// ── Get published announcements ────────────────────────
router.get('/:groupId', async (req, res) => {
  try {
    const { data: membership } = await supabase
      .from('group_members').select('role')
      .eq('group_id', req.params.groupId).eq('user_id', req.user.id).single();

    if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

    const { data, error } = await supabase
      .from('announcements').select(SELECT_FIELDS)
      .eq('group_id', req.params.groupId)
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) {
      const { data: fb, error: fbErr } = await supabase
        .from('announcements').select(SELECT_FALLBACK)
        .eq('group_id', req.params.groupId)
        .order('created_at', { ascending: false });
      if (fbErr) throw fbErr;
      return res.json((fb || []).map(normalize));
    }
    res.json((data || []).map(normalize));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch announcements' });
  }
});

// ── Get scheduled (unpublished) announcements — teachers only ──
router.get('/:groupId/scheduled', async (req, res) => {
  try {
    const { data: membership } = await supabase
      .from('group_members').select('role')
      .eq('group_id', req.params.groupId).eq('user_id', req.user.id).single();

    if (!membership) return res.status(403).json({ error: 'Not a member' });
    if (membership.role === 'student') return res.json([]); // students see nothing

    const { data, error } = await supabase
      .from('announcements').select(SELECT_FIELDS)
      .eq('group_id', req.params.groupId)
      .eq('published', false)
      .order('scheduled_at', { ascending: true });

    if (error) return res.json([]);
    res.json((data || []).map(normalize));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch scheduled announcements' });
  }
});

// ── Create an announcement ─────────────────────────────
router.post('/:groupId', async (req, res) => {
  const { title, content, tag, scheduled_at } = req.body;

  if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

  try {
    const { data: membership } = await supabase
      .from('group_members').select('role')
      .eq('group_id', req.params.groupId).eq('user_id', req.user.id).single();

    if (!membership) return res.status(403).json({ error: 'Not a member of this group' });
    if (membership.role === 'student') return res.status(403).json({ error: 'Only teachers can make announcements' });

    const isScheduled = !!scheduled_at && new Date(scheduled_at) > new Date();
    const payload = {
      group_id: req.params.groupId,
      created_by: req.user.id,
      title, content,
      tag: VALID_TAGS.includes(tag) ? tag : 'general',
      scheduled_at: isScheduled ? new Date(scheduled_at).toISOString() : null,
      published: !isScheduled,
    };

    const { data, error } = await supabase
      .from('announcements').insert(payload)
      .select(SELECT_FIELDS).single();

    if (error) {
      // Fallback: columns may not exist yet
      const { data: fb, error: fbErr } = await supabase
        .from('announcements')
        .insert({ group_id: req.params.groupId, created_by: req.user.id, title, content })
        .select(SELECT_FALLBACK).single();
      if (fbErr) throw fbErr;
      const result = normalize(fb);
      const io = req.app.get('io');
      if (io) io.to(req.params.groupId).emit('new_announcement', result);
      return res.status(201).json(result);
    }

    const result = normalize(data);

    // Only broadcast immediately if published now
    if (result.published) {
      const io = req.app.get('io');
      if (io) io.to(req.params.groupId).emit('new_announcement', result);
    }

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create announcement' });
  }
});

// ── Update an announcement ─────────────────────────────
router.put('/:groupId/:id', async (req, res) => {
  const { title, content, tag, scheduled_at } = req.body;

  if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

  try {
    const { data: announcement } = await supabase
      .from('announcements').select('created_by, published')
      .eq('id', req.params.id).single();

    if (!announcement) return res.status(404).json({ error: 'Announcement not found' });

    const { data: membership } = await supabase
      .from('group_members').select('role')
      .eq('group_id', req.params.groupId).eq('user_id', req.user.id).single();

    if (!membership?.role === 'admin' && announcement.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorised' });
    }

    const isScheduled = !!scheduled_at && new Date(scheduled_at) > new Date();
    const updates = {
      title, content,
      tag: VALID_TAGS.includes(tag) ? tag : 'general',
      scheduled_at: isScheduled ? new Date(scheduled_at).toISOString() : null,
      published: !isScheduled,
    };

    const { data, error } = await supabase
      .from('announcements').update(updates).eq('id', req.params.id)
      .select(SELECT_FIELDS).single();

    if (error) {
      const { data: fb, error: fbErr } = await supabase
        .from('announcements').update({ title, content }).eq('id', req.params.id)
        .select(SELECT_FALLBACK).single();
      if (fbErr) throw fbErr;
      const result = normalize(fb);
      const io = req.app.get('io');
      if (io) io.to(req.params.groupId).emit('update_announcement', result);
      return res.json(result);
    }

    const result = normalize(data);
    const io = req.app.get('io');
    if (io) io.to(req.params.groupId).emit('update_announcement', result);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update announcement' });
  }
});

// ── Delete an announcement ─────────────────────────────
router.delete('/:groupId/:id', async (req, res) => {
  try {
    const { data: announcement } = await supabase
      .from('announcements').select('created_by')
      .eq('id', req.params.id).single();

    if (!announcement) return res.status(404).json({ error: 'Announcement not found' });

    const { data: membership } = await supabase
      .from('group_members').select('role')
      .eq('group_id', req.params.groupId).eq('user_id', req.user.id).single();

    const isAdmin   = membership?.role === 'admin';
    const isCreator = announcement.created_by === req.user.id;

    if (!isAdmin && !isCreator) return res.status(403).json({ error: 'Not authorised' });

    await supabase.from('announcements').delete().eq('id', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete announcement' });
  }
});

module.exports = router;
