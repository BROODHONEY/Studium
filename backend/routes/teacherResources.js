const express = require('express');
const router = express.Router();
const supabase = require('../config/db');
const authenticate = require('../middleware/auth');
const multer = require('multer');
const { uploadAndSign, removeFile, buildStoragePath } = require('../services/storageService');

const BUCKET_FOLDER = 'teacher-resources';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// ── Get all resources for the institution ─────────────
router.get('/resources', authenticate, async (req, res) => {
  try {
    const { departmentId, folderId, resourceType, category } = req.query;

    let query = supabase
      .from('teacher_resources')
      .select(`
        id, title, description, resource_type, category, file_url, file_type,
        file_size, is_public, created_at,
        uploader:uploaded_by (id, name),
        department:department_id (id, name),
        folder:folder_id (id, name)
      `)
      .eq('institution_id', req.user.institutionId)
      .order('created_at', { ascending: false });

    if (departmentId) query = query.eq('department_id', departmentId);
    if (folderId)     query = query.eq('folder_id', folderId);
    if (resourceType) query = query.eq('resource_type', resourceType);
    if (category)     query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch resources' });
  }
});

// ── Upload a resource ─────────────────────────────────
router.post('/resources', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const { title, description, departmentId, folderId, resourceType, category, isPublic } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const storagePath = buildStoragePath(
      `${BUCKET_FOLDER}/${req.user.institutionId}`,
      req.file.originalname
    );
    const fileUrl = await uploadAndSign(storagePath, req.file.buffer, req.file.mimetype);

    const { data, error } = await supabase
      .from('teacher_resources')
      .insert({
        institution_id: req.user.institutionId,
        uploaded_by: req.user.id,
        department_id: departmentId || null,
        folder_id: folderId || null,
        title,
        description: description || null,
        resource_type: resourceType || 'document',
        category: category || null,
        file_url: fileUrl,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        storage_path: storagePath,
        is_public: isPublic === 'true' || isPublic === true,
      })
      .select('id, title, file_url, created_at')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not upload resource' });
  }
});

// ── Delete a resource (uploader only) ────────────────
router.delete('/resources/:id', authenticate, async (req, res) => {
  try {
    const { data: resource, error: fetchErr } = await supabase
      .from('teacher_resources')
      .select('id, uploaded_by, storage_path, institution_id')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !resource) return res.status(404).json({ error: 'Resource not found' });
    if (resource.institution_id !== req.user.institutionId) return res.status(403).json({ error: 'Forbidden' });
    if (resource.uploaded_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorised' });
    }

    if (resource.storage_path) await removeFile(resource.storage_path);

    const { error } = await supabase.from('teacher_resources').delete().eq('id', req.params.id);
    if (error) throw error;

    res.json({ message: 'Resource deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete resource' });
  }
});

// ── Get folders ───────────────────────────────────────
router.get('/folders', authenticate, async (req, res) => {
  try {
    const { departmentId, parentFolderId } = req.query;

    let query = supabase
      .from('resource_folders')
      .select(`id, name, description, created_at, creator:created_by (id, name), department:department_id (id, name)`)
      .eq('institution_id', req.user.institutionId)
      .order('name', { ascending: true });

    if (departmentId)   query = query.eq('department_id', departmentId);
    if (parentFolderId) query = query.eq('parent_folder_id', parentFolderId);
    else                query = query.is('parent_folder_id', null);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch folders' });
  }
});

// ── Create a folder ───────────────────────────────────
router.post('/folders', authenticate, async (req, res) => {
  try {
    const { name, description, departmentId, parentFolderId } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const { data, error } = await supabase
      .from('resource_folders')
      .insert({
        institution_id: req.user.institutionId,
        created_by: req.user.id,
        name,
        description: description || null,
        department_id: departmentId || null,
        parent_folder_id: parentFolderId || null,
      })
      .select('id, name, created_at')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create folder' });
  }
});

module.exports = router;
