# Android QA Checklist

Use this checklist for every Android release-candidate smoke test.

## Environment

- Node.js is installed and matches the project requirement in `README.md`.
- `reelmind-proxy/.env` contains a valid `STEPFUN_API_KEY`.
- `reelmind-proxy/.env` sets `PUBLIC_BASE_URL` to a URL the Android device can reach.
- `reelmind-app/.env` sets `VITE_API_BASE_URL` to the same reachable proxy base URL.
- The Android device/emulator and proxy host are on the same network when using a LAN address.
- Proxy health check returns JSON from the Android-reachable address:

```bash
curl http://<proxy-host>:3000/health
```

## Build

```bash
cd reelmind-proxy
npm install
npm test
npm start
```

```bash
cd reelmind-app
npm install
npm run build
npx cap sync android
npm run android
```

## Core Flow

- App opens to the video library.
- Empty library state renders without database errors.
- Add-video sheet opens and closes.
- Invalid URL shows a validation error and does not call analysis.
- Valid short MP4 URL starts analysis and prevents duplicate submission while loading.
- If analysis succeeds and download fails, the app stores the original URL and remains playable when the source allows playback.
- If analysis fails after a local download, the local `video_<id>.mp4` file is cleaned up.
- Completed video appears in the library with title, character count, storyline count, or theme mood where available.
- Opening a video locks landscape orientation.
- Video loads without triggering native fullscreen unexpectedly.
- Tapping video toggles play/pause using the custom overlay.
- Leaving player stops playback and returns orientation/status bar behavior to normal.
- Missing/deleted video route shows an error and a return button instead of an endless spinner.
- Storyline tab renders phases when present.
- Storyline tab shows a clear empty state when no storyline exists.
- AI chat is disabled or explanatory when analysis is empty.
- AI chat sends grounded context and persists user and assistant messages.
- Deleting a video removes the video row, chat messages, and downloaded local file when applicable.
- Restarting the app preserves remaining library entries.

## Failure Cases

- Proxy unavailable: add-video and chat show recoverable errors.
- StepFun API error: analysis returns a clear user-visible error.
- Source URL returns non-video content: proxy rejects download with `415`.
- Source video exceeds `MAX_DOWNLOAD_BYTES`: proxy rejects or aborts download.
- Media playback error shows a readable message and retry button.

## Notes

- Do not put StepFun keys in `reelmind-app`.
- Do not use `localhost` for `VITE_API_BASE_URL` on a physical Android device unless the proxy also runs on that device.
- Use the host machine LAN IP, emulator alias, or a tunnel URL depending on the test setup.
