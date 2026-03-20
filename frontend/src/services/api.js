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
  delete:  (id)      => api.delete(`/groups/${id}`)
};

export const messagesAPI = {
  list: (groupId, params) => api.get(`/messages/${groupId}`, { params })
};

export const filesAPI = {
  upload: (groupId, formData) => api.post(`/files/${groupId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  list:   (groupId) => api.get(`/files/${groupId}`),
  delete: (groupId, fileId) => api.delete(`/files/${groupId}/${fileId}`)
};

export default api;