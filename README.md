# Midnight Queue

At some point you are going to remember a horror movie you meant to see in theaters three weeks after it left.

Then, six months later, you will find out it quietly arrived on streaming, watch the trailer, decide you were always going to watch it, and immediately lose it again.

This is for that. Your memory did its best.

**[Enter the queue if you're ready →](https://midnight-queue.kayofthedead.chatgpt.site/)**

---

## The premise

A small, moody calendar for horror movies that are:

- Coming to U.S. theaters
- Still in theaters, theoretically
- Suddenly available at home, where they can no longer hurt you with a ticket-price decision

It tracks the theatrical date first, then checks whether something has reached subscription streaming or rent/buy availability. No more finding out *The One You Wanted To See* has been on Peacock for five months because the algorithm decided you needed another true-crime documentary instead.

---

## What's in the dark

Every live title gets:

- **The real poster and backdrop.** No generic red-and-black skull nonsense unless the actual marketing department chose it.
- **Theatrical timing.** Upcoming and recently released U.S. horror movies, kept in chronological order.
- **Where to watch.** Subscription streaming is called out separately from rent or buy, because those are spiritually different situations.
- **Official trailers.** A direct link to the best available YouTube trailer, for when you need to make sure it is exactly the kind of terrible little nightmare you are in the mood for.
- **A watchlist.** Mark something as watched so Future You cannot convincingly claim she has never heard of it.

The hero card follows the next upcoming release, because somebody has to stand at the front of the line.

---

## Data sources

The app uses [TMDb](https://www.themoviedb.org/) for movie metadata, dates, artwork, and trailers, plus [Watchmode](https://api.watchmode.com/) for U.S. streaming, rental, and purchase availability.

Availability data is cached for six hours. This is a horror tracker, not an emergency broadcast system.

---

## Run it locally

You will need Node.js 22+ and API keys from TMDb and Watchmode.

```bash
npm install
npm run dev
```

Create a local environment file with:

```bash
TMDB_API_KEY=your_tmdb_key
WATCHMODE_API_KEY=your_watchmode_key
```

Do not commit that file. The monster under the bed is always the exposed API key.

---

## Dev

Built with React, TypeScript, Vinext, and Tailwind CSS.

```bash
npm run build
```

The build validates the deployable worker artifact. The codebase also includes the starter's D1 scaffolding, should the watchlist become durable instead of merely trusting the browser to remember what you did last October.
