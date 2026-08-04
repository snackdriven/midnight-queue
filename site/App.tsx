import Home from "../app/page";
import "../app/globals.css";

// Static GitHub Pages build: same UI as the live app, but fed by a release feed baked at
// build time (see scripts/snapshot.mjs) and trailer links resolved into direct YouTube URLs.
const dataUrl = `${import.meta.env.BASE_URL}data/releases.json`;

export default function App() {
  return <Home dataUrl={dataUrl} resolveTrailer={(movie) => movie.trailerUrl} />;
}
