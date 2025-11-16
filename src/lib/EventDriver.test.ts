import { expect, test } from 'vitest';
import { EventDriver } from './EventDriver.js';

test('EventDriver', () => {
  const eventDriver = new EventDriver();
  expect(eventDriver['test']).toBe('test');
});
