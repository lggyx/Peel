# Project: Peel

> TaskMaster-managed React/Capacitor mobile video intelligence app.

## Project Overview

Peel is an Android-first intelligent video analysis app. The frontend lives in `reelmind-app` and uses React 18, TypeScript, Vite, TailwindCSS, Capacitor 8, SQLite, Filesystem, ScreenOrientation, and StatusBar. The backend proxy lives in `reelmind-proxy` and uses Express to protect StepFun API credentials while handling `/analyze`, `/chat`, `/download`, and `/stream/:fileName`.

Key documents:

- PRD: `.taskmaster/docs/prd.md`
- Technical spec: `docs/technical-spec.md`
- AI theme/storyline plan: `plans/ai-theme-storyline-plan.md`
- TaskMaster config: `.taskmaster/config.json`

## Development Workflow

Use the PRD as the source of truth. Prefer small, testable changes that preserve the current app shape:

1. Read the relevant PRD requirement and acceptance criteria.
2. Inspect the existing implementation before editing.
3. Add or update focused tests where the task affects parsing, proxy contracts, persistence, or player lifecycle.
4. Implement the smallest change that satisfies the acceptance criteria.
5. Run the relevant build/test command.
6. Update TaskMaster task status only after verification.

## TaskMaster

This repo was initialized with TaskMaster CLI. The installed binary is `task-master`; a local compatibility wrapper exists at `.codex-bin/taskmaster` for scripts that expect `taskmaster`.

Useful commands:

```bash
task-master list
task-master show <task-id>
task-master next
task-master set-status <id> done
task-master parse-prd --input=.taskmaster/docs/prd.md --num-tasks=15
task-master expand --all
```

Current model configuration uses the Codex CLI provider:

```bash
task-master models --set-main gpt-5.2-codex --codex-cli
task-master models --set-research gpt-5.2-codex --codex-cli
task-master models --set-fallback gpt-5.2-codex --codex-cli
```

If Codex CLI parsing hangs in the local environment, configure API-key providers in `.env` using `.env.example`, then rerun `parse-prd`.

## Common Commands

Frontend:

```bash
cd reelmind-app
npm install
npm run build
npm run dev
npx cap sync android
```

Proxy:

```bash
cd reelmind-proxy
npm install
npm start
```

PRD validation:

```bash
python3 /Users/superpanda/.codex/skills/prd-taskmaster/script.py validate-prd --input .taskmaster/docs/prd.md
```

Tracking scripts:

```bash
python3 .taskmaster/scripts/track-time.py start <task_id>
python3 .taskmaster/scripts/track-time.py complete <task_id>
python3 .taskmaster/scripts/execution-state.py start <task_id>
python3 .taskmaster/scripts/execution-state.py complete <task_id>
```

## Engineering Notes

- Do not put StepFun API keys in frontend code.
- Replace hardcoded API endpoints with environment configuration before release work.
- Preserve compatibility for old `analysis_json` rows missing `storyline` or `theme`.
- Keep Android WebView behavior in mind when changing video playback, file paths, orientation, or status bar handling.
- Treat proxy response contracts and frontend parser defaults as a single product boundary.

