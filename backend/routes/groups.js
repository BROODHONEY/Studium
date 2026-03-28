const express = require('express');
const supabase = require('../config/db');
const authMiddleware = require('../middleware/auth');
const generateInviteCode = require('../config/generateCode');

const router = express.Router();

// All group routes require authentication
router.use(authMiddleware);

// ── Create a group (teacher only) ─────────────────────
router.post('/', async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can create groups' });
  }

  const { name, subject, description } = req.body;
  if (!name || !subject) {
    return res.status(400).json({ error: 'Name and subject are required' });
  }

  try {
    // Keep generating until we get a unique code
    let invite_code;
    let isUnique = false;
    while (!isUnique) {
      invite_code = generateInviteCode();
      const { data } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', invite_code)
        .single();
      if (!data) isUnique = true;
    }

    // Create the group
    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name, subject, description, created_by: req.user.id, invite_code })
      .select()
      .single();

    if (error) throw error;

    // Auto-add the teacher as a member
    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: req.user.id,
      role: 'admin'
    });

    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create group' });
  }
});

// ── Join a group via invite code (student) ────────────
router.post('/join', async (req, res) => {
  const { invite_code } = req.body;
  if (!invite_code) {
    return res.status(400).json({ error: 'Invite code is required' });
  }

  try {
    // Find the group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', invite_code.toUpperCase())
      .single();

    if (groupError || !group) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', req.user.id)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'You are already in this group' });
    }

    // Add them as a member
    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: req.user.id,
      role: req.user.role
    });

    // Notify the room that a new member joined
    const io = req.app.get('io');
    if (io) {
      const { data: userData } = await supabase
        .from('users').select('name').eq('id', req.user.id).single();

      const { data: savedMsg } = await supabase
        .from('messages')
        .insert({
          group_id: group.id,
          sender_id: null,
          content: `${userData?.name} joined the group`,
          type: 'system'
        })
        .select('id, content, type, created_at')
        .single();

      io.to(group.id).emit('system_message', {
        id: savedMsg.id,
        type: 'system',
        subtype: 'join',
        text: savedMsg.content,
        timestamp: savedMsg.created_at
      });
    }

    res.json({ message: 'Joined successfully', group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not join group' });
  }
});

// ── List all groups the current user belongs to ────────
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        role,
        joined_at,
        groups (
          id, name, subject, description, invite_code, created_at,
          created_by (id, name)
        )
      `)
      .eq('user_id', req.user.id);

    if (error) throw error;

    // Flatten the response so it's easier to use on the frontend
    const groups = data.map(row => ({
      ...row.groups,
      my_role: row.role,
      joined_at: row.joined_at
    }));

    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch groups' });
  }
});

// ── Leave a group (any member) ─────────────────────────
router.delete('/:id/members/me', async (req, res) => {
  try {
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!membership) return res.status(404).json({ error: 'You are not in this group' });

    // Check if this user is the group creator — creators cannot leave, they must delete
    const { data: group } = await supabase
      .from('groups')
      .select('created_by, name')
      .eq('id', req.params.id)
      .single();

    if (group?.created_by === req.user.id) {
      return res.status(403).json({ error: 'Group creator cannot leave. Delete the group instead.' });
    }

    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', req.params.id)
      .eq('user_id', req.user.id);

    // Notify the room
    const io = req.app.get('io');
    const { data: userData } = await supabase
      .from('users').select('name').eq('id', req.user.id).single();

    if (io) {
      const { data: savedMsg } = await supabase
        .from('messages')
        .insert({
          group_id: req.params.id,
          sender_id: null,
          content: `${userData?.name} left the group`,
          type: 'system'
        })
        .select('id, content, type, created_at')
        .single();

      io.to(req.params.id).emit('system_message', {
        id: savedMsg.id,
        type: 'system',
        subtype: 'leave',
        text: savedMsg.content,
        timestamp: savedMsg.created_at
      });
    }

    res.json({ message: 'Left group successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not leave group' });
  }
});

// ── Kick a member (admin only) ─────────────────────────
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const { data: requester } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    const { data: target } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', req.params.id)
      .eq('user_id', req.params.userId)
      .single();

    if (!target) return res.status(404).json({ error: 'Member not found' });
    if (target.role === 'admin') {
      return res.status(403).json({ error: 'Cannot kick another admin' });
    }

    // Get names for the system message
    const { data: targetUser } = await supabase
      .from('users')
      .select('name')
      .eq('id', req.params.userId)
      .single();

    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', req.params.id)
      .eq('user_id', req.params.userId);

    // Get group name for the popup
    const { data: group } = await supabase
      .from('groups')
      .select('name')
      .eq('id', req.params.id)
      .single();

    // Emit system message to the room
    const io = req.app.get('io');
    // Inside the kick route, after deleting the member
    const { data: savedMsg } = await supabase
      .from('messages')
      .insert({
        group_id: req.params.id,
        sender_id: null,
        content: `${targetUser?.name} was removed from the group`,
        type: 'system'
      })
      .select('id, content, type, created_at')
      .single();

    if (io) {
      io.to(req.params.id).emit('system_message', {
        id: savedMsg.id,
        type: 'system',
        subtype: 'kick',
        text: savedMsg.content,
        timestamp: savedMsg.created_at
      });

      // Emit directly to the kicked user's socket so they get it regardless of which room they're in
      const kickedSocketId = io.userSockets?.get(req.params.userId);
      const kickPayload = {
        kickedUserId: req.params.userId,
        groupId: req.params.id,
        groupName: group?.name
      };
      if (kickedSocketId) {
        io.to(kickedSocketId).emit('member_kicked', kickPayload);
      }
      // Also emit to the room so others' member lists can update
      io.to(req.params.id).emit('member_kicked', kickPayload);
    }

    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not remove member' });
  }
});

// ── Promote teacher to admin (admin only) ──────────────
router.patch('/:id/members/:userId/promote', async (req, res) => {
  try {
    const { data: requester } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can promote members' });
    }

    // Only teachers can be promoted, not students
    const { data: target } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', req.params.id)
      .eq('user_id', req.params.userId)
      .single();

    if (!target) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (target.role === 'student') {
      return res.status(403).json({ error: 'Students cannot be promoted to admin' });
    }

    if (target.role === 'admin') {
      return res.status(409).json({ error: 'Already an admin' });
    }

    await supabase
      .from('group_members')
      .update({ role: 'admin' })
      .eq('group_id', req.params.id)
      .eq('user_id', req.params.userId);

    res.json({ message: 'Member promoted to admin' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not promote member' });
  }
});

// ── Edit group description (admin only) ───────────────
router.patch('/:id', async (req, res) => {
  try {
    const { data: requester } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can edit the group' });
    }

    const { name, subject, description } = req.body;

    const updates = {};
    if (name?.trim())    updates.name = name.trim();
    if (subject?.trim()) updates.subject = subject.trim();
    if (description !== undefined) updates.description = description;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const { data, error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, name, subject, description, invite_code, admins_only, created_at')
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update group' });
  }
});

// ── Revoke admin (demote back to teacher) (admin only) ─
router.patch('/:id/members/:userId/demote', async (req, res) => {
  try {
    const { data: requester } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can revoke admin access' });
    }

    // Cannot demote yourself
    if (req.params.userId === req.user.id) {
      return res.status(403).json({ error: 'You cannot revoke your own admin access' });
    }

    const { data: target } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', req.params.id)
      .eq('user_id', req.params.userId)
      .single();

    if (!target) return res.status(404).json({ error: 'Member not found' });
    if (target.role !== 'admin') return res.status(409).json({ error: 'Member is not an admin' });

    await supabase
      .from('group_members')
      .update({ role: 'teacher' })
      .eq('group_id', req.params.id)
      .eq('user_id', req.params.userId);

    res.json({ message: 'Admin access revoked' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not revoke admin access' });
  }
});

// ── Toggle admins only mode (admin only) ───────────────
router.patch('/:id/admins-only', async (req, res) => {
  try {
    const { data: requester } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can change this setting' });
    }

    const { enabled } = req.body;

    const { data, error } = await supabase
      .from('groups')
      .update({ admins_only: enabled })
      .eq('id', req.params.id)
      .select('id, admins_only')
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update setting' });
  }
});

// ── Get a single group with its members ───────────────
router.get('/:id', async (req, res) => {
  try {
    // Check the requester is actually in this group
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Get group details
    const { data: group, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Get all members with their user info
    const { data: members } = await supabase
      .from('group_members')
      .select(`
        role, joined_at,
        users (id, name, email, phone, avatar_url)
      `)
      .eq('group_id', req.params.id);

    res.json({ ...group, members, my_role: membership.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch group' });
  }
});

// ── Delete a group (teacher/creator only) ─────────────
router.delete('/:id', async (req, res) => {
  try {
    // Verify requester is the creator
    const { data: group } = await supabase
      .from('groups')
      .select('created_by')
      .eq('id', req.params.id)
      .single();

    if (!group || group.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Only the group creator can delete it' });
    }

    await supabase.from('groups').delete().eq('id', req.params.id);

    res.json({ message: 'Group deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete group' });
  }
});
module.exports = router;