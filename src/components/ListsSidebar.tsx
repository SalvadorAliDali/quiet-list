import { useRef, useState } from 'react';
import type { TaskList } from '../domain/types';

type Props = {
  lists: TaskList[];
  activeId: string;
  allScope: boolean;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onMatrix: () => void;
};
export default function ListsSidebar({
  lists,
  activeId,
  allScope,
  onSelect,
  onCreate,
  onRename,
  onMatrix,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const finished = useRef(false);
  function beginRename(list: TaskList) {
    finished.current = false;
    setRenaming({ id: list.id, name: list.name });
  }
  function saveRename() {
    if (!renaming || finished.current) return;
    finished.current = true;
    if (renaming.name.trim()) onRename(renaming.id, renaming.name.trim());
    setRenaming(null);
  }
  function cancelCreate() {
    setCreating(false);
    setName('');
  }
  return (
    <aside className="lists-sidebar" aria-label="Task lists">
      <h2>Lists</h2>
      <nav aria-label="Choose list">
        <ul>
          {lists.map((list) => (
            <li key={list.id} className="sidebar-list-row">
              {renaming?.id === list.id ? (
                <input
                  className="rename-list-input rename-sidebar"
                  aria-label="Sidebar list name"
                  autoFocus
                  maxLength={80}
                  value={renaming.name}
                  onChange={(event) => setRenaming({ id: list.id, name: event.target.value })}
                  onBlur={saveRename}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      saveRename();
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      finished.current = true;
                      setRenaming(null);
                    }
                  }}
                />
              ) : (
                <>
                  <button
                    type="button"
                    className="list-link"
                    aria-current={list.id === activeId && !allScope ? 'page' : undefined}
                    title="Double-click to rename"
                    onDoubleClick={() => beginRename(list)}
                    onClick={() => onSelect(list.id)}
                  >
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="M7 5h9M7 10h9M7 15h9M3 5h.01M3 10h.01M3 15h.01"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span>{list.name}</span>
                  </button>
                  <button
                    type="button"
                    className="rename-list-button"
                    aria-label={`Rename list: ${list.name}`}
                    title="Rename list"
                    onClick={() => beginRename(list)}
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="m12.5 4.5 3 3M4 16l1-4L13 4a2.12 2.12 0 0 1 3 3l-8 8-4 1Z"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </nav>
      {creating ? (
        <form
          className="new-list-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            onCreate(name.trim());
            cancelCreate();
          }}
        >
          <label htmlFor="new-list-name">List name</label>
          <input
            id="new-list-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            required
            maxLength={80}
            placeholder="For example, Work"
            onKeyDown={(event) => {
              if (event.key === 'Escape') cancelCreate();
            }}
          />
          <div>
            <button type="button" className="cancel-list" onClick={cancelCreate}>
              Cancel
            </button>
            <button type="submit" className="create-list" disabled={!name.trim()}>
              Create
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="new-list-button" onClick={() => setCreating(true)}>
          <span aria-hidden="true">+</span>New list
        </button>
      )}
      <button
        type="button"
        className="list-link matrix-nav"
        aria-current={allScope ? 'page' : undefined}
        onClick={onMatrix}
      >
        ▦ All tasks matrix
      </button>
    </aside>
  );
}
