import type { DragEvent, ReactNode } from 'react';
import { quadrants, taskCategory } from '../domain/tasks';
import type { TaskEntry } from '../domain/types';

type Props = {
  entries: TaskEntry[];
  dragOver: string | null;
  onDragOver: (category: string | null) => void;
  onDrop: (event: DragEvent, category: string) => void;
  renderTask: (entry: TaskEntry, matrix: boolean) => ReactNode;
};
export default function MatrixBoard({ entries, dragOver, onDragOver, onDrop, renderTask }: Props) {
  return (
    <div className="matrix-board">
      {[
        ...quadrants,
        { id: 'unassigned', title: 'Unassigned', hint: 'Tasks without a priority' },
      ].map((category) => {
        const tasks = entries.filter(({ task }) => taskCategory(task) === category.id);
        return (
          <section
            key={category.id}
            className={`matrix-quadrant quadrant-${category.id}${dragOver === category.id ? ' drag-over' : ''}`}
            aria-label={category.title}
            onDragOver={(event) => {
              if (event.dataTransfer.types.includes('application/x-quiet-task')) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                onDragOver(category.id);
              }
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) onDragOver(null);
            }}
            onDrop={(event) => onDrop(event, category.id)}
          >
            <div className="quadrant-heading">
              <h2>{category.title}</h2>
              <span>{tasks.length}</span>
            </div>
            <p className="quadrant-hint">{category.hint}</p>
            {tasks.length ? (
              <ul className="tasks matrix-tasks">
                {tasks.map((entry) => renderTask(entry, true))}
              </ul>
            ) : (
              <p className="quadrant-empty">
                {category.id === 'unassigned' ? 'All tasks categorized' : 'No tasks yet'}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
