import { useEffect, useRef, useState } from 'react';
import { useTranslations, useTranslatedPath, type Lang } from '../i18n/utils';

interface Props {
  lang: Lang;
}

interface MockUser {
  firstName: string;
  lastName: string;
  avatarUrl: string;
  loggedIn: boolean;
}

const USER_KEY = 'secerless_user'; // placeholder localStorage key — replaced by real auth in Phase 3/7
const THEME_KEY = 'secerless_theme';

function getInitials(user: MockUser) {
  const a = user.firstName?.[0] ?? '';
  const b = user.lastName?.[0] ?? '';
  return (a + b).toUpperCase() || '?';
}

export default function ProfileMenu({ lang }: Props) {
  const t = useTranslations(lang);
  const translatePath = useTranslatedPath(lang);

  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<MockUser | null>(null);
  const [theme, setTheme] = useState<'secerless' | 'secerless-dark'>('secerless');
  const menuRef = useRef<HTMLDivElement>(null);

  // Load mock user + theme from localStorage on mount (client-only)
  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) setUser(JSON.parse(stored));

    const storedTheme = localStorage.getItem(THEME_KEY) as 'secerless' | 'secerless-dark' | null;
    const initialTheme = storedTheme || document.documentElement.getAttribute('data-theme') || 'secerless';
    setTheme(initialTheme as 'secerless' | 'secerless-dark');
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

  function toggleTheme() {
    const next = theme === 'secerless' ? 'secerless-dark' : 'secerless';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
  }

  function switchLanguage(targetLang: Lang) {
    if (targetLang === lang) return;
    // Strip current lang prefix from pathname, then rebuild for target lang
    const path = window.location.pathname.replace(/^\/(en|sr)/, '') || '/';
    window.location.href = translatePath(path, targetLang);
  }

  function handleLogout() {
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setOpen(false);
  }

  // --- Mock login helper for now, until Phase 3 wires real auth ---
  // (Exposed so the Login page placeholder can call it — see login.astro note)

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn btn-circle btn-ghost avatar placeholder"
        aria-label="Open profile menu"
      >
        {user?.avatarUrl ? (
          <div className="w-10 rounded-full">
            <img src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
          </div>
        ) : (
          <div className="bg-primary text-primary-content rounded-full w-10 flex items-center justify-center font-semibold">
            {user ? getInitials(user) : '👤'}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-base-100 rounded-box shadow-xl border border-base-300 p-3 z-50">
          {/* Identity header */}
          <div className="px-2 py-1 mb-2">
            <p className="font-semibold">
              {user ? `${user.firstName} ${user.lastName}` : t('profile.guest')}
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

          <div className="divider my-1"></div>

          {/* Language switcher */}
          <div className="px-2 py-1">
            <p className="text-xs uppercase opacity-60 mb-1">{t('profile.language')}</p>
            <div className="join w-full">
              <button
                onClick={() => switchLanguage('en')}
                className={`btn btn-sm join-item flex-1 ${lang === 'en' ? 'btn-primary' : 'btn-outline'}`}
              >
                EN
              </button>
              <button
                onClick={() => switchLanguage('sr')}
                className={`btn btn-sm join-item flex-1 ${lang === 'sr' ? 'btn-primary' : 'btn-outline'}`}
              >
                SR
              </button>
            </div>
          </div>

          {/* Theme switcher */}
          <div className="px-2 py-1 mt-2">
            <p className="text-xs uppercase opacity-60 mb-1">{t('profile.theme')}</p>
            <button onClick={toggleTheme} className="btn btn-outline btn-sm w-full justify-start">
              {theme === 'secerless' ? `☀️ ${t('profile.themeLight')}` : `🌙 ${t('profile.themeDark')}`}
            </button>
          </div>

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

