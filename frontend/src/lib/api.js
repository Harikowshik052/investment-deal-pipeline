import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (data) => api.post('/auth/signup', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/users', data),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
}

// Boards API
export const boardsAPI = {
  getAll: () => api.get('/boards'),
  getOne: (id) => api.get(`/boards/${id}`),
  create: (data) => api.post('/boards', data),
  update: (id, data) => api.put(`/boards/${id}`, data),
  delete: (id) => api.delete(`/boards/${id}`),
  addMember: (boardId, userId, role) => {
    const params = role ? { role } : {}
    return api.post(`/boards/${boardId}/members/${userId}`, null, { params })
  },
  removeMember: (boardId, userId) => api.delete(`/boards/${boardId}/members/${userId}`),
}

// Deals API
export const dealsAPI = {
  getAll: (boardId) => api.get('/deals', { params: boardId ? { board_id: boardId } : {} }),
  getOne: (id) => api.get(`/deals/${id}`),
  create: (data) => api.post('/deals', data),
  update: (id, data) => api.put(`/deals/${id}`, data),
  delete: (id) => api.delete(`/deals/${id}`),
  getActivities: (id) => api.get(`/deals/${id}/activities`),
  getComments: (id) => api.get(`/deals/${id}/comments`),
  addComment: (id, content) => api.post(`/deals/${id}/comments`, { content }),
  getVotes: (id) => api.get(`/deals/${id}/votes`),
  vote: (id, vote, comment) => api.post(`/deals/${id}/votes`, { vote, comment }),
}

// Memos API
export const memosAPI = {
  getMemo: (dealId) => api.get(`/memos/deal/${dealId}`),
  updateMemo: (dealId, data) => api.put(`/memos/deal/${dealId}`, data),
  getVersions: (dealId) => api.get(`/memos/deal/${dealId}/versions`),
  getVersion: (dealId, version) => api.get(`/memos/deal/${dealId}/version/${version}`),
}
