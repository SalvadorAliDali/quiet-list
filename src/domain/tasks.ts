import type { History, Task, TaskAction } from './types';

export const quadrants = [
  { id: 'do', title: 'Important and urgent', hint: 'Do now', important: true, urgent: true },
  { id: 'plan', title: 'Important, not urgent', hint: 'Schedule', important: true, urgent: false },
  {
    id: 'delegate',
    title: 'Urgent, not important',
    hint: 'Delegate',
    important: false,
    urgent: true,
  },
  {
    id: 'later',
    title: 'Neither important nor urgent',
    hint: 'Defer or drop',
    important: false,
    urgent: false,
  },
] as const;
export const categoryOptions = [{ id: 'unassigned', title: 'Unassigned' }, ...quadrants];
export function taskCategory(task: Task): string {
  if (typeof task.important !== 'boolean' || typeof task.urgent !== 'boolean') return 'unassigned';
  return quadrants.find((q) => q.important === task.important && q.urgent === task.urgent)!.id;
}
export const validTaskColor = (color: unknown): color is string =>
  typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color);
export function historyReducer(history: History, action: TaskAction): History {
  if (action.type === 'undo') {
    if (!history.past.length) return history;
    return { past: history.past.slice(0, -1), present: history.past[history.past.length - 1] };
  }
  let present: Task[];
  switch (action.type) {
    case 'add':
      if (history.present.some((task) => task.id === action.task.id)) return history;
      present = [...history.present, action.task];
      break;
    case 'update':
      if (
        !history.present.some(
          (task) =>
            task.id === action.task.id && JSON.stringify(task) !== JSON.stringify(action.task),
        )
      )
        return history;
      present = history.present.map((task) => (task.id === action.task.id ? action.task : task));
      break;
    case 'remove':
      present = history.present.filter((task) => task.id !== action.id);
      if (present.length === history.present.length) return history;
      break;
    case 'clear':
      if (!history.present.length) return history;
      present = [];
      break;
  }
  return { past: [...history.past, history.present].slice(-100), present };
}
