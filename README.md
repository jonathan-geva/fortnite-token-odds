# Fortnite Pirate Token Odds

[Play on Cloudflare Pages](https://fortnite-token-odds.pages.dev/)

A fan-made visualization of the Pirate Shop Access drop from Fortnite’s 2026 Treasure Hunters season. Explore 137,500 equally likely base-rate outcomes, simulate a hunt, replay an original reveal, watch a real in-game drop and calculate the odds for your own chest count.

## Run locally

Serve `public/` over HTTP. Use a static server that serves `.mjs` as JavaScript.

```sh
npx serve public
node --test
```

Cloudflare Pages builds the static `public` directory from this GitHub repository. No build command, environment variables or backend are required.

## Sources and credits

- [Epic Games Support](https://www.epicgames.com/help/c-34254770/c-33726977/what-are-the-drop-rates-of-treasure-in-chests-in-fortnite-battle-royale-s-pirate-treasure-event-a14361627) gives the 1-in-137,500 normal rate and 1.5× Treasure Hour multiplier. [Fortnite Status](https://x.com/FortniteStatus/status/2119202610322227327) cites a specific 2× window. The calculator assumes independent eligible chest rolls at a fixed rate.
- [Lachlan’s gameplay](https://www.youtube.com/watch?v=yLUouHjJyLQ&t=442s) is embedded from YouTube on demand. The simulator’s artwork and synthesized audio are original to the site.
- Barlow Condensed, Space Grotesk and IBM Plex Mono are distributed under their included font licenses in `public/licenses/`.

Portions of the materials used are trademarks and/or copyrighted works of Epic Games, Inc. All rights reserved by Epic. This material is not official and is not endorsed by Epic.
