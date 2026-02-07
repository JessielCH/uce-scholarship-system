// API Configuration - Uses dynamic URL from environment
// Supports both development (localhost) and production (AWS)

const getApiBaseUrl = () => {
  // Try to use VITE_APP_URL from environment
  if (import.meta.env.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL;
  }

  // Fallback: Use the current origin and port 4000 (backend server)
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:4000`;
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to build API endpoints
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Export common endpoints for easy use
export const API_ENDPOINTS = {
  VERIFY_STUDENT: buildApiUrl("/api/auth/verify-student"),
  CREATE_STAFF: buildApiUrl("/api/admin/create-staff"),
};

export default API_BASE_URL;
