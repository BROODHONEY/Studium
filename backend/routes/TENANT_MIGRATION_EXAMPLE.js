// EXAMPLE: How to migrate existing routes to be tenant-aware

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticate = require('../middleware/auth');
const { tenantMiddleware, requireTenant } = require('../middleware/tenant');

// ============================================
// BEFORE: Non-tenant-aware route
// ============================================
/*
router.get('/groups', authenticate, async (req, res) => {
  try {
    const [groups] = await db.query(
      'SELECT * FROM groups WHERE id IN (SELECT group_id FROM group_members WHERE user_id = ?)',
      [req.user.id]
    );
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
*/

// ============================================
// AFTER: Tenant-aware route
// ============================================
router.get('/groups', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    // Now queries automatically filter by institution_id
    const [groups] = await db.query(
      `SELECT g.* FROM groups g
       INNER JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = ? AND g.institution_id = ?`,
      [req.user.id, req.institutionId]
    );
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// BEFORE: Creating a new record
// ============================================
/*
router.post('/groups', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    const [result] = await db.query(
      'INSERT INTO groups (name, description, created_by) VALUES (?, ?, ?)',
      [name, description, req.user.id]
    );
    res.status(201).json({ groupId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
*/

// ============================================
// AFTER: Creating with institution_id
// ============================================
router.post('/groups', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Always include institution_id when creating records
    const [result] = await db.query(
      'INSERT INTO groups (name, description, created_by, institution_id) VALUES (?, ?, ?, ?)',
      [name, description, req.user.id, req.institutionId]
    );
    
    res.status(201).json({ groupId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// BEFORE: Updating a record
// ============================================
/*
router.put('/groups/:id', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    await db.query(
      'UPDATE groups SET name = ?, description = ? WHERE id = ?',
      [name, description, req.params.id]
    );
    res.json({ message: 'Updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
*/

// ============================================
// AFTER: Updating with institution check
// ============================================
router.put('/groups/:id', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Verify the group belongs to the user's institution before updating
    const [result] = await db.query(
      'UPDATE groups SET name = ?, description = ? WHERE id = ? AND institution_id = ?',
      [name, description, req.params.id, req.institutionId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Group not found or access denied' });
    }
    
    res.json({ message: 'Updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// BEFORE: Deleting a record
// ============================================
/*
router.delete('/groups/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM groups WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
*/

// ============================================
// AFTER: Deleting with institution check
// ============================================
router.delete('/groups/:id', authenticate, tenantMiddleware, requireTenant, async (req, res) => {
  try {
    // Only delete if it belongs to the user's institution
    const [result] = await db.query(
      'DELETE FROM groups WHERE id = ? AND institution_id = ?',
      [req.params.id, req.institutionId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Group not found or access denied' });
    }
    
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// KEY POINTS FOR MIGRATION:
// ============================================
/*
1. Add middleware chain: authenticate → tenantMiddleware → requireTenant

2. Always include institution_id in WHERE clauses:
   - SELECT: WHERE institution_id = ?
   - UPDATE: WHERE id = ? AND institution_id = ?
   - DELETE: WHERE id = ? AND institution_id = ?

3. Always include institution_id when INSERTing:
   INSERT INTO table (..., institution_id) VALUES (..., ?)

4. Use req.institutionId from middleware (set by tenantMiddleware)

5. For JOINs, ensure all tables filter by institution_id:
   SELECT * FROM groups g
   INNER JOIN group_members gm ON g.id = gm.group_id
   WHERE g.institution_id = ? AND gm.user_id = ?

6. Check affectedRows after UPDATE/DELETE to ensure record existed
   in the user's institution

7. For user registration, get institution_id from request context:
   const institutionId = req.institutionId || req.body.institutionId;
*/

module.exports = router;
