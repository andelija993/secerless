import { useEffect, useRef, useState } from 'react';
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

  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  // Ask the backend "who am I?" — the httpOnly JWT cookie (if any) is sent
  // automatically by the browser, so we don't need to manage it ourselves.
  useEffect(() => {
    getMe()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);


  function handleLogout() {
    apiLogout().then(() => {
      setUser(null);
      setOpen(false);
      window.location.href = translatePath('/');
    });
  }

  // --- Auth state now comes from the real Express/JWT backend (Phase 3) ---

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn btn-circle btn-ghost avatar placeholder"
        aria-label="Open profile menu"
        disabled={loading}
      >
        {loading ? (
          <div className="bg-base-300 rounded-full w-10 animate-pulse" />
        ) : user?.avatarUrl ? (
          <div className="w-10 rounded-full">
            <img src={user.avatarUrl} alt={`${user.firstName ?? ''} ${user.lastName ?? ''}`} />
          </div>
        ) : (
          <div className="bg-primary text-primary-content rounded-full w-10 flex items-center justify-center font-semibold">
            {user ? getInitials(user) : '👤'}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-4 w-64 bg-base-100 rounded-box shadow-2xl border border-base-300 p-3 z-50">
          {/* Identity header */}
          <div className="px-2 py-1 mb-2">
            <p className="font-semibold">
              {user ? (user.firstName || user.lastName ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : user.email) : t('profile.guest')}
            </p>
          </div>

          <div className="divider my-1"></div>

          {/* Auth-dependent links */}
          {user ? (
            <>
              <a href={translatePath('/profile')} className="btn btn-ghost btn-sm justify-start w-full">
                {t('profile.myProfile')}
              </a>
              <a href={translatePath('/favorites')} className="btn btn-ghost btn-sm justify-start w-full">
                ❤️ {t('profile.favorites')}
              </a>
              {user.role === 'ADMIN' && (
                <a href={translatePath('/admin')} className="btn btn-ghost btn-sm justify-start w-full">
                  🛠️ {t('profile.admin')}
                </a>
              )}
            </>
          ) : (
            <>
              <a href={translatePath('/login')} className="btn btn-primary btn-sm justify-start w-full mb-1">
                {t('profile.login')}
              </a>
              <a href={translatePath('/register')} className="btn btn-ghost btn-sm justify-start w-full">
                {t('profile.signup')}
              </a>
            </>
          )}


          {user && (
            <>
              <div className="divider my-1"></div>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm justify-start w-full text-error">
                {t('profile.logout')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

