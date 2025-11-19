# React Ripple Effect

A tiny, hook-based event bus for React that lets your components communicate via named events.

`@protoworx/react-ripple-effect` gives you:

- A lightweight in‑memory **event driver**.
- A React **provider** to expose it to your component tree.
- Hooks to **trigger** and **monitor** events, with optional debounce/throttle.
- **Async callback support** - await event triggers when handlers complete.
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

## Async callbacks

The event system supports both synchronous and asynchronous callbacks. The `trigger` method returns a Promise that resolves when all async callbacks complete, allowing you to await event triggers when needed.

### Using async callbacks

You can register async callbacks and await the trigger:

```tsx
// Subscribe with async callback
useMonitorEvent({
  'save-data': async (data) => {
    await saveToDatabase(data);
    console.log('Data saved!');
  },
});

// Trigger and await
const trigger = useTriggerEvent();
await trigger('save-data', { userId: 123 });
console.log('All handlers completed');
```

### Mixed sync and async callbacks

The system seamlessly handles mixed scenarios:

```tsx
// Sync callback executes immediately
useMonitorEvent({
  'user-action': (data) => {
    console.log('Sync handler:', data);
  },
});

// Async callback runs concurrently
useMonitorEvent({
  'user-action': async (data) => {
    await logToAnalytics(data);
  },
});

// Sync executes immediately, async runs concurrently
await trigger('user-action', { action: 'click' });
```

### Key points

- **Synchronous callbacks** execute immediately as before (backward compatible).
- **Asynchronous callbacks** are detected automatically and awaited concurrently.
- **Mixed scenarios** are fully supported - sync runs immediately, async runs concurrently.
- **Error handling** - errors in one callback don't prevent others from executing.
- **No breaking changes** - existing code continues to work without modification.

## API reference

### `EventDriver`

A minimal in‑memory event bus.

```ts
import { EventDriver } from '@protoworx/react-ripple-effect';

const driver = new EventDriver();
```

Methods:

- `subscribe(key: string, callback: (...args: any[]) => void | Promise<void>): () => void`
  - Registers a listener for `key`. Callbacks can be synchronous or asynchronous.
  - Returns an **unsubscribe** function (idempotent).
- `trigger(key: string, ...args: any[]): Promise<void>`
  - Calls all listeners registered for `key` with the given arguments.
  - Returns a Promise that resolves when all async callbacks complete.
  - If all callbacks are synchronous, returns an immediately resolved Promise.
  - Async callbacks execute concurrently for optimal performance.
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

// Fire-and-forget (still works as before)
trigger('some-event', { foo: 'bar' });

// Await completion (when using async callbacks)
await trigger('some-event', { foo: 'bar' });
```

- Returns a function to trigger events by key.
- The function returns a `Promise<void>` that resolves when all async callbacks complete.
- When used with a generic `EventMap`, keys and payloads are fully typed.
- Can be called without awaiting for backward compatibility.

### `useMonitorEvent`

```tsx
// Synchronous callback
useMonitorEvent({
  'some-event': (payload) => {
    console.log('Got some-event with', payload);
  },
});

// Asynchronous callback
useMonitorEvent({
  'some-event': async (payload) => {
    await processPayload(payload);
    console.log('Processed payload');
  },
});
```

- Accepts an object mapping event keys to:
  - A callback function (sync or async), or
  - A config object `{ callback, debounce?, throttle? }` (callback can be sync or async).
- Automatically subscribes on mount and unsubscribes on unmount.
- Supports both synchronous and asynchronous callbacks seamlessly.

## Best practices

- Create a single `EventDriver` per application (or per logical scope) and share it via `EventProvider`.
- Use descriptive event keys like `'user:logged-in'`, `'cart:item-added'`, `'toast.show'`.
- Prefer events for **cross-cutting concerns** (analytics, toasts, background sync) where components shouldn’t know about each other directly.
- Use type-safe `EventMap`s in TypeScript code for better DX and safer refactoring.

## Error handling & validation

Internally, the event driver:

- Validates that event keys are non‑empty strings and callbacks are functions, throwing helpful errors otherwise.
- Wraps each listener call in a `try/catch` and logs errors to `console.error` so one failing listener doesn't break others.
- Handles errors in both synchronous and asynchronous callbacks gracefully.
- Async callback errors are caught and logged without preventing other callbacks from executing.

## License

MIT
