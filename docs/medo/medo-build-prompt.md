# MeDo Build Prompt

Copy this prompt into MeDo after replacing `<PUBLIC_PROXY_BASE_URL>` with the deployed backend URL.

```text
Create a polished public web app called Peel.

Peel is an AI video understanding assistant. Users paste a public MP4 video URL, then the app calls our backend API to analyze the video, generate a plot summary, identify characters or visible subjects, create a timeline/storyline, infer the visual mood, and allow users to ask follow-up questions about the video.

This is a MeDo hackathon submission app. The app must feel like a real public demo that judges can use without local setup.

Backend API base URL:
<PUBLIC_PROXY_BASE_URL>

Stable demo video URL:
https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4

Build these pages:

1. Home
- Product name: Peel.
- Tagline: Understand any short video as a timeline, story, and conversation.
- Primary button: Try Demo.
- Secondary note: Works best with public MP4 links.
- Include a quick demo button that pre-fills the sample video URL.

2. Analyze Demo
- Input for a public MP4 video URL.
- Analyze Video button.
- Loading state while calling POST /analyze.
- Clear error state if the backend fails.
- After success, navigate or scroll to Results.

3. Results
- Video preview using the submitted video URL.
- Summary section.
- Characters or visible subjects section.
- Timeline section with time/event cards.
- Storyline section with phase, summary, highlights, and mood.
- Visual mood/theme section using the returned theme fields.

4. Ask AI
- Chat interface grounded in the latest analysis.
- Suggested questions such as:
  - What is the story of this video?
  - What are the key visual moments?
  - What mood does the video communicate?
- On send, call POST /chat with:
  - a system message containing the current analysis JSON and instruction to answer only from the analysis,
  - the user's question.
- Render assistant answers clearly.

5. Built with MeDo
- Explain that MeDo was used to create the public web experience, interaction flow, and API-driven demo.
- Explain that the existing Peel backend provides video intelligence APIs.
- Explain that the hackathon update turns a previous Android prototype into a public browser demo.

API details:

POST /analyze
Request:
{
  "videoUrl": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
}

Response:
{
  "analysis": {
    "characters": [{ "name": "...", "description": "..." }],
    "plotSummary": "...",
    "timeline": [{ "time": "00:00", "event": "..." }],
    "relationships": [{ "from": "...", "to": "...", "relation": "..." }],
    "storyline": [{ "phase": "...", "summary": "...", "highlights": ["..."], "mood": "..." }],
    "theme": {
      "primary": "#RRGGBB",
      "secondary": "#RRGGBB",
      "accent": "#RRGGBB",
      "surface": "#RRGGBB",
      "text": "#RRGGBB",
      "textMuted": "#RRGGBB",
      "bubbleUser": "#RRGGBB",
      "bubbleAi": "#RRGGBB",
      "tagBg": "#RRGGBB",
      "tagText": "#RRGGBB",
      "mood": "..."
    }
  }
}

POST /chat
Request:
{
  "messages": [
    { "role": "system", "content": "You are a senior video interpretation assistant. Answer only from this analysis: <analysis-json>" },
    { "role": "user", "content": "<question>" }
  ],
  "temperature": 0.7,
  "max_tokens": 1024
}

Response:
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "..."
      }
    }
  ]
}

Design direction:
- Cinematic, dark, premium AI-video interface.
- Mobile-first, but responsive for desktop judges.
- Avoid a marketing-only landing page; make the demo usable immediately.
- Use timeline cards, video preview, chat bubbles, and concise labels.
- Keep the first screen focused on the actual demo.

Important constraints:
- Do not expose any API keys in frontend code.
- Do not require users to install anything.
- Do not use local URLs such as localhost, 172.31.24.201, or 10.0.2.2.
- Use <PUBLIC_PROXY_BASE_URL> for all backend calls.
- Add readable failure messages if the API fails.

Submission narrative to include:
Peel existed as an Android prototype before the hackathon. During the hackathon, it was significantly upgraded and MeDo was used to build the public web demo and API-driven judging experience. The result is a shareable product demo where judges can analyze a video and ask follow-up questions without local setup.
```

