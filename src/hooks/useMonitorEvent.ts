import { useEffect, useRef } from 'react';
import { useEventContext } from '../context/EventContext';
import type {
  EnhancedMonitorEventHandlers,
  EventCallback,
  EventMap,
  MonitorEventHandlerConfig,
  MonitorEventHandlers,
  TypedMonitorEventHandlers,
} from '../types.js';

/**
 * Creates a debounced version of a callback function
 */
function createDebouncedCallback<T extends EventCallback>(
  callback: T,
  delay: number,
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return ((...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delay);
  }) as T;
}

/**
 * Creates a throttled version of a callback function
 */
function createThrottledCallback<T extends EventCallback>(
  callback: T,
  delay: number,
): T {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Parameters<T> | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= delay) {
      // Enough time has passed, call immediately
      lastCallTime = now;
      callback(...args);
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
        pendingArgs = null;
      }
    } else {
      // Schedule the call for later
      pendingArgs = args;
      if (timeoutId === null) {
        timeoutId = setTimeout(() => {
          if (pendingArgs !== null) {
            lastCallTime = Date.now();
            callback(...pendingArgs);
            pendingArgs = null;
          }
          timeoutId = null;
        }, delay - timeSinceLastCall);
      }
    }
  }) as T;
}

/**
 * Hook to monitor/subscribe to events in the event system
 *
 * @param handlers - An object mapping event keys to callback functions or config objects
 *
 * @example
 * ```tsx
 * // Basic usage
 * useMonitorEvent({
 *   'user-logged-in': (data) => console.log('User logged in', data),
 *   'user-logged-out': () => console.log('User logged out'),
 * });
 *
 * // With debounce/throttle
 * useMonitorEvent({
 *   'search-input': {
 *     callback: (query) => performSearch(query),
 *     debounce: 300, // Wait 300ms after last event
 *   },
 *   'scroll': {
 *     callback: () => updatePosition(),
 *     throttle: 100, // Call at most once per 100ms
 *   },
 * });
 *
 * // Type-safe usage with EventMap
 * type MyEvents = {
 *   'user-logged-in': { userId: number; username: string };
 *   'user-logged-out': { userId: number };
 * };
 *
 * useMonitorEvent<MyEvents>({
 *   'user-logged-in': (data) => {
 *     // data is typed as { userId: number; username: string }
 *     console.log(data.userId, data.username);
 *   },
 * });
 * ```
 */
export function useMonitorEvent<TEventMap extends EventMap = EventMap>(
  handlers:
    | EnhancedMonitorEventHandlers<TEventMap>
    | TypedMonitorEventHandlers<TEventMap>
    | MonitorEventHandlers,
) {
  const { subscribe } = useEventContext();
  const handlersRef = useRef(handlers);
  const timeoutRefsRef = useRef<
    Map<string, Set<ReturnType<typeof setTimeout>>>
  >(new Map());

  // Update ref when handlers change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const unsubscribeFunctions: (() => void)[] = [];
    const timeoutRefs = timeoutRefsRef.current;

    // Subscribe to all events in the handlers object
    Object.entries(handlersRef.current).forEach(([key, handler]) => {
      // Validate inputs
      if (!key || typeof key !== 'string') {
        console.warn(
          `useMonitorEvent: Invalid event key "${key}". Event keys must be non-empty strings.`,
        );
        return;
      }

      let callback: EventCallback;
      let debounceDelay: number | undefined;
      let throttleDelay: number | undefined;

      // Handle both simple callbacks and config objects
      if (typeof handler === 'function') {
        callback = handler;
      } else if (
        handler &&
        typeof handler === 'object' &&
        'callback' in handler
      ) {
        const config = handler as MonitorEventHandlerConfig;
        if (typeof config.callback !== 'function') {
          console.warn(
            `useMonitorEvent: Invalid callback for event "${key}". Callbacks must be functions.`,
          );
          return;
        }
        callback = config.callback;
        debounceDelay = config.debounce;
        throttleDelay = config.throttle;
      } else {
        console.warn(
          `useMonitorEvent: Invalid handler for event "${key}". Expected a function or config object.`,
        );
        return;
      }

      // Apply debounce/throttle if specified
      if (debounceDelay !== undefined && throttleDelay !== undefined) {
        console.warn(
          `useMonitorEvent: Both debounce and throttle specified for event "${key}". Using debounce only.`,
        );
      }

      let wrappedCallback = callback;
      if (debounceDelay !== undefined && debounceDelay > 0) {
        wrappedCallback = createDebouncedCallback(callback, debounceDelay);
      } else if (throttleDelay !== undefined && throttleDelay > 0) {
        wrappedCallback = createThrottledCallback(callback, throttleDelay);
      }

      const unsubscribe = subscribe(key, wrappedCallback);
      unsubscribeFunctions.push(unsubscribe);
    });

    // Cleanup: unsubscribe from all events on unmount
    return () => {
      unsubscribeFunctions.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });

      // Clear any pending timeouts
      timeoutRefs.forEach((timeouts) => {
        timeouts.forEach((timeout) => clearTimeout(timeout));
      });
      timeoutRefs.clear();
    };
  }, [subscribe]);
}
