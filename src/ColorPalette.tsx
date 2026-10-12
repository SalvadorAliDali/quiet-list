import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import './palette.css';

type Color = { name: string; value: string };
type Popup = { kind: 'menu' | 'picker'; color?: Color; left: number; top: number };
const defaults: Color[] = [
  { name: 'Green', value: '#02A34B' },
  { name: 'Red', value: '#C30232' },
  { name: 'Orange', value: '#C34B02' },
  { name: 'Yellow', value: '#C39D02' },
  { name: 'Cyan', value: '#029BC3' },
  { name: 'Blue', value: '#023EC3' },
  { name: 'Purple', value: '#7902C3' },
];
const key = 'quiet-list:palette:v1';
const validColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
function readPalette(): Color[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaults;
    const colors: unknown = JSON.parse(raw);
    if (!Array.isArray(colors)) return defaults;
    const seen = new Set<string>();
    return colors
      .filter(
        (color): color is Color =>
          color && typeof color.name === 'string' && validColor(color.value),
      )
      .map((color) => ({
        name:
          defaults.find((preset) => preset.value === color.value.toUpperCase())?.name ?? color.name,
        value: color.value.toUpperCase(),
      }))
      .filter((color) => {
        if (seen.has(color.value)) return false;
        seen.add(color.value);
        return true;
      });
  } catch {
    return defaults;
  }
}
export default function ColorPalette({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const [colors, setColors] = useState(readPalette);
  const [popup, setPopup] = useState<Popup | null>(null);
  const [custom, setCustom] = useState('#02A34B');
  const [storageError, setStorageError] = useState(false);
  const [notice, setNotice] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(colors));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [colors]);
  useEffect(() => {
    if (!popup) return;
    popupRef.current
      ?.querySelector<HTMLElement>(popup.kind === 'menu' ? '[role=menuitem]' : 'input[type=text]')
      ?.focus();
    function closeOutside(event: PointerEvent) {
      if (!(event.target instanceof Node) || popupRef.current?.contains(event.target)) return;
      if (popupRef.current?.contains(document.activeElement)) anchor.current?.focus();
      setPopup(null);
    }
    function closeOnViewportChange() {
      setPopup(null);
    }
    document.addEventListener('pointerdown', closeOutside, true);
    window.addEventListener('resize', closeOnViewportChange);
    document.addEventListener('scroll', closeOnViewportChange, true);
    return () => {
      document.removeEventListener('pointerdown', closeOutside, true);
      window.removeEventListener('resize', closeOnViewportChange);
      document.removeEventListener('scroll', closeOnViewportChange, true);
    };
  }, [popup]);
  function position(button: HTMLButtonElement, x?: number, y?: number) {
    const rect = button.getBoundingClientRect();
    const dialog = button.closest('dialog')?.getBoundingClientRect();
    const leftEdge = Math.max(8, (dialog?.left ?? 0) + 8);
    const rightEdge = Math.min(window.innerWidth - 8, (dialog?.right ?? window.innerWidth) - 8);
    const topEdge = Math.max(8, (dialog?.top ?? 0) + 8);
    const bottomEdge = Math.min(window.innerHeight - 8, (dialog?.bottom ?? window.innerHeight) - 8);
    return {
      left: Math.max(leftEdge, Math.min(x ?? rect.left, rightEdge - 240)),
      top: Math.max(topEdge, Math.min(y ?? rect.bottom + 6, bottomEdge - 196)),
    };
  }
  function openMenu(event: MouseEvent<HTMLButtonElement>, color?: Color) {
    event.preventDefault();
    anchor.current = event.currentTarget;
    setPopup({
      kind: 'menu',
      color,
      ...position(event.currentTarget, event.clientX || undefined, event.clientY || undefined),
    });
  }
  function closePopup() {
    setPopup(null);
    anchor.current?.focus();
  }
  function saveColor() {
    if (!validColor(custom) || !popup) return;
    const normalized = custom.toUpperCase();
    const original = popup.color;
    setColors((previous) => {
      if (!original)
        return previous.some((color) => color.value === normalized)
          ? previous
          : [...previous, { name: normalized, value: normalized }];
      if (original.value === normalized) return previous;
      if (previous.some((color) => color.value === normalized))
        return previous.filter((color) => color.value !== original.value);
      return previous.map((color) =>
        color.value === original.value ? { name: normalized, value: normalized } : color,
      );
    });
    if (!original || value.toUpperCase() === original.value) onChange(normalized);
    setNotice(original ? 'Color updated' : 'Color added');
    closePopup();
  }
  function handleKeys(event: KeyboardEvent<HTMLElement>) {
    if (!popup) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closePopup();
    }
    if (popup.kind === 'menu' && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const items = Array.from(
        popupRef.current?.querySelectorAll<HTMLButtonElement>('[role=menuitem]') ?? [],
      );
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? items.length - 1
            : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }
  }
  function keyboardMenu(event: KeyboardEvent<HTMLButtonElement>, color?: Color) {
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      event.preventDefault();
      anchor.current = event.currentTarget;
      setPopup({ kind: 'menu', color, ...position(event.currentTarget) });
    }
  }
  return (
    <fieldset className="color-picker" onKeyDownCapture={handleKeys}>
      <legend>Dot color</legend>
      <div className="palette-top">
        <div className="color-options">
          {colors.map((color) => (
            <button
              key={color.value}
              type="button"
              className="color-choice"
              style={{ background: color.value }}
              title={`${color.name} — right-click to customize`}
              aria-label={color.name}
              aria-haspopup="menu"
              aria-pressed={value.toUpperCase() === color.value}
              onClick={() => {
                setPopup(null);
                onChange(color.value);
              }}
              onContextMenu={(event) => openMenu(event, color)}
              onKeyDown={(event) => keyboardMenu(event, color)}
            >
              {value.toUpperCase() === color.value ? (
                <svg
                  className="color-check"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m3 8 3 3 7-7"
                    stroke={
                      parseInt(color.value.slice(1, 3), 16) * 0.299 +
                        parseInt(color.value.slice(3, 5), 16) * 0.587 +
                        parseInt(color.value.slice(5, 7), 16) * 0.114 >
                      165
                        ? '#163C27'
                        : 'white'
                    }
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </button>
          ))}
          <button
            type="button"
            className="palette-plus"
            aria-label="Add new color"
            title="Add new color"
            aria-haspopup="dialog"
            onClick={(event) => {
              anchor.current = event.currentTarget;
              setCustom('#02A34B');
              setPopup({ kind: 'picker', ...position(event.currentTarget) });
            }}
            onContextMenu={(event) => openMenu(event)}
            onKeyDown={(event) => keyboardMenu(event)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M9 4v10M4 9h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
      {popup && (
        <div
          ref={popupRef}
          className={`color-popup ${popup.kind === 'menu' ? 'color-context-menu app-menu' : 'color-popover'}`}
          style={{ left: popup.left, top: popup.top }}
          role={popup.kind === 'menu' ? 'menu' : 'dialog'}
          aria-label={
            popup.kind === 'menu' ? 'Color settings' : popup.color ? 'Edit color' : 'New color'
          }
        >
          {popup.kind === 'menu' ? (
            <>
              {popup.color && (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setCustom(popup.color!.value);
                      setPopup({ ...popup, kind: 'picker' });
                    }}
                  >
                    Edit color
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="color-menu-delete"
                    onClick={() => {
                      setColors((previous) =>
                        previous.filter((color) => color.value !== popup.color!.value),
                      );
                      setNotice('Color removed from palette');
                      closePopup();
                    }}
                  >
                    Delete color
                  </button>
                  <div className="color-menu-divider" />
                </>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setColors(defaults);
                  setNotice('Default colors restored');
                  closePopup();
                }}
              >
                Restore default colors
              </button>
            </>
          ) : (
            <>
              <strong>{popup.color ? 'Edit color' : 'New color'}</strong>
              <div className="color-popover-inputs">
                <input
                  type="color"
                  aria-label="Choose a color"
                  value={validColor(custom) ? custom : '#02A34B'}
                  onChange={(event) => setCustom(event.target.value.toUpperCase())}
                />
                <input
                  type="text"
                  aria-label="Color HEX"
                  maxLength={7}
                  value={custom}
                  onChange={(event) => setCustom(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      saveColor();
                    }
                  }}
                  spellCheck={false}
                />
              </div>
              <div className="color-popover-actions">
                <button type="button" className="color-popup-cancel" onClick={closePopup}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="color-popup-save"
                  disabled={!validColor(custom)}
                  onClick={saveColor}
                >
                  {popup.color ? 'Save color' : 'Add'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {storageError && (
        <p role="alert" className="storage-error">
          Could not save the palette in this browser.
        </p>
      )}
      <span role="status" className="sr-only">
        {notice}
      </span>
    </fieldset>
  );
}
