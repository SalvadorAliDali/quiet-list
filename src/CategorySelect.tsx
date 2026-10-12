import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import './dropdown.css';

type Option = { id: string; title: string };
type Props = {
  label: string;
  value: string;
  options: readonly Option[];
  compact?: boolean;
  onChange: (value: string) => void;
};

export default function CategorySelect({
  label,
  value,
  options,
  compact = false,
  onChange,
}: Props) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 260, maxHeight: 240 });
  const selected = options.find((option) => option.id === value) ?? options[0];

  function close(restoreFocus = false) {
    menu.current?.hidePopover();
    if (restoreFocus) trigger.current?.focus();
  }
  function show() {
    if (!trigger.current || !menu.current) return;
    const rect = trigger.current.getBoundingClientRect();
    const width = Math.min(260, window.innerWidth - 24);
    const height = Math.min(options.length * 38 + 14, window.innerHeight - 24, 280);
    const above = window.innerHeight - rect.bottom - 12 < height && rect.top > height;
    const top = above
      ? rect.top - height - 6
      : Math.min(rect.bottom + 6, window.innerHeight - height - 12);
    setPosition({
      left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
      top: Math.max(12, top),
      width,
      maxHeight: height,
    });
    menu.current.showPopover();
    const index = Math.max(
      0,
      options.findIndex((option) => option.id === value),
    );
    menu.current
      .querySelectorAll<HTMLButtonElement>('[role=option]')
      [index]?.focus({ preventScroll: true });
  }
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: Event) => {
      if (event.target instanceof Node && menu.current?.contains(event.target)) return;
      menu.current?.hidePopover();
    };
    window.addEventListener('resize', dismiss);
    window.addEventListener('scroll', dismiss, true);
    return () => {
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('scroll', dismiss, true);
    };
  }, [open]);
  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = Array.from(
      menu.current?.querySelectorAll<HTMLButtonElement>('[role=option]') ?? [],
    );
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    let next: number | undefined;
    if (event.key === 'ArrowDown') next = (index + 1) % buttons.length;
    if (event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      buttons[next]?.focus();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    }
    if (event.key === 'Tab') close(true);
  }
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={`category-trigger${compact ? ' task-category-select' : ' dropdown-trigger'}`}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => (open ? close() : show())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            show();
          }
        }}
      >
        <span>{selected.title}</span>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="m4 6 4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {createPortal(
        <div
          ref={menu}
          id={id}
          popover="auto"
          role="listbox"
          aria-label={label}
          className="category-menu app-menu"
          style={position}
          onToggle={(event) => setOpen(event.newState === 'open')}
          onKeyDown={navigate}
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={option.id === value}
              tabIndex={-1}
              onClick={() => {
                close(true);
                onChange(option.id);
              }}
            >
              <span>{option.title}</span>
              <span className="category-check" aria-hidden="true">
                {option.id === value ? '✓' : ''}
              </span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
