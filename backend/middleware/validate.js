const { z } = require('zod');

/**
 * Returns an Express middleware that validates req.body against a Zod schema.
 * On failure, responds 400 with the first validation error message.
 * @param {z.ZodSchema} schema
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      // Zod v4 uses .issues, v3 used .errors — support both
      const issues = result.error.issues ?? result.error.errors ?? [];
      const message = issues[0]?.message || 'Invalid request body';
      return res.status(400).json({ error: message });
    }
    req.body = result.data; // replace with coerced/parsed values
    next();
  };
}

// ── Schemas ───────────────────────────────────────────

const registerSchema = z.object({
  name:          z.string().min(1, 'Name is required'),
  email:         z.string().email('Invalid email'),
  password:      z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role:          z.enum(['teacher', 'student'], { message: 'Role must be teacher or student' }),
  institutionId: z.uuid('Invalid institution ID'),
  phone:         z.string().optional(),
  roll_no:       z.string().optional(),
  department:    z.string().optional(),
  year:          z.coerce.number().int().min(1).max(4).optional(),
  devBypass:     z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'student') {
    if (!data.roll_no?.trim()) ctx.addIssue({ code: 'custom', path: ['roll_no'], message: 'Roll number is required for students' });
    if (!data.department?.trim()) ctx.addIssue({ code: 'custom', path: ['department'], message: 'Department is required for students' });
    if (!data.year) ctx.addIssue({ code: 'custom', path: ['year'], message: 'Year (1–4) is required for students' });
  }
  if (data.role === 'teacher') {
    if (!data.department?.trim()) ctx.addIssue({ code: 'custom', path: ['department'], message: 'Department is required for teachers' });
  }
});

const loginSchema = z.object({
  password:      z.string().min(1, 'Password is required'),
  institutionId: z.uuid('Invalid institution ID'),
  email:         z.string().email().optional(),
  phone:         z.string().optional(),
}).refine(d => d.email || d.phone, { message: 'Email or phone is required' });

// Password change schema with strong requirements
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(12, 'New password must be at least 12 characters')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'New password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'New password must contain at least one special character'),
});

const createGroupSchema = z.object({
  name:        z.string().min(1, 'Name is required').max(100, 'Name too long'),
  subject:     z.string().min(1, 'Subject is required').max(100, 'Subject too long'),
  description: z.string().max(1000, 'Description too long').optional(),
});

const createDueSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(200, 'Title too long'),
  due_date:    z.string().min(1, 'Due date is required'),
  description: z.string().max(2000, 'Description too long').optional(),
  category:    z.string().max(50, 'Category too long').optional(),
});

const createAssignmentSchema = z.object({
  title:         z.string().min(1, 'Title is required').max(200, 'Title too long'),
  due_date:      z.string().min(1, 'Due date is required'),
  description:   z.string().max(5000, 'Description too long').optional(),
  allow_offline: z.boolean().optional(),
});

const createQuizSchema = z.object({
  title:         z.string().min(1, 'Title is required').max(200, 'Title too long'),
  duration_mins: z.coerce.number().int().positive('Duration must be a positive number').max(300, 'Duration too long'),
  starts_at:     z.string().min(1, 'Start time is required'),
  ends_at:       z.string().min(1, 'End time is required'),
  description:   z.string().max(2000, 'Description too long').optional(),
  show_score:    z.boolean().optional(),
  questions:     z.array(z.object({
    question:      z.string().min(1).max(1000, 'Question too long'),
    options:       z.array(z.string().max(500, 'Option too long')).min(2).max(10, 'Too many options'),
    correct_index: z.number().int().min(0),
  })).max(100, 'Too many questions').optional(),
}).refine(d => new Date(d.ends_at) > new Date(d.starts_at), {
  message: 'ends_at must be after starts_at',
  path: ['ends_at'],
});

const createAnnouncementSchema = z.object({
  title:        z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content:      z.string().min(1, 'Content is required').max(10000, 'Content too long'),
  tag:          z.string().max(50, 'Tag too long').optional(),
  scheduled_at: z.string().optional(),
});

module.exports = {
  validate,
  schemas: {
    register:           registerSchema,
    login:              loginSchema,
    changePassword:     changePasswordSchema,
    createGroup:        createGroupSchema,
    createDue:          createDueSchema,
    createAssignment:   createAssignmentSchema,
    createQuiz:         createQuizSchema,
    createAnnouncement: createAnnouncementSchema,
  },
};
