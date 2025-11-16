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
