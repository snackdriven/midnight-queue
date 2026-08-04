"use client";

import { useEffect, useMemo, useState } from "react";
import { applyStage, releasePool, stageCounts as countByStage, type Movie, type StageFilter } from "./releases";

const movies: Movie[] = [
  { title: "The Black Phone 2", date: "Oct 17", month: "OCT", year: "2025", genre: "Supernatural", stage: "released", availability: "Recently released", note: "The Grabber is back.", color: "violet" },
  { title: "Frankenstein", date: "Oct 17", month: "OCT", year: "2025", genre: "Gothic", stage: "streaming", availability: "Streaming", platform: "Netflix", note: "Guillermo del Toro’s monster movie.", color: "blood" },
  { title: "Five Nights at Freddy’s 2", date: "Dec 5", month: "DEC", year: "2025", genre: "Video game", stage: "released", availability: "Recently released", note: "Round two at Freddy Fazbear’s.", color: "acid" },
  { title: "28 Years Later: The Bone Temple", date: "Jan 16", month: "JAN", year: "2026", genre: "Infected", stage: "released", availability: "Recently released", note: "The next chapter of rage.", color: "ember" },
  { title: "Scream 7", date: "Feb 27", month: "FEB", year: "2026", genre: "Slasher", stage: "released", availability: "Recently released", note: "Ghostface returns.", color: "blood" },
  { title: "The Mummy", date: "Apr 17", month: "APR", year: "2026", genre: "Monster", stage: "released", availability: "Recently released", note: "An all-new take from Lee Cronin.", color: "sand" },
];

const icons = {
  bell: "◉",
  plus: "+",
  search: "⌕",
  chevron: "›",
};

type HomeProps = {
  // Where to load the release feed from. Defaults to the live API route (Vinext / ChatGPT Sites).
  // The static GitHub Pages build passes a baked JSON URL instead.
  dataUrl?: string;
  // How to build a trailer link for a movie. Defaults to the server redirect route; the static
  // build passes a resolver that returns the pre-baked YouTube URL.
  resolveTrailer?: (movie: Movie) => string | undefined;
};

const defaultTrailer = (movie: Movie) =>
  movie.tmdbId ? `/api/trailer/${movie.tmdbId}?q=${encodeURIComponent(movie.title)}` : undefined;

export default function Home({ dataUrl = "/api/releases", resolveTrailer = defaultTrailer }: HomeProps = {}) {
  const [active, setActive] = useState<StageFilter>("all");
  const [query, setQuery] = useState("");
  const [watched, setWatched] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [showWatched, setShowWatched] = useState(false);
  const [liveMovies, setLiveMovies] = useState<Movie[]>(movies);
  const [sourceState, setSourceState] = useState("Checking what crept out this week…");
  const [sourceStatus, setSourceStatus] = useState<"loading" | "ok" | "error">("loading");

  // Load the saved watched list once, on the client. Guarded so SSR never touches localStorage.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ns:watched");
      if (saved) setWatched(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, []);

  // Persist after hydration only, so the initial empty render doesn't overwrite saved data.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("ns:watched", JSON.stringify(watched));
    } catch {}
  }, [watched, hydrated]);

  useEffect(() => {
    fetch(dataUrl, dataUrl.startsWith("/api") ? { cache: "no-store" } : undefined)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Release source unavailable")))
      .then((payload: { releases: Movie[]; updatedAt: string }) => {
        if (payload.releases.length) setLiveMovies(payload.releases);
        setSourceState(`Fresh from TMDb · ${new Date(payload.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
        setSourceStatus("ok");
      })
      .catch(() => {
        setSourceState("Live feed went dark · showing the usual suspects");
        setSourceStatus("error");
      });
  }, []);

  // "?" opens the repo, same as disney-bracket. Skipped while typing, so searching for "?" still works.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "?") return;
      if ((event.target as HTMLElement | null)?.closest("input,textarea")) return;
      window.open("https://github.com/snackdriven/now-screaming", "_blank", "noopener,noreferrer");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleWatched = (title: string) => setWatched((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
  const featureMovie = liveMovies.find((movie) => movie.stage === "soon" && movie.backdrop)
    ?? liveMovies.find((movie) => movie.backdrop)
    ?? liveMovies.find((movie) => movie.stage === "soon")
    ?? liveMovies[0];
  // Eyebrow reuses the row's availability vocabulary so the hero and rows read the same; "soon" keeps the punchier label.
  const featureEyebrow = featureMovie.stage === "soon" ? "NEXT UP" : featureMovie.availability.toUpperCase();

  const pool = useMemo(
    () => releasePool({ movies: liveMovies, query, showWatched, watched, featureTitle: featureMovie.title }),
    [liveMovies, query, showWatched, watched, featureMovie],
  );
  const filtered = useMemo(() => applyStage(pool, active), [pool, active]);

  // Hide the per-row status pill when every visible row shows the same availability — in a single-stage
  // tab it just echoes the tab. Keep it when the rows actually differ (All releases, stream-vs-rent, Watched).
  const showStatus = useMemo(() => new Set(filtered.map((movie) => movie.availability)).size > 1, [filtered]);

  const stageCounts = useMemo(() => countByStage(pool), [pool]);

  // A stage tab can empty out under you — un-mark the last watched title in it, or enter the
  // watched view while a stage you've watched nothing from is selected. Fall back to All rather
  // than leaving a lit-up tab over an empty list.
  useEffect(() => {
    if (active !== "all" && stageCounts[active] === 0) setActive("all");
  }, [active, stageCounts]);

  return (
    <main>
      <aside className="sidebar">
        <a className="brand" href="#top"><span className="brand-mark">N</span><span>now<br />screaming</span></a>
        <nav aria-label="Tracker navigation">
          <a className={showWatched ? "" : "nav-active"} aria-current={showWatched ? undefined : "page"} href="#releases" onClick={() => setShowWatched(false)}><span>✦</span> Releases</a>
          <button className={showWatched ? "nav-active" : ""} aria-current={showWatched ? "page" : undefined} onClick={() => { if (!showWatched) setActive("all"); setShowWatched((value) => !value); }}><span>◌</span> Watched <b>{watched.length}</b></button>
        </nav>
        <div className="sidebar-bottom">
          <p><i className={sourceStatus} /> U.S. release data<br /><small>{sourceState}</small></p>
        </div>
      </aside>

      <section className="content" id="top">
        <header>
          <div>
            <p className="eyebrow">U.S. HORROR · THEATERS TO STREAMING</p>
            <h1>You missed it in theaters.<br /><em>It’s probably streaming by now.</em></h1>
          </div>
        </header>

        <section className="feature" aria-label="Featured release">
          <div className="feature-art">{featureMovie.backdrop && <img src={featureMovie.backdrop} alt="" />}<span className="moon">◒</span><span className="trees">♠ ♠ ♠</span></div>
          <div className="feature-copy">
            <p className="eyebrow">{featureEyebrow}</p>
            <h2>{featureMovie.title}</h2>
            <p>{featureMovie.note}</p>
            <div className="feature-meta"><span>{featureMovie.genre.toUpperCase()}</span>{featureMovie.platform && <><span>•</span><span>{featureMovie.platform.toUpperCase()}</span></>}</div>
            {resolveTrailer(featureMovie) && <a className="outline-button" href={resolveTrailer(featureMovie)} target="_blank" rel="noreferrer">Watch trailer {icons.chevron}</a>}
          </div>
          <div className="date-badge"><b>{featureMovie.date.split(" ")[1]}</b><span>{featureMovie.month}</span><small>{featureMovie.year}</small></div>
        </section>

        <section className="tracker" id="releases">
          <div className="tracker-heading">
            <div><p className="eyebrow">THE RELEASE TRACKER</p><h2>Out now, and on the way</h2></div>
            <label className="search"><span>{icons.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, subgenres, or notes" />{query && <button className="search-clear" onClick={() => setQuery("")} aria-label="Clear search">×</button>}</label>
          </div>
          <div className="filters" role="group" aria-label="Release filters">
            {([['all', 'All releases'], ['theaters', 'In theaters'], ['streaming', 'Available at home'], ['released', 'Recently released'], ['soon', 'Coming soon']] as const).map(([id, label]) => <button key={id} className={active === id ? "selected" : ""} aria-pressed={active === id} disabled={stageCounts[id] === 0} onClick={() => setActive(id)}>{label} <b>{stageCounts[id]}</b></button>)}
          </div>
          <div className="release-list">
            {sourceStatus === "loading" ? Array.from({ length: 6 }).map((_, index) => <div className="skeleton-row" key={index} aria-hidden="true" />) : filtered.map((movie) => <article className="release-row" key={movie.tmdbId ?? movie.title}>
              <time><strong>{movie.date.split(" ")[1]}</strong><span>{movie.month}<br />{movie.year}</span></time>
              <div className={`poster ${movie.color}`} aria-hidden="true">{movie.poster ? <img src={movie.poster} alt="" /> : <span>{movie.title.split(" ").slice(0, 2).join("\n")}</span>}</div>
              <div className="movie-info"><h3>{movie.title}</h3><p>{movie.genre} <span>·</span> {movie.note}</p></div>
              <div className="availability">{showStatus && <span className={`status ${movie.stage}`}>{movie.availability}</span>}{movie.platform && <b>{movie.platform}</b>}</div>
              <div className="row-actions">
                {resolveTrailer(movie) && <a className="trailer-button" href={resolveTrailer(movie)} target="_blank" rel="noreferrer">Trailer ↗</a>}
                <button onClick={() => toggleWatched(movie.title)} className={watched.includes(movie.title) ? "watched" : "watch-button"} aria-label={`Mark ${movie.title} as watched`}>{watched.includes(movie.title) ? "Watched ✓" : "+ Watched"}</button>
              </div>
            </article>)}
            {sourceStatus !== "loading" && filtered.length === 0 && <p className="empty">{
              showWatched && watched.length === 0
                ? "Nothing marked watched yet. Tag a few so Future You can’t pretend she never saw them."
                : query
                  ? `Nothing here goes by “${query}.” Try another name.`
                  : "Nothing lurking in this corner yet. Try another filter."
            }</p>}
          </div>
        </section>
      </section>
    </main>
  );
}
