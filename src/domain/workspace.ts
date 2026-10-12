import { historyReducer } from './tasks';
import type { Workspace, WorkspaceAction } from './types';

export function workspaceReducer(workspace: Workspace, action: WorkspaceAction): Workspace {
  if (action.type === 'select-list')
    return action.id !== workspace.activeId && workspace.lists.some((list) => list.id === action.id)
      ? { ...workspace, activeId: action.id }
      : workspace;
  if (action.type === 'create-list') {
    const name = action.name.trim();
    if (!name || workspace.lists.some((list) => list.id === action.id)) return workspace;
    return {
      lists: [...workspace.lists, { id: action.id, name, history: { past: [], present: [] } }],
      activeId: action.id,
    };
  }
  if (action.type === 'rename-list') {
    const name = action.name.trim();
    if (!name || !workspace.lists.some((list) => list.id === action.id && list.name !== name))
      return workspace;
    return {
      ...workspace,
      lists: workspace.lists.map((list) => (list.id === action.id ? { ...list, name } : list)),
    };
  }
  if (action.type !== 'task') return workspace;
  const target = workspace.lists.find((list) => list.id === action.listId);
  if (!target) return workspace;
  const history = historyReducer(target.history, action.action);
  if (history === target.history) return workspace;
  return {
    ...workspace,
    lists: workspace.lists.map((list) => (list.id === action.listId ? { ...list, history } : list)),
  };
}
