# Running the project (quick guide)

This repo contains the frontend app in `autosocial-ai`. These instructions assume you're in the project's devcontainer or a Linux environment with `node` and `npm` available.

Basic steps

- **Install dependencies:**

```bash
cd /workspaces/auto-social/autosocial-ai
npm install
```

- **Start development server (detached):**

```bash
cd /workspaces/auto-social/autosocial-ai
./scripts/start-dev.sh
```

- **Check the app:** Open `http://localhost:3000/` in your browser or run:

```bash
curl -I http://localhost:3000/
```

- **Tail the dev log:**

```bash
tail -f /tmp/autosocial-vite.log
```

- **Stop the dev server:**

```bash
cd /workspaces/auto-social/autosocial-ai
./scripts/stop-dev.sh
```

Production build

```bash
cd /workspaces/auto-social/autosocial-ai
npm run build
npm run preview
```

Notes

- The start script runs `npm run dev` with `nohup` and stores the PID in `.vite.pid` in the `autosocial-ai` folder.
- The log file is written to `/tmp/autosocial-vite.log`.
- If you prefer VS Code tasks or a different port, update the scripts accordingly.

If you want, I can also add these scripts to `package.json` scripts and commit that change.
