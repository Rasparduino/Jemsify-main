// A simple exponential backoff delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * A wrapper around the native fetch API that includes automatic retries on network failures.
 * @param url The resource URL.
 * @param options The standard fetch options object.
 * @param retries The number of times to retry on failure.
 * @returns A promise that resolves with the Response object.
 */
export const fetchWithRetry = async (
  url: RequestInfo | URL,
  options?: RequestInit,
  retries: number = 3
): Promise<Response> => {
  let lastError: Error | undefined;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      // If the response is not ok (e.g., 401, 404, 500), we don't retry.
      // We only want to retry on actual network errors (when fetch itself throws).
      if (!response.ok) {
        return response;
      }
      return response;
    } catch (error) {
      lastError = error as Error;
      // Wait for an increasing amount of time before the next retry
      await delay(500 * Math.pow(2, i));
    }
  }
  // If all retries fail, throw the last error caught.
  throw new Error(`Failed to fetch after ${retries} attempts: ${lastError?.message}`);
};
