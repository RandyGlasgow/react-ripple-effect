# react-ripple-effect

## 0.0.6

### Minor Changes

- **Async Callback Support**: Updated EventDriver to handle awaitable async functions

#### Summary

The EventDriver now supports both synchronous and asynchronous callbacks seamlessly. The `trigger()` method returns a `Promise<void>` that resolves when all async callbacks complete, while maintaining full backward compatibility with existing synchronous callbacks.

#### Changes

- **EventDriver.trigger()**: Now returns `Promise<void>` and handles both sync and async callbacks
  - Sync callbacks execute immediately as before
  - Async callbacks are detected and awaited concurrently using `Promise.all()`
  - Returns a resolved promise immediately if all callbacks are sync
  - Returns a promise that resolves when all async callbacks complete

- **Type Updates**:
  - `EventCallback`: Now accepts `(...args: any[]) => void | Promise<void>`
  - `TypedEventCallback`: Now accepts `(data: T) => void | Promise<void>`
  - `EventContextValue.trigger`: Now returns `Promise<void>`
  - `TypedEventContextValue.trigger`: Now returns `Promise<void>`
  - `useTriggerEvent`: Return type updated to `Promise<void>`

- **Error Handling**:
  - Sync callback errors are caught and logged (existing behavior)
  - Async callback errors are caught, logged, and don't prevent other callbacks from executing

#### Usage Examples

```typescript
// Sync callback (backward compatible)
eventDriver.subscribe('event', (data) => {
  console.log(data);
});
await eventDriver.trigger('event', 'data'); // Returns immediately

// Async callback
eventDriver.subscribe('event', async (data) => {
  await fetch('/api', { body: data });
});
await eventDriver.trigger('event', 'data'); // Waits for async callback

// Mixed sync and async
eventDriver.subscribe('event', (data) => console.log('sync', data));
eventDriver.subscribe('event', async (data) => {
  await saveToDatabase(data);
});
await eventDriver.trigger('event', 'data'); // Waits for async, sync executes immediately
```

#### Migration Guide

No breaking changes for existing code. The `trigger()` method now returns a Promise, but you can still call it without awaiting:

```typescript
// Still works (fire-and-forget)
trigger('event', data);

// Now you can also await it
await trigger('event', data);
```

#### Testing

- Added comprehensive test suite for async callbacks
- Tests for mixed sync/async scenarios
- Tests for error handling in both sync and async callbacks
- All existing tests continue to pass (54 tests total)

## 0.0.5

### Patch Changes

- 4d83aca: update tests, update dev packages

## 0.0.4

### Patch Changes

- bf55ddd: update driver and extract init logic

## 0.0.3

### Patch Changes

- 12b7114: Updates the context

## 0.0.2

### Patch Changes

- df429e7: Initial pass

## 1.4.1

### Patch Changes

- 9b84067: updated build

## 1.4.0

### Minor Changes

- 68d695a: Change revert to master

## 1.3.0

### Minor Changes

- 05fad4d: add a test hook

## 1.2.2

### Patch Changes

- cd6a782: test

## 1.2.1

### Patch Changes

- d7f35ce: patch

## 1.2.0

### Minor Changes

- 6bf5fdf: change out for driver class

## 1.1.0

### Minor Changes

- 6aea8dc: exposes api for event provider and hooks

## 1.0.0

### Major Changes

- 95885e1: First implementation of the event driver

## 0.0.3

### Patch Changes

- db75fb5: none

## 0.0.2

### Patch Changes

- 1a44159: nothing

## 1.0.1

### Patch Changes

- e99ede0: Initial class component
