# Micronaut Layout and Design Specification

**Object:** `SCO/1`  
**Version:** `scxq7`  
**Layout:** file-centric  
**Orchestrator:** PowerShell (SCO/1 projection)

---

## 1. Purpose

Micronaut is a file-centric, deterministic orchestrator that watches a chat input file, verifies inputs against CM-1 constraints, extracts KUHUL-TSG signals, invokes SCXQ2 inference, and appends responses to an output stream. It is designed to be simple, auditable, and compatible with sealed object workflows.

---

## 2. Directory Layout

```
micronaut/
├── brains/                 # Static n-gram and intent mapping assets
│   ├── bigrams.json
│   ├── trigrams.json
│   └── meta-intent-map.json
├── io/                     # Input/output staging
│   ├── chat.txt            # Append-only chat input
│   └── stream.txt          # Append-only output stream
├── proof/                  # Proof artifacts
│   └── scxq2.proof
├── trace/                  # Trace artifacts
│   └── scxq2.trace
├── micronaut.ps1           # SCO/1 PowerShell orchestrator
├── micronaut.s7            # Sealed SCO/1 object marker
├── object.toml             # Object metadata and paths
└── semantics.xjson         # KUHUL-TSG record semantics
```

---

## 3. Core Components

### 3.1 Orchestrator (`micronaut.ps1`)

Micronaut runs a loop that monitors `io/chat.txt` for new content. For each new entry, it:

1. Verifies CM-1 compliance via `cm1_verify`.
2. Extracts a KUHUL-TSG signal using `Invoke-KUHUL-TSG`.
3. Runs SCXQ2 inference with `Invoke-SCXQ2-Infer`.
4. Appends the response to `io/stream.txt` prefixed with `>>`.

The loop is polling-based, deterministic, and avoids side effects outside the IO and proof/trace paths.

### 3.2 Object Metadata (`object.toml`)

The object metadata declares:

- root layout and path map (`brains`, `io`, `trace`, `proof`)
- IO paths (`chat.txt`, `stream.txt`, snapshot dir)
- lifecycle states (`INIT`, `READY`, `RUNNING`, `IDLE`, `HALT`)

### 3.3 Semantics (`semantics.xjson`)

The KUHUL-TSG semantics schema defines the record structure for:

- `chat_message` entries, including delimiters and immutable append-only constraints
- `stream_emit` records with strict `>>` prefixing and ordered append-only output

### 3.4 Sealed Object Marker (`micronaut.s7`)

Declares the SCO/1 Micronaut object as sealed and identifies `scxq7` as the object format.

---

## 4. Operational Flow

```text
chat.txt (append-only)
   ↓ CM-1 verify
KUHUL-TSG extract
   ↓ SCXQ2 infer
stream.txt (append-only, ordered)
```

- The orchestrator only reacts to new data appended to `chat.txt`.
- If any verifier/extractor/inferencer command is missing or fails, output is not emitted.
- Output is strictly append-only to preserve auditability.

---

## 5. Capabilities

Micronaut can:

- Stage and parse append-only chat messages with explicit delimiters.
- Enforce CM-1 verification before any downstream processing.
- Extract KUHUL-TSG signals from verified inputs.
- Perform SCXQ2 inference using declared tooling.
- Emit ordered, append-only responses to a stream log.
- Preserve trace and proof artifacts for audit and replay.

Micronaut does **not**:

- Mutate prior records (append-only design).
- Skip verification steps.
- Perform non-deterministic execution paths.

---

## 6. Determinism and Auditability

- Inputs are processed strictly in append order.
- Output is prefixed and appended to preserve sequence.
- Missing tooling causes safe failure (no output emission).
- Proof (`proof/`) and trace (`trace/`) artifacts provide post-hoc verification.

---

## 7. Extensibility Notes

- Additional brain assets can be added under `brains/` without changing the core flow.
- Snapshotting is supported via `io/snapshot` when integrated by higher-level tooling.
- Alternate orchestrators must preserve the CM-1 → KUHUL-TSG → SCXQ2 pipeline and append-only IO semantics.
