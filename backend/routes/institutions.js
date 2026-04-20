const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { sendEmail } = require('../config/email');

// Verify institution exists
router.get('/verify/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    const { data: institutions, error } = await db
      .from('institutions')
      .select('id, name, subdomain, status')
      .eq('subdomain', subdomain)
      .eq('status', 'active')
      .limit(1);

    if (error) throw error;

    if (!institutions || institutions.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    res.json({
      institutionId: institutions[0].id,
      name: institutions[0].name,
      subdomain: institutions[0].subdomain
    });
  } catch (error) {
    console.error('Error verifying institution:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create demo request
router.post('/demo-requests', async (req, res) => {
  try {
    const { institutionName, contactName, email, phone, studentCount, message } = req.body;

    const { data, error } = await db
      .from('demo_requests')
      .insert({
        institution_name: institutionName,
        contact_name: contactName,
        email,
        phone,
        student_count: studentCount || null,
        message: message || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Send email notification
    await sendEmail('demoRequest', {
      institutionName,
      contactName,
      email,
      phone,
      studentCount,
      message
    });

    res.status(201).json({ 
      success: true,
      demoRequestId: data.id,
      message: 'Demo request submitted successfully' 
    });
  } catch (error) {
    console.error('Error creating demo request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get all demo requests
router.get('/demo-requests', async (req, res) => {
  try {
    const { data: requests, error } = await db
      .from('demo_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching demo requests:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Create new institution
router.post('/create', async (req, res) => {
  try {
    const { name, subdomain, contactEmail, plan } = req.body;

    // Check if subdomain already exists
    const { data: existing, error: checkError } = await db
      .from('institutions')
      .select('id')
      .eq('subdomain', subdomain)
      .limit(1);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Subdomain already exists' });
    }

    const { data, error } = await db
      .from('institutions')
      .insert({
        name,
        subdomain,
        contact_email: contactEmail,
        plan: plan || 'basic',
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      institutionId: data.id,
      message: 'Institution created successfully'
    });
  } catch (error) {
    console.error('Error creating institution:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all institutions (for admin dashboard)
router.get('/', async (req, res) => {
  try {
    const { data: institutions, error } = await db
      .from('institutions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    res.json(institutions || []);
  } catch (error) {
    console.error('Error fetching institutions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update institution status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data, error } = await db
      .from('institutions')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ 
      success: true, 
      message: 'Institution status updated',
      institution: data
    });
  } catch (error) {
    console.error('Error updating institution status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update institution plan
router.patch('/:id/plan', async (req, res) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;

    if (!['basic', 'premium', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const { data, error } = await db
      .from('institutions')
      .update({ plan })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ 
      success: true, 
      message: 'Institution plan updated',
      institution: data
    });
  } catch (error) {
    console.error('Error updating institution plan:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
