'use client';

import { useEffect, useState, useRef } from 'react';
import { listMedia, uploadMedia, deleteMedia, updateMedia, getMediaUrl, replaceMedia } from '@/lib/api';

type MediaItem = {
  _id: string;
  path: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  createdAt?: string;
};

export default function MediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAlt, setEditAlt] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replacePreview, setReplacePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMedia();
  }, []);

  async function loadMedia() {
    setLoading(true);
    const res = await listMedia({ limit: 50 });
    if (res.ok && res.items) {
      setMediaItems(res.items);
    }
    setLoading(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadAlt) {
        setUploadAlt(file.name);
      }
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      alert('لطفا فایلی انتخاب کنید');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadMedia(selectedFile, uploadAlt || undefined, uploadCaption || undefined);
      if (res.ok) {
        // Clean up preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        setSelectedFile(null);
        setUploadAlt('');
        setUploadCaption('');
        setShowUpload(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        loadMedia();
      } else {
        alert(res.error || 'خطا در آپلود فایل');
      }
    } catch (e) {
      alert('خطا در آپلود فایل');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('آیا از حذف این فایل اطمینان دارید؟')) return;
    const res = await deleteMedia(id);
    if (res.ok) {
      loadMedia();
    } else {
      alert(res.error || 'خطا در حذف فایل');
    }
  }

  function startEdit(item: MediaItem) {
    setEditingId(item._id);
    setEditAlt(item.alt || '');
    setEditCaption(item.caption || '');
    setReplaceFile(null);
    if (replacePreview) {
      URL.revokeObjectURL(replacePreview);
      setReplacePreview(null);
    }
  }

  async function saveEdit() {
    if (!editingId) return;
    let res;
    if (replaceFile) {
      res = await replaceMedia(editingId, replaceFile, editAlt || undefined, editCaption || undefined);
    } else {
      res = await updateMedia(editingId, {
        alt: editAlt || undefined,
        caption: editCaption || undefined
      });
    }
    if (res.ok) {
      setEditingId(null);
      if (replacePreview) {
        URL.revokeObjectURL(replacePreview);
        setReplacePreview(null);
      }
      setReplaceFile(null);
      loadMedia();
    } else {
      alert(res.error || 'خطا در به‌روزرسانی');
    }
  }

  function isImage(path: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(path);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مدیریت رسانه</h1>
          <p className="text-gray-600 mt-1">آپلود و مدیریت فایل‌های رسانه</p>
        </div>
          <button
            onClick={() => {
              setShowUpload(!showUpload);
              if (showUpload) {
                // Clean up preview when closing
                if (previewUrl) {
                  URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                }
                setSelectedFile(null);
                setUploadAlt('');
                setUploadCaption('');
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all font-medium"
          >
            {showUpload ? 'انصراف' : '+ آپلود فایل جدید'}
          </button>
      </div>

      {/* فرم آپلود */}
      {showUpload && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold">آپلود فایل جدید</h2>
          
          <div>
            <label className="block text-sm font-medium mb-1">فایل *</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border rounded-md"
            />
            {selectedFile && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">
                  انتخاب شده: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
                {previewUrl && (
                  <div className="mt-3 border rounded-lg overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="پیش‌نمایش"
                      className="w-full h-auto max-h-64 object-contain bg-gray-50"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Alt Text</label>
            <input
              type="text"
              value={uploadAlt}
              onChange={(e) => setUploadAlt(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="متن جایگزین برای تصویر"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Caption</label>
            <textarea
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows={2}
              placeholder="توضیحات فایل"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {uploading ? 'در حال آپلود...' : 'آپلود'}
          </button>
        </div>
      )}

      {/* گالری رسانه */}
      {loading ? (
        <div className="text-center p-8">در حال بارگذاری...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {mediaItems.map((item) => (
            <div key={item._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:border-blue-300">
              <div className="aspect-square bg-gray-100 relative">
                {isImage(item.path) ? (
                  <img
                    src={getMediaUrl(item.path)}
                    alt={item.alt || ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="text-4xl mb-2">📄</div>
                      <p className="text-xs text-gray-600 truncate">{item.path.split('/').pop()}</p>
                    </div>
                  </div>
                )}
                
                {editingId === item._id ? (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2">
                    <div className="bg-white rounded p-2 w-full max-w-xs space-y-2">
                      <div>
                        <label className="block text-xs font-medium mb-1">تعویض فایل (اختیاری)</label>
                        <input
                          type="file"
                          accept="image/*,video/*,.pdf"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            setReplaceFile(f);
                            if (replacePreview) URL.revokeObjectURL(replacePreview);
                            if (f && f.type.startsWith('image/')) {
                              setReplacePreview(URL.createObjectURL(f));
                            } else {
                              setReplacePreview(null);
                            }
                          }}
                          className="w-full px-2 py-1 text-xs border rounded"
                        />
                        {replacePreview && (
                          <div className="mt-2 border rounded overflow-hidden">
                            <img src={replacePreview} alt="پیش‌نمایش" className="w-full h-auto" />
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        value={editAlt}
                        onChange={(e) => setEditAlt(e.target.value)}
                        placeholder="Alt Text"
                        className="w-full px-2 py-1 text-xs border rounded"
                        autoFocus
                      />
                      <textarea
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        placeholder="Caption"
                        className="w-full px-2 py-1 text-xs border rounded"
                        rows={2}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={saveEdit}
                          className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          ذخیره
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                        >
                          انصراف
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                    <button
                      onClick={() => startEdit(item)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      حذف
                    </button>
                  </div>
                )}
              </div>
              
              <div className="p-2">
                <p className="text-xs font-medium truncate">{item.alt || 'بدون نام'}</p>
                {item.caption && (
                  <p className="text-xs text-gray-500 truncate mt-1">{item.caption}</p>
                )}
                {item.width && item.height && (
                  <p className="text-xs text-gray-400 mt-1">{item.width} × {item.height}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && mediaItems.length === 0 && (
        <div className="text-center p-8 bg-white rounded-lg border">
          <p className="text-gray-600">هنوز فایلی آپلود نشده است</p>
        </div>
      )}
    </div>
  );
}

