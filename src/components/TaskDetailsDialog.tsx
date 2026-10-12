import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { Task } from '../domain/types';
import { quadrants, taskCategory } from '../domain/tasks';
import ColorPalette from '../ColorPalette';
const RichDescription = lazy(() => import('../RichDescription'));
type Props = {
  task: Task;
  onSave: (task: Task) => void;
  onDelete: (task: Task) => void;
  onClose: () => void;
};
export default function TaskDetailsDialog({ task, onSave, onDelete, onClose }: Props) {
  const [editor, setEditor] = useState<Task | null>(task);
  const details = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!details.current?.open) details.current?.showModal();
  }, []);
  return (
    <dialog
      ref={details}
      className="confirmation task-details"
      aria-labelledby="task-title"
      onClose={onClose}
    >
      {editor && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!editor.text.trim()) {
              const title = event.currentTarget.querySelector<HTMLInputElement>('#task-name');
              title?.setCustomValidity('Enter a task name');
              title?.reportValidity();
              return;
            }
            onSave({ ...editor, text: editor.text.trim() });
            details.current?.close();
          }}
        >
          <div className="details-heading">
            <h2 id="task-title" className="sr-only">
              {editor.text || 'Task'}
            </h2>
            <label className="sr-only" htmlFor="task-name">
              Task name
            </label>
            <input
              id="task-name"
              className="task-name"
              aria-label="Task name"
              required
              maxLength={300}
              value={editor.text}
              placeholder="Task name"
              onChange={(event) => {
                event.target.setCustomValidity('');
                setEditor((previous) =>
                  previous ? { ...previous, text: event.target.value } : null,
                );
              }}
            />
            <button
              type="button"
              className="close-details"
              aria-label="Close task"
              onClick={() => details.current?.close()}
            >
              ×
            </button>
          </div>
          <fieldset className="priority-editor">
            <legend>Priority</legend>
            <label>
              <input
                type="checkbox"
                checked={editor.important === true}
                onChange={(event) =>
                  setEditor((previous) =>
                    previous
                      ? {
                          ...previous,
                          important: event.target.checked,
                          urgent: previous.urgent ?? false,
                        }
                      : null,
                  )
                }
              />
              Important
            </label>
            <label>
              <input
                type="checkbox"
                checked={editor.urgent === true}
                onChange={(event) =>
                  setEditor((previous) =>
                    previous
                      ? {
                          ...previous,
                          urgent: event.target.checked,
                          important: previous.important ?? false,
                        }
                      : null,
                  )
                }
              />
              Urgent
            </label>
            <button
              type="button"
              onClick={() =>
                setEditor((previous) =>
                  previous ? { ...previous, important: undefined, urgent: undefined } : null,
                )
              }
            >
              Clear priority
            </button>
            <p>{quadrants.find((q) => q.id === taskCategory(editor))?.title ?? 'Unassigned'}</p>
          </fieldset>
          <div className="description-label">Description</div>
          <Suspense fallback={<div className="editor-loading">Loading editor…</div>}>
            <RichDescription
              key={editor.id}
              document={editor.richDescription}
              text={editor.description ?? ''}
              onChange={(document, description) =>
                setEditor((previous) =>
                  previous ? { ...previous, richDescription: document, description } : null,
                )
              }
            />
          </Suspense>
          <ColorPalette
            value={editor.color ?? '#02A34B'}
            onChange={(color) =>
              setEditor((previous) => (previous ? { ...previous, color } : null))
            }
          />
          <div className="details-actions">
            <button
              type="button"
              className="clear-button"
              onClick={() => {
                onDelete(editor);
                details.current?.close();
              }}
            >
              Delete
            </button>
            <div>
              <button
                type="button"
                className="cancel-button"
                onClick={() => details.current?.close()}
              >
                Cancel
              </button>
              <button type="submit" className="save-task">
                Save
              </button>
            </div>
          </div>
        </form>
      )}
    </dialog>
  );
}
