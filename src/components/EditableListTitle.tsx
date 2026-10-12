import { useState } from 'react';

export default function EditableListTitle({
  name,
  onRename,
}: {
  name: string;
  onRename: (name: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  function save() {
    if (draft?.trim() && draft.trim() !== name) onRename(draft.trim());
    setDraft(null);
  }
  return (
    <h1 id="title" aria-label={name}>
      <input
        className="rename-list-input rename-heading"
        aria-label="Current list name"
        maxLength={80}
        value={draft ?? name}
        onFocus={() => setDraft(name)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            event.currentTarget.blur();
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            setDraft(null);
          }
        }}
      />
    </h1>
  );
}
