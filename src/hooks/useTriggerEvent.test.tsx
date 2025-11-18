import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { EventProvider } from '../context/EventContext.js';
import { EventDriver } from '../lib/EventDriver.js';
import { useTriggerEvent } from './useTriggerEvent.js';

describe('useTriggerEvent', () => {
  it('triggers events on the provided EventDriver', () => {
    const client = new EventDriver();
    const callback = vi.fn();

    client.subscribe('test-event', callback);

    const TestComponent = () => {
      const trigger = useTriggerEvent();

      React.useEffect(() => {
        trigger('test-event', 'data');
      }, [trigger]);

      return null;
    };

    render(
      <EventProvider client={client}>
        <TestComponent />
      </EventProvider>,
    );

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('data');
  });

  it('can be used with a typed EventMap', () => {
    type AppEvents = {
      'user-logged-in': { userId: number; username: string };
    };

    const client = new EventDriver();
    const callback = vi.fn();

    client.subscribe('user-logged-in', callback);

    const TestComponent = () => {
      const trigger = useTriggerEvent<AppEvents>();

      React.useEffect(() => {
        trigger('user-logged-in', { userId: 1, username: 'alice' });
      }, [trigger]);

      return null;
    };

    render(
      <EventProvider client={client}>
        <TestComponent />
      </EventProvider>,
    );

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ userId: 1, username: 'alice' });
  });
});
