import { useState, useEffect } from 'react';
import { getFavoriteIds, addFavorite, removeFavorite } from '../lib/favorites';
import { showToast } from '../lib/toast';
import HeartIcon from './HeartIcon';

interface Props {
  recipeId: string;
  lang?: string;
}

export default function FavoriteButton({ recipeId, lang = 'en' }: Props) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getFavoriteIds().then((ids) => {
      setLoggedIn(!!ids);
      setFavorited(!!ids?.has(recipeId));
    });
  }, [recipeId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault(); // the button sits inside a recipe card link
    e.stopPropagation();
    if (!loggedIn) {
      window.location.href = lang === 'sr' ? '/sr/login' : '/login';
      return;
    }

    setLoading(true);
    const { ok } = await (favorited ? removeFavorite(recipeId) : addFavorite(recipeId));
    setLoading(false);
    if (ok) {
      setFavorited(!favorited);
      showToast(favorited ? 'Removed from favorites' : 'Saved to favorites');
    }
  }

  const label = favorited ? 'Remove from favorites' : 'Save to favorites';
  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={label}
      aria-label={label}
      className={`btn btn-circle btn-sm transition-all ${favorited ? 'btn-primary' : 'btn-ghost opacity-60 hover:opacity-100'}`}
    >
      {loading ? <span className="loading loading-spinner loading-xs" /> : <HeartIcon filled={favorited} />}
    </button>
  );
}

