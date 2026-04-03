## 1. HANDOFF Manager (src/lib/handoff/manager.ts)

- [x] 1.1 Define HandoffReadError and HandoffWriteError typed error classes with filePath property
- [x] 1.2 Implement readHandoff() — read HANDOFF.md, extract fenced JSON block, parse to HandoffState
- [x] 1.3 Implement writeHandoff() — serialize HandoffState to JSON, wrap in markdown with header, write to file (create parent dirs), enforce task log bound (5) and compressed history bound (10)
- [x] 1.4 Implement appendTaskLog() — pure function: append entry, evict oldest if >5, compress evicted entry to CompressedHistoryEntry
- [x] 1.5 Implement updateCurrentState() — pure function: merge partial CurrentState update, set updatedAt to current ISO 8601 timestamp

## 2. HANDOFF Helper (src/lib/helper/handoff.ts)

- [x] 2.1 Implement getActiveConventions() — pure projection: return conventions array from HandoffState
- [x] 2.2 Implement getWakeContext() — pure function: build WakeContext from HandoffState, nextTask, progress; filter resolved issues, summarize goal context
- [x] 2.3 Implement getLastCommit() — pure function: extract commitHash and description from most recent task log entry

## 3. Metrics Logger (src/lib/metrics/logger.ts)

- [x] 3.1 Implement logInvocation() — append InvocationMetrics as JSON line to PIPELINE-METRICS.md; create file with markdown header if not exists; create parent dirs
- [x] 3.2 Implement readInvocations() — read all JSON lines from PIPELINE-METRICS.md, skip non-JSON lines; return empty array for missing file
- [x] 3.3 Implement getCostManifest() — pure function: aggregate InvocationMetrics array into CostManifest with totals, byRole (with firstPassRate), byPhase breakdowns

## 4. Metrics Helper (src/lib/helper/metrics.ts)

- [x] 4.1 Implement recordToolResult() — pure function: construct InvocationMetrics with ISO 8601 timestamp from arguments
- [x] 4.2 Implement calculateTotals() — pure function: sum numeric fields, count pass/fail outcomes into CostManifestTotals

## 5. Drift Sentinel (src/lib/helper/drift.ts)

- [x] 5.1 Define DriftSentinelError typed error class with filePath property
- [x] 5.2 Implement writeDriftSentinel() — write DriftSentinel as key=value format; create parent dirs; handle null rolledBackTo
- [x] 5.3 Implement readDriftSentinel() — parse key=value file into DriftSentinel; throw DriftSentinelError for missing/malformed files
- [x] 5.4 Implement checkDriftSentinel() — return boolean for file existence
- [x] 5.5 Implement clearDriftSentinel() — delete file; no-op if not exists

## 6. Checkpoint Manager (src/lib/helper/checkpoint.ts)

- [x] 6.1 Define CheckpointNotFoundError, CheckpointBudgetExceededError, CheckpointGitError typed error classes
- [x] 6.2 Implement shadow git helper — internal function to execFile git commands with explicit GIT_DIR and GIT_WORK_TREE env vars
- [x] 6.3 Implement createCheckpoint() — init shadow repo if needed, configure .gitignore exclusions, add all + commit + tag
- [x] 6.4 Implement rollbackToCheckpoint() — restore files from checkpoint tag, preserve PIPELINE-ISSUES.md/METRICS.md/LOG.md/HANDOFF.md
- [x] 6.5 Implement deleteCheckpoints() — remove .forge/checkpoints/phase-{N}/ directory; no-op if missing
- [x] 6.6 Implement listCheckpoints() — list tags from shadow repo; return empty array if no repo
- [x] 6.7 Implement getCheckpointDiff() — git diff between two tags; throw CheckpointNotFoundError for missing labels

## 7. Injection Scanner (src/lib/helper/scanner.ts)

- [x] 7.1 Define ScanResult and ScanFinding interfaces (or types)
- [x] 7.2 Implement scanForInjection() — pattern-based detection: instruction overrides, invisible Unicode, URL/base64 exfiltration; return ScanResult with findings
- [x] 7.3 Implement sanitizeUnicode() — remove zero-width spaces, joiners, RTL marks, and other invisible Unicode in single pass

## 8. Tests

- [x] 8.1 Write tests for handoff-manager (readHandoff, writeHandoff, appendTaskLog, updateCurrentState, error cases) in tests/handoff-manager.test.ts
- [x] 8.2 Write tests for handoff-helper (getActiveConventions, getWakeContext, getLastCommit) in tests/handoff-helper.test.ts
- [x] 8.3 Write tests for metrics-logger (logInvocation, readInvocations, getCostManifest) in tests/metrics-logger.test.ts
- [x] 8.4 Write tests for metrics-helper (recordToolResult, calculateTotals) in tests/metrics-helper.test.ts
- [x] 8.5 Write tests for drift-sentinel (write, read, check, clear, errors) in tests/drift-sentinel.test.ts
- [x] 8.6 Write tests for checkpoint-manager (create, rollback, delete, list, diff, errors) in tests/checkpoint.test.ts
- [x] 8.7 Write tests for injection-scanner (scanForInjection, sanitizeUnicode) in tests/scanner.test.ts
