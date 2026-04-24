import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
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
  listAll: ()             => api.get('/dues'),
  list:   (groupId)       => api.get(`/dues/${groupId}`),
  create: (groupId, data) => api.post(`/dues/${groupId}`, data),
  update: (groupId, id, data) => api.put(`/dues/${groupId}/${id}`, data),
  close:  (groupId, id)   => api.patch(`/dues/${groupId}/${id}/close`),
  delete: (groupId, id)   => api.delete(`/dues/${groupId}/${id}`)
};

export const submissionsAPI = {
  list:    (groupId)                       => api.get(`/submissions/${groupId}`),
  create:  (groupId, data)                 => api.post(`/submissions/${groupId}`, data),
  delete:  (groupId, assignmentId)         => api.delete(`/submissions/${groupId}/${assignmentId}`),
  update:  (groupId, assignmentId, data)   => api.put(`/submissions/${groupId}/${assignmentId}`, data),
  close:   (groupId, assignmentId)         => api.patch(`/submissions/${groupId}/${assignmentId}/close`),
  submit:  (groupId, assignmentId, data)   => api.post(`/submissions/${groupId}/${assignmentId}/submit`, data),
  uploadFile: (groupId, assignmentId, formData) => api.post(`/submissions/${groupId}/${assignmentId}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  report:  (groupId, assignmentId)         => api.get(`/submissions/${groupId}/${assignmentId}/report`),
  markOffline: (groupId, assignmentId, userId, marked) => api.patch(`/submissions/${groupId}/${assignmentId}/mark-offline/${userId}`, { marked }),
};

export const quizzesAPI = {
  list:    (groupId)                     => api.get(`/quizzes/${groupId}`),
  get:     (groupId, quizId)             => api.get(`/quizzes/${groupId}/${quizId}`),
  create:  (groupId, data)               => api.post(`/quizzes/${groupId}`, data),
  update:  (groupId, quizId, data)       => api.put(`/quizzes/${groupId}/${quizId}`, data),
  close:   (groupId, quizId)             => api.patch(`/quizzes/${groupId}/${quizId}/close`),
  delete:  (groupId, quizId)             => api.delete(`/quizzes/${groupId}/${quizId}`),
  attempt: (groupId, quizId, data)       => api.post(`/quizzes/${groupId}/${quizId}/attempt`, data),
  report:  (groupId, quizId)             => api.get(`/quizzes/${groupId}/${quizId}/report`),
  // Public (no auth token needed  · · uses separate axios call)
  getByToken:    (token)          => api.get(`/quizzes/take/${token}`),
  submitByToken: (token, data)    => api.post(`/quizzes/take/${token}/submit`, data),
};

export const profileAPI = {
  get:               (userId) => api.get(`/users/${userId}`),
  getPublic:         (userId) => api.get(`/users/public/${userId}`),
  update:            (data)   => api.patch('/users/me', data),
  changePassword:    (data)   => api.patch('/users/me/password', data),
  uploadAttachment:  (formData) => api.post('/users/me/attachments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
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

export const searchAPI = {
  query: (q, groupId) => api.get('/search', { params: groupId ? { q, groupId } : { q } }),
};

export const institutionsAPI = {
  verify:      (code)        => api.get(`/institutions/verify/${code}`),
  departments: (institutionId) => api.get('/departments/public', { params: { institutionId } }),
};

export const demoRequestsAPI = {
  create: (data) => api.post('/demo-requests', data),
};

export const teacherAPI = {
  getStudents:          (params) => api.get('/teacher/students', { params }),
  getStudent:           (id)     => api.get(`/teacher/students/${id}`),
  getSelectionGroups:   ()       => api.get('/teacher/selection-groups'),
  createSelectionGroup: (data)   => api.post('/teacher/selection-groups', data),
  updateSelectionGroup: (id, data) => api.patch(`/teacher/selection-groups/${id}`, data),
  deleteSelectionGroup: (id)     => api.delete(`/teacher/selection-groups/${id}`),
};

export default api;