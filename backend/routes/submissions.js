const express = require('express');
const multer  = require('multer');
const supabase = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

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
      .order('created_at', { ascending: false });

    if (error) throw error;

    // For students: attach their own submission count
    if (membership.role === 'student') {
      const ids = data.map(a => a.id);
      const { data: subs } = await supabase
        .from('assignment_submissions')
        .select('assignment_id, attempt, submitted_at, file_url, file_name, file_type, file_size')
        .eq('user_id', req.user.id)
        .in('assignment_id', ids);

      const dueDateMap = Object.fromEntries(data.map(a => [a.id, a.due_date]));

      const subMap = {};
      (subs || []).forEach(s => {
        if (!subMap[s.assignment_id]) subMap[s.assignment_id] = { count: 0, is_overdue: false, file_url: null, file_name: null, file_type: null, file_size: null };
        subMap[s.assignment_id].count++;
        const dueDate = dueDateMap[s.assignment_id];
        if (dueDate && new Date(s.submitted_at) > new Date(dueDate)) {
          subMap[s.assignment_id].is_overdue = true;
        }
        // Keep latest submission file
        subMap[s.assignment_id].file_url  = s.file_url;
        subMap[s.assignment_id].file_name = s.file_name;
        subMap[s.assignment_id].file_type = s.file_type;
        subMap[s.assignment_id].file_size = s.file_size;
      });
      return res.json(data.map(a => ({
        ...a,
        my_submissions: subMap[a.id]?.count || 0,
        my_overdue:     subMap[a.id]?.is_overdue || false,
        my_file_url:    subMap[a.id]?.file_url || null,
        my_file_name:   subMap[a.id]?.file_name || null,
        my_file_type:   subMap[a.id]?.file_type || null,
        my_file_size:   subMap[a.id]?.file_size || null,
      })));
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

    const { title, description, due_date, allow_offline } = req.body;
    if (!title || !due_date) return res.status(400).json({ error: 'title and due_date are required' });

    console.log('[create assignment] allow_offline received:', allow_offline, '→ stored as:', !!allow_offline);

    const { data, error } = await supabase
      .from('assignments')
      .insert({ group_id: req.params.groupId, title, description, due_date, allow_offline: !!allow_offline, created_by: req.user.id })
      .select('*, users!created_by(id, name)')
      .single();

    if (error) throw error;
    console.log('[create assignment] returned allow_offline:', data.allow_offline);

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

    const { title, description, due_date, allow_offline } = req.body;
    if (!title || !due_date) return res.status(400).json({ error: 'title and due_date are required' });

    console.log('[update assignment] allow_offline received:', allow_offline, '→ stored as:', !!allow_offline);

    const { data, error } = await supabase
      .from('assignments')
      .update({ title, description, due_date, allow_offline: !!allow_offline })
      .eq('id', req.params.assignmentId)
      .eq('group_id', req.params.groupId)
      .select('*, users!created_by(id, name)')
      .single();

    if (error) throw error;
    console.log('[update assignment] returned allow_offline:', data.allow_offline);

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

// ── Close assignment (removes due, keeps assignment) ──
router.patch('/:groupId/:assignmentId/close', async (req, res) => {
  try {
    const membership = await getMembership(req.params.groupId, req.user.id);
    if (!membership || membership.role === 'student') return res.status(403).json({ error: 'Forbidden' });

    const { data, error } = await supabase
      .from('assignments')
      .update({ closed_at: new Date().toISOString() })
      .eq('id', req.params.assignmentId)
      .eq('group_id', req.params.groupId)
      .select('*, users!created_by(id, name)')
      .single();

    if (error) throw error;

    // Remove from due dates
    await supabase.from('dues')
      .delete()
      .eq('ref_id', req.params.assignmentId)
      .eq('ref_type', 'assignment');

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not close assignment' });
  }
});

// ── Delete assignment (teacher/admin only) ────────────
router.delete('/:groupId/:assignmentId', async (req, res) => {
  try {
    const membership = await getMembership(req.params.groupId, req.user.id);
    if (!membership || membership.role === 'student') return res.status(403).json({ error: 'Forbidden' });

    // Delete submissions first (avoids FK constraint issues)
    await supabase.from('assignment_submissions')
      .delete().eq('assignment_id', req.params.assignmentId);

    // Remove linked due entry (may already be gone if closed)
    await supabase.from('dues')
      .delete()
      .eq('ref_id', req.params.assignmentId)
      .eq('ref_type', 'assignment');

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

// ── Mark / unmark student offline submission (teacher/admin) ─
router.patch('/:groupId/:assignmentId/mark-offline/:userId', async (req, res) => {
  try {
    const m = await getMembership(req.params.groupId, req.user.id);
    if (!m || m.role === 'student') return res.status(403).json({ error: 'Forbidden' });

    const mark = req.body.marked !== false; // default true, pass false to unmark

    const { data: existing } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', req.params.assignmentId)
      .eq('user_id', req.params.userId)
      .single();

    let data, error;
    if (existing) {
      if (!mark) {
        // Unmark — delete the offline submission record entirely
        ({ error } = await supabase
          .from('assignment_submissions')
          .delete()
          .eq('id', existing.id));
        if (error) throw error;
        return res.json({ deleted: true });
      }
      ({ data, error } = await supabase
        .from('assignment_submissions')
        .update({ offline: true, submitted_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select().single());
    } else {
      if (!mark) return res.json({ deleted: true }); // nothing to unmark
      ({ data, error } = await supabase
        .from('assignment_submissions')
        .insert({ assignment_id: req.params.assignmentId, user_id: req.params.userId, attempt: 1, offline: true })
        .select().single());
    }
    if (error) throw error;
    res.json(data);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// ── Upload submission file ────────────────────────────
router.post('/:groupId/:assignmentId/upload', upload.single('file'), async (req, res) => {
  try {
    const membership = await getMembership(req.params.groupId, req.user.id);
    if (!membership || membership.role !== 'student') return res.status(403).json({ error: 'Students only' });
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const { originalname, mimetype, buffer, size } = req.file;
    const safeName = originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const storagePath = `submissions/${req.params.assignmentId}/${req.user.id}-${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('studium-files')
      .upload(storagePath, buffer, { contentType: mimetype, upsert: false });
    if (uploadError) throw uploadError;

    const { data: signedData, error: signedError } = await supabase.storage
      .from('studium-files')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
    if (signedError) throw signedError;

    res.json({ file_url: signedData.signedUrl, file_name: originalname, file_type: mimetype, file_size: size });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
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

    // Check if submitting after due date
    const { data: assignment } = await supabase
      .from('assignments').select('due_date, closed_at').eq('id', req.params.assignmentId).single();

    if (assignment?.closed_at) {
      return res.status(400).json({ error: 'Assignment is closed' });
    }

    const { note, file_url, file_name, file_type, file_size } = req.body;

    // If already submitted once, UPDATE the existing record (latest overrides previous)
    if (existing && existing.length > 0) {
      const existingId = existing[existing.length - 1].id;
      const { data, error } = await supabase
        .from('assignment_submissions')
        .update({ note, file_url, file_name, file_type, file_size, submitted_at: new Date().toISOString() })
        .eq('id', existingId)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }

    // First submission — insert
    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert({ assignment_id: req.params.assignmentId, user_id: req.user.id, attempt: 1, note, file_url, file_name, file_type, file_size })
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
      .select('user_id, attempt, submitted_at, note, file_url, file_name, file_type, file_size, offline')
      .eq('assignment_id', req.params.assignmentId)
      .order('attempt', { ascending: true });

    // Get assignment due_date for overdue calculation
    const { data: assignment } = await supabase
      .from('assignments').select('due_date').eq('id', req.params.assignmentId).single();

    const subMap = {};
    (subs || []).forEach(s => {
      if (!subMap[s.user_id]) subMap[s.user_id] = [];
      subMap[s.user_id].push(s);
    });

    const report = (members || []).map(m => {
      const u = m.users;
      const userSubs = subMap[u.id] || [];
      const lastSub = userSubs[userSubs.length - 1];
      const is_overdue = lastSub && assignment?.due_date
        ? new Date(lastSub.submitted_at) > new Date(assignment.due_date)
        : false;
      return {
        id: u.id,
        name: u.name,
        roll_no: u.roll_no || '—',
        email: u.email,
        submitted: userSubs.length > 0,
        is_overdue,
        attempts: userSubs.length,
        last_submitted_at: lastSub?.submitted_at || null,
        note: lastSub?.note || '',
        file_url: lastSub?.file_url || null,
        file_name: lastSub?.file_name || null,
        file_type: lastSub?.file_type || null,
        file_size: lastSub?.file_size || null,
        offline: lastSub?.offline || false,
      };
    });

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch report' });
  }
});

module.exports = router;
