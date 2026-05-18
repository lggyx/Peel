# Peel Task Seed

Use this as the fallback task list if `task-master parse-prd` is blocked by local model/provider configuration.

## Phase 1: Configuration and Contract Hardening

1. Add shared frontend API configuration using `VITE_API_BASE_URL`.
   - Files: `reelmind-app/src/**`, app env docs.
   - Depends on: none.

2. Replace hardcoded frontend API constants.
   - Files: `reelmind-app/src/pages/Library.tsx`, `reelmind-app/src/pages/Player.tsx`.
   - Depends on: task 1.

3. Add proxy runtime configuration for StepFun key, port, public base URL, and download directory.
   - Files: `reelmind-proxy/index.js`, proxy env docs.
   - Depends on: none.

4. Align frontend and proxy `VideoAnalysis` fallback behavior.
   - Files: `reelmind-app/src/types/analysis.ts`, `reelmind-proxy/index.js`.
   - Depends on: none.

5. USER-TEST: Verify fresh local setup and proxy configuration.
   - Depends on: tasks 1-4.

## Phase 2: Core Flow Reliability

6. Refactor Library add-video flow to use one UUID for analysis, download, and DB insert.
   - Files: `reelmind-app/src/pages/Library.tsx`.
   - Depends on: tasks 1, 2.

7. Define and align `/download` response contract with frontend behavior.
   - Files: `reelmind-proxy/index.js`, `reelmind-app/src/pages/Library.tsx`.
   - Depends on: tasks 3, 6.

8. Harden partial failure handling for analysis, download, and database errors.
   - Files: `reelmind-app/src/pages/Library.tsx`, `reelmind-proxy/index.js`.
   - Depends on: tasks 6, 7.

9. Audit and harden video URL resolution and player lifecycle cleanup.
   - Files: `reelmind-app/src/pages/Player.tsx`.
   - Depends on: tasks 2, 4.

10. USER-TEST: Verify add, analyze, download, save, open, play, leave, and return flow.
    - Depends on: tasks 6-9.

## Phase 3: AI UX and Regression Safety

11. Improve storyline, theme, and empty-analysis UI states.
    - Files: `reelmind-app/src/components/StorylinePanel.tsx`, `reelmind-app/src/hooks/useVideoTheme.ts`, `reelmind-app/src/pages/Player.tsx`.
    - Depends on: tasks 4, 9.

12. Strengthen chat response validation, persistence, and recoverable error behavior.
    - Files: `reelmind-app/src/pages/Player.tsx`, `reelmind-proxy/index.js`.
    - Depends on: tasks 3, 4.

13. Add frontend and proxy test runners plus focused parser/normalizer tests.
    - Files: `reelmind-app/package.json`, `reelmind-proxy/package.json`, new test files.
    - Depends on: tasks 4, 8, 12.

14. Add Android build, sync, device proxy, and manual QA documentation.
    - Files: `README.md`, possibly `docs/**`.
    - Depends on: tasks 1-13.

15. USER-TEST: Run Android release-candidate smoke test.
    - Depends on: task 14.

