import { useEffect, useState } from 'react';
import { useTranslations, useTranslatedPath, type Lang } from '../i18n/utils';
import { getMe, logout as apiLogout, type AuthUser } from '../lib/auth';

interface Props {
  lang: Lang;
}


function getInitials(user: AuthUser) {
  const a = user.firstName?.[0] ?? '';
  const b = user.lastName?.[0] ?? '';
  return (a + b).toUpperCase() || user.email[0].toUpperCase();
}

export default function ProfileMenu({ lang }: Props) {
  const t = useTranslations(lang);
  const translatePath = useTranslatedPath(lang);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Ask the backend "who am I?" — the httpOnly JWT cookie (if any) is sent
  // automatically by the browser, so we don't need to manage it ourselves.
  useEffect(() => {
    getMe()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    apiLogout().then(() => {
      setUser(null);
      window.location.href = translatePath('/');
    });
  }

  const displayName = user
    ? user.firstName || user.lastName
      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      : user.email
    : t('profile.guest');

  // daisyUI dropdown: opens while the trigger/content has focus, closes on outside click or Esc-blur
  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className={`btn btn-circle btn-ghost avatar avatar-placeholder ${loading ? 'pointer-events-none' : ''}`}
        aria-label="Open profile menu"
        aria-haspopup="menu"
      >
        {loading ? (
          <div className="bg-base-300 rounded-full w-10 animate-pulse" />
        ) : user?.avatarUrl ? (
          <div className="w-10 rounded-full">
            <img src={user.avatarUrl} alt={displayName} />
          </div>
        ) : (
          <div className="bg-primary text-primary-content rounded-full w-10 font-semibold">
            <span>{user ? getInitials(user) : '👤'}</span>
          </div>
        )}
      </div>

      <div tabIndex={0} className="dropdown-content z-50 mt-4 w-64 rounded-box border border-base-300 bg-base-100 p-2 shadow-2xl">
        <p className="px-3 pt-2 pb-1 font-semibold truncate">{displayName}</p>
        {user && <p className="px-3 pb-1 text-xs opacity-60 truncate">{user.email}</p>}
        <div className="divider my-1" />

        {user ? (
          <>
            <ul className="menu w-full p-0">
              <li><a href={translatePath('/profile')}>👤 {t('profile.myProfile')}</a></li>
              <li><a href={translatePath('/favorites')}>❤️ {t('profile.favorites')}</a></li>
              {user.role === 'ADMIN' && (
                <li><a href={translatePath('/admin')}>🛠️ {t('profile.admin')}</a></li>
              )}
            </ul>
            <div className="divider my-1" />
            <ul className="menu w-full p-0">
              <li><button type="button" onClick={handleLogout} className="text-error">{t('profile.logout')}</button></li>
            </ul>
          </>
        ) : (
          <div className="flex flex-col gap-1 p-1">
            <a href={translatePath('/login')} className="btn btn-primary btn-sm w-full">{t('profile.login')}</a>
            <a href={translatePath('/register')} className="btn btn-ghost btn-sm w-full">{t('profile.signup')}</a>
          </div>
        )}
      </div>
    </div>
  );
}

