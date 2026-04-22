/**
 * Utility functions for making API calls with automatic auth handling
 */

/**
 * Makes an authenticated API call and automatically handles 401 errors
 * by dispatching an auth:unauthorized event for global logout
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('access_token');
  
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  return response;
}

/**
 * Makes an authenticated API call and returns the JSON response
 * Throws an error if the response is not ok
 */
export async function fetchJsonWithAuth<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetchWithAuth(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
