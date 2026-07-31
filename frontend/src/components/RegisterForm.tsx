import { useState } from 'react';
import { useTranslations, useTranslatedPath, type Lang } from '../i18n/utils';
import { register } from '../lib/auth';

interface Props {
  lang: Lang;
}

export default function RegisterForm({ lang }: Props) {
  const t = useTranslations(lang);
  const translatePath = useTranslatedPath(lang);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { ok, data } = await register(email, password, firstName, lastName);

    setLoading(false);
    if (!ok) {
      setError(data?.error || t('register.genericError'));
      return;
    }

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
        type="text"
        placeholder={t('register.name')}
        className="input input-bordered w-full"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder={t('register.surname')}
        className="input input-bordered w-full"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder={t('register.email')}
        className="input input-bordered w-full"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder={t('register.password')}
        className="input input-bordered w-full"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={6}
        required
      />
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? t('register.submitting') : t('register.submit')}
      </button>
    </form>
  );
}

