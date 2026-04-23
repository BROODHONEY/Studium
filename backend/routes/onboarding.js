const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../config/email');

// Verify admin approval token and get demo request details
router.get('/admin/review/:token', async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    
    const { data: request, error } = await db
      .from('demo_requests')
      .select('*')
      .eq('id', decoded.demoRequestId)
      .single();
    
    if (error || !request) {
      return res.status(404).json({ error: 'Demo request not found' });
    }
    
    res.json({
      valid: true,
      request: {
        id: request.id,
        institutionName: request.institution_name,
        contactName: request.contact_name,
        email: request.email,
        phone: request.phone,
        studentCount: request.student_count,
        message: request.message,
        status: request.status,
        createdAt: request.created_at
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Approve demo request
router.post('/admin/approve', async (req, res) => {
  try {
    const { token, adminMessage } = req.body;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { data: request, error } = await db
      .from('demo_requests')
      .select('*')
      .eq('id', decoded.demoRequestId)
      .single();
    
    if (error || !request) {
      return res.status(404).json({ error: 'Demo request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }
    
    // Generate onboarding token (valid for 7 days)
    const onboardingToken = jwt.sign(
      {
        demoRequestId: request.id,
        email: request.email,
        institutionName: request.institution_name,
        contactName: request.contact_name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Update demo request status
    await db
      .from('demo_requests')
      .update({ 
        status: 'approved',
        admin_message: adminMessage
      })
      .eq('id', decoded.demoRequestId);
    
    // Send approval email
    await sendEmail('demoApproved', {
      email: request.email,
      contactName: request.contact_name,
      institutionName: request.institution_name,
      adminMessage,
      token: onboardingToken
    });
    
    res.json({ 
      success: true, 
      message: 'Demo request approved and email sent'
    });
  } catch (error) {
    console.error('Error approving demo request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject demo request
router.post('/admin/reject', async (req, res) => {
  try {
    const { token, adminMessage } = req.body;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { data: request, error } = await db
      .from('demo_requests')
      .select('*')
      .eq('id', decoded.demoRequestId)
      .single();
    
    if (error || !request) {
      return res.status(404).json({ error: 'Demo request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }
    
    // Update demo request status
    await db
      .from('demo_requests')
      .update({ 
        status: 'rejected',
        admin_message: adminMessage
      })
      .eq('id', decoded.demoRequestId);
    
    // Send rejection email
    await sendEmail('demoRejected', {
      email: request.email,
      contactName: request.contact_name,
      institutionName: request.institution_name,
      adminMessage
    });
    
    res.json({ 
      success: true, 
      message: 'Demo request rejected and email sent'
    });
  } catch (error) {
    console.error('Error rejecting demo request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate onboarding token (legacy - kept for backward compatibility)
router.post('/generate-token', async (req, res) => {
  try {
    const { demoRequestId } = req.body;
    
    // Get demo request details
    const { data: request, error } = await db
      .from('demo_requests')
      .select('*')
      .eq('id', demoRequestId)
      .single();
    
    if (error || !request) {
      return res.status(404).json({ error: 'Demo request not found' });
    }
    
    // Generate token (valid for 7 days)
    const token = jwt.sign(
      {
        demoRequestId: request.id,
        email: request.email,
        institutionName: request.institution_name,
        contactName: request.contact_name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Send package selection email
    await sendEmail('packageSelection', {
      email: request.email,
      contactName: request.contact_name,
      institutionName: request.institution_name,
      token
    });
    
    // Update demo request status
    await db
      .from('demo_requests')
      .update({ status: 'contacted' })
      .eq('id', demoRequestId);
    
    res.json({ 
      success: true, 
      message: 'Package selection email sent',
      token 
    });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify onboarding token
router.get('/verify-token/:token', async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    
    // Check if institution already created
    const { data: existing, error } = await db
      .from('institutions')
      .select('id')
      .eq('contact_email', decoded.email)
      .limit(1);
    
    if (error) throw error;
    
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Institution already created' });
    }
    
    res.json({
      valid: true,
      data: {
        email: decoded.email,
        institutionName: decoded.institutionName,
        contactName: decoded.contactName,
        demoRequestId: decoded.demoRequestId
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Create institution after payment
router.post('/create-institution', async (req, res) => {
  try {
    const { token, subdomain, plan, paymentId } = req.body;
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validate subdomain
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain)) {
      return res.status(400).json({ error: 'Invalid subdomain format' });
    }
    
    // Check if subdomain exists
    const { data: existing, error: checkError } = await db
      .from('institutions')
      .select('id')
      .eq('subdomain', subdomain)
      .limit(1);
    
    if (checkError) throw checkError;
    
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Subdomain already taken' });
    }
    
    // Create institution
    const { data: institution, error } = await db
      .from('institutions')
      .insert({
        name: decoded.institutionName,
        subdomain,
        contact_email: decoded.email,
        plan,
        status: 'active'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update demo request
    await db
      .from('demo_requests')
      .update({ status: 'converted' })
      .eq('id', decoded.demoRequestId);
    
    // Send confirmation email
    await sendEmail('institutionCreated', {
      email: decoded.email,
      contactName: decoded.contactName,
      institutionName: decoded.institutionName,
      subdomain,
      plan
    });
    
    res.status(201).json({
      success: true,
      institutionId: institution.id,
      subdomain,
      message: 'Institution created successfully'
    });
  } catch (error) {
    console.error('Error creating institution:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Mock payment processing — REPLACE with real payment gateway (Stripe/Razorpay) before production
router.post('/process-payment', async (req, res) => {
  try {
    const { plan, token } = req.body;
    
    // Verify token
    jwt.verify(token, process.env.JWT_SECRET);
    
    // Mock payment amounts
    const prices = {
      basic: 999,
      premium: 2999,
      enterprise: 9999
    };
    
    // Simulate payment processing
    const paymentId = 'PAY_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // In production, integrate with Stripe, PayPal, Razorpay, etc.
    
    res.json({
      success: true,
      paymentId,
      amount: prices[plan] || 0,
      plan,
      message: 'Payment processed successfully (MOCK)'
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

module.exports = router;
