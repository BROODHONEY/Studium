const express = require('express');
const supabase = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ── Get pinned messages for a group ───────────────────
router.get('/:groupId/pinned', async (req, res) => {
  const { groupId } = req.params;
  try {
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', req.user.id)
      .single();

    if (!membership) return res.status(403).json({ error: 'Not a member' });

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`id, content, type, created_at, pinned, pin_time,
          users!sender_id (id, name, role, roll_no)`)
        .eq('group_id', groupId)
        .eq('pinned', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const nowMs = Date.now();
      const expiredIds = [];
      const filtered = (data || []).filter((m) => {
        if (!m.pin_time) return true;
        const exp = new Date(m.pin_time);
        if (isNaN(exp.getTime())) return true; // unknown format => don't auto-expire
        if (exp.getTime() <= nowMs) {
          expiredIds.push(m.id);
          return false;
        }
        return true;
      });

      if (expiredIds.length > 0) {
        try {
          await supabase
            .from('messages')
            .update({ pinned: false, pin_time: null })
            .in('id', expiredIds);
        } catch (cleanupErr) {
          // Best-effort cleanup; still return filtered data.
        }
      }

      return res.json(filtered);
    } catch {
      // Backward-compatible fallback (schema without `pin_time`)
      const { data, error } = await supabase
        .from('messages')
        .select(`id, content, type, created_at, pinned,
          users!sender_id (id, name, role, roll_no)`)
        .eq('group_id', groupId)
        .eq('pinned', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json(data);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch pinned messages' });
  }
});

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
            id, content, type, created_at, edited,
            users!sender_id (id, name, role, roll_no, avatar_url),
            files!file_id (id, filename, file_url, file_type, size_bytes),
            message_reactions (emoji, user_id)
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

// ── Pin a message (admin only) ────────────────────────
router.patch('/:messageId/pin', async (req, res) => {
  const { messageId } = req.params;
  try {
    const { pin_ttl_minutes, pin_time } = req.body || {};

    const { data: message } = await supabase
      .from('messages')
      .select('id, group_id, content, created_at, sender_id')
      .eq('id', messageId)
      .single();

    if (!message) return res.status(404).json({ error: 'Message not found' });

    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', message.group_id)
      .eq('user_id', req.user.id)
      .single();

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can pin messages' });
    }

    const updatePayload = { pinned: true };

    // `pin_time` (legacy) may be either:
    // - an ISO expiry timestamp
    // - a HH:MM duration string (relative to now)
    // New clients should send `pin_ttl_minutes` (duration in minutes).
    let expiresAtIso = null;
    if (pin_ttl_minutes !== undefined) {
      const ttlNum = Number(pin_ttl_minutes);
      if (Number.isFinite(ttlNum) && ttlNum > 0) {
        expiresAtIso = new Date(Date.now() + ttlNum * 60000).toISOString();
      }
    } else if (pin_time !== undefined) {
      // ISO?
      const maybeDate = new Date(pin_time);
      if (typeof pin_time === 'string' && !isNaN(maybeDate.getTime())) {
        expiresAtIso = maybeDate.toISOString();
      } else if (typeof pin_time === 'string') {
        // HH:MM duration?
        const match = pin_time.match(/^(\d{1,2}):(\d{2})$/);
        if (match) {
          const hh = Number(match[1]);
          const mm = Number(match[2]);
          const totalMinutes = hh * 60 + mm;
          if (Number.isFinite(totalMinutes) && totalMinutes > 0) {
            expiresAtIso = new Date(Date.now() + totalMinutes * 60000).toISOString();
          }
        }
      } else if (typeof pin_time === 'number' && Number.isFinite(pin_time) && pin_time > 0) {
        // Treat numeric as minutes.
        expiresAtIso = new Date(Date.now() + pin_time * 60000).toISOString();
      }
    }

    if (pin_ttl_minutes !== undefined || pin_time !== undefined) {
      updatePayload.pin_time = expiresAtIso;
    }

    try {
      await supabase.from('messages').update(updatePayload).eq('id', messageId);
    } catch (updateErr) {
      // Fallback for schemas without `pin_time`
      if (pin_ttl_minutes !== undefined || pin_time !== undefined) {
        await supabase.from('messages').update({ pinned: true }).eq('id', messageId);
      } else {
        throw updateErr;
      }
    }

    const io = req.app.get('io');
    // Auto-unpin after expiry (best-effort, server-memory based).
    if (io && expiresAtIso) {
      const scheduleExpiry = () => {
        const expiresAtMs = new Date(expiresAtIso).getTime();
        const remainingMs = expiresAtMs - Date.now();
        if (remainingMs <= 0) return;

        const maxTimeoutMs = 2147483000; // ~24.8 days (setTimeout limit)
        const delayMs = Math.min(remainingMs, maxTimeoutMs);

        setTimeout(async () => {
          try {
            let currentPinned = null;
            let currentPinTime = null;

            try {
              const { data: current } = await supabase
                .from('messages')
                .select('pinned, pin_time')
                .eq('id', messageId)
                .single();
              currentPinned = current?.pinned;
              currentPinTime = current?.pin_time;
            } catch {
              // Schema without `pin_time`
              const { data: current } = await supabase
                .from('messages')
                .select('pinned')
                .eq('id', messageId)
                .single();
              currentPinned = current?.pinned;
            }

            const shouldUnpin = (() => {
              if (currentPinned !== true) return false;
              if (!currentPinTime) return true;
              const curr = new Date(currentPinTime);
              const exp = new Date(expiresAtIso);
              if (isNaN(curr.getTime()) || isNaN(exp.getTime())) return true;
              return curr.getTime() === exp.getTime();
            })();

            if (!shouldUnpin) return;

            try {
              await supabase
                .from('messages')
                .update({ pinned: false, pin_time: null })
                .eq('id', messageId);
            } catch {
              await supabase
                .from('messages')
                .update({ pinned: false })
                .eq('id', messageId);
            }

            io.to(message.group_id).emit('message_unpinned', {
              messageId,
              groupId: message.group_id
            });
          } catch {
            // Ignore; pinned list endpoint will still filter expired pins.
          }

          // If we hit setTimeout cap, re-schedule until it's actually time.
          if (new Date(expiresAtIso).getTime() - Date.now() > 0) {
            scheduleExpiry();
          }
        }, delayMs);
      };

      scheduleExpiry();
    }

    if (io) io.to(message.group_id).emit('message_pinned', {
      messageId,
      groupId: message.group_id,
      content: message.content,
      pin_time: expiresAtIso
    });

    res.json({ message: 'Message pinned', pin_time: expiresAtIso });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not pin message' });
  }
});

// ── Unpin a message (admin only) ──────────────────────
router.patch('/:messageId/unpin', async (req, res) => {
  const { messageId } = req.params;
  try {
    const { data: message } = await supabase
      .from('messages')
      .select('id, group_id')
      .eq('id', messageId)
      .single();

    if (!message) return res.status(404).json({ error: 'Message not found' });

    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', message.group_id)
      .eq('user_id', req.user.id)
      .single();

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can unpin messages' });
    }

    try {
      await supabase.from('messages').update({ pinned: false, pin_time: null }).eq('id', messageId);
    } catch {
      await supabase.from('messages').update({ pinned: false }).eq('id', messageId);
    }

    const io = req.app.get('io');
    if (io) io.to(message.group_id).emit('message_unpinned', { messageId, groupId: message.group_id });

    res.json({ message: 'Message unpinned' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not unpin message' });
  }
});

// ── Edit a message (sender only) ─────────────────────
router.patch('/:messageId/edit', async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const { data: message } = await supabase
      .from('messages')
      .select('id, sender_id, group_id')
      .eq('id', messageId)
      .single();

    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.sender_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    const { data, error } = await supabase
      .from('messages')
      .update({ content: content.trim(), edited: true })
      .eq('id', messageId)
      .select('id, content, edited')
      .single();

    if (error) throw error;

    const io = req.app.get('io');
    if (io) io.to(message.group_id).emit('message_edited', { messageId, content: data.content });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not edit message' });
  }
});

// ── Toggle a reaction ─────────────────────────────────
router.post('/:messageId/reactions', async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;

  if (!emoji) return res.status(400).json({ error: 'Emoji is required' });

  try {
    const { data: message } = await supabase
      .from('messages')
      .select('id, group_id')
      .eq('id', messageId)
      .single();

    if (!message) return res.status(404).json({ error: 'Message not found' });

    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', message.group_id)
      .eq('user_id', req.user.id)
      .single();

    if (!membership) return res.status(403).json({ error: 'Not a member' });

    // Check if reaction already exists (toggle)
    const { data: existing } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', req.user.id)
      .eq('emoji', emoji)
      .single();

    if (existing) {
      await supabase.from('message_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('message_reactions').insert({
        message_id: messageId,
        user_id: req.user.id,
        emoji
      });
    }

    // Fetch updated reaction counts for this message
    const { data: reactions } = await supabase
      .from('message_reactions')
      .select('emoji, user_id')
      .eq('message_id', messageId);

    const io = req.app.get('io');
    if (io) io.to(message.group_id).emit('message_reaction', { messageId, reactions: reactions || [] });

    res.json({ reactions: reactions || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not toggle reaction' });
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