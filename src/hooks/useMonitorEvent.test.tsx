import { act, render } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventProvider } from '../context/EventContext.js';
import { EventDriver } from '../lib/EventDriver.js';
import { useMonitorEvent } from './useMonitorEvent.js';

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useMonitorEvent', () => {
  it('subscribes to events and receives payloads', () => {
    const client = new EventDriver();
    const callback = vi.fn();

    const Subscriber = () => {
      useMonitorEvent({
        'test-event': callback,
      });
      return null;
    };

    render(
      <EventProvider client={client}>
        <Subscriber />
      </EventProvider>,
    );

    act(() => {
      client.trigger('test-event', 'data');
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('data');
  });

  it('supports typed EventMap handlers', () => {
    type AppEvents = {
      'user-logged-in': { userId: number; username: string };
    };

    const client = new EventDriver();
    const callback = vi.fn();

    const Subscriber = () => {
      useMonitorEvent<AppEvents>({
        'user-logged-in': (data) => callback(data),
      });
      return null;
    };

    render(
      <EventProvider client={client}>
        <Subscriber />
      </EventProvider>,
    );

    const payload = { userId: 1, username: 'alice' };

    act(() => {
      client.trigger('user-logged-in', payload);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(payload);
  });

  it('applies debounce to handler when configured', async () => {
    vi.useFakeTimers();

    const client = new EventDriver();
    const callback = vi.fn();

    const Subscriber = () => {
      useMonitorEvent({
        'debounced-event': {
          callback,
          debounce: 100,
        },
      });
      return null;
    };

    render(
      <EventProvider client={client}>
        <Subscriber />
      </EventProvider>,
    );

    act(() => {
      client.trigger('debounced-event', 'first');
      client.trigger('debounced-event', 'second');
      client.trigger('debounced-event', 'third');
    });

    // No immediate calls because of debounce
    expect(callback).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Only the last call should be delivered
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('third');
  });

  it('applies throttle to handler when configured', async () => {
    vi.useFakeTimers();

    const client = new EventDriver();
    const callback = vi.fn();

    const Subscriber = () => {
      useMonitorEvent({
        'throttled-event': {
          callback,
          throttle: 100,
        },
      });
      return null;
    };

    render(
      <EventProvider client={client}>
        <Subscriber />
      </EventProvider>,
    );

    act(() => {
      client.trigger('throttled-event', 'first');
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('first');

    act(() => {
      client.trigger('throttled-event', 'second');
      client.trigger('throttled-event', 'third');
    });

    // Still only first call until enough time passes
    expect(callback).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // After throttle period, the last pending call should be delivered
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('third');
  });

  it('logs a warning when both debounce and throttle are provided and prefers debounce', async () => {
    vi.useFakeTimers();

    const client = new EventDriver();
    const callback = vi.fn();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const Subscriber = () => {
      useMonitorEvent({
        'conflict-event': {
          callback,
          debounce: 100,
          throttle: 50,
        },
      });
      return null;
    };

    render(
      <EventProvider client={client}>
        <Subscriber />
      </EventProvider>,
    );

    act(() => {
      client.trigger('conflict-event', 'first');
      client.trigger('conflict-event', 'second');
    });

    // No immediate calls due to debounce
    expect(callback).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('second');
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('unsubscribes and clears timers on unmount', async () => {
    vi.useFakeTimers();

    const client = new EventDriver();
    const callback = vi.fn();

    const Subscriber = () => {
      useMonitorEvent({
        'debounced-event': {
          callback,
          debounce: 100,
        },
      });
      return null;
    };

    const { unmount } = render(
      <EventProvider client={client}>
        <Subscriber />
      </EventProvider>,
    );

    // Verify listener is registered
    expect(client.hasListeners('debounced-event')).toBe(true);

    // Unmount before triggering any events
    await act(async () => {
      unmount();
      // Give React time to run cleanup
      await Promise.resolve();
    });

    // Verify listener is removed after unmount
    expect(client.hasListeners('debounced-event')).toBe(false);

    // Now trigger an event - it should not be received since we unsubscribed
    act(() => {
      client.trigger('debounced-event', 'first');
    });

    // Advance timers - callback should not be called since we unsubscribed before triggering
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    // Callback should never be called because we unsubscribed before triggering
    expect(callback).not.toHaveBeenCalled();
  });
});
