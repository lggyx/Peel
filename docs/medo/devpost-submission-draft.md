# Devpost Submission Draft

## Project Name

Peel

## Tagline

Understand any short video as a timeline, story, and conversation.

## Track

Learning & Education, Lifestyle & Game, or Surprise Us.

Recommended: **Learning & Education** if the submission emphasizes video comprehension and learning notes. Use **Surprise Us** if the final demo feels more like a creative AI media tool.

## Inspiration

Short videos are easy to watch but hard to review, search, or discuss. Peel turns a video into structured knowledge: summary, timeline, storyline, visible subjects, mood, and follow-up Q&A. We built Peel to make video content easier to understand, teach from, and talk about.

## What It Does

Peel lets users paste a public MP4 URL and receive an AI-generated interpretation of the video. It extracts the main visual subjects, summarizes what happens, creates a timeline, organizes the content into storyline phases, and provides an AI chat panel where users can ask questions grounded in the analysis.

## How We Built It

The original Peel prototype was a React, TypeScript, Capacitor Android app with an Express proxy backend. During the hackathon update, we stabilized the video analysis and chat flow, added Android network resilience, clarified failure states, and prepared a public MeDo web app experience.

The MeDo app serves as the public browser-based demo. It calls the deployed Peel backend API for video analysis and Q&A. The backend protects the StepFun API key and normalizes AI responses into a clean JSON shape for the frontend.

## How We Used MeDo

We used MeDo to create the public web demo, structure the user journey, and build the API-driven interface around Peel's existing video intelligence backend. MeDo helped convert the Android prototype into a judge-friendly browser experience with pages for video analysis, results, AI Q&A, and a "Built with MeDo" explanation.

## How We Used APIs or Plugins

The MeDo web app integrates with the Peel backend API:

- `POST /analyze` analyzes a public video URL and returns structured video understanding data.
- `POST /chat` answers follow-up questions using the generated analysis as context.
- `GET /health` verifies backend availability.

The backend then connects to StepFun for AI video analysis and chat completion. API keys are stored only on the backend and are not exposed in the MeDo frontend.

## Significant Hackathon Update

Peel existed before this hackathon as an Android prototype. During this hackathon period, we significantly updated it by:

- hardening video analysis and download behavior,
- improving error handling and JSON normalization,
- fixing Android emulator and local proxy networking issues,
- stabilizing AI chat after analysis,
- adding test coverage for analysis normalization,
- preparing a public MeDo web demo layer that can be opened by judges without Android Studio or local setup.

## Challenges

The biggest challenge was converting a local Android prototype into something judges can test publicly. Local proxy URLs work for development but fail for public web demos. We had to separate product logic from deployment concerns, protect API keys on the backend, and design a MeDo experience that could call the backend safely.

## Accomplishments

- A working end-to-end flow: video URL to analysis to timeline to AI Q&A.
- A public-demo architecture that keeps secrets out of the frontend.
- A clearer product narrative around video comprehension and grounded Q&A.
- A MeDo-ready material pack for generating the public web app.

## What We Learned

We learned that hackathon readiness is not just about features. It also requires deployment, clear testing instructions, public accessibility, and a strong story about how the required platform contributes to the final product.

## What's Next

- Deploy the backend to a public HTTPS service.
- Generate and publish the MeDo web app.
- Add richer export formats such as study notes, share cards, and creator briefs.
- Explore iOS packaging after the web demo is stable.

## Testing Instructions

Open the public MeDo app URL.

Use this demo video URL:

```text
https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4
```

Then:

1. Click Analyze Video.
2. Review the summary, visible subjects, timeline, and storyline.
3. Ask a question such as "What is the story of this video?"
4. Confirm the AI answer is grounded in the displayed analysis.

No local setup or API key is required.

## Demo Video Script

Target length: under 3 minutes.

1. 0:00-0:20 - Introduce Peel and the problem.
2. 0:20-0:50 - Paste the demo video URL and run analysis.
3. 0:50-1:30 - Show summary, timeline, and storyline.
4. 1:30-2:10 - Ask AI follow-up questions.
5. 2:10-2:40 - Explain MeDo's role and API integration.
6. 2:40-3:00 - Close with use cases and next steps.

