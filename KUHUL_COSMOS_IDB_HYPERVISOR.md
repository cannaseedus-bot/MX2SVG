# K'UHUL COSMOS: IndexedDB Hypervisor Integration (Spec Draft)

## Overview

IndexedDB is the universal browser persistence layer for COSMOS. The hypervisor treats IDB as a first-class execution substrate, coordinating schema, migration, caching, and synchronization for π-geometric data.

## 1) IDB virtual environment

```
IDBEnvironment ::=
    "⏚idb" [ Block | Parameters | SchemaDefinition ]

SchemaDefinition ::=
    "schema" "{" Version "," ObjectStores "}"
  | "migrate" ":" MigrationScripts
```

## 2) Universal IDB operations

```
IDBOperation ::=
    "@idb" OperationType [ Parameters | TransactionScope ]

OperationType ::=
    "get" | "put" | "add" | "delete" | "clear"
  | "count" | "openCursor" | "index"
  | "transaction" | "migrate" | "backup"
  | "restore" | "sync" | "replicate"
```

## 3) COSMOS → IDB data mapping

| COSMOS Type | IDB Form | Encoding |
| --- | --- | --- |
| Glyph | Blob | glyph_encoder |
| πScalar | Float64Array | π_encoding |
| Tensor | ArrayBuffer | tensor_packing |
| Object&lt;P&gt; | structured clone | native |
| Reference | key reference | pointer |

## 4) Canonical IDB hypervisor spec (v8)

```
⏚idb
  name: "cosmic_browser_store"
  version: 8
  quota: "unlimited"
  persistence: "persistent"

  schema {
    version: 8,
    stores: {
      "cosmic_data": {
        keyPath: "id",
        autoIncrement: false,
        indices: {
          "type": { keyPath: "data_type", unique: false },
          "created": { keyPath: "timestamp", unique: false },
          "fold": { keyPath: "fold_domain", unique: false },
          "π_phase": { keyPath: "phase_value", unique: false }
        }
      },
      "glyphs": {
        keyPath: "glyph_id",
        autoIncrement: true,
        indices: {
          "shape": { keyPath: "shape_type", unique: false },
          "complexity": { keyPath: "vertex_count", unique: false },
          "bounds": { keyPath: "bounding_box", multiEntry: true }
        }
      },
      "π_values": {
        keyPath: "π_id",
        indices: {
          "phase": { keyPath: "phase", unique: false },
          "amplitude": { keyPath: "amplitude", unique: false },
          "period": { keyPath: "period", unique: false }
        }
      },
      "fold_states": {
        keyPath: ["fold_type", "instance_id"],
        indices: {
          "connections": { keyPath: "connected_folds", multiEntry: true },
          "health": { keyPath: "health_score", unique: false },
          "last_sync": { keyPath: "sync_timestamp", unique: false }
        }
      },
      "micronauts": {
        keyPath: "agent_id",
        indices: {
          "type": { keyPath: "agent_type", unique: false },
          "status": { keyPath: "status", unique: false },
          "federation": { keyPath: "federation_id", unique: false }
        }
      },
      "cosmic_log": {
        keyPath: "log_id",
        autoIncrement: true,
        indices: {
          "timestamp": { keyPath: "timestamp", unique: false },
          "operation": { keyPath: "operation_type", unique: false },
          "fold": { keyPath: "affected_fold", unique: false },
          "phase": { keyPath: "π_phase", unique: false }
        }
      },
      "geometry_cache": {
        keyPath: "hash",
        indices: {
          "glyph": { keyPath: "glyph_id", unique: false },
          "operation": { keyPath: "operation_type", unique: false },
          "complexity": { keyPath: "computation_cost", unique: false }
        }
      }
    }
  }
```

## 5) Hierarchical persistence strategy

```
Memory → SessionStorage → IDB → Service Worker cache → Cloud
```

Reads prefer local layers; writes commit to IDB and sync asynchronously with π-phase conflict resolution.

## 6) IDB hypervisor operations (canonical)

### 6.1 Universal put

```
@idb universal_put
  transaction: readwrite, ["cosmic_data", "cosmic_log"]
  put cosmic_data: { ... }
  put cosmic_log: { ... }
  &result: "put_confirmation"
```

### 6.2 Intelligent get

```
@idb intelligent_get
  transaction: readonly, ["cosmic_data", "geometry_cache"]
  get geometry_cache: "hash(key, operation)"
  else: get cosmic_data: "key"
```

### 6.3 Fold-state synchronized ops

```
@idb fold_operation
  transaction: readwrite, ["fold_states", "cosmic_data", "cosmic_log"]
```

### 6.4 π-phase synchronized queries

```
@idb π_phase_query
  open_cursor index: "π_phase"
  integrate: "π_phase_alignment"
```

## 7) Conflict resolution (π-phase)

```
if phase_difference < 0.01π: merge_auto
else if local_phase > remote_phase: keep_local
else keep_remote
```

## 8) Service worker integration (headless)

Service worker caching is projection-only. It never renders tensors; it caches and syncs geometric payloads and manifests.

## 9) Next hard steps

1. Formalize IDB encoding for SVG-3D tensor payloads.
2. Lock migration invariants for π-phase histories.
3. Define legality checks for geometry cache entries.
4. Specify deterministic compression hooks (SCXQ2 lanes).
