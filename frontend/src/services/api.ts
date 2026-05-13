import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  transformRequest: [(data, headers) => {
    if (data instanceof FormData) {
      delete headers['Content-Type'];
      return data;
    }
    headers['Content-Type'] = 'application/json';
    return JSON.stringify(data);
  }]
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sgpe_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];

const processQueue = (token: string | null, error: any = null) => {
  failedQueue.forEach(p => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('sgpe_refresh');

      if (!refreshToken || originalRequest.url === '/auth/refresh' || originalRequest.url === '/auth/login') {
        localStorage.removeItem('sgpe_token');
        localStorage.removeItem('sgpe_refresh');
        localStorage.removeItem('sgpe_usuario');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh', { refreshToken });

        if (data.success && data.data) {
          const { token, refreshToken: newRefresh } = data.data;
          localStorage.setItem('sgpe_token', token);
          localStorage.setItem('sgpe_refresh', newRefresh);
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          processQueue(token);
          return api(originalRequest);
        }
        throw new Error('Refresh failed');
      } catch (refreshError) {
        processQueue(null, refreshError);
        localStorage.removeItem('sgpe_token');
        localStorage.removeItem('sgpe_refresh');
        localStorage.removeItem('sgpe_usuario');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
