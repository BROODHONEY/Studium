const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticate = require('../middleware/auth');
const { tenantMiddleware, requireTenant } = require('../middleware/tenant');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/resources');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|jpg|jpeg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

// Get all resources for teacher's department
router.get('/', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const { department_id, folder_id, resource_type, category } = req.query;
    
    let query = `
      SELECT r.*, u.name as uploader_name, d.name as department_name,
             f.name as folder_name
      FROM teacher_resources r
      LEFT JOIN users u ON r.uploaded_by = u.id
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN resource_folders f ON r.folder_id = f.id
      WHERE r.institution_id = ?
    `;
    const params = [req.institutionId];

    if (department_id) {
      query += ' AND r.department_id = ?';
      params.push(department_id);
    } else if (req.user.department_id) {
      query += ' AND (r.department_id = ? OR r.is_public = TRUE)';
      params.push(req.user.department_id);
    }

    if (folder_id) {
      query += ' AND r.folder_id = ?';
      params.push(folder_id);
    }

    if (resource_type) {
      query += ' AND r.resource_type = ?';
      params.push(resource_type);
    }

    if (category) {
      query += ' AND r.category = ?';
      params.push(category);
    }

    query += ' ORDER BY r.created_at DESC';

    const [resources] = await db.query(query, params);
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload new resource
router.post('/upload', authenticate, tenantMiddleware, requireTenant, upload.single('file'), async (req, res) => {
  try {
    const { title, description, resource_type, category, folder_id, department_id, is_public, tags } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const [result] = await db.query(
      `INSERT INTO teacher_resources 
       (institution_id, department_id, uploaded_by, title, description, resource_type, 
        file_path, file_size, file_type, category, folder_id, is_public, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.institutionId,
        department_id || req.user.department_id,
        req.user.id,
        title,
        description || null,
        resource_type || 'document',
        req.file.path,
        req.file.size,
        req.file.mimetype,
        category || null,
        folder_id || null,
        is_public === 'true' || is_public === true,
        tags ? JSON.stringify(tags) : null
      ]
    );

    res.status(201).json({ 
      resourceId: result.insertId,
      message: 'Resource uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading resource:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get folders
router.get('/folders', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const { department_id, parent_folder_id } = req.query;
    
    let query = `
      SELECT f.*, u.name as creator_name, d.name as department_name,
             (SELECT COUNT(*) FROM teacher_resources WHERE folder_id = f.id) as resource_count
      FROM resource_folders f
      LEFT JOIN users u ON f.created_by = u.id
      LEFT JOIN departments d ON f.department_id = d.id
      WHERE f.institution_id = ?
    `;
    const params = [req.institutionId];

    if (parent_folder_id) {
      query += ' AND f.parent_folder_id = ?';
      params.push(parent_folder_id);
    } else {
      query += ' AND f.parent_folder_id IS NULL';
    }

    if (department_id) {
      query += ' AND f.department_id = ?';
      params.push(department_id);
    } else if (req.user.department_id) {
      query += ' AND f.department_id = ?';
      params.push(req.user.department_id);
    }

    query += ' ORDER BY f.name ASC';

    const [folders] = await db.query(query, params);
    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create folder
router.post('/folders', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const { name, description, parent_folder_id, department_id } = req.body;

    const [result] = await db.query(
      `INSERT INTO resource_folders 
       (institution_id, department_id, parent_folder_id, name, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.institutionId,
        department_id || req.user.department_id,
        parent_folder_id || null,
        name,
        description || null,
        req.user.id
      ]
    );

    res.status(201).json({ 
      folderId: result.insertId,
      message: 'Folder created successfully' 
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get report templates
router.get('/templates', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const { template_type, department_id } = req.query;
    
    let query = `
      SELECT t.*, u.name as creator_name, d.name as department_name
      FROM report_templates t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE t.institution_id = ?
    `;
    const params = [req.institutionId];

    if (department_id) {
      query += ' AND (t.department_id = ? OR t.is_default = TRUE)';
      params.push(department_id);
    } else if (req.user.department_id) {
      query += ' AND (t.department_id = ? OR t.is_default = TRUE)';
      params.push(req.user.department_id);
    }

    if (template_type) {
      query += ' AND t.template_type = ?';
      params.push(template_type);
    }

    query += ' ORDER BY t.is_default DESC, t.name ASC';

    const [templates] = await db.query(query, params);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get department curriculum
router.get('/curriculum', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const { department_id, academic_year } = req.query;
    
    let query = `
      SELECT c.*, d.name as department_name, r.title as syllabus_title
      FROM department_curriculum c
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN teacher_resources r ON c.syllabus_file_id = r.id
      WHERE c.institution_id = ?
    `;
    const params = [req.institutionId];

    if (department_id) {
      query += ' AND c.department_id = ?';
      params.push(department_id);
    } else if (req.user.department_id) {
      query += ' AND c.department_id = ?';
      params.push(req.user.department_id);
    }

    if (academic_year) {
      query += ' AND c.academic_year = ?';
      params.push(academic_year);
    }

    query += ' ORDER BY c.academic_year DESC, c.semester, c.course_code';

    const [curriculum] = await db.query(query, params);
    res.json(curriculum);
  } catch (error) {
    console.error('Error fetching curriculum:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get department info
router.get('/department-info', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const { department_id, info_type } = req.query;
    
    let query = `
      SELECT di.*, u.name as creator_name, d.name as department_name
      FROM department_info di
      LEFT JOIN users u ON di.created_by = u.id
      LEFT JOIN departments d ON di.department_id = d.id
      WHERE di.institution_id = ?
    `;
    const params = [req.institutionId];

    if (department_id) {
      query += ' AND di.department_id = ?';
      params.push(department_id);
    } else if (req.user.department_id) {
      query += ' AND di.department_id = ?';
      params.push(req.user.department_id);
    }

    if (info_type) {
      query += ' AND di.info_type = ?';
      params.push(info_type);
    }

    query += ' ORDER BY di.is_pinned DESC, di.created_at DESC';

    const [info] = await db.query(query, params);
    res.json(info);
  } catch (error) {
    console.error('Error fetching department info:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get department members (teachers)
router.get('/department-members', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const { department_id } = req.query;
    const deptId = department_id || req.user.department_id;

    if (!deptId) {
      return res.status(400).json({ error: 'Department ID required' });
    }

    const [members] = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.avatar, u.created_at,
              d.name as department_name, d.code as department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.institution_id = ? AND u.department_id = ? AND u.role IN ('teacher', 'admin')
       ORDER BY u.role DESC, u.name ASC`,
      [req.institutionId, deptId]
    );

    res.json(members);
  } catch (error) {
    console.error('Error fetching department members:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Download resource
router.get('/:id/download', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const [resources] = await db.query(
      'SELECT * FROM teacher_resources WHERE id = ? AND institution_id = ?',
      [req.params.id, req.institutionId]
    );

    if (resources.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const resource = resources[0];

    // Log access
    await db.query(
      'INSERT INTO resource_access_logs (resource_id, user_id, action) VALUES (?, ?, ?)',
      [resource.id, req.user.id, 'download']
    );

    // Increment download count
    await db.query(
      'UPDATE teacher_resources SET download_count = download_count + 1 WHERE id = ?',
      [resource.id]
    );

    res.download(resource.file_path, resource.title + path.extname(resource.file_path));
  } catch (error) {
    console.error('Error downloading resource:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete resource
router.delete('/:id', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const [resources] = await db.query(
      'SELECT * FROM teacher_resources WHERE id = ? AND institution_id = ? AND uploaded_by = ?',
      [req.params.id, req.institutionId, req.user.id]
    );

    if (resources.length === 0) {
      return res.status(404).json({ error: 'Resource not found or access denied' });
    }

    const resource = resources[0];

    // Delete file from filesystem
    try {
      await fs.unlink(resource.file_path);
    } catch (err) {
      console.error('Error deleting file:', err);
    }

    // Delete from database
    await db.query('DELETE FROM teacher_resources WHERE id = ?', [req.params.id]);

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
