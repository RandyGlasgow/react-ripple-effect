# react-ripple-effect

## 0.0.6

### Patch Changes

- bac5fc0: The EventDriver system has been enhanced to support asynchronous callbacks while maintaining full backward compatibility with existing synchronous callbacks. This allows developers to use async/await patterns with event triggers when needed, without requiring changes to existing code.

  The EventDriver's trigger method now returns a Promise that resolves when all asynchronous callbacks have completed. The system automatically detects whether callbacks are synchronous or asynchronous and handles them appropriately. Synchronous callbacks execute immediately as before, while asynchronous callbacks are collected and awaited concurrently.

  All relevant type definitions have been updated to reflect that callbacks can now return either void or a Promise. The trigger method signatures across the codebase now indicate that they return a Promise, enabling proper TypeScript type checking and IntelliSense support for async operations.

  Error handling has been enhanced to properly manage errors in both synchronous and asynchronous callbacks. Synchronous errors are caught and logged immediately, while asynchronous errors are caught, logged, and handled without preventing other callbacks from executing. This ensures that one failing callback doesn't break the entire event system.

  Existing code continues to work without any modifications. The trigger method can still be called without awaiting it, maintaining the fire-and-forget behavior that many applications rely on. This ensures a smooth transition path for existing codebases.

  When async callbacks are registered, the system automatically detects them and ensures they complete before the trigger promise resolves. This allows developers to await event triggers when they need to ensure all handlers have finished processing.

  The system gracefully handles scenarios where some callbacks are synchronous and others are asynchronous. Synchronous callbacks execute immediately, while asynchronous callbacks run concurrently and are awaited. This provides maximum flexibility for different use cases.

  Multiple asynchronous callbacks execute concurrently rather than sequentially, providing optimal performance. This means that if multiple async handlers are registered for the same event, they all start processing simultaneously and the trigger waits for all of them to complete.

  The core EventDriver class now checks each callback's return value to determine if it's a Promise. When Promises are detected, they're collected and awaited using Promise.all, which ensures concurrent execution. If no async callbacks are present, the method returns an immediately resolved Promise, maintaining performance for synchronous-only scenarios.

  The React context wrapper and useTriggerEvent hook have been updated to properly propagate the Promise return type through the component tree. This ensures that TypeScript correctly types the trigger function throughout the application.

  A comprehensive test suite has been added covering async callback execution, mixed sync/async scenarios, error handling, and concurrent execution verification. All existing tests continue to pass, confirming backward compatibility.

  Developers can now use modern async/await patterns with the event system, making it easier to coordinate asynchronous operations triggered by events. This is particularly useful for scenarios like data persistence, API calls, or any operation that requires waiting for completion.

  Applications can now ensure that event handlers complete before proceeding, enabling better control flow and error handling. This is especially valuable for operations that need to complete before the next step in a workflow.

  TypeScript users benefit from improved type safety, as the Promise return type is properly reflected throughout the type system. This helps catch potential issues at compile time and provides better IDE support.

  No migration is required for existing code. The changes are fully backward compatible, and existing synchronous callbacks continue to work exactly as they did before. Developers can gradually adopt async patterns where they make sense, without needing to refactor existing code.

  The implementation maintains optimal performance characteristics. Synchronous callbacks have no performance overhead, executing immediately as before. Asynchronous callbacks execute concurrently, ensuring that multiple async handlers don't create unnecessary sequential delays. When no async callbacks are present, the system returns an immediately resolved Promise with minimal overhead.

  The implementation includes extensive test coverage for all new functionality, including async callback execution, mixed scenarios, error handling, and edge cases. All 54 tests pass, including 11 new tests specifically for async functionality and 43 existing tests that verify backward compatibility.

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
