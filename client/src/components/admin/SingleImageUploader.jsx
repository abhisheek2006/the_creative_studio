import { useRef, useState } from 'react';
import api, { extractError } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { IconUpload, IconTrash } from '../Icons';

// value: string url (or ''). onChange(newUrl, publicId)
export default function SingleImageUploader({ value = '', onChange, label = 'Image', folder = 'tcs-images' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const handleFiles = async (files) => {
    const file = (files || [])[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file.');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be smaller than 5MB.');

    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      form.append('folder', folder);
      const res = await api.post('/admin/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(res.data.data.url, res.data.data.publicId);
      toast.success('Image uploaded.');
    } catch (err) {
      toast.error(extractError(err, 'Image upload failed.'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="field">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 14,
            overflow: 'hidden',
            border: '2px dashed var(--border)',
            background: 'var(--cream-soft)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {value ? (
            <img src={value} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <IconUpload width="24" height="24" style={{ color: 'var(--forest)' }} />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <button type="button" className="btn btn-outline btn-sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? <span className="spinner" /> : <IconUpload width="15" height="15" />}
            {uploading ? 'Uploading…' : value ? 'Replace' : 'Upload image'}
          </button>
          {value && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange('', '')}>
              <IconTrash width="14" height="14" /> Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      <span className="hint">JPG, PNG or WEBP · up to 5MB.</span>
    </div>
  );
}