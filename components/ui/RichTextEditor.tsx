'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

type RichTextEditorProps = {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
};

export default function RichTextEditor({ content, onChange, placeholder = 'Start typing...' }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: content,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-white">
            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1 px-2 rounded hover:bg-gray-200 text-sm font-bold ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
                    type="button"
                >
                    B
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1 px-2 rounded hover:bg-gray-200 text-sm italic ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
                    type="button"
                >
                    I
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1 px-2 rounded hover:bg-gray-200 text-sm ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
                    type="button"
                >
                    • List
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-1 px-2 rounded hover:bg-gray-200 text-sm ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
                    type="button"
                >
                    1. List
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button
                    onClick={() => editor.chain().focus().undo().run()}
                    className="p-1 px-2 rounded hover:bg-gray-200 text-sm"
                    type="button"
                >
                    ↩ Undo
                </button>
            </div>

            {/* Content Area */}
            <EditorContent
                editor={editor}
                className="prose prose-sm max-w-none p-4 min-h-[200px] outline-none text-slate-900 font-medium"
            />

            <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
             outline: none !important;
        }
      `}</style>
        </div>
    );
}
