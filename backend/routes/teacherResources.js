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
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Get all folders for a department
router.get('/folders', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const { departmentId } = req.query;
    
    let query = `
      SELECT rf.*, u.name as creator_name
      FROM resource_folders rf
      LEFT JOIN users u ON rf.created_by = u.id
      WHERE rf.institution_id = ?
    `;
    const params = [req.institutionId];
    
    if (departmentId) {
      query += ' AND rf.department_id = ?';
      params.push(departmentId);
    }
    
    query += ' ORDER BY rf.name ASC';
    
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
    const { name, description, departmentId, parentFolderId } = req.body;
    
    const [result] = await db.query(
      `INSERT INTO resource_folders 
       (institution_id, department_id, parent_folder_id, name, description, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.institutionId, departmentId || null, parentFolderId || null, name, description, req.user.id]
    );
    
    res.status(201).json({ folderId: result.insertId, message: 'Folder created' });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all resources
router.get('/resources', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const { departmentId, folderId, resourceType, category } = req.query;
    
    let query = `
      SELECT tr.*, u.name as uploader_name, d.name as department_name
      FROM teacher_resources tr
      LEFT JOIN users u ON tr.uploaded_by = u.id
      LEFT JOIN departments d ON tr.department_id = d.id
      WHERE tr.institution_id = ?
    `;
    const params = [req.institutionId];
    
    if (departmentId) {
      query += ' AND tr.department_id = ?';
      params.push(departmentId);
    }
    
    if (folderId) {
      query += ' AND tr.folder_id = ?';
      params.push(folderId);
    }
    
    if (resourceType) {
      query += ' AND tr.resource_type = ?';
      params.push(resourceType);
    }
    
    if (category) {
      query += ' AND tr.category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY tr.created_at DESC';
    
    const [resources] = await db.query(query, params);
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload resource
router.post('/resources', authenticate, tenantMiddleware, requireTenant, upload.single('file'), async (req, res) => {
  try {
    const { title, description, departmentId, folderId, resourceType, category, tags, isPublic } = req.body;
    
    const filePath = req.file ? `/uploads/resources/${req.file.filename}` : null;
    const fileType = req.file ? req.file.mimetype : null;
    const fileSize = req.file ? req.file.size : null;
    
    const [result] = await db.query(
      `INSERT INTO teacher_resources 
       (institution_id, department_id, uploaded_by, title, description, file_path, 
        file_type, file_size, resource_type, category, tags, folder_id, is_public) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.institutionId,
        departmentId || null,
        req.user.id,
        title,
        description,
        filePath,
        fileType,
        fileSize,
        resourceType || 'other',
        category || null,
        tags ? JSON.stringify(tags) : null,
        folderId || null,
        isPublic === 'true' || isPublic === true
      ]
    );
    
    res.status(201).json({ resourceId: result.insertId, message: 'Resource uploaded' });
  } catch (error) {
    console.error('Error uploading resource:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Download resource
router.get('/resources/:id/download', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const [resources] = await db.query(
      'SELECT * FROM teacher_resources WHERE id = ? AND institution_id = ?',
      [req.params.id, req.institutionId]
    );
    
    if (resources.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    const resource = resources[0];
    
    // Increment download count
    await db.query(
      'UPDATE teacher_resources SET download_count = download_count + 1 WHERE id = ?',
      [req.params.id]
    );
    
    const filePath = path.join(__dirname, '..', resource.file_path);
    res.download(filePath);
  } catch (error) {
    console.error('Error downloading resource:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete resource
router.delete('/resources/:id', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const [resources] = await db.query(
      'SELECT * FROM teacher_resources WHERE id = ? AND institution_id = ? AND uploaded_by = ?',
      [req.params.id, req.institutionId, req.user.id]
    );
    
    if (resources.length === 0) {
      return res.status(404).json({ error: 'Resource not found or unauthorized' });
    }
    
    // Delete file from filesystem
    if (resources[0].file_path) {
      const filePath = path.join(__dirname, '..', resources[0].file_path);
      await fs.unlink(filePath).catch(() => {});
    }
    
    await db.query('DELETE FROM teacher_resources WHERE id = ?', [req.params.id]);
    
    res.json({ message: 'Resource deleted' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get department curriculum
router.get('/curriculum', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const { departmentId } = req.query;
    
    if (!departmentId) {
      return res.status(400).json({ error: 'Department ID required' });
    }
    
    const [curriculum] = await db.query(
      `SELECT * FROM department_curriculum 
       WHERE department_id = ? 
       ORDER BY academic_year DESC, semester DESC`,
      [departmentId]
    );
    
    res.json(curriculum);
  } catch (error) {
    console.error('Error fetching curriculum:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get department info
router.get('/department-info', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const { departmentId } = req.query;
    
    if (!departmentId) {
      return res.status(400).json({ error: 'Department ID required' });
    }
    
    const [info] = await db.query(
      `SELECT di.*, u.name as creator_name
       FROM department_info di
       LEFT JOIN users u ON di.created_by = u.id
       WHERE di.department_id = ?
       ORDER BY di.is_pinned DESC, di.created_at DESC`,
      [departmentId]
    );
    
    res.json(info);
  } catch (error) {
    console.error('Error fetching department info:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get department members (teachers)
router.get('/department-members', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const { departmentId } = req.query;
    
    if (!departmentId) {
      return res.status(400).json({ error: 'Department ID required' });
    }
    
    const [members] = await db.query(
      `SELECT id, name, email, role, profile_picture, created_at
       FROM users
       WHERE department_id = ? AND institution_id = ? AND role IN ('teacher', 'admin')
       ORDER BY name ASC`,
      [departmentId, req.institutionId]
    );
    
    res.json(members);
  } catch (error) {
    console.error('Error fetching department members:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get report templates
router.get('/templates', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const { departmentId, templateType } = req.query;
    
    let query = `
      SELECT rt.*, u.name as creator_name
      FROM report_templates rt
      LEFT JOIN users u ON rt.created_by = u.id
      WHERE rt.institution_id = ? AND rt.is_active = TRUE
    `;
    const params = [req.institutionId];
    
    if (departmentId) {
      query += ' AND (rt.department_id = ? OR rt.department_id IS NULL)';
      params.push(departmentId);
    }
    
    if (templateType) {
      query += ' AND rt.template_type = ?';
      params.push(templateType);
    }
    
    query += ' ORDER BY rt.created_at DESC';
    
    const [templates] = await db.query(query, params);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
