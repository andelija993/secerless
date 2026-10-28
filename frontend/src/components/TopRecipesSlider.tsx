import { useMemo, useState } from 'react';

interface Recipe {
  slug: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  category?: { name?: string } | null;
}

interface Props {
  recipes: Recipe[];
  basePath: string;
}

export default function TopRecipesSlider({ recipes, basePath }: Props) {
  const [current, setCurrent] = useState(0);
  const safeRecipes = useMemo(() => recipes.filter((recipe) => recipe && recipe.slug), [recipes]);

  if (!safeRecipes.length) return null;

  const currentRecipe = safeRecipes[current];
  const prev = () => setCurrent((i) => (i - 1 + safeRecipes.length) % safeRecipes.length);
  const next = () => setCurrent((i) => (i + 1) % safeRecipes.length);

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-[2rem] border border-base-300 bg-base-100 shadow-lg">
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <a href={`${basePath}/${currentRecipe.slug}`} className="block group">
            <div className="relative h-[320px] sm:h-[420px] overflow-hidden">
              <img
                src={currentRecipe.imageUrl ?? '/logo.png'}
                alt={currentRecipe.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                {currentRecipe.category?.name && (
                  <span className="badge badge-primary badge-sm mb-3">{currentRecipe.category.name}</span>
                )}
                <h3 className="text-2xl sm:text-3xl font-bold mb-2">{currentRecipe.title}</h3>
                {currentRecipe.description && <p className="max-w-xl text-sm sm:text-base opacity-90">{currentRecipe.description}</p>}
              </div>
            </div>
          </a>

          <div className="flex flex-col justify-between p-5 sm:p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] opacity-60 mb-3">Featured</p>
              <div className="space-y-3">
                {safeRecipes.map((recipe, index) => (
                  <button
                    key={recipe.slug}
                    type="button"
                    onClick={() => setCurrent(index)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-2 text-left transition-all ${
                      index === current
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-base-300 bg-base-100 hover:border-primary/40'
                    }`}
                  >
                    <img
                      src={recipe.imageUrl ?? '/logo.png'}
                      alt={recipe.title}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{recipe.title}</p>
                      {recipe.category?.name && <p className="text-xs opacity-60">{recipe.category.name}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={prev}
                  className="btn btn-circle btn-sm btn-ghost"
                  aria-label="Previous recipe"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="btn btn-circle btn-sm btn-ghost"
                  aria-label="Next recipe"
                >
                  ›
                </button>
              </div>
              <span className="text-xs opacity-60">
                {current + 1} / {safeRecipes.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

