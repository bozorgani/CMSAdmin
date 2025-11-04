'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useEffect, useState } from 'react';
import { listMedia, getMediaUrl } from '@/lib/api';

interface RichTextEditorProps {
  content: any;
  onChange: (content: any) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [mediaItems, setMediaItems] = useState<any[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded',
        },
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4'
      }
    }
  });

  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  async function loadMedia() {
    const res = await listMedia({ limit: 50 });
    if (res.ok && res.items) {
      setMediaItems(res.items);
    }
  }

  function handleInsertImage(media: any) {
    if (!editor) return;
    const imageUrl = getMediaUrl(media.path);
    editor.chain().focus().setImage({ src: imageUrl, alt: media.alt || '' }).run();
    setShowImageModal(false);
  }

  function isImage(path: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(path);
  }

  if (!editor) {
    return <div className="border rounded-md p-4 min-h-[300px]">در حال بارگذاری ویرایشگر...</div>;
  }

  return (
    <div className="border rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 text-sm rounded hover:bg-gray-200 ${
            editor.isActive('bold') ? 'bg-gray-300' : ''
          }`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 text-sm rounded hover:bg-gray-200 ${
            editor.isActive('italic') ? 'bg-gray-300' : ''
          }`}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-1 text-sm rounded hover:bg-gray-200 ${
            editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
          }`}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1 text-sm rounded hover:bg-gray-200 ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1 text-sm rounded hover:bg-gray-200 ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
          }`}
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 text-sm rounded hover:bg-gray-200 ${
            editor.isActive('bulletList') ? 'bg-gray-300' : ''
          }`}
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 text-sm rounded hover:bg-gray-200 ${
            editor.isActive('orderedList') ? 'bg-gray-300' : ''
          }`}
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-3 py-1 text-sm rounded hover:bg-gray-200 ${
            editor.isActive('blockquote') ? 'bg-gray-300' : ''
          }`}
        >
          &quot;
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-3 py-1 text-sm rounded hover:bg-gray-200"
        >
          ─
        </button>
        <button
          type="button"
          onClick={() => {
            setShowImageModal(true);
            loadMedia();
          }}
          className="px-3 py-1 text-sm rounded hover:bg-gray-200"
          title="درج تصویر"
        >
          🖼️
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="px-3 py-1 text-sm rounded hover:bg-gray-200 disabled:opacity-50"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="px-3 py-1 text-sm rounded hover:bg-gray-200 disabled:opacity-50"
        >
          ↷
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Image Insert Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">انتخاب تصویر برای درج در محتوا</h3>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {mediaItems
                  .filter((item) => isImage(item.path))
                  .map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => handleInsertImage(item)}
                      className="border-2 border-gray-200 rounded-md overflow-hidden hover:border-blue-500 transition-all"
                    >
                      <div className="aspect-square bg-gray-100">
                        <img
                          src={getMediaUrl(item.path)}
                          alt={item.alt || ''}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {item.alt && (
                        <div className="p-2 bg-white">
                          <p className="text-xs text-gray-600 truncate">{item.alt}</p>
                        </div>
                      )}
                    </button>
                  ))}
              </div>
              
              {mediaItems.filter((item) => isImage(item.path)).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>هنوز تصویری آپلود نشده است</p>
                  <p className="text-sm mt-2">لطفا ابتدا از صفحه مدیریت رسانه تصویر آپلود کنید</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

