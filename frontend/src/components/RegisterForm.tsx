import { useState } from 'react';
import { useTranslations, useTranslatedPath, type Lang } from '../i18n/utils';
import { register } from '../lib/auth';

export default function RegisterForm({ lang }: { lang: Lang }) {
  const t = useTranslations(lang);
  const translatePath = useTranslatedPath(lang);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fields = [
    { name: 'firstName', type: 'text', placeholder: t('register.name') },
    { name: 'lastName', type: 'text', placeholder: t('register.surname') },
    { name: 'email', type: 'email', placeholder: t('register.email') },
    { name: 'password', type: 'password', placeholder: t('register.password'), minLength: 6 },
  ] as const;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { ok, data } = await register(form.email, form.password, form.firstName, form.lastName);
    setLoading(false);
    if (ok) window.location.href = translatePath('/');
    else setError(data?.error || t('register.genericError'));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="alert alert-error text-sm py-2"><span>{error}</span></div>}
      {fields.map(({ name, ...props }) => (
        <input
          key={name}
          {...props}
          className="input w-full"
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          required
        />
      ))}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? t('register.submitting') : t('register.submit')}
      </button>
    </form>
  );
}

