import type { FormEvent, RefObject } from 'react';
type Props = {
  value: string;
  onChange: (text: string) => void;
  onSubmit: (event: FormEvent) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  animation: number;
};
export default function TaskComposer({ value, onChange, onSubmit, inputRef, animation }: Props) {
  return (
    <form onSubmit={onSubmit} className="add-form">
      <label className="sr-only" htmlFor="new-task">
        New task
      </label>
      <input
        id="new-task"
        ref={inputRef}
        autoFocus
        maxLength={300}
        placeholder="What needs to be done?"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button className="add-button" type="submit" disabled={!value.trim()}>
        <svg
          key={animation}
          className={`add-icon${animation ? ' add-icon-spin' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Add
      </button>
    </form>
  );
}
