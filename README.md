# MX2SVG

MX2SVG is a configuration-driven system for defining SVG-centric workflows, tensor-friendly SVG assets, and sealed, auditable pipeline components. This repository includes core configuration files, tokenizer assets, Micronaut orchestration artifacts, and documentation describing deterministic batch handling and PWA-ready setups.

## Why the name MX2SVG

MX2SVG is rooted in a signature SVG visualization of the complete brain cluster concept. The original artwork and embedded runtime are preserved in `MX2SVG_ORIGIN.svg`, which documents the 28-node cluster and RLHF storage controls that inspired the project's name and visual language.

## Repository contents

Most assets live in the repository root. Documentation now lives under `docs/`, and the `micronaut/` directory holds the SCO/1 object layout and PowerShell orchestrator described below. The list below documents the key files and directories and their roles:

| File | Description |
| --- | --- |
| `README.md` | Project overview, quick start, and documentation pointers. |
| `MX2SVG.json` | Baseline MX2SVG configuration for the autonomous workflow runtime. |
| `MX2SVG_PWA_ENHANCED.json` | PWA-enhanced configuration with manifest, service worker, HTML, and icon generation support enabled by default. |
| `docs/MX2SVG_PWA_README.md` | Guide to the PWA enhancements and configuration references. |
| `docs/MX2SVG_ENHANCEMENT_SUMMARY.md` | Summary of the PWA enhancement entries. |
| `MX2SVG_ORIGIN.svg` | Original SVG visualization that inspired the MX2SVG name and cluster concept. |
| `docs/ABR_BLACK_CODE_SPEC_v2.0.0.md` | ABR Black Code v2.0.0 full draft specification with π verifier and SCXQ2 framing examples. |
| `ggltensors_pack_v1.json` | Frozen Plane-2 ggltensors pack contract describing inputs, outputs, and proof hash rules. |
| `scxq2_ggl_frames_layout_v1.js` | SCXQ2 binary lane layout and schema mapping for GGL frame streams. |
| `transformers_py_to_ggl_v1.py` | Python adapter for sealed Plane-2 GGL inference with pack hashing and SCXQ2 frame stubs. |
| `ggl_sealed_compute_v1.js` | Contract, hashing, and kernel hook scaffolding for sealed GGL inference plus minimal verifier. |
| `ggl_sealed_locks_v1.js` | Locked contracts, lane layout, barrier policy, and adapter ABI rules for Plane-2 sealed compute. |
| `index.html` | Experimental PWA UI with chat form and service worker messaging. |
| `tokenizer.json` | Tokenizer definition (normalization, BPE setup, and added tokens) for MX2SVG-related workflows. |
| `tokenizer.py` | Script that loads the Qwen2 base model/tokenizer, adds custom tokens, and saves updated artifacts. |
| `abi.json` | ABI metadata describing the base model, token counts, and compatibility rules. |
| `docs/SVG_TENSOR_CLUSTER_BATCH.md` | Declarative cluster batch specification for staging, verifying, and mirroring SVG-Tensor objects. |
| `docs/micronaut/MICRONAUT_SPEC.md` | Micronaut layout/design specification for the SCO/1 object. |
| `micronaut/` | SCO/1 Micronaut object layout, sealed brains, IO records, and PowerShell orchestrator. |

## What MX2SVG is

MX2SVG is a declarative toolkit for:

- describing SVG-centric tensor objects and their metadata
- defining deterministic, non-executing batch manifests for staging and verification
- packaging tokenizer and configuration assets for model-adjacent workflows
- orchestrating sealed, file-centric IO via Micronaut (SCO/1)

## What MX2SVG can do

- Generate configuration-driven SVG pipelines and PWA-ready assets.
- Stage and verify SVG-Tensor objects via declarative batch manifests.
- Enforce append-only, auditable IO flows using the Micronaut SCO/1 orchestrator.
- Preserve proof/trace artifacts for downstream verification.
- Provide tokenizer assets and configuration scaffolding for model-integrated workflows.

## Applications and domains

MX2SVG is suited for:

- SVG-based visualization workflows and deterministic graphics pipelines.
- Model-adjacent processing where auditability and sealed IO are required.
- PWA-enabled SVG delivery for interactive or offline-first deployments.
- Research prototypes in graphics/ML interoperability and verification-centric pipelines.

## Phase list (with completion status)

The repository defines phases in multiple contexts. The list below consolidates every phase-like entry found across the configuration and tokenizer assets.

### AI development pipeline phases

These phases appear in both `MX2SVG.json` and `MX2SVG_PWA_ENHANCED.json` under `@ai.development`:

- [x] `@phase.planning`
- [x] `@phase.architecture`
- [x] `@phase.implementation`
- [ ] `@phase.validation`
- [ ] `@phase.release`

### SCX2 compression phases

These appear in the `@scx2_compression.@phases` list in both configurations:

- [x] `tokenize → geometric_symbols`
- [x] `entangle → contextual_encoding`
- [x] `superpose → frequency_transform`
- [x] `collapse → arithmetic_coding`

### Tokenizer phase tokens

The tokenizer defines phase tokens in `tokenizer.json`:

- [x] `[Pop]`
- [x] `[Wo]`
- [x] `[Ch'en]`
- [x] `[Yax]`
- [x] `[Sek]`
- [x] `[Xul]`

## To-do list

- [ ] Add executable PWA service worker and manifest assets to match the enhanced configuration.
- [ ] Publish reference batch conformance tests for SVG-Tensor cluster manifests.
- [ ] Expand Micronaut automation with snapshotting and replay tools.
- [ ] Add a validation harness for tokenizer artifacts and ABI consistency.

## Quick start

1. Use the enhanced configuration:

   ```bash
   cp MX2SVG_PWA_ENHANCED.json MX2SVG.json
   ```

2. Enable PWA generation by setting `@pwa_enabled` and defining `@project` in your project configuration.

## Documentation

Start with `docs/MX2SVG_PWA_README.md` for setup and configuration references. Use `docs/MX2SVG_ENHANCEMENT_SUMMARY.md` for a high-level overview of the PWA entries. The SVG-Tensor batch spec is in `docs/SVG_TENSOR_CLUSTER_BATCH.md`.

## Micronaut SCO/1 object

The `micronaut/` directory collapses the prior placeholder into a file-centric SCO/1 object. PowerShell only orchestrates append-only IO; inference and validation remain sealed inside the object contract. The canonical IO record formats live in `micronaut/semantics.xjson`, with chat appends to `micronaut/io/chat.txt` and semantic emission to `micronaut/io/stream.txt`. See `docs/micronaut/MICRONAUT_SPEC.md` for the full Micronaut layout and design.

## Ollama App model assets

MX2SVG targets the Ollama App for local model management and a built-in REST API. On Windows, Ollama provides the default model management layer; on Linux, you can swap in Llama or other backends. MX2SVG treats this environment as the Micronaut "agent" layer, and Qwen models remain supported through the same Ollama pipeline.

### Files included (model-agnostic)

- `tokenizer.json`
- `config.json`
- `tokenizer_config.json`
- `vocab.json`
- `merges.txt`
- `added_tokens.json`
- `special_tokens_map.json`
- `generation_config.json`
- `chat_template.jinja`
- `local_model_config.json`
