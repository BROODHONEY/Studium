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


const app = express();
const server = http.createServer(app);
const FRONTEND_ORIGINS = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:5174'];

const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

app.use(
  cors({
    origin: FRONTEND_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  })
);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/dues', dueRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Studi+ API is running' });
});

// Initialize Socket.io
initSocket(io);
startAnnouncementScheduler(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));