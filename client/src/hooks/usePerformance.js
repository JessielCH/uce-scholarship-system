/**
 * PERFORMANCE MONITOR HOOK - SPRINT 17
 */

import { useEffect, useRef, useCallback } from "react";
import { logger } from "../utils/logger";

const isDevelopment = import.meta.env.MODE === "development";

export const usePerformance = (componentName, options = {}) => {
  const { logThreshold = 100 } = options; // ms
  const initialRenderTime = useRef(null);
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(null);

  useEffect(() => {
    if (!initialRenderTime.current) {
      initialRenderTime.current = performance.now();
    }
  }, []);

  useEffect(() => {
    const currentTime = performance.now();
    const renderTime =
      currentTime - (lastRenderTimeRef.current || initialRenderTime.current);
    renderCountRef.current += 1;

    if (renderTime > logThreshold && isDevelopment) {
      logger.perf(
        `${componentName}:Render${renderCountRef.current}`,
        renderTime,
      );
    }

    lastRenderTimeRef.current = currentTime;
  });

  const getRenderMetrics = useCallback(
    () => ({
      renderCount: renderCountRef.current,
      totalTime: performance.now() - initialRenderTime.current,
      lastRenderTime: lastRenderTimeRef.current
        ? performance.now() - lastRenderTimeRef.current
        : null,
    }),
    [],
  );

  return {
    getRenderMetrics,
    renderCount: renderCountRef.current,
  };
};

export const useQueryPerformance = (queryKey, queryFn, options = {}) => {
  const queryStartTime = useRef(null);
  const { logThreshold = 1000 } = options; // ms

  const wrappedQueryFn = async (...args) => {
    queryStartTime.current = performance.now();

    try {
      const result = await queryFn(...args);
      const queryTime = performance.now() - queryStartTime.current;

      if (queryTime > logThreshold) {
        logger.perf(
          `Query:${Array.isArray(queryKey) ? queryKey.join(":") : queryKey}`,
          queryTime,
        );
      }

      return result;
    } catch (error) {
      const queryTime = performance.now() - queryStartTime.current;
      logger.warn("QueryPerformance", `Query error después de ${queryTime}ms`, {
        queryKey,
        errorMessage: error?.message,
      });
      throw error;
    }
  };

  return wrappedQueryFn;
};

export const useWebVitals = () => {
  useEffect(() => {
    // LCP - Largest Contentful Paint
    if ("PerformanceObserver" in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          logger.perf(
            "WebVital:LCP",
            lastEntry.renderTime || lastEntry.loadTime,
          );
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

        // FID - First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstInput = entries[0];
          logger.perf("WebVital:FID", firstInput.processingDuration);
        });
        fidObserver.observe({ entryTypes: ["first-input"] });

        return () => {
          lcpObserver.disconnect();
          fidObserver.disconnect();
        };
      } catch (e) {
        logger.warn("WebVitals", "No se pudieron observar Web Vitals", {
          error: e.message,
        });
      }
    }
  }, []);
};

/**
 * Hook para profiling de memoria (desarrollo)
 */
export const useMemoryProfile = (componentName) => {
  const memoryCheckRef = useRef(null);

  const checkMemory = useCallback(() => {
    if (isDevelopment && performance.memory) {
      const current = performance.memory;
      const info = {
        usedJSHeapSize: `${(current.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        totalJSHeapSize: `${(current.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        jsHeapSizeLimit: `${(current.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
      };

      logger.debug(`Memory:${componentName}`, "Memory snapshot", info);

      return info;
    }
    return null;
  }, [componentName]);

  return { checkMemory };
};

export default {
  usePerformance,
  useQueryPerformance,
  useWebVitals,
  useMemoryProfile,
};
