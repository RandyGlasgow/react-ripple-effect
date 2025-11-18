import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { EventDriver } from '../lib/EventDriver.js';
import { EventProvider, useEventContext } from './EventContext.js';

describe('EventContext', () => {
  it('throws if hooks are used outside of EventProvider', () => {
    const TestComponent = () => {
      useEventContext();
      return null;
    };

    expect(() => {
      render(<TestComponent />);
    }).toThrowError(
      'useTriggerEvent and useMonitorEvent must be used within an EventProvider',
    );
  });

  it('provides a working subscribe/trigger API via EventProvider', () => {
    const client = new EventDriver();
    const callback = vi.fn();

    const Subscriber = () => {
      const { subscribe } = useEventContext();

      React.useEffect(() => {
        const unsubscribe = subscribe('test-event', callback);
        return () => unsubscribe();
      }, [subscribe]);

      return null;
    };

    render(
      <EventProvider client={client}>
        <Subscriber />
      </EventProvider>,
    );

    client.trigger('test-event', 'data');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('data');
  });

  it('exposes listener introspection helpers from EventDriver', () => {
    const client = new EventDriver();

    const results: {
      beforeCount?: number;
      afterCount?: number;
      hasBefore?: boolean;
      hasAfter?: boolean;
      keys?: string[];
    } = {};

    const Subscriber = () => {
      const { subscribe, getListenerCount, hasListeners, getEventKeys } =
        useEventContext();

      React.useEffect(() => {
        results.beforeCount = getListenerCount('test-event');
        results.hasBefore = hasListeners('test-event');

        const unsubscribe = subscribe('test-event', () => {});

        results.afterCount = getListenerCount('test-event');
        results.hasAfter = hasListeners('test-event');
        results.keys = getEventKeys();

        return () => unsubscribe();
      }, [subscribe, getListenerCount, hasListeners, getEventKeys]);

      return null;
    };

    render(
      <EventProvider client={client}>
        <Subscriber />
      </EventProvider>,
    );

    expect(results.beforeCount).toBe(0);
    expect(results.hasBefore).toBe(false);
    expect(results.afterCount).toBe(1);
    expect(results.hasAfter).toBe(true);
    expect(results.keys).toEqual(['test-event']);
  });
});
