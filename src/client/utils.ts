// Types for better type safety
interface FetchOptions extends Omit<RequestInit, 'signal'> {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  baseURL?: string;
}

interface FetchResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  ok: boolean;
}

class FetchError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: Response,
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

const waitFor = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Modern fetch function with TypeScript support and best practices
 */
export async function fetchWithAbort<T = unknown>(
  url: string,
  options: FetchOptions = {},
  abortController?: AbortController,
): Promise<FetchResponse<T>> {
  const { timeout = 5000, retries = 3, retryDelay = 1000, baseURL = '', ...fetchOptions } = options;

  // Create AbortController if not provided
  const controller = abortController ?? new AbortController();

  // Set up timeout
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  // Construct full URL
  const fullUrl = baseURL ? `${baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}` : url;

  // Default headers with JSON content type
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  const fetchConfig: RequestInit = {
    ...fetchOptions,
    headers: defaultHeaders,
    signal: controller.signal,
  };

  const attemptFetch = async (attempt: number): Promise<FetchResponse<T>> => {
    try {
      const response = await fetch(fullUrl, fetchConfig);

      // Clear timeout on successful response
      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        throw new FetchError(
          `HTTP Error: ${response.status} ${response.statusText}`,
          response.status,
          response,
        );
      }

      // Parse response based on content type
      let data: T;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text/')) {
        data = (await response.text()) as T;
      } else {
        data = (await response.blob()) as T;
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        ok: response.ok,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError('Request was aborted');
      }

      // Handle network errors and retry logic
      if (attempt < retries && !(error instanceof FetchError)) {
        await waitFor(retryDelay);
        return attemptFetch(attempt + 1);
      }

      // Re-throw the error if no more retries
      throw error;
    }
  };

  return attemptFetch(0);
}

// Convenience methods for common HTTP methods
export const api = {
  get: <T = unknown>(url: string, options?: FetchOptions, controller?: AbortController) =>
    fetchWithAbort<T>(url, { ...options, method: 'GET' }, controller),

  post: <T = unknown>(
    url: string,
    data?: unknown,
    options?: FetchOptions,
    controller?: AbortController,
  ) =>
    fetchWithAbort<T>(
      url,
      {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : null,
      },
      controller,
    ),

  put: <T = unknown>(
    url: string,
    data?: unknown,
    options?: FetchOptions,
    controller?: AbortController,
  ) =>
    fetchWithAbort<T>(
      url,
      {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : null,
      },
      controller,
    ),

  patch: <T = unknown>(
    url: string,
    data?: unknown,
    options?: FetchOptions,
    controller?: AbortController,
  ) =>
    fetchWithAbort<T>(
      url,
      {
        ...options,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : null,
      },
      controller,
    ),

  delete: <T = unknown>(url: string, options?: FetchOptions, controller?: AbortController) =>
    fetchWithAbort<T>(url, { ...options, method: 'DELETE' }, controller),
};

// Usage examples:

// Example 1: Basic GET request with timeout
/*
try {
  const response = await api.get<{ users: User[] }>('/api/users', {
    timeout: 5000,
    baseURL: 'https://api.example.com'
  });
  console.log(response.data.users);
} catch (error) {
  if (error instanceof TimeoutError) {
    console.error('Request timed out');
  } else if (error instanceof FetchError) {
    console.error(`HTTP Error: ${error.status}`);
  }
}
*/

// Example 2: POST request with retry logic
/*
try {
  const controller = new AbortController();
  const response = await api.post<{ id: string }>('/api/users',
    { name: 'John Doe', email: 'john@example.com' },
    {
      retries: 3,
      retryDelay: 2000,
      timeout: 15000
    },
    controller
  );
  console.log('User created:', response.data.id);
} catch (error) {
  console.error('Failed to create user:', error.message);
}
*/

// Example 3: Cancelling a request
/*
const controller = new AbortController();

// Start the request
const requestPromise = api.get('/api/slow-endpoint', {}, controller);

// Cancel after 3 seconds
setTimeout(() => {
  controller.abort();
}, 3000);

try {
  const response = await requestPromise;
} catch (error) {
  if (error instanceof TimeoutError) {
    console.log('Request was cancelled');
  }
}
*/
