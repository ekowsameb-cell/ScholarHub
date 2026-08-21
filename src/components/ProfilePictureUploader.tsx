import React, { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { dbUpdateUserProfilePic, dbGetUsers } from '../dbAdapter';
import { useAuth } from '../context/AuthContext';

interface Props {
  /** Called after a successful upload with the new URL */
  onUploaded?: (url: string) => void;
}

export const ProfilePictureUploader: React.FC<Props> = ({ onUploaded }) => {
  const { currentUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const initialAvatar = () =>
    dbGetUsers().find(u => u.uid === currentUser?.uid)?.avatar || '';

  const [preview, setPreview] = useState<string>(initialAvatar);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const initials = currentUser?.fullName
    ?.split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be ≤ 2 MB');
      return;
    }
    setError('');
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      try {
        await dbUpdateUserProfilePic(currentUser!.uid, dataUrl);
        onUploaded?.(dataUrl);
      } catch {
        setError('Upload failed — saved locally only.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
      <div
        className="avatar-uploader"
        onClick={() => inputRef.current?.click()}
        title="Click to change profile picture"
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Profile" className="avatar-img" />
        ) : (
          <div className="avatar-initials">{initials}</div>
        )}
        <div className="avatar-overlay">
          {uploading
            ? <Loader2 size={22} className="spin" color="#fff" />
            : <Camera size={22} color="#fff" />
          }
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
        id="avatar-file-input"
      />
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        Click avatar to change photo (max 2 MB)
      </p>
      {error && (
        <p style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>{error}</p>
      )}
    </div>
  );
};

export default ProfilePictureUploader;

