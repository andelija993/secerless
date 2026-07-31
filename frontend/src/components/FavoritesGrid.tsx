// FavoritesGrid — shows the logged-in user's saved recipes.
// Handles all three states: loading, not logged in, and the actual grid.

import { useState, useEffect } from 'react';
import type { AuthUser } from '../lib/auth';
import { getMe } from '../lib/auth';
import { getFavorites, removeFavorite } from '../lib/favorites';

interface Props {
  lang: string;
}

export default function FavoritesGrid({ lang }: Props) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined); // undefined = loading
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loginPath = lang === 'sr' ? '/sr/login' : '/login';
  const recipeBase = lang === 'sr' ? '/sr/recipes' : '/recipes';

  useEffect(() => {
    getMe().then((u) => {
      setUser(u);
      if (u) {
        getFavorites().then((data) => {
          setRecipes(data);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, []);

  // Still checking auth
  if (user === undefined || loading) {
    return (
      <div className="flex justify-center py-24">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="text-center py-20 flex flex-col items-center gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <p className="text-xl opacity-70">
          {lang === 'sr' ? 'Prijavite se da vidite sačuvane recepte' : 'Log in to see your saved recipes'}
        </p>
        <a href={loginPath} className="btn btn-primary">
          {lang === 'sr' ? 'Prijava' : 'Log In'}
        </a>
      </div>
    );
  }

  // Logged in but no favorites yet
  if (recipes.length === 0) {
    return (
      <div className="text-center py-20 flex flex-col items-center gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <p className="text-lg opacity-60">
          {lang === 'sr' ? 'Nema sačuvanih recepata.' : 'No favorites yet!'}
        </p>
        <p className="text-sm opacity-50">
          {lang === 'sr'
            ? 'Pregledajte recepte i kliknite ❤️ da sačuvate.'
            : 'Browse recipes and tap ❤️ to save them here.'}
        </p>
        <a href={recipeBase} className="btn btn-outline btn-primary mt-2">
          {lang === 'sr' ? 'Pogledaj recepte' : 'Browse Recipes'}
        </a>
      </div>
    );
  }

  async function handleRemove(recipeId: string) {
    await removeFavorite(recipeId);
    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((r) => (
        <div key={r.id} className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow">
          <a href={`${recipeBase}/${r.slug}`}>
            <figure>
              <img
                src={r.imageUrl ?? '/favicon.svg'}
                alt={r.title}
                className="h-44 w-full object-cover"
              />
            </figure>
          </a>
          <div className="card-body">
            <a href={`${recipeBase}/${r.slug}`} className="flex-1">
              {r.category && (
                <span className="badge badge-secondary badge-sm mb-1">{r.category.name}</span>
              )}
              <h3 className="card-title">{r.title}</h3>
              {r.description && (
                <p className="text-sm opacity-60 line-clamp-2">{r.description}</p>
              )}
            </a>
            <div className="card-actions justify-end mt-2">
              <button
                onClick={() => handleRemove(r.id)}
                className="btn btn-sm btn-ghost text-error gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {lang === 'sr' ? 'Ukloni' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

