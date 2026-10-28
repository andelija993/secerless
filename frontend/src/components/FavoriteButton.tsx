// FavoriteButton — heart toggle for a single recipe.
// Shows a filled heart if the user has saved this recipe, empty if not.
// Redirects to /login if the user is not logged in.

import { useState, useEffect } from 'react';
import { getFavoriteIds, addFavorite, removeFavorite } from '../lib/favorites';
import { showToast } from '../lib/toast';

interface Props {
  recipeId: string;
  lang?: string;
}

export default function FavoriteButton({ recipeId, lang = 'en' }: Props) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // One shared request per page (null = guest)
    getFavoriteIds().then((ids) => {
      setLoggedIn(!!ids);
      setFavorited(!!ids?.has(recipeId));
    });
  }, [recipeId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!loggedIn) {
      window.location.href = lang === 'sr' ? '/sr/login' : '/login';
      return;
    }

    setLoading(true);
    try {
      if (favorited) {
        const { ok } = await removeFavorite(recipeId);
        if (ok) {
          setFavorited(false);
          showToast('Removed from favorites');
        }
      } else {
        const { ok } = await addFavorite(recipeId);
        if (ok) {
          setFavorited(true);
          showToast('Saved to favorites');
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`btn btn-circle btn-sm transition-all ${
        favorited ? 'btn-primary' : 'btn-ghost opacity-60 hover:opacity-100'
      }`}
      title={
        loggedIn === null
          ? 'Loading…'
          : favorited
          ? 'Remove from favorites'
          : 'Save to favorites'
      }
      aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
    >
      {loading ? (
        <span className="loading loading-spinner loading-xs" />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill={favorited ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </button>
  );
}
