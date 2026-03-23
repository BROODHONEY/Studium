const express = require('express');
const supabase = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ── Get message history for a group ───────────────────
router.get('/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const limit = parseInt(req.query.limit) || 50;
  const before = req.query.before; // cursor for pagination

  try {
    // Verify the requester is a member of this group
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', req.user.id)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    let query = supabase
        .from('messages')
        .select(`
            id, content, type, created_at,
            users!sender_id (id, name, role, roll_no, avatar_url),
            files!file_id (id, filename, file_url, file_type, size_bytes)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(limit);

    // If a cursor is provided, only fetch messages before that timestamp
    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Reverse so oldest is first (chat order)
    res.json(data.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch messages' });
  }
});

// ── Delete a message ──────────────────────────────────
router.delete('/:messageId', async (req, res) => {
  const { messageId } = req.params;

  try {
    // Fetch the message to check ownership and get group_id
    const { data: message, error: fetchErr } = await supabase
      .from('messages')
      .select('id, sender_id, group_id')
      .eq('id', messageId)
      .single();

    if (fetchErr || !message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check requester is a member of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', message.group_id)
      .eq('user_id', req.user.id)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Only the sender or an admin can delete
    const isOwner = message.sender_id === req.user.id;
    const isAdmin = membership.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await supabase.from('messages').delete().eq('id', messageId);

    // Notify everyone in the room
    const io = req.app.get('io');
    if (io) {
      io.to(message.group_id).emit('message_deleted', { messageId, groupId: message.group_id });
    }

    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete message' });
  }
});

module.exports = router;