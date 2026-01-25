# MX2SVG

MX2SVG is a configuration-driven system for generating SVG workflows and related assets. This repository includes the core configuration, tokenizer assets, and an enhanced PWA-capable configuration with supporting documentation, plus formal SVG-3D tensor and K'UHUL COSMOS specifications.

## Why the name MX2SVG

MX2SVG is rooted in a signature SVG visualization of the complete brain cluster concept. The original artwork and embedded runtime are preserved in `MX2SVG_ORIGIN.svg`, which documents the 28-node cluster and RLHF storage controls that inspired the project's name and visual language.

## Repository contents

All files live in the repository root (there are no subdirectories). The list below documents every file and its role:

| File | Description |
| --- | --- |
| `README.md` | Project overview, quick start, and documentation pointers. |
| `MX2SVG.json` | Baseline MX2SVG configuration for the autonomous workflow runtime. |
| `MX2SVG_PWA_ENHANCED.json` | PWA-enhanced configuration with manifest, service worker, HTML, and icon generation support enabled by default. |
| `MX2SVG_PWA_README.md` | Guide to the PWA enhancements and configuration references. |
| `MX2SVG_ENHANCEMENT_SUMMARY.md` | Summary of the PWA enhancement entries. |
| `MX2SVG_ORIGIN.svg` | Original SVG visualization that inspired the MX2SVG name and cluster concept. |
| `ABR_BLACK_CODE_SPEC_v2.0.0.md` | ABR Black Code v2.0.0 full draft specification with π verifier and SCXQ2 framing examples. |
| `ggltensors_pack_v1.json` | Frozen Plane-2 ggltensors pack contract describing inputs, outputs, and proof hash rules. |
| `scxq2_ggl_frames_layout_v1.js` | SCXQ2 binary lane layout and schema mapping for GGL frame streams. |
| `transformers_py_to_ggl_v1.py` | Python adapter for sealed Plane-2 GGL inference with pack hashing and SCXQ2 frame stubs. |
| `ggl_sealed_compute_v1.js` | Contract, hashing, and kernel hook scaffolding for sealed GGL inference plus minimal verifier. |
| `ggl_sealed_locks_v1.js` | Locked contracts, lane layout, barrier policy, and adapter ABI rules for Plane-2 sealed compute. |
| `manifest.json` | Experimental PWA manifest for the ΩOS/SVG-3D runtime metadata. |
| `index.html` | Dark two-panel session/chat UI that connects to the ΩOS service worker. |
| `sw.js` | ΩOS service worker kernel with brain registry and API routing. |
| `MX2SVG.xml` | MX2SVG model specification (CLI pipeline, inference engines, WebGPU templates). |
| `SVG3D_TENSOR_CORE.xml` | SVG-3D tensor core specification (manifolds, primitives, legality). |
| `ASX_R_ENGINE.xml` | ASX-R geometric reasoning engine specification. |
| `PI_GEOMETRIC_TENSOR_EQUIVALENCE.md` | Mapping between ML tensor concepts and π-geometric constructs. |
| `KUHUL_COSMOS_IDB_HYPERVISOR.cosmos` | COSMOS spec for the IndexedDB hypervisor integration. |
| `tokenizer.json` | Tokenizer definition (normalization, BPE setup, and added tokens) for MX2SVG-related workflows. |
| `tokenizer.py` | Script that loads the Qwen2 base model/tokenizer, adds custom tokens, and saves updated artifacts. |
| `abi.json` | ABI metadata describing the base model, token counts, and compatibility rules. |

## Phase list (from repository files)

The repository defines phases in multiple contexts. The list below consolidates every phase-like entry found across the configuration and tokenizer assets.

### AI development pipeline phases

These phases appear in both `MX2SVG.json` and `MX2SVG_PWA_ENHANCED.json` under `@ai.development`:

- `@phase.planning`
- `@phase.architecture`
- `@phase.implementation`

### SCX2 compression phases

These appear in the `@scx2_compression.@phases` list in both configurations:

- `tokenize → geometric_symbols`
- `entangle → contextual_encoding`
- `superpose → frequency_transform`
- `collapse → arithmetic_coding`

### Tokenizer phase tokens

The tokenizer defines phase tokens in `tokenizer.json`:

- `[Pop]`
- `[Wo]`
- `[Ch'en]`
- `[Yax]`
- `[Sek]`
- `[Xul]`

## Quick start

1. Use the enhanced configuration:

   ```bash
   cp MX2SVG_PWA_ENHANCED.json MX2SVG.json
   ```

2. Enable PWA generation by setting `@pwa_enabled` and defining `@project` in your project configuration.

## Documentation

Start with `MX2SVG_PWA_README.md` for setup and configuration references. Use `MX2SVG_ENHANCEMENT_SUMMARY.md` for a high-level overview of the PWA entries.

## Qwen2 1.5B assets

This repository includes tokenizer and configuration artifacts for the Qwen2 1.5B model. Model weights are not stored in this repo.

### Files included

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
