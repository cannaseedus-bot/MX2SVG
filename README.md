# MX2SVG

MX2SVG is a configuration-driven system for generating SVG workflows and related assets. This repository includes the core configuration, tokenizer assets, and an enhanced PWA-capable configuration with supporting documentation.

## Repository contents

All files live in the repository root (there are no subdirectories). The list below documents every file and its role:

| File | Description |
| --- | --- |
| `README.md` | Project overview, quick start, and documentation pointers. |
| `MX2SVG.json` | Baseline MX2SVG configuration for the autonomous workflow runtime. |
| `MX2SVG_PWA_ENHANCED.json` | PWA-enhanced configuration with manifest, service worker, HTML, and icon generation support enabled by default. |
| `MX2SVG_PWA_README.md` | Detailed guide to the PWA enhancements and usage. |
| `MX2SVG_ENHANCEMENT_SUMMARY.md` | Summary of the PWA enhancement work and resulting capabilities. |
| `tokenizer.json` | Tokenizer definition (normalization, BPE setup, and added tokens) for MX2SVG-related workflows. |
| `tokenizer.py` | Script that loads the Qwen2 base model/tokenizer, adds custom tokens, and saves updated artifacts. |
| `abi.json` | ABI metadata describing the base model, token counts, and compatibility rules. |

## Quick start

1. Use the enhanced configuration:

   ```bash
   cp MX2SVG_PWA_ENHANCED.json MX2SVG.json
   ```

2. Enable PWA generation in your project configuration:

   ```json
   {
     "@project": "my_pwa_app",
     "@pwa_enabled": true
   }
   ```

## Documentation

Start with `MX2SVG_PWA_README.md` for setup, configuration, and examples. Use `MX2SVG_ENHANCEMENT_SUMMARY.md` for a high-level overview of the PWA capabilities.
