# K'UHUL COSMOS: IndexedDB Hypervisor Integration

This document captures the IndexedDB hypervisor vision and the Cosmos IDB orchestration grammar for persistent browser execution.

## IDB Environment (Grammar)

```cosmos
IDBEnvironment ::=
    "⏚idb" [ Block | Parameters | SchemaDefinition ]

SchemaDefinition ::=
    "schema" "{" Version "," ObjectStores "}"
  | "migrate" ":" MigrationScripts

ObjectStores ::= ObjectStore { "," ObjectStore }
ObjectStore ::= StoreName ":" StoreSchema

StoreSchema ::=
    "{" SchemaProperties "}"
  | "%template" "with" IndexSpecs

SchemaProperties ::=
    "keyPath" ":" KeyPath
    "autoIncrement" ":" Boolean
    "indices" ":" IndexList

IndexList ::= Index { "," Index }
Index ::= IndexName ":" IndexSpec
IndexSpec ::=
    "{" "keyPath" ":" KeyPath
        [ "," "unique" ":" Boolean ]
        [ "," "multiEntry" ":" Boolean ] "}"
```

## Universal IDB Operations

```cosmos
IDBOperation ::=
    "@idb" OperationType [ Parameters | TransactionScope ]

OperationType ::=
    "get" | "put" | "add" | "delete" | "clear"
  | "count" | "openCursor" | "index"
  | "transaction" | "migrate" | "backup"
  | "restore" | "sync" | "replicate"

TransactionScope ::=
    "transaction" "{" TransactionMode "," Stores "}"
  | "readonly" ":" Stores
  | "readwrite" ":" Stores

TransactionMode ::=
    "readonly" | "readwrite" | "versionchange"

Stores ::= StoreName { "," StoreName }
```

## Cosmic ↔ IDB Data Mapping

```cosmos
CosmicToIDB ::=
    "$cosmic" "→" "⏚idb" ":" MappingRules
  | "⏚idb" "→" "$cosmic" ":" ReverseMapping

MappingRules ::=
    "types" ":" TypeMapping
    "values" ":" ValueTransformation
    "relationships" ":" RelationshipMapping

TypeMapping ::=
    "Glyph" "→" "Blob" "with" "glyph_encoder"
    "πScalar" "→" "Float64Array" "with" "π_encoding"
    "Tensor" "→" "ArrayBuffer" "with" "tensor_packing"
    "Object" "<" P ">" "→" "structured_clone"
    "Reference" "→" "key_reference"

ValueTransformation ::=
    "compress" ":" CompressionMethod
    "encrypt" ":" EncryptionKey
    "validate" ":" ValidationRules
    "version" ":" DataVersion
```

## IndexedDB Hypervisor Definition

```cosmos
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

  migrate {
    from: 7,
    to: 8,
    operations: [
      "add_store('geometry_cache')",
      "add_index('cosmic_data', 'π_phase')",
      "update_indices('fold_states', {add: ['last_sync']})",
      "compress_old_data('glyphs', 'mesh_compression_v2')"
    ]
  }
```

## Persistence Stack Orchestration

```cosmos
@browser_persistence_stack
  $memory_cache: {
    type: "Map",
    max_size: 10000,
    eviction_policy: "LRU",
    &memory: "volatile_cache"
  }

  ⏚session_storage
    quota: "5MB"
    namespace: "cosmic_session"
    store: {
      "ui_state": "$ui_state",
      "navigation": "$navigation_state",
      "form_data": "$form_cache",
      "scroll_positions": "$scroll_cache"
    }
    &session: "tab_persistence"

  ⏚idb "cosmic_primary_store"
    schema_version: 8
    estimated_size: "500MB"
    @preload_critical
      stores: ["fold_states", "cosmic_data", "glyphs"]
      priority: "high"
      &preloaded: "critical_data_loaded"

    @background_sync
      interval: "30s"
      operations: [
        "compress_old_entries",
        "update_indices",
        "validate_integrity",
        "replicate_to_server"
      ]
      &sync_job: "background_maintenance"

  ⏚service_worker
    cache_name: "cosmic-v8"
    strategies: {
      "critical": "cache-first",
      "cosmic_data": "stale-while-revalidate",
      "glyphs": "cache-only",
      "π_values": "network-first"
    }
    precache: [
      "/cosmic-core.js",
      "/cosmic-geometry.wasm",
      "/glyph-templates.json",
      "/π-constants.dat"
    ]
    &sw_cache: "offline_cache"
```

## Example: E-Commerce Cosmos IDB

```cosmos
@cosmic_ecommerce_idb
  ⏚idb "cosmic_shop"
    version: 3
    schema {
      version: 3,
      stores: {
        "users": {
          keyPath: "user_id",
          indices: {
            "email": { keyPath: "email", unique: true },
            "session": { keyPath: "session_token", unique: true },
            "last_active": { keyPath: "last_active", unique: false }
          }
        },
        "products": {
          keyPath: "product_id",
          indices: {
            "category": { keyPath: "category", unique: false },
            "price_range": { keyPath: "price", unique: false },
            "in_stock": { keyPath: "stock_count", unique: false },
            "glyph_shape": { keyPath: "shape_type", unique: false }
          }
        },
        "cart": {
          keyPath: ["user_id", "product_id"],
          indices: {
            "user": { keyPath: "user_id", unique: false },
            "added": { keyPath: "added_at", unique: false }
          }
        },
        "orders": {
          keyPath: "order_id",
          autoIncrement: true,
          indices: {
            "user": { keyPath: "user_id", unique: false },
            "status": { keyPath: "status", unique: false },
            "date": { keyPath: "order_date", unique: false },
            "total": { keyPath: "total_amount", unique: false }
          }
        }
      }
    }
```
