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

const ReadOnlyEditor = ({ content }) => {
  const editor = useEditor({
    editable: false,
    content: JSON.parse(content || '{}'),
    extensions: [
      StarterKit.configure({
        heading: false, // Disable default heading
      }),
      CustomHeading.configure({
        HTMLAttributes: {
          class: 'scroll-mt-24',
        },
      }),
      Link,
      Image,
    ],
  });

  return <EditorContent editor={editor} />;
};

export default ReadOnlyEditor;
