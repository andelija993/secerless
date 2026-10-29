import { useState } from 'react';
import { useTranslations, useTranslatedPath, type Lang } from '../i18n/utils';
import { login } from '../lib/auth';
import { showToast } from '../lib/toast';

export default function LoginForm({ lang }: { lang: Lang }) {
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
      const message = data?.error || t('login.genericError');
      setError(message);
      showToast(message, 'error');
      return;
    }
    showToast('Logged in successfully');
    window.location.href = translatePath('/');
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="alert alert-error text-sm py-2"><span>{error}</span></div>}
      <input type="email" placeholder={t('login.email')} className="input w-full" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder={t('login.password')} className="input w-full" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? t('login.submitting') : t('login.submit')}
      </button>
    </form>
  );
}

