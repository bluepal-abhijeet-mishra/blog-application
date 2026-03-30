import { useEffect, useMemo, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import InputModal from './InputModal';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Code2,
} from 'lucide-react';

const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };
const IMAGE_URL_REGEX = /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?(#.*)?$/i;
const MARKDOWN_IMAGE_REGEX = /^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/i;
const IMAGE_HOST_HINTS = [
  /(^|\.)images\.unsplash\.com$/i,
  /(^|\.)i\.imgur\.com$/i,
  /(^|\.)res\.cloudinary\.com$/i,
  /(^|\.)lh\d+\.googleusercontent\.com$/i,
  /(^|\.)pbs\.twimg\.com$/i,
  /(^|\.)cdn\./i,
  /(^|\.)media\./i,
  /(^|\.)images\./i,
];

const parseContent = (value) => {
  if (!value) return EMPTY_DOC;
  try {
    const parsed = JSON.parse(value);
    return parsed?.type ? parsed : EMPTY_DOC;
  } catch {
    return EMPTY_DOC;
  }
};

const normalizeUrl = (raw) => {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

const extractImageFromClipboardText = (raw) => {
  const text = normalizeUrl(raw);
  if (!text) return null;
  if (/^data:image\//i.test(text)) {
    return { src: text, alt: '' };
  }

  const markdownMatch = text.match(MARKDOWN_IMAGE_REGEX);
  if (markdownMatch) {
    return {
      src: markdownMatch[2],
      alt: markdownMatch[1] || '',
    };
  }

  try {
    const parsed = new URL(text);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    if (IMAGE_URL_REGEX.test(parsed.pathname)) {
      return { src: parsed.toString(), alt: '' };
    }
    const imageFormatHint = parsed.searchParams.get('format') || parsed.searchParams.get('fm') || '';
    const looksLikeImageCdn = IMAGE_HOST_HINTS.some((pattern) => pattern.test(parsed.hostname));
    if (looksLikeImageCdn || /(png|jpe?g|gif|webp|svg|bmp|avif)/i.test(imageFormatHint)) {
      return { src: parsed.toString(), alt: '' };
    }
  } catch {
    return null;
  }

  return null;
};

const SmartImagePaste = Extension.create({
  name: 'smartImagePaste',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste: (view, event) => {
            const text = event.clipboardData?.getData('text/plain') || '';
            const imageMeta = extractImageFromClipboardText(text);
            if (!imageMeta) return false;

            const { schema, tr } = view.state;
            const imageNode = schema.nodes.image?.create({
              src: imageMeta.src,
              alt: imageMeta.alt,
            });
            if (!imageNode) return false;

            view.dispatch(tr.replaceSelectionWith(imageNode).scrollIntoView());
            return true;
          },
        },
      }),
    ];
  },
});

const EditorButton = ({ onClick, isActive = false, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center ${
      isActive
        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
        : 'text-slate-400 hover:text-primary hover:bg-primary/5'
    }`}
  >
    {children}
  </button>
);

const MenuBar = ({ editor, onOpenLinkModal, onOpenImageModal }) => {
  if (!editor) return null;

  return (
    <div className="border-b border-slate-100 dark:border-slate-800 p-3 mb-4 flex flex-wrap gap-1.5 bg-slate-50/50 dark:bg-slate-900/50">
      <EditorButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold (Ctrl/Cmd+B)">
        <Bold className="w-4 h-4" />
      </EditorButton>
      <EditorButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic (Ctrl/Cmd+I)">
        <Italic className="w-4 h-4" />
      </EditorButton>

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 self-center" />

      <EditorButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
        <Heading1 className="w-4 h-4" />
      </EditorButton>
      <EditorButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
        <Heading2 className="w-4 h-4" />
      </EditorButton>
      <EditorButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3">
        <Heading3 className="w-4 h-4" />
      </EditorButton>

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 self-center" />

      <EditorButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
        <List className="w-4 h-4" />
      </EditorButton>
      <EditorButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Ordered List">
        <ListOrdered className="w-4 h-4" />
      </EditorButton>
      <EditorButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Blockquote">
        <Quote className="w-4 h-4" />
      </EditorButton>
      <EditorButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code Block">
        <Code2 className="w-4 h-4" />
      </EditorButton>

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 self-center" />

      <EditorButton onClick={onOpenLinkModal} isActive={editor.isActive('link')} title="Add/Edit Link">
        <LinkIcon className="w-4 h-4" />
      </EditorButton>
      <EditorButton onClick={() => editor.chain().focus().unsetLink().run()} title="Remove Link">
        <Unlink className="w-4 h-4" />
      </EditorButton>
      <EditorButton onClick={onOpenImageModal} title="Insert Image URL">
        <ImageIcon className="w-4 h-4" />
      </EditorButton>

      <div className="flex-1" />

      <EditorButton onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl/Cmd+Z)">
        <Undo className="w-4 h-4" />
      </EditorButton>
      <EditorButton onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl/Cmd+Shift+Z)">
        <Redo className="w-4 h-4" />
      </EditorButton>
    </div>
  );
};

const RichTextEditor = ({ value, onChange }) => {
  const parsedValue = useMemo(() => parseContent(value), [value]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, initialValue: '' });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' }),
      Image.configure({
        HTMLAttributes: {
          class:
            'rounded-2xl border border-slate-200 dark:border-slate-700 mx-auto my-6 w-full max-h-[560px] object-contain bg-slate-50 dark:bg-slate-800/30',
        },
      }),
      SmartImagePaste,
    ],
    content: parsedValue,
    editorProps: {
      attributes: {
        class:
             'outline-none min-h-[500px] text-[17px] leading-8 text-slate-700 dark:text-slate-200 p-8',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(JSON.stringify(currentEditor.getJSON()), currentEditor.getText());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const incoming = JSON.stringify(parsedValue);
    const existing = JSON.stringify(editor.getJSON());
    if (incoming !== existing) {
      editor.commands.setContent(parsedValue, false);
    }
  }, [editor, parsedValue]);

  const handleOpenLinkModal = useCallback(() => {
    if (!editor) return;
    const existingUrl = editor.getAttributes('link').href || '';
    setModalConfig({ isOpen: true, type: 'link', initialValue: existingUrl });
  }, [editor]);

  const handleOpenImageModal = useCallback(() => {
    setModalConfig({ isOpen: true, type: 'image', initialValue: '' });
  }, []);

  const handleConfirmModal = (url) => {
    if (!editor) return;

    if (modalConfig.type === 'link') {
      if (url.trim() === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
      }
    } else if (modalConfig.type === 'image') {
      if (url.trim()) {
        editor.chain().focus().setImage({ src: url.trim() }).run();
      }
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden focus-within:ring-4 focus-within:ring-primary/5 transition-all duration-300 shadow-sm relative">
      <MenuBar 
        editor={editor} 
        onOpenLinkModal={handleOpenLinkModal}
        onOpenImageModal={handleOpenImageModal}
      />
      <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:tracking-tight prose-a:text-primary prose-code:text-primary">
        <EditorContent editor={editor} />
      </div>

      <InputModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={handleConfirmModal}
        title={modalConfig.type === 'link' ? "Add Connection" : "Insert Visual"}
        message={modalConfig.type === 'link' ? "Enter the destination URL for your link." : "Provide the direct URL to the image you want to embed."}
        placeholder="https://..."
        icon={modalConfig.type === 'link' ? "link" : "image"}
        confirmText={modalConfig.type === 'link' ? "Apply Link" : "Insert Image"}
        initialValue={modalConfig.initialValue}
      />
    </div>
  );
};

export default RichTextEditor;
