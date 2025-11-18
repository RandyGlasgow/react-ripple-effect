# React Ripple Effect

A tiny, hook-based event bus for React that lets your components communicate via named events.

`@protoworx/react-ripple-effect` gives you:

- A lightweight in‑memory **event driver**.
- A React **provider** to expose it to your component tree.
- Hooks to **trigger** and **monitor** events, with optional debounce/throttle.
- Optional **TypeScript type safety** for event keys and payloads.

## Installation

```bash
npm install @protoworx/react-ripple-effect
# or
yarn add @protoworx/react-ripple-effect
# or
pnpm add @protoworx/react-ripple-effect
```

## Quick start

Create a single `EventDriver`, wrap your app with `EventProvider`, then use hooks to trigger and monitor events:

```tsx
'use client';

import {
  EventDriver,
  EventProvider,
  useMonitorEvent,
  useTriggerEvent,
} from '@protoworx/react-ripple-effect';

const client = new EventDriver();

export default function App() {
  return (
    <EventProvider client={client}>
      <TriggerEventButton />
      <MonitorEventLog />
    </EventProvider>
  );
}

function TriggerEventButton() {
  const trigger = useTriggerEvent();

  return (
    <button onClick={() => trigger('test', 'Hello, world!')}>
      Trigger Event
    </button>
  );
}

function MonitorEventLog() {
  useMonitorEvent({
    test: (data: string) => {
      console.log('Test event:', data);
    },
  });

  return <div>Listening for "test" events…</div>;
}
```

**How it works:**

- `EventDriver` is an in‑memory event bus.
- `EventProvider` makes it available to your React tree via context.
- `useTriggerEvent` returns a function you can call with an event key and payload.
- `useMonitorEvent` subscribes to one or more event keys and runs your callbacks whenever those events fire.

## Type‑safe events (TypeScript)

You can define an `EventMap` to get full type safety for event keys and payloads:

```ts
type AppEvents = {
  'user-logged-in': { userId: number; username: string };
  'toast.show': { message: string; type?: 'info' | 'error' };
};
```

Use it with the hooks:

```tsx
// Triggering
const trigger = useTriggerEvent<AppEvents>();

trigger('user-logged-in', { userId: 1, username: 'alice' });
trigger('toast.show', { message: 'Saved!', type: 'info' });

// Monitoring
useMonitorEvent<AppEvents>({
  'user-logged-in': (data) => {
    // data: { userId: number; username: string }
    console.log('Logged in as', data.username);
  },
  'toast.show': (data) => {
    console.log('Toast:', data.message);
  },
});
```

TypeScript will:

- Restrict `key` to known event names in your `AppEvents` map.
- Enforce the correct payload type per key.

## Debounce & throttle with `useMonitorEvent`

`useMonitorEvent` accepts either simple callbacks or configuration objects that support `debounce` and `throttle`:

```tsx
useMonitorEvent({
  'search:input': {
    callback: (query: string) => {
      // Only fire after the user stops typing for 300ms
      performSearch(query);
    },
    debounce: 300,
  },
  'window:scroll': {
    callback: () => {
      // At most once per 100ms
      updateScrollPosition();
    },
    throttle: 100,
  },
});
```

Notes:

- If both `debounce` and `throttle` are specified, **debounce wins** and a warning is logged.
- All subscriptions and timers are cleaned up automatically when the component unmounts.

## API reference

### `EventDriver`

A minimal in‑memory event bus.

```ts
import { EventDriver } from '@protoworx/react-ripple-effect';

const driver = new EventDriver();
```

Methods:

- `subscribe(key: string, callback: (...args: any[]) => void): () => void`
  - Registers a listener for `key`.
  - Returns an **unsubscribe** function (idempotent).
- `trigger(key: string, ...args: any[]): void`
  - Calls all listeners registered for `key` with the given arguments.
- `getListenerCount(key: string): number`
  - Returns the number of active listeners for `key`.
- `hasListeners(key: string): boolean`
  - Returns `true` if there is at least one listener for `key`.
- `getEventKeys(): string[]`
  - Returns all event keys that currently have listeners.
- `cleanup(): void`
  - Removes all listeners for all keys.

### `<EventProvider />`

```tsx
import { EventProvider, EventDriver } from '@protoworx/react-ripple-effect';

const client = new EventDriver();

export function Root({ children }: { children: React.ReactNode }) {
  return <EventProvider client={client}>{children}</EventProvider>;
}
```

Props:

- `client: EventDriver` – the event driver instance to use.
- `maxListeners?: number` – maximum number of listeners per key (reserved for future limits; currently not enforced).
- `debug?: boolean` – flag to enable additional logging (reserved for future use).

### `useTriggerEvent`

```tsx
const trigger = useTriggerEvent(); // or useTriggerEvent<AppEvents>()

trigger('some-event', { foo: 'bar' });
```

- Returns a function to trigger events by key.
- When used with a generic `EventMap`, keys and payloads are fully typed.

### `useMonitorEvent`

```tsx
useMonitorEvent({
  'some-event': (payload) => {
    console.log('Got some-event with', payload);
  },
});
```

- Accepts an object mapping event keys to:
  - A callback function, or
  - A config object `{ callback, debounce?, throttle? }`.
- Automatically subscribes on mount and unsubscribes on unmount.

## Best practices

- Create a single `EventDriver` per application (or per logical scope) and share it via `EventProvider`.
- Use descriptive event keys like `'user:logged-in'`, `'cart:item-added'`, `'toast.show'`.
- Prefer events for **cross-cutting concerns** (analytics, toasts, background sync) where components shouldn’t know about each other directly.
- Use type-safe `EventMap`s in TypeScript code for better DX and safer refactoring.

## Error handling & validation

Internally, the event driver:

- Validates that event keys are non‑empty strings and callbacks are functions, throwing helpful errors otherwise.
- Wraps each listener call in a `try/catch` and logs errors to `console.error` so one failing listener doesn’t break others.

## License

MIT
