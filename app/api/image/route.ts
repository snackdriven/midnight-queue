
const sizes = new Set(["w342", "w500", "w780", "w1280"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const size = url.searchParams.get("size") ?? "w500";
  const path = url.searchParams.get("path") ?? "";
  if (!sizes.has(size) || !/^\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(path)) {
    return Response.json({ error: "Invalid image request" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://image.tmdb.org/t/p/${size}${path}`, {
      next: { revalidate: 604800 },
    });
    if (!response.ok || !response.body) throw new Error("Image source unavailable");
    return new Response(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000",
      },
    });
  } catch {
    return Response.json({ error: "Image unavailable" }, { status: 502 });
  }
}
