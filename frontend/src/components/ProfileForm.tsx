import { useEffect, useState } from 'react';
import { useTranslations, type Lang } from '../i18n/utils';

interface Props {
  lang: Lang;
}

interface MockUser {
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

const USER_KEY = 'secerless_user'; // placeholder — replaced by a real /api/users/me call in Phase 7

const emptyUser: MockUser = { firstName: '', lastName: '', avatarUrl: '' };

export default function ProfileForm({ lang }: Props) {
  const t = useTranslations(lang);
  const [form, setForm] = useState<MockUser>(emptyUser);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) setForm(JSON.parse(stored));
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem(USER_KEY, JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

      <button type="submit" className="btn btn-primary mt-2">
        {saved ? `✅ ${t('profile.saved')}` : t('profile.save')}
      </button>
    </form>
  );
}

