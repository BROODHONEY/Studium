const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const { fileTypeFromBuffer } = require('file-type');
const supabase = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { uploadAndSign, removeFile, buildStoragePath } = require('../services/storageService');

const router = express.Router();
router.use(authMiddleware);

// Allowed MIME types with their magic numbers
const ALLOWED_TYPES = {
  'application/pdf': { ext: 'pdf', maxSize: 10 * 1024 * 1024 }, // 10MB
  'application/vnd.ms-powerpoint': { ext: 'ppt', maxSize: 10 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: 'pptx', maxSize: 10 * 1024 * 1024 },
  'application/vnd.ms-excel': { ext: 'xls', maxSize: 10 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: 'xlsx', maxSize: 10 * 1024 * 1024 },
  'application/msword': { ext: 'doc', maxSize: 10 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', maxSize: 10 * 1024 * 1024 },
  'image/jpeg': { ext: 'jpg', maxSize: 5 * 1024 * 1024 }, // 5MB for images
  'image/png': { ext: 'png', maxSize: 5 * 1024 * 1024 }
};

// Validate file type by checking actual file content (magic numbers)
const validateFileType = async (buffer, originalMimetype) => {
  try {
    const fileType = await fileTypeFromBuffer(buffer);
    
    if (!fileType) {
      throw new Error('Could not determine file type');
    }
    
    // Check if detected type matches claimed type
    if (!ALLOWED_TYPES[fileType.mime]) {
      throw new Error(`File type ${fileType.mime} is not allowed`);
    }
    
    return fileType;
  } catch (err) {
    throw new Error('Invalid or unsupported file type');
  }
};

// Generate safe filename
const generateSafeFilename = (originalname) => {
  const ext = path.extname(originalname).toLowerCase();
  const randomName = crypto.randomBytes(16).toString('hex');
  return `${randomName}${ext}`;
};

// Store file in memory as a buffer (not on disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    // Basic MIME type check (will be validated again with magic numbers)
    if (ALLOWED_TYPES[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// ── Upload a file to a group ───────────────────────────
router.post('/:groupId', upload.single('file'), async (req, res) => {
  const { groupId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    // Verify membership
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', req.user.id)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Validate file type by checking actual content (magic numbers)
    const { originalname, mimetype, buffer, size } = req.file;
    const validatedType = await validateFileType(buffer, mimetype);

    // Check file size against type-specific limits
    const typeConfig = ALLOWED_TYPES[validatedType.mime];
    if (size > typeConfig.maxSize) {
      return res.status(400).json({ 
        error: `File too large. Maximum size for ${validatedType.mime} is ${typeConfig.maxSize / (1024 * 1024)}MB` 
      });
    }

    // Students can only upload images and PDFs
    const studentAllowed = ['application/pdf', 'image/jpeg', 'image/png'];
    const isStudent = membership.role === 'student';

    if (isStudent && !studentAllowed.includes(validatedType.mime)) {
      return res.status(403).json({ error: 'Students can only upload images and PDFs' });
    }

    // Generate safe filename to prevent path traversal
    const safeFilename = generateSafeFilename(originalname);
    const storagePath = buildStoragePath(groupId, safeFilename);
    const fileUrl = await uploadAndSign(storagePath, buffer, validatedType.mime);

    // Save file record to DB
    const { data: file, error: dbError } = await supabase
      .from('files')
      .insert({
        group_id: groupId,
        uploaded_by: req.user.id,
        filename: originalname, // Keep original name for display
        file_url: fileUrl,
        file_type: validatedType.mime,
        size_bytes: size,
        storage_path: storagePath,
        uploaded_by_role: membership.role
      })
      .select(`
        id, filename, file_url, file_type, size_bytes, created_at, uploaded_by_role,
        users!uploaded_by (id, name)
      `)
      .single();

    if (dbError) throw dbError;

    // Emit socket event so other members see the unread indicator
    const io = req.app.get('io');
    if (io) io.to(groupId).emit('new_file', { group_id: groupId, uploaded_by: req.user.id, file });

    res.status(201).json(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Could not upload file' });
  }
});

// ── List all files in a group ──────────────────────────
router.get('/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    // Verify membership
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', req.user.id)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const { data: files, error } = await supabase
      .from('files')
      .select(`
        id, filename, file_url, file_type, size_bytes, created_at, uploaded_by_role,
        users!uploaded_by (id, name)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch files' });
  }
});

// ── Delete a file (teacher/uploader only) ─────────────
router.delete('/:groupId/:fileId', async (req, res) => {
  const { groupId, fileId } = req.params;

  try {
    // Get the file record
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('group_id', groupId)
      .single();

    if (fetchError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Students can never delete files
    if (req.user.role === 'student') {
      return res.status(403).json({ error: 'Students cannot delete files' });
    }

    // Check group membership role — group admins and teachers can delete any file
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', req.user.id)
      .single();

    const isGroupAdmin   = membership?.role === 'admin';
    const isGroupTeacher = membership?.role === 'teacher';
    const isUploader     = file.uploaded_by === req.user.id;

    if (!isGroupAdmin && !isGroupTeacher && !isUploader) {
      return res.status(403).json({ error: 'Not authorised to delete this file' });
    }

    // Delete from Supabase Storage
    await removeFile(file.storage_path);

    // Delete from DB
    await supabase.from('files').delete().eq('id', fileId);

    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete file' });
  }
});

// ── Multer error handler ───────────────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 20MB' });
    }
  }
  if (err.message === 'File type not allowed') {
    return res.status(400).json({ error: 'File type not allowed' });
  }
  next(err);
});

module.exports = router;