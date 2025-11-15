import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type Route = { view: 'radar' } | { view: 'topic'; topic: string };

type RouterContextValue = {
  route: Route;
  navigate: (nextRoute: Route) => void;
};

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

const parseRoute = (hash: string | undefined): Route => {
  if (!hash) {
    return { view: 'radar' };
  }

  const cleaned = hash.replace(/^#/, '');
  const segments = cleaned.split('/').filter(Boolean);

  if (segments[0] === 'topic' && segments[1]) {
    const topic = decodeURIComponent(segments.slice(1).join('/'));
    return { view: 'topic', topic };
  }

  return { view: 'radar' };
};

const routeToHash = (route: Route) => {
  if (route.view === 'radar') {
    return '';
  }

  return `#/topic/${encodeURIComponent(route.topic)}`;
};

export const HashRouterProvider = ({ children }: PropsWithChildren) => {
  const initialRoute = useMemo(() => parseRoute(typeof window !== 'undefined' ? window.location.hash : ''), []);
  const [route, setRoute] = useState<Route>(initialRoute);
  const navigatingRef = useRef(false);

  const syncFromHash = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (navigatingRef.current) {
      navigatingRef.current = false;
      return;
    }
    setRoute(parseRoute(window.location.hash));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [syncFromHash]);

  const navigate = useCallback((nextRoute: Route) => {
    if (typeof window === 'undefined') return;
    navigatingRef.current = true;
    const nextHash = routeToHash(nextRoute);
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    setRoute(nextRoute);
  }, []);

  const value = useMemo<RouterContextValue>(() => ({ route, navigate }), [route, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

export const useHashRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useHashRouter must be used within a HashRouterProvider');
  }
  return context;
};
