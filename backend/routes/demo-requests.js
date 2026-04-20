const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../config/email');

// Get all demo requests (for admin dashboard)
router.get('/all', async (req, res) => {
  try {
    const { data: requests, error } = await db
      .from('demo_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(requests || []);
  } catch (error) {
    console.error('Error fetching demo requests:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit demo request
router.post('/', async (req, res) => {
  try {
    const { institutionName, contactName, email, phone, studentCount, message } = req.body;
    
    // Validate required fields
    if (!institutionName || !contactName || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Store in database
    const { data: demoRequest, error: dbError } = await db
      .from('demo_requests')
      .insert({
        institution_name: institutionName,
        contact_name: contactName,
        email,
        phone,
        student_count: studentCount ? parseInt(studentCount) : null,
        message: message || null,
        status: 'pending'
      })
      .select()
      .single();
    
    if (dbError) throw dbError;
    
    // Generate admin approval token (valid for 30 days)
    const approvalToken = jwt.sign(
      { demoRequestId: demoRequest.id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Send email notification with approval link
    const result = await sendEmail('demoRequest', {
      institutionName,
      contactName,
      email,
      phone,
      studentCount,
      message,
      approvalToken
    });
    
    if (result.success) {
      res.status(201).json({ 
        message: 'Demo request submitted successfully',
        previewUrl: result.previewUrl // For development/testing
      });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Error processing demo request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
