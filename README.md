# Midnight Queue

You are going to remember a horror movie you meant to see in theaters about three weeks after it leaves them.

Six months later you'll find out it quietly landed on streaming, watch the trailer, decide you were always going to see this, and lose track of it again.

This is for that. Your memory did its best.

**[Enter the queue if you're ready →](https://midnight-queue.kayofthedead.chatgpt.site/)**

---

## The premise

A small, cold calendar for horror movies that are:

- Coming to U.S. theaters
- Still in theaters, theoretically
- Suddenly available at home, where they can no longer hurt you with a ticket-price decision

It tracks the theatrical date first, then checks whether something has reached subscription streaming or rent/buy. No more finding out *The One You Wanted To See* has been on Peacock for five months because the algorithm decided you needed another true-crime documentary instead.

---

## What's in the dark

Every live title gets:

- **The real poster and backdrop.** Whatever the marketing department actually made, not generic red-and-black skull art.
- **Theatrical timing.** Upcoming and recent U.S. horror, in chronological order. The next release stands at the front of the line as the hero card.
- **Where to watch.** Subscription streaming is called out separately from rent or buy, because those are spiritually different situations.
- **Official trailers.** A link to the best YouTube trailer, and a plain YouTube search as a fallback when nobody has posted one yet.
- **A watched list.** Mark something watched so Future You can't pretend she never saw it. It lives in your browser and survives a reload.

---

## Data sources

Movie metadata, dates, artwork, and trailers come from [TMDb](https://www.themoviedb.org/). U.S. streaming, rental, and purchase availability comes from [Watchmode](https://api.watchmode.com/).

Availability is cached for six hours. This is a horror tracker, not an emergency broadcast system.

---

## Run it locally

You'll need Node.js 22+ and API keys from TMDb and Watchmode.

```bash
npm install
npm run dev
```

Put your keys in a local env file:

```bash
TMDB_API_KEY=your_tmdb_key
WATCHMODE_API_KEY=your_watchmode_key
```

Don't commit it. The monster under the bed is always the exposed API key.

---

## Dev

React, TypeScript, Vinext, and Tailwind, built to a Cloudflare Worker.

```bash
npm run build
```

The build validates the deployable worker artifact. The watched list lives in `localStorage` for now; the starter's D1 scaffolding is still in the tree if you ever want it saved server-side instead of trusting one browser to remember what you did last October.
