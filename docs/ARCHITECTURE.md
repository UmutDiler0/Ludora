# Ludora — Technical Architecture

**Product:** Ludora (working design name: *Party Game Hub*)
**Type:** Realtime social party-game platform, mobile-first
**Status:** Architecture definition. No feature implementation yet — per spec §44, architecture precedes code.
**Design source:** Google Stitch project `Party Game Hub` (`projects/7788001820259477668`), 24 mobile screens.

---

## 0. How to read this document

This document answers the required deliverable list in spec §46 and resolves the 15 critical questions in §45. It is the contract that implementation follows. Where this document contradicts an ad-hoc decision made later in code, this document is wrong and must be updated — not silently diverged from.

Section numbers below are Ludora's own. References like *(spec §13)* point back to the product specification.

---

## 1. Design-vs-spec reconciliation

**Revised after a visual audit of the rendered screens.** The first pass of this section worked from screen titles and found four conflicts. Reading the actual pixels found nine, several of them larger — including two parallel app shells, five different app names, and an entire required subsystem (chat) that the specification never mentions.

These are product decisions, not implementation details, and they are resolved here so routing and data modelling can proceed.

### 1.1 Tab bar conflict — **four different tab bars exist**

Verified by reading the rendered screenshots, not the screen titles. The designs do not merely disagree with the spec; **they disagree with each other.**

| Source | Tabs | Screens using it |
| --- | --- | --- |
| Spec §3 | Home · Mücadele · Oyna · Profil | — |
| **Shell A** | Games · Rooms · Avatar · Shop | Home Dashboard, Game Browser, Avatar Shop |
| **Shell B** | Home · History · Awards · Social | Player Profile, Achievements |
| **In-game** | Game · Roles · Chat · Log | Day Phase |
| **In-game (variant)** | Game · Roles · Log · Settings | Game Log |

Shell A and Shell B are two parallel app shells with no overlap beyond "Home". Shell B introduces **Social** — a friends system that appears nowhere in the 46-section spec. The in-game bar is legitimately a nested navigator, but it too differs between its own two screens (Chat vs Settings in the same slot).

**Resolution adopted:** follow the **spec §3** structure. Leaderboards carry two full spec sections plus a scheduled backend job, yet neither Shell A nor Shell B gives them an entry point. Shell A's `Shop`/`Avatar` and Shell B's `History`/`Awards` all nest under `Profil` per spec §34. The in-game bar becomes a session-scoped nested navigator: **Game · Roles · Chat · Log**.

**Decided as D1.** Reversible, but it changes the route tree, so it is the most expensive entry in the register to overturn later.

### 1.1b App name is inconsistent across five screens

| Screen | Name shown |
| --- | --- |
| Home Dashboard | PARTY HUB |
| Game Browser | ARCADE.IO |
| Multiplayer Lobby | ARCADE_HUB |
| Avatar Shop | Party Game Hub |
| Player Profile, Achievements | LUMINA HUB |

Achievements body copy also reads *"Track your legacy across the **Lumina** universe."* — the naming is baked into content, not just headers. The product is **Ludora**; none of the five match. All brand strings must come from one constant, and the designs need re-exporting with it.

### 1.2 Role naming

Designs ship three roles: **Vampire, Seer, Bodyguard**. Spec §13 lists free roles as Villager, Vampire, Doctor, Detective.

**Resolution:** treat the design names as canonical player-facing names and map them onto spec archetypes:

| Design name | Spec archetype | Function |
| --- | --- | --- |
| Vampire | Vampire | Night kill |
| Seer | Detective | Night investigate |
| Bodyguard | Doctor | Night protect |
| *(no design)* | Villager | No night action |

Role identity lives in data (`game_definitions`), never in component names, so renaming later is a content edit.

### 1.3 Design coverage is Phase 1–3 only

Mapping all 24 screens against the spec §34 navigation tree:

**Covered by a design (24):** Splash · Onboarding ×3 · Login · Register · Forgot Password · Home Dashboard · Game Browser · Multiplayer Lobby · Game Log · Role Reveal ×3 · Night Phase ×3 · Day Phase · Game Over · Player Profile ×2 · Avatar Shop · Avatar Customizer · Achievements

**Specified but undesigned (11 routes):**

| Missing route | Spec ref | Blocks |
| --- | --- | --- |
| Leaderboard — daily | §8 | Phase 4 |
| Leaderboard — weekly | §8 | Phase 4 |
| Play hub | §9 | Phase 2 |
| Create Game | §10 | Phase 2 |
| Game Selection | §11 | Phase 2 |
| Game Configuration | §14 | Phase 2 |
| Join by Code | §16 | Phase 2 |
| Quick Match / matchmaking progress | §18 | Phase 2 |
| Inventory | §21 | Phase 5 |
| Settings | §34 | Phase 1 |
| Purchase / paywall | §28 | Phase 6 |

Five of Phase 2's six routes have no design. **This is no longer treated as blocking** — see decision D20 in §21: all eleven are composable from primitives the existing 24 screens already establish (card, list row, filter chip row, primary CTA, stat tile, count badge). They are built from a shared component kit and restyled later as a props change.

### 1.4 Only one game has session designs

Vampire Village has 8 session screens (3 role reveals, 3 night turns, day phase, game over). Taboo, Zarta, Complete the Story, Detective and Drawing Guess have **zero**. The game-engine abstraction (§9 below) is therefore designed from one concrete example plus the spec's rules — it must be validated against Taboo before being treated as stable, because Taboo is team-based and timer-driven where Vampire Village is role-based and phase-driven.

### 1.5 The game catalogue does not match the spec

Read from the Game Browser screen, which is confirmed to be the **public room browser** ("Find a Room", host names, `6/12` counts, JOIN ROOM / ROOM FULL states) — spec §17 is satisfied by an existing design.

| Game in design | Premium badge? | In spec §11? |
| --- | --- | --- |
| Vampire Village | **Yes** | Yes — but listed as **free** |
| Taboo Words | No | Yes (as "Taboo") |
| Sketch It | No | Yes (as "Drawing Guess") — but spec says **premium** |
| Trivia Blitz | Yes | **Not in the spec at all** |
| — | — | Zarta — **no design** |
| — | — | Complete the Story — **no design** |
| — | — | Detective — **no design** |

Two direct inversions: **Vampire Village is premium in the design and free in the spec; Sketch It / Drawing Guess is free in the design and premium in the spec.** Vampire Village is also the only game with session designs and the entire Phase 3 scope — shipping it premium-gated would put the MVP's only playable game behind a paywall.

The Multiplayer Lobby shows Vampire Village with **no** premium badge, so the design set contradicts itself on this too.

**Decided as D7 and D8**: Vampire Village free, Sketch It premium. Both are `game_definitions.isPremium` values, so either is a data edit — see §21 for the reasoning.

### 1.6 "Game Log" is an in-session log, not match history

**This corrects an earlier mapping in this document.** Game Log renders a chronological Day 2 / Night 1 / Day 1 event feed — *"Bob (Vampire) was exiled by vote"*, *"Alice was attacked but protected!"* — and sits behind the in-game tab bar. It belongs at `room/[code]/log`, **not** `profile/history.tsx`.

Match history is a separate, already-designed thing: the Player Profile's "Recent History" list plus Shell B's `History` tab. Route table in §4 corrected accordingly.

The log also exposes two engine rules and one problem:

- **Roles are revealed on elimination** — `(Vampire)` is printed next to the exiled player. The engine must expose eliminated players' roles publicly.
- **Protection is publicly announced** — "attacked but protected" tells the whole table a Bodyguard is alive and acted.
- ⚠️ **"Seer received a vision about Charlie" leaks the Seer's target to everyone.** Compare "Bodyguard stood watch over a villager", which deliberately does *not* name its target. The disclosure levels are inconsistent, and the Seer entry defeats the `projectFor` privacy model in §9.1. **A per-event-type disclosure policy must be specified before the engine is written.**

### 1.7 Chat is required by the designs and absent from the spec

The Day Phase screen has a full-width **"Open Chat"** call to action and a **Chat** tab. The word "chat" does not appear anywhere in the 46-section specification.

This is a missing subsystem, not a missing screen. It needs: an RTDB message schema, per-room scoping, dead-vs-alive channel separation (eliminated players must not be able to talk to living ones in a social-deduction game), rate limiting, moderation/reporting, retention policy, and a decision on whether messages persist past room cleanup (§7.2 currently deletes everything).

**Resolved as D10 — chat ships in Phase 3.** Architecture in §22.1. Social deduction is argument; without a channel the game is playable only by people already on voice together, which excludes the room browser, matchmaking and every stranger-facing feature in the spec.

### 1.8 Asset production problem

Several designed images are **screenshots of imaginary UI rather than usable assets**:

- Every Avatar Shop item card (Cyberpunk Jacket, Neon Visor, Galaxy Hair, daily crate) shows a miniature fake "AVATAR SHOP" interface instead of an isolated product image.
- The Seer role card has a title bar, health bar and two icon buttons baked into the artwork.
- The featured item's art reads `PRICE: 1500 EC` — a currency unit that exists nowhere else; the surrounding real UI uses Gold.

These cannot ship as item icons or role art. Clean, isolated assets on transparent backgrounds are needed before the shop and role-reveal screens can be implemented at the designed quality.

### 1.9 Smaller inconsistencies

| Issue | Detail |
| --- | --- |
| Player state vocabulary | Day Phase labels the viewer **Alive** and everyone else **Active** for the same state |
| Role naming | Achievement "Master of Disguise" says *"Win a game as a **Werewolf**"* — every other surface says Vampire |
| XP/gold award values | Design shows win `+120 XP / +45 gold`, loss `+30 XP / +10 gold`; spec §24 says completed `+100 XP`, won `+150 XP` |
| Level display | Home Dashboard `Lv 18`, Player Profile `Level 42` — mock data only, but the XP model differs too (profile shows an explicit `12,450 / 15,000` per-level threshold, which §11.2 adopts) |
| Item level gating | Featured shop item carries a `Lvl 18` chip — items can be level-locked. Requires `requiredLevel` on the item schema; not previously modelled |
| Item sets | "Urban Tech Set" implies bundles/sets. Not in the spec or the schema |
| Achievement rarity | LEGENDARY / EPIC / RARE / COMMON tiers plus `2/3` progress bars — rarity was only modelled on items |
| Lobby start rule | START GAME appears enabled at 4/12 players with one player NOT READY. Is readiness advisory or blocking? |
| Artboard width | Achievements is 675 px wide; every other screen is 780 px |

---

## 2. Platform decision: Expo with Dev Client

Spec §1 says *"Prefer Expo if all required native functionality is supported; otherwise use React Native CLI."* Working through that test:

| Requirement | Package | Needs custom native code? |
| --- | --- | --- |
| Auth, Firestore, RTDB, Storage | `@react-native-firebase/*` | **Yes** |
| Crashlytics (§1) | `@react-native-firebase/crashlytics` | **Yes** — native only, no JS SDK equivalent |
| Analytics (§1) | `@react-native-firebase/analytics` | **Yes** — native only |
| FCM push (§1, §32) | `@react-native-firebase/messaging` | **Yes** — native only |
| AdMob rewarded ads (§27) | `react-native-google-mobile-ads` | **Yes** |
| IAP (§28) | `react-native-iap` | **Yes** |
| Skia avatar rendering (§20) | `@shopify/react-native-skia` | Yes, but Expo-supported |

**Decision: Expo + `expo prebuild` + Expo Dev Client.** Not bare RN CLI — Expo's config plugins, EAS Build, OTA updates and typed routing are all worth keeping, and every package above ships an Expo config plugin.

**Direct consequence: Expo Go stops working the moment Firebase native SDK lands.** From that commit onward the only way to run the app is a development build (`eas build --profile development`, installed once per device) or a local `npx expo run:android` / `run:ios`. Budget for this — it is the single biggest workflow change in Phase 1.

Crashlytics, Analytics and FCM are the forcing functions. Had the spec not required them, the Firebase **JS** SDK would have run in Expo Go and kept the simpler workflow.

### 2.1 Router

Spec §1 requires React Navigation. The scaffolded project uses **Expo Router**, which is a file-based routing layer built directly on React Navigation — `expo-router` depends on `@react-navigation/native` and renders real React Navigation navigators. The requirement is satisfied; route *declaration* is file-based instead of object-based. All React Navigation APIs (`useNavigation`, custom navigators, screen options) remain available.

### 2.2 Locked stack

| Layer | Choice |
| --- | --- |
| Runtime | Expo SDK 57, React Native 0.86, React 19.2 |
| Language | TypeScript, `strict: true` |
| Routing | Expo Router 57 (typed routes on) |
| Client state | Zustand + `persist` middleware |
| Server state | TanStack Query |
| Animation | Reanimated 4 + Gesture Handler |
| 2D rendering | Skia (avatars, Drawing Guess canvas) |
| Backend | Firebase (Auth, Firestore, RTDB, Storage, Functions, FCM, Analytics, Crashlytics) |
| Local storage | `expo-secure-store` for tokens, AsyncStorage via Zustand persist for prefs |

---

## 3. System architecture

Five layers. Dependencies point **downward only** — a layer never imports from the layer above it. This is what makes the RTDB→WebSocket migration in §20 possible without touching game rules.

```
┌─────────────────────────────────────────────────┐
│  UI            screens, components, animations   │  React, Reanimated, Skia
├─────────────────────────────────────────────────┤
│  APPLICATION   controllers, hooks, stores        │  Zustand, TanStack Query
├─────────────────────────────────────────────────┤
│  DOMAIN        game engines, rules, economy math │  pure TypeScript, zero I/O
├─────────────────────────────────────────────────┤
│  INFRASTRUCTURE  repositories, transports        │  interfaces + adapters
├─────────────────────────────────────────────────┤
│  FIREBASE      Firestore, RTDB, Functions, ...   │
└─────────────────────────────────────────────────┘
```

**The domain layer is pure.** Game engines take state in and return state out. No Firebase import, no React import, no `Date.now()`, no `Math.random()` — time and randomness are injected. This makes every rule unit-testable without emulators and lets the identical engine code run inside Cloud Functions for server-side validation (§10.4).

---

## 4. Folder structure

Expo Router requires routes under `src/app/`. Everything else follows the spec §41 feature-based layout.

```
src/
├── app/                              # ROUTES ONLY — thin, no business logic
│   ├── _layout.tsx                   # root: providers, auth gate, splash hold
│   ├── index.tsx                     # boot router → onboarding | auth | tabs
│   ├── onboarding.tsx                # 3 designed slides, paged
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx                 ← Login
│   │   ├── register.tsx              ← Register
│   │   └── forgot-password.tsx       ← Forgot Password
│   ├── (tabs)/
│   │   ├── _layout.tsx               # Home · Mücadele · Oyna · Profil
│   │   ├── index.tsx                 ← Home Dashboard
│   │   ├── leaderboard.tsx           ⚠ no design
│   │   ├── play.tsx                  ⚠ no design
│   │   └── profile.tsx               ← Player Profile
│   ├── play/
│   │   ├── select-game.tsx           ⚠ no design
│   │   ├── configure/[gameId].tsx    ⚠ no design
│   │   ├── browse.tsx                ← Game Browser
│   │   ├── join-by-code.tsx          ⚠ no design
│   │   └── quick-match.tsx           ⚠ no design
│   ├── room/
│   │   └── [code]/
│   │       ├── lobby.tsx             ← Multiplayer Lobby
│   │       ├── _layout.tsx           # session tabs: Game · Roles · Chat · Log
│   │       ├── play.tsx              ← Day/Night Phase, delegates to engine UI
│   │       ├── roles.tsx             # in-game role reference  ⚠ no design
│   │       ├── chat.tsx              ⚠ no design, not in spec — see §1.7
│   │       └── log.tsx               ← Game Log  (in-session event feed)
│   ├── profile/
│   │   ├── avatar.tsx                ← Avatar Customizer
│   │   ├── shop.tsx                  ← Avatar Shop
│   │   ├── inventory.tsx             ⚠ no design
│   │   ├── achievements.tsx          ← Achievements
│   │   ├── history.tsx               ← Profile "Recent History"
│   │   └── settings.tsx              ⚠ no design
│   └── +not-found.tsx
│
├── features/
│   ├── auth/            {api,hooks,components,types}
│   ├── home/
│   ├── leaderboard/
│   ├── profile/
│   ├── avatar/          # slot composition + Skia renderer
│   ├── inventory/
│   ├── shop/
│   ├── rooms/           # lifecycle, presence, membership
│   ├── matchmaking/
│   ├── economy/         # gold + XP client mirrors
│   ├── premium/
│   ├── notifications/
│   └── games/
│       ├── core/                     # engine contract, registry, shared UI
│       │   ├── GameEngine.ts
│       │   ├── registry.ts
│       │   ├── types.ts
│       │   └── components/           # PhaseTimer, PlayerGrid, VoteList…
│       ├── vampireVillage/           ← 8 designed screens
│       │   ├── engine.ts             # pure rules
│       │   ├── config.schema.ts
│       │   ├── roles.ts
│       │   └── screens/
│       ├── taboo/
│       ├── zarta/
│       ├── story/
│       ├── detective/                # premium
│       └── drawingGuess/             # premium
│
├── services/
│   ├── firebase/        # app init, emulator wiring
│   ├── repositories/    # RoomRepository, UserRepository … (interfaces)
│   ├── transport/       # RealtimeTransport interface + RTDB adapter
│   ├── analytics/
│   └── storage/
│
├── components/ui/       # Button, Card, Sheet, Skeleton, GoldCounter, XPBar
├── components/avatar/
├── components/animations/
├── hooks/  stores/  utils/  types/  constants/  theme/
└── functions/           # Cloud Functions (separate package, own tsconfig)
```

**Rule:** files under `src/app/` may not exceed ~120 lines. They compose; they do not implement. Game logic living in a route file is the anti-pattern the spec calls out in §42.

---

## 5. Navigation architecture

```
RootLayout  (providers, auth listener, splash hold)
│
├── index                  boot decision
├── onboarding             once per install (Zustand persist flag)
│
├── (auth)                 unauthenticated only
│   ├── login · register · forgot-password
│
└── (tabs)                 authenticated only
    ├── Home           →  home dashboard
    ├── Mücadele       →  daily / weekly leaderboards
    ├── Oyna           →  play hub
    │    └── play/*    →  select-game → configure → room
    │    └── play/browse · join-by-code · quick-match
    └── Profil
         └── profile/*  avatar · shop · inventory · achievements · history · settings

    room/[code]/lobby   modal-ish full screen, reachable from every play path
    room/[code]/play    game session, engine-driven
```

**Boot decision at `index.tsx`:**

```
hasCompletedOnboarding?  no  → /onboarding
                         yes ↓
firebaseUser?            no  → /(auth)/login
                         yes ↓
profile exists in Firestore? no → create via Cloud Function → ↓
pendingDeepLinkRoom?     yes → /room/[code]/lobby
                         no  → /(tabs)
```

The `pendingDeepLinkRoom` branch is what satisfies spec §39's "unauthenticated user → login → continue joining room". The room code is captured before the auth redirect and consumed after.

---

## 6. Firebase architecture

### 6.1 Which store owns what

The dividing line: **Firestore owns truth that must survive; RTDB owns truth that must be fast.**

| Concern | Store | Why |
| --- | --- | --- |
| User profile, level, gold balance | Firestore | Durable, queried, transactional |
| Inventory, item catalogue | Firestore | Queried, filtered, rarely written |
| Leaderboard periods + history | Firestore | Aggregated, indexed, historical |
| XP / currency transaction ledger | Firestore | Audit trail, must never be lost |
| Purchases, subscriptions, entitlements | Firestore | Financial record |
| Game history, statistics, achievements | Firestore | Queried per user |
| Room membership, ready flags | **RTDB** | Sub-second fanout, `onDisconnect` |
| Live game state, timers, turn actions | **RTDB** | High write frequency, ephemeral |
| Presence / connection status | **RTDB** | `onDisconnect` exists only here |
| Public room index for the browser | **RTDB** | Changes constantly, read by many |

`onDisconnect()` is the deciding capability — Firestore has no equivalent, and spec §33 requires disconnect detection. That single requirement forces all live room state into RTDB.

**Rule:** a room's *result* is written to Firestore by a Cloud Function at game end; the room's *lifetime* never touches Firestore. RTDB rooms are disposable.

### 6.2 Firestore schema

```
users/{uid}
  displayName, handle, photoURL, createdAt, lastSeenAt
  level, xp, xpIntoLevel
  gold                          ← written ONLY by Cloud Functions
  isPremium, premiumSource, premiumExpiresAt
  avatarConfig: { body, face, eyes, hair, clothes, hat, accessory, background }
  stats: { gamesPlayed, gamesWon, winRateCached }
  flags: { onboardedAt, bannedAt? }

users/{uid}/inventory/{itemId}
  itemId, acquiredAt, source ('purchase'|'reward'|'grant'), equipped

users/{uid}/statistics/{gameId}
  played, won, lost, abandoned, bestStreak, lastPlayedAt

users/{uid}/achievements/{achievementId}
  unlockedAt, progress, claimed

items/{itemId}                      ← catalogue, read-only to clients
  name, type, slot, assetPath, price, currency,
  rarity, isPremiumOnly, availableFrom, availableUntil, metadata

game_definitions/{gameId}           ← drives dynamic config UI (spec §14)
  name, minPlayers, maxPlayers, isPremium,
  configSchema: [...],  roles: [...],  enabled

leaderboards/{periodId}             periodId = 'daily_2026-08-18' | 'weekly_2026-W34'
  type, startAt, endAt, status ('open'|'closing'|'closed'), rewardsIssuedAt
leaderboards/{periodId}/entries/{uid}
  uid, displayName, avatarConfig, level, score, rank, updatedAt

leaderboard_history/{periodId}
  type, startAt, endAt, top3: [...], totalParticipants, closedAt

xp_transactions/{txId}
  uid, amount, reason, referenceId, idempotencyKey, createdAt (server ts)
currency_transactions/{txId}
  uid, amount (signed), type, source, referenceId, idempotencyKey,
  balanceAfter, createdAt (server ts)

purchases/{purchaseId}
  uid, platform, productId, platformTxId, state, verifiedAt, raw
subscriptions/{uid}
  productId, state, currentPeriodEnd, platform, lastVerifiedAt

game_results/{resultId}
  roomId, gameId, startedAt, endedAt, players: [...], winners: [...],
  validated, awardsIssued
```

### 6.3 Required composite indexes

| Collection | Fields | Serves |
| --- | --- | --- |
| `leaderboards/{p}/entries` | `score` desc, `updatedAt` asc | Ranked leaderboard, ties broken by who got there first |
| `items` | `type` asc, `availableFrom` desc | Shop, filtered by slot |
| `items` | `isPremiumOnly` asc, `rarity` asc | Premium shop tab |
| `currency_transactions` | `uid` asc, `createdAt` desc | Transaction history |
| `currency_transactions` | `idempotencyKey` asc | Duplicate-claim lookup (**unique by convention**) |
| `game_results` | `players` array-contains, `endedAt` desc | Profile Recent History |
| `users/{uid}/inventory` | `type` asc, `acquiredAt` desc | Inventory grid |

`idempotencyKey` is enforced by using it as the **document ID** where possible, which makes duplicate writes fail naturally rather than relying on a query.

### 6.4 Realtime Database schema

```
/rooms/{roomId}
  meta:    { code, gameId, hostUid, visibility, status, maxPlayers,
             createdAt, startedAt, hostIsPremium }
  config:  { ...game-specific, validated server-side }
  players/{uid}: { displayName, avatarConfig, isReady, joinedAt, role? }
  counts:  { current, max }              ← denormalised for matchmaking
  state:   { phase, round, deadlineAt, ...engine state }
  actions/{actionId}: { uid, type, payload, at }
  presence/{uid}: { online, lastSeen }   ← onDisconnect target

/room_codes/{CODE}  → roomId            ← uniqueness guard, 6 chars

/public_rooms/{roomId}                  ← denormalised browse index
  { gameId, hostName, current, max, isPremium, status }

/presence/{uid}: { online, lastSeen, currentRoomId? }
```

`/public_rooms` is a projection maintained by a Cloud Function on `/rooms/{roomId}/meta` writes. The Game Browser reads only this node — it never scans `/rooms`, which would leak private room contents and scale badly.

---

## 7. Room lifecycle

```
   CREATED ──▶ WAITING ──▶ STARTING ──▶ IN_PROGRESS ──▶ FINISHED ──▶ CLOSED
      │           │            │              │              │
      │           │            │              │              └─▶ results → Firestore
      │           │            │              └─▶ host lost → migrate or abort
      │           │            └─▶ readiness lost → back to WAITING
      │           └─▶ empty > 5 min → CLOSED
      └─▶ never reached WAITING (creation failed) → CLOSED
```

| State | Meaning | Joinable | Listed publicly |
| --- | --- | --- | --- |
| `CREATED` | Record exists, host still configuring | No | No |
| `WAITING` | Open lobby | Yes | If public |
| `STARTING` | Countdown running, roles being dealt | No | No |
| `IN_PROGRESS` | Session live | Reconnect only | No |
| `FINISHED` | Results computed, awards issued | No | No |
| `CLOSED` | Tombstoned, eligible for deletion | No | No |

### 7.1 Disconnect and host migration (spec §33)

Presence is written by the client on connect and armed with `onDisconnect().set({online:false})` so the server marks the player offline even on a hard kill. A player going offline does **not** immediately remove them — that would break reconnection.

| Event | Handling |
| --- | --- |
| Player offline < grace (45 s in lobby, 120 s in game) | Seat held, UI shows "reconnecting" |
| Player offline > grace, in `WAITING` | Removed from `players`, counts decremented |
| Player offline > grace, in `IN_PROGRESS` | Seat kept; engine treats as auto-pass / auto-skip |
| **Host** offline > grace, `WAITING` | **Migrate**: longest-joined online player becomes host |
| **Host** offline > grace, `IN_PROGRESS` | Migrate; if no online players remain → `FINISHED` (void, no awards) |
| All players offline > 5 min | `CLOSED`, scheduled cleanup deletes node |

Host migration is a Cloud Function, not a client race. Clients propose nothing; the function picks deterministically by `joinedAt`.

### 7.2 Cleanup

A scheduled function every 5 minutes sweeps `/rooms` for: `status == CLOSED`, or `WAITING` with zero online players older than 5 minutes, or `IN_PROGRESS` with no `actions` write in 30 minutes (hung game). It deletes the room node, its `/room_codes/{CODE}` mapping and its `/public_rooms/{roomId}` projection. Room codes are therefore recyclable, which keeps them short.

---

## 8. Matchmaking and race-safe joins

The spec §18 hard requirement is that two users must never both take the final seat.

**Joining is an RTDB transaction on `/rooms/{roomId}/counts`.** RTDB transactions retry on conflict and are atomic per-node, which is exactly the primitive needed:

```
runTransaction('/rooms/{id}/counts', current => {
  if (current == null)                 return abort   // room gone
  if (current.current >= current.max)  return abort   // full — loser of the race
  return { ...current, current: current.current + 1 }
})
  → committed?  write /players/{uid}, /presence/{uid}, arm onDisconnect
  → aborted?    surface "Room is full", return to browser
```

The seat is reserved by the counter increment *before* the player record is written. If the follow-up write fails, a reconciliation function corrects `counts` from the actual `players` children. Counter drift is self-healing; double-seating is not possible.

Quick Match runs the same transaction server-side inside a Cloud Function, iterating candidate rooms from `/public_rooms` ordered by fullest-that-still-fits (better to fill a 6/8 room than start a new 1/8 one), checking premium compatibility, and falling back to creating a fresh room after N failures.

**Duplicate joins:** a player already present in `/players/{uid}` skips the transaction entirely and rejoins their existing seat — this is the reconnection path, not an error.

---

## 9. Game engine architecture

### 9.1 The contract

```ts
interface GameEngine<TState, TConfig, TAction, TResult> {
  readonly id: GameId;
  readonly meta: { minPlayers: number; maxPlayers: number; isPremium: boolean };

  validateConfig(config: unknown): Result<TConfig>;
  createInitialState(players: PlayerSeat[], config: TConfig, rng: Rng, now: Millis): TState;

  /** Pure. Same inputs always produce the same output. */
  reduce(state: TState, action: TAction, ctx: EngineCtx): Result<TState>;

  /** Deadline-driven transitions — phase timeouts, turn expiry. */
  tick(state: TState, now: Millis): TState;

  /** What this specific player is allowed to see. Enforced server-side. */
  projectFor(state: TState, uid: Uid): PlayerView;

  isFinished(state: TState): boolean;
  calculateResults(state: TState): TResult;
}
```

`rng` and `now` are injected, never read from globals. This is what makes engines replayable: given the seed and the action log, the final state is reproducible, which is how the server validates a client-reported result (§10.4).

`projectFor` is the anti-cheat primitive. The Seer's investigation result and every player's secret role exist only in server state; each client receives its own projection. A modified client cannot read what was never sent to it.

### 9.2 Registry

```ts
export const GAME_REGISTRY = {
  vampireVillage: () => import('../vampireVillage/engine'),
  taboo:          () => import('../taboo/engine'),
  // …
} satisfies Record<GameId, () => Promise<{ default: GameEngine }>>;
```

Adding a game is: write `engine.ts`, write `config.schema.ts`, add screens, add a registry line, add a `game_definitions/{gameId}` document. No changes to room, lobby, matchmaking or economy code. That is the §11 "very easy to add new games" requirement made concrete.

### 9.3 Where the engine runs

Both places, deliberately:

- **On the client** — for optimistic UI and instant feedback. Client state is a prediction.
- **In Cloud Functions** — the same module, imported by the functions package. Server state is truth.

Divergence resolves toward the server. This dual-run is only possible because the domain layer is pure (§3).

### 9.4 Vampire Village as the reference implementation

```
LOBBY → ROLE_REVEAL → NIGHT(vampire → seer → bodyguard) → DAY_DISCUSSION
      → DAY_VOTE → RESOLUTION → (loop or) GAME_OVER
```

Maps 1:1 onto the 8 designed screens. Config schema per §14: `minPlayers`, `maxPlayers`, enabled roles, premium roles, round count, phase durations.

---

## 10. Security model — zero trust client

The governing assumption from spec §29: **the client is hostile.** Every value that has worth is written by a Cloud Function and readable-but-not-writable by the client.

### 10.1 Write authority

| Data | Client may write | Function writes |
| --- | --- | --- |
| `users/{uid}.displayName`, `avatarConfig` | ✅ (validated by rules) | — |
| `users/{uid}.gold`, `.xp`, `.level`, `.isPremium` | ❌ **never** | ✅ |
| `inventory/*` | ❌ | ✅ |
| `currency_transactions`, `xp_transactions` | ❌ | ✅ |
| `leaderboards/*` | ❌ | ✅ |
| `purchases`, `subscriptions` | ❌ | ✅ |
| `game_results` | ❌ | ✅ |
| RTDB `players/{uid}.isReady` | ✅ own node only | — |
| RTDB `state`, `meta.status`, `counts` | ❌ | ✅ |

### 10.2 Firestore rules shape

```
match /users/{uid} {
  allow read: if signedIn();
  allow update: if isOwner(uid)
             && onlyChanged(['displayName','avatarConfig','flags.onboardedAt'])
             && validAvatarConfig(request.resource.data.avatarConfig);
  allow create, delete: if false;          // Cloud Function only
}
match /items/{id}            { allow read: if signedIn(); allow write: if false; }
match /currency_transactions/{id} {
  allow read: if isOwner(resource.data.uid); allow write: if false;
}
match /leaderboards/{p}/entries/{uid} { allow read: if signedIn(); allow write: if false; }
```

`onlyChanged()` is the critical helper — without it, a client updating its display name could smuggle a `gold` field into the same write.

### 10.3 Idempotency

Every rewarding operation carries an `idempotencyKey`, used as the transaction document ID:

| Reward | Key |
| --- | --- |
| Ad reward | `ad_{uid}_{admobTransactionId}` |
| Daily reward | `daily_{uid}_{serverDateUTC}` |
| Game reward | `game_{resultId}_{uid}` |
| Purchase | `iap_{platform}_{platformTxId}` |

A replayed request writes the same document ID and fails the `create`. Replay attacks and double-claims become impossible rather than merely unlikely. **Server date, never device date** — spec §25.

### 10.4 Result validation

Clients report game outcomes; the server does not trust them. The end-of-game function replays the action log through the same pure engine using the stored seed and compares against the reported result. Mismatch → result rejected, no awards, incident logged. This is affordable because engines are pure and fast.

### 10.5 Premium — including the host-grants-room rule

Spec §13's important product concept: players in a premium host's room may play premium content without owning it.

Entitlement is resolved **server-side at room start** and frozen into `meta.hostIsPremium`:

```
startGame(roomId):
  host = users/{meta.hostUid}
  hostPremium = host.isPremium && (premiumExpiresAt == null || > serverNow)
  if game.isPremium && !hostPremium         → reject
  if config.premiumRoles && !hostPremium    → reject
  meta.hostIsPremium = hostPremium          // frozen for this session
```

Players are never checked individually. A host whose subscription lapses mid-session keeps the session — the entitlement was resolved at start. `isPremium` on the user document is itself only ever written by the purchase-verification function.

---

## 11. Economy

### 11.1 Gold

Balance is a **cached projection of the ledger**, never an independently mutated number:

```
Client requests reward
      ↓
Cloud Function validates the claim (ad SSV / game result / daily eligibility)
      ↓
Firestore transaction:
    create currency_transactions/{idempotencyKey}   ← fails if replayed
    increment users/{uid}.gold
    write balanceAfter into the transaction
      ↓
Client observes new balance via listener
```

Spend is the same shape with a signed-negative amount plus a `gold >= price` guard **inside** the transaction. Negative balances are structurally impossible.

Rebuild-from-ledger is always available: `sum(currency_transactions where uid)` must equal `users/{uid}.gold`. A scheduled audit compares them and flags drift.

### 11.2 XP and levels

Identical ledger shape via `xp_transactions`. Level thresholds live in one place:

```ts
// src/features/economy/levels.ts — single source of truth, mirrored in functions/
export const levelForXp = (xp: number): number => …
export const xpForLevel = (level: number): number => …
```

Spec §24 forbids scattering level maths; both the app and the functions import this one module.

### 11.3 Leaderboards

Score is denormalised into `leaderboards/{periodId}/entries/{uid}` by the same function that awards XP — one write, both places, inside a transaction.

Period rollover is a scheduled function (daily 00:00 UTC, weekly Monday 00:00 UTC):

```
mark period 'closing'  →  rank entries by (score desc, updatedAt asc)
                       →  write leaderboard_history/{periodId} with top 3
                       →  issue reward transactions (idempotent)
                       →  mark 'closed'  →  open next period
```

Rewards use `idempotencyKey = 'lb_{periodId}_{uid}'`, so a retried scheduled run cannot double-pay. Ranks come from server timestamps only.

---

## 12. Avatar and inventory

Avatar is a **slot map**, not an image:

```json
{ "body":"body_03","face":"face_02","eyes":"eyes_04","hair":"hair_12",
  "clothes":"hoodie_07","hat":"hat_02","accessory":"glasses_01","background":"bg_05" }
```

Rendering composites slot layers in a fixed z-order through Skia. Assets live in Firebase Storage under `avatars/{slot}/{itemId}.png`, cached on device via `expo-image`.

Adding a slot is a `SLOT_ORDER` constant edit plus catalogue rows — no schema migration, satisfying §20's extensibility requirement.

**Equip validation is server-side.** Firestore rules verify every referenced `itemId` exists in the user's `inventory` subcollection. Owning the config string is not owning the item.

---

## 13. Ads, IAP, notifications, deep links

**Ads (§27).** AdMob rewarded ads with **server-side verification** — AdMob calls a Cloud Function callback with a transaction ID; that ID becomes the idempotency key. Client-reported completion alone grants nothing.

**IAP (§28).** `react-native-iap` for purchase flow; a Cloud Function verifies the receipt against Apple/Google, writes `purchases/{id}`, then sets `users/{uid}.isPremium` or grants gold. Subscription state is re-verified on a schedule and on app foreground, so cancellations and refunds land.

**Notifications (§32).** FCM tokens stored per-device under `users/{uid}/devices/{deviceId}`. Triggers: room invite, your turn, lobby filled, daily reward ready, leaderboard period ending, champion result.

**Deep links (§39).** Scheme `ludora://room/{CODE}` plus universal links on `links.ludora.app`. `app.json` already sets `"scheme": "ludora"`. Expo Router maps the URL to `/room/[code]/lobby`; the boot decision in §5 handles the cold-start, backgrounded and unauthenticated cases through the shared `pendingDeepLinkRoom` slot.

---

## 14. Offline and reconnection

Connection state is derived from RTDB's `.info/connected` and surfaced as a single app-wide status: `connected` · `connecting` · `disconnected` · `reconnecting`.

| Screen class | Degraded behaviour |
| --- | --- |
| Home, Profile, Shop | Cached (TanStack Query); banner shown |
| Lobby | Blocking overlay — realtime is the feature |
| Game session | Overlay + grace countdown; engine auto-passes on expiry |

Reconnection re-reads authoritative state from RTDB and discards local prediction. Every listener is registered in a screen-scoped effect with a matching teardown; spec §37's rule that listeners must not outlive their screen is enforced by putting subscription logic in hooks that own their cleanup.

---

## 15. Performance

- FlatList everywhere with stable `keyExtractor`, `getItemLayout` where rows are fixed.
- Reanimated worklets on the UI thread; no animated value crosses the bridge per frame.
- Skia avatars memoised by config hash — recomposite only when a slot changes.
- Zustand selectors are narrow; no component subscribes to a whole store.
- Firebase listeners scoped to the smallest node that answers the question (`/rooms/{id}/players`, not `/rooms/{id}`).
- Images via `expo-image` with disk caching and explicit `recyclingKey` in lists.

Target: 60 fps on a mid-range Android device (Snapdragon 6-series class), measured on the Lobby and Day Phase screens, which are the heaviest realtime surfaces.

---

## 16. Testing strategy

| Layer | Tooling | Coverage bar |
| --- | --- | --- |
| Game engines | Jest, pure functions | Every rule, every win condition |
| Economy maths | Jest | Level curve, ledger invariants |
| Cloud Functions | Firebase emulator | Idempotency, race conditions, rules |
| Security rules | `@firebase/rules-unit-testing` | Every deny path asserted |
| Components | RN Testing Library | Critical flows only |
| E2E | Maestro | Boot → auth → create room → play → results |

The security-rules suite must assert **denials**, not just permissions. A rules test that only proves the happy path is how gold-write vulnerabilities ship.

---

## 17. MVP roadmap

Phases follow spec §43, adjusted where design coverage forces resequencing.

| Phase | Scope | Design status |
| --- | --- | --- |
| **1** | Splash, onboarding, auth, Firestore profile, home, profile, basic avatar, XP/gold read-only display | ✅ complete (Settings missing) |
| **2** | Room create, browser, join-by-code, lobby, presence, host controls | Built from the primitive kit (D20) |
| **3** | Vampire Village end-to-end: engine, sync, results, XP awards, **chat** | ✅ complete |
| **4** | Additional games, leaderboards, daily/weekly competition | ⚠️ leaderboards undesigned; 5 games undesigned |
| **5** | Shop, inventory, cosmetics, full gold economy | ⚠️ inventory undesigned |
| **6** | Premium games, premium roles, IAP, subscriptions | ⚠️ paywall undesigned |
| **7** | Rewarded ads, push, achievements, advanced matchmaking | ✅ achievements designed |

**Phase 3 now also carries chat** (D10, §22.1). The engine is pure and can still be developed against a locally-seeded room in parallel with Phase 2, which shortens the critical path.

**Phase 1 exit criteria:** a real user can install, onboard once, register, land on a Home dashboard populated from Firestore, edit their avatar, and see a gold balance that only a Cloud Function can change.

---

## 18. Scalability and migration path

The RTDB→custom-backend migration (§40) is protected by one interface:

```ts
interface RealtimeTransport {
  subscribeRoom(roomId: string, cb: (s: RoomSnapshot) => void): Unsubscribe;
  sendAction(roomId: string, action: GameAction): Promise<void>;
  setPresence(roomId: string, online: boolean): Promise<void>;
}
```

`FirebaseRealtimeTransport` implements it today. A future `WebSocketTransport` implements the same interface against Node/NestJS + Redis. Because engines are pure and UI talks only to controllers, the swap touches the transport adapter and nothing else.

**Do not build this now.** The interface costs nothing today and is the entire insurance policy. Triggers to revisit: sustained >10k concurrent rooms, RTDB bandwidth cost exceeding compute cost, or a game requiring sub-100 ms authoritative ticks (Drawing Guess is the likely first).

---

## 19. Answers to the §45 critical questions

| # | Question | Answer |
| --- | --- | --- |
| 1 | What belongs in Firestore? | Durable, queried, audited data — §6.1 table |
| 2 | What belongs in RTDB? | Ephemeral, high-frequency, presence-dependent data — §6.1 |
| 3 | What must be a Cloud Function? | Anything writing gold, XP, premium, inventory, leaderboards, results, room status |
| 4 | Race-safe joins? | RTDB transaction on `/counts` before seat write — §8 |
| 5 | Host disconnects? | Grace window, then deterministic migration by `joinedAt` — §7.1 |
| 6 | XP cheating? | Client cannot write XP; awards derive from server-validated results — §10.1, §10.4 |
| 7 | Gold cheating? | Ledger + transaction + idempotency key; balance is a projection — §11.1 |
| 8 | Premium validation? | Resolved server-side at `startGame`, frozen into room meta — §10.5 |
| 9 | Duplicate rewards? | `idempotencyKey` as document ID; replay fails on create — §10.3 |
| 10 | Leaderboard reset? | Scheduled function, server timestamps, `closing`→`closed`→next — §11.3 |
| 11 | Stale rooms? | 5-minute sweep on empty/hung rooms; code + projection deleted — §7.2 |
| 12 | Reconnect to active game? | Presence grace holds the seat; rejoin reads authoritative state — §7.1, §14 |
| 13 | Game state sync? | RTDB `state` node, server-authoritative, client predicts — §9.3 |
| 14 | Game rules independence? | Pure engine per game + registry; zero shared-room coupling — §9.2 |
| 15 | Migrate to WebSocket+Redis? | `RealtimeTransport` interface swap — §18 |

---

## 20. Design tokens

Extracted from the Stitch project's own theme — these are canonical, not invented.

**Fonts:** Bricolage Grotesque (headline) · Plus Jakarta Sans (body) · Space Grotesk (label). Radius scale: `ROUND_EIGHT` (8 px base).

```
background   #0b1326    surface_container       #171f33
surface      #0b1326    surface_container_high  #222a3d
on_surface   #dae2fd    surface_container_low   #131b2e
on_surface_variant #cbc3d7   outline            #958ea0

primary      #d0bcff    primary_container   #a078ff    (brand accent #8b5cf6)
secondary    #4cd7f6    secondary_container #03b5d3    (realtime / live)
tertiary     #ffb869    tertiary_container  #ca801e    (gold / economy)
error        #ffb4ab    error_container     #93000a
```

Semantic mapping adopted: **purple** = identity and progression, **cyan** = realtime and presence, **amber** = gold and economy, **red** = danger and elimination. Using tertiary/amber for gold is why the Home Dashboard's balance chip reads instantly.

---

## 21. Decision register

Every conflict in §1 is resolved here. Each decision states its rationale and its cost to reverse, so anything you disagree with can be overturned cheaply and knowingly. **None of these block implementation.**

| # | Conflict | Decision | Reversal cost |
| --- | --- | --- | --- |
| D1 | Four tab bars | **Spec §3**: Home · Mücadele · Oyna · Profil | Medium — route tree |
| D2 | Shell B's Social tab | **Cut from MVP.** Friends land in Phase 7 | Low |
| D3 | Five app names | **Ludora**, from one `APP_NAME` constant | Trivial |
| D4 | Role naming | Ship design names; internal IDs are archetypes | Trivial |
| D5 | "Werewolf" in achievement copy | Copy bug — **Vampire** | Trivial |
| D6 | Villager has no design | Reuse the Role Reveal template, text-only | Trivial |
| D7 | Vampire Village premium? | **Free** | Data edit |
| D8 | Sketch It premium? | **Premium**, per spec | Data edit |
| D9 | Trivia Blitz not in spec | Registered but `enabled: false` | Trivial |
| D10 | Chat missing from spec | **Ship minimal chat in Phase 3** — §22 | High if deferred |
| D11 | Seer vision leak | Anonymised log policy — §22.2 | Low |
| D12 | Award values disagree | Config table, tuned to the design — §22.3 | Trivial |
| D13 | Level curve | `xpToNext(l) = 300 + 350·l` — §22.3 | Trivial |
| D14 | Item level gates and sets | `requiredLevel`, `setId` added to schema | Low |
| D15 | Achievement rarity | `rarity` added to schema | Low |
| D16 | Lobby start rule | Enabled at `minPlayers`; confirm if any not ready | Trivial |
| D17 | Alive vs Active | **Alive / Eliminated** everywhere | Trivial |
| D18 | Turkish vs English | English source, i18n from day one, Turkish second | High if deferred |
| D19 | Unusable item and role art | Placeholder pipeline — §22.4 | Low |
| D20 | 11 undesigned routes | Build to a shared primitive kit, restyle later | Low |

### Rationale for the ones that are actually arguable

**D7 — Vampire Village is free.** It is the only game with session designs and the entire content of Phase 3. Gating it puts the MVP's single playable game behind a paywall, which kills the acquisition funnel before monetisation can matter. This also matches spec §11, which lists it as a free/initial game — the design's badge is the error. Premium revenue comes from premium *roles* (Witch, Hunter, Shaman, Guardian), the premium games, and cosmetics, exactly as spec §13 and §26 describe. The host-grants-room rule in §10.5 then becomes the actual conversion lever: one player buying premium upgrades the experience for their whole table, which is a far stronger driver than a hard gate.

**D10 — chat ships in Phase 3.** Social deduction is *argument*. The Day Phase screen is a discussion-and-voting surface, and without a channel the game is only playable by people already on voice chat in the same room — which excludes the public room browser, matchmaking, and every stranger-facing feature in the spec. Chat is not a nice-to-have here; it is what makes Quick Match meaningful. Deferring it means rebuilding the session layer later.

**D18 — i18n from day one.** Your spec names the tabs in Turkish and the designs are entirely in English, so the product is already bilingual in intent. Retrofitting i18n means touching every screen; adding it now costs a `t()` wrapper and a JSON file. This is the cheapest decision in the register to make now and among the most expensive to defer.

**D20 — the 11 undesigned routes are not actually blocking.** Every one of them (Create Game, Game Selection, Game Configuration, Join by Code, Play hub, Quick Match, Inventory, Settings, two Leaderboards, paywall) is composable from primitives the existing 24 screens already establish: the card, the list row, the filter chip row, the primary CTA, the stat tile, the count badge. Build them from a shared component kit extracted from the designed screens, and restyling later is a props change rather than a rewrite. **Phase 2 is therefore unblocked** — this supersedes the "design-blocked" finding in §1.3.

---

## 22. Resolutions requiring new architecture

### 22.1 Chat (D10)

Minimal, room-scoped, ephemeral. Not a messaging product.

```
/rooms/{roomId}/chat/{msgId}
  { uid, displayName, text, at, channel }

channel: 'alive' | 'dead' | 'lobby'
```

| Rule | Enforcement |
| --- | --- |
| Only room members may write | RTDB rules against `/rooms/{id}/players/{uid}` |
| Eliminated players write only to `dead` | Rules check `players/{uid}.eliminated` |
| Living players never *read* `dead` | Rules deny read unless eliminated or game finished |
| Text ≤ 300 chars, 1 msg/sec | Rules validate length; client throttles, rules enforce `at` spacing |
| Ring buffer, last 200 messages | Cloud Function trims on write |
| Deleted with the room | Existing §7.2 sweep — no extra work |
| No history persistence | Chat never reaches Firestore |

Dead-channel separation is the load-bearing rule: in social deduction, eliminated players knowing the answer must not be able to tell the living.

Moderation for MVP is report-only — a report writes to `moderation_reports` in Firestore for offline review. No live filtering.

### 22.2 Night-action disclosure policy (D11)

The designed Game Log leaks the Seer's target. This table replaces that copy and defines what `projectFor` may emit into the public log:

| Event | Public log entry | Private to actor |
| --- | --- | --- |
| Seer investigates | *"The Seer received a vision."* — **no target, no result** | Target name + alignment |
| Bodyguard protects | *"The Bodyguard stood watch."* — no target | Target name |
| Vampire kills, victim died | *"{Victim} was found drained. They were a {Role}."* | — |
| Vampire kills, victim protected | *"{Victim} was attacked but survived."* | — |
| Vote exile | *"{Player} was exiled by vote. They were a {Role}."* | — |
| Nobody exiled | *"The village could not agree."* | — |

**Roles are revealed on elimination only.** Living players' roles never enter any public projection. This keeps the design's satisfying `(Vampire)` reveal while closing the leak.

### 22.3 Economy constants (D12, D13)

Level curve, derived to fit the Player Profile design exactly — it shows `12,450 / 15,000 XP` at level 42:

```ts
export const xpToNext = (level: number): number => 300 + 350 * level;
// level 1 → 650   level 18 → 6,600   level 42 → 15,000 ✓
```

Award table, tuned so totals match the designed Recent History (`+120 XP / +45 gold` win, `+30 XP / +10 gold` loss), expressed additively as spec §24 requires. Values live in `game_definitions/{gameId}.awards`, so they are tunable without a release:

| Component | XP | Gold |
| --- | --- | --- |
| Participation (finished the game) | 30 | 10 |
| Win bonus | +90 | +35 |
| **Win total** | **120** | **45** |
| **Loss total** | **30** | **10** |
| First game of the day | +25 | — |
| Daily reward | — | +50 |
| Rewarded ad | — | +20 |

### 22.4 Asset pipeline (D19)

The shipped item and role art is unusable — it contains fake UI chrome. Rather than block on new art:

1. **Asset contract:** isolated subject, transparent PNG, 512×512 for items, 1024×1024 for role portraits, no text, no UI, no baked-in prices. Named `{slot}_{itemId}.png`.
2. **Placeholder tier:** Phase 1–3 ship Skia-drawn geometric placeholders keyed by `itemId` hash — deterministic, distinct, and good enough to build and test the shop, inventory and avatar compositor against.
3. Swapping real art in later is a Storage upload plus a catalogue field. No code changes.

This keeps Phase 5 buildable while art is reproduced.

**Game key art (amendment).** The same contract now has a working producer. Game
banner art is generated through the Stitch MCP with an explicit
no-UI/no-text/flat-fill/thick-outline prompt, which returns assets that satisfy
the §22.4 contract — unlike the original set that prompted D19. Files live in
`assets/images/games/{game-id}.png` and are registered one line at a time in the
`ART` map in `features/home/GameArt.tsx`.

All six games in `GameId` are covered, so the map is complete as of this change.
`GameArt` still falls back to a tinted panel with a generic glyph when a game
has no entry, which is what keeps adding a seventh game a one-line registry
change rather than an art dependency. The fallback is deliberately trivial: it
is unreachable today, and a branch nobody exercises should be too simple to rot.

Generation notes for whoever runs this next: the endpoint rejects concurrent
calls (three parallel requests returned timeout, unavailable and invalid-argument
respectively) and intermittently times out on a single call while still
completing server-side. Generated IMAGE screens do **not** appear in
`list_screens`, so a timed-out call cannot be recovered by polling — wait ~90s
and re-issue. Prompts must forbid text explicitly; without it, word-game subjects
come back with baked-in lettering.

### 22.5 Schema additions (D14, D15)

```
items/{itemId}
  + requiredLevel: number | null      ← "Lvl 18" chip in the Avatar Shop
  + setId: string | null              ← "Urban Tech Set"

users/{uid}/achievements/{id}
  + rarity: 'common'|'rare'|'epic'|'legendary'
  + progressTarget: number            ← powers the "2/3" bar
```

Level gates are enforced server-side at purchase, not just hidden in the UI.
