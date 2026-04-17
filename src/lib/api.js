import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** Kept in sync with AuthContext — used by interceptors before React hydrates. */
export const ACCESS_TOKEN_STORAGE_KEY = 'hireboard_access_token';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/** Cookie-only client so refresh never sends a stale Bearer header. */
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let refreshPromise = null;

function readStoredAccessToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

function persistAccessToken(token) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  window.dispatchEvent(
    new CustomEvent('hireboard:access-token', { detail: { accessToken: token } }),
  );
}

function clearSessionClientSide() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('hireboard:session-end'));
}

async function fetchNewAccessToken() {
  const { data } = await refreshClient.post('/auth/refresh');
  const token = data?.data?.accessToken;
  if (!token || typeof token !== 'string') {
    throw new Error('Refresh response missing accessToken');
  }
  return token;
}

api.interceptors.request.use((config) => {
  const token = readStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config;
    const status = error.response?.status;

    if (status !== 401 || !originalConfig) {
      return Promise.reject(error);
    }

    if (originalConfig._retryAfterRefresh) {
      return Promise.reject(error);
    }

    const reqUrl = originalConfig.url ?? '';
    if (
      reqUrl.includes('/auth/refresh') ||
      reqUrl.includes('/auth/login') ||
      reqUrl.includes('/auth/register')
    ) {
      return Promise.reject(error);
    }

    if (!readStoredAccessToken()) {
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = fetchNewAccessToken()
        .then((token) => {
          persistAccessToken(token);
          return token;
        })
        .catch((refreshErr) => {
          clearSessionClientSide();
          throw refreshErr;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    return refreshPromise
      .then((token) => {
        originalConfig.headers = originalConfig.headers ?? {};
        originalConfig.headers.Authorization = `Bearer ${token}`;
        originalConfig._retryAfterRefresh = true;
        return api(originalConfig);
      })
      .catch((refreshErr) => Promise.reject(refreshErr));
  },
);

export function getApiErrorMessage(error) {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  const status = error?.response?.status;
  if (status === 403) {
    return 'Invalid credentials';
  }
  if (status === 404) {
    return 'Account not found';
  }
  return 'Something went wrong. Please try again.';
}
