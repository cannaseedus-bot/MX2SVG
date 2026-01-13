# MX2SVG

MX2SVG is a configuration-driven system for generating SVG workflows and related assets. This repository includes the core configuration, tokenizer assets, and an enhanced PWA-capable configuration with supporting documentation.

## Repository contents

- `MX2SVG.json`: Baseline configuration.
- `MX2SVG_PWA_ENHANCED.json`: PWA-enhanced configuration with manifest, service worker, HTML, and icon generation support.
- `MX2SVG_PWA_README.md`: Detailed guide to the PWA enhancements and usage.
- `MX2SVG_ENHANCEMENT_SUMMARY.md`: Summary of the PWA enhancement work.
- `tokenizer.json` / `tokenizer.py`: Tokenizer assets.
- `abi.json`: ABI definition.

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
