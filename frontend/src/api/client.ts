import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { config } from '@/config';
import { useAuthStore } from '@/store/authStore';

export const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor ─────────────────────────────────────
apiClient.interceptors.request.use((req: InternalAxiosRequestConfig) => {
  const { token, activeOrganization } = useAuthStore.getState();

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  if (activeOrganization?.id) {
    req.headers['X-Tenant-Id'] = activeOrganization.id;
  }
  req.headers['X-Request-Id'] = crypto.randomUUID();

  return req;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ── Response Interceptor ────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, logout, login } = useAuthStore.getState();
      if (refreshToken) {
        try {
          const res = await axios.post(`${config.api.baseUrl}/custom/v1/auth/refresh`, {
            refreshToken,
          });
          const { accessToken, refreshToken: newRefreshToken, user } = res.data;
          login(accessToken, newRefreshToken || refreshToken, user);
          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        logout();
        window.location.href = '/login';
      }
    }

    if (status === 403) {
      window.location.href = '/403';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
