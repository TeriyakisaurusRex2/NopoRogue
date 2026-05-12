// ════════════════════════════════════════════════════════════════
// DECK BUILDER — Noporogue (v2 — Hearthstone-inspired)
// ════════════════════════════════════════════════════════════════
// Layout: Left deck list | Center card browser | Right inspector
// Click card in browser to add. Click − in deck list to remove.
// Click any card to inspect on right panel.
// ════════════════════════════════════════════════════════════════

var _deChampId = null;
var _deDeck    = [];
var _deHistory = [];
var _deTab     = 'champion';                // legacy — kept for any external callers; library view uses the filters below
var _deInspect = null;
var _deReturnScreen = 'area-screen';
var MAX_CARD_COPIES = 5;
// Library view state
var _deSearch       = '';                   // free-text filter on card name
var _deSourceFilter = 'all';                // 'all'|'champion'|'universal'|'shared'|'collection'
var _deTypeFilter   = 'all';                // 'all'|'attack'|'defense'|'utility'
var _deSort         = 'mana';               // 'mana'|'name'|'source'|'type'

function openChampDeckView(){
  _sanctumChamp = selectedChampId;
  showDeckViewForChamp(selectedChampId);
}
function openChampSanctum(){ openDeckEditor(selectedChampId); }

// ── Main entry ──
function openDeckEditor(champId){
  var cur = document.querySelector('.screen.active');
  _deReturnScreen = cur ? cur.id : 'area-screen';
  _deChampId  = champId;
  _deDeck     = buildStartDeck(champId).slice();
  _deHistory  = [];
  _deTab      = 'champion';
  _deInspect  = null;

  var ch = getCreaturePlayable(champId);
  var cp = getChampPersist(champId);

  setCreatureImg(document.getElementById('de-portrait'), champId, ch.icon, '36px');
  document.getElementById('de-champ-name').textContent = ch.name;
  document.getElementById('de-champ-sub').textContent = 'Lv.' + cp.level + ' ' + getAscensionTierName(champId);
  document.getElementById('de-stat-row').innerHTML =
    '<span class="de-stat de-stat-str">'+Math.round(cp.stats.str)+' STR</span>'+
    '<span class="de-stat de-stat-agi">'+Math.round(cp.stats.agi)+' AGI</span>'+
    '<span class="de-stat de-stat-wis">'+Math.round(cp.stats.wis)+' WIS</span>';
  document.getElementById('de-gold-row').innerHTML = goldImgHTML('12px')+' '+PERSIST.gold;
  var deRelic = document.getElementById('de-relic-row');
  if(deRelic) deRelic.innerHTML = relicStripHTML(champId, {size:'22px'});

  var innateEl = document.getElementById('de-innate');
  if(innateEl){
    innateEl.innerHTML = '<div class="de-innate-name">✦ '+(ch.innateName||'Innate')+'</div>'
      +'<div class="de-innate-desc">'+renderKeywords(ch.innateDesc||'')+'</div>';
  }

  _deRender();
  showScreen('deck-edit-screen');
  showNav(false);
  if(typeof showTutorial === 'function') showTutorial('deck_builder_intro');
}

function _deRender(){
  _deRenderDeckList();
  _deRenderBrowser();
  _deRenderInspector();
  _deRenderFooter();
}

// ── Left: compact deck list (sorted by mana cost) ──
function _deRenderDeckList(){
  var list = document.getElementById('de-deck-list');
  if(!list) return;
  var cp = getChampPersist(_deChampId);
  var cap = calcDeckCap(cp.stats.str);

  // Group by unique card
  var seen = {};
  var groups = [];
  _deDeck.forEach(function(id){
    if(!seen[id]){ seen[id] = {id:id, count:0}; groups.push(seen[id]); }
    seen[id].count++;
  });

  groups.sort(function(a,b){
    var ca = CARDS[a.id], cb = CARDS[b.id];
    var ma = ca?(ca.manaCost||0):999, mb = cb?(cb.manaCost||0):999;
    if(ma !== mb) return ma - mb;
    return (ca?ca.name:'') < (cb?cb.name:'') ? -1 : 1;
  });

  var statColors = {str:'#e88060',agi:'#9adc7e',wis:'#9ad8e8'};
  var html = '';
  groups.forEach(function(g){
    var cd = CARDS[g.id]; if(!cd) return;
    var isInsp = _deInspect && _deInspect.id === g.id;
    var isFiller = g.id === 'filler';
    var sc = statColors[cd.stat] || '#c0a060';
    var atMaxCopies = !isFiller && g.count >= MAX_CARD_COPIES;

    var rowCls = 'de-drow'+(isInsp?' selected':'')+(isFiller?' de-drow-filler':'');
    // Filler rows: only show − (the +-equivalent for filler is "add another empty
    // slot" which doesn't make sense — filler appears automatically). Real cards
    // get both buttons.
    var minusBtn = '<button class="de-drow-btn de-drow-minus" onclick="event.stopPropagation();_deRemoveCard(\''+g.id+'\')" title="Remove one copy">−</button>';
    var plusBtn  = isFiller ? ''
      : '<button class="de-drow-btn de-drow-plus'+(atMaxCopies?' disabled':'')+'" '
        +(atMaxCopies?'':'onclick="event.stopPropagation();_deAddCard(\''+g.id+'\')" ')
        +'title="'+(atMaxCopies?'Max '+MAX_CARD_COPIES+' copies':'Add one copy')+'">+</button>';

    html += '<div class="'+rowCls+'" onclick="_deInspectCard(\''+g.id+'\')" '
      +(isFiller?'title="Dead Weight — fills any unassigned deck slot. [Sorcery] (all mana): draw 1."':'')+'>'
      +'<div class="de-drow-type" style="background:'+sc+';"></div>'
      +'<div class="de-drow-icon">'+(cd.icon||'◇')+'</div>'
      +'<div class="de-drow-name">'+cd.name+'</div>'
      +'<div class="de-drow-count">×'+g.count+'</div>'
      +(cd.manaCost?'<div class="de-drow-mana">'+cd.manaCost+'</div>':'')
      +'<div class="de-drow-btns">'+minusBtn+plusBtn+'</div>'
      +'</div>';
  });
  list.innerHTML = html;

  var used = _deDeck.length;
  document.getElementById('de-size-fill').style.width = Math.min(100,Math.round(used/cap*100))+'%';
  document.getElementById('de-size-label').textContent = used+' / '+cap+' slots';
  document.getElementById('de-deck-size').textContent = '('+used+')';
}

// ── Center: library-style card browser (Hearthstone/MTG:Arena-inspired) ──
// Search + filter chips + sort dropdown across a unified card pool.
// Toolbar and grid render independently so typing in the search box
// doesn't lose focus on every keystroke.
function _deRenderBrowser(){
  _deRenderToolbar();
  _deRenderGrid();
}

// Build the unified card pool for the active champion, tagged with source.
// Each entry: {cardId, source, sourceChampId, isLocked, canBuy}.
//   source:        'champion' | 'universal' | 'shared' | 'collection'
//   sourceChampId: who the card belongs to (or null for universal)
//   isLocked:      true when this champion can't add it yet (locked reward)
//   canBuy:        true when the lock can be lifted via gold here
function _deBuildLibrary(){
  var ch = getCreaturePlayable(_deChampId);
  var cp = getChampPersist(_deChampId);
  var mods = getSanctumMods(_deChampId);
  var purchased = mods.purchasedUnlocks || [];
  var seen = {};
  var library = [];

  function add(cardId, source, sourceChampId, isLocked, canBuy){
    if(seen[cardId] || !CARDS[cardId]) return;
    seen[cardId] = true;
    library.push({cardId:cardId, source:source, sourceChampId:sourceChampId, isLocked:!!isLocked, canBuy:!!canBuy});
  }

  // 1. Champion native cards: startDeck (filtered to this champ) + cardRewards
  (ch.startDeck||[]).forEach(function(id){
    if(CARDS[id] && CARDS[id].champ === _deChampId) add(id, 'champion', _deChampId, false, false);
  });
  (ch.cardRewards||[]).forEach(function(id){
    if(!CARDS[id]) return;
    var isPurchased = purchased.indexOf(id) !== -1;
    var locked = !isPurchased;
    var canBuy = locked && cp.level >= 5;
    add(id, 'champion', _deChampId, locked, canBuy);
  });

  // 2. Universal cards (always available). Note: 'filler' is the card id;
  // its display name is 'Dead Weight'. Earlier code referenced 'dead_weight'
  // which doesn't exist as a CARDS key — silently dropped from the pool.
  ['strike','brace','focus','filler'].forEach(function(id){
    if(CARDS[id]) add(id, 'universal', null, false, false);
  });

  // 3. Shared cards from other Ruby+ ascended champions
  if(getAscensionLevel(_deChampId) >= 1){
    PERSIST.unlockedChamps.forEach(function(otherId){
      if(otherId === _deChampId || otherId === 'dojo_tiger') return;
      if(getAscensionLevel(otherId) < 1) return;
      var other = CREATURES[otherId]; if(!other) return;
      (other.startDeck||[]).forEach(function(id){
        if(CARDS[id] && CARDS[id].champ === otherId) add(id, 'shared', otherId, false, false);
      });
      (other.cardRewards||[]).forEach(function(id){
        if(CARDS[id]) add(id, 'shared', otherId, false, false);
      });
    });
  }

  // 4. Collection (PERSIST.sanctum.unlockedCards) — only cards usable by this champ
  if(PERSIST.sanctum && PERSIST.sanctum.unlockedCards){
    Object.keys(PERSIST.sanctum.unlockedCards).forEach(function(id){
      if(!PERSIST.sanctum.unlockedCards[id] || !CARDS[id]) return;
      var c = CARDS[id];
      if(c.champ && c.champ !== _deChampId) return; // collection is per-champion-usable
      add(id, 'collection', c.champ || null, false, false);
    });
  }

  return library;
}

function _deFilterLibrary(library){
  var s = (_deSearch||'').trim().toLowerCase();
  return library.filter(function(it){
    if(_deSourceFilter !== 'all' && it.source !== _deSourceFilter) return false;
    if(_deTypeFilter !== 'all'){
      var t = ((CARDS[it.cardId].type)||'utility').toLowerCase();
      if(t !== _deTypeFilter) return false;
    }
    if(s){
      var name = (CARDS[it.cardId].name||'').toLowerCase();
      if(name.indexOf(s) === -1) return false;
    }
    return true;
  });
}

function _deSortLibrary(library){
  var sourceOrder = {'champion':1, 'shared':2, 'universal':3, 'collection':4};
  var typeOrder   = {'attack':1, 'defense':2, 'utility':3};
  return library.slice().sort(function(a, b){
    var ca = CARDS[a.cardId], cb = CARDS[b.cardId];
    var ma = ca.manaCost||0, mb = cb.manaCost||0;
    if(_deSort === 'name') return (ca.name||'').localeCompare(cb.name||'');
    if(_deSort === 'source'){
      var oa = sourceOrder[a.source]||9, ob = sourceOrder[b.source]||9;
      if(oa !== ob) return oa - ob;
      return (ma - mb) || (ca.name||'').localeCompare(cb.name||'');
    }
    if(_deSort === 'type'){
      var ta = typeOrder[(ca.type||'utility').toLowerCase()]||9;
      var tb = typeOrder[(cb.type||'utility').toLowerCase()]||9;
      if(ta !== tb) return ta - tb;
      return (ma - mb) || (ca.name||'').localeCompare(cb.name||'');
    }
    // mana (default)
    if(ma !== mb) return ma - mb;
    return (ca.name||'').localeCompare(cb.name||'');
  });
}

// Render just the toolbar (search box, filter chips, sort dropdown).
// Hides source chips for sources that have no cards in the library —
// e.g. SHARED only appears once another champion is ascended.
function _deRenderToolbar(){
  var toolbar = document.getElementById('de-avail-toolbar');
  if(!toolbar) return;

  var library = _deBuildLibrary();
  var availableSources = {};
  library.forEach(function(it){ availableSources[it.source] = true; });

  var sources = [
    {id:'all',         label:'ALL'},
    {id:'champion',    label:'CHAMPION'},
    {id:'universal',   label:'UNIVERSAL'},
    {id:'shared',      label:'SHARED'},
    {id:'collection',  label:'COLLECTION'},
  ];
  var types = [
    {id:'all',     label:'ALL'},
    {id:'attack',  label:'⚔ ATTACK'},
    {id:'defense', label:'🛡 DEFENSE'},
    {id:'utility', label:'✦ UTILITY'},
  ];
  var sortLabels = {mana:'Sort: Mana ↑', name:'Sort: Name A-Z', source:'Sort: Source', type:'Sort: Type'};

  var safeSearch = (_deSearch||'').replace(/"/g,'&quot;');
  var html = '<input class="de-search" id="de-search-input" type="text" placeholder="Search cards…" '
    + 'value="'+safeSearch+'" oninput="_deSetSearch(this.value)">';

  html += '<div class="de-filter-row"><span class="de-filter-label">SOURCE</span>';
  sources.forEach(function(s){
    if(s.id !== 'all' && !availableSources[s.id]) return;
    html += '<button class="de-chip'+(_deSourceFilter===s.id?' active':'')+'" onclick="_deSetSource(\''+s.id+'\')">'+s.label+'</button>';
  });
  html += '</div>';

  html += '<div class="de-filter-row"><span class="de-filter-label">TYPE</span>';
  types.forEach(function(t){
    html += '<button class="de-chip'+(_deTypeFilter===t.id?' active':'')+'" onclick="_deSetType(\''+t.id+'\')">'+t.label+'</button>';
  });
  html += '<span style="flex:1;"></span>';
  html += '<select class="de-sort" onchange="_deSetSort(this.value)">';
  ['mana','name','source','type'].forEach(function(k){
    html += '<option value="'+k+'"'+(_deSort===k?' selected':'')+'>'+sortLabels[k]+'</option>';
  });
  html += '</select></div>';

  toolbar.innerHTML = html;
}

// Render only the card grid. Called on every search keystroke (without
// re-rendering the toolbar) so the search input keeps focus while typing.
function _deRenderGrid(){
  var grid = document.getElementById('de-avail-grid');
  if(!grid) return;

  var library = _deBuildLibrary();
  var filtered = _deFilterLibrary(library);
  var sorted = _deSortLibrary(filtered);

  var deckCounts = {};
  _deDeck.forEach(function(id){ deckCounts[id]=(deckCounts[id]||0)+1; });

  if(!sorted.length){
    grid.innerHTML = '<div style="font-size:9px;color:#3a2010;grid-column:1/-1;padding:24px;text-align:center;font-style:italic;">No cards match your filters.</div>';
    return;
  }

  var html = '';
  sorted.forEach(function(item){
    var cardId = item.cardId;
    var card = CARDS[cardId]; if(!card) return;
    var atMax = (deckCounts[cardId]||0) >= MAX_CARD_COPIES;
    var inDeck = deckCounts[cardId] || 0;
    var buyGold = 50;
    var effLine = (card.effect||'').split('\n')[0];

    // Source badge — shown on shared cards (and on champion-card if owner ≠ active, which shouldn't happen)
    var srcBadge = '';
    if(item.source === 'shared' && item.sourceChampId){
      var srcCh = CREATURES[item.sourceChampId];
      var srcName = srcCh ? srcCh.name : item.sourceChampId.toUpperCase();
      srcBadge = '<span class="de-acard-source-badge" title="From '+srcName+'">↗ '+srcName+'</span>';
    } else if(item.source === 'universal'){
      srcBadge = '<span class="de-acard-source-badge de-src-universal" title="Universal card">★ UNIVERSAL</span>';
    }

    var classes = 'de-acard';
    if(card.champ === _deChampId) classes += ' de-acard-champ';
    else if(item.source === 'shared') classes += ' de-acard-shared';
    if(item.isLocked) classes += ' de-acard-locked';

    html += '<div class="'+classes+'" onclick="_deInspectCard(\''+cardId+'\')">'
      + srcBadge
      + '<div class="de-acard-art">'+_deCardArt(cardId,card)+'</div>'
      + '<div class="de-acard-name">'+card.name+'</div>'
      + '<div class="de-acard-effect">'+effLine+'</div>'
      + (inDeck>0?'<div class="de-copy-count">in deck: ×'+inDeck+'</div>':'')
      + (item.isLocked && item.canBuy ? '<span class="de-buy-badge" onclick="event.stopPropagation();_deBuyUnlock(\''+cardId+'\','+buyGold+')">'+buyGold+'g</span>':'')
      + (item.isLocked && !item.canBuy ? '<span class="de-lock-badge">Lv.5</span>':'')
      + (!item.isLocked && !atMax ? '<div class="de-acard-add" onclick="event.stopPropagation();_deAddCard(\''+cardId+'\')">+</div>':'')
      + (!item.isLocked && atMax ? '<span class="de-maxed-badge">MAX</span>':'')
      + '</div>';
  });
  grid.innerHTML = html;
}

// Toolbar interaction handlers — keep search focused on type, re-render
// toolbar+grid on chip / sort changes (focus loss is fine after a click).
function _deSetSearch(v){ _deSearch = v; _deRenderGrid(); }
function _deSetSource(s){ _deSourceFilter = s; _deRenderToolbar(); _deRenderGrid(); }
function _deSetType(t){ _deTypeFilter = t; _deRenderToolbar(); _deRenderGrid(); }
function _deSetSort(k){ _deSort = k; _deRenderGrid(); }

// ── Right: inspector ──
function _deRenderInspector(){
  var el = document.getElementById('de-inspector');
  if(!el) return;
  if(!_deInspect){
    el.innerHTML = '<div class="de-info-empty">Select a card to see details</div>';
    return;
  }
  var card = _deInspect;
  var cardId = card.id || '';
  var fullEffect = renderKeywords((card.effect||'').replace(/\n/g,'<br>'));
  var html = '';

  if(typeof buildCardHTML === 'function'){
    html += '<div class="de-insp-card"><div class="de-insp-card-wrap">'+buildCardHTML(cardId,false)+'</div></div>';
  }

  html += '<div class="de-insp-name">'+card.name+'</div>';
  var typeLine = (card.type||'utility').toUpperCase();
  if(card.manaCost) typeLine += ' · '+card.manaCost+' MANA';
  if(card.stat) typeLine += ' · '+card.stat.toUpperCase();
  html += '<div class="de-insp-type">'+typeLine+'</div>';
  html += '<div class="de-insp-effect">'+fullEffect+'</div>';

  var kwMatches = (card.effect||'').match(/\[([A-Za-z_]+)\]/g);
  if(kwMatches){
    var seen = {};
    var kwHtml = '';
    kwMatches.forEach(function(m){
      var word = m.slice(1,-1);
      if(seen[word]||!KEYWORDS[word]) return;
      seen[word] = true;
      kwHtml += '<div class="de-insp-kw"><strong>'+word+'</strong> — '+KEYWORDS[word].def+'</div>';
    });
    if(kwHtml){
      html += '<div class="de-insp-divider"></div>';
      html += '<div class="de-insp-kw-label">KEYWORDS</div>' + kwHtml;
    }
  }

  if(card.champ){
    var src = CREATURES[card.champ];
    var srcName = src ? src.name : card.champ;
    var isShared = (card.champ !== _deChampId);
    html += '<div class="de-insp-divider"></div>';
    if(isShared){
      // Borrowed from another champion — make it visible
      html += '<div class="de-insp-shared-banner">↗ <strong>'+srcName+'</strong> · borrowed via ascension</div>';
    } else {
      html += '<div class="de-insp-source">Source: '+srcName+'</div>';
    }
  } else if(_deInspect && (_deInspect.id === 'strike' || _deInspect.id === 'brace' || _deInspect.id === 'focus' || _deInspect.id === 'filler')){
    html += '<div class="de-insp-divider"></div>';
    html += '<div class="de-insp-source">Source: Universal</div>';
  }

  el.innerHTML = html;
}

function _deInspectCard(cardId){
  _deInspect = CARDS[cardId] || null;
  _deRenderDeckList();
  _deRenderInspector();
}

// ── Add / Remove ──
// _deDeck stays at the STR-derived cap at all times (filler pads any
// unassigned slots). Adding when full auto-swaps a filler for the new
// card so the deck size never changes inside the editor.
function _deAddCard(cardId){
  var cp = getChampPersist(_deChampId);
  var cap = calcDeckCap(cp.stats.str);
  var counts = {};
  _deDeck.forEach(function(id){ counts[id]=(counts[id]||0)+1; });
  // Filler doesn't have a copy cap — every empty slot becomes one.
  if(cardId !== 'filler' && (counts[cardId]||0) >= MAX_CARD_COPIES){
    showTownToast('Max '+MAX_CARD_COPIES+' copies'); return;
  }
  _deHistory.push(_deDeck.slice());
  if(_deHistory.length > 20) _deHistory.shift();

  if(_deDeck.length >= cap){
    // Deck is at cap — try to displace a filler to make room.
    var fillerIdx = _deDeck.indexOf('filler');
    if(fillerIdx === -1){
      // Truly full of real cards — undo the history push and bail.
      _deHistory.pop();
      showTownToast('Deck full ('+cap+')'); return;
    }
    _deDeck.splice(fillerIdx, 1);
  }
  _deDeck.push(cardId);
  _deInspect = CARDS[cardId] || null;
  _deSave();
  _deRender();
  if(typeof playDeAddSfx === 'function') playDeAddSfx();
}

function _deRemoveCard(cardId){
  var idx = _deDeck.lastIndexOf(cardId);
  if(idx === -1) return;
  _deHistory.push(_deDeck.slice());
  if(_deHistory.length > 20) _deHistory.shift();
  _deDeck.splice(idx, 1);

  // Maintain the STR-derived cap by padding the freed slot with Dead
  // Weight immediately, so the deck list updates live (no editor reload
  // required to see the placeholder appear).
  var cp = getChampPersist(_deChampId);
  var cap = calcDeckCap(cp.stats.str);
  var fillerWasAdded = false;
  while(_deDeck.length < cap){
    _deDeck.push('filler');
    fillerWasAdded = true;
  }

  _deSave();
  _deRender();
  if(typeof playDeRemoveSfx === 'function') playDeRemoveSfx();
  // Slight delay so the remove sfx and the dead-weight sfx don't overlap
  if(fillerWasAdded && typeof playDeDeadweightSfx === 'function'){
    setTimeout(playDeDeadweightSfx, 120);
  }
}

function _deCardArt(cardId, card){
  if(!card) return '<span style="font-size:18px;">?</span>';
  if(card.champ){
    return '<img src="assets/creatures/'+card.champ+'.png" style="width:100%;height:100%;object-fit:contain;image-rendering:pixelated;transform:scaleX(-1);" onerror="this.style.display=\'none\'">';
  }
  return '<span style="font-size:18px;">'+(card.icon||'?')+'</span>';
}

// ── Ascended deck sharing ──
function _getSharedCards(champId){
  var myTier = getAscensionLevel(champId);
  if(myTier < 1) return [];
  var shared = [];
  var seen = {};
  PERSIST.unlockedChamps.forEach(function(otherId){
    if(otherId === champId || otherId === 'dojo_tiger') return;
    if(getAscensionLevel(otherId) < 1) return;
    var otherCh = CREATURES[otherId]; if(!otherCh) return;
    var startCards = (otherCh.startDeck||[]).filter(function(id){ return CARDS[id]&&CARDS[id].champ===otherId; });
    startCards.forEach(function(id){ if(!seen[id]){ seen[id]=true; shared.push(id); } });
    (otherCh.cardRewards||[]).forEach(function(id){ if(!seen[id]&&CARDS[id]){ seen[id]=true; shared.push(id); } });
  });
  return shared;
}

// ── Buy unlock ──
function _deBuyUnlock(cardId, goldCost){
  if(PERSIST.gold < goldCost){ showTownToast('Not enough gold (need '+goldCost+').'); return; }
  var mods = getSanctumMods(_deChampId);
  if(!mods.purchasedUnlocks) mods.purchasedUnlocks = [];
  if(mods.purchasedUnlocks.indexOf(cardId) !== -1) return;
  PERSIST.gold -= goldCost;
  mods.purchasedUnlocks.push(cardId);
  savePersist();
  showTownToast('Unlocked '+CARDS[cardId].name+'!');
  _deRenderBrowser();
  document.getElementById('de-gold-row').innerHTML = goldImgHTML('12px')+' '+PERSIST.gold;
}

// ── Undo / Reset / Done / Save ──
function deDeckUndo(){
  if(!_deHistory.length) return;
  _deDeck = _deHistory.pop();
  _deSave();
  _deRender();
}

function deDeckReset(){
  if(!confirm('Reset '+getCreaturePlayable(_deChampId).name+'\'s deck to default?')) return;
  var mods = getSanctumMods(_deChampId);
  mods.swaps=[]; mods.extras=[]; mods.removed=[]; mods.deckOverride=null;
  savePersist();
  _deHistory = [];
  _deDeck = buildStartDeck(_deChampId).slice();
  _deInspect = null;
  _deRender();
  showTownToast('Deck reset to default.');
}

function deDeckDone(){
  // If the deck still contains Dead Weight (filler), surface a factual
  // confirmation modal — purely informational, no strategy advice.
  // The modal also offers a "don't remind me again" toggle persisted on
  // PERSIST.skipFillerLeaveWarning. Players who deliberately want filler
  // in their deck (e.g. for a specific build) can dismiss the prompt
  // permanently via that checkbox.
  var fillerCount = 0;
  for(var i=0;i<_deDeck.length;i++){ if(_deDeck[i] === 'filler') fillerCount++; }
  if(fillerCount > 0 && !PERSIST.skipFillerLeaveWarning){
    _deShowFillerWarning(fillerCount, function(confirmed){
      if(confirmed) _deDoneAfterFillerCheck();
    });
    return;
  }
  _deDoneAfterFillerCheck();
}

function _deDoneAfterFillerCheck(){
  _deSave();
  if(typeof playDeSavedSfx === 'function') playDeSavedSfx();
  var ret = _deReturnScreen || 'area-screen';
  if(ret === 'area-screen'){
    showScreen('area-screen'); showNav(true); updateNavBar('adventure'); buildAreaScreen();
  } else if(ret === 'town-screen'){
    showScreen('town-screen'); showNav(true); updateNavBar('town'); buildTownGrid();
  } else if(ret === 'sanctum-return'){
    showScreen('town-screen'); showNav(true); updateNavBar('town'); buildTownGrid();
    setTimeout(function(){ openBuildingPanel('sanctum'); setSanctumTab('deck'); }, 50);
  } else if(ret === 'select-screen'){
    showScreen('select-screen'); showNav(true); updateNavBar('adventure');
  } else {
    showScreen('area-screen'); showNav(true); updateNavBar('adventure'); buildAreaScreen();
  }
}

function _deSave(){
  var mods = getSanctumMods(_deChampId);
  mods.deckOverride = _deDeck.slice();
  savePersist();
}

function _deRenderFooter(){
  var undoBtn = document.getElementById('de-undo-btn');
  if(undoBtn) undoBtn.style.display = _deHistory.length ? '' : 'none';
}

// Modal shown by deDeckDone when filler is still in the deck. Purely
// informational — states the mechanical fact and lets the player choose,
// no prescriptive language. Includes a "don't remind me again" toggle
// persisted to PERSIST.skipFillerLeaveWarning.
function _deShowFillerWarning(count, callback){
  // Tear down any prior instance
  var existing = document.getElementById('de-filler-warn-overlay');
  if(existing) existing.parentNode.removeChild(existing);

  var overlay = document.createElement('div');
  overlay.id = 'de-filler-warn-overlay';
  overlay.className = 'de-filler-overlay';

  var card = document.createElement('div');
  card.className = 'de-filler-card';
  var plural = count > 1 ? 's' : '';
  // Just a count — no mechanic explanation. The deckbuilder tutorial
  // (story-quest path) is the canonical place to teach what Dead
  // Weight is. Until the player has been through that tutorial, we
  // surface the count as a factual heads-up only.
  card.innerHTML =
    '<div class="de-filler-title">DECK CONTAINS DEAD WEIGHT</div>' +
    '<div class="de-filler-body">Your deck has <strong>'+count+'</strong> Dead Weight card'+plural+'.</div>' +
    '<label class="de-filler-skip">' +
      '<input type="checkbox" id="de-filler-skip-future"> Don\'t remind me again' +
    '</label>' +
    '<div class="de-filler-btns">' +
      '<button class="de-filler-btn" id="de-filler-cancel">CANCEL</button>' +
      '<button class="de-filler-btn de-filler-confirm" id="de-filler-ok">SAVE &amp; LEAVE</button>' +
    '</div>';

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  function close(confirmed){
    if(confirmed){
      var skip = document.getElementById('de-filler-skip-future');
      if(skip && skip.checked){
        PERSIST.skipFillerLeaveWarning = true;
        savePersist();
      }
    }
    if(overlay.parentNode) overlay.parentNode.removeChild(overlay);
    if(typeof callback === 'function') callback(confirmed);
  }

  document.getElementById('de-filler-cancel').onclick = function(){ close(false); };
  document.getElementById('de-filler-ok').onclick     = function(){ close(true); };
  // Click outside the card cancels
  overlay.onclick = function(e){ if(e.target === overlay) close(false); };
}
