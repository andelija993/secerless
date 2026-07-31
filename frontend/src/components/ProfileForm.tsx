import { useEffect, useState } from 'react';
import { useTranslations, type Lang } from '../i18n/utils';
import { getMe, updateMe } from '../lib/auth';

interface Props {
  lang: Lang;
}

interface ProfileFields {
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

const emptyForm: ProfileFields = { firstName: '', lastName: '', avatarUrl: '' };

export default function ProfileForm({ lang }: Props) {
  const t = useTranslations(lang);
  const [form, setForm] = useState<ProfileFields>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getMe()
      .then((user) => {
        if (user) {
          setForm({
            firstName: user.firstName ?? '',
            lastName: user.lastName ?? '',
            avatarUrl: user.avatarUrl ?? '',
          });
        }
      })
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

  if (loading) {
    return <p className="text-center opacity-60">…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex justify-center mb-2">
        <div className="avatar placeholder">
          <div className="bg-primary text-primary-content rounded-full w-20">
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="Profile" />
            ) : (
              <span className="text-2xl font-semibold">
                {(form.firstName?.[0] ?? '') + (form.lastName?.[0] ?? '') || '?'}
              </span>
            )}
          </div>
        </div>
      </div>

      <label className="form-control">
        <span className="label-text mb-1">{t('profile.firstName')}</span>
        <input
          type="text"
          className="input input-bordered w-full"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
      </label>

      <label className="form-control">
        <span className="label-text mb-1">{t('profile.lastName')}</span>
        <input
          type="text"
          className="input input-bordered w-full"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
      </label>

      <label className="form-control">
        <span className="label-text mb-1">{t('profile.pictureUrl')}</span>
        <input
          type="url"
          className="input input-bordered w-full"
          placeholder="https://..."
          value={form.avatarUrl}
          onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
        />
      </label>

      <button type="submit" className="btn btn-primary mt-2" disabled={saving}>
        {saved ? `✅ ${t('profile.saved')}` : saving ? '...' : t('profile.save')}
      </button>
    </form>
  );
}

