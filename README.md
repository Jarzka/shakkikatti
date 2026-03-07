# ShakkiKatti

A browser-based chess game originally ported from an old Java implementation (2014), now rewritten in **TypeScript**.

Live demo: https://shakki.pikseli.org/

## Requirements

- [Node.js](https://nodejs.org/) 18 or later (includes `npm`)

## Install dependencies

```bash
npm install
```

## Development

Start the Vite dev server with hot reload:

```bash
npm run dev
```

Then open the URL shown in the terminal (typically `http://localhost:5173`) in your browser.

## Build

Compile TypeScript and produce an optimised production bundle in `dist/`:

```bash
npm run build
```

## Preview the production build

Serve the `dist/` folder locally to verify the production build before deployment:

```bash
npm run preview
```

## Testing

Run the full test suite once and exit:

```bash
npm test
```

Run tests in watch mode (re-runs on file changes):

```bash
npm run test:watch
```
