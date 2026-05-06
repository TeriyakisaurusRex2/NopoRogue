// ════════════════════════════════════════════════════
// EDITOR UTILITIES — shared functions for editor.html
// Extracted from game.js to avoid loading the full 8000-line file
// ════════════════════════════════════════════════════

// ── Stat formulas (must match game.js exactly) ──
function calcDrawInterval(agi){ return Math.round(2000+6000/(1+agi*0.08)); }
function calcMaxMana(wis){ return wis*5; }
function calcManaRegen(wis){ return Math.round(wis*0.8+2); }

// ── Deck builder ──
function buildCreatureDeck(creature, strOverride){
  if(!creature) return ['strike','strike','brace','brace'];
  var str = (strOverride !== undefined) ? strOverride : (creature.baseStats && creature.baseStats.str) || 10;
  var order = creature.deckOrder || [];
  var allCards = order.concat(['strike', 'brace']);
  var base = Math.floor(str / allCards.length);
  var remainder = str % allCards.length;
  var deck = [];
  allCards.forEach(function(id, idx){
    var copies = base + (idx < remainder ? 1 : 0);
    for(var i = 0; i < copies; i++) deck.push(id);
  });
  return deck;
}

// ── Card display helpers ──
function cardEffectFontSize(effectText){
  var raw=(effectText||'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
  var len=raw.length;
  if(len<=30)  return 'font-size:12px;line-height:1.5;';
  if(len<=55)  return 'font-size:11px;line-height:1.5;';
  if(len<=80)  return 'font-size:10px;line-height:1.5;';
  if(len<=110) return 'font-size:9px;line-height:1.5;';
  if(len<=145) return 'font-size:8.5px;line-height:1.6;';
  return              'font-size:8px;line-height:1.6;';
}

function cardArtHTML(cardId, emoji, manaCost, champId){
  var html='';
  if(champId){
    var csrc='assets/creatures/'+champId+'.png';
    html='<img class="card-champ-art" src="'+csrc+'" alt="" onerror="this.style.display=\'none\';">';
  }
  html+='<span class="card-emoji-icon"'+(champId?' style="opacity:0;"':'')+'>'+emoji+'</span>';
  if(manaCost) html+='<div class="card-mana-badge">'+manaCost+'</div>';
  return html;
}

function getCardIdentityLabel(c){
  if(!c||!c.champ) return 'Universal';
  var cr=CREATURES&&CREATURES[c.champ];
  return cr ? cr.name : c.champ.charAt(0).toUpperCase()+c.champ.slice(1);
}

function getCardTags(c){
  if(!c) return ['unique'];
  var tags=[];
  var effects=(c.effects||[]).concat(c.onDiscard||[]);
  effects.forEach(function(e){
    if(e.type==='dmg_conditional'||e.type==='dmg_scaling'||e.type==='mana_burn') tags.push('damage');
    if(e.type==='apply_status'&&['poison','burn','weaken','slow'].indexOf(e.status)!==-1) tags.push('debuff');
    if(e.type==='apply_status'&&['shield','haste','dodge','frenzy','thorns'].indexOf(e.status)!==-1) tags.push('buff');
    if(e.type==='heal') tags.push('buff');
    if(e.type==='cleanse') tags.push('buff');
  });
  var seen={}; tags=tags.filter(function(t){return seen[t]?false:(seen[t]=true);});
  if(!tags.length) tags=['unique'];
  return tags;
}

function buildTagsHTML(tags){
  return tags.map(function(tag){
    return '<span class="card-tag card-tag-'+tag+'" title="'+tag+'"></span>';
  }).join('');
}

// ── Mock actor for card resolution ──
function createMockActor(creature){
  if(!creature) return null;
  var s = creature.baseStats || {str:10, agi:10, wis:10};
  var maxMana = calcMaxMana(s.wis);
  return {
    id: creature.id,
    creature: creature,
    side: 'player',
    level: 1,
    str: s.str, agi: s.agi, wis: s.wis,
    hp: s.str * 5, maxHp: s.str * 5,
    mana: maxMana, maxMana: maxMana,
    manaRegen: calcManaRegen(s.wis),
    shield: 0,
    hand: [{id:'strike'},{id:'strike'},{id:'brace'}], // mock hand for hand_size checks
    drawPool: [],
    discardPile: [],
    drawInterval: calcDrawInterval(s.agi),
    drawTimer: 0,
    drawSpeedMult: 1.0,
    statusEffects: [],
    innateCooldown: 0,
    frenzyStacks: 0,
    dodge: false,
    conjuredCount: 0,
    shadowMarkActive: false,
    nextCardCrit: false,
    cardsPlayed: 0,
    lastCardPlayed: null,
    _cardMods: [],
    auras: {},
    _activeAuraIds: [],
  };
}

// ── Mana budget calculator ──
function calcManaBudget(creature){
  if(!creature) return null;
  var s = creature.baseStats;
  var maxMana = calcMaxMana(s.wis);
  var regen = calcManaRegen(s.wis);
  var drawInt = calcDrawInterval(s.agi);
  var deckSize = s.str; // STR = deck size
  var cycleTime = (deckSize * drawInt) / 1000; // seconds per full deck cycle
  var manaPerCycle = regen * cycleTime;

  // Calculate total sorcery demand
  var deck = buildCreatureDeck(creature, s.str);
  var sorceryDemand = 0;
  var cardCounts = {};
  deck.forEach(function(id){ cardCounts[id] = (cardCounts[id]||0) + 1; });

  Object.keys(cardCounts).forEach(function(cardId){
    var card = CARDS[cardId];
    if(!card || !card.effects) return;
    card.effects.forEach(function(eff){
      if(eff.type === 'sorcery' && eff.cost && eff.cost !== 'all'){
        sorceryDemand += (+eff.cost) * cardCounts[cardId];
      }
    });
  });

  // Innate demand
  var innateDemand = 0;
  if(creature.innate && creature.innate.active && creature.innate.cost){
    var innateCd = (creature.innate.cooldown || 5000) / 1000;
    var innateFiresPerCycle = cycleTime / Math.max(innateCd, maxMana / regen);
    // Can't fire faster than mana allows
    innateFiresPerCycle = Math.min(innateFiresPerCycle, manaPerCycle / creature.innate.cost);
    innateDemand = innateFiresPerCycle * creature.innate.cost;
  }

  var totalDemand = sorceryDemand + innateDemand;
  var ratio = manaPerCycle > 0 ? totalDemand / manaPerCycle : 0;

  // Determine WIS tier
  var stats = [s.str, s.agi, s.wis];
  var sorted = stats.slice().sort(function(a,b){ return b-a; });
  var wisTier = 'tertiary';
  if(s.wis === sorted[0]) wisTier = 'primary';
  else if(s.wis === sorted[1]) wisTier = 'secondary';

  var targets = {primary: 1.2, secondary: 1.4, tertiary: 1.8};

  return {
    maxMana: maxMana,
    regen: regen,
    drawInterval: drawInt,
    deckSize: deckSize,
    cycleTime: cycleTime,
    manaPerCycle: manaPerCycle,
    sorceryDemand: sorceryDemand,
    innateDemand: Math.round(innateDemand),
    totalDemand: Math.round(totalDemand),
    ratio: ratio,
    wisTier: wisTier,
    target: targets[wisTier],
  };
}

// ── Stat tier colour ──
function getStatTierColour(total){
  if(total <= 24) return '#888';     // grey
  if(total <= 30) return '#cc4444';  // red
  if(total <= 36) return '#44cc44';  // green
  if(total <= 42) return '#4488ff';  // blue
  if(total <= 48) return '#44dddd';  // cyan
  if(total <= 54) return '#dd44dd';  // magenta
  if(total <= 60) return '#dddd44';  // yellow
  return '#222';                     // black
}

function getStatTierName(total){
  if(total <= 24) return 'Very Weak';
  if(total <= 30) return 'Weak';
  if(total <= 36) return 'Early';
  if(total <= 42) return 'Mid';
  if(total <= 48) return 'Strong';
  if(total <= 54) return 'Elite';
  if(total <= 60) return 'Legendary';
  return 'Extreme';
}

// ── Queens checker — find similar cards ──
function getEffectSignature(card){
  if(!card || !card.effects) return [];
  var sig = [];
  card.effects.forEach(function(eff){
    if(eff.type === 'sorcery'){
      sig.push('sorcery');
      if(eff.effect) sig.push('sorc:'+eff.effect.type);
      if(eff.effects) eff.effects.forEach(function(e){ sig.push('sorc:'+e.type); });
    } else if(eff.type === 'hellbent'){
      sig.push('hellbent');
      if(eff.effect) sig.push('hell:'+eff.effect.type);
    } else {
      var key = eff.type;
      if(eff.type === 'apply_status') key += ':'+eff.status;
      if(eff.type === 'dmg_conditional' && eff.condition) key += ':'+eff.condition;
      sig.push(key);
    }
  });
  return sig;
}

function findSimilarCards(cardId){
  var card = CARDS[cardId];
  if(!card) return [];
  var sig = getEffectSignature(card);
  if(sig.length === 0) return [];

  var results = [];
  Object.keys(CARDS).forEach(function(otherId){
    if(otherId === cardId) return;
    var other = CARDS[otherId];
    var otherSig = getEffectSignature(other);
    if(otherSig.length === 0) return;

    // Count matching elements
    var matches = 0;
    sig.forEach(function(s){
      if(otherSig.indexOf(s) !== -1) matches++;
    });

    if(matches >= 2 || (matches >= 1 && sig.length <= 2)){
      var score = matches / Math.max(sig.length, otherSig.length);
      results.push({id: otherId, card: other, matches: matches, score: score, sig: otherSig});
    }
  });

  results.sort(function(a,b){ return b.score - a.score; });
  return results.slice(0, 10);
}

// Stubs for functions referenced by card_effects.js that don't exist in editor
var gs = null;
var HAND_SIZE = 7;
function addLog(){}
function addTag(){}
function removeTagByLabel(){}
function removeTagsByClass(){}
function spawnFloatNum(){}
function spawnHealNum(){}
function flashHpBar(){}
function updateAll(){}
function renderHand(){}
function applyStatus(){}
function getOpponent(){ return null; }
function dealCardDamage(){}
function getTargetSide(){ return 'enemy'; }
function getSelfSide(){ return 'player'; }
function resolveCardEffect(line){ return line; }
