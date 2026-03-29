import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If token expires, redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data)
};

export const groupsAPI = {
  create:  (data)    => api.post('/groups', data),
  join:    (code)    => api.post('/groups/join', { invite_code: code }),
  list:    ()        => api.get('/groups'),
  get:     (id)      => api.get(`/groups/${id}`),
  delete:  (id)      => api.delete(`/groups/${id}`),
  update:  (id, data) => api.patch(`/groups/${id}`, data),
  leave:   (id)      => api.delete(`/groups/${id}/members/me`),
  toggleAdminsOnly: (id, enabled) => api.patch(`/groups/${id}/admins-only`, { enabled }),
  kickMember:       (id, userId)  => api.delete(`/groups/${id}/members/${userId}`),
  promoteMember:    (id, userId)  => api.patch(`/groups/${id}/members/${userId}/promote`),
  demoteMember:     (id, userId)  => api.patch(`/groups/${id}/members/${userId}/demote`),
};

export const messagesAPI = {
  list:         (groupId, params)    => api.get(`/messages/${groupId}`, { params }),
  pinned:       (groupId)            => api.get(`/messages/${groupId}/pinned`),
  pin:          (messageId, data)    => api.patch(`/messages/${messageId}/pin`, data ?? {}),
  unpin:        (messageId)          => api.patch(`/messages/${messageId}/unpin`),
  delete:       (messageId)          => api.delete(`/messages/${messageId}`),
  edit:         (messageId, content) => api.patch(`/messages/${messageId}/edit`, { content }),
  react:        (messageId, emoji)   => api.post(`/messages/${messageId}/reactions`, { emoji }),
  replyPrivate: (data)               => api.post('/messages/reply-privately', data),
};

export const filesAPI = {
  upload: (groupId, formData) => api.post(`/files/${groupId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  list:   (groupId) => api.get(`/files/${groupId}`),
  delete: (groupId, fileId) => api.delete(`/files/${groupId}/${fileId}`)
};

export const announcementsAPI = {
  list:      (groupId)           => api.get(`/announcements/${groupId}`),
  scheduled: (groupId)           => api.get(`/announcements/${groupId}/scheduled`),
  create:    (groupId, data)     => api.post(`/announcements/${groupId}`, data),
  update:    (groupId, id, data) => api.put(`/announcements/${groupId}/${id}`, data),
  delete:    (groupId, id)       => api.delete(`/announcements/${groupId}/${id}`),
  react:     (groupId, id, emoji) => api.post(`/announcements/${groupId}/${id}/reactions`, { emoji }),
};

export const duesAPI = {
  list:   (groupId)       => api.get(`/dues/${groupId}`),
  create: (groupId, data) => api.post(`/dues/${groupId}`, data),
  update: (groupId, id, data) => api.put(`/dues/${groupId}/${id}`, data),
  delete: (groupId, id)   => api.delete(`/dues/${groupId}/${id}`)
};

export const profileAPI = {
  get:    (userId) => api.get(`/users/${userId}`),
  update: (data)   => api.patch('/users/me', data),
};

export const dmAPI = {
  search:           (email)          => api.get('/dm/search', { params: { email } }),
  getConversations: ()               => api.get('/dm/conversations'),
  startConversation:(userId)         => api.post('/dm/conversations', { userId }),
  getMessages:      (conversationId) => api.get(`/dm/conversations/${conversationId}/messages`),
  getOnlineStatus:  (userIds)        => api.post('/dm/online-status', { userIds }),
  editMessage:      (id, content)    => api.patch(`/dm/messages/${id}/edit`, { content }),
  reactMessage:     (id, emoji)      => api.post(`/dm/messages/${id}/reactions`, { emoji }),
  deleteMessage:    (id)             => api.delete(`/dm/messages/${id}`),
  uploadFile:       (formData)       => api.post('/dm/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export default api;