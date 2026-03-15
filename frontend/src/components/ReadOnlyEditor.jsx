import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

const ReadOnlyEditor = ({ content }) => {
  const editor = useEditor({
    editable: false,
    content: JSON.parse(content || '{}'),
    extensions: [
      StarterKit,
      Link,
      Image,
    ],
  });

  return <EditorContent editor={editor} />;
};

export default ReadOnlyEditor;
