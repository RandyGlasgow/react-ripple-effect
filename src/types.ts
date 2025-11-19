import type { ReactNode } from 'react';
import type { EventDriver } from './lib/EventDriver';

// Legacy types for backward compatibility
export type EventCallback = (...args: any[]) => void | Promise<void>;
export type EventListeners = Map<string, Set<EventCallback>>;

// Generic types for type-safe event handling
export type TypedEventCallback<T = any> = (data: T) => void | Promise<void>;
export type EventMap = Record<string, any>;

// Extract event payload type from EventMap
export type EventPayload<
  TEventMap extends EventMap,
  TKey extends keyof TEventMap,
> = TEventMap[TKey];

// Typed event handlers for useMonitorEvent
export type TypedMonitorEventHandlers<TEventMap extends EventMap = EventMap> = {
  [K in keyof TEventMap]?: TypedEventCallback<TEventMap[K]>;
};

// Generic event context value
export interface TypedEventContextValue<TEventMap extends EventMap = EventMap> {
  subscribe: <TKey extends keyof TEventMap>(
    key: TKey,
    callback: TypedEventCallback<TEventMap[TKey]>,
  ) => () => void;
  trigger: <TKey extends keyof TEventMap>(
    key: TKey,
    ...args: TEventMap[TKey] extends undefined ? [] : [data: TEventMap[TKey]]
  ) => Promise<void>;
}

// Legacy interface for backward compatibility
export interface EventContextValue {
  subscribe: (key: string, callback: EventCallback) => () => void;
  trigger: (key: string, ...args: any[]) => Promise<void>;
  /**
   * Get the number of listeners for a specific event key
   */
  getListenerCount: (key: string) => number;
  /**
   * Check if there are any listeners for a specific event key
   */
  hasListeners: (key: string) => boolean;
  /**
   * Get all event keys that have listeners
   */
  getEventKeys: () => string[];
}

export interface EventProviderProps {
  children: ReactNode;
  client: EventDriver;
  /**
   * Maximum number of listeners allowed per event key.
   * Defaults to 100. Set to 0 for unlimited.
   */
  maxListeners?: number;
  /**
   * Enable debug mode for event logging.
   * Defaults to false.
   */
  debug?: boolean;
}

// Legacy interface for backward compatibility
export interface MonitorEventHandlers {
  [key: string]: EventCallback;
}

// Options for useMonitorEvent
export interface MonitorEventOptions {
  /**
   * Debounce delay in milliseconds.
   * When set, callbacks will only be called after the specified delay
   * has passed since the last event trigger.
   */
  debounce?: number;
  /**
   * Throttle delay in milliseconds.
   * When set, callbacks will be called at most once per specified delay.
   */
  throttle?: number;
}

// Handler configuration with options
export interface MonitorEventHandlerConfig<T = any> {
  callback: TypedEventCallback<T>;
  debounce?: number;
  throttle?: number;
}

// Enhanced handlers type that supports both simple callbacks and config objects
export type EnhancedMonitorEventHandlers<
  TEventMap extends EventMap = EventMap,
> = {
  [K in keyof TEventMap]?:
    | TypedEventCallback<TEventMap[K]>
    | MonitorEventHandlerConfig<TEventMap[K]>;
};
