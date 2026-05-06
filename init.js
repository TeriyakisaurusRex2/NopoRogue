// ════════════════════════════════════════════════════
// INIT  —  runs after all data files are loaded
// Load order: game.js → data files → init.js
// ════════════════════════════════════════════════════

loadSettings();
loadPersist();
checkBestiaryAutoUnlock();
buildSelectScreen();
showNav(true);
updateNavBar('adventure');
restoreQuestBadge();
preloadGemIcons();
