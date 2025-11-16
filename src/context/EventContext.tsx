import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
import type {
  EventContextValue,
  EventListeners,
  EventProviderProps,
} from '../types.js';

const EventContext = createContext<EventContextValue | null>(null);

export const useEventContext = (): EventContextValue => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error(
      'useTriggerEvent and useMonitorEvent must be used within an EventProvider',
    );
  }
  return context;
};

export const EventProvider: React.FC<EventProviderProps> = ({
  children,
  maxListeners = 100,
  debug = false,
}) => {
  const listenersRef = useRef<EventListeners>(new Map());

  const subscribe = useCallback(
    (key: string, callback: (...args: any[]) => void) => {
      // Input validation
      if (!key || typeof key !== 'string') {
        throw new Error(
          `EventProvider.subscribe: Invalid event key. Expected a non-empty string, got "${key}".`,
        );
      }
      if (typeof callback !== 'function') {
        throw new Error(
          `EventProvider.subscribe: Invalid callback for event "${key}". Expected a function, got "${typeof callback}".`,
        );
      }

      if (!listenersRef.current.has(key)) {
        listenersRef.current.set(key, new Set());
      }

      const listeners = listenersRef.current.get(key)!;

      // Check max listeners limit
      if (maxListeners > 0 && listeners.size >= maxListeners) {
        const warning = `EventProvider.subscribe: Maximum listeners (${maxListeners}) exceeded for event "${key}". This may indicate a memory leak.`;
        console.warn(warning);
        if (debug) {
          console.trace(warning);
        }
      }

      listeners.add(callback);

      // Return unsubscribe function (idempotent)
      let isUnsubscribed = false;
      return () => {
        if (isUnsubscribed) {
          return; // Already unsubscribed, prevent double cleanup
        }
        isUnsubscribed = true;

        const currentListeners = listenersRef.current.get(key);
        if (currentListeners) {
          currentListeners.delete(callback);
          if (currentListeners.size === 0) {
            listenersRef.current.delete(key);
          }
        }
      };
    },
    [maxListeners, debug],
  );

  const trigger = useCallback(
    (key: string, ...args: any[]) => {
      // Input validation
      if (!key || typeof key !== 'string') {
        console.warn(
          `EventProvider.trigger: Invalid event key. Expected a non-empty string, got "${key}".`,
        );
        return;
      }

      const listeners = listenersRef.current.get(key);
      if (listeners && listeners.size > 0) {
        if (debug) {
          console.log(
            `[EventProvider] Triggering event "${key}" with ${listeners.size} listener(s)`,
            args,
          );
        }

        // Create a snapshot to avoid issues if listeners are modified during iteration
        // Using Array.from is already optimal for Set iteration
        const listenersSnapshot = Array.from(listeners);

        listenersSnapshot.forEach((callback) => {
          try {
            callback(...args);
          } catch (error) {
            // Isolate errors: log but continue executing other callbacks
            console.error(
              `EventProvider.trigger: Error in callback for event "${key}":`,
              error,
            );
          }
        });
      } else if (debug) {
        console.log(
          `[EventProvider] Event "${key}" triggered but no listeners registered`,
        );
      }
    },
    [debug],
  );

  const getListenerCount = useCallback((key: string): number => {
    const listeners = listenersRef.current.get(key);
    return listeners ? listeners.size : 0;
  }, []);

  const hasListeners = useCallback(
    (key: string): boolean => {
      return getListenerCount(key) > 0;
    },
    [getListenerCount],
  );

  const getEventKeys = useCallback((): string[] => {
    return Array.from(listenersRef.current.keys());
  }, []);

  const value = useMemo<EventContextValue>(
    () => ({
      subscribe,
      trigger,
      getListenerCount,
      hasListeners,
      getEventKeys,
    }),
    [subscribe, trigger, getListenerCount, hasListeners, getEventKeys],
  );

  return (
    <EventContext.Provider value={value}>{children}</EventContext.Provider>
  );
};
