const supabase = require('../config/db');

/**
 * Gets an existing conversation between two users, or creates one.
 * Always uses sorted user IDs to prevent duplicates.
 * @param {string} userAId
 * @param {string} userBId
 * @returns {Promise<object>} conversation row with user1/user2 joined
 */
async function getOrCreateConversation(userAId, userBId) {
  const [user1_id, user2_id] = [userAId, userBId].sort();

  const SELECT = `
    id, created_at,
    user1:user1_id (id, name, email, role),
    user2:user2_id (id, name, email, role)
  `;

  let { data: convo } = await supabase
    .from('conversations')
    .select(SELECT)
    .eq('user1_id', user1_id)
    .eq('user2_id', user2_id)
    .single();

  if (!convo) {
    const { data: newConvo, error } = await supabase
      .from('conversations')
      .insert({ user1_id, user2_id })
      .select(SELECT)
      .single();
    if (error) throw error;
    convo = newConvo;
  }

  return convo;
}

/**
 * Returns the other participant's ID in a conversation.
 * @param {{user1_id: string, user2_id: string}} convo
 * @param {string} currentUserId
 * @returns {string}
 */
function getOtherId(convo, currentUserId) {
  return convo.user1_id === currentUserId ? convo.user2_id : convo.user1_id;
}

module.exports = { getOrCreateConversation, getOtherId };
