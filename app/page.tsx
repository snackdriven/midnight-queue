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
  const [showWatched, setShowWatched] = useState(false);
  const [liveMovies, setLiveMovies] = useState<Movie[]>(movies);
  const [sourceState, setSourceState] = useState("Refreshing live release data…");

  useEffect(() => {
    fetch("/api/releases", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Release source unavailable")))
      .then((payload: { releases: Movie[]; updatedAt: string }) => {
        if (payload.releases.length) setLiveMovies(payload.releases);
        setSourceState(`TMDb checked ${new Date(payload.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
      })
      .catch(() => setSourceState("Showing starter picks · live source reconnecting"));
  }, []);

  const filtered = useMemo(() => liveMovies.filter((movie) => {
    const stageMatch = active === "all" || movie.stage === active;
    const queryMatch = movie.title.toLowerCase().includes(query.toLowerCase()) || movie.genre.toLowerCase().includes(query.toLowerCase());
    const watchedMatch = !showWatched || watched.includes(movie.title);
    return stageMatch && queryMatch && watchedMatch;
  }), [active, query, showWatched, watched, liveMovies]);

  const toggleWatched = (title: string) => setWatched((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
  const featureMovie = liveMovies.find((movie) => movie.stage === "soon") ?? liveMovies[0];

  return (
    <main>
      <aside className="sidebar">
        <a className="brand" href="#top"><span className="brand-mark">M</span><span>midnight<br />queue</span></a>
        <nav aria-label="Tracker navigation">
          <a className="nav-active" href="#releases"><span>✦</span> Releases</a>
          <button className={showWatched ? "nav-active" : ""} onClick={() => setShowWatched((value) => !value)}><span>◌</span> Watched <b>{watched.length}</b></button>
          <a href="#watchlist"><span>♡</span> Watchlist <b>12</b></a>
        </nav>
        <div className="sidebar-bottom">
          <button className="settings"><span>◐</span> Settings</button>
          <p><i /> U.S. release data<br /><small>{sourceState}</small></p>
        </div>
      </aside>

      <section className="content" id="top">
        <header>
          <div>
            <p className="eyebrow">YOUR HORROR CALENDAR</p>
            <h1>Don’t let the good ones<br /><em>slip into the dark.</em></h1>
          </div>
          <div className="header-actions">
            <button className="icon-button" aria-label="Notifications">{icons.bell}<i /></button>
            <button className="add-button">{icons.plus} Add to watchlist</button>
          </div>
        </header>

        <section className="feature" aria-label="Next up">
          <div className="feature-art">{featureMovie.backdrop && <img src={featureMovie.backdrop} alt="" />}<span className="moon">◒</span><span className="trees">♠ ♠ ♠</span></div>
          <div className="feature-copy">
            <p className="eyebrow">NEXT UP · {featureMovie.date.toUpperCase()}</p>
            <h2>{featureMovie.title}</h2>
            <p>{featureMovie.note}</p>
            <div className="feature-meta"><span>{featureMovie.availability.toUpperCase()}</span><span>•</span><span>{featureMovie.genre.toUpperCase()}</span></div>
            {featureMovie.tmdbId ? <a className="outline-button" href={`/api/trailer/${featureMovie.tmdbId}`} target="_blank" rel="noreferrer">Watch trailer {icons.chevron}</a> : <button className="outline-button">View details {icons.chevron}</button>}
          </div>
          <div className="date-badge"><b>{featureMovie.date.split(" ")[1]}</b><span>{featureMovie.month}</span><small>{featureMovie.year}</small></div>
        </section>

        <section className="tracker" id="releases">
          <div className="tracker-heading">
            <div><p className="eyebrow">THE RELEASE TRACKER</p><h2>Coming out of the shadows</h2></div>
            <label className="search"><span>{icons.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles or subgenres" /></label>
          </div>
          <div className="filters" role="tablist" aria-label="Release filters">
            {([['all', 'All releases'], ['theaters', 'In theaters'], ['streaming', 'Available at home'], ['released', 'Recently released'], ['soon', 'Coming soon']] as const).map(([id, label]) => <button key={id} className={active === id ? "selected" : ""} onClick={() => setActive(id)}>{label}</button>)}
          </div>
          <div className="release-list">
            {filtered.map((movie) => <article className="release-row" key={movie.title}>
              <time><strong>{movie.date.split(" ")[0]}</strong><span>{movie.month}<br />{movie.year}</span></time>
              <div className={`poster ${movie.color}`} aria-hidden="true">{movie.poster ? <img src={movie.poster} alt="" /> : <span>{movie.title.split(" ").slice(0, 2).join("\n")}</span>}</div>
              <div className="movie-info"><h3>{movie.title}</h3><p>{movie.genre} <span>·</span> {movie.note}</p></div>
              <div className="availability"><span className={`status ${movie.stage}`}>{movie.availability}</span>{movie.platform && <b>{movie.platform}</b>}</div>
              <div className="row-actions">
                {movie.tmdbId && <a className="trailer-button" href={`/api/trailer/${movie.tmdbId}`} target="_blank" rel="noreferrer">Trailer ↗</a>}
                <button onClick={() => toggleWatched(movie.title)} className={watched.includes(movie.title) ? "watched" : "watch-button"} aria-label={`Mark ${movie.title} as watched`}>{watched.includes(movie.title) ? "Watched ✓" : "+ Watchlist"}</button>
              </div>
            </article>)}
            {filtered.length === 0 && <p className="empty">Nothing lurking here yet. Try another filter or search.</p>}
          </div>
        </section>
      </section>
    </main>
  );
}
