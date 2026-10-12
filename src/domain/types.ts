import type { JSONContent } from '@tiptap/react';

export type Task = {
  id: string;
  text: string;
  description?: string;
  richDescription?: JSONContent;
  color?: string;
  important?: boolean;
  urgent?: boolean;
  completed?: boolean;
};
export type History = { past: Task[][]; present: Task[] };
export type TaskList = { id: string; name: string; history: History };
export type Workspace = { lists: TaskList[]; activeId: string };
export type TaskEntry = { task: Task; list: TaskList };
export type TaskAction =
  | { type: 'add' | 'update'; task: Task }
  | { type: 'remove'; id: string }
  | { type: 'clear' | 'undo' };
export type WorkspaceAction =
  | { type: 'select-list'; id: string }
  | { type: 'create-list' | 'rename-list'; id: string; name: string }
  | { type: 'task'; listId: string; action: TaskAction };
