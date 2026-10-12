import { useEffect, useRef, useState, type FormEvent, type DragEvent } from 'react';

import './style.css';
import './matrix.css';
import CategorySelect from './CategorySelect';
import type { Task, TaskEntry } from './domain/types';
import { quadrants, taskCategory, validTaskColor } from './domain/tasks';
import useWorkspace from './hooks/useWorkspace';
import TaskRow from './components/TaskRow';
import TaskDetailsDialog from './components/TaskDetailsDialog';
import ListsSidebar from './components/ListsSidebar';
import EditableListTitle from './components/EditableListTitle';
import MatrixBoard from './components/MatrixBoard';
import TaskComposer from './components/TaskComposer';
import DeleteConfirmation from './components/DeleteConfirmation';

export default function App() {
  const { workspace, activeList, lastChangedList, updateWorkspace, changeTask, storageError } =
    useWorkspace();
  const tasks = activeList.history.present;
  const [view, setView] = useState<'list' | 'matrix'>('list');
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [filter, setFilter] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [editorListId, setEditorListId] = useState(activeList.id);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const allScope = view === 'matrix' && scope === 'all';
  const entries: TaskEntry[] = (allScope ? workspace.lists : [activeList]).flatMap((list) =>
    list.history.present.map((task) => ({ task, list })),
  );
  const visibleEntries = entries.filter(
    ({ task }) =>
      (showCompleted || !task.completed) &&
      (view === 'matrix' || filter === 'all' || taskCategory(task) === filter),
  );
  const undoList = allScope ? lastChangedList : activeList;
  function classify(entry: TaskEntry, category: string) {
    const quadrant = quadrants.find((q) => q.id === category);
    changeTask(entry.list.id, {
      type: 'update',
      task: { ...entry.task, important: quadrant?.important, urgent: quadrant?.urgent },
    });
    setNotice(`Priority updated: ${entry.task.text}`);
  }
  function acceptDrop(event: DragEvent, category: string) {
    event.preventDefault();
    setDragOver(null);
    try {
      const { listId, taskId } = JSON.parse(event.dataTransfer.getData('application/x-quiet-task'));
      const list = workspace.lists.find((list) => list.id === listId);
      const task = list?.history.present.find((task) => task.id === taskId);
      if (list && task) classify({ list, task }, category);
    } catch {
      /* Ignore unrelated dragged content. */
    }
  }
  function renderTask(entry: TaskEntry, matrix = false) {
    return (
      <TaskRow
        key={entry.list.id + ':' + entry.task.id}
        entry={entry}
        matrix={matrix}
        showListName={allScope}
        onChange={changeTask}
        onNotice={setNotice}
        onOpen={openTask}
        onRemove={removeTask}
        onDragEnd={() => setDragOver(null)}
      />
    );
  }
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const text = drafts[activeList.id] ?? '';
  function setText(value: string) {
    setDrafts((previous) => ({ ...previous, [activeList.id]: value }));
  }
  function renameList(id: string, name: string) {
    updateWorkspace({ type: 'rename-list', id, name });
    setNotice('List renamed: ' + name);
  }
  const [addAnimation, setAddAnimation] = useState(0);
  const hasDraft = Boolean(text.trim());
  const ghost = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (hasDraft) ghost.current?.scrollIntoView({ block: 'nearest' });
  }, [hasDraft, activeList.id]);
  const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState<Task | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const confirmation = useRef<HTMLDialogElement>(null);
  const clearButton = useRef<HTMLButtonElement>(null);

  function addTask(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    changeTask(activeList.id, { type: 'add', task: { id: crypto.randomUUID(), text: trimmed } });
    setText('');
    setAddAnimation((previous) => previous + 1);
    setNotice(`Added: ${trimmed}`);
    input.current?.focus();
  }
  function removeTask(task: Task, listId = activeList.id) {
    changeTask(listId, { type: 'remove', id: task.id });
    setNotice(`Deleted: ${task.text}`);
    input.current?.focus();
  }
  function openTask(task: Task, listId = activeList.id) {
    setEditorListId(listId);
    setEditor({
      ...task,
      description: typeof task.description === 'string' ? task.description : '',
      color: validTaskColor(task.color) ? task.color : '#02A34B',
    });
  }
  return (
    <main className="canvas">
      <ListsSidebar
        lists={workspace.lists}
        activeId={activeList.id}
        allScope={allScope}
        onSelect={(id) => {
          updateWorkspace({ type: 'select-list', id });
          setScope('current');
          setNotice('');
        }}
        onCreate={(name) => {
          updateWorkspace({ type: 'create-list', id: crypto.randomUUID(), name });
          setNotice('List created: ' + name);
          input.current?.focus();
        }}
        onRename={renameList}
        onMatrix={() => {
          setView('matrix');
          setScope('all');
        }}
      />
      <section
        className={`task-window${view === 'matrix' ? ' matrix-window' : ''}`}
        aria-labelledby="title"
      >
        <header>
          {allScope ? (
            <h1 id="title">All tasks matrix</h1>
          ) : (
            <EditableListTitle
              key={activeList.id}
              name={activeList.name}
              onRename={(name) => renameList(activeList.id, name)}
            />
          )}
        </header>
        <div className="view-toolbar">
          <div className="view-switch" role="group" aria-label="Task view">
            <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
              List
            </button>
            <button
              type="button"
              aria-pressed={view === 'matrix'}
              onClick={() => setView('matrix')}
            >
              Matrix
            </button>
          </div>
          {view === 'matrix' ? (
            <CategorySelect
              label="Matrix scope"
              value={scope}
              options={[
                { id: 'current', title: 'Current list' },
                { id: 'all', title: 'All lists' },
              ]}
              onChange={(value) => setScope(value as 'current' | 'all')}
            />
          ) : null}
          <label className="completed-toggle">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(event) => setShowCompleted(event.target.checked)}
            />
            Completed
          </label>
        </div>
        {view === 'list' ? (
          <div className="priority-filters" role="group" aria-label="Priority filter">
            {[
              { id: 'all', title: 'All' },
              { id: 'unassigned', title: 'Unassigned' },
              ...quadrants,
            ].map((category) => (
              <button
                type="button"
                key={category.id}
                aria-pressed={filter === category.id}
                onClick={() => setFilter(category.id)}
              >
                {category.title}
              </button>
            ))}
          </div>
        ) : (
          <p className="matrix-help">Drag a task into a quadrant or choose its category.</p>
        )}
        {allScope ? (
          <div className="add-to-list">
            Add to list
            <CategorySelect
              label="List for new task"
              value={activeList.id}
              options={workspace.lists.map((list) => ({ id: list.id, title: list.name }))}
              onChange={(id) => updateWorkspace({ type: 'select-list', id })}
            />
          </div>
        ) : null}
        <TaskComposer
          value={text}
          onChange={setText}
          onSubmit={addTask}
          inputRef={input}
          animation={addAnimation}
        />
        {view === 'matrix' ? (
          <MatrixBoard
            entries={visibleEntries}
            dragOver={dragOver}
            onDragOver={setDragOver}
            onDrop={acceptDrop}
            renderTask={renderTask}
          />
        ) : visibleEntries.length || hasDraft ? (
          <ul className="tasks">
            {visibleEntries.map((entry) => renderTask(entry))}
            {hasDraft ? (
              <li ref={ghost} className="task-ghost" aria-label="New task draft">
                <span className="task-dot" aria-hidden="true" />
                <span className="task-text">{text}</span>
              </li>
            ) : null}
          </ul>
        ) : (
          <div className="empty">
            <p>{tasks.length ? 'No tasks match these filters' : 'Nothing here yet. Add a task.'}</p>
          </div>
        )}
        {storageError && (
          <p role="alert" className="storage-error">
            Could not save. Tasks are available until you close this page.
          </p>
        )}
        <div className="list-actions">
          <div className="history-actions" role="group" aria-label="Action history">
            <button
              className="history-button"
              aria-label="Undo"
              title="Undo"
              disabled={!undoList.history.past.length}
              onClick={() => {
                changeTask(undoList.id, { type: 'undo' });
                setNotice('Action undone');
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="m8 4-5 5 5 5M3 9h10a7 7 0 0 1 0 14"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform="translate(0 -2)"
                />
              </svg>
            </button>
          </div>
          {!allScope && tasks.length > 1 && (
            <button
              ref={clearButton}
              className="clear-button"
              onClick={() => confirmation.current?.showModal()}
            >
              Delete all
            </button>
          )}
        </div>
        <p role="status" aria-live="polite" className="sr-only">
          {notice}
        </p>
      </section>
      <DeleteConfirmation
        dialogRef={confirmation}
        onClose={() => (clearButton.current ?? input.current)?.focus()}
        onConfirm={() => {
          changeTask(activeList.id, { type: 'clear' });
          setNotice('All tasks deleted');
        }}
      />
      {editor && (
        <TaskDetailsDialog
          key={editorListId + ':' + editor.id}
          task={editor}
          onSave={(task) => {
            changeTask(editorListId, { type: 'update', task });
            setNotice('Task saved');
          }}
          onDelete={(task) => removeTask(task, editorListId)}
          onClose={() => {
            setEditor(null);
            input.current?.focus();
          }}
        />
      )}
    </main>
  );
}
