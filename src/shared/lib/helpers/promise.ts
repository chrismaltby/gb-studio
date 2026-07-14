type RetryOptions = {
  retries?: number;
  delayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
};

export const promiseRetry = async <T>(
  operation: () => Promise<T>,
  { retries = 5, delayMs = 50, shouldRetry = () => false }: RetryOptions = {},
): Promise<T> => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= retries || !shouldRetry(error)) {
        throw error;
      }

      await new Promise<void>((resolve) =>
        setTimeout(resolve, delayMs * 2 ** attempt),
      );
    }
  }
};
