# Public Backend Deployment Checklist

The MeDo web app needs a public HTTPS backend URL. Local addresses are not suitable for judging.

## Recommended Platform

Start with Render or Railway because `reelmind-proxy` is a standard Node/Express service.

This repository now includes a root-level `render.yaml` Blueprint for Render. If you use Render Blueprints, Render can read the service configuration from that file and prompt you for the secret `STEPFUN_API_KEY`.

## Repository Settings

Use the existing GitHub repository and branch:

```text
Branch: dev-stability-optimization
Root Directory: reelmind-proxy
```

## Build and Start Commands

```text
Build Command: npm install
Start Command: npm start
```

## Required Environment Variables

Do not put these in GitHub or MeDo frontend code.

```text
STEPFUN_API_KEY=<set in hosting dashboard>
STEPFUN_MODEL=step-3.6
STEPFUN_URL=https://api.stepfun.com/v1/chat/completions
CORS_ORIGIN=*
MAX_DOWNLOAD_BYTES=134217728
PUBLIC_BASE_URL=<deployed backend URL>
```

`PUBLIC_BASE_URL` should be updated after the hosting platform gives you the public URL.

## Health Check

After deployment, test:

```bash
curl https://<deployed-backend>/health
```

Expected:

```json
{
  "status": "ok",
  "timestamp": "..."
}
```

## Analyze Test

```bash
curl -sS -m 180 -X POST https://<deployed-backend>/analyze \
  -H 'Content-Type: application/json' \
  --data '{"videoUrl":"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"}'
```

Expected:

```text
JSON with analysis.plotSummary, analysis.timeline, and analysis.storyline
```

## Chat Test

```bash
curl -sS -m 90 -X POST https://<deployed-backend>/chat \
  -H 'Content-Type: application/json' \
  --data '{"messages":[{"role":"system","content":"You are a video assistant."},{"role":"user","content":"Reply OK."}],"max_tokens":32}'
```

Expected:

```text
Chat completion JSON with choices[0].message.content
```

## MeDo Update

After deployment succeeds, replace every `<PUBLIC_PROXY_BASE_URL>` in:

- `api-spec.md`
- `medo-build-prompt.md`
- MeDo app configuration

## Common Failure Cases

- `STEPFUN_API_KEY` missing: backend exits on startup.
- Wrong root directory: platform cannot find `package.json`.
- Local URL used in MeDo: judges cannot access backend.
- HTTP-only backend URL: browser security may block calls from HTTPS MeDo app.
- Long cold start: first analyze request may take longer on free hosting tiers.
