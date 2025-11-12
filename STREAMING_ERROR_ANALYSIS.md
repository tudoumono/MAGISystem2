# Streaming Error Analysis - Production Deployment Issues

**Date**: 2025-11-12
**Environment**: Amplify Hosting Production (`https://main.d34f7t08qc7jiy.amplifyapp.com/`)
**Severity**: 🔴 Critical - Streaming functionality completely broken in production

## Executive Summary

The application is failing to stream agent responses in production with two critical issues:

1. **Primary Issue**: Missing `NEXT_PUBLIC_AGENTCORE_URL` environment variable causing streaming to fail with "TypeError: Failed to fetch"
2. **Secondary Issue**: Amplify configuration context warnings (non-blocking but indicates architectural problems)

## Error Analysis

### 1. Streaming Fetch Failure (Critical)

```javascript
Failed to start streaming: TypeError: Failed to fetch
    at page-b5a827af907d2e97.js:1:28966
```

**Root Cause**: The frontend is attempting to connect to:
```javascript
const agentCoreUrl = process.env.NEXT_PUBLIC_AGENTCORE_URL || 'http://localhost:8080';
const response = await fetch(`${agentCoreUrl}/api/invocations`, {
```

**Problem**:
- `NEXT_PUBLIC_AGENTCORE_URL` is **NOT set** in Amplify Hosting environment variables
- Falls back to `http://localhost:8080` which doesn't exist in production
- Results in immediate fetch failure

**Location**: `src/hooks/useStreamingAgent.ts:97-98`

### 2. Amplify Configuration Warnings (Non-Critical)

```javascript
Amplify has not been configured. Please call Amplify.configure() before using this service.
```

**Root Cause**: Configuration context isolation issue

**Analysis**:
- `AmplifyProvider` (layout level) configures Amplify on mount
- `getAmplifyClient()` in `client.ts` also tries to configure Amplify
- `generateClient()` from `aws-amplify/data` may check configuration in isolated context
- Results in warnings but doesn't block functionality (falls back to API Key access)

**Locations**:
- `src/components/amplify/AmplifyProvider.tsx:119` - Provider level config
- `src/lib/amplify/client.ts:57` - Client level config

## Architecture Context

### Current System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Amplify Hosting (Next.js Frontend)                         │
│ https://main.d34f7t08qc7jiy.amplifyapp.com/               │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ useStreamingAgent.ts                                    │ │
│ │ fetch(`${NEXT_PUBLIC_AGENTCORE_URL}/api/invocations`)  │ │
│ │              ↓                                          │ │
│ │         ❌ FAILS HERE                                   │ │
│ │  (NEXT_PUBLIC_AGENTCORE_URL not set)                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                      ↓ Should connect to ↓
┌─────────────────────────────────────────────────────────────┐
│ AgentCore Runtime (Separate Service - NOT DEPLOYED YET?)   │
│ Expected: https://agentcore-runtime.example.com            │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ agents/backend/src/app/api/invocations/route.ts        │ │
│ │ Next.js API Route → Python MAGI Agent                  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Insight

**The frontend and AgentCore Runtime are SEPARATE deployments:**

1. **Frontend** (Amplify Hosting) - Currently deployed ✅
2. **AgentCore Runtime** (Container Service) - Status unknown ❓

## Solutions

### Immediate Fix (Required for Streaming to Work)

**Step 1**: Verify AgentCore Runtime Deployment Status

Check if the AgentCore Runtime service is deployed:
- AWS App Runner?
- ECS/Fargate?
- Another Amplify app?
- Local development only?

**Step 2**: Set Environment Variable in Amplify Hosting

1. Go to AWS Amplify Console
2. Select the application
3. Navigate to **Environment variables**
4. Add:
   ```
   NEXT_PUBLIC_AGENTCORE_URL=https://<your-agentcore-runtime-url>
   ```
5. Redeploy the application

**Step 3**: Verify CORS Configuration

Ensure the AgentCore Runtime allows requests from Amplify Hosting:
- Check `agents/backend/src/app/api/invocations/route.ts:288`
- Current config has `'Access-Control-Allow-Origin': '*'` ✅

### Amplify Configuration Warning Fix (Optional)

**Option 1**: Centralize Configuration (Recommended)

Remove duplicate configuration in `client.ts` and rely solely on `AmplifyProvider`:

```typescript
// src/lib/amplify/client.ts
export function getRealAmplifyClient() {
  try {
    // Remove initializeAmplify() call here
    // Trust that AmplifyProvider has already configured

    const client = generateClient() as any;
    // ... rest of code
  }
}
```

**Option 2**: Use Singleton Pattern

Ensure Amplify is configured exactly once across the entire application:

```typescript
// Global singleton
let amplifyConfigured = false;

function ensureAmplifyConfigured() {
  if (typeof window === 'undefined') return;
  if (amplifyConfigured) return;

  const config = Amplify.getConfig();
  if (config && Object.keys(config).length > 0) {
    amplifyConfigured = true;
    return;
  }

  // Configure only if not already configured
  const amplifyOutputs = require('../../../amplify_outputs.json');
  Amplify.configure(amplifyOutputs);
  amplifyConfigured = true;
}
```

## Testing Checklist

After applying fixes:

- [ ] Verify `NEXT_PUBLIC_AGENTCORE_URL` is set in Amplify Console
- [ ] Confirm AgentCore Runtime is accessible from public internet
- [ ] Test streaming connection with browser DevTools Network tab
- [ ] Check for CORS errors
- [ ] Verify SSE events are received
- [ ] Test end-to-end message flow

## Environment Variables Reference

### Required for Production

```bash
# AgentCore Runtime endpoint
NEXT_PUBLIC_AGENTCORE_URL=https://your-agentcore-runtime.example.com

# AWS Region
NEXT_PUBLIC_AWS_REGION=ap-northeast-1
APP_AWS_REGION=ap-northeast-1

# Timeout settings (optional, has defaults)
NEXT_PUBLIC_SSE_TIMEOUT_MS=240000
```

### Development vs Production

| Variable | Local Dev | Amplify Hosting |
|----------|-----------|-----------------|
| `NEXT_PUBLIC_AGENTCORE_URL` | `http://localhost:8080` | ❌ **NOT SET** (Required!) |
| `NEXT_PUBLIC_AWS_REGION` | Optional | ✅ Set |
| `APP_AWS_REGION` | Optional | ✅ Set |

## Impact Assessment

### Current State
- ✅ Authentication: Working
- ✅ Dashboard: Loads successfully
- ✅ Conversation list: Working (with API Key fallback)
- ❌ **Streaming messages: Completely broken**
- ⚠️ Amplify Client: Working but with warnings

### After Fix
- ✅ All existing features remain functional
- ✅ Streaming will work end-to-end
- ✅ No warnings in console

## Next Steps

1. **Immediate (Blocking)**:
   - [ ] Verify AgentCore Runtime deployment exists
   - [ ] Get AgentCore Runtime URL
   - [ ] Set `NEXT_PUBLIC_AGENTCORE_URL` in Amplify Console
   - [ ] Redeploy and test streaming

2. **Short-term (Quality)**:
   - [ ] Fix Amplify configuration warnings
   - [ ] Add environment variable validation
   - [ ] Add better error messages for missing config

3. **Long-term (Monitoring)**:
   - [ ] Add observability for streaming failures
   - [ ] Set up alerts for AgentCore connectivity
   - [ ] Document deployment dependencies

## Related Files

- `src/hooks/useStreamingAgent.ts:97` - Streaming fetch logic
- `src/lib/amplify/client.ts:52-72` - Amplify configuration
- `src/components/amplify/AmplifyProvider.tsx:64-149` - Provider configuration
- `agents/backend/src/app/api/invocations/route.ts` - AgentCore endpoint
- `docs/03-deployment/AMPLIFY_HOSTING_ENV_VARS.md` - Environment variables guide

## Appendix: Browser Console Logs

### Key Log Entries

```
✅ Amplify configured successfully (PRODUCTION)
✅ User authenticated, auto-redirecting to: /dashboard
✅ Real Amplify client created successfully with all required models
```
↑ These work fine

```
❌ Amplify has not been configured. Please call Amplify.configure() before using this service.
⚠️ User not authenticated - using API Key access
```
↑ Non-critical warnings (API Key fallback works)

```
❌ Failed to start streaming: TypeError: Failed to fetch
```
↑ **CRITICAL** - Streaming completely broken

### Streaming Flow in Logs

```
Creating streaming message: Object
Sending message with agent configs: undefined
Starting streaming...
Agent responses for UI: 0 agents
Updated streaming message: Object
Failed to start streaming: TypeError: Failed to fetch  ← HERE
Streaming started  ← Misleading (actually failed)
```

## Conclusion

The streaming failure is a **deployment configuration issue**, not a code bug. The application is trying to connect to a service that either:

1. Is not deployed yet, or
2. Is deployed but the URL is not configured in Amplify Hosting

**Action Required**: Set `NEXT_PUBLIC_AGENTCORE_URL` environment variable in Amplify Console to the actual AgentCore Runtime URL.

---

**Document Status**: 🟢 Ready for Review
**Priority**: 🔴 P0 - Blocks core functionality
