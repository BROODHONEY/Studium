const express = require('express');
const supabase = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/search?q=query&groupId=optional
// Searches messages, files, and announcements across all user's groups (or a specific one)
router.get('/', async (req, res) => {
  const { q, groupId } = req.query;
  if (!q || q.trim().length < 2) return res.json({ messages: [], files: [], announcements: [] });

  const term = q.trim();

  try {
    // Get all groups the user belongs to
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, subject)')
      .eq('user_id', req.user.id);

    if (!memberships?.length) return res.json({ messages: [], files: [], announcements: [] });

    const groupIds = groupId
      ? [groupId]
      : memberships.map(m => m.group_id);

    const groupMeta = Object.fromEntries(
      memberships.map(m => [m.group_id, m.groups])
    );

    // Search messages
    const { data: messages } = await supabase
      .from('messages')
      .select('id, content, created_at, group_id, users!sender_id(id, name)')
      .in('group_id', groupIds)
      .ilike('content', `%${term}%`)
      .eq('type', 'text')
      .order('created_at', { ascending: false })
      .limit(20);

    // Search files
    const { data: files } = await supabase
      .from('files')
      .select('id, filename, file_url, file_type, created_at, group_id, users!uploaded_by(id, name)')
      .in('group_id', groupIds)
      .ilike('filename', `%${term}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    // Search announcements
    const { data: announcements } = await supabase
      .from('announcements')
      .select('id, title, content, tag, created_at, group_id, users!created_by(id, name)')
      .in('group_id', groupIds)
      .eq('published', true)
      .or(`title.ilike.%${term}%,content.ilike.%${term}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    // Attach group metadata to each result
    const attach = (items) => (items || []).map(item => ({
      ...item,
      group: groupMeta[item.group_id] || { id: item.group_id, name: 'Unknown' },
    }));

    res.json({
      messages:      attach(messages),
      files:         attach(files),
      announcements: attach(announcements),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
