import axios from 'axios'

const api = axios.create({ baseURL: '' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('triageai_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      const path = window.location.pathname
      if (!path.startsWith('/patient/') && path !== '/') {
        localStorage.removeItem('triageai_token')
        localStorage.removeItem('triageai_role')
        localStorage.removeItem('triageai_id')
        window.location.href = '/'
      }
    }
    return Promise.reject(err)
  }
)

export default api
