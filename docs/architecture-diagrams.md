# Architecture diagrams

The system on one page: how the monorepo layers fit, how a device pairs and how
a sync exchange flows, and where every byte of on-device state lives. Kept current with the
code (see `/diagram`); a wrong diagram is worse than none.

## The monorepo

Presentation calls use cases through two composition roots; every rule lives in
core behind ports; adapters own the storage. Solid edges are calls, dotted
edges are "implements a `domain/` port".

```mermaid
graph TD
  subgraph web["apps/web — presentation only"]
    SC["Server components (pages)"]
    CC["Client components"]
    ROOTS["container.ts (server-safe root)"]
    ROOTC["client-container.ts (client root)"]
    ADAPT["localStorage adapters (album-store, economy-store, trend-store, …)"]
    REMOTE["SupabaseProgressStore"]
  end

  subgraph core["@learn-spanish/core"]
    APP["application/ — use cases (one execute())"]
    DOM["domain/ — rules + ports"]
    INFRA["infrastructure/ — static deck & sentence packs"]
  end

  CONFIG["@learn-spanish/config — zod env + JSON logger"]
  LS[("localStorage")]
  SB[("Supabase progress row (optional, ADR 004)")]

  SC --> ROOTS
  CC --> ROOTC
  ROOTS --> APP
  ROOTC --> APP
  ROOTS --> INFRA
  ROOTC --> ADAPT
  ROOTC --> REMOTE
  APP --> DOM
  INFRA -.->|"implements DeckRepository, …"| DOM
  ADAPT -.->|"implements EconomyStore, AlbumStore, …"| DOM
  REMOTE -.->|"implements RemoteProgressStore"| DOM
  ADAPT --> LS
  REMOTE --> SB
  web --> CONFIG
```

## Pairing a device by QR (ADR 011)

How a second device gets the capability key before any of the exchanges below
can happen. The code rides in the URL **fragment**, so it never reaches the
server; device B strips it from its own address bar before the parent answers,
and pairs only on an explicit yes.

```mermaid
sequenceDiagram
  participant A as Device A (paired)
  participant P as Parent + camera
  participant B as Device B (fresh)
  participant SY as sync.ts (on B)
  participant DB as Supabase progress row

  A->>A: buildSyncLink(origin, code) → https://…/#sync=CODE
  A->>A: encodeQr(link) → SVG
  P->>A: scans the QR with B's own camera app
  P->>B: opens https://…/#sync=CODE
  B->>B: parseSyncLink(location.hash) → CODE
  B->>B: history.replaceState → key out of the URL
  B-->>P: "¿Conectar este dispositivo?"
  P->>B: Sí, conectar
  B->>SY: joinWithCode(CODE)
  SY->>DB: load(code) — must already exist
  DB-->>SY: snapshot json
  SY->>SY: merge + apply, then push the union back
  SY-->>B: joined → reload into merged progress
```

## A sync exchange (ADR 004)

Local-first: reads never wait on the network. The app pulls on open (and when
the tab becomes visible again) and pushes on game complete; every remote
payload passes the sanitizer before the additive merge, so nothing malformed
or destructive can come in.

```mermaid
sequenceDiagram
  participant UI as HomeView / DoneScreen
  participant SY as sync.ts (orchestration)
  participant UC as Use Case (Pull/PushProgress)
  participant RS as SupabaseProgressStore
  participant DB as Supabase progress row

  Note over UI,DB: pull — app open or tab becomes visible
  UI->>SY: syncPull()
  SY->>UC: execute(code, currentSnapshot())
  UC->>RS: load(code)
  RS->>DB: rpc get_progress(code)
  DB-->>RS: snapshot json (or null)
  RS-->>UC: sanitizeSnapshot(json)
  UC-->>SY: mergeProgress(local, remote)
  SY->>SY: applySnapshot(merged) → stores

  Note over UI,DB: push — game complete or chest claim
  UI->>SY: syncPush()
  SY->>UC: execute(code, currentSnapshot())
  UC->>RS: load(code) + merge(remote, local)
  UC->>RS: save(code, merged)
  RS->>DB: rpc put_progress(code, merged)
```

Concurrent pushes are last-write-wins on the row and self-heal on the next
exchange — recorded, with the options for changing it, in the ADR 004
addendum.

## localStorage key inventory

Everything the app persists on a device. "Synced" means the value rides the
`ProgressSnapshot` (cross-device sync and the transfer code); per-device
pointers and presentation choices deliberately do not (ADR 004). Schema moves
between keys happen only in `storage-migrations.ts`.

| Key | Owner | Holds | Synced |
| --- | --- | --- | --- |
| `palabras.kid.v1` | `lib/kid.ts` | which kid is selected on this device | no (pointer) |
| `palabras.avatars.v1` | `lib/kid.ts` | each kid's chosen avatar | yes |
| `palabras.album.v1` | `lib/album-store.ts` | earned sticker ids | yes |
| `palabras.streaks.v1` | `lib/streak-store.ts` | daily ☀️ streak per kid | yes |
| `palabras.word-stats.v1` | `lib/word-stats-store.ts` | right/wrong tallies per word | yes |
| `palabras.stars.v1` | `lib/economy-store.ts` | ⭐ wallet per kid | yes |
| `palabras.mission.v1` | `lib/economy-store.ts` | today's misión state | yes |
| `palabras.pets.v2` | `lib/economy-store.ts` | pet collections | yes |
| `palabras.pet.v1` | migration source only | legacy single pet | legacy |
| `palabras.sticker-counts.v1` | `lib/economy-store.ts` | completion counts (tiers) | yes |
| `palabras.owned-avatars.v1` | `lib/economy-store.ts` | bought avatars | yes |
| `palabras.owned-accessories.v1` | `lib/economy-store.ts` | wardrobe ownership | yes |
| `palabras.unlocks.v1` | `lib/economy-store.ts` | secret-deck unlocks | yes |
| `palabras.weekly.v1` | `lib/economy-store.ts` | 🔥 weekly streak | yes |
| `palabras.week-progress.v1` | `lib/economy-store.ts` | this week's active days | yes |
| `palabras.freezes.v1` | `lib/economy-store.ts` | ❄️ escudos | yes |
| `palabras.category-awards.v1` | `lib/economy-store.ts` | claimed chest tiers per deck | yes |
| `palabras.reto.v1` | `lib/economy-store.ts` | best reto scores | no (per-device) |
| `palabras.trend.v1` | `lib/trend-store.ts` | weekly learned-words samples | no (derived from synced stats) |
| `palabras.sync.v1` | `lib/sync.ts` | the pairing code (capability key) | no (device pairing) |
| `palabras.theme.v1` / `palabras.owned-themes.v1` | `lib/theme.ts` | paper theme selection/ownership | no (per-device look) |
| `palabras.migrations.v1` | `lib/storage-migrations.ts` | applied migration ids | no (device bookkeeping) |
