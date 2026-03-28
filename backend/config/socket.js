const jwt = require('jsonwebtoken');
const supabase = require('./db');

module.exports = (io) => {
  // ── Auth middleware for sockets ──────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {

    socket.join(`user:${socket.user.id}`);

    io.userSockets = io.userSockets || new Map();
    io.userSockets.set(socket.user.id, socket.id);

    const onlineUsers = io.onlineUsers || (io.onlineUsers = new Map());
    onlineUsers.set(socket.user.id, socket.id);
    io.emit('user_online', { userId: socket.user.id });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.user.id);
      io.userSockets?.delete(socket.user.id);
      io.emit('user_offline', { userId: socket.user.id });
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
    });

    socket.on('leave_group', (groupId) => {
      socket.leave(groupId);
      socket.to(groupId).emit('user_left', {
        userId: socket.user.id,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('send_dm', async ({ conversationId, content, replyTo = null }) => {
      if (!content?.trim()) return;

      try {
        const { data: convo } = await supabase
          .from('conversations')
          .select('user1_id, user2_id')
          .eq('id', conversationId)
          .single();

        if (!convo || (convo.user1_id !== socket.user.id && convo.user2_id !== socket.user.id)) {
          socket.emit('error', { message: 'Not your conversation' });
          return;
        }

        const insertData = {
          conversation_id: conversationId,
          sender_id: socket.user.id,
          content: content.trim()
        };
        if (replyTo) insertData.reply_to = replyTo;

        let message, error;

        // Try with reply_to support first
        if (replyTo) {
          ({ data: message, error } = await supabase
            .from('direct_messages')
            .insert(insertData)
            .select(`
              id, content, read, created_at, reply_to,
              sender:sender_id (id, name, avatar_url),
              replied_message:reply_to (id, content, sender:sender_id (id, name))
            `)
            .single());

          if (error) {
            // Fallback: reply_to column may not exist yet
            delete insertData.reply_to;
            ({ data: message, error } = await supabase
              .from('direct_messages')
              .insert(insertData)
              .select(`id, content, read, created_at, sender:sender_id (id, name, avatar_url)`)
              .single());
          }
        } else {
          ({ data: message, error } = await supabase
            .from('direct_messages')
            .insert(insertData)
            .select(`id, content, read, created_at, sender:sender_id (id, name, avatar_url)`)
            .single());
        }

        if (error) throw error;

        const otherId = convo.user1_id === socket.user.id ? convo.user2_id : convo.user1_id;

        io.to(`user:${socket.user.id}`)
          .to(`user:${otherId}`)
          .emit('new_dm', { conversationId, message });
      } catch (err) {
        console.error(err);
        socket.emit('error', { message: 'Could not send message' });
      }
    });

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

    socket.on('send_message', async ({ groupId, content, type = 'text', fileId = null, replyTo = null }) => {
      if (!content && !fileId) return;

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

        const { data: group } = await supabase
          .from('groups')
          .select('admins_only')
          .eq('id', groupId)
          .single();

        if (group?.admins_only && membership.role !== 'admin') {
          socket.emit('error', { message: 'Only admins can send messages right now' });
          return;
        }

        const insertData = {
          group_id: groupId,
          sender_id: socket.user.id,
          content,
          type,
          file_id: fileId
        };

        if (replyTo) insertData.reply_to = replyTo;

        const { data: message, error } = await supabase
          .from('messages')
          .insert(insertData)
          .select(`
            id, content, type, created_at, reply_to,
            users!sender_id (id, name, role, roll_no, avatar_url),
            files!file_id (id, filename, file_url, file_type, size_bytes),
            replied_message:reply_to (id, content, users!sender_id (id, name))
          `)
          .single();

        if (error) throw error;

        io.to(groupId).emit('new_message', { ...message, group_id: groupId });
      } catch (err) {
        console.error(err);
        socket.emit('error', { message: 'Could not send message' });
      }
    });

    socket.on('typing_start', ({ groupId }) => {
      socket.to(groupId).emit('user_typing', { userId: socket.user.id, userName: socket.user.name });
    });

    socket.on('typing_stop', ({ groupId }) => {
      socket.to(groupId).emit('user_stopped_typing', { userId: socket.user.id });
    });
  });
};
