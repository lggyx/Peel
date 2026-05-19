# Peel MeDo Web Demo PRD

## Product Summary

Peel is an AI video understanding assistant. A user provides a public MP4 video URL, and Peel generates a structured interpretation of the video: plot summary, characters or visible entities, timeline, relationship map, storyline phases, visual mood, and follow-up AI Q&A grounded in the generated analysis.

For the MeDo hackathon, Peel should be presented as a public web demo built with MeDo, backed by the existing `reelmind-proxy` API service.

## Hackathon Goal

Create a polished, publicly accessible MeDo web app that lets judges test Peel without installing Android Studio, running local servers, or configuring API keys.

## Target Users

- Viewers who want to quickly understand short videos.
- Students and educators who want a structured breakdown of visual content.
- Creators who want summaries, story beats, and audience-facing notes from a video.
- Hackathon judges who need a fast, reliable demo path.

## Core User Flow

1. User opens the MeDo web app.
2. User pastes a public MP4 URL or uses the included demo URL.
3. App calls `POST /analyze`.
4. App displays:
   - video preview,
   - short summary,
   - characters or detected subjects,
   - timeline events,
   - storyline phases,
   - visual mood/theme.
5. User asks follow-up questions.
6. App calls `POST /chat` with the analysis as context.
7. App displays concise, grounded answers.

## Demo Video URL

Use this stable sample video for judging and testing:

```text
https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4
```

## Required MeDo Web Pages

### Home

Purpose: explain Peel in one screen and start the demo.

Content:
- Product name: Peel.
- Tagline: "Understand any short video as a timeline, story, and conversation."
- Primary action: "Try Demo".
- Demo URL quick-fill.

### Analyze Demo

Purpose: let the user submit a video URL.

Requirements:
- URL input.
- "Analyze Video" button.
- Loading state.
- Clear error state.
- Reminder that public MP4 URLs work best.

### Results

Purpose: show the structured analysis.

Sections:
- Video preview.
- Plot summary.
- Characters / visible subjects.
- Timeline.
- Storyline phases.
- Mood and visual theme.

### Ask AI

Purpose: allow natural-language follow-up questions.

Requirements:
- Chat input.
- Suggested questions.
- Message history.
- API call to `POST /chat`.
- The system prompt should include the current analysis context.

### Built with MeDo

Purpose: make MeDo participation explicit for judges.

Content:
- MeDo created the public web demo and interaction flow.
- Existing Peel backend provides video intelligence APIs.
- MeDo app integrates external APIs through the deployed backend.
- This hackathon update makes a previous Android prototype accessible as a public, browser-based demo.

## MeDo Scope

MeDo should generate:
- Public web app UX.
- Page structure.
- API-driven analyze and chat workflows.
- Result visualization components.
- Submission-friendly "Built with MeDo" explanation.

MeDo should not:
- Store API keys in frontend code.
- Rebuild the Android app.
- Depend on local IP addresses.
- Require judges to run local commands.

## Backend Scope

The existing `reelmind-proxy` service remains responsible for:
- Protecting the StepFun API key.
- Calling StepFun for video analysis and chat.
- Normalizing AI analysis JSON.
- Returning browser-friendly JSON to the MeDo app.

## Non-Goals for This Phase

- iOS app packaging.
- User accounts.
- Persistent cloud database.
- Uploading private/local video files.
- Long-form video processing.

## Success Criteria

- The MeDo app is publicly deployed.
- A judge can open the app and run the demo URL without setup.
- `POST /analyze` returns structured results.
- `POST /chat` returns a grounded answer.
- The Devpost description clearly explains how MeDo and APIs were used.

## Rule Alignment

The hackathon rules require a working software application using MeDo, a public deployed MeDo application URL, a description of how MeDo was used, and an explanation of plugin/API extension. Peel's MeDo web demo should emphasize those points.

References:
- Devpost rules: https://medo.devpost.com/rules
- MeDo Create Site docs: https://intl.cloud.baidu.com/en/doc/MIAODA/s/create-site-en
- MeDo Custom Skills docs: https://intl.cloud.baidu.com/en/doc/MIAODA/s/custom-plugin-en

