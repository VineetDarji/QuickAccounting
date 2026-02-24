import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { CaseDocument, ClientProfile, User } from '../types';
import { getProfile, upsertProfile } from '../services/profileService';
import { logActivity } from '../services/activityService';
import { deleteDocument, getDocument, putDocument } from '../services/documentsDb';
import { generateId } from '../services/storageService';
import { updateStoredUserIdentity } from '../services/userNameService';
import { useUserStore } from '../store/userStore';

interface ProfileProps {
  user: User | null;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const login = useUserStore((state) => state.login);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [nameParts, setNameParts] = useState({ firstName: '', middleName: '', lastName: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isAadhaarUploading, setIsAadhaarUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfile(getProfile(user));
  }, [user]);

  useEffect(() => {
    if (!profile) return;
    const parts = String(profile.name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 0) {
      setNameParts({ firstName: '', middleName: '', lastName: '' });
      return;
    }
    if (parts.length === 1) {
      setNameParts({ firstName: parts[0], middleName: '', lastName: '' });
      return;
    }
    if (parts.length === 2) {
      setNameParts({ firstName: parts[0], middleName: '', lastName: parts[1] });
      return;
    }
    setNameParts({
      firstName: parts[0],
      middleName: parts.slice(1, -1).join(' '),
      lastName: parts[parts.length - 1],
    });
  }, [profile?.name]);

  if (!user) return <Navigate to="/login" />;
  if (!profile) return <div className="max-w-4xl mx-auto px-4 py-16">Loading...</div>;
  const normalizedRole = String(user.role || '').toLowerCase();
  const profileLabel = normalizedRole === 'client' ? 'Client Profile' : 'User Profile';

  const onSave = async () => {
    if (!nameParts.firstName.trim() || !nameParts.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    setIsSaving(true);
    try {
      const fullName = [nameParts.firstName, nameParts.middleName, nameParts.lastName]
        .map((part) => String(part || '').trim())
        .filter(Boolean)
        .join(' ');
      const saved = upsertProfile({ ...profile, name: fullName });
      setProfile(saved);
      updateStoredUserIdentity({
        email: saved.email,
        firstName: nameParts.firstName,
        middleName: nameParts.middleName,
        lastName: nameParts.lastName,
      });
      login({
        ...user,
        name: fullName,
        firstName: nameParts.firstName.trim(),
        middleName: nameParts.middleName.trim(),
        lastName: nameParts.lastName.trim(),
      });
      toast.success('Profile saved');
      logActivity(user, 'UPDATE_PROFILE', 'Updated profile and notification preferences');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes)) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let idx = 0;
    while (value >= 1024 && idx < units.length - 1) {
      value /= 1024;
      idx += 1;
    }
    const digits = idx === 0 ? 0 : 1;
    return `${value.toFixed(digits)} ${units[idx]}`;
  };

  const uploadAadhaar = async (file: File) => {
    if (!user) return;
    if (!profile) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)');
      return;
    }

    setIsAadhaarUploading(true);
    try {
      const previous = profile.aadhaarDocument?.id;
      if (previous) {
        try {
          await deleteDocument(previous);
        } catch {
          // ignore
        }
      }

      const id = generateId();
      const meta: CaseDocument = {
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        uploadedAt: Date.now(),
      };

      await putDocument({ ...meta, caseId: `profile:${user.email}`, ownerEmail: user.email, blob: file });

      const saved = upsertProfile({ ...profile, aadhaarDocument: meta });
      setProfile(saved);
      toast.success('Aadhaar uploaded');
      logActivity(user, 'UPLOAD_AADHAAR', `Uploaded Aadhaar: ${meta.name}`);
    } catch (e) {
      console.error(e);
      toast.error('Upload failed');
    } finally {
      setIsAadhaarUploading(false);
    }
  };

  const openAadhaar = async (download: boolean) => {
    if (!profile?.aadhaarDocument) return;
    try {
      const stored = await getDocument(profile.aadhaarDocument.id);
      if (!stored?.blob) throw new Error('Missing blob');
      const url = URL.createObjectURL(stored.blob);
      if (download) {
        const a = document.createElement('a');
        a.href = url;
        a.download = profile.aadhaarDocument.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (e) {
      console.error(e);
      toast.error('Could not open Aadhaar document');
    }
  };

  const removeAadhaar = async () => {
    if (!user) return;
    if (!profile?.aadhaarDocument) return;
    setIsAadhaarUploading(true);
    try {
      await deleteDocument(profile.aadhaarDocument.id);
      const saved = upsertProfile({ ...profile, aadhaarDocument: null });
      setProfile(saved);
      toast.success('Aadhaar removed');
      logActivity(user, 'DELETE_AADHAAR', `Removed Aadhaar: ${profile.aadhaarDocument.name}`);
    } catch (e) {
      console.error(e);
      toast.error('Remove failed');
    } finally {
      setIsAadhaarUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-8">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{profileLabel}</p>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mt-2">Your Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Keep your details up to date so our team can process your cases faster.
        </p>
      </div>

      <Card>
        <div className="p-8 space-y-10">
          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="First Name"
              value={nameParts.firstName}
              onChange={(e) => setNameParts({ ...nameParts, firstName: e.target.value })}
              placeholder="First name"
            />
            <Input
              label="Middle Name"
              value={nameParts.middleName}
              onChange={(e) => setNameParts({ ...nameParts, middleName: e.target.value })}
              placeholder="Middle name (optional)"
            />
            <Input
              label="Last Name"
              value={nameParts.lastName}
              onChange={(e) => setNameParts({ ...nameParts, lastName: e.target.value })}
              placeholder="Last name"
            />
            <Input label="Email" value={profile.email} readOnly disabled />
            <Input
              label="Phone Number"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+91 ..."
            />
            <Input
              label="WhatsApp Number"
              value={profile.whatsapp}
              onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
              placeholder="+91 ..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="PAN"
              value={profile.pan}
              onChange={(e) => setProfile({ ...profile, pan: e.target.value.toUpperCase() })}
              placeholder="ABCDE1234F"
            />
            <Input
              label="Aadhaar"
              value={profile.aadhaar}
              onChange={(e) => setProfile({ ...profile, aadhaar: e.target.value })}
              placeholder="xxxx xxxx xxxx"
            />
            <div className="md:col-span-2 bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Aadhaar Card Upload</p>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-2">
                    Upload a PDF or image. Stored locally in your browser (demo).
                  </p>
                </div>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  disabled={isAadhaarUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    uploadAadhaar(file);
                    e.currentTarget.value = '';
                  }}
                  className="w-full md:w-auto px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>

              {profile.aadhaarDocument ? (
                <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{profile.aadhaarDocument.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                      {formatBytes(profile.aadhaarDocument.size)} - Uploaded {new Date(profile.aadhaarDocument.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => openAadhaar(false)} disabled={isAadhaarUploading}>
                      View
                    </Button>
                    <Button onClick={() => openAadhaar(true)} disabled={isAadhaarUploading} variant="secondary">
                      Download
                    </Button>
                    <Button onClick={removeAadhaar} disabled={isAadhaarUploading} variant="ghost">
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-300">
                  No Aadhaar card uploaded yet.
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Address</label>
              <textarea
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                rows={3}
                className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-base font-semibold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all duration-200"
                placeholder="Street, City, State, PIN"
              />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 rounded-2xl p-6">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Notifications (Stub)</p>
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <label className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={profile.notificationPrefs.email}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      notificationPrefs: { ...profile.notificationPrefs, email: e.target.checked },
                    })
                  }
                />
                Email updates
              </label>
              <label className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={profile.notificationPrefs.whatsapp}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      notificationPrefs: { ...profile.notificationPrefs, whatsapp: e.target.checked },
                    })
                  }
                />
                WhatsApp updates
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                (Sending is not connected yet; this stores preferences only.)
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
