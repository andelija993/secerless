import { useState, useEffect } from 'react';
import { getFavorites, removeFavorite } from '../lib/favorites';
import { coverPos, posStyle, optimizeImage } from '../lib/image';
import HeartIcon from './HeartIcon';

export default function FavoritesGrid({ lang }: { lang: string }) {
  const [recipes, setRecipes] = useState<any[] | null | undefined>(undefined);
  const sr = lang === 'sr';
  const recipeBase = sr ? '/sr/recipes' : '/recipes';

  useEffect(() => {
    getFavorites().then(setRecipes);
  }, []);

  async function handleRemove(recipeId: string) {
    await removeFavorite(recipeId);
    setRecipes((prev) => prev?.filter((r) => r.id !== recipeId));
  }

  if (recipes === undefined) {
    return (
      <div className="flex justify-center py-24">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!recipes?.length) {
    const guest = recipes === null;
    return (
      <div className="text-center py-20 flex flex-col items-center gap-4">
        <HeartIcon className="h-16 w-16 opacity-20" />
        {guest ? (
          <>
            <p className="text-xl opacity-70">{sr ? 'Prijavite se da vidite sačuvane recepte' : 'Log in to see your saved recipes'}</p>
            <a href={sr ? '/sr/login' : '/login'} className="btn btn-primary">{sr ? 'Prijava' : 'Log In'}</a>
          </>
        ) : (
          <>
            <p className="text-lg opacity-60">{sr ? 'Nema sačuvanih recepata.' : 'No favorites yet!'}</p>
            <p className="text-sm opacity-50">
              {sr ? 'Pregledajte recepte i kliknite ❤️ da sačuvate.' : 'Browse recipes and tap ❤️ to save them here.'}
            </p>
            <a href={recipeBase} className="btn btn-outline btn-primary mt-2">{sr ? 'Pogledaj recepte' : 'Browse Recipes'}</a>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((r) => (
        <div key={r.id} className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow">
          <a href={`${recipeBase}/${r.slug}`}>
            <figure className="overflow-hidden">
              <img
                src={optimizeImage(r.imageUrl, 700) ?? '/favicon.svg'}
                alt={r.title}
                className="h-44 w-full object-cover"
                style={posStyle(coverPos(r))}
              />
            </figure>
          </a>
          <div className="card-body">
            <a href={`${recipeBase}/${r.slug}`} className="flex-1">
              {r.category && <span className="badge badge-secondary badge-sm mb-1">{r.category.name}</span>}
              <h3 className="card-title">{r.title}</h3>
              {r.description && <p className="text-sm opacity-60 line-clamp-2">{r.description}</p>}
            </a>
            <div className="card-actions justify-end mt-2">
              <button onClick={() => handleRemove(r.id)} className="btn btn-sm btn-ghost text-error gap-1">
                <HeartIcon filled />
                {sr ? 'Ukloni' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

