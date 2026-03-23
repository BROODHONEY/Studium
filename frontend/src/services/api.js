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
  list:   (groupId, params) => api.get(`/messages/${groupId}`, { params }),
  pinned: (groupId)         => api.get(`/messages/${groupId}/pinned`),
  pin:    (messageId, data) => api.patch(`/messages/${messageId}/pin`, data ?? {}),
  unpin:  (messageId)       => api.patch(`/messages/${messageId}/unpin`),
  delete: (messageId)       => api.delete(`/messages/${messageId}`)
};

export const filesAPI = {
  upload: (groupId, formData) => api.post(`/files/${groupId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  list:   (groupId) => api.get(`/files/${groupId}`),
  delete: (groupId, fileId) => api.delete(`/files/${groupId}/${fileId}`)
};

export const announcementsAPI = {
  list:   (groupId)     => api.get(`/announcements/${groupId}`),
  create: (groupId, data) => api.post(`/announcements/${groupId}`, data),
  delete: (groupId, id) => api.delete(`/announcements/${groupId}/${id}`)
};

export const duesAPI = {
  list:   (groupId)       => api.get(`/dues/${groupId}`),
  create: (groupId, data) => api.post(`/dues/${groupId}`, data),
  delete: (groupId, id)   => api.delete(`/dues/${groupId}/${id}`)
};

export default api;