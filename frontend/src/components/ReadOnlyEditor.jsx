import { useEditor, EditorContent, mergeAttributes } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Heading from '@tiptap/extension-heading';

const CustomHeading = Heading.extend({
  renderHTML({ node, HTMLAttributes }) {
    const hasLevel = this.options.levels.includes(node.attrs.level)
    const level = hasLevel
      ? node.attrs.level
      : this.options.levels[0]

    // Generate ID from text content
    const id = node.textContent
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return [`h${level}`, mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { id }), 0]
  },
})

const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };

const parseContent = (value) => {
  if (!value) return EMPTY_DOC;
  try {
    const parsed = JSON.parse(value);
    return parsed?.type ? parsed : EMPTY_DOC;
  } catch {
    return EMPTY_DOC;
  }
};

const ReadOnlyEditor = ({ content }) => {
  const editor = useEditor({
    editable: false,
    content: parseContent(content),
    extensions: [
      StarterKit.configure({
        heading: false, // Disable default heading
      }),
      CustomHeading.configure({
        HTMLAttributes: {
          class: 'scroll-mt-24',
        },
      }),
      Link.configure({ openOnClick: true, autolink: true, defaultProtocol: 'https' }),
      Image.configure({
        HTMLAttributes: {
          class:
            'rounded-2xl border border-slate-200 dark:border-slate-700 mx-auto my-6 w-full max-h-[560px] object-contain bg-slate-50 dark:bg-slate-800/30',
        },
      }),
    ],
  });

  return <EditorContent editor={editor} />;
};

export default ReadOnlyEditor;
