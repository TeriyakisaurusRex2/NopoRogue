// ════════════════════════════════════════════════════════════════
// CHANGELOG  (Round 67r)
// ════════════════════════════════════════════════════════════════
// Player-facing release notes. Listed newest-first.
//
// AUTHORING:
//   - Add a new object to the TOP of CHANGELOG when shipping a round.
//   - `version` is what we compare against the player's "last seen" key
//     to flip the NEW badge on / off, so bump it every release.
//   - Keep entries short and player-facing — no internal jargon, no
//     file paths. One line per change.
//
// STORAGE:
//   `cetd_changelog_seen_version` in localStorage tracks the latest
//   version the player has opened. When CHANGELOG[0].version differs,
//   the login button shows a NEW dot until they open the panel.
// ════════════════════════════════════════════════════════════════

var CHANGELOG = [
  {
    version: '67t',
    title:   'New champion, combat polish & fixes',
    date:    '2026-05',
    entries: [
      {cat:'New content'},
      'Kaine, the Sanctum Keeper joins the summon pool — a slow, heavy Legendary bruiser who grinds enemies down. [Churn] recycles his hand, two of his cards open a [Bleed] wound the moment they are drawn, and his Hemorrhage innate makes every Bleed he inflicts hit harder the more STR he has.',
      'New keyword [Gift] — places a card directly into the opponent\'s hand.',
      {cat:'Mechanics'},
      'Card text now links the cards it creates — hover a highlighted card name to see that card\'s full face.',
      '[Compound] cards now show their grown values live as the count climbs, instead of always displaying the base number.',
      'Frenzy rebuilt — it now works for enemy creatures as well as champions, speeds up draws per stack, and drains mana while active (it collapses if mana runs dry).',
      {cat:'Combat & UI'},
      'The Deck and Discard piles in combat are now a card inspector — tap either to pause the fight and look through the cards. Deck order stays hidden.',
      'Pausing combat now desaturates the battlefield and pulses the resume button.',
      'Bigger, more readable card text.',
      'Your equipped relics now show in the combat top bar.',
      {cat:'Balance'},
      'Hoot\'s Research Grant no longer Compounds your whole hand — it now simply draws 2 cards. Whole-hand compounding scaled out of control.',
      {cat:'Bug fixes'},
      'Fixed: the combat Deck and Discard buttons opened an empty window — they now show your cards.',
      'Fixed: Champion Select now reopens on the last champion you played, instead of resetting to the Starcaller Druid.',
      'Fixed: Drain Lurker\'s Hunker innate did nothing — it now grants Shield as intended.',
      'Fixed: Giant Rat\'s Frenzied innate did nothing — it now builds Frenzy when it attacks.',
      'Card wording tidied up — Rummage and other card-creating cards now read consistently.',
    ]
  },
  {
    version: '67s',
    title:   'Five new champions',
    date:    '2026-05',
    entries: [
      'Five new Legendary champions join the summon pool — one keeper for each town building.',
      'Shtole, the Vault Keeper — his Treasure grows stronger every time you pay its [Compound] Sorcery.',
      'Hoot, the Bestiary Archivist — a kit where every card compounds, improving the more you invest.',
      'M\'bur, the Forge Blacksmith — turns basic Strikes into buffed, self-cycling cards.',
      'Barau, the Merchant — landing a crit conjures a sharper copy of that card into your deck.',
      'Leona of the Guild — plants Rigged Contract bombs into the opponent\'s deck; they detonate when played or churned away.',
      'New keywords: [Compound], [Banish], [Accrue], [Drawn]. Hover any keyword on a card for its rule.',
      'Card text tidied — Shield and Poison now read keyword-first ("Gain [Shield] 16"), matching every other status.',
      'Hover a computed value on a card (the blue numbers) to see its formula breakdown.',
    ]
  },
  {
    version: '67r',
    title:   'Combat polish & tutorial rewrite',
    date:    '2026-05',
    entries: [
      'Combat tutorial fully redesigned — clearer flow, action prompts you click the card directly, less wall-of-text.',
      'New "Find the Hall" quest sends you to the Adventurer\'s Hall before the Forge, so you see the full quest UI before being pointed at any specific building.',
      'Bigger cards in hand (+20%) and a prominent pause button beside your deck.',
      'New combat FX: shield form (halves slide + shine sweep), shield break (halves fall + fade), thorns (six-pointed wedge star that stabs outward), status delivery projectile with status-coloured trail, crit silhouette flash on the target.',
      'New combat SFX: slash (with pitch variation), per-status applies, DoT ticks, shield form / break, quest claim, post-combat XP bar fills.',
      'Forge slot click now asks "begin forging?" before consuming materials. The BEGIN FORGING button on the right side still acts immediately.',
      'Fixed: deck count showed 0 after the first reshuffle — counts now stay accurate.',
      'Fixed: EDIT DECK button and town building unlocks refresh immediately after claiming a quest, no reload needed.',
    ]
  }
];

var CHANGELOG_SEEN_KEY = 'cetd_changelog_seen_version';

function getChangelogSeenVersion(){
  try { return localStorage.getItem(CHANGELOG_SEEN_KEY) || ''; } catch(e){ return ''; }
}
function setChangelogSeenVersion(v){
  try { localStorage.setItem(CHANGELOG_SEEN_KEY, v); } catch(e){}
}

// Newer if alphanumerically greater. Works for the '67r' style numbering
// (lowercase letter suffix). When `seen` is empty, every entry counts as
// new — covers the first-ever boot.
function _changelogIsNewer(version, seen){
  if(!seen) return true;
  return version > seen;
}

// True if there is at least one entry the player has not opened yet.
function hasUnseenChangelog(){
  if(!CHANGELOG.length) return false;
  var seen = getChangelogSeenVersion();
  return _changelogIsNewer(CHANGELOG[0].version, seen);
}

// Toggle the NEW dot on the login button. Called from buildLoginScreen
// and on hide-changelog so the dot disappears immediately after opening.
function refreshChangelogBadge(){
  var btn = document.getElementById('login-changelog-btn');
  if(!btn) return;
  btn.classList.toggle('has-new', hasUnseenChangelog());
}

function showChangelog(){
  var ov = document.getElementById('changelog-overlay');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'changelog-overlay';
    ov.className = 'changelog-overlay';
    // Click outside the card closes the panel.
    ov.onclick = function(e){ if(e.target === ov) hideChangelog(); };
    document.body.appendChild(ov);
  }

  var seen = getChangelogSeenVersion();
  var html = '<div class="changelog-card">'
    + '<div class="changelog-header">'
    +   '<div class="changelog-title">CHANGELOG</div>'
    +   '<button class="changelog-close" onclick="hideChangelog()" title="Close">×</button>'
    + '</div>'
    + '<div class="changelog-body">';

  CHANGELOG.forEach(function(entry){
    var isNew = _changelogIsNewer(entry.version, seen);
    html += '<div class="changelog-entry">'
      +   '<div class="changelog-entry-head">'
      +     '<span class="changelog-entry-version">v' + entry.version + (entry.title ? ' · ' + entry.title : '') + '</span>'
      +     (entry.date ? '<span class="changelog-entry-date">' + entry.date + '</span>' : '')
      +     (isNew ? '<span class="changelog-new-badge">NEW</span>' : '')
      +   '</div>'
      +   '<ul class="changelog-entry-list">';
    (entry.entries || []).forEach(function(line){
      // A {cat:'...'} object is a category header; a string is a normal line.
      if(line && typeof line === 'object' && line.cat){
        html += '<li class="changelog-cat">' + line.cat + '</li>';
      } else {
        html += '<li>' + line + '</li>';
      }
    });
    html += '</ul></div>';
  });

  html += '</div></div>';
  ov.innerHTML = html;
  ov.classList.add('show');

  // Mark the latest version as seen and refresh the badge so the dot
  // clears as soon as the player opens the panel.
  if(CHANGELOG.length){
    setChangelogSeenVersion(CHANGELOG[0].version);
    refreshChangelogBadge();
  }
}

function hideChangelog(){
  var ov = document.getElementById('changelog-overlay');
  if(ov) ov.classList.remove('show');
}
