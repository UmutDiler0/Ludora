# Session updates log

**Purpose:** a running, human-readable history of what was asked and what was
done, prompt by prompt — so a new session (or a different agent) can pick up
this project without re-deriving context from git history alone. Commit
messages say *what* changed; this says *why*, *in response to what*, and what
is still left half-finished.

**Maintenance rule:** append new entries at the bottom, in the same session
that does the work — don't batch it into a later cleanup pass, and don't
rewrite past entries except to fix a factual error. Each entry should name the
actual files touched, not just describe the feature, so "what does X mean"
can always be answered by opening the file. Cross-check open items against
`docs/firebase.md` before starting new Firebase work — that file, not this
one, is the authority on what's wired vs. mocked.

---

## 2026-08-27 — Session 1

### 1. Turkish language support (full app)

**Prompt:** add Turkish, default to English, use the system locale on first
launch (mirroring how `themePref` already resolves `'system'`), changeable
from Settings — but explicitly *not* the same UI as the theme switch; language
had to be a dropdown, not a segmented switch.

**Did:**
- New `src/i18n/` tree: `I18nProvider.tsx` (`resolveLocale`, `systemLocale()`
  via `expo-localization`, `useI18n()`/`useT()`), `en/`/`tr/` string trees —
  24 namespaces, 48 paired files. `tr` is typed as `: Strings` (`typeof en`),
  so a missing/extra/mistyped key is a compile error, not a silent gap.
- New `Select` component in `components/ui/index.tsx` — closed field that
  opens a `Dialog` radio-list. Used for Settings' language field
  (System/English/Türkçe); deliberately different from the Light/Dark/System
  card-row pattern Appearance uses.
- `app/_layout.tsx` wraps the tree in `I18nProvider`.
- Translated every screen's static UI text across all 8 games, auth,
  onboarding, home, play, profile, leaderboard, achievements, avatar
  shop/customize/create, settings itself.
- **Deliberate scope carve-outs, left in English:** game content decks
  (Taboo words, Sketch It prompts, Zarta trivia, Imposter categories,
  Detective cases, Story fragments — these are content, not UI copy), the
  ~81 avatar item names, and engine-baked dynamic log/narrative text
  (`LogEntry.text` etc.) — translating that would mean restructuring the
  shared `GameEngine` contract across all 5 engines, out of scope for "add
  a language."
- Fixed two related bugs surfaced along the way: Vampire Village/Taboo
  engines baked English role/team *names* into state next to a stable id —
  UI now looks up the translated name from the id instead of trusting the
  engine string. `vampireVillage/chat.ts`'s `chatAccess()` returned literal
  English sentences from a file whose own header says "the server runs
  exactly this file" — converted to reason-code unions (`ChatRoomTitle`,
  `ChatNoticeReason`), UI maps codes to translated text.
- Verified clean throughout: `tsc --noEmit`, `eslint src`, `jest` (219/219).

**Not done / not verified:** never run in an actual simulator — dropdown
behaviour, live language switching, and Turkish string overflow are unverified
visually.

---

### 2. Room codes, public/private visibility, Find a Room screen

**Prompt:** creating a lobby should generate a room code; a "find room" screen
should show a code-entry box *and* a list of public rooms (single screen, not
two separate flows); game config screens need a public/private choice —
public rooms are listed for others, private rooms are joinable by code only.

**Did (client-side shape, no backend existed yet at this point):**
- New `services/rooms/` boundary, matching the existing `services/network`,
  `services/chat`, `services/auth` split: `types.ts` (`Room`, `RoomVisibility`,
  `RoomGateway` interface), `roomCode.ts` (`generateRoomCode`, using the
  `ROOM_CODE_ALPHABET`/`ROOM_CODE_LENGTH` constants in `constants/app.ts` that
  already existed but were unused), `mockRooms.ts` (module-level in-memory
  directory, same shape as `mockPresence`).
- `stores/rooms.ts` — reactive mirror of `listPublicRooms()` for screens that
  only read the list.
- `features/games/core/RoomVisibilityCard.tsx` — shared Public/Private picker
  (two pressable cards, matching the existing preset-picker look — a true
  binary, so *not* the `Select` dropdown built for language).
- `features/games/core/LobbyScreen.tsx` — now shows the real room code +
  visibility chip instead of static "local room" copy.
- Every game's `*-setup.tsx` calls `roomGateway.createRoom()` on "Continue to
  Lobby"; every `*-lobby.tsx` calls `closeRoom()` when the owner starts the
  game. Files touched: `game-{setup,lobby}.tsx`, `taboo-{setup,lobby}.tsx`,
  `sketch-{setup,lobby}.tsx`, `zarta-{setup,lobby}.tsx`,
  `imposter-{setup,lobby}.tsx`.
- New `app/find-room.tsx` — code entry + live public-room list in one screen,
  per the prompt. `app/(tabs)/play.tsx`'s "Browse rooms" row now routes here;
  the separate "Join by code" stub row was removed (folded into this screen).
- i18n: new `rooms` namespace, `gameCore.visibility`/`roomCodeBody`, reworded
  `play.browseRooms` copy.
- `docs/firebase.md` updated: new `RoomGateway` row in the boundary table,
  new §3.11 section.
- At this point rooms were **single-device only** — no real backend, so
  "browsing rooms" only ever showed rooms *this device* created; "joining"
  replayed the room's own stored route/params rather than adding a real
  participant. (This limitation is gone as of entry 8 below.)

---

### 3. Android package name / iOS bundle ID

**Prompt:** asked for the Android package name, said to change it from
`com.example` to `com.ludora.ludora` if that's what it was.

**Did:** checked `app.json` — it was already `com.ludora.app` on both
`android.package` and `ios.bundleIdentifier`, not a placeholder. Asked before
changing anything (package-name changes are hard to reverse after a Play
Store upload); user chose to keep `com.ludora.app`. No file changes.

---

### 4. Real Firebase Authentication wired

**Prompt:** user added `google-services.json` + `GoogleService-Info.plist` to
the repo root and asked to implement the SDKs against them, then asked what
Firebase product to tackle next.

**Did:**
- Confirmed both config files resolve to project `ludora-13e00`, package/
  bundle `com.ludora.app` — consistent with `app.json`. Confirmed they're
  gitignored (not accidentally committed).
- `stores/session.ts`: swapped every `mockAuthGateway.*` call for
  `firebaseAuthGateway.*` (the real gateway, `services/auth/firebaseAuth.ts`,
  was already fully written — just never imported).
- Deleted `services/auth/mockAuth.ts` per its own header instruction ("when
  FirebaseAuthGateway lands this file is deleted, not hardened").
- **Fixed a Jest regression this caused:** `@react-native-firebase/auth`'s
  web fallback (what Jest's Node environment resolves to) pulls in the raw
  `firebase` JS SDK as untransformed ESM, crashing any test that imports
  `stores/session.ts` transitively. Added `jest.mock(...)` stubs for
  `@react-native-firebase/auth` and (pre-emptively) `/database` in
  `jest.setup.js`, same pattern already used there for AsyncStorage.
- `docs/firebase.md` updated: Auth row flipped to "Installed. Wired and
  live", boundary table's Identity row updated, corrected a now-stale
  sentence claiming the config files didn't exist.
- Verified clean: `tsc`, `eslint src`, `jest` (219/219).

**Told the user, not yet confirmed done:** Email/Password sign-in must be
enabled in Firebase Console → Authentication → Sign-in method, or real
sign-in fails with `auth/operation-not-allowed`. A dev-client build is
required either way — `@react-native-firebase`'s native modules don't run in
Expo Go (`expo-dev-client` is installed but never built).

---

### 5. Git push troubleshooting

**Prompt:** "I can't push my commit, check git log for error."

**Did:** `git status`/`git log`/`git remote -v`/`git branch -vv` all showed a
clean, non-diverged history, 1 commit ahead of `origin/master`. No hooks, no
credential-helper issue. `git push --dry-run` succeeded with no prompt, then
an actual `git push origin master` succeeded (`cb7ebc6..2b5db52`). Root cause
was never identified — likely a stale credential in whichever client the user
tried from originally (VSCode/GitHub Desktop), not a repo problem. No file
changes.

---

### 6–7. SHA-1/SHA-256 fingerprint, EAS CLI setup

**Prompt:** asked for the Android SHA-1/SHA-256 to register Google Sign-In,
"then I will update google service files."

**Did:**
- Checked for a way to produce these: no `android/` folder (pure managed
  Expo, never prebuilt), no `eas.json`, no local JDK/`keytool`, no Android
  SDK — nothing to extract a fingerprint from. Explained the three real
  paths (EAS-managed keystore via `eas credentials`, the Play Console App
  Signing certificate once uploaded, or a local debug keystore) and pointed
  at `eas-cli`.
- User tried `npx eas login` and hit `npm error could not determine
  executable to run` — diagnosed as an `npx` package-name mismatch: the npm
  package is `eas-cli`, not `eas` (its bin happens to be named `eas`, but
  `npx eas` looks for a package literally called `eas`). Confirmed
  `npx eas-cli --version` resolves fine (`22.6.0`).
- User ran `eas-cli credentials`, which auto-created and linked an EAS
  project — `@umutd/Ludora`, id `74aa8490-bf2c-497b-8c19-8c4ed969cbf8`,
  written into `app.json`'s `extra.eas.projectId` — then failed on a missing
  `eas.json`.
- Created `eas.json` with standard `development`/`preview`/`production`
  build profiles (`development` has `developmentClient: true`, matching the
  installed `expo-dev-client`) and a `submit.production` stub.

**Not done:** the user hasn't actually generated a keystore or pasted a
fingerprint back yet — `eas-cli credentials -p android` → "Keystore: Manage
everything needed to build your project" is the next concrete step, still
pending.

---

### 8. Firestore, Storage, Realtime Database

**Prompt:** "I think we will need firestore, storage, real time db do you
need any tools" — then, after enabling all three in Firebase Console and
re-downloading the config files: "do you need anything before we start, e.g.
should I upgrade google services."

**Did:**
- Installed `@react-native-firebase/firestore@26.3.0` and
  `@react-native-firebase/storage@26.3.0`, pinned exactly like `app`/`auth`/
  `database` (this repo's standing rule — all `@react-native-firebase/*`
  packages must match exactly or `npm install` ERESOLVE-conflicts). Confirmed
  neither needs an `app.json` config plugin entry (no `app.plugin.js` in
  either package, same as `/database`).
- Explained the console-side steps for each product (Firestore Native mode +
  region, RTDB region, Storage bucket — all one-time, permanent choices) and
  that these need the user's own account, not something doable from here.
  Asked which to build out first; user chose to finish console setup before
  more code.
- User re-downloaded and replaced both config files (confirmed current,
  correct project/package, SHA-1 already present from step 6–7) and reported
  Firestore/Storage/RTDB enabled, plus gave the RTDB URL:
  `https://ludora-13e00-default-rtdb.firebaseio.com/`.
- **Wired Realtime Database for real** (the piece with the most existing
  groundwork — `firebaseRooms.ts` was already fully written from an earlier,
  separate pass that also made `RoomGateway`'s methods `async` and pinned
  the Firebase package versions):
  - Confirmed via the SDK's own source that `getDatabase()` needs an
    explicit URL — enabling RTDB doesn't bake a `databaseURL` into
    `google-services.json`/`GoogleService-Info.plist` the way
    `storage_bucket` is. Hardcoded the URL as `RTDB_URL` in
    `firebaseRooms.ts`, passed to `getDatabase(undefined, RTDB_URL)`.
  - Added `export const roomGateway = createFirebaseRooms();` to
    `firebaseRooms.ts` (mirroring `mockRooms.ts`'s own singleton export).
  - Repointed all 12 files that imported `roomGateway` from `mockRooms.ts`
    to import from `firebaseRooms.ts` instead: `stores/rooms.ts`,
    `app/find-room.tsx`, and all five games' `*-setup.tsx`/`*-lobby.tsx`
    pairs.
  - Kept `mockRooms.ts` (unlike the deleted `mockAuth.ts`) — still useful
    for local dev without hitting the network; just no longer imported
    anywhere.
  - Updated `jest.setup.js`'s `/database` mock note (added pre-emptively in
    step 4, now actually load-bearing).
  - `docs/firebase.md` updated: §1 status table (Firestore/Storage/RTDB
    rows), §2 boundary table, §3.11 rewritten to describe the now-live
    RTDB gateway instead of the mock.
  - Verified clean: `tsc`, `eslint src`, `jest` (219/219).

**Not done:** Firestore and Storage are installed only — **no gateway
written for either.** Firestore in particular is a bigger piece of work than
Auth/Rooms were: `stores/profile.ts`, `stores/progression.ts`, the
leaderboard, and the avatar catalogue are all plain local mirrors today with
no `types.ts`/`mock*.ts` split to swap — that boundary has to be designed and
built before any real Firestore wiring, unlike Auth/Rooms where the boundary
already existed and only the swap was missing. Storage has no consuming
upload/display flow at all yet (avatar catalogue is render hints, not real
image assets).

---

## Current state / open items for the next session

- **Auth:** wired and live. Still needs: Email/Password enabled in Firebase
  Console (unconfirmed), and a dev-client build to actually run it (no
  Expo Go).
- **Rooms (RTDB):** wired and live, cross-device for real.
- **Firestore, Storage:** packages installed, pinned to `26.3.0`, nothing
  else done. Firestore needs a gateway boundary designed before wiring.
- **Presence, Chat:** still mock-only (`mockPresence`, `mockChat`) — no real
  implementation written yet for either.
- **Android signing:** no keystore generated yet. Next step is the user
  running `eas-cli credentials -p android` themselves, then registering the
  resulting SHA-1/SHA-256 in Firebase Console and re-downloading the config
  files.
- **EAS / native build:** `eas.json` exists with standard profiles; no build
  has actually been run yet. `android/` folder still doesn't exist — this is
  still a pure managed Expo project.
- **Firebase CLI (`firebase-tools`):** not installed/logged in locally; no
  `firebase.json`/`.firebaserc`. Only needed if/when security rules should be
  deployed from the CLI instead of pasted into each product's Console Rules
  tab by hand.
- Full feature history before this session (Turkish i18n's exact per-file
  breakdown, the room system's exact per-file breakdown) is in entries 1–2
  above; `git log` has the actual commits.
