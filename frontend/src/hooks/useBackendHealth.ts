import { useState, useEffect, useCallback } from 'react';
import type { BackendHealth } from '../types';
import { api } from '../services/api';

export function useBackendHealth(autoRefreshIntervalMs: number = 30000) {
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.checkHealth();
      setHealth(data);
      setIsError(false);
      setErrorMessage(null);
      setLastChecked(new Date());
    } catch (err: unknown) {
      setIsError(true);
      setHealth(null);
      setErrorMessage(err instanceof Error ? err.message : 'Unable to connect to backend server');
      setLastChecked(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();

    if (autoRefreshIntervalMs > 0) {
      const timer = setInterval(fetchHealth, autoRefreshIntervalMs);
      return () => clearInterval(timer);
    }
  }, [fetchHealth, autoRefreshIntervalMs]);

  return {
    health,
    isLoading,
    isError,
    errorMessage,
    lastChecked,
    refetch: fetchHealth,
  };
}
