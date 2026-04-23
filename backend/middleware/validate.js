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
      const message = result.error.errors[0]?.message || 'Invalid request body';
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
  password:      z.string().min(8, 'Password must be at least 8 characters'),
  role:          z.enum(['teacher', 'student'], { message: 'Role must be teacher or student' }),
  institutionId: z.string().uuid('Invalid institution ID'),
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
  institutionId: z.string().uuid('Invalid institution ID'),
  email:         z.string().email().optional(),
  phone:         z.string().optional(),
}).refine(d => d.email || d.phone, { message: 'Email or phone is required' });

const createGroupSchema = z.object({
  name:        z.string().min(1, 'Name is required'),
  subject:     z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
});

const createDueSchema = z.object({
  title:       z.string().min(1, 'Title is required'),
  due_date:    z.string().min(1, 'Due date is required'),
  description: z.string().optional(),
  category:    z.string().optional(),
});

const createAssignmentSchema = z.object({
  title:         z.string().min(1, 'Title is required'),
  due_date:      z.string().min(1, 'Due date is required'),
  description:   z.string().optional(),
  allow_offline: z.boolean().optional(),
});

const createQuizSchema = z.object({
  title:         z.string().min(1, 'Title is required'),
  duration_mins: z.coerce.number().int().positive('Duration must be a positive number'),
  starts_at:     z.string().min(1, 'Start time is required'),
  ends_at:       z.string().min(1, 'End time is required'),
  description:   z.string().optional(),
  show_score:    z.boolean().optional(),
  questions:     z.array(z.object({
    question:      z.string().min(1),
    options:       z.array(z.string()).min(2),
    correct_index: z.number().int().min(0),
  })).optional(),
}).refine(d => new Date(d.ends_at) > new Date(d.starts_at), {
  message: 'ends_at must be after starts_at',
  path: ['ends_at'],
});

const createAnnouncementSchema = z.object({
  title:        z.string().min(1, 'Title is required'),
  content:      z.string().min(1, 'Content is required'),
  tag:          z.string().optional(),
  scheduled_at: z.string().optional(),
});

module.exports = {
  validate,
  schemas: {
    register:           registerSchema,
    login:              loginSchema,
    createGroup:        createGroupSchema,
    createDue:          createDueSchema,
    createAssignment:   createAssignmentSchema,
    createQuiz:         createQuizSchema,
    createAnnouncement: createAnnouncementSchema,
  },
};
