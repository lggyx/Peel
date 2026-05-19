# Peel MeDo Hackathon Materials

This folder contains the lightweight material pack for turning Peel into a public MeDo hackathon demo.

## Files

- `peel-medo-prd.md` - product brief and MeDo scope.
- `api-spec.md` - backend API contract for the MeDo web app.
- `medo-build-prompt.md` - copy/paste prompt for MeDo.
- `devpost-submission-draft.md` - draft English Devpost description and testing instructions.
- `deployment-checklist.md` - backend deployment checklist before connecting MeDo.
- `screenshot-checklist.md` - screenshots to upload with the MeDo prompt.

## Current Decision

Do not ask MeDo to rebuild the existing Android app from source. Use MeDo to create a public web demo and submission experience that calls Peel's existing backend APIs.

## Public Demo Dependency

The `reelmind-proxy` service is deployed to Render at:

```text
https://peel-proxy.onrender.com
```
