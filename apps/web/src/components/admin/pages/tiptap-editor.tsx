'use client';

import { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  id?: string;
}

function ToolbarButton({
  active,
  onClick,
  disabled,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="icon-sm"
      className={cn('h-8 w-8 shrink-0', active && 'bg-flor-100 text-flor-900')}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  );
}

export function TiptapEditor({ value, onChange, disabled, id }: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Typography,
    ],
    content: value || '<p></p>',
    editable: !disabled,
    editorProps: {
      attributes: {
        id: id ?? 'tiptap-editor',
        class:
          'prose prose-stone max-w-none min-h-[300px] px-3 py-2 focus:outline-none prose-headings:font-serif prose-a:text-flor-600 prose-headings:text-flor-900',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const current = editor.getHTML();
    if (current === value) return;
    editor.commands.setContent(value || '<p></p>', { emitUpdate: false });
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL do link', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="min-h-[300px] rounded-lg border border-flor-200 bg-flor-50/50 animate-pulse" />
    );
  }

  return (
    <div className="rounded-lg border border-flor-200 focus-within:border-flor-500 focus-within:ring-2 focus-within:ring-flor-500/20 transition-shadow">
      <div
        className="flex flex-wrap items-center gap-0.5 border-b border-flor-100 bg-flor-50/80 px-1 py-1"
        role="toolbar"
        aria-label="Formatação"
      >
        <ToolbarButton
          title="Título 1"
          active={editor.isActive('heading', { level: 1 })}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Título 2"
          active={editor.isActive('heading', { level: 2 })}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Título 3"
          active={editor.isActive('heading', { level: 3 })}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-6 w-px bg-flor-200" aria-hidden />
        <ToolbarButton
          title="Negrito"
          active={editor.isActive('bold')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Itálico"
          active={editor.isActive('italic')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-6 w-px bg-flor-200" aria-hidden />
        <ToolbarButton
          title="Lista com marcadores"
          active={editor.isActive('bulletList')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Lista numerada"
          active={editor.isActive('orderedList')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Inserir link" disabled={disabled} onClick={setLink}>
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-6 w-px bg-flor-200" aria-hidden />
        <ToolbarButton
          title="Alinhar à esquerda"
          active={editor.isActive({ textAlign: 'left' })}
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Centralizar"
          active={editor.isActive({ textAlign: 'center' })}
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Alinhar à direita"
          active={editor.isActive({ textAlign: 'right' })}
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-6 w-px bg-flor-200" aria-hidden />
        <ToolbarButton
          title="Desfazer"
          disabled={disabled || !editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Refazer"
          disabled={disabled || !editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <div className="max-h-[480px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
