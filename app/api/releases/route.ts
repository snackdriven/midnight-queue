
type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
};

type WatchmodeSearch = { title_results?: Array<{ id: number }> };
type WatchmodeSource = { name: string; type: "sub" | "free" | "rent" | "buy" | string; region: string };

const genreNames: Record<number, string> = {
  27: "Horror", 53: "Thriller", 9648: "Mystery", 878: "Sci-fi horror", 14: "Fantasy horror",
};

function displayDate(iso: string) {
  const date = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
}

function shortNote(overview: string) {
  if (!overview) return "Details are still emerging.";
  return overview.length > 92 ? `${overview.slice(0, 89).trim()}…` : overview;
}

async function getHomeAvailability(tmdbId: number, apiKey: string) {
  const search = new URL("https://api.watchmode.com/v1/search/");
  search.search = new URLSearchParams({ apiKey, search_field: "tmdb_id", search_value: String(tmdbId) }).toString();
  const searchResponse = await fetch(search, { next: { revalidate: 21600 } });
  if (!searchResponse.ok) return null;
  const match = (await searchResponse.json() as WatchmodeSearch).title_results?.[0];
  if (!match) return null;
  const sourcesResponse = await fetch(`https://api.watchmode.com/v1/title/${match.id}/sources/?apiKey=${apiKey}`, { next: { revalidate: 21600 } });
  if (!sourcesResponse.ok) return null;
  const sources = (await sourcesResponse.json() as WatchmodeSource[]).filter((source) => source.region === "US");
  const subscription = sources.filter((source) => source.type === "sub" || source.type === "free");
  const home = subscription.length ? subscription : sources.filter((source) => source.type === "rent" || source.type === "buy");
  if (!home.length) return null;
  return {
    availability: subscription.length ? "Streaming now" : "Rent or buy",
    platform: [...new Set(home.map((source) => source.name))].slice(0, 2).join(" · "),
  };
}

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY;
  const watchmodeApiKey = process.env.WATCHMODE_API_KEY;
  if (!apiKey) return Response.json({ error: "Movie source is not configured" }, { status: 503 });

  const today = new Date().toISOString().slice(0, 10);
  const nextYear = new Date(Date.now() + 370 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const query = new URLSearchParams({
    api_key: apiKey,
    language: "en-US",
    region: "US",
    sort_by: "primary_release_date.asc",
    "primary_release_date.gte": new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    "primary_release_date.lte": nextYear,
    with_genres: "27",
    include_adult: "false",
    page: "1",
  });

  try {
    const response = await fetch(`https://api.themoviedb.org/3/discover/movie?${query}`, {
      next: { revalidate: 21600 },
    });
    if (!response.ok) throw new Error(`TMDb returned ${response.status}`);
    const data = await response.json() as { results: TmdbMovie[] };
    const releases = [];
    for (const [index, movie] of data.results.slice(0, 12).entries()) {
      const [month, day] = displayDate(movie.release_date).split(" ");
      const genre = movie.genre_ids.map((id) => genreNames[id]).find(Boolean) ?? "Horror";
      const releaseIsPast = movie.release_date <= today;
      const home = releaseIsPast && watchmodeApiKey ? await getHomeAvailability(movie.id, watchmodeApiKey) : null;
      const release = {
        title: movie.title,
        date: `${month} ${day}`,
        month: month.toUpperCase(),
        year: movie.release_date.slice(0, 4),
        genre,
        stage: home ? "streaming" as const : releaseIsPast ? "theaters" as const : "soon" as const,
        availability: home?.availability ?? (releaseIsPast ? "In theaters" : "Theatrical date"),
        platform: home?.platform,
        note: shortNote(movie.overview),
        color: ["violet", "blood", "acid", "ember", "sand"][index % 5],
        poster: movie.poster_path ? `/api/image?size=w342&path=${encodeURIComponent(movie.poster_path)}` : undefined,
        backdrop: movie.backdrop_path ? `/api/image?size=w1280&path=${encodeURIComponent(movie.backdrop_path)}` : undefined,
        tmdbId: movie.id,
      };
      releases.push(release);
    }
    return Response.json({ releases, updatedAt: new Date().toISOString() }, {
      headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("Release feed refresh failed", error);
    return Response.json({ error: "Could not refresh the theatrical feed" }, { status: 502 });
  }
}
