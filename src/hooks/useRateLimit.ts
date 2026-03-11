import { useState, useCallback } from 'react';

interface RateLimitState {
  isRateLimited: boolean;
  retryAfterSeconds: number;
  errorMessage: string;
}

export function useRateLimit() {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isRateLimited: false,
    retryAfterSeconds: 0,
    errorMessage: '',
  });

  const handleRateLimitError = useCallback((error: Error) => {
    // Extrair tempo de retry da mensagem de erro
    const retryMatch = error.message.match(/Tente novamente em (\d+) segundos/);
    const retryAfterSeconds = retryMatch ? parseInt(retryMatch[1]) : 60;

    setRateLimitState({
      isRateLimited: true,
      retryAfterSeconds,
      errorMessage: error.message,
    });
  }, []);

  const clearRateLimit = useCallback(() => {
    setRateLimitState({
      isRateLimited: false,
      retryAfterSeconds: 0,
      errorMessage: '',
    });
  }, []);

  const retry = useCallback((retryFunction: () => void) => {
    retryFunction();
    clearRateLimit();
  }, [clearRateLimit]);

  return {
    ...rateLimitState,
    handleRateLimitError,
    clearRateLimit,
    retry,
  };
}


