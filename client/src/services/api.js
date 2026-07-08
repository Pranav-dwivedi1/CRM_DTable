import axios from "axios";

const resolveApiBaseUrl = () => {
  const configuredUrl =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const trimmedUrl = configuredUrl.replace(/\/$/, "");

  return trimmedUrl.endsWith("/api") ? trimmedUrl : `${trimmedUrl}/api`;
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true, // Crucial for httpOnly refresh token cookies
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        `[API_REQUEST] ${config.method?.toUpperCase()} ${config.url}`,
        {
          hasAccessToken: true,
          tokenLastChars: "..." + token.slice(-8),
        },
      );
    } else {
      console.log(
        `[API_REQUEST] ${config.method?.toUpperCase()} ${config.url}`,
        {
          hasAccessToken: false,
        },
      );
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle silent token refresh on 401 expiration
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

console.log(
  `[API_RESPONSE] ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`,
  {
    status: error.response?.status,
    message: error.response?.data?.message,
    retry: originalRequest._retry,
  }
);

    // Prevent infinite loop if the refresh-token endpoint itself fails
if (originalRequest?.url?.includes("/auth/refresh-token")) {  
      console.error(
        `[API_RESPONSE] Refresh token endpoint failed, cannot retry`,
        {
          status: error.response?.status,
          message: error.response?.data?.message,
        },
      );
      return Promise.reject(error);
    }

if (
  error.response?.status === 401 &&
  !originalRequest._retry &&
  !originalRequest?.url?.includes("/auth/login")
) {      if (isRefreshing) {
        console.log(
          `[API_RESPONSE] Token refresh in progress, queuing request`,
        );
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
    originalRequest.headers = originalRequest.headers || {};
    originalRequest.headers.Authorization = `Bearer ${token}`;
    return api(originalRequest);
})
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      console.log(`[API_RESPONSE] Starting token refresh...`, {
        currentAccessToken: localStorage.getItem("accessToken")
          ? "***stored***"
          : "MISSING",
      });

      try {
        const res = await api.post("/auth/refresh-token");

        const { accessToken } = res.data;
        localStorage.setItem("accessToken", accessToken);

        console.log(`[API_RESPONSE] Token refresh successful`, {
          newTokenLastChars: "..." + accessToken.slice(-8),
        });

        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        console.error(`[API_RESPONSE] Token refresh failed`, {
          status: refreshError.response?.status,
          message: refreshError.response?.data?.message,
        });

        processQueue(refreshError, null);
        isRefreshing = false;

        localStorage.removeItem("accessToken");
        // Dispatch custom event to trigger logout UI redirect
        window.dispatchEvent(new Event("auth_logout"));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
