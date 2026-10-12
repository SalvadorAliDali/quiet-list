import { useEffect, useReducer, useState } from 'react';
import { listsKey, readWorkspace, serializeWorkspace } from '../domain/storage';
import { historyReducer } from '../domain/tasks';
import { workspaceReducer } from '../domain/workspace';
import type { TaskAction } from '../domain/types';

export default function useWorkspace() {
  const [workspace, updateWorkspace] = useReducer(workspaceReducer, undefined, () =>
    readWorkspace(),
  );
  const [storageError, setStorageError] = useState(false);
  const [undoTargets, setUndoTargets] = useState<string[]>([]);
  useEffect(() => {
    try {
      localStorage.setItem(listsKey, serializeWorkspace(workspace));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [workspace]);
  function changeTask(listId: string, action: TaskAction) {
    const target = workspace.lists.find((list) => list.id === listId);
    if (!target || historyReducer(target.history, action) === target.history) return;
    updateWorkspace({ type: 'task', listId, action });
    setUndoTargets((previous) => {
      if (action.type === 'undo') {
        const index = previous.lastIndexOf(listId);
        return index < 0 ? previous : previous.filter((_, position) => position !== index);
      }
      return [...previous, listId].slice(-500);
    });
  }
  const activeList = workspace.lists.find((list) => list.id === workspace.activeId)!;
  const lastUndoId = [...undoTargets]
    .reverse()
    .find((id) => workspace.lists.some((list) => list.id === id && list.history.past.length));
  const lastChangedList = workspace.lists.find((list) => list.id === lastUndoId) ?? activeList;
  return { workspace, activeList, lastChangedList, updateWorkspace, changeTask, storageError };
}
