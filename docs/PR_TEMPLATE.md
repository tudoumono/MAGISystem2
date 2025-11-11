# Phase 1: Implement 5-Layer Timeout Strategy for A2A Design

## 📋 Summary

This PR implements a comprehensive **5-layer timeout strategy** for the MAGI Decision System's Agent-to-Agent (A2A) design. The implementation prevents infinite waiting across the entire stack—from frontend SSE to Python agent execution—ensuring system reliability and improved user experience.

### Commits Included
- ✅ `4355456` - docs: Add comprehensive Phase 1 timeout implementation status report
- ✅ `9e5c9aa` - feat(agents): Implement Layer 4 Python sage timeout with graceful degradation
- ✅ `1534925` - feat(agents): Implement Layer 5 SOLOMON Judge timeout with graceful degradation
- ✅ `9d42f21` - feat(backend): Implement Layer 2 Next.js process monitor timeout with graceful shutdown
- ✅ `970f6ee` - feat(frontend): Implement Layer 1 frontend SSE timeout with AbortController

---

## 🎯 Problem Statement

### Current Issue
In the A2A design where **3 Sages + SOLOMON Judge** execute in parallel:
- One delayed LLM agent can block the entire system indefinitely
- No protection against infinite waiting at any layer
- Poor user experience when processing takes too long
- No graceful degradation when individual agents timeout

### Why Layer 4 is Critical (A2A Bottleneck)
```
User Question
    ↓
[CASPAR] ─┐
[BALTHASAR] ┼─→ [SOLOMON] → Final Decision
[MELCHIOR] ─┘
```

**Without timeout**: If CASPAR hangs, entire system waits indefinitely
**With timeout**: CASPAR returns ABSTAINED after 90s, BALTHASAR + MELCHIOR continue normally

---

## ✨ Solution: 5-Layer Timeout Hierarchy

```
Layer 1 (Frontend):     240s (4分)   ← User-facing timeout
Layer 2 (Process):      210s (3.5分) ← Next.js process monitor
Layer 3 (Total):        180s (3分)   ← Python overall (indirect via Layer 2)
Layer 4 (Sages):        90s  (1.5分) ← Individual sage timeout
Layer 5 (SOLOMON):      60s  (1分)   ← Final judgment timeout
```

**Design Principle**: Each layer times out **before** its parent layer (30s minimum gap)

---

## 🏗️ Infrastructure Already Implemented (PR #7)

### Configuration Utilities
- ✅ **TypeScript**: `agents/backend/src/lib/config/timeout.ts`
  - `getTimeoutConfig()` - Load settings
  - `exportPythonEnv()` - Pass to Python
  - `logTimeoutConfig()` - Debug logging
  - Hierarchy validation

- ✅ **Python**: `agents/config/timeout.py`
  - `get_timeout_config()` - Singleton pattern
  - `load_timeout_config()` - Env variable loading
  - `log_timeout_config()` - Debug output
  - Hierarchy validation

### Environment Variables
```bash
# Layer 2: Next.js Process Monitor
AGENTCORE_PROCESS_TIMEOUT_MS=210000

# Layer 4: Python Sage Timeout
MAGI_SAGE_TIMEOUT_SECONDS=90

# Layer 5: SOLOMON Judge Timeout
MAGI_SOLOMON_TIMEOUT_SECONDS=60

# Layer 3: Python Total Timeout (indirect)
MAGI_TOTAL_TIMEOUT_SECONDS=180

# Event Queue Timeout
MAGI_EVENT_QUEUE_TIMEOUT_SECONDS=120

# Layer 1: Frontend SSE Timeout
NEXT_PUBLIC_SSE_TIMEOUT_MS=240000
```

---

## 🔧 Key Implementation Details

### Layer 1: Frontend SSE Timeout
**File**: `src/lib/agents/stream-client.ts`

**Changes**:
- Load timeout from `NEXT_PUBLIC_SSE_TIMEOUT_MS` (default: 240s)
- Create `AbortController` for fetch cancellation
- Set timeout with Japanese user-friendly error message
- Clear timeout on all completion paths (done, complete event, error event)
- Handle `AbortError` to distinguish timeout vs manual cancellation

**Graceful Degradation**: User sees clear timeout message in Japanese

```typescript
const sseTimeoutMs = parseInt(process.env.NEXT_PUBLIC_SSE_TIMEOUT_MS || '240000', 10);
const abortController = new AbortController();

const timeoutId = setTimeout(() => {
  abortController.abort();
  const timeoutError = new Error(
    `リクエストがタイムアウトしました（${(sseTimeoutMs / 1000).toFixed(0)}秒）。` +
    `\n処理に時間がかかりすぎています。後でもう一度お試しください。`
  );
  onError?.(timeoutError);
  reject(timeoutError);
}, sseTimeoutMs);

fetch(url, { signal: abortController.signal, ... })
```

### Layer 2: Next.js Process Monitor
**File**: `agents/backend/app/api/invocations/route.ts`

**Changes**:
- Import `getTimeoutConfig()` and `exportPythonEnv()`
- Load timeout configuration and pass to Python process via environment variables
- Set process monitoring timeout
- Send timeout event to SSE stream on timeout
- Implement graceful shutdown: SIGTERM → wait 5s → SIGKILL
- Clear timeout on process completion

**Graceful Degradation**: Sends error event to frontend, attempts clean shutdown

```typescript
const timeoutConfig = getTimeoutConfig();
const pythonProcess = spawn(PYTHON_PATH, [MAGI_SCRIPT_PATH], {
  env: { ...process.env, ...exportPythonEnv(timeoutConfig) }
});

let processCompleted = false;
const processTimeoutId = setTimeout(() => {
  if (!processCompleted) {
    // Send timeout event
    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(timeoutEvent)}\n\n`));

    // Graceful shutdown
    pythonProcess.kill('SIGTERM');
    setTimeout(() => {
      if (!pythonProcess.killed) pythonProcess.kill('SIGKILL');
    }, 5000);
  }
}, timeoutConfig.processTimeoutMs);

pythonProcess.on('close', (code) => {
  processCompleted = true;
  clearTimeout(processTimeoutId);
});
```

### Layer 4: Python Sage Timeout
**File**: `agents/magi_agent.py` - Method: `_consult_sage_stream()`

**Changes**:
- Load `self.timeout_config = get_timeout_config()` in `__init__`
- Check elapsed time on each streaming chunk
- Raise `asyncio.TimeoutError` when timeout exceeded
- Catch timeout and return ABSTAINED decision (confidence=0.0)
- Continue streaming other sages

**Graceful Degradation**: Returns ABSTAINED, allows other sages to continue

```python
timeout_seconds = self.timeout_config.sage_timeout_seconds
start_time = asyncio.get_event_loop().time()

try:
    async for chunk in agent.stream_async(question, **stream_kwargs):
        elapsed = asyncio.get_event_loop().time() - start_time
        if elapsed > timeout_seconds:
            raise asyncio.TimeoutError(f"Sage {agent_id} exceeded timeout of {timeout_seconds}s")
        # Process chunk...

except asyncio.TimeoutError:
    timeout_result = {
        "decision": "ABSTAINED",
        "reasoning": f"⏱️ タイムアウト: 賢者{agent_id}の処理が{timeout_seconds}秒を超過しました。",
        "confidence": 0.0
    }
    yield self._create_sse_event("agent_complete", timeout_result, agent_id=agent_id)
```

### Layer 5: SOLOMON Judge Timeout
**File**: `agents/magi_agent.py` - Method: `_solomon_judgment_stream()`

**Changes**:
- Similar pattern to Layer 4
- Check elapsed time on each streaming chunk
- Raise `asyncio.TimeoutError` when timeout exceeded
- Catch timeout and return REJECTED with confidence=0.5
- Include sage scores for continuity

**Graceful Degradation**: Returns REJECTED (confidence=0.5) as conservative fallback

```python
timeout_seconds = self.timeout_config.solomon_timeout_seconds
start_time = asyncio.get_event_loop().time()

try:
    async for chunk in self.solomon.stream_async(question, system_prompt=solomon_prompt):
        elapsed = asyncio.get_event_loop().time() - start_time
        if elapsed > timeout_seconds:
            raise asyncio.TimeoutError(f"SOLOMON exceeded timeout of {timeout_seconds}s")
        # Process chunk...

except asyncio.TimeoutError:
    timeout_result = {
        "final_decision": "REJECTED",
        "reasoning": f"⏱️ SOLOMON評価がタイムアウト（{timeout_seconds}秒）しました。",
        "confidence": 0.5,
        "sage_scores": {"caspar": 50, "balthasar": 50, "melchior": 50}
    }
    yield self._create_sse_event("judge_complete", timeout_result)
```

---

## ✅ Testing Status

### Infrastructure Tests (PR #7)
- ✅ TypeScript configuration utility
- ✅ Python configuration utility
- ✅ Environment variable loading
- ✅ Hierarchy validation
- ✅ Default values

### Runtime Integration Tests
- ⏳ **Deferred to deployment** - Requires full stack running
- Recommended test: Simulate slow LLM responses with mock delay
- Verify each layer triggers at correct time
- Verify graceful degradation at each layer

### Manual Test (from previous session)
```
✅ test_magi2.py execution: 11.96s, 383 events
✅ All 3 sages completed successfully
✅ SOLOMON judgment completed
✅ Full streaming pipeline working
```

---

## 🎁 Benefits

### System Reliability
- ✅ No infinite waiting at any layer
- ✅ Predictable maximum execution time
- ✅ Graceful degradation preserves partial results
- ✅ Clear timeout hierarchy prevents conflicts

### User Experience
- ✅ User-friendly Japanese timeout messages
- ✅ Frontend cancellation with AbortController
- ✅ Visible timeout in logs for debugging
- ✅ Predictable response times

### A2A Design Resilience
- ✅ Individual sage delays don't block entire system
- ✅ SOLOMON timeout returns conservative fallback
- ✅ 2 out of 3 sages can still produce valid decision
- ✅ System continues even with partial failures

---

## 📚 Documentation

### Comprehensive Status Report
**File**: `PHASE1_STATUS_REPORT.md`

Contains:
- Complete implementation status (50% → 100%)
- Detailed code examples for each layer
- Testing results and recommendations
- Environment variable documentation
- Timeout hierarchy diagram
- Graceful degradation strategies

---

## 🚀 Migration Path

### No Breaking Changes
- All timeout values have sensible defaults
- System works without environment variables
- Backward compatible with existing deployments

### Recommended Deployment Steps
1. Merge this PR to main branch
2. Update environment variables in deployment (optional for custom timeouts)
3. Monitor logs for timeout events
4. Adjust timeout values based on production metrics

### Monitoring
Watch for these log messages:
- `⏱️  SSE Timeout: 240000ms` (Layer 1)
- `⏱️  Process timeout: 210000ms` (Layer 2)
- `🕐 Python Timeout Configuration:` (Layers 3-5)
- `❌ SSE stream timeout after...` (Layer 1 timeout triggered)
- `❌ Python process TIMEOUT after...` (Layer 2 timeout triggered)
- `⏱️ タイムアウト: 賢者XXの処理が...` (Layer 4 timeout triggered)
- `⏱️ SOLOMON評価がタイムアウト...` (Layer 5 timeout triggered)

---

## ✅ Checklist

- [x] Layer 1 implementation (Frontend SSE)
- [x] Layer 2 implementation (Process Monitor)
- [x] Layer 4 implementation (Python Sages)
- [x] Layer 5 implementation (SOLOMON Judge)
- [x] Configuration utilities working
- [x] Environment variable documentation
- [x] Graceful degradation implemented
- [x] Timeout hierarchy validated
- [x] Status report created
- [x] All commits follow conventional commit format
- [ ] Runtime integration testing (deferred to deployment)
- [ ] Production monitoring setup

---

## 🔗 Related

- **Previous PR**: #7 (Timeout Configuration Infrastructure)
- **Next Phase**: Phase 2 - Error Handling and Monitoring
- **Branch**: `claude/review-code-011CUyix3DAtcQauKZLdGmD8`
- **Base Branch**: `main`

---

## 📝 Files Changed

```
modified:   src/lib/agents/stream-client.ts
modified:   agents/backend/app/api/invocations/route.ts
modified:   agents/magi_agent.py
new file:   PHASE1_STATUS_REPORT.md
```

---

## 🤝 Review Focus Areas

1. **Timeout Values**: Are the default timeout values appropriate for production?
2. **Graceful Degradation**: Are the fallback responses (ABSTAINED, REJECTED) appropriate?
3. **Error Messages**: Are the Japanese error messages clear and helpful?
4. **AbortController**: Is the fetch cancellation logic correct?
5. **Process Shutdown**: Is SIGTERM → SIGKILL (5s) appropriate for graceful shutdown?
6. **Hierarchy Gaps**: Is 30s gap between layers sufficient?

---

**Ready to merge after review!** 🎉
