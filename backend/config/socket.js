const jwt = require('jsonwebtoken');
const supabase = require('./db');

module.exports = (io) => {

  // ── Auth middleware for sockets ──────────────────────
  // Every socket connection must send a valid JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // attach user info to the socket
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`);

    // Track user's socket by userId for direct messaging
    io.userSockets = io.userSockets || new Map();
    io.userSockets.set(socket.user.id, socket.id);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
      io.userSockets?.delete(socket.user.id);
    });

   socket.on('join_group', async (groupId) => {
    try {
      const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', socket.user.id)
        .single();

      if (!membership) {
        socket.emit('error', { message: 'You are not a member of this group' });
        return;
      }

      socket.join(groupId);

    } catch (err) {
      console.error(err);
      socket.emit('error', { message: 'Could not join room' });
    }

    // ── DM: join personal room ─────────────────────────────
    // Each user joins a room named after their own ID
    // so they can receive DMs from anyone
    socket.join(`user:${socket.user.id}`);

    // Track online users
    const onlineUsers = io.onlineUsers || (io.onlineUsers = new Map());
    onlineUsers.set(socket.user.id, socket.id);
    io.emit('user_online', { userId: socket.user.id });

    // ── DM: send a direct message ──────────────────────────
    socket.on('send_dm', async ({ conversationId, content }) => {
      if (!content?.trim()) return;

      try {
        // Verify sender is part of this conversation
        const { data: convo } = await supabase
          .from('conversations')
          .select('user1_id, user2_id')
          .eq('id', conversationId)
          .single();

        if (!convo ||
          (convo.user1_id !== socket.user.id &&
          convo.user2_id !== socket.user.id)) {
          socket.emit('error', { message: 'Not your conversation' });
          return;
        }

        // Save to DB
        const { data: message, error } = await supabase
          .from('direct_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: socket.user.id,
            content: content.trim()
          })
          .select(`
            id, content, read, created_at,
            sender:sender_id (id, name, avatar_url)
          `)
          .single();

        if (error) throw error;

        // Send to the other user's personal room
        const otherId = convo.user1_id === socket.user.id
          ? convo.user2_id
          : convo.user1_id;

        // Deliver to both sender and receiver
        io.to(`user:${socket.user.id}`)
          .to(`user:${otherId}`)
          .emit('new_dm', { conversationId, message });

      } catch (err) {
        console.error(err);
        socket.emit('error', { message: 'Could not send message' });
      }
    });

    // ── DM: typing indicators ──────────────────────────────
    socket.on('dm_typing_start', ({ conversationId, otherId }) => {
      io.to(`user:${otherId}`).emit('dm_user_typing', {
        conversationId,
        userId: socket.user.id
      });
    });

    socket.on('dm_typing_stop', ({ conversationId, otherId }) => {
      io.to(`user:${otherId}`).emit('dm_user_stopped_typing', {
        conversationId,
        userId: socket.user.id
      });
    });

    // ── Handle disconnect — mark offline ──────────────────
    socket.on('disconnect', () => {
        onlineUsers.delete(socket.user.id);
        io.emit('user_offline', { userId: socket.user.id });
        console.log(`User disconnected: ${socket.user.id}`);
      });
    });

    // ── Leave a group room ─────────────────────────────
    socket.on('leave_group', (groupId) => {
      socket.leave(groupId);
      socket.to(groupId).emit('user_left', {
        userId: socket.user.id,
        timestamp: new Date().toISOString()
      });
    });

    // ── Send a message ─────────────────────────────────
    socket.on('send_message', async ({ groupId, content, type = 'text', fileId = null }) => {
      if (!content && !fileId) return;

      try {
        // Verify membership
        const { data: membership } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', groupId)
          .eq('user_id', socket.user.id)
          .single();

        if (!membership) {
          socket.emit('error', { message: 'You are not a member of this group' });
          return;
        }

        // Check admins_only mode
        const { data: group } = await supabase
          .from('groups')
          .select('admins_only')
          .eq('id', groupId)
          .single();

        if (group?.admins_only && membership.role !== 'admin') {
          socket.emit('error', { message: 'Only admins can send messages right now' });
          return;
        }

        // Save message to DB
        const { data: message, error } = await supabase
            .from('messages')
            .insert({
                group_id: groupId,
                sender_id: socket.user.id,
                content,
                type,
                file_id: fileId
            })
            .select(`
                id, content, type, created_at,
                users!sender_id (id, name, role, roll_no, avatar_url),
                files!file_id (id, filename, file_url, file_type, size_bytes)
            `)
            .single();
            
        if (error) throw error;

        // Broadcast to everyone in the room including sender
        io.to(groupId).emit('new_message', message);
      } catch (err) {
        console.error(err);
        socket.emit('error', { message: 'Could not send message' });
      }
    });

    // ── Typing indicators ──────────────────────────────
    socket.on('typing_start', ({ groupId }) => {
      socket.to(groupId).emit('user_typing', { userId: socket.user.id, userName: socket.user.name });
    });

    socket.on('typing_stop', ({ groupId }) => {
      socket.to(groupId).emit('user_stopped_typing', { userId: socket.user.id });
    });

  });
};