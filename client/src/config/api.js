// API Configuration
// Behavior:
// - If `import.meta.env.VITE_API_BASE_URL` is set, use that (explicit production backend URL)
// - Otherwise, if running on localhost, use http://localhost:4000 for local backend
// - Otherwise (deployed frontend), use relative `/api` so nginx or the host proxies requests to the backend

const getApiBaseUrl = () => {
  // Explicit override (recommended for production): VITE_API_BASE_URL
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");
  }

  // Local development: keep using localhost:4000
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }

  // Deployed: use a relative path so the same origin (nginx) proxies /api to the backend
  return ""; // empty string -> use relative endpoints prefixed with /api
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to build API endpoints. If API_BASE_URL is empty string, this returns a relative URL.
export const buildApiUrl = (endpoint) => {
  // ensure endpoint starts with /
  const ep = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${ep}`;
};

export const API_ENDPOINTS = {
  VERIFY_STUDENT: buildApiUrl("/api/auth/verify-student"),
  CREATE_STAFF: buildApiUrl("/api/admin/create-staff"),
};

export default API_BASE_URL;
