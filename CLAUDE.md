# Noporogue

Browser-based real-time roguelite deckbuilder. Solo dev (J). Vanilla HTML/CSS/JS, no framework, no build step. State lives in a global `PERSIST` object saved to localStorage. Deploys to Netlify from `main`. Test by opening `index.html` directly.

## Start every session by reading

`../Noporogue Additional/Session_Notes.txt` — the real changelog. Other docs in that folder describe intent; **when code and docs disagree, code wins.** Append to Session_Notes after non-trivial changes under the current session header.

## File architecture

Root: `index.html` `style.css` `game.js` `town.js` `deck_builder.js` `audio.js` `init.js`.

`data/`: `cards.js` `card_effects.js` `combat.js` `creatures/*` `areas.js` `vault.js` `expedition.js` `relics.js` `quests.js` (empty stub) `achievements.js`.

Loading order set in `index.html`:
`game.js → deck_builder.js → town.js → cards.js → card_effects.js → combat.js → achievements.js → areas.js → relics.js → expedition.js → vault.js → creatures/*.js → audio.js → init.js`

## Critical rules — do not violate

- **`style.css` is fragile.** A Python script previously deleted ~1200 lines from it. NEVER use range-based deletion on this file. Use exact-string `Edit` only, and grep to confirm the target string before editing. Pre-flight check before/after CSS work — these selectors must still exist:
  `.town-panel-bg`, `.hall-panel-main`, `.building-card`, `.bc-sprite`, `.bestiary-creatures-layout`, `.bestiary-tab-content`, `.market-body`, `.sanctum-body`, `.vault-area-row`, `.exp-row`, `.de-header`.
  If line count drops below ~1200, something was deleted — stop and investigate.
- **`data/quests.js` is an empty stub.** All quest logic lives in `town.js`. Do not add quest logic to `quests.js` — a previous overwrite bug came from exactly this (it loaded after town.js and clobbered `acceptQuest`/`abandonQuest`/`claimQuest`).
- **`expedition.js` uses `adventurers_hall` and `b.expeditionSlots`** — not `expedition_hall` or `b.slots`. Don't reintroduce the old names.
- **Single authoritative path preferred.** No parallel renderers or duplicate state — the old `refreshExpeditionHallPanel` overwrite bug is the cautionary tale.
- **Before editing a function, grep for duplicate declarations.** JS function-declaration hoisting means the *last* `function X(){}` in a file wins — a second declaration silently shadows the first, so edits to the orphan never take effect. Run `grep -n "^function NAME" file.js` before assuming an edit will run. (The Round 7 `gemImgHTML` saga was exactly this: two declarations in `game.js`, all my edits hit the wrong one for six rounds.)
- **Layout-critical `display:` lives in CSS, not inline.** `showLockedBuildingUI` (and similar refresh paths) do `el.style.display = ''` when unlocking — which clears any inline display property. If an element relies on `style="display:grid"` set in HTML, that gets wiped on every panel refresh and the layout collapses to block flow. Always define structural display in a CSS rule for any element whose inline display might be cleared by JS. (Round 8 bestiary scroll bug.)
- **Watch for code after a `return { ... }` literal.** It's silently unreachable but looks like setup. The original `makeGS()` had `return { ...obj }; applyRelics(gs); return gs;` — both lines after the brace were dead. No relics ever applied. Always assign object literals to a local var (`var x = { ... }; setup(x); return x;`) when post-construction setup is needed. (Round 11 relic apply-never-ran bug.)
- **Never set `display` on `.screen` ID overrides.** Visibility is owned by `.screen` (display:none) → `.screen.active` (display:flex). Setting `display` on `#screen-id` wins via ID specificity and leaves the screen visible even when inactive — it'll appear stacked under whichever screen IS active. ID rules can change `max-width` / padding / etc, but must never touch `display`. (Round 30 → 31 bug: `#select-screen { display:flex }` made the champion-select screen leak under town.)

## Code style

- Vanilla JS, `var` not `let`/`const` (legacy choice — match it).
- Single-file CSS. HTML structure in `index.html`, all rendering in JS.
- When something breaks, look at *what code changed*, not cache.

## Working preferences (J)

- Be direct. Concrete hypotheses over hedged language.
- Don't ask for permission on small obvious edits; do ask before broad refactors or anything that touches `style.css` more than a few lines.
- **Communicate facts and mechanics, not strategy.** Tutorial / tooltip / inspector copy describes what a thing *is* and *does*, never what the player *should do* with it. No "low value" judgements, no "replace with...", no playstyle role labels (e.g. "Mana Engine / Hand Burst" is exactly the kind of thing to avoid). Trust players to find their own uses. Confirmations explain *consequences*, not optimal play.
- **No em dashes in dialog or tutorial copy.** Use regular sentences, commas, periods, or parens. Em dashes have a specific cadence that doesn't fit the project's voice. Applies to NPC lines, tutorial pages, toasts, anywhere player-facing prose appears.
- **Sprite-flipping convention.** All creature sprites are drawn facing **left** by default. When a sprite represents something *friendly* to the player (the player's currently-selected champion, an unlocked champion in their roster, an NPC the player owns or works with, a freshly-summoned champion being added to the roster), flip it to face **right** via the `flip-x` class — pass `'flip-x'` as the 4th arg to `creatureImgHTML(id, emoji, size, 'flip-x')`. Enemies, unowned creatures, encountered-but-unowned bestiary entries stay facing left. The flip is the subtle UI signal that "this side is yours / this one is on your team." Applied in: combat player sprite, NPC greetings, sanctum overview/relics, champion select (card + side rail), summons reveal, arena gambling slot (slotted = your champion), expedition slot (sent on your behalf). Owned-vs-unowned pool views (summons pool grid) flip per-entry based on `PERSIST.unlockedChamps`.

## Sibling files / parallel scaffolds

- `editor.html` is a **legacy parallel scaffold** of `index.html` for a creature/card editor tool. It drifts behind the live build — currently has ~50 dead `<script src="data/creatures/X.js">` tags pointing at deleted files (404s on open). Don't assume edits to `index.html` apply there too. When making structural changes that touch script-tag lists or panel HTML, mention it as a "you might want to mirror this in editor.html" follow-up.

## Conventions worth knowing

- Palette: `#1a1208 / #120802` panels, `#2a1808 / #3a2010` borders, `#d4a843 / #c09030` gold, `#e8d7a8 / #c0a060` parchment. Stat colors: `#e88060` STR, `#9adc7e` AGI, `#9ad8e8` WIS.
- Fonts: Cinzel headings, Crimson Text body, Press Start 2P pixel UI (combat).
- Building panels: `.town-panel-bg` overlay (toggle `.show`), `85vh × min(1100px,95vw)`. Layout: NPC greeting → level/XP → tabs → content.
- Screens: only one `.screen.active` at a time. `showScreen(id)` switches. `showNav(bool)` toggles nav bar.
- Combat: shield 5s base / 9s step-up. Healing is rare in real-time combat.
- Ascension: 7 tiers (Ruby → Black Opal). Should feel earned, not purchased. Mastery XP + gem cost. Unlocks a relic slot per tier.
- **Activity stat-fit model.** Each town activity has a primary stat. Champion's `effectiveStat = primary*1.0 + (other1 + other2)*0.25`. Speed bonus = `eff/(eff+100)`, capped at 0.5. Apply via `champActivitySpeedBonus(champId, primaryStat)`. Mapping: Forge=STR, Expedition=AGI, Arena=WIS (future). Champion gets locked to the activity (`cp.lockedForge` / `cp.lockedExpedition`) — use `isChampLocked(id)` and `getChampLockLabel(id)` for new code; existing direct `cp.lockedExpedition` checks are fine to leave alone.

## Key globals

- `PERSIST` — global save object. `savePersist()` / `loadPersist()`.
- `getChampPersist(id)` — get/create champion record.
- `isChampLocked(id)` / `getChampLockLabel(id)` — true / 'ON EXPEDITION' | 'AT THE FORGE' | null.
- `champActivitySpeedBonus(champId, primaryStat)` — { speedBonus, effectiveStat, primary, secondaryA, secondaryB }.
- `creatureImgHTML(id, fallback, size)` / `goldImgHTML(size)` — sprite helpers.
- `renderKeywords(text)` — parses `[Keyword]` markers into styled spans.
- `getAscensionLevel/Class/ChipHTML`, `canAscend`, `ascendChampion`.
- `openBuilding(id)` / `closeBuildingPanel(id)` (town.js).
- Forge: `assignChampToForge(slotIdx, champId)` / `releaseChampFromForge(slotIdx)` / `_forgePickChampForSlot(slotIdx)` (M'bur picker).
- Forge dialogs: `_forgeShowMburConfirm({title,line,body,confirmLabel,confirmDestructive,onConfirm})` — any new Forge prompt should route through this.
