import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { EditorContent, useEditor, useEditorState, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import './editor.css';

type Props = {
  document?: JSONContent;
  text: string;
  onChange: (document: JSONContent, text: string) => void;
};
const blockOptions = [
  { id: 'paragraph', icon: 'T', name: 'Text', detail: 'Plain paragraph' },
  { id: 'h1', icon: 'H1', name: 'Heading 1', detail: 'Large heading' },
  { id: 'h2', icon: 'H2', name: 'Heading 2', detail: 'Medium heading' },
  { id: 'h3', icon: 'H3', name: 'Heading 3', detail: 'Small heading' },
  { id: 'taskList', icon: '☑', name: 'Checklist', detail: 'Items with checkboxes' },
  { id: 'bulletList', icon: '•', name: 'Bulleted list', detail: 'Items with bullets' },
  { id: 'orderedList', icon: '1.', name: 'Numbered list', detail: 'Ordered items' },
  { id: 'blockquote', icon: '❝', name: 'Quote', detail: 'Quoted text' },
  { id: 'codeBlock', icon: '</>', name: 'Code block', detail: 'Monospaced text' },
  { id: 'divider', icon: '—', name: 'Divider', detail: 'Horizontal line' },
];
function fromPlainText(text: string): JSONContent {
  return {
    type: 'doc',
    content: text.split(/\r?\n/).map((line) => ({
      type: 'paragraph',
      ...(line ? { content: [{ type: 'text', text: line }] } : {}),
    })),
  };
}
export default function RichDescription({ document, text, onChange }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');
  const menu = useRef<HTMLDivElement>(null);
  const blockTrigger = useRef<HTMLButtonElement>(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, defaultProtocol: 'https' },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        a11y: { checkboxLabel: (node) => `Subtask: ${node.textContent || 'New subtask'}` },
      }),
      Highlight,
      Placeholder.configure({ placeholder: 'Type text or press / to choose a block' }),
    ],
    content: document?.type === 'doc' ? document : fromPlainText(text),
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        id: 'task-description',
        class: 'rich-content',
        role: 'textbox',
        'aria-label': 'Description',
        'aria-multiline': 'true',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON(), editor.getText({ blockSeparator: '\n' })),
  });
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return null;
      return {
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
        strike: editor.isActive('strike'),
        highlight: editor.isActive('highlight'),
        code: editor.isActive('code'),
        link: editor.isActive('link'),
        taskList: editor.isActive('taskList'),
        block: editor.isActive('heading', { level: 1 })
          ? 'h1'
          : editor.isActive('heading', { level: 2 })
            ? 'h2'
            : editor.isActive('heading', { level: 3 })
              ? 'h3'
              : (['taskList', 'bulletList', 'orderedList', 'blockquote', 'codeBlock'].find((type) =>
                  editor.isActive(type),
                ) ?? 'paragraph'),
      };
    },
  });
  useEffect(() => {
    if (editor)
      requestAnimationFrame(() => {
        if (!editor.isDestroyed) editor.commands.focus('end');
      });
  }, [editor]);
  useEffect(() => {
    if (menuOpen) menu.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [menuOpen]);
  useEffect(() => {
    if (!menuOpen) return;
    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target;
      if (
        !(target instanceof Node) ||
        menu.current?.contains(target) ||
        blockTrigger.current?.contains(target)
      )
        return;
      if (menu.current?.contains(window.document.activeElement)) editor?.view.focus();
      setMenuOpen(false);
    }
    window.document.addEventListener('pointerdown', closeOnOutsidePointer, true);
    return () => window.document.removeEventListener('pointerdown', closeOnOutsidePointer, true);
  }, [menuOpen, editor]);

  if (!editor || !state) return <div className="editor-loading">Loading editor…</div>;
  function setBlock(id: string) {
    if (!editor) return;
    const chain = editor.chain();
    switch (id) {
      case 'paragraph':
        chain.clearNodes().setParagraph().run();
        break;
      case 'h1':
        chain.clearNodes().setHeading({ level: 1 }).run();
        break;
      case 'h2':
        chain.clearNodes().setHeading({ level: 2 }).run();
        break;
      case 'h3':
        chain.clearNodes().setHeading({ level: 3 }).run();
        break;
      case 'taskList':
        chain.toggleTaskList().run();
        break;
      case 'bulletList':
        chain.toggleBulletList().run();
        break;
      case 'orderedList':
        chain.toggleOrderedList().run();
        break;
      case 'blockquote':
        chain.toggleBlockquote().run();
        break;
      case 'codeBlock':
        chain.toggleCodeBlock().run();
        break;
      case 'divider':
        chain.setHorizontalRule().run();
        break;
    }
    editor.view.focus();
    setMenuOpen(false);
  }
  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (menuOpen && ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape'].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'Escape') {
        setMenuOpen(false);
        editor?.view.focus();
        return;
      }
      const items = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
      const index = items.findIndex((item) => item === window.document.activeElement);
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? items.length - 1
            : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    } else if (
      event.key === '/' &&
      !event.ctrlKey &&
      !event.metaKey &&
      editor?.state.selection.empty &&
      editor.state.selection.$from.parent.type.name === 'paragraph' &&
      !editor.state.selection.$from.parent.textContent &&
      (event.target as HTMLElement).closest('[contenteditable=true]')
    ) {
      event.preventDefault();
      setLinkOpen(false);
      setMenuOpen(true);
    } else if (linkOpen && event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setLinkOpen(false);
      editor?.view.focus();
    }
  }
  function applyLink() {
    const trimmed = linkUrl.trim();
    const url = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol) || !trimmed) throw new Error();
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      setLinkOpen(false);
      setLinkError('');
    } catch {
      setLinkError('Enter a website URL or mailto: address.');
    }
  }
  const formatButtons = [
    {
      name: 'Bold',
      hint: 'Ctrl+B',
      label: <strong>B</strong>,
      active: state.bold,
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      name: 'Italic',
      hint: 'Ctrl+I',
      label: <em>I</em>,
      active: state.italic,
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      name: 'Underline',
      hint: 'Ctrl+U',
      label: <u>U</u>,
      active: state.underline,
      run: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      name: 'Strikethrough',
      hint: '',
      label: <s>S</s>,
      active: state.strike,
      run: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      name: 'Highlight',
      hint: '',
      label: <span className="highlight-icon">A</span>,
      active: state.highlight,
      run: () => editor.chain().focus().toggleHighlight().run(),
    },
    {
      name: 'Inline code',
      hint: '',
      label: <span className="code-icon">{'</>'}</span>,
      active: state.code,
      run: () => editor.chain().focus().toggleCode().run(),
    },
  ];
  return (
    <div
      className="rich-editor"
      onKeyDownCapture={handleKeys}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setMenuOpen(false);
          setLinkOpen(false);
        }
      }}
    >
      <div className="editor-toolbar" role="group" aria-label="Description formatting">
        <button
          ref={blockTrigger}
          type="button"
          className="block-trigger"
          aria-label="Block type"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setLinkOpen(false);
            setMenuOpen(!menuOpen);
          }}
        >
          {blockOptions.find((option) => option.id === state.block)?.name ?? 'Text'}
          <span aria-hidden="true">⌄</span>
        </button>
        <span className="toolbar-divider" aria-hidden="true" />
        {formatButtons.map((button) => (
          <button
            key={button.name}
            type="button"
            className="format-button"
            aria-label={button.name}
            title={`${button.name}${button.hint ? ` (${button.hint})` : ''}`}
            aria-pressed={button.active}
            onMouseDown={(event) => event.preventDefault()}
            onClick={button.run}
          >
            {button.label}
          </button>
        ))}
        <button
          type="button"
          className="format-button"
          aria-label="Link"
          title="Link"
          aria-pressed={state.link}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setMenuOpen(false);
            setLinkUrl(editor.getAttributes('link').href ?? '');
            setLinkError('');
            setLinkOpen(!linkOpen);
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="m10 13 4-4m-6 6-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 2 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              transform="translate(1 1)"
            />
          </svg>
        </button>
        <button
          type="button"
          className="format-button"
          aria-label="Task checkboxes"
          title="Task checkboxes"
          aria-pressed={state.taskList}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setBlock('taskList')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="3"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="m7 12 3 3 7-7"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div className="block-menu app-menu" role="menu" aria-label="Choose block" ref={menu}>
          {blockOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitem"
              aria-current={option.id === state.block ? true : undefined}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setBlock(option.id)}
            >
              <span className="block-icon" aria-hidden="true">
                {option.icon}
              </span>
              <span className="block-label">
                <strong>{option.name}</strong>
                <small>{option.detail}</small>
              </span>
              <span className="block-check" aria-hidden="true">
                {option.id === state.block ? '✓' : ''}
              </span>
            </button>
          ))}
        </div>
      )}
      {linkOpen && (
        <div className="link-panel">
          <label htmlFor="description-link">Link URL</label>
          <div>
            <input
              id="description-link"
              autoFocus
              value={linkUrl}
              placeholder="https://example.com"
              onChange={(event) => setLinkUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applyLink();
                }
              }}
            />
            <button type="button" onClick={applyLink}>
              Apply
            </button>
            {state.link && (
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().extendMarkRange('link').unsetLink().run();
                  setLinkOpen(false);
                }}
              >
                Remove
              </button>
            )}
          </div>
          {linkError && <p role="alert">{linkError}</p>}
        </div>
      )}
      <EditorContent editor={editor} />
      <div className="editor-hint">
        / — choose block <span>Ctrl+B — bold · Ctrl+Z — undo</span>
      </div>
    </div>
  );
}
