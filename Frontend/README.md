# Obula

Turn your talking video into a polished clip with AI B-roll and word-level captions.

## Setup

1. **Copy environment variables** (optional)
   ```bash
   cp .env.example .env
   ```

2. **Install and run**
   ```bash
   npm install
   npm run dev
   ```

   **Resolving warnings:**
   - **Node.js version**: Use Node 20 or 22 (see `engines` in package.json). With nvm: `nvm use`
   - **`Unknown env config devdir`**: Run `npm run dev:clean` or `./scripts/dev.sh` to start the dev server with a clean env

## Routes

- `/` – Landing (public)
- `/contact` – Contact form
- `/upload` – Upload (protected, requires auth when enabled)
