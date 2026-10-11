import { useRef, useState } from 'react';
import api, { extractError } from '../services/api';
import { useToast } from '../context/ToastContext';
import { IconUpload, IconTrash } from './Icons';

// value: array of { url, publicId, alt, isPrimary }
export default function ImageUploader({ value = [], onChange, max = 8, label = 'Product images' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const handleFiles = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    if (value.length + list.length > max) {
      toast.error(`You can upload up to ${max} images.`);
      return;
    }

    setUploading(true);
    const uploaded = [];
    try {
      for (const file of list) {
        if (!file.type.startsWith('image/')) {
          toast.error(`"${file.name}" is not an image.`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`"${file.name}" is larger than 5MB.`);
          continue;
        }
        const form = new FormData();
        form.append('image', file);
        form.append('folder', 'tcs-products');
        const res = await api.post('/admin/uploads', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploaded.push({ url: res.data.data.url, publicId: res.data.data.publicId, alt: '', isPrimary: false });
      }
      if (uploaded.length) {
        const next = [...value, ...uploaded];
        if (!next.some((i) => i.isPrimary)) next[0].isPrimary = true;
        onChange(next);
        toast.success(`${uploaded.length} image(s) uploaded.`);
      }
    } catch (err) {
      toast.error(extractError(err, 'Image upload failed.'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (index) => {
    const next = value.filter((_, i) => i !== index);
    if (next.length && !next.some((i) => i.isPrimary)) next[0].isPrimary = true;
    onChange(next);
  };

  const setPrimary = (index) => {
    onChange(value.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  return (
    <div className="field">
      <label>{label}</label>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        style={{
          border: '2px dashed var(--border)',
          borderRadius: '14px',
          padding: '1.2rem',
          textAlign: 'center',
          background: 'var(--cream-soft)',
          cursor: 'pointer',
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <IconUpload width="26" height="26" style={{ color: 'var(--forest)' }} />
        <p style={{ margin: '0.4rem 0 0', fontWeight: 700 }}>
          {uploading ? 'Uploading…' : 'Click or drag images here'}
        </p>
        <span className="hint">JPG, PNG, WEBP, GIF or AVIF · up to 5MB each · max {max} images</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {value.length > 0 && (
        <div className="media-grid" style={{ marginTop: '0.9rem' }}>
          {value.map((img, i) => (
            <div className="media-cell" key={img.publicId || img.url || i}>
              <img src={img.url} alt={img.alt || `Image ${i + 1}`} />
              <button type="button" className="remove" onClick={() => removeAt(i)} aria-label="Remove image">
                <IconTrash width="14" height="14" />
              </button>
              {img.isPrimary ? (
                <span className="main-tag">MAIN</span>
              ) : (
                <button
                  type="button"
                  className="main-tag"
                  style={{ border: 'none', cursor: 'pointer' }}
                  onClick={() => setPrimary(i)}
                >
                  SET MAIN
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}