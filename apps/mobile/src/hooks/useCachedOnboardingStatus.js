import { useEffect, useState } from 'react';
import {
  cacheOnboardingStatus,
  readCachedOnboardingStatus,
} from '@/utils/auth/profileBootstrap';

export function useCachedOnboardingStatus(userId) {
  const [state, setState] = useState({ status: null, isLoading: Boolean(userId) });

  useEffect(() => {
    let active = true;
    if (!userId) {
      setState({ status: null, isLoading: false });
      return () => {
        active = false;
      };
    }

    setState({ status: null, isLoading: true });
    readCachedOnboardingStatus(userId).then((status) => {
      if (active) setState({ status, isLoading: false });
    });

    return () => {
      active = false;
    };
  }, [userId]);

  return state;
}

export { cacheOnboardingStatus };
