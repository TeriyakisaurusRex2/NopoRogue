// ════════════════════════════════════════════════════
// INIT  —  runs after all data files are loaded
// Load order: game.js → deck_builder.js → town.js → cards.js →
//   card_effects.js → combat.js → achievements.js → areas.js →
//   relics.js → expedition.js → vault.js → creatures/*.js →
//   audio.js → init.js
// ════════════════════════════════════════════════════
//
// Round 63: boot flow rewritten to introduce a loading screen +
// login screen. The previous flow dumped the player straight into
// the champion-select grid; now they see:
//   1. Loading screen with progress bar (preloads music + key art)
//   2. Login screen (save card + saves dropdown + settings)
//   3. → CONTINUE / BEGIN → champion select
//
// Settings always loads first (those are global, not per-save).
// The legacy single-save migration runs before any save reads so
// existing players see their progress as "Save 1" without manual
// intervention.

loadSettings();

// One-time migration: legacy cetd_v6 → first slot in the new
// multi-save registry. Idempotent — no-op once the registry exists.
if(typeof migrateLegacySaveIfNeeded === 'function') migrateLegacySaveIfNeeded();

// Hide the nav while loading + login screens are active. The
// nav-bar reappears when the player enters the game proper via
// enterGameFromLogin().
showNav(false);

// Kick off preload. The loading screen is already .active in the
// HTML, so it paints immediately and the progress bar fills as
// assets land.
var _loadingBar    = document.getElementById('loading-bar');
var _loadingStatus = document.getElementById('loading-status');

preloadAssets(_loadingBar, _loadingStatus, function(){
  // Final status flash before we transition.
  if(_loadingStatus) _loadingStatus.textContent = 'Ready.';

  // If there's an active save, load its data + run offline catch-up
  // (with diff capture for the login card's "while you were away"
  // block). If there's no active save we leave PERSIST at defaults
  // and the login screen shows the new-save form instead.
  if(getActiveSaveId()){
    loadPersist();
    if(typeof applyOfflineProgressWithDiff === 'function') applyOfflineProgressWithDiff();
    if(typeof checkBestiaryAutoUnlock === 'function') checkBestiaryAutoUnlock();
  }

  // Hand off to login screen.
  showLoginScreen();
});

// Note: buildSelectScreen / showNav(true) / updateNavBar('adventure')
// / restoreQuestBadge / preloadGemIcons now run inside
// enterGameFromLogin() (game.js) when the player clicks CONTINUE.
preloadGemIcons();
