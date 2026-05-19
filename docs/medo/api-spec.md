# Peel API Spec for MeDo Integration

## Base URL

Replace this placeholder with the deployed HTTPS backend URL:

```text
<PUBLIC_PROXY_BASE_URL>
```

Example:

```text
https://peel-proxy.example.com
```

Do not use local development URLs in the MeDo app:

```text
http://localhost:3000
http://172.31.24.201:3000
http://10.0.2.2:3000
```

## Headers

Use JSON for API calls:

```http
Content-Type: application/json
```

If using an ngrok preview URL during temporary testing, also include:

```http
ngrok-skip-browser-warning: 1
```

## Health Check

### Request

```http
GET /health
```

### Example

```bash
curl <PUBLIC_PROXY_BASE_URL>/health
```

### Success Response

```json
{
  "status": "ok",
  "timestamp": "2026-05-19T00:00:00.000Z"
}
```

## Analyze Video

### Request

```http
POST /analyze
Content-Type: application/json
```

### Body

```json
{
  "videoUrl": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
}
```

### Success Response

```json
{
  "analysis": {
    "characters": [
      {
        "name": "Red flower",
        "description": "A red flower gradually blooming in a close-up shot."
      }
    ],
    "plotSummary": "The video shows a flower opening over time, highlighting a quiet natural transformation.",
    "timeline": [
      {
        "time": "00:00",
        "event": "The flower bud is closed."
      },
      {
        "time": "00:02",
        "event": "The petals open and reveal the flower center."
      }
    ],
    "relationships": [
      {
        "from": "Flower",
        "to": "Leaves",
        "relation": "Grows among"
      }
    ],
    "storyline": [
      {
        "phase": "Opening",
        "summary": "The flower begins in a closed, quiet state.",
        "highlights": ["closed bud", "macro shot"],
        "mood": "calm"
      },
      {
        "phase": "Bloom",
        "summary": "The flower opens and becomes visually expressive.",
        "highlights": ["red petals", "natural motion"],
        "mood": "vivid"
      }
    ],
    "theme": {
      "primary": "#2D5016",
      "secondary": "#E74C3C",
      "accent": "#F1C40F",
      "surface": "#3E2723",
      "text": "#FFFFFF",
      "textMuted": "#B0BEC5",
      "bubbleUser": "#A5D6A7",
      "bubbleAi": "#90CAF9",
      "tagBg": "#FF9800",
      "tagText": "#FFFFFF",
      "mood": "natural and healing"
    }
  }
}
```

### Common Error Responses

Invalid URL:

```json
{
  "error": "valid http/https videoUrl is required"
}
```

AI provider error:

```json
{
  "error": "StepFun API error",
  "details": {
    "error": {
      "message": "Provider error message"
    }
  }
}
```

## Ask AI

### Request

```http
POST /chat
Content-Type: application/json
```

### Body

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a senior video interpretation assistant. Answer based only on the following analysis: ..."
    },
    {
      "role": "user",
      "content": "What is happening in this video?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1024
}
```

### Success Response

The response follows a chat-completion shape:

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "The video shows a flower gradually blooming..."
      }
    }
  ]
}
```

### Common Error Responses

Missing messages:

```json
{
  "error": "messages array is required"
}
```

AI provider error:

```json
{
  "error": "StepFun API error",
  "details": {
    "error": {
      "message": "Provider error message"
    }
  }
}
```

## Optional Download Endpoint

The Android app uses this endpoint to proxy and store MP4 files locally. The MeDo web demo can skip this endpoint and use the original video URL for preview.

```http
POST /download
Content-Type: application/json
```

Body:

```json
{
  "videoUrl": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
}
```

## Implementation Notes for MeDo

- Never expose `STEPFUN_API_KEY` in the MeDo frontend.
- The MeDo app should only call the deployed Peel proxy.
- Store the latest `analysis` object in client state and reuse it as chat context.
- Public MP4 URLs work best for the demo.
- Use this demo URL as a default quick-fill:

```text
https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4
```

