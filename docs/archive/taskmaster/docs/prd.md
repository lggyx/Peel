# PRD: Peel Production-Ready Mobile Video Intelligence v1

**Author:** Codex
**Date:** 2026-05-18
**Status:** Draft
**Version:** 1.0
**Taskmaster Optimized:** Yes

---

## Executive Summary

Peel is an Android-first intelligent video analysis app that lets users add a video URL, receive StepFun-powered structured analysis, watch the video in an immersive player, browse an AI-generated storyline, and ask context-aware questions about the content. The current codebase already includes the core React/Capacitor app, SQLite persistence, dynamic video themes, a storyline panel, chat, and an Express proxy; this PRD focuses on making that v1 flow reliable, configurable, testable, and ready for real mobile usage.

Expected impact: users can analyze and revisit short videos without fragile demo-only assumptions, while developers get a task-driven path to harden API configuration, local storage, video playback, AI response validation, Android packaging, and regression testing.

---

## Problem Statement

### Current Situation

The repository contains a functional prototype split across:

- `reelmind-app`: React 18, TypeScript, Vite, TailwindCSS, Capacitor 8, SQLite, Android-oriented video player.
- `reelmind-proxy`: Express proxy for StepFun chat completions, video analysis, and video download/streaming.
- `docs/technical-spec.md` and `plans/ai-theme-storyline-plan.md`: strong architecture and implementation notes.

However, the app still has production-readiness gaps:

- API base URL is hardcoded to an ngrok endpoint in frontend pages.
- StepFun API key handling exists in the proxy, but runtime setup and failure handling need a documented, validated path.
- Video download currently generates separate UUIDs for analysis and download, which can create mismatched local file names.
- Local SQLite web/native initialization needs clearer fallback behavior and test coverage.
- The video analysis schema is partially normalized, but invalid or partial AI output should be consistently handled in both proxy and app.
- Android build, permissions, environment configuration, and verification steps are not yet captured as repeatable tasks.
- There is no automated test baseline for core parsing, proxy normalization, database flow, or UI regressions.

### User Impact

- **Who is affected:** Mobile users who want to analyze and revisit short videos, and developers maintaining the Peel prototype.
- **How they are affected:** Users may hit broken analysis, non-playable videos, unavailable proxy URLs, inconsistent story/theme rendering, or lost local state.
- **Severity:** High for a production v1 because the core experience depends on external AI, video networking, local storage, and native WebView behavior.

### Business Impact

- **Cost of problem:** Demo fragility blocks real user trials and increases debugging time for every new device or network.
- **Opportunity cost:** Without a reliable v1, Peel cannot validate the product promise of "watch, understand, and ask" for mobile videos.
- **Strategic importance:** A stable v1 creates the foundation for richer video understanding, offline libraries, longer-form media, and personalized AI viewing workflows.

### Why Solve This Now?

The codebase already has the core vertical slice implemented. This is the right moment to harden configuration, data contracts, mobile playback, and tests before adding larger features such as accounts, cloud sync, advanced RAG, or app-store release work.

---

## Goals & Success Metrics

### Goal 1: Reliable Video Analysis Flow

- **Description:** Users can submit a valid MP4 URL and receive normalized analysis with characters, plot summary, timeline, relationships, storyline, and theme.
- **Metric:** Successful `/analyze` completion rate for valid test videos.
- **Baseline:** Prototype behavior, not yet measured.
- **Target:** >= 95% success across a curated set of 10 valid short videos.
- **Timeframe:** Before v1 release candidate.
- **Measurement Method:** Proxy integration tests, manual Android test checklist, and logged analysis outcomes.

### Goal 2: Stable Mobile Playback and Local Library

- **Description:** Analyzed videos persist in SQLite, open from the library, and play in the landscape player using local or remote URLs.
- **Metric:** Library-to-player success rate.
- **Baseline:** Prototype behavior, no repeatable verification.
- **Target:** 100% pass on demo videos and >= 90% pass on valid remote MP4 URLs under normal network conditions.
- **Timeframe:** Before v1 release candidate.
- **Measurement Method:** Manual Android smoke tests and automated component/unit tests where possible.

### Goal 3: Configurable and Reproducible Developer Setup

- **Description:** Developers can configure frontend API base URL, proxy API keys, and Android build steps without editing source constants.
- **Metric:** Fresh setup time from clone to local analysis flow.
- **Baseline:** Manual source edits and implicit ngrok dependency.
- **Target:** <= 30 minutes for a developer with valid StepFun credentials.
- **Timeframe:** Before handoff.
- **Measurement Method:** README checklist and clean-machine setup verification.

### Goal 4: Regression Safety for Core Contracts

- **Description:** Schema parsing, theme defaults, proxy JSON extraction, and core UI states are covered by automated tests.
- **Metric:** Test coverage for critical utility and proxy contract code.
- **Baseline:** No visible test scripts in `package.json`.
- **Target:** Unit tests for `parseAnalysis`, theme defaults, proxy `extractJSON` and `normalizeAnalysis`; build passes for app and proxy.
- **Timeframe:** Before v1 release candidate.
- **Measurement Method:** `npm run build`, `npm test` or equivalent scripts added by tasks.

---

## User Stories

### Story 1: Add and Analyze a Video

**As a** mobile video viewer,
**I want to** add a short video URL and have Peel analyze its content,
**So that I can** understand the plot, characters, relationships, storyline, and mood without manually scrubbing through the whole video.

**Acceptance Criteria:**

- [ ] User can enter a valid MP4 URL from the Library screen.
- [ ] The app calls the proxy `/analyze` endpoint with the video URL.
- [ ] The proxy validates `videoUrl` format before calling StepFun.
- [ ] StepFun analysis is normalized into the `VideoAnalysis` schema.
- [ ] The app stores the video row with status `completed` and serialized `analysis_json`.
- [ ] User sees meaningful errors for invalid URLs, proxy failures, StepFun failures, and empty analysis results.
- [ ] Loading state prevents duplicate submissions.

**Task Breakdown Hint:**

- Task 1.1: Replace hardcoded API base with environment-based configuration.
- Task 1.2: Fix single-ID handling for video analysis and download.
- Task 1.3: Harden add-video error states.
- Task 1.4: Add tests for analysis parsing and URL validation.

**Dependencies:** Existing `Library.tsx`, `reelmind-proxy/index.js`, and SQLite setup.

---

### Story 2: Watch and Interact With an Analyzed Video

**As a** mobile video viewer,
**I want to** open an analyzed video in a landscape player with storyline and AI chat,
**So that I can** watch and ask questions in context.

**Acceptance Criteria:**

- [ ] Player locks landscape orientation and hides the status bar on entry.
- [ ] Player restores orientation and status bar on exit.
- [ ] Video URL resolution supports `file://`, local relative assets, and remote URLs.
- [ ] Player shows loading, retry, and meaningful media error states.
- [ ] Storyline tab renders 3-5 phases when available.
- [ ] AI chat context includes plot summary, characters, and storyline.
- [ ] Old videos without `storyline` or `theme` render with documented fallback values for every required field.

**Task Breakdown Hint:**

- Task 2.1: Audit and harden `resolveVideoUrl`.
- Task 2.2: Add player state tests or Playwright smoke checks for loading/error/success.
- Task 2.3: Validate orientation/status-bar cleanup on Android.
- Task 2.4: Improve empty storyline and missing analysis UX.

**Dependencies:** Existing `Player.tsx`, `StorylinePanel.tsx`, `useVideoTheme.ts`.

---

### Story 3: Ask Context-Aware Questions

**As a** viewer trying to understand a video,
**I want to** ask questions based on the AI analysis and storyline,
**So that I can** get concise explanations grounded in the current video.

**Acceptance Criteria:**

- [ ] User messages are saved to `chat_messages`.
- [ ] Assistant replies are saved to `chat_messages`.
- [ ] Chat request uses a system prompt containing plot summary, characters, and storyline phases.
- [ ] Network and proxy errors append a clear assistant-side error message.
- [ ] Chat history loads in chronological order for the selected video.
- [ ] The UI prevents sending empty messages and indicates loading while waiting.

**Task Breakdown Hint:**

- Task 3.1: Strengthen chat API response validation.
- Task 3.2: Add chat persistence tests or a DB integration harness.
- Task 3.3: Add retry or recoverable error behavior.

**Dependencies:** Existing `Player.tsx`, `chat_messages` table, `/chat` proxy route.

---

### Story 4: Maintain a Local Video Library

**As a** returning user,
**I want to** see analyzed videos in my local library and delete videos I no longer need,
**So that I can** manage my viewing history without an account.

**Acceptance Criteria:**

- [ ] Library initializes SQLite on native Android and web development targets.
- [ ] Library lists videos ordered by newest first.
- [ ] Each row displays title, source URL/local URI, analysis status, character count, storyline count, and theme mood when present.
- [ ] Deleting a video also deletes associated chat messages.
- [ ] Database initialization errors show a retry path.
- [ ] Local file cleanup behavior is defined for downloaded videos.

**Task Breakdown Hint:**

- Task 4.1: Add file cleanup for downloaded videos or document intentional retention.
- Task 4.2: Add database migration/versioning strategy.
- Task 4.3: Test delete cascade behavior.

**Dependencies:** Existing `Library.tsx`, `initDB.ts`, Capacitor Filesystem.

---

## Functional Requirements

### Must Have (P0)

#### REQ-001: Environment-Based API Configuration

**Description:** The frontend must not hardcode the proxy base URL. It must read from Vite environment variables with a documented development fallback and clear setup instructions.

**Acceptance Criteria:**

- [ ] `Library.tsx` and `Player.tsx` consume a shared API config module.
- [ ] `VITE_API_BASE_URL` controls the proxy URL.
- [ ] Missing config produces a clear developer-facing error in development.
- [ ] README documents local, LAN, and ngrok-style proxy setup.

**Technical Specification:**

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is required for Peel API requests');
}
```

**Task Breakdown:**

- Create shared config module: Small (2h)
- Replace page-level constants: Small (1h)
- Add `.env.example` for app: Small (1h)
- Document setup: Small (1h)

**Dependencies:** None.

---

#### REQ-002: Robust Proxy Runtime Configuration

**Description:** The Express proxy must validate required environment variables at startup and expose predictable errors for StepFun, download, and stream failures.

**Acceptance Criteria:**

- [ ] `STEPFUN_API_KEY` is required and documented.
- [ ] Proxy port and public stream base URL are configurable.
- [ ] `/analyze`, `/chat`, `/download`, and `/stream/:fileName` return structured JSON errors except binary stream success responses.
- [ ] Download directory is configurable or clearly documented.
- [ ] Proxy logs do not expose API keys or full sensitive URLs.

**Technical Specification:**

```javascript
const PORT = process.env.PORT || 3000;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || path.join(__dirname, 'downloads');
```

**Task Breakdown:**

- Add config module for proxy: Small (2h)
- Normalize error responses: Medium (4h)
- Add `.env.example`: Small (1h)
- Add proxy startup checks: Small (2h)

**Dependencies:** Existing `reelmind-proxy/index.js`.

---

#### REQ-003: Stable Video Analysis Schema

**Description:** The proxy and app must agree on the `VideoAnalysis` contract and gracefully handle missing or malformed AI fields.

**Acceptance Criteria:**

- [ ] `characters`, `plotSummary`, `timeline`, and `relationships` always normalize to documented fallback values.
- [ ] `storyline` normalizes to an array; invalid entries are dropped.
- [ ] `theme` normalizes to all required color keys plus `mood`.
- [ ] Invalid hex values fall back to defaults.
- [ ] App `parseAnalysis()` mirrors proxy defaults for old local data.
- [ ] Unit tests cover direct JSON, markdown code block JSON, brace-extracted JSON, invalid JSON, missing theme, and invalid colors.

**Technical Specification:**

```typescript
interface VideoAnalysis {
  characters: { name: string; description: string }[];
  plotSummary: string;
  timeline: { time: string; event: string }[];
  relationships: { from: string; to: string; relation: string }[];
  storyline: StorylineEntry[];
  theme: ThemeVariables;
}
```

**Task Breakdown:**

- Align proxy and frontend defaults: Medium (4h)
- Add shared schema documentation: Small (1h)
- Add proxy unit tests: Medium (4h)
- Add frontend parser tests: Medium (4h)

**Dependencies:** Existing `analysis.ts`, proxy normalization utilities.

---

#### REQ-004: Correct Video Download and Persistence Flow

**Description:** The add-video flow must use one stable video ID per submission for analysis, download, database insert, and future file cleanup.

**Acceptance Criteria:**

- [ ] A single UUID is generated before analysis and download begin.
- [ ] Downloaded filename is derived from the same UUID stored in SQLite.
- [ ] If download fails but analysis succeeds, app stores the original URL and marks the video playable if remote URL is valid.
- [ ] If analysis fails, no completed video row is inserted.
- [ ] If database insert fails after download succeeds, orphan file handling is defined.

**Technical Specification:**

```typescript
const id = generateUUID();
const analyzePromise = analyzeVideo(url);
const downloadPromise = downloadVideoViaProxy(url, id);
```

**Task Breakdown:**

- Refactor `addVideo()` ID flow: Small (2h)
- Add orphan-download cleanup or documented retention: Medium (4h)
- Add tests for partial failure cases: Medium (4h)

**Dependencies:** Existing `Library.tsx`, Capacitor Filesystem.

---

#### REQ-005: Reliable Player Lifecycle

**Description:** The player must handle mobile lifecycle, orientation, media readiness, and cleanup predictably.

**Acceptance Criteria:**

- [ ] `ScreenOrientation.lock({ orientation: 'landscape' })` is attempted on entry.
- [ ] `ScreenOrientation.unlock()` is attempted on exit.
- [ ] `StatusBar.hide()` is attempted on entry.
- [ ] `StatusBar.show()` is attempted on exit.
- [ ] Video resource is paused and released on unmount.
- [ ] Media error codes map to user-visible Chinese messages.
- [ ] Retry button reloads the video element.

**Task Breakdown:**

- Audit lifecycle cleanup: Small (2h)
- Add player smoke test checklist: Small (2h)
- Add Playwright/browser smoke check where feasible: Medium (6h)

**Dependencies:** Existing `Player.tsx`, Capacitor plugins.

---

#### REQ-006: Context-Aware AI Chat

**Description:** AI chat must use a grounded system prompt and persist conversation history per video.

**Acceptance Criteria:**

- [ ] Prompt includes plot summary, character descriptions, storyline phases, highlights, and mood.
- [ ] Empty analysis disables chat with an explanatory state.
- [ ] User and assistant messages persist to SQLite.
- [ ] Chat API response is validated before saving assistant content.
- [ ] Error fallback does not erase user input history.

**Task Breakdown:**

- Strengthen response parsing: Small (2h)
- Improve empty-analysis UX: Small (2h)
- Add chat persistence tests: Medium (4h)

**Dependencies:** Existing `/chat`, `Player.tsx`, SQLite.

---

### Should Have (P1)

#### REQ-007: Automated Test Baseline

**Description:** Add test runners and focused tests for the highest-risk logic.

**Acceptance Criteria:**

- [ ] `reelmind-app` has a test script for TypeScript utilities/hooks where feasible.
- [ ] `reelmind-proxy` has a test script for JSON extraction, normalization, and route validation.
- [ ] CI-ready commands are documented.
- [ ] `npm run build` passes for the app.

**Task Breakdown:**

- Choose Vitest or equivalent: Small (1h)
- Add frontend tests: Medium (6h)
- Add proxy tests: Medium (6h)
- Document commands: Small (1h)

**Dependencies:** Existing package files.

---

#### REQ-008: Android Release Readiness Checklist

**Description:** Create repeatable Android build and manual QA instructions.

**Acceptance Criteria:**

- [ ] README includes `npm run build`, `npx cap sync android`, and Android Studio launch steps.
- [ ] Required Android permissions are documented.
- [ ] LAN/proxy connectivity from device is documented.
- [ ] Manual QA covers add video, local library, playback, storyline, chat, delete, and app restart.

**Task Breakdown:**

- Document build steps: Small (2h)
- Add QA checklist: Small (2h)
- Verify Capacitor config: Small (2h)

**Dependencies:** Existing Capacitor config.

---

#### REQ-009: Demo Mode Preservation

**Description:** Built-in demo videos should remain usable for offline or low-network demos.

**Acceptance Criteria:**

- [ ] Existing public demo videos remain available.
- [ ] Demo data path is documented.
- [ ] App can seed or present demo entries without StepFun when configured.
- [ ] Demo mode does not hide production error states.

**Task Breakdown:**

- Audit `public/videos/demo-data.ts`: Small (2h)
- Add optional demo seed flow: Medium (5h)
- Document demo mode: Small (1h)

**Dependencies:** Existing demo assets.

---

### Nice to Have (P2)

#### REQ-010: Observability and Diagnostics

**Description:** Add lightweight diagnostics for local development and manual QA.

**Acceptance Criteria:**

- [ ] Proxy logs include request IDs.
- [ ] App logs include video ID for add/play/chat flows.
- [ ] Errors are grouped by category: config, network, AI, database, media.
- [ ] No secrets are logged.

**Task Breakdown:**

- Add request IDs: Small (2h)
- Add redacted structured logs: Medium (4h)
- Document debug workflow: Small (1h)

**Dependencies:** Proxy and app logging.

---

## Non-Functional Requirements

### Performance

- `/analyze` is AI-bound; proxy must avoid extra blocking work beyond validation, request forwarding, and normalization.
- `/chat` should respond within StepFun latency plus <= 200ms proxy overhead for non-streaming responses.
- Library list query should complete in <= 100ms for 100 local videos on a typical Android device.
- Player UI interactions should stay responsive during video loading and chat calls.
- Download should support videos up to the documented limit of 128MB and 5 minutes.

### Security

- StepFun API keys must never be shipped in the frontend app.
- Proxy must validate URL input and avoid exposing local files outside the configured download directory.
- Logs must redact credentials and avoid printing full signed URLs.
- CORS should be permissive only for development or explicitly configured for release deployments.
- Download and stream routes must prevent path traversal via `fileName`.

### Reliability

- App must degrade gracefully when StepFun is unavailable.
- Old `analysis_json` records without `storyline` or `theme` must remain readable.
- Player cleanup must prevent audio/video continuing after navigation.
- Failed downloads must not block analysis persistence if the original video URL is usable.
- Failed analysis must not create a misleading completed video.

### Accessibility and UX

- Core actions must have clear visible text labels in Chinese.
- Loading, empty, and error states must be readable on mobile screens.
- Dynamic themes must maintain readable text contrast for AI panel and storyline content.
- Tap targets should be at least 44px where possible.

### Compatibility

- Primary target: Android via Capacitor WebView.
- Development targets: modern Chrome-based desktop browser and Android emulator.
- App should remain compatible with React 18, TypeScript 5.3, Vite 5, TailwindCSS 3.4, and Capacitor 8.

---

## Technical Considerations

### Current Architecture

```text
Android Device
  Capacitor WebView
    React Library page
    React Player page
    StorylinePanel
    useVideoTheme
    SQLite local database
    Capacitor Filesystem
    Capacitor ScreenOrientation and StatusBar
        |
        | HTTPS / LAN
        v
Express proxy
  /analyze
  /chat
  /download
  /stream/:fileName
        |
        | HTTPS
        v
StepFun step-3.6 API
```

### Key Components

1. **Library Page (`reelmind-app/src/pages/Library.tsx`)**
   - Adds video URLs.
   - Calls proxy analysis and download.
   - Stores completed video rows in SQLite.
   - Displays local library and delete action.

2. **Player Page (`reelmind-app/src/pages/Player.tsx`)**
   - Locks landscape mode.
   - Plays local or remote videos.
   - Injects dynamic theme variables.
   - Displays chat and storyline tabs.

3. **Analysis Types (`reelmind-app/src/types/analysis.ts`)**
   - Defines `VideoAnalysis`, `StorylineEntry`, `ThemeVariables`.
   - Provides parsing/default behavior for saved JSON.

4. **Theme Hook (`reelmind-app/src/hooks/useVideoTheme.ts`)**
   - Applies AI-generated theme variables to the document.
   - Cleans up on unmount.

5. **Proxy (`reelmind-proxy/index.js`)**
   - Protects StepFun API key.
   - Normalizes AI JSON responses.
   - Downloads and streams video files.

### API Specifications

#### POST /analyze

Request:

```json
{
  "videoUrl": "https://example.com/video.mp4"
}
```

Success:

```json
{
  "analysis": {
    "characters": [{ "name": "角色名", "description": "角色描述" }],
    "plotSummary": "剧情摘要",
    "timeline": [{ "time": "00:01:10", "event": "事件描述" }],
    "relationships": [{ "from": "A", "to": "B", "relation": "关系" }],
    "storyline": [
      {
        "phase": "第一幕：开篇",
        "summary": "阶段摘要",
        "highlights": ["关键节点"],
        "mood": "紧张"
      }
    ],
    "theme": {
      "primary": "#2563EB",
      "secondary": "#1F2937",
      "accent": "#3B82F6",
      "surface": "#111827",
      "text": "#F3F4F6",
      "textMuted": "#9CA3AF",
      "bubbleUser": "#2563EB",
      "bubbleAi": "#374151",
      "tagBg": "#374151",
      "tagText": "#D1D5DB",
      "mood": "默认"
    }
  }
}
```

Errors:

```json
{ "error": "videoUrl is required" }
{ "error": "invalid videoUrl format" }
{ "error": "StepFun API error", "details": {} }
{ "error": "Failed to parse AI analysis response" }
```

#### POST /chat

Request:

```json
{
  "messages": [
    { "role": "system", "content": "grounded video context" },
    { "role": "user", "content": "用户问题" }
  ],
  "temperature": 0.7,
  "max_tokens": 2048
}
```

Success: StepFun-compatible non-streaming chat completion JSON.

#### POST /download

Request:

```json
{
  "videoUrl": "https://example.com/video.mp4"
}
```

Success options:

- Binary MP4 body for direct native save, or
- Structured JSON containing a stream URL if proxy-stream mode is chosen.

The implementation must document the chosen contract and keep frontend usage aligned.

#### GET /stream/:fileName

Supports range requests for MP4 playback. Must reject missing files and path traversal attempts.

### Database Schema

Current SQLite schema:

```sql
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  analysis_json TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);
```

Recommended v1 additions:

- Add explicit migration/version documentation.
- Consider adding `local_file_uri`, `source_url`, and `error_message` in a future migration if partial download/analysis states need richer tracking.

### Migration Strategy

1. Keep existing `analysis_json` backward compatible.
2. Introduce frontend/proxy config without changing stored data.
3. Refactor video ID/download flow without database schema change.
4. Add tests before larger database migrations.
5. If schema changes are introduced, increment SQLite database version and provide migration SQL.

### Testing Strategy

**Unit Tests**

- `parseAnalysis()` with empty, old, complete, and malformed JSON.
- `defaultTheme` and invalid color fallback.
- Proxy `extractJSON()` for direct JSON, markdown JSON, brace extraction, invalid content.
- Proxy `normalizeAnalysis()` for missing arrays, invalid storyline entries, invalid colors.

**Integration Tests**

- Proxy `/analyze` validation with missing and invalid URLs.
- Proxy `/chat` validation with empty `messages`.
- Database insert/delete flow using a mock or web-compatible SQLite harness.

**E2E / Smoke Tests**

- Add valid video URL.
- Open from library.
- Verify player loading and retry states.
- Switch between AI chat and storyline tabs.
- Send chat question and persist reply.
- Delete video and associated chat messages.
- Restart app and verify persisted library.

**Build Verification**

- `cd reelmind-app && npm install && npm run build`
- `cd reelmind-proxy && npm install && npm test` once tests are added.
- `cd reelmind-app && npx cap sync android`

---

## Implementation Roadmap

### Phase 1: Configuration and Contract Hardening

**Goal:** Remove demo-only configuration and lock down API/data contracts.

**Tasks:**

- [ ] Task 1.1: Add shared frontend API config using `VITE_API_BASE_URL` (REQ-001)
- [ ] Task 1.2: Add proxy config module for port, StepFun key, public base URL, and download directory (REQ-002)
- [ ] Task 1.3: Align proxy and frontend `VideoAnalysis` defaults (REQ-003)
- [ ] Task 1.4: Document local/LAN/ngrok setup in README (REQ-001, REQ-002)

**Validation Checkpoint:** Fresh clone can configure app/proxy without editing source constants.

---

### Phase 2: Core Flow Reliability

**Goal:** Make add-analyze-download-save-play robust.

**Tasks:**

- [ ] Task 2.1: Refactor `addVideo()` to use a single UUID across analysis, download, and database insert (REQ-004)
- [ ] Task 2.2: Define and align `/download` response contract with frontend behavior (REQ-004)
- [ ] Task 2.3: Harden partial failure handling for analysis/download/database errors (REQ-004)
- [ ] Task 2.4: Audit and harden `resolveVideoUrl()` for local, file, and remote sources (REQ-005)
- [ ] Task 2.5: Verify player lifecycle cleanup on navigation (REQ-005)

**Validation Checkpoint:** User can add a valid video, see it in the library, open it, play it, leave, and return without stale playback.

---

### Phase 3: Storyline, Theme, and Chat Polish

**Goal:** Make the AI interpretation layer consistent and understandable.

**Tasks:**

- [ ] Task 3.1: Improve empty/missing storyline UI (REQ-003, REQ-006)
- [ ] Task 3.2: Enforce readable fallback theme values with contrast ratio >= 4.5:1 for body text (REQ-003)
- [ ] Task 3.3: Strengthen chat response validation and error handling (REQ-006)
- [ ] Task 3.4: Confirm chat prompt includes storyline phases, highlights, and mood (REQ-006)

**Validation Checkpoint:** Old and new analysis records both render usable player, storyline, theme, and chat states.

---

### Phase 4: Automated Tests and Build Safety

**Goal:** Add regression coverage for high-risk behavior.

**Tasks:**

- [ ] Task 4.1: Add frontend test runner and parser/theme tests (REQ-007)
- [ ] Task 4.2: Add proxy test runner and normalization/validation tests (REQ-007)
- [ ] Task 4.3: Add app build verification documentation (REQ-007, REQ-008)
- [ ] Task 4.4: Add manual Android smoke checklist (REQ-008)

**Validation Checkpoint:** Build and core tests pass locally with documented commands.

---

### Phase 5: Android Release Candidate Readiness

**Goal:** Prepare a repeatable v1 handoff for Android testing.

**Tasks:**

- [ ] Task 5.1: Verify Capacitor config and Android package metadata (REQ-008)
- [ ] Task 5.2: Document Android permissions and device proxy connectivity (REQ-008)
- [ ] Task 5.3: Preserve and document demo/offline mode (REQ-009)
- [ ] Task 5.4: Add lightweight diagnostics and redacted logging (REQ-010)
- [ ] Task 5.5: Run final manual QA on Android device/emulator (REQ-008)

**Validation Checkpoint:** A developer can build, install, configure proxy access, and complete the core Peel flow on Android.

---

## Out of Scope

Explicitly not included in this v1 hardening PRD:

1. **User accounts and cloud sync**
   - Local-only library remains the v1 model.

2. **App Store / Play Store submission**
   - This PRD prepares Android release-candidate readiness, not full store compliance.

3. **Long-form or large-file video support**
   - Keep the documented short-video constraints: <= 128MB and <= 5 minutes unless StepFun limits change.

4. **Streaming chat responses**
   - Current proxy uses non-streaming chat responses for simpler mobile reliability.

5. **Multi-model provider abstraction**
   - StepFun `step-3.6` remains the v1 provider.

6. **Server-side user media hosting**
   - Proxy download/stream is for local/demo reliability, not a multi-user media platform.

---

## Open Questions & Risks

### Open Questions

#### Q1: Should `/download` return binary data or a proxy stream URL?

- **Current Status:** Frontend reads binary blob; proxy also has `/stream/:fileName`.
- **Options:** (A) Keep binary download for Capacitor Filesystem, (B) return stream URL, (C) support both.
- **Owner:** Engineering.
- **Deadline:** Phase 2.
- **Impact:** High because it affects playback reliability and storage cleanup.

#### Q2: What is the intended deployment shape for `reelmind-proxy`?

- **Current Status:** Prototype uses an ngrok-style URL.
- **Options:** (A) local LAN dev proxy, (B) hosted single-user proxy, (C) production service.
- **Owner:** Product/engineering.
- **Deadline:** Phase 1.
- **Impact:** High for configuration, CORS, logs, and security posture.

#### Q3: Should demo videos be seeded automatically?

- **Current Status:** Demo assets and demo data exist, but app flow centers on adding URLs.
- **Options:** (A) manual URL only, (B) optional seed button/dev mode, (C) always ship demo rows.
- **Owner:** Product.
- **Deadline:** Phase 5.
- **Impact:** Medium for onboarding and offline demos.

### Risks & Mitigation

| Risk | Likelihood | Impact | Severity | Mitigation | Contingency |
|------|------------|--------|----------|------------|-------------|
| StepFun returns malformed or incomplete JSON | Medium | High | High | Keep strict normalization and tests | Show partial analysis with defaults |
| Hardcoded proxy URL breaks on device | High | High | Critical | Move to env config and document LAN/ngrok setup | Show config error before user starts analysis |
| Download succeeds but database insert fails | Medium | Medium | Medium | Single ID flow and cleanup strategy | Keep original URL and log orphan file |
| Android WebView media behavior differs from desktop | Medium | High | High | Manual Android QA and lifecycle cleanup | Provide remote URL fallback and retry |
| Dynamic theme produces text contrast below 4.5:1 | Medium | Medium | Medium | Validate colors and use fallback colors with body text contrast >= 4.5:1 | Replace unreadable theme with default |
| API key exposure | Low | Critical | High | Proxy-only StepFun calls; no frontend secrets | Rotate key and audit logs |

---

## Validation Checkpoints

### Checkpoint 1: End of Phase 1

**Criteria:**

- [ ] No frontend hardcoded ngrok/proxy URL remains.
- [ ] Proxy `.env.example` documents `STEPFUN_API_KEY`.
- [ ] README includes local/LAN/ngrok setup.
- [ ] Analysis schema defaults are documented.

**If Failed:** Do not proceed to deeper feature changes until configuration is repeatable.

---

### Checkpoint 2: End of Phase 2

**Criteria:**

- [ ] Add-video flow uses one UUID.
- [ ] Analyze/download/database partial failures behave predictably.
- [ ] Player supports local, `file://`, and remote video URL paths.
- [ ] Navigation away from player releases video resources.

**If Failed:** Fix flow reliability before adding test/deployment work.

---

### Checkpoint 3: End of Phase 3

**Criteria:**

- [ ] Storyline tab handles present, empty, and old-data states.
- [ ] Dynamic theme always has complete values.
- [ ] Chat prompt includes storyline context.
- [ ] Chat errors are visible and recoverable.

**If Failed:** Fix AI interpretation UX before release-candidate preparation.

---

### Checkpoint 4: End of Phase 4

**Criteria:**

- [ ] Frontend build passes.
- [ ] Parser/theme tests pass.
- [ ] Proxy normalization/validation tests pass.
- [ ] Manual Android QA checklist exists.

**If Failed:** Do not call the app release-candidate ready.

---

### Checkpoint 5: End of Phase 5

**Criteria:**

- [ ] Android sync/build steps are documented and verified.
- [ ] Device can reach configured proxy.
- [ ] User can complete add, analyze, play, storyline, chat, delete, restart flow.
- [ ] Demo mode expectations are documented.
- [ ] No secrets are exposed in frontend bundle or logs.

**If Failed:** Record blocking issue and return to the relevant phase.

---

## Appendix: Task Breakdown Hints

### Suggested Taskmaster Task Structure

**Configuration and Setup**

1. Add frontend API configuration module.
2. Replace hardcoded API constants.
3. Add app `.env.example`.
4. Add proxy configuration module.
5. Add proxy `.env.example`.
6. Update README setup instructions.

**Data Contract and Proxy**

7. Align proxy and frontend analysis defaults.
8. Export/test proxy JSON extraction.
9. Export/test proxy normalization.
10. Harden route validation and error responses.
11. Reject stream filenames containing path separators or traversal tokens.

**Core App Flow**

12. Refactor Library add-video UUID flow.
13. Align download contract.
14. Add partial failure handling.
15. Add local file cleanup decision.
16. Harden SQLite initialization and retry behavior.
17. Test delete video plus chat messages.

**Player and AI UX**

18. Audit video URL resolution.
19. Harden player lifecycle cleanup.
20. Improve media error and retry states.
21. Improve empty storyline state.
22. Validate theme fallbacks and contrast.
23. Strengthen chat response handling.
24. Confirm storyline-enriched chat prompt.

**Testing and Release Readiness**

25. Add frontend test runner.
26. Add frontend parser/theme tests.
27. Add proxy test runner.
28. Add proxy contract tests.
29. Document build and Android sync commands.
30. Add manual Android QA checklist.
31. Verify Capacitor config and package metadata.
32. Document demo mode.
33. Add redacted diagnostics and request IDs.

### Parallelizable Tasks

- Frontend config tasks and proxy config tasks can run in parallel.
- Proxy normalization tests and frontend parser tests can run in parallel after schema alignment.
- README setup documentation can proceed alongside implementation.
- Android QA checklist can be drafted before final verification.

### Sequential Dependencies

- API config must land before device QA.
- Schema alignment should precede parser/proxy tests.
- UUID/download refactor should precede partial failure tests.
- Build/test baseline should precede release-candidate checklist.

### Recommended User Test Tasks

- USER-TEST after Task 5: Verify fresh local setup and proxy configuration.
- USER-TEST after Task 15: Verify add/analyze/download/play flow on one valid video.
- USER-TEST after Task 24: Verify storyline, dynamic theme, and chat quality.
- USER-TEST after Task 30: Verify Android QA checklist on emulator or device.

---

**End of PRD**
