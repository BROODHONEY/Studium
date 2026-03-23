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
                users!sender_id (id, name, avatar_url),
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
      socket.to(groupId).emit('user_typing', { userId: socket.user.id });
    });

    socket.on('typing_stop', ({ groupId }) => {
      socket.to(groupId).emit('user_stopped_typing', { userId: socket.user.id });
    });

    // ── Disconnect ─────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });
};