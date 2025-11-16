import type { EventListeners } from '../types.js';

export class EventDriver {
  private listeners: EventListeners = new Map();

  constructor() {}

  private _invalidateKey(key: string) {
    if (!key || typeof key !== 'string') {
      throw new Error(
        `Invalid event key. Expected a non-empty string, got "${key}".`,
      );
    }
  }
  private _invalidateCallback(callback: (...args: any[]) => void) {
    if (typeof callback !== 'function') {
      throw new Error(
        `Invalid callback. Expected a function, got "${typeof callback}".`,
      );
    }
  }

  subscribe(key: string, callback: (...args: any[]) => void) {
    this._invalidateKey(key);
    this._invalidateCallback(callback);
    const listeners = this.listeners.get(key);
    if (!listeners) {
      this.listeners.set(key, new Set([callback]));
    } else {
      listeners.add(callback);
    }

    return () => {
      // Unsubscribe function (idempotent)
      const currentListeners = this.listeners.get(key);
      if (!currentListeners) {
        return;
      }
      currentListeners.delete(callback);
      if (currentListeners.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  trigger(key: string, ...args: any[]) {
    this._invalidateKey(key);

    const listeners = this.listeners.get(key);
    if (!listeners) {
      return;
    }

    listeners.forEach((callback) => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in callback for event "${key}":`, error);
      }
    });
  }

  cleanup() {
    this.listeners.forEach((listeners) => listeners.clear());
    this.listeners.clear();
  }

  getListenerCount(key: string): number {
    const listeners = this.listeners.get(key);
    return listeners ? listeners.size : 0;
  }

  hasListeners(key: string): boolean {
    return this.getListenerCount(key) > 0;
  }

  getEventKeys(): string[] {
    return Array.from(this.listeners.keys());
  }

  getValues(): EventListeners {
    return this.listeners;
  }
}
