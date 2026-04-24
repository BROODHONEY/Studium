const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { sendEmail } = require('../config/email');

// Verify institution exists
router.get('/verify/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    const { data: institutions, error } = await db
      .from('institutions')
      .select('id, name, subdomain, status, allowed_email_domain')
      .eq('subdomain', subdomain)
      .eq('status', 'active')
      .limit(1);

    if (error) throw error;

    if (!institutions || institutions.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const inst = institutions[0];
    res.json({
      institutionId: inst.id,
      name: inst.name,
      subdomain: inst.subdomain,
      allowedEmailDomain: inst.allowed_email_domain || null
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

// Check if institution code is available
router.post('/check-code', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || code.length !== 6) {
      return res.status(400).json({ error: 'Code must be exactly 6 characters' });
    }

    const { data: existing, error } = await db
      .from('institutions')
      .select('id')
      .eq('subdomain', code.toLowerCase())
      .limit(1);

    if (error) throw error;

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Code already taken' });
    }

    res.json({ available: true });
  } catch (error) {
    console.error('Error checking code:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Onboard new institution with payment
router.post('/onboard', async (req, res) => {
  try {
    const {
      name,
      code,
      adminEmail,
      adminName,
      adminPassword,
      phone,
      address,
      studentCount,
      plan,
      billingCycle,
      allowedEmailDomain
    } = req.body;

    console.log('Onboarding request received:', { name, code, adminEmail, adminName, plan, billingCycle });

    // Validate required fields
    if (!name || !code || !adminEmail || !adminName || !adminPassword || !plan || !billingCycle) {
      console.error('Missing required fields:', { name, code, adminEmail, adminName, adminPassword: !!adminPassword, plan, billingCycle });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate and normalize email domain
    let normalizedDomain = null;
    if (allowedEmailDomain && allowedEmailDomain.trim()) {
      normalizedDomain = allowedEmailDomain.trim().toLowerCase();
      if (!normalizedDomain.startsWith('@')) normalizedDomain = `@${normalizedDomain}`;
      if (!/^@[a-z0-9.-]+\.[a-z]{2,}$/.test(normalizedDomain)) {
        return res.status(400).json({ error: 'Invalid email domain format (e.g. @xyz.edu.in)' });
      }
      // Check domain uniqueness
      const { data: domainExists } = await db
        .from('institutions')
        .select('id')
        .eq('allowed_email_domain', normalizedDomain)
        .limit(1);
      if (domainExists && domainExists.length > 0) {
        return res.status(409).json({ error: 'This email domain is already registered to another institution' });
      }
    }

    if (code.length !== 6) {
      return res.status(400).json({ error: 'Code must be exactly 6 characters' });
    }

    if (adminPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if code is still available
    const { data: existing, error: checkError } = await db
      .from('institutions')
      .select('id')
      .eq('subdomain', code.toLowerCase())
      .limit(1);

    if (checkError) {
      console.error('Error checking code:', checkError);
      throw checkError;
    }

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Code already taken' });
    }

    // Check if admin email already exists
    const { data: existingUser, error: userCheckError } = await db
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .limit(1);

    if (userCheckError) {
      console.error('Error checking user:', userCheckError);
      throw userCheckError;
    }

    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({ error: 'Admin email already exists' });
    }

    console.log('Creating institution...');

    // Create institution
    const { data: institution, error: createError } = await db
      .from('institutions')
      .insert({
        name,
        subdomain: code.toLowerCase(),
        contact_email: adminEmail,
        contact_name: adminName,
        phone: phone || null,
        address: address || null,
        student_count: studentCount ? parseInt(studentCount) : null,
        plan,
        billing_cycle: billingCycle,
        status: 'active',
        allowed_email_domain: normalizedDomain
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating institution:', createError);
      throw createError;
    }

    console.log('Institution created:', institution.id);
    console.log('Creating admin user...');

    // Hash password and create admin user
    const password_hash = await bcrypt.hash(adminPassword, 10);

    const { data: adminUser, error: adminError } = await db
      .from('users')
      .insert({
        name: adminName,
        email: adminEmail,
        password_hash,
        role: 'admin',
        institution_id: institution.id,
        email_verified: true
      })
      .select('id, name, email, role, institution_id')
      .single();

    if (adminError) {
      console.error('Error creating admin user:', adminError);
      throw adminError;
    }

    console.log('Admin user created:', adminUser.id);

    // Send welcome email (optional)
    try {
      await sendEmail('institutionWelcome', {
        institutionName: name,
        contactName: adminName,
        email: adminEmail,
        code: code.toUpperCase(),
        plan,
        billingCycle
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email fails
    }

    console.log('Onboarding completed successfully');

    res.status(201).json({
      success: true,
      institutionId: institution.id,
      code: code.toLowerCase(),
      adminUserId: adminUser.id,
      message: 'Institution and admin account created successfully'
    });
  } catch (error) {
    console.error('Error onboarding institution:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Server error', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Delete demo request
router.delete('/demo-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await db
      .from('demo_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Demo request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting demo request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete institution (cascade delete all related data)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify institution exists
    const { data: institution, error: fetchError } = await db
      .from('institutions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !institution) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    // Delete in order (respecting foreign key constraints)
    // Note: If you have ON DELETE CASCADE set up in your database, 
    // you only need to delete the institution and everything else will cascade.
    // Otherwise, delete in this order:

    // 1. Delete all reactions (depends on messages/announcements)
    await db.from('reactions').delete().eq('institution_id', id);

    // 2. Delete all submissions
    await db.from('assignment_submissions').delete().eq('institution_id', id);

    // 3. Delete all assignments
    await db.from('assignments').delete().eq('institution_id', id);

    // 4. Delete all quiz attempts
    await db.from('quiz_attempts').delete().eq('institution_id', id);

    // 5. Delete all quizzes
    await db.from('quizzes').delete().eq('institution_id', id);

    // 6. Delete all dues
    await db.from('dues').delete().eq('institution_id', id);

    // 7. Delete all files
    await db.from('files').delete().eq('institution_id', id);

    // 8. Delete all messages
    await db.from('messages').delete().eq('institution_id', id);

    // 9. Delete all announcements
    await db.from('announcements').delete().eq('institution_id', id);

    // 10. Delete all group members
    await db.from('group_members').delete().eq('institution_id', id);

    // 11. Delete all groups
    await db.from('groups').delete().eq('institution_id', id);

    // 12. Delete all DM messages
    await db.from('dm_messages').delete().eq('institution_id', id);

    // 13. Delete all DM conversations
    await db.from('dm_conversations').delete().eq('institution_id', id);

    // 14. Delete all teacher resources
    await db.from('teacher_resources').delete().eq('institution_id', id);

    // 15. Delete all resource folders
    await db.from('resource_folders').delete().eq('institution_id', id);

    // 16. Delete all selection groups
    await db.from('teacher_selection_groups').delete().eq('institution_id', id);

    // 17. Delete all departments
    await db.from('departments').delete().eq('institution_id', id);

    // 18. Delete all users
    await db.from('users').delete().eq('institution_id', id);

    // 19. Finally, delete the institution
    const { error: deleteError } = await db
      .from('institutions')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({
      success: true,
      message: `Institution "${institution.name}" and all related data deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting institution:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
