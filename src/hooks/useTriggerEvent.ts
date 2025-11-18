import { useEventContext } from '../context/EventContext';
import type { EventMap } from '../types.js';

/**
 * Hook to trigger events in the event system
 *
 * @returns A function to trigger events
 *
 * @example
 * ```tsx
 * // Basic usage
 * const trigger = useTriggerEvent();
 * trigger('user-logged-in', { userId: 123 });
 *
 * // Type-safe usage with EventMap
 * type MyEvents = {
 *   'user-logged-in': { userId: number; username: string };
 *   'user-logged-out': { userId: number };
 * };
 *
 * const trigger = useTriggerEvent<MyEvents>();
 * trigger('user-logged-in', { userId: 123, username: 'john' });
 * // TypeScript will enforce the correct payload type
 * ```
 */
export function useTriggerEvent<TEventMap extends EventMap = EventMap>() {
  const { trigger } = useEventContext();
  return trigger as <TKey extends keyof TEventMap>(
    key: TKey,
    ...args: TEventMap[TKey] extends undefined ? [] : [data: TEventMap[TKey]]
  ) => void;
}
