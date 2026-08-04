"use client";

import { useEffect, useMemo, useState } from "react";

type Movie = {
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
};

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

export default function Home() {
  const [active, setActive] = useState<"all" | Movie["stage"]>("all");
  const [query, setQuery] = useState("");
  const [watched, setWatched] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [showWatched, setShowWatched] = useState(false);
  const [liveMovies, setLiveMovies] = useState<Movie[]>(movies);
  const [sourceState, setSourceState] = useState("Refreshing live release data…");
  const [sourceStatus, setSourceStatus] = useState<"loading" | "ok" | "error">("loading");

  // Load the saved watched list once, on the client. Guarded so SSR never touches localStorage.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mq:watched");
      if (saved) setWatched(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, []);

  // Persist after hydration only, so the initial empty render doesn't overwrite saved data.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("mq:watched", JSON.stringify(watched));
    } catch {}
  }, [watched, hydrated]);

  useEffect(() => {
    fetch("/api/releases", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Release source unavailable")))
      .then((payload: { releases: Movie[]; updatedAt: string }) => {
        if (payload.releases.length) setLiveMovies(payload.releases);
        setSourceState(`TMDb checked ${new Date(payload.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
        setSourceStatus("ok");
      })
      .catch(() => {
        setSourceState("Showing starter picks · live source reconnecting");
        setSourceStatus("error");
      });
  }, []);

  const toggleWatched = (title: string) => setWatched((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
  const featureMovie = liveMovies.find((movie) => movie.stage === "soon" && movie.backdrop)
    ?? liveMovies.find((movie) => movie.backdrop)
    ?? liveMovies.find((movie) => movie.stage === "soon")
    ?? liveMovies[0];
  // Eyebrow reuses the row's availability vocabulary so the hero and rows read the same; "soon" keeps the punchier label.
  const featureEyebrow = featureMovie.stage === "soon" ? "NEXT UP" : featureMovie.availability.toUpperCase();

  const filtered = useMemo(() => liveMovies.filter((movie) => {
    const stageMatch = active === "all" || movie.stage === active;
    const queryMatch = movie.title.toLowerCase().includes(query.toLowerCase()) || movie.genre.toLowerCase().includes(query.toLowerCase());
    const watchedMatch = !showWatched || watched.includes(movie.title);
    // The hero already shows the feature movie; drop it here so it isn't rendered twice.
    return stageMatch && queryMatch && watchedMatch && movie.title !== featureMovie.title;
  }), [active, query, showWatched, watched, liveMovies, featureMovie]);

  // Hide the per-row status pill when every visible row shows the same availability — in a single-stage
  // tab it just echoes the tab. Keep it when the rows actually differ (All releases, stream-vs-rent, Watched).
  const showStatus = useMemo(() => new Set(filtered.map((movie) => movie.availability)).size > 1, [filtered]);

  const stageCounts = useMemo(() => {
    const pool = liveMovies.filter((movie) => movie.title !== featureMovie.title);
    return {
      all: pool.length,
      theaters: pool.filter((movie) => movie.stage === "theaters").length,
      streaming: pool.filter((movie) => movie.stage === "streaming").length,
      released: pool.filter((movie) => movie.stage === "released").length,
      soon: pool.filter((movie) => movie.stage === "soon").length,
    };
  }, [liveMovies, featureMovie]);

  return (
    <main>
      <aside className="sidebar">
        <a className="brand" href="#top"><span className="brand-mark">M</span><span>midnight<br />queue</span></a>
        <nav aria-label="Tracker navigation">
          <a className="nav-active" href="#releases"><span>✦</span> Releases</a>
          <button className={showWatched ? "nav-active" : ""} onClick={() => setShowWatched((value) => !value)}><span>◌</span> Watched <b>{watched.length}</b></button>
        </nav>
        <div className="sidebar-bottom">
          <p><i className={sourceStatus} /> U.S. release data<br /><small>{sourceState}</small></p>
        </div>
      </aside>

      <section className="content" id="top">
        <header>
          <div>
            <p className="eyebrow">YOUR HORROR CALENDAR</p>
            <h1>Don’t let the good ones<br /><em>slip into the dark.</em></h1>
          </div>
        </header>

        <section className="feature" aria-label="Featured release">
          <div className="feature-art">{featureMovie.backdrop && <img src={featureMovie.backdrop} alt="" />}<span className="moon">◒</span><span className="trees">♠ ♠ ♠</span></div>
          <div className="feature-copy">
            <p className="eyebrow">{featureEyebrow}</p>
            <h2>{featureMovie.title}</h2>
            <p>{featureMovie.note}</p>
            <div className="feature-meta"><span>{featureMovie.genre.toUpperCase()}</span>{featureMovie.platform && <><span>•</span><span>{featureMovie.platform.toUpperCase()}</span></>}</div>
            {featureMovie.tmdbId && <a className="outline-button" href={`/api/trailer/${featureMovie.tmdbId}?q=${encodeURIComponent(featureMovie.title)}`} target="_blank" rel="noreferrer">Watch trailer {icons.chevron}</a>}
          </div>
          <div className="date-badge"><b>{featureMovie.date.split(" ")[1]}</b><span>{featureMovie.month}</span><small>{featureMovie.year}</small></div>
        </section>

        <section className="tracker" id="releases">
          <div className="tracker-heading">
            <div><p className="eyebrow">THE RELEASE TRACKER</p><h2>Coming out of the shadows</h2></div>
            <label className="search"><span>{icons.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles or subgenres" /></label>
          </div>
          <div className="filters" role="tablist" aria-label="Release filters">
            {([['all', 'All releases'], ['theaters', 'In theaters'], ['streaming', 'Available at home'], ['released', 'Recently released'], ['soon', 'Coming soon']] as const).map(([id, label]) => <button key={id} className={active === id ? "selected" : ""} disabled={stageCounts[id] === 0} onClick={() => setActive(id)}>{label} <b>{stageCounts[id]}</b></button>)}
          </div>
          <div className="release-list">
            {filtered.map((movie) => <article className="release-row" key={movie.tmdbId ?? movie.title}>
              <time><strong>{movie.date.split(" ")[1]}</strong><span>{movie.month}<br />{movie.year}</span></time>
              <div className={`poster ${movie.color}`} aria-hidden="true">{movie.poster ? <img src={movie.poster} alt="" /> : <span>{movie.title.split(" ").slice(0, 2).join("\n")}</span>}</div>
              <div className="movie-info"><h3>{movie.title}</h3><p>{movie.genre} <span>·</span> {movie.note}</p></div>
              <div className="availability">{showStatus && <span className={`status ${movie.stage}`}>{movie.availability}</span>}{movie.platform && <b>{movie.platform}</b>}</div>
              <div className="row-actions">
                {movie.tmdbId && <a className="trailer-button" href={`/api/trailer/${movie.tmdbId}?q=${encodeURIComponent(movie.title)}`} target="_blank" rel="noreferrer">Trailer ↗</a>}
                <button onClick={() => toggleWatched(movie.title)} className={watched.includes(movie.title) ? "watched" : "watch-button"} aria-label={`Mark ${movie.title} as watched`}>{watched.includes(movie.title) ? "Watched ✓" : "+ Watched"}</button>
              </div>
            </article>)}
            {filtered.length === 0 && <p className="empty">{
              showWatched && watched.length === 0
                ? "You haven’t marked anything watched yet."
                : query
                  ? `No releases match “${query}”.`
                  : "Nothing lurking in this section yet. Try another filter."
            }</p>}
          </div>
        </section>
      </section>
    </main>
  );
}
