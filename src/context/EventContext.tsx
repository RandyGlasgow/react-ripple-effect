import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { EventDriver } from '../lib/EventDriver';
import type { EventContextValue, EventProviderProps } from '../types';

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
  const eventDriverRef = useRef<EventDriver>(new EventDriver());

  const subscribe = useCallback(
    (key: string, callback: (...args: any[]) => void) => {
      const eventDriver = eventDriverRef.current;

      // Check max listeners limit before subscribing
      if (maxListeners > 0) {
        const currentCount = eventDriver.getListenerCount(key);
        if (currentCount >= maxListeners) {
          const warning = `EventProvider.subscribe: Maximum listeners (${maxListeners}) exceeded for event "${key}". This may indicate a memory leak.`;
          console.warn(warning);
          if (debug) {
            console.trace(warning);
          }
        }
      }

      // Delegate to EventDriver (it handles validation internally)
      return eventDriver.subscribe(key, callback);
    },
    [maxListeners, debug],
  );

  const trigger = useCallback(
    (key: string, ...args: any[]) => {
      const eventDriver = eventDriverRef.current;

      // Debug logging before triggering
      if (debug) {
        const listenerCount = eventDriver.getListenerCount(key);
        if (listenerCount > 0) {
          console.log(
            `[EventProvider] Triggering event "${key}" with ${listenerCount} listener(s)`,
            args,
          );
        } else {
          console.log(
            `[EventProvider] Event "${key}" triggered but no listeners registered`,
          );
        }
      }

      // Delegate to EventDriver (it handles validation and error isolation internally)
      eventDriver.trigger(key, ...args);
    },
    [debug],
  );

  const getListenerCount = useCallback((key: string): number => {
    return eventDriverRef.current.getListenerCount(key);
  }, []);

  const hasListeners = useCallback((key: string): boolean => {
    return eventDriverRef.current.hasListeners(key);
  }, []);

  const getEventKeys = useCallback((): string[] => {
    return eventDriverRef.current.getEventKeys();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventDriverRef.current.cleanup();
    };
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
