# Firebase — implementation tracker

**Status:** No Firebase product is fully wired yet except Auth (written, not connected). Everything else in this file describes what the *current* code already commits to, not a wishlist.

---

## 0. How this file is different from ARCHITECTURE.md

`docs/ARCHITECTURE.md` §6–§13 is the full, aspirational schema for the entire spec — written before a single screen existed. It is still the design authority for anything not covered here.

This file is the other direction: it starts from the **code that actually exists today** and records, for each mock/local store, exactly which real Firebase product and path it stands in for. Every one of those paths is already named in a comment somewhere in `src/` — this file just collects them in one place instead of leaving them scattered across twelve files, and tracks the *status* of each (mocked / gateway written / wired).

It also surfaces places where the code's stated intent has quietly moved past what ARCHITECTURE.md originally specified (new collections it never modelled, or a path shape that changed after implementation revealed a problem with the original). Those are listed in §4 rather than silently left to drift.

**Maintenance rule (standing instruction, not a one-time task):** any change that adds a new local store or mock standing in for Firebase, names a new Firestore/RTDB/Storage path in a comment, installs or wires a real Firebase package, or diverges from what's recorded here, updates this file in the same change — not batched into a later cleanup pass.

---

## 1. Firebase products

| Product | Package | Status | Where |
| --- | --- | --- | --- |
| Authentication | `@react-native-firebase/auth` 26.3.0 | **Installed. Wired and live** — `stores/session.ts` calls `firebaseAuthGateway` directly; `mockAuthGateway` deleted per its own header once this happened | [firebaseAuth.ts](../src/services/auth/firebaseAuth.ts) |
| App (core) | `@react-native-firebase/app` ^26.2.0 | Installed, config plugin registered | [app.json](../app.json) |
| Cloud Firestore | `@react-native-firebase/firestore` 26.3.0 | **Installed. No gateway written yet** — `stores/profile.ts`, `stores/progression.ts` and the leaderboard/catalogue local mirrors have no `types.ts`/`mock*.ts` split today, unlike auth/rooms/presence/chat | targets in §3.2–§3.7 |
| Realtime Database | `@react-native-firebase/database` 26.3.0 | **Installed. Room directory gateway written. Not wired** — `services/rooms/mockRooms.ts`'s `roomGateway` is still the active export | [firebaseRooms.ts](../src/services/rooms/firebaseRooms.ts) |
| Cloud Storage | `@react-native-firebase/storage` 26.3.0 | **Installed. No gateway written yet** | avatar/catalogue art, ARCHITECTURE §12 |
| Cloud Functions | `@react-native-firebase/functions` (client) + a separate `functions/` package (server) | Not installed, `functions/` package not created | economy payouts, result validation, room lifecycle — every "local mirror" comment in §3 names this as the eventual writer |
| Cloud Messaging (FCM) | `@react-native-firebase/messaging` | Not installed | ARCHITECTURE §13 |
| Analytics | `@react-native-firebase/analytics` | Not installed | ARCHITECTURE §2 |
| Crashlytics | `@react-native-firebase/crashlytics` | Not installed | ARCHITECTURE §2 |
| *(adjacent, not Firebase)* AdMob, IAP | `react-native-google-mobile-ads`, `react-native-iap` | Not installed | ARCHITECTURE §13 |

`app.json` already declares `googleServicesFile` for both platforms and registers the `app`/`auth` config plugins — the project-level wiring for Auth is done; only `session.ts`'s import needs to change to make it live. `@react-native-firebase/database`, `/firestore` and `/storage` need no plugin entry of their own — none ships an `app.plugin.js` (confirmed by checking each package directly), so all three autolink off the `app` plugin's native setup alone.

Every `@react-native-firebase/*` package must be pinned to the exact same version (`26.3.0`, no `^`) in package.json — installing `/database` at a caret range resolved a patch ahead of the already-installed `/app`/`/auth` and `npm install` refused with an ERESOLVE peer conflict until all three were pinned exactly. This is a standing constraint, not a one-time fix: bump one, bump all three together.

`google-services.json` and `GoogleService-Info.plist` now exist at the repo root (gitignored — per-developer/per-environment, not committed) and both resolve to project `ludora-13e00`, package/bundle id `com.ludora.app`, matching `app.json` on both platforms. This also requires `expo-dev-client` (installed, not yet built) — Firebase's native modules do not run in Expo Go, so the only way to actually run signed-in auth (or anything else in this file once wired) is a development build (`eas build --profile development` or a local `expo run:android`/`expo run:ios`), not `expo start` in Expo Go.

**Still needed in the Firebase Console before real sign-in works on a device:** Email/Password enabled under Authentication → Sign-in method for `ludora-13e00`. The gateway is wired; an unconfigured provider surfaces as `auth/operation-not-allowed`, not a code bug.

---

## 2. The boundary pattern

Every domain that will eventually talk to Firebase is split into three pieces, consistently:

1. **`types.ts`** — the gateway interface. Stores and screens depend on this, never on a concrete implementation.
2. **`mock*.ts`** — a local implementation, active today.
3. **A real implementation** — swapped in by changing one import in the consuming store. Live for auth; written but not yet wired for rooms; not yet written for presence/connectivity or chat.

| Boundary | Interface | Mock (active) | Real target |
| --- | --- | --- | --- |
| Identity | `AuthGateway` — [services/auth/types.ts](../src/services/auth/types.ts) | *(retired — `mockAuthGateway` deleted once wired)* | `firebaseAuthGateway` — **wired and live**, [services/auth/firebaseAuth.ts](../src/services/auth/firebaseAuth.ts) |
| Connectivity + room presence | `ConnectivityProbe`, `PresenceGateway` — [services/network/types.ts](../src/services/network/types.ts) | `httpProbe` (a 204 fetch, proxying "is the internet up" for "can we reach Ludora"), `mockPresence` (in-memory pub/sub, silent on a real device) | RTDB `.info/connected` for the probe, RTDB `onDisconnect()` for presence |
| Chat | `ChatGateway` — [services/chat/types.ts](../src/services/chat/types.ts) | `mockChat` — in-memory loopback, `send` calls straight back out through `subscribe` | RTDB push under `rooms/{roomId}/chat/{channel}`, read via `child_added` |
| Room directory | `RoomGateway` — [services/rooms/types.ts](../src/services/rooms/types.ts) | `roomGateway` (mockRooms.ts) — in-memory `Map<code, Room>`, module-level like `mockPresence`; single device only, see §3.11 | `createFirebaseRooms()` — **written**, [services/rooms/firebaseRooms.ts](../src/services/rooms/firebaseRooms.ts), not wired. RTDB `/rooms`, `/room_codes/{CODE}`, `/public_rooms/{roomId}` (§6.4) |

The point of the pattern: nothing above the gateway line changes when a mock is replaced. `stores/connection.ts`, `stores/chat.ts`, every screen that reads `useLocalGame`/`useLocalTaboo` — all of them already read exactly the shape the server will eventually send (`VVPlayerView`, `TabooPlayerView`, `PeerPresenceEvent`), because the mocks were built to that contract from the start, not the other way round.

**`RoomGateway` needed one exception to "nothing changes":** its four data methods were originally synchronous, because the mock never had a reason not to be. A real backend cannot be synchronous, so the interface itself — not just its implementation — had to change to return `Promise`s before any real swap was possible. That rippled into every call site (`mockRooms.ts`, `stores/rooms.ts`, `find-room.tsx`, and all five `*-setup.tsx`/`*-lobby.tsx` pairs) gaining an `await`. This already happened, ahead of `firebaseRooms.ts` existing, specifically so the eventual mock→real swap really is the one-line change the pattern promises. No other gateway in this table needs the same fix — `AuthGateway`, `ConnectivityProbe`/`PresenceGateway` and `ChatGateway` were all async from the start.

---

## 3. Collections and paths named in current code

### 3.1 Firebase Auth — identity

No Firestore document yet holds anything beyond what Auth itself carries (`uid`, `email`, `displayName`). Every `uid` used elsewhere in this file (`'you'` in the local game/taboo drivers) is a stand-in for the Auth uid once sessions are real.

### 3.2 Firestore `users/{uid}` — profile, XP, gold

- **Local mirror:** [stores/profile.ts](../src/stores/profile.ts) — `displayName`, `handle`, `avatar` (slot map), `xp`, `gold`, `ownedItemIds`, `stats`, `dailyStreak`/`lastDailyClaim`.
- **Real shape:** ARCHITECTURE §6.2 `users/{uid}`. `applyAward`/`spendGold`/`claimDaily` here are explicitly documented as non-authoritative — "when Cloud Functions land they become listeners on the Firestore document rather than writers" (profile.ts's own header). Write authority split is ARCHITECTURE §10.1: `displayName`/`avatarConfig` client-writable, `gold`/`xp`/`level` Cloud-Function-only.

### 3.3 Firestore `items/{itemId}` + Storage `avatars/{slot}/{itemId}.png` — catalogue

- **Local mirror:** [features/avatar/catalogue.ts](../src/features/avatar/catalogue.ts) — 80 items; `variant`+`color` are render hints standing in for real Storage art (the Skia/SVG placeholder tier ARCHITECTURE §22.4 describes).
- **Schema addition beyond ARCHITECTURE §22.5:** `unlockedBy?: string` (an achievement id). §22.5 already added `requiredLevel`/`setId` to `items/{itemId}`; `unlockedBy` needs to join them — it is what lets an item be earned-only and excluded from `isFreeStarter`'s "price 0 means owned" shortcut. Equip validation is still server-side per §12 either way.
- **Second schema addition:** `darkColor?: string`, set on the eight `background` items only. Dark mode isn't a colour inversion here (palettes.ts's own header) — a background disc tuned pastel-light for the light palette read as a glaring mismatched patch against the dark palette's deep surfaces, the actual bug behind "avatar colours look bad in dark mode". `AvatarRenderer.tsx` picks `darkColor` over `color` when `useTheme().isDark`, the same per-viewer resolution `roleColorsFor`/`avatarHuesFor` already do for role accents and initials. Skin, hair and clothing colours were deliberately left alone — a person's own colouring isn't a UI surface that should repaint itself when the viewer's phone switches themes.

### 3.4 Progression — quests and achievements

- **Local mirror:** [stores/progression.ts](../src/stores/progression.ts). Rules live in pure modules — [features/progression/achievements.ts](../src/features/progression/achievements.ts), [features/progression/quests.ts](../src/features/progression/quests.ts) — deliberately, so "the server runs exactly this file to decide what unlocked" (achievements.ts's own header) rather than a second implementation of the same rules.
- **Real shape:** achievements already fit ARCHITECTURE §6.2's `users/{uid}/achievements/{achievementId}`. **Quest progress has no modelled collection yet** — needs `users/{uid}/quests/{questId}` (`count`, `seen`, `claimed`), analogous in shape to `QuestProgress` in [features/progression/quests.ts](../src/features/progression/quests.ts).
- Achievement banners (`AchievementBanner.tsx`) are transient UI state only — never persisted, client or server.

### 3.5 Firestore `leaderboards/{period}` — leaderboard

- **Local mirror:** [features/leaderboard/dummy.ts](../src/features/leaderboard/dummy.ts), read by [app/(tabs)/leaderboard.tsx](<../src/app/(tabs)/leaderboard.tsx>).
- **Real shape:** ARCHITECTURE §6.2's `leaderboards/{periodId}` / `entries/{uid}`, `periodId` like `weekly_2026-W34`. Entries already denormalise `avatarConfig` onto the doc, matching the schema (§6.2's comment on `leaderboards/{p}/entries` already calls this out — "a board of 50 rows must not fan out into 50 profile reads").
- **Period grain mismatch to reconcile:** the leaderboard screen offers **weekly/monthly** tabs; the home dashboard's champions strip reads from `leaderboards/daily` (see §3.6). ARCHITECTURE §6.2/§11.3 only modelled `daily`/`weekly` periods and their scheduled rollover. **Monthly needs adding** to the period type and the rollover schedule before this is real.

### 3.6 Firestore `leaderboards/daily` + RTDB `presence/{gameId}` + Firestore `game_definitions/{gameId}` — home dashboard

- **Local mirror:** [features/home/dummy.ts](../src/features/home/dummy.ts), the most explicit of the placeholder files — its own header maps every export to a real source: `champions` → `leaderboards/daily`, `playersNow` → `presence/{gameId}` (RTDB counter), `taglines` → `game_definitions/{gameId}`.
- `presence/{gameId}` is **not the same node** as room presence (§6.4's `/rooms/{roomId}/presence/{uid}`). It's a per-*game* "how many people are playing this right now" counter, not per-room-per-uid. Not yet in ARCHITECTURE's RTDB schema — most likely maintained by a Cloud Function aggregating live `/rooms` by `gameId`, written on room create/close rather than read from `/rooms` directly (matching §6.4's existing rule that the browser only ever reads a denormalised projection, never scans `/rooms`).

### 3.7 Firestore `game_definitions/{gameId}` — game registry

- **Local mirror:** [features/games/core/registry.ts](../src/features/games/core/registry.ts) `GAME_CATALOGUE` — "mirrored from `game_definitions`... kept here so the client can render before Firestore exists; Firestore is authoritative once it does" (its own header).
- Eight `GameId`s registered; `vampireVillage`, `taboo`, `drawingGuess` (Sketch It), `zarta`, and `imposter` have engines (`GAME_REGISTRY`). Adding a game is still exactly the one-line-per-file recipe ARCHITECTURE §9.2 describes.
- `detective` and `story` (Complete the Story) are catalogue-and-content only, no engine — both are written-content games (a case, a fragment), not stateful multiplayer ones, so they route straight to a browse screen instead of `GAME_REGISTRY`; see §3.9.
- `agent` and `imposter` are two separate catalogue entries, not one game with two roles — an earlier pass combined them into a single `agentImposter` entry, corrected once it was clear they're different games. `imposter` has real rules and an engine now (see §3.8); `agent` is still catalogue-and-art only, `enabled: false`, no rules designed yet.
- `modes: ('local' | 'online')[]` was added to `GameCatalogueEntry` — which way each game is actually meant to be played, independent of `enabled`. Not itself a `game_definitions` field ARCHITECTURE §9.2 names; worth adding there once real content for that collection is being scoped.

### 3.8 RTDB `state` node — live session sync (Vampire Village, Taboo, Sketch It, Zarta, Imposter)

- All five engines' state is documented, in their own `state.ts` headers, as "written straight to the RTDB `state` node (§6.3)". `projectFor(state, uid)` is the anti-cheat primitive from §9.1 in all five — a client never receives hidden information (Vampire Village's live roles/coven/night targets; Taboo's current card; Sketch It's current word; Zarta's in-progress bluffs, votes, and authorship; Imposter's secret value and the imposter's own candidate pool) for anyone but the uid it's projected for.
- **Taboo, Sketch It, Zarta and Imposter are all new since ARCHITECTURE.md was written** and each needs its own `game_definitions/{gameId}` document once that collection is real — their config schemas (`TABOO_CONFIG_FIELDS`, `SKETCH_CONFIG_FIELDS`, `ZARTA_CONFIG_FIELDS`, `IMPOSTER_CONFIG_FIELDS`) already exist, mirroring the same "drives the dynamic config UI" pattern §14 describes for Vampire Village.
- **Manual team assignment has no modelled room shape yet.** `PlayerSeat` gained an optional `team?: string` ([features/games/core/types.ts](../src/features/games/core/types.ts)) so a room owner can pre-assign Taboo's two teams instead of a random split. Once rooms are real, this needs `/rooms/{roomId}/players/{uid}.team`, an addition to §6.4's `players/{uid}` shape (currently `{ displayName, avatarConfig, isReady, joinedAt, role? }` — `role?` covers Vampire Village; `team?` is the Taboo equivalent).
- **Sketch It's drawing itself is deliberately not part of this node.** Strokes are ephemeral, local-only UI state ([features/games/sketchIt/screens/Canvas.tsx](../src/features/games/sketchIt/screens/Canvas.tsx)) — the engine's own `state.ts` header explains why: the game's outcome never depends on the pixels, only on who guessed and in what order. A real multiplayer build needs its own realtime path for the live strokes (something like `rooms/{roomId}/sketch/strokes`), streamed separately the same way chat got its own path instead of living on this state node — not designed yet, since local hot-seat play has no second device to stream to.
- **Zarta has no single active seat, unlike every other engine here.** `pendingWriters`/`pendingVoters` queues (drained one uid at a time) stand in for what a real multiplayer room would instead model as N simultaneous per-player writes/votes, gated by security rules rather than a client-side queue — pass-and-play on one device makes the queue the honest shape today, but it is a local-only simplification, not the eventual server design. Worth flagging before this game gets a real room: the security-rules shape for "every player submits privately, nobody can read anyone else's submission until everyone's in" doesn't have a precedent yet in ARCHITECTURE §10.
- **Imposter's clock survives a failed vote, unlike every phase-timer elsewhere.** `deadlineAt` is set once, when `discussion` opens, and nothing in the reducer resets it — calling a vote or a wrong guess spends the shared time budget rather than pausing it, so a vote that fails to catch the imposter drops the state back to `discussion` with the same deadline still running ([features/games/imposter/engine.ts](../src/features/games/imposter/engine.ts)'s own header explains why). Every other engine here resets its deadline on every phase transition; a security-rules implementation needs to allow a client-reported `deadlineAt` to stay unchanged across a `CALL_VOTE`/`SUBMIT_VOTE` round-trip, which §10's existing per-game write rules don't have a precedent for.
- **Imposter's `role_reveal` is a broadcast ack gate, not a queue** — closer to Vampire Village's `ACK_ROLE` (everyone acks whenever ready, no order) than to Zarta's `pendingWriters`/`pendingVoters`. `voting` is still a queue, though, so the local UI walks the two phases with two different hand-off patterns (see `localImposter.ts`'s file header).

### 3.9 Firestore `game_content/{gameId}/...` — content decks

- **Local mirrors, round-based games:** [features/games/taboo/words.ts](../src/features/games/taboo/words.ts) (30 cards, `id`/`word`/`forbidden[]`), [features/games/sketchIt/prompts.ts](../src/features/games/sketchIt/prompts.ts) (40 prompts, `id`/`word`), [features/games/zarta/questions.ts](../src/features/games/zarta/questions.ts) (30 trivia questions, `id`/`question`/`answer`), and [features/games/imposter/categories.ts](../src/features/games/imposter/categories.ts) (5 categories × 8 values each, `id`/`name`/`values[]`). Taboo's header names its real path directly and calls out that the file becomes the **offline fallback**, not the only deck, once that collection exists — Sketch It's, Zarta's and Imposter's are the same idea, one collection per game under `game_content/`. Imposter's is structurally the odd one out: a pool of candidate *values* per category, not a per-round card — one category and one value are drawn once per game, not once per round.
- **Local mirrors, story-driven games:** [features/games/detective/stories.ts](../src/features/games/detective/stories.ts) (15 cases, `id`/`title`/`teaser`/`isPremium`/`icon`) and [features/games/story/stories.ts](../src/features/games/story/stories.ts) (15 fragments, `id`/`title`/`opening`/`isPremium`/`icon`) — five free and ten paid each, matching the ratio discussed when these games were scoped. `icon` (an Ionicons glyph name, rendered by `ContentTile`) is a client-only cover-art hint, the same role `AvatarItem.color`/`darkColor` play for avatars (§3.3) — not asset art, just a per-entry render choice. Unlike the round-based decks above, these back a **browse screen**, not an engine: `/detective-stories` and `/complete-the-story` render this list directly. Still missing, and out of scope until the solving flow itself is designed: a case's actual evidence/solution, a fragment's actual "whole story", and anything that tracks which paid entries a given `uid` has bought (would need its own field on `users/{uid}`, analogous to `ownedItemIds` — see §3.3 — once purchasing exists).
- **New collections, not in ARCHITECTURE §6.2.** Structurally the same idea as `items/{itemId}` — a small content catalogue read-only to clients — so they likely want the same rules shape (§10.2's `match /items/{id}`), with the story-driven pair additionally needing a purchase check once buying a case/fragment is real (not yet — see above).

### 3.10 RTDB `rooms/{roomId}/chat/{channel}` — chat

- **Local mirror:** [services/chat/mockChat.ts](../src/services/chat/mockChat.ts), a loopback gateway. `chatAccess()` in [features/games/vampireVillage/chat.ts](../src/features/games/vampireVillage/chat.ts) is the pure rule module deciding who may read/write which channel per phase — the same "server will run this file too" discipline as progression's rule modules.
- **This moved past ARCHITECTURE §22.1's original shape — corrected there; see §4.1 for why.**

### 3.11 RTDB `/rooms`, `/room_codes/{CODE}`, `/public_rooms/{roomId}` — room directory

- **Local mirror (active):** [services/rooms/mockRooms.ts](../src/services/rooms/mockRooms.ts), a module-level `Map<code, Room>` in the same shape as `mockPresence` — created once, outliving any single screen's mount so a room stays findable after its creator navigates away. `generateRoomCode()` ([services/rooms/roomCode.ts](../src/services/rooms/roomCode.ts)) draws from the `ROOM_CODE_ALPHABET`/`ROOM_CODE_LENGTH` constants that already existed in [constants/app.ts](../src/constants/app.ts) but were unused until this landed.
- **Collapses `roomId` and `CODE` into one key**, unlike the real schema's `/room_codes/{CODE} → roomId` indirection (§6.4/§7). There is no `roomId` concept yet in the mock — every game's setup screen creates the room, so `code` doubles as the lookup key. `firebaseRooms.ts` (below) does restore the indirection — this is a mock-only simplification, not carried into the real gateway.
- **Every game's `*-setup.tsx` calls `roomGateway.createRoom()`** on "Continue to Lobby", passing a `RoomVisibility` chosen from `RoomVisibilityCard` ([features/games/core/RoomVisibilityCard.tsx](../src/features/games/core/RoomVisibilityCard.tsx)); the corresponding `*-lobby.tsx` calls `closeRoom()` when the owner starts the game. `stores/rooms.ts` is a thin reactive mirror of `listPublicRooms()` for the Find Room screen ([app/find-room.tsx](../src/app/find-room.tsx)). All of it is `await`ed now — see the `RoomGateway` async note in §2.
- **Single-device honesty, not a room-membership simulation.** There is no second player to fill a seat, so "browsing rooms" only ever lists rooms this device created, and "joining" — by code or from the list — replays the room's own stored route/params rather than adding a participant. This is the same restraint `mockPresence`'s own header describes ("no traffic of its own — there is no server to hear from"); the real gap this leaves is that `playerCount`/`maxPlayers` on a `Room` are cosmetic today, not actually enforced or filled by anyone else. **This gap is exactly what `firebaseRooms.ts` closes** — a room it creates is reachable from any device with the code or the public list, for real.
- **No idle sweep.** ARCHITECTURE §7.2's 5-minute empty-room cleanup isn't implemented in either the mock or the real gateway — a room a user abandons mid-setup stays listed. Acceptable for a local mock that resets on app restart; the real gateway needs a scheduled Cloud Function for this regardless (client code can't reliably detect "everyone left"), so it's tracked as an open item (§4) rather than something this pass should fake client-side.
- **Real target (written, not wired):** [services/rooms/firebaseRooms.ts](../src/services/rooms/firebaseRooms.ts)'s `createFirebaseRooms()`. Restores the `/room_codes/{CODE} → roomId` indirection the mock skips, generates codes via a live existence check against RTDB (retried up to 10 times) rather than the mock's synchronous `Map.has`, and writes `/rooms/{roomId}`, `/room_codes/{code}`, and — for public rooms only — `/public_rooms/{roomId}` in one multi-path `update()` so a room is never left half-registered. Two divergences from §6.4, both because there is no Cloud Functions deployment to own them yet, are on the new file's own header and repeated in §4: `/public_rooms/{roomId}` holds the full `Room` record rather than the minimal server-maintained projection §6.4 specifies, and there's still no idle sweep (previous bullet). `roomGateway` in `mockRooms.ts` is still the active export — swapping it for `createFirebaseRooms()` is the one-line change once real credentials exist (see §1's Firebase-project note).

---

## 4. Divergences from ARCHITECTURE.md — open items

Collected here so they don't quietly rot in twelve separate comments. None of these are implemented yet; they are decisions the code has already leaned on that the original schema doesn't (yet) reflect.

1. **Chat path shape changed** (§4.1 below) — channel became a path segment, not a field. ARCHITECTURE §22.1 described a shape RTDB security rules can't actually enforce for list reads; corrected there as part of adding this file.
2. **Leaderboard periods**: `monthly` is used by the leaderboard screen; only `daily`/`weekly` are modelled in §6.2/§11.3.
3. **`presence/{gameId}`** (per-game live counter) is a distinct RTDB node from room presence (`/rooms/{roomId}/presence/{uid}`) and isn't in §6.4 yet.
4. **`users/{uid}/quests/{questId}`** has no modelled collection — quest progress currently has nowhere to live in §6.2.
5. **`game_content/taboo/cards`** is a new collection, not in §6.2.
6. **`items/{itemId}.unlockedBy`** is a new field alongside §22.5's `requiredLevel`/`setId`.
7. **`/rooms/{roomId}/players/{uid}.team`** is needed for Taboo's manual team assignment; §6.4 only modelled `.role?` (Vampire Village).
8. **Sketch It's live drawing has no RTDB path at all yet** — strokes are local-only for now (see §3.8); a real multiplayer build needs a new realtime path for them, not modelled anywhere in ARCHITECTURE.md because the game didn't exist when it was written.
9. **Zarta's simultaneous-submission shape has no security-rules precedent.** Every other engine here has one active seat writing at a time, which §10's per-game write rules were written against; Zarta needs every seat to submit a private bluff and a private vote with nobody able to read another seat's in-progress submission until the room moves on — a genuinely different rules shape ARCHITECTURE §10 doesn't cover yet (see §3.8).
10. **`items/{itemId}.darkColor`** is a new field alongside `unlockedBy`/`requiredLevel`/`setId` — see §3.3.
11. **`game_content/detective/stories`** and **`game_content/story/fragments`** are two more new collections, not in §6.2 — see §3.9.
12. **`game_definitions/{gameId}.modes`** (`('local' | 'online')[]`) has no counterpart in §9.2's catalogue fields yet — see §3.7.
13. **`game_content/detective/stories.icon`** and **`game_content/story/fragments.icon`** are new fields on those two collections (§3.9) — client-only cover-art, not modelled anywhere.
14. **`game_content/imposter/categories`** is a fifth new collection under `game_content/`, not in §6.2 — see §3.9.
15. **Imposter's `deadlineAt` surviving a failed vote** has no security-rules precedent, the same open question Zarta's simultaneous-submission shape raised in item 9 — see §3.8.
16. **`mockRooms.ts` collapses `roomId` and `CODE` into one key**, skipping the `/room_codes/{CODE} → roomId` indirection §6.4/§7 model — see §3.11. (`firebaseRooms.ts` does not share this simplification.)
17. **`/public_rooms/{roomId}` in `firebaseRooms.ts` holds the full `Room` record**, not §6.4's minimal `{gameId, hostName, current, max, isPremium, status}` projection — written directly by the client instead of by a Cloud Function mirroring `/rooms/{roomId}/meta`, since no Cloud Functions exist yet. Private rooms are still never written to this node, so it remains safe to read without scanning `/rooms` — see §3.11.
18. **No idle-room sweep exists in `firebaseRooms.ts` either**, same gap as the mock (§7.2) — needs a scheduled Cloud Function; client code can't safely decide "this room is abandoned" on its own.

### 4.1 Why the chat path changed

ARCHITECTURE §22.1 modelled chat as one list, `/rooms/{roomId}/chat/{msgId}`, with `channel: 'alive' | 'dead' | 'lobby'` as a **field** on each message, relying on RTDB rules to deny *reading* the wrong channel.

That doesn't actually work as a list subscription: RTDB `.read` rules are evaluated per path, and a rule permitting "signed-in room members" to read `/chat` cascades to every child under it regardless of a per-message field — RTDB has no way to filter *which children* of a list a rule allows, unlike Firestore's query-time security. The only way to make a channel genuinely unreadable to the wrong audience is to put it on its own path.

The code implements it that way already: [services/chat/types.ts](../src/services/chat/types.ts) documents `send` becoming "an RTDB push under `rooms/{roomId}/chat/{channel}`" — i.e. `/rooms/{roomId}/chat/{channel}/{msgId}`, channel as a path segment — and [features/games/vampireVillage/chat.ts](../src/features/games/vampireVillage/chat.ts) names the channels `village`/`coven` rather than the original `alive`/`dead`/`lobby`. The vocabulary is also Vampire-Village-specific on purpose (`chatAccess()` lives in that game's own feature folder, not in `services/chat/`) — a future game with different channel needs defines its own access module against the same `ChatGateway`, rather than the generic boundary trying to name every game's channels up front.

**§22.1 has been updated to this shape** as part of adding this file — it was a direct contradiction between the doc and the code, and ARCHITECTURE.md's own §0 already commands fixing that rather than leaving it to drift.

---

## 5. Maintenance

This file is edited in the same change as the code, not batched:

- New local store/mock standing in for a real Firebase path → add a row to §3 (and §1/§2 if it's a new boundary).
- A comment names a Firestore/RTDB/Storage path not yet listed here → add it to §3, and to §4 if it adds to or contradicts ARCHITECTURE.md's schema.
- A Firebase package gets installed → update its row in §1.
- A mock gets wired to its real implementation → flip its status in §1 and §2, and note in §3 that the mirror is now live (don't delete the row — it's useful history of what stood in for what).
