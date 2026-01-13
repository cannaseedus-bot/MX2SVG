# MX2SVG

MX2SVG is a configuration-driven system for generating SVG workflows and related assets. This repository includes the core configuration, tokenizer assets, and an enhanced PWA-capable configuration with supporting documentation.

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
| `manifest.json` | Experimental PWA manifest that stores SVG/JSON tokenization payloads. |
| `index.html` | Experimental PWA UI with chat form and service worker messaging. |
| `sw.js` | Service worker orchestration for tokenization and model loading. |
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
