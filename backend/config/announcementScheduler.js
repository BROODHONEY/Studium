const supabase = require('./db');

/**
 * Polls every 30 seconds for scheduled announcements that are due,
 * marks them published, and broadcasts via socket.
 */
function startAnnouncementScheduler(io) {
  const publish = async () => {
    try {
      const now = new Date().toISOString();

      const { data: due, error } = await supabase
        .from('announcements')
        .select('id, group_id, title, content, tag, scheduled_at, created_at, users!created_by (id, name)')
        .eq('published', false)
        .lte('scheduled_at', now);

      if (error || !due?.length) return;

      const ids = due.map(a => a.id);
      await supabase.from('announcements').update({ published: true }).in('id', ids);

      due.forEach(a => {
        const published = { ...a, published: true };
        io.to(a.group_id).emit('new_announcement', published);
      });
    } catch (err) {
      console.error('[scheduler] announcement error:', err.message);
    }
  };

  // Run immediately on start, then every 30s
  publish();
  setInterval(publish, 30_000);
}

module.exports = startAnnouncementScheduler;
