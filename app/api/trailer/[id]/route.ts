
type Video = { key: string; site: string; type: string; official: boolean };

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const apiKey = process.env.TMDB_API_KEY;
  const { id } = await context.params;
  if (!apiKey || !/^\d+$/.test(id)) return Response.json({ error: "Trailer is unavailable" }, { status: 404 });

  try {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${apiKey}&language=en-US`, {
      next: { revalidate: 86400 },
    });
    if (!response.ok) throw new Error("TMDb request failed");
    const data = await response.json() as { results: Video[] };
    const trailer = data.results.find((video) => video.site === "YouTube" && video.type === "Trailer" && video.official)
      ?? data.results.find((video) => video.site === "YouTube" && video.type === "Trailer")
      ?? data.results.find((video) => video.site === "YouTube" && video.type === "Teaser");
    if (!trailer) return Response.json({ error: "No trailer has been posted yet" }, { status: 404 });
    return Response.redirect(`https://www.youtube.com/watch?v=${trailer.key}`, 302);
  } catch {
    return Response.json({ error: "Trailer lookup failed" }, { status: 502 });
  }
}
