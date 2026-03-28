# Biaya MBG

Interactive website visualizing Indonesia's Makan Bergizi Gratis (MBG) program budget in real-time.

**Live:** [mbg.afoxyze.dev](https://mbg.afoxyze.dev)

## Features

- **Live Ticker** — real-time budget counter at 60fps, calculated from program start date
- **Burn Rate** — spend speed per second, minute, hour, day with human-scale context
- **Calculator** — convert any rupiah amount to "/hari MBG" or compare your salary
- **Comparisons** — see how MBG budget stacks against infrastructure projects and daily items
- **Share** — generate shareable images with your calculation results
- **Dark/Light Mode** — warm themed with system preference detection

## Tech Stack

- React 19 + TypeScript (strict)
- Vite
- Tailwind CSS v4
- Framer Motion

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Data Sources

All budget figures, comparison prices, and calculations are sourced from official government documents and public data. See the Methodology section on the website for full attribution.

## License

MIT
