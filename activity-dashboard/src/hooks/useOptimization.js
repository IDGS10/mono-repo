import { useCallback, useMemo, useRef, useEffect } from 'react';

// Hook para debouncing
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  
  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedCallback;
};

// Hook para memoización de datos complejos
export const useMemoizedData = (data, dependencies) => {
  return useMemo(() => {
    if (!data) return null;
    
    // Procesar y memoizar datos pesados
    return {
      ...data,
      sortedAuthors: Object.entries(data.commitsByAuthor || {})
        .sort(([,a], [,b]) => b - a),
      topAuthors: Object.entries(data.commitsByAuthor || {})
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      totalStats: {
        totalCommits: data.totalCommits || 0,
        uniqueAuthors: Object.keys(data.commitsByAuthor || {}).length,
        maxCommits: Math.max(...Object.values(data.commitsByAuthor || {}), 0)
      }
    };
  }, dependencies);
};

// Hook para optimizar scroll
export const useScrollOptimization = () => {
  const scrollTimeoutRef = useRef(null);
  const isScrollingRef = useRef(false);
  
  const handleScroll = useCallback(() => {
    if (!isScrollingRef.current) {
      isScrollingRef.current = true;
      document.body.style.pointerEvents = 'none';
    }
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      document.body.style.pointerEvents = 'auto';
    }, 150);
  }, []);
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);
  
  return isScrollingRef.current;
};
