import { useCallback, useEffect, useState } from 'react';

export type RouteName = 'bubble' | 'topic';

const DEFAULT_ROUTE: RouteName = 'bubble';

const parseRouteFromHash = (hash: string): RouteName => {
  if (hash.replace('#', '') === 'topic') {
    return 'topic';
  }

  return DEFAULT_ROUTE;
};

const routeToHash = (route: RouteName) => `#${route}`;

export const useHashRoute = () => {
  const getCurrentHash = () => {
    if (typeof window === 'undefined') {
      return routeToHash(DEFAULT_ROUTE);
    }

    return window.location.hash;
  };

  const [route, setRoute] = useState<RouteName>(() => parseRouteFromHash(getCurrentHash()));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!window.location.hash) {
      window.location.hash = routeToHash(DEFAULT_ROUTE);
      setRoute(DEFAULT_ROUTE);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleHashChange = () => {
      setRoute(parseRouteFromHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigate = useCallback((nextRoute: RouteName) => {
    if (typeof window === 'undefined') {
      setRoute(nextRoute);
      return;
    }

    const nextHash = routeToHash(nextRoute);

    if (window.location.hash === nextHash) {
      setRoute(nextRoute);
      return;
    }

    window.location.hash = nextHash;
  }, []);

  return { route, navigate } as const;
};
