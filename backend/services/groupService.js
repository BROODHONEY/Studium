const supabase = require('../config/db');

/**
 * Returns the group_members row for a user in a group, or null if not a member.
 * @param {string} groupId
 * @param {string} userId
 * @returns {Promise<{role: string}|null>}
 */
async function getMembership(groupId, userId) {
  const { data } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();
  return data || null;
}

/**
 * Emits a system message to a group room and persists it to the DB.
 * @param {object} io - Socket.io server instance
 * @param {string} groupId
 * @param {string} content
 * @param {'join'|'leave'|'kick'} subtype
 */
async function emitSystemMessage(io, groupId, content, subtype) {
  const { data: savedMsg } = await supabase
    .from('messages')
    .insert({ group_id: groupId, sender_id: null, content, type: 'system' })
    .select('id, content, type, created_at')
    .single();

  if (io && savedMsg) {
    io.to(groupId).emit('system_message', {
      id: savedMsg.id,
      type: 'system',
      subtype,
      text: savedMsg.content,
      timestamp: savedMsg.created_at,
    });
  }
}

module.exports = { getMembership, emitSystemMessage };
