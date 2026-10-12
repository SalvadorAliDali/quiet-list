import type { Task, TaskList, Workspace } from './types';
import { validTaskColor } from './tasks';

export const listsKey = 'quiet-list:lists:v1';
const legacyKey = 'quiet-list:tasks:v1';
type StorageReader = Pick<Storage, 'getItem'>;
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object';
function readJson(storage: StorageReader, key: string): unknown {
  try {
    return JSON.parse(storage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}
export function parseTasks(value: unknown): Task[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((item: unknown): Task[] => {
    if (
      !record(item) ||
      typeof item.id !== 'string' ||
      seen.has(item.id) ||
      typeof item.text !== 'string'
    )
      return [];
    seen.add(item.id);
    return [
      {
        id: item.id,
        text: item.text,
        ...(typeof item.description === 'string' ? { description: item.description } : {}),
        ...(record(item.richDescription) && item.richDescription.type === 'doc'
          ? { richDescription: item.richDescription }
          : {}),
        ...(validTaskColor(item.color) ? { color: item.color } : {}),
        ...(typeof item.important === 'boolean' ? { important: item.important } : {}),
        ...(typeof item.urgent === 'boolean' ? { urgent: item.urgent } : {}),
        ...(typeof item.completed === 'boolean' ? { completed: item.completed } : {}),
      },
    ];
  });
}
export function readWorkspace(storage: StorageReader = localStorage): Workspace {
  const saved = readJson(storage, listsKey);
  if (record(saved) && Array.isArray(saved.lists)) {
    const seen = new Set<string>();
    const lists = saved.lists.flatMap((item: unknown): TaskList[] => {
      if (
        !record(item) ||
        typeof item.id !== 'string' ||
        seen.has(item.id) ||
        typeof item.name !== 'string' ||
        !item.name.trim() ||
        !Array.isArray(item.tasks)
      )
        return [];
      seen.add(item.id);
      const name =
        item.id === 'inbox' && item.name === '\u041c\u043e\u0438 \u0434\u0435\u043b\u0430'
          ? 'My tasks'
          : item.name;
      return [{ id: item.id, name, history: { past: [], present: parseTasks(item.tasks) } }];
    });
    if (lists.length)
      return {
        lists,
        activeId: lists.some((list) => list.id === saved.activeId)
          ? (saved.activeId as string)
          : lists[0].id,
      };
  }
  return {
    lists: [
      {
        id: 'inbox',
        name: 'My tasks',
        history: { past: [], present: parseTasks(readJson(storage, legacyKey)) },
      },
    ],
    activeId: 'inbox',
  };
}
export function serializeWorkspace(workspace: Workspace): string {
  return JSON.stringify({
    activeId: workspace.activeId,
    lists: workspace.lists.map((list) => ({
      id: list.id,
      name: list.name,
      tasks: list.history.present,
    })),
  });
}
