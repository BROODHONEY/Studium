const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const messageRoutes = require('./routes/messages');
const fileRoutes = require('./routes/files');
const initSocket = require('./config/socket');
const startAnnouncementScheduler = require('./config/announcementScheduler');

const announcementRoutes = require('./routes/announcements');
const dueRoutes          = require('./routes/dues');
const dmRoutes = require('./routes/dm');
const userRoutes = require('./routes/users');
const searchRoutes = require('./routes/search');
const submissionRoutes   = require('./routes/submissions');
const quizRoutes         = require('./routes/quizzes');
const teacherRoutes      = require('./routes/teacher');
const institutionRoutes  = require('./routes/institutions');
const departmentRoutes   = require('./routes/departments');
const teacherResourceRoutes = require('./routes/teacherResources');
const onboardingRoutes   = require('./routes/onboarding');
const demoRequestRoutes  = require('./routes/demo-requests');


const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean);


const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

app.use(
  cors({
    origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }},
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  })
);

app.use(express.json());

// Basic request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/demo-requests', demoRequestRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/departments', departmentRoutes);
app.use('/api/teacher-resources', teacherResourceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/dues', dueRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/teacher', teacherRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Studi+ API is running' });
});

// Centralized error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Initialize Socket.io
initSocket(io);
startAnnouncementScheduler(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));