import { useState } from 'react';
import { useTranslations, useTranslatedPath, type Lang } from '../i18n/utils';
import { login } from '../lib/auth';

interface Props {
  lang: Lang;
}

export default function LoginForm({ lang }: Props) {
  const t = useTranslations(lang);
  const translatePath = useTranslatedPath(lang);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { ok, data } = await login(email, password);

    setLoading(false);
    if (!ok) {
      setError(data?.error || t('login.genericError'));
      return;
    }

    // Full page reload so every component (navbar, profile menu) re-checks
    // auth state via GET /api/auth/me on the freshly-set cookie.
    window.location.href = translatePath('/');
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="alert alert-error text-sm py-2">
          <span>{error}</span>
        </div>
      )}
      <input
        type="email"
        placeholder={t('login.email')}
        className="input input-bordered w-full"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder={t('login.password')}
        className="input input-bordered w-full"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? t('login.submitting') : t('login.submit')}
      </button>
    </form>
  );
}

