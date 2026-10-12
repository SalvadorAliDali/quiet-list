import { describe, expect, it } from 'vitest';
import { readWorkspace } from './storage';
import { workspaceReducer } from './workspace';
const initial = () => readWorkspace({ getItem: () => null });
describe('workspace', () => {
  it('creates and selects a separate list', () => {
    const next = workspaceReducer(initial(), { type: 'create-list', id: 'work', name: ' Work ' });
    expect(next.activeId).toBe('work');
    expect(next.lists[1].name).toBe('Work');
  });
  it('isolates undo and clearing by list', () => {
    let state = workspaceReducer(initial(), { type: 'create-list', id: 'work', name: 'Work' });
    state = workspaceReducer(state, {
      type: 'task',
      listId: 'inbox',
      action: { type: 'add', task: { id: 'a', text: 'Home' } },
    });
    state = workspaceReducer(state, {
      type: 'task',
      listId: 'work',
      action: { type: 'add', task: { id: 'b', text: 'Work' } },
    });
    state = workspaceReducer(state, { type: 'task', listId: 'work', action: { type: 'undo' } });
    expect(state.lists[0].history.present).toHaveLength(1);
    expect(state.lists[1].history.present).toHaveLength(0);
  });
  it('renames an inactive list without switching or dropping its tasks', () => {
    const state = workspaceReducer(initial(), { type: 'create-list', id: 'work', name: 'Work' });
    const next = workspaceReducer(state, { type: 'rename-list', id: 'inbox', name: 'Personal' });
    expect(next.activeId).toBe('work');
    expect(next.lists[0].history).toBe(state.lists[0].history);
  });
  it('rejects empty names, duplicate IDs and unknown lists', () => {
    const state = initial();
    expect(workspaceReducer(state, { type: 'create-list', id: 'inbox', name: 'Duplicate' })).toBe(
      state,
    );
    expect(workspaceReducer(state, { type: 'create-list', id: 'x', name: '  ' })).toBe(state);
    expect(workspaceReducer(state, { type: 'rename-list', id: 'inbox', name: ' ' })).toBe(state);
    expect(workspaceReducer(state, { type: 'select-list', id: 'missing' })).toBe(state);
    expect(
      workspaceReducer(state, { type: 'task', listId: 'missing', action: { type: 'clear' } }),
    ).toBe(state);
  });
});
