import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventDriver } from '../lib/EventDriver.js';

let eventDriver: EventDriver;

beforeEach(() => {
  eventDriver = new EventDriver();
});

afterEach(() => {
  eventDriver.cleanup();
});

describe('EventDriver', () => {
  it('should subscribe to an event', () => {
    const callback = vi.fn();

    eventDriver.subscribe('test-event', callback);
    expect(eventDriver.getListenerCount('test-event')).toBe(1);
    expect(eventDriver.hasListeners('test-event')).toBe(true);
    expect(eventDriver.getEventKeys()).toEqual(['test-event']);
    expect(eventDriver.getValues()).toEqual(
      new Map([['test-event', new Set([callback])]]),
    );
  });

  it('should unsubscribe from an event', () => {
    const callback = vi.fn();

    const unsubscribe = eventDriver.subscribe('test-event', callback);
    expect(eventDriver.getListenerCount('test-event')).toBe(1);
    expect(eventDriver.hasListeners('test-event')).toBe(true);
    expect(eventDriver.getEventKeys()).toEqual(['test-event']);
    expect(eventDriver.getValues()).toEqual(
      new Map([['test-event', new Set([callback])]]),
    );

    unsubscribe();
    expect(eventDriver.getListenerCount('test-event')).toBe(0);
    expect(eventDriver.hasListeners('test-event')).toBe(false);
    expect(eventDriver.getEventKeys()).toEqual([]);
    expect(eventDriver.getValues()).toEqual(new Map());
  });

  const setupTest = () => {
    const callback = vi.fn();

    const unsubscribe = eventDriver.subscribe('test-event', callback);

    return { callback, unsubscribe };
  };

  it('should trigger an event', () => {
    const { callback, unsubscribe } = setupTest();

    eventDriver.trigger('test-event', 'data');
    expect(callback).toHaveBeenCalledWith('data');
  });

  it('should unsubscribe from an event', () => {
    const { callback, unsubscribe } = setupTest();

    unsubscribe();
    expect(callback).not.toHaveBeenCalled();
  });

  describe('Invalid:', () => {
    describe('event key', () => {
      it.each([
        ['', 'data'],
        [null as any, 'data'],
        [undefined as any, 'data'],
        [1 as any, 'data'],
        [true as any, 'data'],
        [false as any, 'data'],
        [Symbol('test') as any, 'data'],
        [BigInt(1) as any, 'data'],
      ])('should throw an error for invalid event key %s', (eventKey, data) => {
        setupTest();
        expect(() => eventDriver.trigger(eventKey, data)).toThrow();
      });
    });
    describe('callback', () => {
      it.each([
        [null as any, 'data'],
        [undefined as any, 'data'],
        [1 as any, 'data'],
        [true as any, 'data'],
        [false as any, 'data'],
        [Symbol('test') as any, 'data'],
        [BigInt(1) as any, 'data'],
      ])('should throw an error for invalid callback %s', (callback) => {
        setupTest();
        expect(() => eventDriver.subscribe('test-event', callback)).toThrow();
      });
    });
  });

  it('should cleanup all listeners', () => {
    setupTest();
    eventDriver.cleanup();
    expect(eventDriver.getListenerCount('test-event')).toBe(0);
    expect(eventDriver.hasListeners('test-event')).toBe(false);
    expect(eventDriver.getEventKeys()).toEqual([]);
    expect(eventDriver.getValues()).toEqual(new Map());
  });

  describe('Helper methods', () => {
    it('should return true if there are listeners for an event', () => {
      expect(eventDriver.hasListeners('test-event')).toBe(false);
      setupTest();
      expect(eventDriver.hasListeners('test-event')).toBe(true);
    });
    it('should return the number of listeners for an event', () => {
      expect(eventDriver.getListenerCount('test-event')).toBe(0);
      setupTest();
      expect(eventDriver.getListenerCount('test-event')).toBe(1);
    });
    it('should return all event keys', () => {
      expect(eventDriver.getEventKeys()).toEqual([]);
      setupTest();
      expect(eventDriver.getEventKeys()).toEqual(['test-event']);
    });
    it('should return all listeners for an event', () => {
      expect(eventDriver.getValues()).toEqual(new Map());
      const { callback } = setupTest();
      expect(eventDriver.getValues()).toEqual(
        new Map([['test-event', new Set([callback])]]),
      );
    });
  });
});

describe('Edge Cases', () => {
  it('should handle multiple listeners for the same event', () => {
    const callback = vi.fn();
    const callback2 = vi.fn();
    eventDriver.subscribe('test-event', callback);
    eventDriver.subscribe('test-event', callback2);
    expect(eventDriver.getListenerCount('test-event')).toBe(2);
    eventDriver.trigger('test-event', 'data');
    expect(callback).toHaveBeenCalledWith('data');
    expect(callback2).toHaveBeenCalledWith('data');
    eventDriver.cleanup();
    expect(eventDriver.getListenerCount('test-event')).toBe(0);
    expect(eventDriver.hasListeners('test-event')).toBe(false);
    expect(eventDriver.getEventKeys()).toEqual([]);
    expect(eventDriver.getValues()).toEqual(new Map());
  });

  it('should handle multiple events', () => {
    const callback = vi.fn();
    const callback2 = vi.fn();
    eventDriver.subscribe('test-event', callback);
    eventDriver.subscribe('test-event2', callback2);
    expect(eventDriver.getListenerCount('test-event')).toBe(1);
    expect(eventDriver.getListenerCount('test-event2')).toBe(1);
    eventDriver.trigger('test-event', 'data');
    eventDriver.trigger('test-event2', 'data');
    eventDriver.cleanup();
  });

  it('should handle multiple events with the same callback', () => {
    const callback = vi.fn();
    eventDriver.subscribe('test-event', callback);
    eventDriver.subscribe('test-event2', callback);
    expect(eventDriver.getListenerCount('test-event')).toBe(1);
    expect(eventDriver.getListenerCount('test-event2')).toBe(1);

    eventDriver.trigger('test-event', 'data');
    eventDriver.trigger('test-event2', 'data');
    expect(callback).toHaveBeenCalledWith('data');
    expect(callback).toHaveBeenCalledWith('data');
    eventDriver.cleanup();
  });
  it('should handle multiple events with the same callback and different data', () => {
    const callback = vi.fn();
    eventDriver.subscribe('test-event', callback);
    eventDriver.subscribe('test-event2', callback);
    expect(eventDriver.getListenerCount('test-event')).toBe(1);
    expect(eventDriver.getListenerCount('test-event2')).toBe(1);
    eventDriver.trigger('test-event', 'data');
    eventDriver.trigger('test-event2', 'data2');
    expect(callback).toHaveBeenCalledWith('data');
    expect(callback).toHaveBeenCalledWith('data2');
  });
});

describe('Performance', () => {
  it('should only call the callback once even if there are duplicate subscribers', () => {
    const callback = vi.fn();
    eventDriver.subscribe('test-event', callback);
    eventDriver.subscribe('test-event', callback);
    eventDriver.trigger('test-event', 'data');
    expect(callback).toHaveBeenCalledWith('data');
    expect(callback).toHaveBeenCalledTimes(1);
    eventDriver.cleanup();
  });

  it('should handle 10000 subscribers', () => {
    const callback = vi.fn();
    for (let i = 0; i < 10000; i++) {
      eventDriver.subscribe('test-event', callback);
    }
    eventDriver.trigger('test-event', 'data');
    expect(callback).toHaveBeenCalledWith('data');
    expect(callback).toHaveBeenCalledTimes(1);
    eventDriver.cleanup();
  });

  it('should handle 10000 triggers', () => {
    const callback = vi.fn();
    eventDriver.subscribe('test-event', callback);
    for (let i = 0; i < 10000; i++) {
      eventDriver.trigger('test-event', 'data');
    }
    expect(callback).toHaveBeenCalledWith('data');
    expect(callback).toHaveBeenCalledTimes(10000);
    eventDriver.cleanup();
  });

  it('should handle 10000 subscribers and 10000 triggers', () => {
    const callback = vi.fn();
    for (let i = 0; i < 10000; i++) {
      eventDriver.subscribe('test-event', callback);
    }
    for (let i = 0; i < 10000; i++) {
      eventDriver.trigger('test-event', 'data');
    }
    expect(callback).toHaveBeenCalledWith('data');
    expect(callback).toHaveBeenCalledTimes(10000);
    eventDriver.cleanup();
  });

  it('should handle 10000 subscribers and 10000 triggers with different events', () => {
    const callback = vi.fn();
    // setup 10000 listeners for different events
    for (let i = 0; i < 10000; i++) {
      eventDriver.subscribe(`test-event-${i}`, callback);
    }
    // trigger 10000 events with different data
    for (let i = 0; i < 10000; i++) {
      eventDriver.trigger(`test-event-${i}`, `data-${i}`);
    }
    expect(callback).toHaveBeenCalledTimes(10000);
    expect(callback.mock.calls.map((call) => call[0])).toEqual(
      Array.from({ length: 10000 }, (_, i) => `data-${i}`),
    );
    eventDriver.cleanup();
  });
});

describe('Async Callbacks', () => {
  it('should handle async callbacks', async () => {
    const callback = vi.fn(async (data: string) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return data;
    });

    eventDriver.subscribe('test-event', callback);
    const promise = eventDriver.trigger('test-event', 'data');

    expect(callback).toHaveBeenCalledWith('data');
    expect(promise).toBeInstanceOf(Promise);

    await promise;
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should return a resolved promise when no listeners exist', async () => {
    const promise = eventDriver.trigger('test-event', 'data');
    expect(promise).toBeInstanceOf(Promise);
    await expect(promise).resolves.toBeUndefined();
  });

  it('should return a resolved promise immediately when all callbacks are sync', async () => {
    const callback = vi.fn();
    eventDriver.subscribe('test-event', callback);

    const promise = eventDriver.trigger('test-event', 'data');
    expect(promise).toBeInstanceOf(Promise);
    expect(callback).toHaveBeenCalledWith('data');

    await promise;
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should wait for all async callbacks to complete', async () => {
    const callback1 = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    const callback2 = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    eventDriver.subscribe('test-event', callback1);
    eventDriver.subscribe('test-event', callback2);

    const startTime = Date.now();
    await eventDriver.trigger('test-event', 'data');
    const endTime = Date.now();

    expect(callback1).toHaveBeenCalledWith('data');
    expect(callback2).toHaveBeenCalledWith('data');
    // Should complete in approximately 50ms (concurrent execution), not 100ms
    expect(endTime - startTime).toBeLessThan(100);
  });

  it('should handle mixed sync and async callbacks', async () => {
    const syncCallback = vi.fn();
    const asyncCallback = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    eventDriver.subscribe('test-event', syncCallback);
    eventDriver.subscribe('test-event', asyncCallback);

    const promise = eventDriver.trigger('test-event', 'data');

    // Sync callback should be called immediately
    expect(syncCallback).toHaveBeenCalledWith('data');
    expect(asyncCallback).toHaveBeenCalledWith('data');

    await promise;
    expect(syncCallback).toHaveBeenCalledTimes(1);
    expect(asyncCallback).toHaveBeenCalledTimes(1);
  });

  it('should handle errors in async callbacks gracefully', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const errorCallback = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      throw new Error('Async error');
    });
    const successCallback = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    eventDriver.subscribe('test-event', errorCallback);
    eventDriver.subscribe('test-event', successCallback);

    const promise = eventDriver.trigger('test-event', 'data');

    // Should not throw, but log the error
    await expect(promise).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error in async callback for event "test-event"'),
      expect.any(Error),
    );
    expect(successCallback).toHaveBeenCalledWith('data');

    consoleErrorSpy.mockRestore();
  });

  it('should handle errors in sync callbacks gracefully', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const errorCallback = vi.fn(() => {
      throw new Error('Sync error');
    });
    const successCallback = vi.fn();

    eventDriver.subscribe('test-event', errorCallback);
    eventDriver.subscribe('test-event', successCallback);

    const promise = eventDriver.trigger('test-event', 'data');

    // Should not throw, but log the error
    expect(promise).toBeInstanceOf(Promise);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error in callback for event "test-event"'),
      expect.any(Error),
    );
    expect(successCallback).toHaveBeenCalledWith('data');

    consoleErrorSpy.mockRestore();
  });

  it('should handle multiple async callbacks with different delays', async () => {
    const results: number[] = [];
    const callback1 = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      results.push(1);
    });
    const callback2 = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      results.push(2);
    });
    const callback3 = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      results.push(3);
    });

    eventDriver.subscribe('test-event', callback1);
    eventDriver.subscribe('test-event', callback2);
    eventDriver.subscribe('test-event', callback3);

    await eventDriver.trigger('test-event', 'data');

    // All callbacks should have completed
    expect(results.length).toBe(3);
    expect(results).toContain(1);
    expect(results).toContain(2);
    expect(results).toContain(3);
  });

  it('should await trigger results correctly', async () => {
    let completed = false;
    const callback = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      completed = true;
    });

    eventDriver.subscribe('test-event', callback);

    const promise = eventDriver.trigger('test-event', 'data');
    expect(completed).toBe(false);

    await promise;
    expect(completed).toBe(true);
  });

  it('should handle chained async operations', async () => {
    const callback = vi.fn(async (data: string) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return data.toUpperCase();
    });

    eventDriver.subscribe('test-event', callback);

    await eventDriver.trigger('test-event', 'hello');
    expect(callback).toHaveBeenCalledWith('hello');
  });
});
