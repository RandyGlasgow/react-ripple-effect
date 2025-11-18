import React from 'react';
import { EventDriver } from '../lib/EventDriver';
import type {
  EventCallback,
  EventContextValue,
  EventProviderProps,
} from '../types';

const EventContext = React.createContext<EventContextValue | null>(null);

export const useEventContext = (): EventContextValue => {
  const context = React.useContext(EventContext);
  if (!context) {
    throw new Error(
      'useTriggerEvent and useMonitorEvent must be used within an EventProvider',
    );
  }
  return context;
};

export const EventProvider = ({
  children,
  maxListeners = 100,
  debug = false,
  client,
}: EventProviderProps) => {
  const listenersRef = React.useRef<EventDriver>(client);

  const subscribe = React.useCallback(
    (key: string, callback: EventCallback) => {
      return listenersRef.current.subscribe(key, callback);
    },
    [],
  );

  const trigger = React.useCallback((key: string, ...args: any[]) => {
    return listenersRef.current.trigger(key, ...args);
  }, []);

  const getListenerCount = React.useCallback((key: string): number => {
    return listenersRef.current.getListenerCount(key);
  }, []);

  const hasListeners = React.useCallback(
    (key: string): boolean => {
      return listenersRef.current.hasListeners(key);
    },
    [getListenerCount],
  );

  const getEventKeys = React.useCallback((): string[] => {
    return listenersRef.current.getEventKeys();
  }, []);

  const value = React.useMemo<EventContextValue>(
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
