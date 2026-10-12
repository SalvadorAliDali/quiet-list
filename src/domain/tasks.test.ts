import { describe, expect, it } from 'vitest';
import { historyReducer, taskCategory, validTaskColor } from './tasks';
import type { History, Task } from './types';

const task: Task = { id: 'a', text: 'Write portfolio README' };
const empty: History = { past: [], present: [] };
describe('task history', () => {
  it('restores edited descriptions and completion with undo', () => {
    const added = historyReducer(empty, { type: 'add', task });
    const edited = historyReducer(added, {
      type: 'update',
      task: { ...task, description: 'Details', completed: true },
    });
    expect(historyReducer(edited, { type: 'undo' }).present).toEqual([task]);
    expect(added.present).toEqual([task]);
  });
  it('restores an entire cleared list', () => {
    const state = { past: [], present: [task, { id: 'b', text: 'Second' }] };
    expect(
      historyReducer(historyReducer(state, { type: 'clear' }), { type: 'undo' }).present,
    ).toEqual(state.present);
  });
  it('restores a removed task at its original position', () => {
    const state = { past: [], present: [task, { id: 'b', text: 'Second' }] };
    expect(
      historyReducer(historyReducer(state, { type: 'remove', id: 'a' }), { type: 'undo' }).present,
    ).toEqual(state.present);
  });
  it('does not record invalid or unchanged actions', () => {
    const state = { past: [], present: [task] };
    expect(historyReducer(state, { type: 'update', task: { ...task } })).toBe(state);
    expect(historyReducer(state, { type: 'remove', id: 'missing' })).toBe(state);
    expect(historyReducer(state, { type: 'add', task })).toBe(state);
    expect(historyReducer(empty, { type: 'clear' })).toBe(empty);
    expect(historyReducer(empty, { type: 'undo' })).toBe(empty);
  });
  it('bounds undo history to 100 snapshots', () => {
    let state = empty;
    for (let i = 0; i < 120; i++)
      state = historyReducer(state, { type: 'add', task: { id: String(i), text: String(i) } });
    expect(state.past).toHaveLength(100);
    expect(state.present).toHaveLength(120);
  });
});
describe('priorities and colors', () => {
  it.each([
    [true, true, 'do'],
    [true, false, 'plan'],
    [false, true, 'delegate'],
    [false, false, 'later'],
  ] as const)('classifies flags %s, %s as %s', (important, urgent, expected) => {
    expect(taskCategory({ ...task, important, urgent })).toBe(expected);
  });
  it('does not treat missing priority flags as explicit false', () => {
    expect(taskCategory(task)).toBe('unassigned');
    expect(taskCategory({ ...task, important: true })).toBe('unassigned');
  });
  it('accepts only full hex colors', () => {
    expect(validTaskColor('#02A34B')).toBe(true);
    expect(validTaskColor('#aabbcc')).toBe(true);
    for (const value of ['red', '#fff', null, '#1234567', 123])
      expect(validTaskColor(value)).toBe(false);
  });
});
