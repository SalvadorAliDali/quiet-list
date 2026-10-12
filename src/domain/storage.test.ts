import { describe, expect, it } from 'vitest';
import { listsKey, parseTasks, readWorkspace, serializeWorkspace } from './storage';
const reader = (values: Record<string, string>) => ({
  getItem: (key: string) => values[key] ?? null,
});
describe('storage boundary', () => {
  it('migrates legacy tasks without losing rich content or priority', () => {
    const task = {
      id: 't',
      text: 'Existing task',
      description: 'Details',
      color: '#C30232',
      important: true,
      urgent: false,
      completed: true,
      richDescription: { type: 'doc', content: [] },
    };
    expect(
      readWorkspace(reader({ 'quiet-list:tasks:v1': JSON.stringify([task]) })).lists[0].history
        .present,
    ).toEqual([task]);
  });
  it('loads multiple lists, preserving active selection', () => {
    const saved = {
      activeId: 'work',
      lists: [
        { id: 'home', name: 'Home', tasks: [] },
        { id: 'work', name: 'Work', tasks: [] },
      ],
    };
    expect(readWorkspace(reader({ [listsKey]: JSON.stringify(saved) })).activeId).toBe('work');
  });
  it('recovers from corrupt data and unavailable storage', () => {
    expect(readWorkspace(reader({ [listsKey]: '{broken' })).lists[0].name).toBe('My tasks');
    expect(
      readWorkspace({
        getItem: () => {
          throw Error('Blocked storage');
        },
      }).lists,
    ).toHaveLength(1);
  });
  it('drops duplicate IDs and malformed fields rather than trusting JSON', () => {
    expect(
      parseTasks([
        null,
        { id: 'a', text: 'Valid', completed: 'yes', color: 'bad' },
        { id: 'a', text: 'Duplicate' },
        { id: 'b', text: 7 },
      ]),
    ).toEqual([{ id: 'a', text: 'Valid' }]);
  });
  it('falls back to the first list for a missing active ID', () => {
    const saved = {
      activeId: 'missing',
      lists: [
        { id: 'home', name: 'Home', tasks: [] },
        { id: 'home', name: 'Duplicate', tasks: [] },
      ],
    };
    const workspace = readWorkspace(reader({ [listsKey]: JSON.stringify(saved) }));
    expect(workspace.lists).toHaveLength(1);
    expect(workspace.activeId).toBe('home');
  });
  it('does not persist undo snapshots', () => {
    const workspace = readWorkspace(reader({}));
    workspace.lists[0].history.past.push([{ id: 'private-old', text: 'Deleted task' }]);
    expect(serializeWorkspace(workspace)).not.toContain('private-old');
    expect(readWorkspace(reader({ [listsKey]: serializeWorkspace(workspace) }))).toEqual({
      ...workspace,
      lists: [{ ...workspace.lists[0], history: { past: [], present: [] } }],
    });
  });
});
