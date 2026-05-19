# Peel Pre-Submission Polish

Use this file after the MeDo app is already generated and the backend is deployed. The goal is not to add large new features. The goal is to make the public demo easy for judges to understand, test, and trust.

## Public URLs

```text
MeDo app: https://app-bqt8i7t9s0sh.appmedo.com
Backend API: https://peel-proxy.onrender.com
Stable demo video: https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4
```

## MeDo Follow-Up Prompt

Paste this into MeDo after the first generated app is working:

```text
Polish the existing Peel app for hackathon submission readiness.

Keep the current UI direction and backend integrations. Do not rebuild the app from scratch.

Critical requirements:
- Keep using https://peel-proxy.onrender.com for every backend API call.
- Keep POST /analyze and POST /chat wired to the real backend.
- Store the latest /analyze response in app state and use it as context for all /chat requests.
- Do not fake analysis results. Use the real backend response. If the API fails, show a clear error state.
- Do not expose API keys in frontend code.
- Do not use localhost, 172.31.24.201, 10.0.2.2, or any other local URL.

Submission polish:
- Update the page title to: Peel - AI Video Understanding Assistant
- Update the meta description to: Peel transforms public MP4 videos into summaries, timelines, storylines, visual mood, and grounded AI Q&A.
- Remove any prompt fragments, uploaded file names, internal instructions, or development notes from visible copy and metadata.
- Make the first screen clearly explain what Peel does in one sentence.
- Keep the demo immediately usable with a one-click sample video option.
- Add or keep a short Built with MeDo section explaining that MeDo was used to create the public web experience, interaction flow, and API-driven judging demo.
- Mention that the original Peel project existed as an Android prototype and the hackathon update turned it into a public browser demo.

Judge-friendly failure handling:
- If the backend is slow, show a loading state that says the public backend may be waking up.
- If analysis fails, show: The backend may be waking up or temporarily unavailable. Please retry in a few seconds.
- If chat fails, show: AI chat could not connect to the backend. Please retry after the analysis is loaded.

Do not add login, accounts, local file upload, database history, payment, or admin features.
```

## Must-Pass QA

- The app opens publicly without login.
- The sample video button fills or starts the stable demo video URL.
- Analyze returns real summary, subjects, timeline, storyline, and visual mood.
- The video preview uses the submitted MP4 URL.
- AI chat answers using the latest analysis instead of generic knowledge.
- Refreshing the page does not reveal local development URLs.
- Failure states are readable and do not expose stack traces or secrets.
- The browser tab title and metadata say Peel, not a generic generator title.

## Nice-To-Have Only

- Backend health check before first analysis.
- Small note that Render free hosting may need a short wake-up period.
- A compact "How it works" strip: MP4 URL -> AI analysis -> timeline -> grounded chat.

Avoid bigger features before submission unless the core flow is already tested again after the change.
