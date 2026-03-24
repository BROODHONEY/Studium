const express = require('express');
const supabase = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ── Search users by email ──────────────────────────────
router.get('/search', async (req, res) => {
  const { email } = req.query;
  if (!email || email.trim().length < 2) {
    return res.status(400).json({ error: 'Enter at least 2 characters' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, department')
      .ilike('email', `%${email.trim()}%`)
      .neq('id', req.user.id)
      .limit(8);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ── Get or create a conversation ───────────────────────
router.post('/conversations', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Cannot DM yourself' });
  }

  try {
    // Ensure consistent ordering so we never create duplicates
    const [user1_id, user2_id] = [req.user.id, userId].sort();

    // Check if conversation already exists
    let { data: convo } = await supabase
      .from('conversations')
      .select(`
        id, created_at,
        user1:user1_id (id, name, email, role),
        user2:user2_id (id, name, email, role)
      `)
      .eq('user1_id', user1_id)
      .eq('user2_id', user2_id)
      .single();

    // Create if it doesn't exist
    if (!convo) {
      const { data: newConvo, error } = await supabase
        .from('conversations')
        .insert({ user1_id, user2_id })
        .select(`
          id, created_at,
          user1:user1_id (id, name, email, role),
          user2:user2_id (id, name, email, role)
        `)
        .single();

      if (error) throw error;
      convo = newConvo;
    }

    res.json(convo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not start conversation' });
  }
});

// ── List all conversations for current user ────────────
router.get('/conversations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id, created_at,
        user1:user1_id (id, name, email, role),
        user2:user2_id (id, name, email, role)
      `)
      .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Attach the "other" user and unread count to each conversation
    const enriched = await Promise.all(data.map(async (convo) => {
      const other = convo.user1.id === req.user.id ? convo.user2 : convo.user1;

      // Get last message
      const { data: lastMsgs } = await supabase
        .from('direct_messages')
        .select('content, created_at, sender_id, read')
        .eq('conversation_id', convo.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Get unread count
      const { count } = await supabase
        .from('direct_messages')
        .select('id', { count: 'exact' })
        .eq('conversation_id', convo.id)
        .eq('read', false)
        .neq('sender_id', req.user.id);

      return {
        ...convo,
        other,
        last_message: lastMsgs?.[0] || null,
        unread_count: count || 0
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch conversations' });
  }
});

// ── Get messages in a conversation ────────────────────
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    // Verify this user is part of the conversation
    const { data: convo } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', req.params.id)
      .single();

    if (!convo || (convo.user1_id !== req.user.id && convo.user2_id !== req.user.id)) {
      return res.status(403).json({ error: 'Not your conversation' });
    }

    let data, error;

    // Try with reactions + edited + reply_to
    ({ data, error } = await supabase
      .from('direct_messages')
      .select(`
        id, content, read, created_at, edited, reply_to,
        sender:sender_id (id, name, avatar_url),
        dm_reactions (emoji, user_id),
        replied_message:reply_to (id, content, sender:sender_id (id, name))
      `)
      .eq('conversation_id', req.params.id)
      .order('created_at', { ascending: true }));

    // Fallback: without reply columns
    if (error) {
      ({ data, error } = await supabase
        .from('direct_messages')
        .select(`
          id, content, read, created_at, edited,
          sender:sender_id (id, name, avatar_url),
          dm_reactions (emoji, user_id)
        `)
        .eq('conversation_id', req.params.id)
        .order('created_at', { ascending: true }));
    }

    // Fallback: without reactions/edited
    if (error) {
      ({ data, error } = await supabase
        .from('direct_messages')
        .select(`
          id, content, read, created_at,
          sender:sender_id (id, name, avatar_url)
        `)
        .eq('conversation_id', req.params.id)
        .order('created_at', { ascending: true }));
    }

    if (error) throw error;

    // Mark messages as read
    await supabase
      .from('direct_messages')
      .update({ read: true })
      .eq('conversation_id', req.params.id)
      .neq('sender_id', req.user.id)
      .eq('read', false);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch messages' });
  }
});

// ── Edit a DM (sender only) ───────────────────────────
router.patch('/messages/:id/edit', async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

  try {
    const { data: msg } = await supabase
      .from('direct_messages')
      .select('id, sender_id, conversation_id')
      .eq('id', req.params.id)
      .single();

    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.sender_id !== req.user.id) return res.status(403).json({ error: 'You can only edit your own messages' });

    // Try with edited flag, fall back if column doesn't exist yet
    let data, error;
    ({ data, error } = await supabase
      .from('direct_messages')
      .update({ content: content.trim(), edited: true })
      .eq('id', req.params.id)
      .select('id, content, edited')
      .single());

    if (error) {
      ({ data, error } = await supabase
        .from('direct_messages')
        .update({ content: content.trim() })
        .eq('id', req.params.id)
        .select('id, content')
        .single());
    }

    if (error) throw error;

    // Notify both participants
    const { data: convo } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', msg.conversation_id)
      .single();

    const io = req.app.get('io');
    if (io && convo) {
      const otherId = convo.user1_id === req.user.id ? convo.user2_id : convo.user1_id;
      io.to(`user:${req.user.id}`).to(`user:${otherId}`)
        .emit('dm_message_edited', { conversationId: msg.conversation_id, messageId: req.params.id, content: data.content });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not edit message' });
  }
});

// ── Toggle a DM reaction ──────────────────────────────
router.post('/messages/:id/reactions', async (req, res) => {
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: 'Emoji is required' });

  try {
    const { data: msg } = await supabase
      .from('direct_messages')
      .select('id, conversation_id')
      .eq('id', req.params.id)
      .single();

    if (!msg) return res.status(404).json({ error: 'Message not found' });

    // Verify user is part of this conversation
    const { data: convo } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', msg.conversation_id)
      .single();

    if (!convo || (convo.user1_id !== req.user.id && convo.user2_id !== req.user.id)) {
      return res.status(403).json({ error: 'Not your conversation' });
    }

    const { data: existing } = await supabase
      .from('dm_reactions')
      .select('id')
      .eq('message_id', req.params.id)
      .eq('user_id', req.user.id)
      .eq('emoji', emoji)
      .single();

    if (existing) {
      await supabase.from('dm_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('dm_reactions').insert({ message_id: req.params.id, user_id: req.user.id, emoji });
    }

    const { data: reactions } = await supabase
      .from('dm_reactions')
      .select('emoji, user_id')
      .eq('message_id', req.params.id);

    const io = req.app.get('io');
    if (io) {
      const otherId = convo.user1_id === req.user.id ? convo.user2_id : convo.user1_id;
      io.to(`user:${req.user.id}`).to(`user:${otherId}`)
        .emit('dm_message_reaction', { conversationId: msg.conversation_id, messageId: req.params.id, reactions: reactions || [] });
    }

    res.json({ reactions: reactions || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not toggle reaction' });
  }
});

// ── Get online status for a list of user IDs ──────────
router.post('/online-status', async (req, res) => {
  const { userIds } = req.body;
  if (!Array.isArray(userIds)) {
    return res.status(400).json({ error: 'userIds must be an array' });
  }
  const io = req.app.get('io');
  const onlineUsers = io?.onlineUsers || new Map();
  const statuses = {};
  userIds.forEach(id => {
    statuses[id] = onlineUsers.has(id);
  });
  res.json(statuses);
});

module.exports = router;