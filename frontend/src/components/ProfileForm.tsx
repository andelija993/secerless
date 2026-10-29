import { useEffect, useState } from 'react';
import { useTranslations, type Lang } from '../i18n/utils';
import { getMe, updateMe } from '../lib/auth';

export default function ProfileForm({ lang }: { lang: Lang }) {
  const t = useTranslations(lang);
  const [form, setForm] = useState({ firstName: '', lastName: '', avatarUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getMe()
      .then((user) => user && setForm({ firstName: user.firstName ?? '', lastName: user.lastName ?? '', avatarUrl: user.avatarUrl ?? '' }))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await updateMe(form);
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  if (loading) return <p className="text-center opacity-60">…</p>;

  const fields = [
    { name: 'firstName', type: 'text', label: t('profile.firstName') },
    { name: 'lastName', type: 'text', label: t('profile.lastName') },
    { name: 'avatarUrl', type: 'url', label: t('profile.pictureUrl'), placeholder: 'https://...' },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex justify-center mb-2">
        <div className="avatar avatar-placeholder">
          <div className="bg-primary text-primary-content rounded-full w-20">
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="Profile" />
            ) : (
              <span className="text-2xl font-semibold">{(form.firstName[0] ?? '') + (form.lastName[0] ?? '') || '?'}</span>
            )}
          </div>
        </div>
      </div>

      {fields.map(({ name, label, ...props }) => (
        <label key={name} className="fieldset">
          <span className="fieldset-legend justify-start">{label}</span>
          <input {...props} className="input w-full" value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
        </label>
      ))}

      <button type="submit" className="btn btn-primary mt-2" disabled={saving}>
        {saved ? `✅ ${t('profile.saved')}` : saving ? '...' : t('profile.save')}
      </button>
    </form>
  );
}

