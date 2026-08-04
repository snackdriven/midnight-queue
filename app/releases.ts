export type Movie = {
  title: string;
  date: string;
  month: string;
  year: string;
  genre: string;
  stage: "theaters" | "streaming" | "released" | "soon";
  availability: string;
  platform?: string;
  note: string;
  color: string;
  poster?: string;
  backdrop?: string;
  tmdbId?: number;
  trailerUrl?: string;
};

export type StageFilter = "all" | Movie["stage"];

type PoolInput = {
  movies: Movie[];
  query: string;
  showWatched: boolean;
  watched: string[];
  featureTitle: string;
};

// Everything the release list applies except the stage tab itself. Counts and rows both come from
// this one pool, which is what keeps a tab from advertising rows the list won't render.
export function releasePool({ movies, query, showWatched, watched, featureTitle }: PoolInput): Movie[] {
  const needle = query.trim().toLowerCase();
  return movies.filter((movie) => {
    const queryMatch = !needle || [movie.title, movie.genre, movie.note, movie.platform ?? ""].some((field) => field.toLowerCase().includes(needle));
    const watchedMatch = !showWatched || watched.includes(movie.title);
    // The hero sits above the list, so the list drops the duplicate — except in the watched view,
    // where that's the only place it can appear and it has no watched toggle of its own.
    const notFeature = showWatched || movie.title !== featureTitle;
    return queryMatch && watchedMatch && notFeature;
  });
}

export function stageCounts(pool: Movie[]) {
  return {
    all: pool.length,
    theaters: pool.filter((movie) => movie.stage === "theaters").length,
    streaming: pool.filter((movie) => movie.stage === "streaming").length,
    released: pool.filter((movie) => movie.stage === "released").length,
    soon: pool.filter((movie) => movie.stage === "soon").length,
  };
}

export function applyStage(pool: Movie[], active: StageFilter): Movie[] {
  return active === "all" ? pool : pool.filter((movie) => movie.stage === active);
}
