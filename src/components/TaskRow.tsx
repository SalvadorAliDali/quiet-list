import type { Task, TaskAction, TaskEntry } from '../domain/types';
import { categoryOptions, quadrants, taskCategory, validTaskColor } from '../domain/tasks';
import CategorySelect from '../CategorySelect';
type Props = {
  entry: TaskEntry;
  matrix?: boolean;
  showListName: boolean;
  onChange: (listId: string, action: TaskAction) => void;
  onNotice: (message: string) => void;
  onOpen: (task: Task, listId: string) => void;
  onRemove: (task: Task, listId: string) => void;
  onDragEnd: () => void;
};
export default function TaskRow({
  entry,
  matrix = false,
  showListName,
  onChange,
  onNotice,
  onOpen,
  onRemove,
  onDragEnd,
}: Props) {
  const { task, list } = entry;
  return (
    <li
      key={`${list.id}:${task.id}`}
      className={task.completed ? 'completed-task' : ''}
      draggable={matrix}
      onDragStart={(event) => {
        event.dataTransfer.setData(
          'application/x-quiet-task',
          JSON.stringify({ listId: list.id, taskId: task.id }),
        );
        event.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => onDragEnd()}
    >
      <button
        type="button"
        className="complete-task"
        aria-label={`${task.completed ? 'Reopen task' : 'Complete task'}: ${task.text}`}
        aria-pressed={!!task.completed}
        onClick={() => {
          onChange(list.id, { type: 'update', task: { ...task, completed: !task.completed } });
          onNotice(task.completed ? 'Task reopened' : 'Task completed');
        }}
      >
        {task.completed ? '✓' : ''}
      </button>
      <button
        type="button"
        className="task-open"
        aria-label={`Open task: ${task.text}`}
        onClick={() => onOpen(task, list.id)}
      >
        <span
          className="task-dot"
          style={{ background: validTaskColor(task.color) ? task.color : undefined }}
          aria-hidden="true"
        />
        <span className="task-content">
          <span className="task-text">{task.text}</span>
          {showListName ? <span className="task-origin">{list.name}</span> : null}
          {typeof task.description === 'string' && task.description.trim() ? (
            <span className="task-preview">
              {task.description.trim().split(/\r?\n/)[0]}
              {task.description.trim().includes('\n') ? '…' : ''}
            </span>
          ) : null}
        </span>
      </button>
      <div className="task-priority-controls">
        <button
          type="button"
          className="priority-tag"
          aria-pressed={task.important === true}
          aria-label={`Important: ${task.text}`}
          onClick={() =>
            onChange(list.id, {
              type: 'update',
              task: { ...task, important: !task.important, urgent: task.urgent ?? false },
            })
          }
        >
          Important
        </button>
        <button
          type="button"
          className="priority-tag"
          aria-pressed={task.urgent === true}
          aria-label={`Urgent: ${task.text}`}
          onClick={() =>
            onChange(list.id, {
              type: 'update',
              task: { ...task, urgent: !task.urgent, important: task.important ?? false },
            })
          }
        >
          Urgent
        </button>
        <CategorySelect
          compact
          label={`Task category: ${task.text}`}
          value={taskCategory(task)}
          options={categoryOptions}
          onChange={(category) =>
            onChange(list.id, {
              type: 'update',
              task: {
                ...task,
                important: quadrants.find((q) => q.id === category)?.important,
                urgent: quadrants.find((q) => q.id === category)?.urgent,
              },
            })
          }
        />
      </div>
      <button
        type="button"
        className="delete-button"
        aria-label={`Delete task: ${task.text}`}
        title="Delete task"
        onClick={() => onRemove(task, list.id)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </li>
  );
}
