# MX2SVG PWA-Enhanced Configuration

## Overview

`MX2SVG_PWA_ENHANCED.json` extends the base configuration with PWA-related directives. This document lists the PWA-related sections and where to configure them without providing simulated values.

## PWA-related configuration areas

### Core flags

- `@pwa_enabled` appears at the root and within the pipeline to enable PWA generation.
- `@app_building` declares the PWA-focused build mode.

### Symbols and XJSON extensions

- `🧠CORE_MERGE_ARCHITECTURE.kuhul_symbols_as_xjson_operations` defines glyphs for PWA and web app operations.
- `🧠CORE_MERGE_ARCHITECTURE.xjson_extended_with_kuhul` includes `@pwa.generate` and related hooks.

### Pipeline phases

- `@ai.development.@phase.architecture` lists PWA-related outputs (manifest, service worker, and supporting artifacts).
- `@ai.development.@phase.implementation.@tasks[].@assets` specifies asset entries for `manifest.json`, `service-worker.js`, HTML, and icon generation.

### Manifest and asset entries

- `@pwa.generate_manifest` includes keys for manifest metadata, icons, and display settings.
- `@pwa_sw` and `@pwa_html` mark the service worker and HTML assets.
- `@pwa_icons` identifies icon generation entries.

## How to use the enhanced configuration

1. Start from `MX2SVG_PWA_ENHANCED.json` if you want the PWA directives present by default.
2. Update `@project`, `@workspace`, and any manifest or asset metadata fields to match your project.
3. Adjust the asset list under `@phase.implementation` if you need different filenames or additional PWA files.
