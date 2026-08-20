const express = require('express');
const supabase = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { getMembership } = require('../services/groupService');

const router = express.Router();
router.use(authMiddleware);

// ── List quizzes for a group ──────────────────────────
router.get('/:groupId', async (req, res) => {
  try {
    const m = await getMembership(req.params.groupId, req.user.id);
    if (!m) return res.status(403).json({ error: 'Not a member' });

    const { data, error } = await supabase
      .from('quizzes')
      .select('id, title, description, duration_mins, starts_at, ends_at, created_at, users!created_by(id, name)')
      .eq('group_id', req.params.groupId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    if (m.role === 'student') {
      const ids = data.map(q => q.id);
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('quiz_id, submitted_at')
        .eq('user_id', req.user.id)
        .in('quiz_id', ids);
      const attemptMap = Object.fromEntries((attempts || []).map(a => [a.quiz_id, a]));
      return res.json(data.map(q => ({ ...q, my_attempt: attemptMap[q.id] || null })));
    }
    res.json(data);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// ── Get single quiz with questions (for taking) ───────
router.get('/:groupId/:quizId', async (req, res) => {
  try {
    const m = await getMembership(req.params.groupId, req.user.id);
    if (!m) return res.status(403).json({ error: 'Not a member' });

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', req.params.quizId)
      .eq('group_id', req.params.groupId)
      .single();
    if (error || !quiz) return res.status(404).json({ error: 'Quiz not found' });

    // SECURITY FIX: Only fetch correct_index for teachers/admins
    // Students should NEVER receive answer data from the server
    const selectFields = m.role === 'student'
      ? 'id, question, options, order_index'
      : 'id, question, options, correct_index, order_index';

    const { data: questions } = await supabase
      .from('quiz_questions')
      .select(selectFields)
      .eq('quiz_id', req.params.quizId)
      .order('order_index');

    // Check if student already attempted
    let attempt = null;
    if (m.role === 'student') {
      const { data: a } = await supabase
        .from('quiz_attempts')
        .select('id, submitted_at, score')
        .eq('quiz_id', req.params.quizId)
        .eq('user_id', req.user.id)
        .single();
      attempt = a || null;
    }

    res.json({ ...quiz, questions: questions || [], my_attempt: attempt });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// ── Create quiz (teacher/admin) ───────────────────────
router.post('/:groupId', validate(schemas.createQuiz), async (req, res) => {
  try {
    const m = await getMembership(req.params.groupId, req.user.id);
    if (!m || m.role === 'student') return res.status(403).json({ error: 'Forbidden' });

    const { title, description, duration_mins, starts_at, ends_at, questions, show_score } = req.body;
    // Validation already handled by middleware

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert({ group_id: req.params.groupId, title, description, duration_mins, starts_at, ends_at, show_score: show_score !== false, created_by: req.user.id })
      .select('*, users!created_by(id, name)')
      .single();
    if (error) throw error;

    if (Array.isArray(questions) && questions.length > 0) {
      const rows = questions.map((q, i) => ({
        quiz_id: quiz.id,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        order_index: i,
      }));
      await supabase.from('quiz_questions').insert(rows);
    }

    // Auto-create a due entry so it appears on the Due Dates page
    const { data: due } = await supabase
      .from('dues')
      .insert({
        group_id: req.params.groupId,
        created_by: req.user.id,
        title,
        description,
        due_date: ends_at,
        category: 'quiz',
        ref_id: quiz.id,
        ref_type: 'quiz',
      })
      .select('id')
      .single();

    const io = req.app.get('io');
    if (io) {
      if (due) io.to(req.params.groupId).emit('new_due', { ...due, group_id: req.params.groupId });
      io.to(req.params.groupId).emit('new_quiz', { ...quiz, my_attempt: null });
    }

    res.status(201).json(quiz);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create quiz' }); }
});

// ── Update quiz info (teacher/admin, no questions) ────
router.put('/:groupId/:quizId', async (req, res) => {
  try {
    const m = await getMembership(req.params.groupId, req.user.id);
    if (!m || m.role === 'student') return res.status(403).json({ error: 'Forbidden' });

    const { title, description, duration_mins, starts_at, ends_at, show_score } = req.body;
    if (!title || !duration_mins || !starts_at || !ends_at) {
      return res.status(400).json({ error: 'title, duration_mins, starts_at, ends_at required' });
    }
    if (new Date(ends_at) <= new Date(starts_at)) {
      return res.status(400).json({ error: 'ends_at must be after starts_at' });
    }

    const { data, error } = await supabase
      .from('quizzes')
      .update({ title, description, duration_mins, starts_at, ends_at, show_score: show_score !== false })
      .eq('id', req.params.quizId)
      .eq('group_id', req.params.groupId)
      .select('*, users!created_by(id, name)')
      .single();

    if (error) throw error;

    // Sync the linked due entry
    await supabase.from('dues')
      .update({ title, description, due_date: ends_at })
      .eq('ref_id', req.params.quizId)
      .eq('ref_type', 'quiz');

    const io = req.app.get('io');
    if (io) io.to(req.params.groupId).emit('update_quiz', data);

    res.json(data);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update quiz' }); }
});

// ── Close quiz (removes due, keeps quiz for history) ──
router.patch('/:groupId/:quizId/close', async (req, res) => {
  try {
    const m = await getMembership(req.params.groupId, req.user.id);
    if (!m || m.role === 'student') return res.status(403).json({ error: 'Forbidden' });

    const { data, error } = await supabase
      .from('quizzes')
      .update({ closed_at: new Date().toISOString() })
      .eq('id', req.params.quizId)
      .eq('group_id', req.params.groupId)
      .select('*, users!created_by(id, name)')
      .single();

    if (error) throw error;

    // Remove from due dates
    await supabase.from('dues')
      .delete()
      .eq('ref_id', req.params.quizId)
      .eq('ref_type', 'quiz');

    const io = req.app.get('io');
    if (io) io.to(req.params.groupId).emit('close_quiz', data);

    res.json(data);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to close quiz' }); }
});

// ── Delete quiz (teacher/admin) ───────────────────────
router.delete('/:groupId/:quizId', async (req, res) => {
  try {
    const m = await getMembership(req.params.groupId, req.user.id);
    if (!m || m.role === 'student') return res.status(403).json({ error: 'Forbidden' });

    // Delete attempts and questions first (avoids FK constraint issues)
    await supabase.from('quiz_attempts').delete().eq('quiz_id', req.params.quizId);
    await supabase.from('quiz_questions').delete().eq('quiz_id', req.params.quizId);

    // Remove linked due entry (may already be gone if closed)
    await supabase.from('dues')
      .delete()
      .eq('ref_id', req.params.quizId)
      .eq('ref_type', 'quiz');

    await supabase.from('quizzes').delete().eq('id', req.params.quizId).eq('group_id', req.params.groupId);

    const io = req.app.get('io');
    if (io) io.to(req.params.groupId).emit('delete_quiz', { id: req.params.quizId });

    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// ── Submit quiz attempt (student) ─────────────────────
router.post('/:groupId/:quizId/attempt', async (req, res) => {
  try {
    const m = await getMembership(req.params.groupId, req.user.id);
    if (!m || m.role !== 'student') return res.status(403).json({ error: 'Students only' });

    // Validate quiz window before anything else
    const { data: quizMeta, error: quizMetaError } = await supabase
      .from('quizzes')
      .select('starts_at, ends_at, closed_at, show_score')
      .eq('id', req.params.quizId)
      .eq('group_id', req.params.groupId)
      .single();

    if (quizMetaError || !quizMeta) return res.status(404).json({ error: 'Quiz not found' });

    if (quizMeta.closed_at) return res.status(400).json({ error: 'Quiz is closed' });

    const now = new Date();
    if (quizMeta.starts_at && now < new Date(quizMeta.starts_at)) {
      return res.status(400).json({ error: 'Quiz has not started yet' });
    }
    if (quizMeta.ends_at && now > new Date(quizMeta.ends_at)) {
      return res.status(400).json({ error: 'Quiz has already ended' });
    }

    // One attempt only
    const { data: existing } = await supabase
      .from('quiz_attempts').select('id')
      .eq('quiz_id', req.params.quizId).eq('user_id', req.user.id).single();
    if (existing) return res.status(400).json({ error: 'Already attempted' });

    // Fetch questions with correct answers
    const { data: questions } = await supabase
      .from('quiz_questions').select('id, correct_index, order_index')
      .eq('quiz_id', req.params.quizId).order('order_index');

    const { answers } = req.body; // { [questionId]: selectedIndex }
    let score = 0;
    (questions || []).forEach(q => {
      if (answers?.[q.id] !== undefined && Number(answers[q.id]) === q.correct_index) score++;
    });

    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({ quiz_id: req.params.quizId, user_id: req.user.id, answers, score, total: questions?.length || 0 })
      .select().single();
    if (error) throw error;

    res.status(201).json({
      ...data,
      score: quizMeta.show_score !== false ? data.score : null,
      total: quizMeta.show_score !== false ? data.total : null,
      show_score: quizMeta.show_score !== false,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to submit' }); }
});

// ── Quiz report (teacher/admin) ───────────────────────
router.get('/:groupId/:quizId/report', async (req, res) => {
  try {
    const m = await getMembership(req.params.groupId, req.user.id);
    if (!m || m.role === 'student') return res.status(403).json({ error: 'Forbidden' });

    const { data: members } = await supabase
      .from('group_members')
      .select('users(id, name, roll_no, email)')
      .eq('group_id', req.params.groupId).eq('role', 'student');

    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('user_id, score, total, submitted_at')
      .eq('quiz_id', req.params.quizId);

    const attemptMap = Object.fromEntries((attempts || []).map(a => [a.user_id, a]));

    const report = (members || []).map(({ users: u }) => ({
      id: u.id, name: u.name, roll_no: u.roll_no || '—', email: u.email,
      completed: !!attemptMap[u.id],
      score: attemptMap[u.id]?.score ?? null,
      total: attemptMap[u.id]?.total ?? null,
      submitted_at: attemptMap[u.id]?.submitted_at || null,
    }));

    res.json(report);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;
