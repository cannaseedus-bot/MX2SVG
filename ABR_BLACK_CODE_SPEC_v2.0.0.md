# ABR_BLACK_CODE_SPEC_v2.0.0 — Full Draft (Roadmap-Compliant)

> NOTE: v1 remains immutable. v2 adds only allowed extensions.

## Canonical designation (v1)

```
ABR_BLACK_CODE_SPEC_v1.0.0
STATUS: CANONICAL
SCOPE: PURE π / SCXQ2 / XCFE
```

```
// ============================================================
// ABR_BLACK_CODE_SPEC_v2.0.0 — FULL DRAFT (ROADMAP-COMPLIANT)
// ============================================================
// NOTE: v1 remains immutable. v2 adds ONLY allowed extensions.
// NO HTML. NO HOST IO. CODE-ONLY SPEC + π VERIFIER + SCXQ2 FRAMES.
// ============================================================

spec ABR_BLACK_CODE_SPEC_v2 {

  version        = "2.0.0"
  status         = "DRAFT"
  based_on       = "ABR_BLACK_CODE_SPEC_v1.0.0(FROZEN)"

  // ==========================================================
  // 0) NON-NEGOTIABLES (INHERITED / ENFORCED)
  // ==========================================================
  determinism      = true
  randomness       = forbidden
  async            = forbidden
  io               = forbidden
  external_state   = forbidden

  abr.count        = 28            // MUST NOT CHANGE
  abr.order        = fixed(0..27)  // MUST NOT CHANGE
  abr.proof        = required
  abr.replay       = sufficient

  // ==========================================================
  // 1) PHASE ALGEBRA v2 (EXTENDED, NOT REORDERED)
  // ==========================================================
  phase.lattice = [
    META, CORE, OPS, SAFE, LEARN, ENV, ID
  ]
  phase.order   = linear
  phase.barrier = strict

  // Allowed: subdomains + annotations (metadata-only)
  phase.subdomains = {
    META:  [scan, variance, align, switch],
    CORE:  [slice, merge, focus, walk],
    OPS:   [dispatch, execute, fold, store],
    SAFE:  [gate, emit, reduce, lookup],
    LEARN: [step, gain, pack, integrate],
    ENV:   [bridge, simulate, persist, broadcast],
    ID:    [boot, fingerprint, bias, signature]
  }

  // Phase compatibility matrix (lattice law)
  // - You may skip masked ABRs, but may not jump phase barriers with unmasked ABRs.
  phase.compat = {
    allow_same_phase_reentry: true,     // deterministic: yes
    allow_cross_phase_with_mask: true,  // mask => treated as absent
    allow_cross_phase_unmasked: false   // hard barrier
  }

  // ==========================================================
  // 2) MASK ALGEBRA v2 (EXTENDED)
  // ==========================================================
  // v1: mask rule set existed but opaque
  // v2: adds explicit mask reason codes + mask density metrics
  abr.mask = {
    eval: pre_execution,
    output: mask_event_optional,   // allowed addition

    reason_codes: [
      "M0_OK",
      "M1_PHASE_INCOMPAT",
      "M2_ENTROPY_SAT",
      "M3_FIXPOINT",
      "M4_COLLAPSE_PRECLUDED",
      "M5_POLICY_DENY",
      "M6_PROOF_PIN_FAIL"
    ],

    density_metrics: {
      masked_in_tick: u8,
      unmasked_in_tick: u8,
      mask_rate_q16: u16  // (masked<<16)/28
    }
  }

  // Mask law invariant (unchanged meaning)
  abr.mask.invariant:
    execute(abr) ⇔ information_gain(abr) > 0

  // ==========================================================
  // 3) COLLAPSE RULE v2 (EXTENDED)
  // ==========================================================
  // v1: single answer deterministic selection.
  // v2: optional multi-answer envelope + deterministic ranking.
  collapse = {
    input: abr.outputs,
    guard: SAFE.domain,
    selection: deterministic,

    // Envelope:
    mode: "single_or_envelope",
    envelope: {
      enabled: optional,
      max_answers: u8(<=8),
      ranking: "deterministic_rank_field",
      tie_break: "stable_hash_order"
    },

    // Always produce a collapsed answer artifact:
    result_block: "ABR_ANSWER"
  }

  collapse.invariant:
    answers_collapse_not_generate

  // ==========================================================
  // 4) REWARD PROPAGATION v2 (EXTENDED)
  // ==========================================================
  // v1: edge-free participation bias only.
  // v2: optional reward field tensors + delayed window attribution.
  reward = {
    model: "edge_free",
    scope: "participation_based",
    propagation: post_collapse,

    // Extension A: structured reward fields (NOT gradients)
    reward_field: {
      enabled: optional,
      dims: u8(<=16),
      type: "bias_vector",
      update: "deterministic_add"
    },

    // Extension B: delayed reward window (multi-tick)
    delayed_window: {
      enabled: optional,
      length_ticks: u8(<=32),
      attribution: "hash_bucketed_participation"
    }
  }

  reward.invariant:
    learning_without_edges

  // ==========================================================
  // 5) PROOF SYSTEM v2 (EXTENDED)
  // ==========================================================
  proof = {
    type: "⚡",
    emission: per_unmasked_abr,
    absence: implies_mask,
    replay: sufficient,

    // Allowed:
    batching: optional,      // compression-only
    cross_shard: optional,   // mesh audit (still deterministic)

    // Forbidden:
    elision: forbidden
  }

  // ==========================================================
  // 6) SCXQ2 .abr FRAMING v2 (EXTENDED)
  // ==========================================================
  scx = {
    encoding: required,
    frames: append_only,
    reorder: forbidden,

    // v2 adds explicit frame kinds (still append-only)
    frame_kinds: [
      "HDR",     // stream header
      "TICK",    // tick boundary + density metrics
      "MASK",    // optional mask event with reason code
      "ABR",     // unmasked abr proof+io summary
      "ANS",     // collapsed answer (single or envelope)
      "RWD",     // reward update field (optional)
      "END"      // stream terminator (optional)
    ]
  }
}

// ============================================================
// ABR REPLAY VERIFIER — PURE π (NO IO, NO HOST CALLS)
// ============================================================
// Goal: consume only ABR frames + referenced hashes and return:
//  ABR_REPLAY_RESULT { @ok, @proof_hash, @failure_stage }
// Stages:
//  S0_PARSE -> S1_HEADER -> S2_TICK_ORDER -> S3_MASK_RULES ->
//  S4_PROOF_HASH -> S5_PHASE_BARRIER -> S6_COLLAPSE -> S7_REWARD -> S8_OK
// ============================================================

pi ABR_Replay_Verifier {

  // ----------------------------- Types -----------------------------
  type U8  = integer(0..255)
  type U16 = integer(0..65535)
  type U32 = integer(0..4294967295)

  // Minimal stable float encoding for hashes (q16.16 fixed)
  fn q16_16(x) -> U32 {
    // deterministic rounding, no float32 dependence
    let s = if x < 0 then 0 else x
    return floor(s * 65536)  // caller must bound as needed
  }

  // Stable stringify for hashing (canonical key order)
  fn canon(obj) -> string {
    // π law: objects are already canonical in .abr frames
    // so canon is identity for frame payload string.
    return obj
  }

  // Deterministic FNV-1a 32-bit
  fn fnv1a32(str) -> U32 {
    let h = 2166136261
    let i = 0
    while i < len(str) {
      h = h xor ord(str[i])
      h = (h + (h<<1) + (h<<4) + (h<<7) + (h<<8) + (h<<24)) mod 4294967296
      i = i + 1
    }
    return h
  }

  fn hex8(u) -> string {
    return to_hex(u, 8) // π primitive
  }

  fn h32(str) -> string {
    return "h:" + hex8(fnv1a32(str))
  }

  // ----------------------------- Constants -----------------------------
  const ABR_COUNT = 28
  const PHASES = ["META","CORE","OPS","SAFE","LEARN","ENV","ID"]

  // Node key order (fixed)
  const ABR_KEYS = [
    "introspect","uncertainty","goal","mode",
    "tokenize","context","attention","reason",
    "routing","exec","compress","memory",
    "safety","generate","correct","knowledge",
    "curriculum","skill","symbolic","feedback",
    "tools","sandbox","state","mesh",
    "splash","fingerprint","persona","heraldry"
  ]

  // Phase boundaries by ABR index (fixed linear partition)
  // 4 per phase: 7*4 = 28
  fn abr_phase(idx) -> string {
    if idx < 4  return "META"
    if idx < 8  return "CORE"
    if idx < 12 return "OPS"
    if idx < 16 return "SAFE"
    if idx < 20 return "LEARN"
    if idx < 24 return "ENV"
    return "ID"
  }

  // ----------------------------- Replay Result -----------------------------
  fn result_ok(final_proof_hash) -> object {
    return {
      "@type":"ABR_REPLAY_RESULT",
      "@ok": true,
      "@proof_hash": final_proof_hash,
      "@failure_stage": "S8_OK"
    }
  }

  fn result_fail(stage, proof_hash) -> object {
    return {
      "@type":"ABR_REPLAY_RESULT",
      "@ok": false,
      "@proof_hash": proof_hash,
      "@failure_stage": stage
    }
  }

  // ----------------------------- Verifier Core -----------------------------
  // Input: frames (already extracted from SCXQ2 .abr stream)
  // Each frame payload is canonical text and carries:
  //  - kind, tick, abr_id, node_key, phase, masked?, mask_reason?,
  //  - inputs_hash, outputs_hash, policy_hash, proof_hash
  fn verify(frames) -> object {

    // S0_PARSE
    if frames == null or len(frames) == 0 {
      return result_fail("S0_PARSE", "h:00000000")
    }

    // S1_HEADER
    if frames[0].kind != "HDR" {
      return result_fail("S1_HEADER", "h:00000000")
    }

    let expected_stream_hash = frames[0].stream_hash  // optional
    let last_tick = -1
    let last_phase = "META"
    let final_proof = "h:00000000"

    // Per-tick accounting
    let tick_masked = 0
    let tick_unmasked = 0
    let tick_seen_abr = 0
    let tick_id = -1

    let i = 1
    while i < len(frames) {
      let f = frames[i]

      // Track tick boundaries
      if f.kind == "TICK" {
        // close previous tick checks (if any)
        if tick_id != -1 {
          // S2_TICK_ORDER: ensure we saw <=28 ABRs per tick
          if tick_seen_abr > ABR_COUNT {
            return result_fail("S2_TICK_ORDER", final_proof)
          }
          // density metrics are advisory; can be recomputed deterministically
        }
        tick_id = f.tick
        if tick_id <= last_tick {
          return result_fail("S2_TICK_ORDER", final_proof)
        }
        last_tick = tick_id
        tick_masked = 0
        tick_unmasked = 0
        tick_seen_abr = 0
        last_phase = "META" // reset phase barrier per tick
        i = i + 1
        continue
      }

      // Mask frames (optional)
      if f.kind == "MASK" {
        // S3_MASK_RULES: reason must be known
        if not is_in(f.reason, [
          "M0_OK","M1_PHASE_INCOMPAT","M2_ENTROPY_SAT","M3_FIXPOINT",
          "M4_COLLAPSE_PRECLUDED","M5_POLICY_DENY","M6_PROOF_PIN_FAIL"
        ]) {
          return result_fail("S3_MASK_RULES", final_proof)
        }
        tick_masked = tick_masked + 1
        i = i + 1
        continue
      }

      // ABR frame (unmasked abr proof summary)
      if f.kind == "ABR" {
        tick_seen_abr = tick_seen_abr + 1

        // S5_PHASE_BARRIER: enforce linear non-decreasing phase for unmasked ABRs
        let ph = f.phase
        if index_of(PHASES, ph) < index_of(PHASES, last_phase) {
          return result_fail("S5_PHASE_BARRIER", final_proof)
        }
        last_phase = ph

        // S4_PROOF_HASH: recompute proof from canonical payload parts
        // proof_payload := {"@type":"⚡", inputs_hash, outputs_hash, policy_hash}
        let proof_payload = "{\"@type\":\"⚡\",\"inputs_hash\":\"" + f.inputs_hash
                         + "\",\"outputs_hash\":\"" + f.outputs_hash
                         + "\",\"policy_hash\":\"" + f.policy_hash + "\"}"

        let proof_hash = h32(proof_payload)

        if proof_hash != f.proof_hash {
          return result_fail("S4_PROOF_HASH", proof_hash)
        }

        final_proof = proof_hash
        tick_unmasked = tick_unmasked + 1
        i = i + 1
        continue
      }

      // Answer collapse frame (optional but if present must verify)
      if f.kind == "ANS" {
        // S6_COLLAPSE: deterministic rank + stable hash tie break
        // Minimal check: answer_hash must equal hash(canon(answer_payload))
        let ans_hash = h32(f.answer_payload_canon)
        if ans_hash != f.answer_hash {
          return result_fail("S6_COLLAPSE", final_proof)
        }
        i = i + 1
        continue
      }

      // Reward frame (optional)
      if f.kind == "RWD" {
        // S7_REWARD: edge-free; must reference participation bucket hashes only
        // Minimal check: reward_hash == hash(canon(reward_payload))
        let rwd_hash = h32(f.reward_payload_canon)
        if rwd_hash != f.reward_hash {
          return result_fail("S7_REWARD", final_proof)
        }
        i = i + 1
        continue
      }

      // END frame (optional)
      if f.kind == "END" {
        break
      }

      // Unknown kind -> fail deterministically
      return result_fail("S0_PARSE", final_proof)
    }

    // Optional: stream hash pin (if provided) must match final proof chaining
    // (Kept as extension; do not fail if absent.)
    return result_ok(final_proof)
  }
}

// ============================================================
// SCXQ2 .abr FRAME EXAMPLE (TEXTUAL CANONICAL FORM)
// ============================================================
// Notes:
// - This is a human-readable canonical representation of frames
// - Real SCXQ2 binary would store symbol lanes + field ids;
//   but the payload canon MUST match what the verifier hashes.
// ============================================================

// ---- FRAME 0: HDR ----
abr_frame HDR {
  v: "2.0.0"
  spec: "ABR_BLACK_CODE_SPEC_v2"
  abr_count: 28
  order: "fixed"
  policy_hash: "xcfe:v2:phase_lattice"
  stream_hash: "h:00000000"   // optional pin (may be omitted)
}

// ---- FRAME 1: TICK ----
abr_frame TICK {
  tick: 0
  masked_in_tick: 0
  unmasked_in_tick: 0
  mask_rate_q16: 0
}

// ---- FRAME 2: ABR (example: introspect, META) ----
abr_frame ABR {
  tick: 0
  abr_id: 0
  node_key: "introspect"
  phase: "META"

  inputs_hash:  "h:2b7c9f10"
  outputs_hash: "h:91d0a4cc"
  policy_hash:  "xcfe:v2:phase_lattice"

  // verifier recomputes:
  // proof_payload = {"@type":"⚡","inputs_hash":"...","outputs_hash":"...","policy_hash":"..."}
  proof_hash:   "h:5e9b0a21"
}

// ---- FRAME 3: MASK (optional mask event) ----
abr_frame MASK {
  tick: 0
  abr_id: 1
  node_key: "uncertainty"
  phase: "META"
  reason: "M2_ENTROPY_SAT"
  // optional: pinned cause hash
  cause_hash: "h:0a1b2c3d"
}

// ---- FRAME 4: ABR (example: goal, META) ----
abr_frame ABR {
  tick: 0
  abr_id: 2
  node_key: "goal"
  phase: "META"
  inputs_hash:  "h:19aa2d01"
  outputs_hash: "h:0cfe7712"
  policy_hash:  "xcfe:v2:phase_lattice"
  proof_hash:   "h:7c0d31f9"
}

// ---- FRAME 5: ANS (single answer) ----
abr_frame ANS {
  tick: 0
  mode: "single"
  answer_payload_canon:
    "{\"@type\":\"ABR_ANSWER\",\"tick\":0,\"text\":\"ok\",\"rank\":0}"
  answer_hash: "h:3a2f1b90"
}

// ---- FRAME 6: RWD (optional reward update) ----
abr_frame RWD {
  tick: 0
  reward_payload_canon:
    "{\"@type\":\"ABR_REWARD\",\"tick\":0,\"dims\":4,\"bias\":[1,0,0,0],\"model\":\"edge_free\"}"
  reward_hash: "h:9d0c11aa"
}

// ---- FRAME 7: END ----
abr_frame END {
  tick: 0
  final_proof_hash: "h:7c0d31f9"
}

// ============================================================
// Minimal "frame extraction" contract for verifier input
// ============================================================
// The verifier expects a list of objects with fields:
//  kind, tick?, phase?, inputs_hash?, outputs_hash?, policy_hash?, proof_hash?,
//  reason?, answer_payload_canon?, answer_hash?, reward_payload_canon?, reward_hash?
//
// The SCXQ2 binary decoder is out-of-scope here by design.
// The .abr stream is considered authoritative once decoded.
// ============================================================
```
