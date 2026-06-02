#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════
// design_check.js — creature/card design analyzer (a tool for Claude)
// ════════════════════════════════════════════════════════════════
// Run from anywhere:
//   node tools/design_check.js roster
//   node tools/design_check.js creature snake
//   node tools/design_check.js queen
//   node tools/design_check.js spec '{"name":"Panther","str":10,"agi":18,"wis":12,"growth":{"str":1,"agi":2,"wis":1},"archetype":"beast","cards":["snake_bite"]}'
//
// Loads the REAL data files (data/cards.js + data/creatures/*.js) in a
// stubbed VM sandbox — no game.js / DOM needed. Stat formulas are
// mirrored from game.js (kept in sync manually; they rarely change).
//
// Output is dense structured text for Claude to read and translate.
// Power bands are PROVISIONAL (see CREATURE_CARD_CREATION.txt) — the
// tool reports band membership, it does not enforce law.
// ════════════════════════════════════════════════════════════════

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── Sandbox with the minimum stubs the data files touch at load ──
const sandbox = {
  CREATURES: {},
  console: console,
  Math: Math, JSON: JSON, Date: Date, Object: Object, Array: Array,
  String: String, Number: Number, parseInt: parseInt, parseFloat: parseFloat,
  setTimeout: function(){ return 0; }, clearTimeout: function(){},
  setInterval: function(){ return 0; }, clearInterval: function(){},
  localStorage: { getItem: function(){ return null; }, setItem: function(){} },
  document: {
    addEventListener: function(){}, removeEventListener: function(){},
    getElementById: function(){ return null; },
    querySelector: function(){ return null; }, querySelectorAll: function(){ return []; },
    createElement: function(){ return { style:{}, classList:{ add:function(){}, remove:function(){} } }; },
  },
  // Runtime stubs so card_effects.js loads (these are only invoked during
  // live combat; for no-actor text generation they're never called).
  gs: null,
  addLog: function(){}, getStatuses: function(){ return []; }, getOpponent: function(){ return null; },
  spawnFloatNum: function(){}, spawnEchoFloat: function(){}, addTag: function(){},
  removeTagByLabel: function(){}, removeTagsByClass: function(){},
  applyStatus: function(){}, applyDoT: function(){}, dealDamage: function(){},
  updateAll: function(){}, renderHand: function(){}, fireInnateTriggers: function(){},
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

function load(file){
  try {
    vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
    return true;
  } catch(e){
    console.error('[load-fail] ' + path.basename(file) + ': ' + e.message);
    return false;
  }
}

// data/cards.js → CARDS, KEYWORDS, renderKeywords
load(path.join(ROOT, 'data', 'cards.js'));
// data/card_effects.js → fmt, EFFECT_TYPES, generateCardText, _effectLiveText
// (its load-time validateEffectRegistry() runs; its setTimeout audit is stubbed off).
load(path.join(ROOT, 'data', 'card_effects.js'));
// data/creatures/*.js → CREATURES.<id>
const cdir = path.join(ROOT, 'data', 'creatures');
fs.readdirSync(cdir).filter(function(f){ return f.endsWith('.js'); })
  .forEach(function(f){ load(path.join(cdir, f)); });

const CARDS = sandbox.CARDS || {};
const KEYWORDS = sandbox.KEYWORDS || {};
const CREATURES = sandbox.CREATURES || {};

// ── Generated card text (no-actor) — the canonical static text. ──
// Convert line-break / block tags to spaces BEFORE stripping, so multi-line
// card text doesn't glue together ("damage.Apply") — matches how hand-written
// \n separators normalize too, for a fair drift comparison.
function normTxt(s){
  return String(s||'')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?div[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function genCardText(id){
  if(typeof sandbox.generateCardText !== 'function') return '[generateCardText unavailable]';
  try {
    var sections = sandbox.generateCardText(null, id, null);
    if(!sections || !sections.length) return '';
    return normTxt(sections.map(function(s){ return s.html || ''; }).join(' '));
  } catch(e){ return '[gen error: ' + e.message + ']'; }
}

if(!Object.keys(CARDS).length) console.error('[warn] CARDS empty — cards.js may not have loaded.');
if(!Object.keys(CREATURES).length) console.error('[warn] CREATURES empty — creature files may not have loaded.');

// ── Stat formulas (mirrored from game.js) ──
const calcHp          = function(str){ return str * 5; };
const calcMaxMana     = function(wis){ return wis * 5; };
const calcManaRegen   = function(wis){ return Math.round(wis * 0.8 + 2); };
const calcDrawInterval= function(agi){ return Math.round(2000 + 6000 / (1 + agi * 0.08)); };
const calcReactionInterval = function(agi){ return Math.round(1000 + 3500 / (1 + agi * 0.08)); };

// ── Tier classification (provisional bands) ──
function classifyTier(total, growthTotal){
  var tier, inBand;
  if(total >= 30 && total <= 37){ tier = 'Common';    inBand = (growthTotal >= 3 && growthTotal <= 5); }
  else if(total >= 38 && total <= 40){ tier = 'Uncommon';  inBand = (growthTotal >= 4 && growthTotal <= 6); }
  else if(total >= 48 && total <= 50){ tier = 'Legendary'; inBand = (growthTotal === 6); }
  else if(total > 50){ tier = 'Boss/elite (norm-breaking)'; inBand = true; }
  else if(total < 30){ tier = 'below-Common'; inBand = false; }
  else { tier = 'GAP (41-47, between tiers)'; inBand = false; }
  return { tier: tier, inBand: inBand };
}

function curveOf(s){
  var arr = [s.str, s.agi, s.wis].slice().sort(function(a,b){ return b - a; });
  var spread = arr[0] - arr[2];
  var shape;
  if(spread <= 4) shape = 'flat';
  else if(arr[0] >= 26 || (arr[0] - arr[1]) >= 12) shape = 'spike'; // 24/14 gap=10 is the intended topaz max
  else shape = 'curve';
  return { shape: shape, sorted: arr.join('/'), spread: spread };
}

function primaryFamily(s){
  var max = Math.max(s.str, s.agi, s.wis);
  if(s.str === max) return 'STR bruiser/tank';
  if(s.agi === max) return 'AGI tempo';
  return 'WIS caster/engine';
}

// ── Keyword detection (effects-array first, effect-string fallback) ──
const STRUCTURAL = { Sorcery:1, Crit:1, Ethereal:1, Conjured:1, Banish:1,
  Drawn:1, Echo:1, Hellbent:1, Accrue:1, Compound:1, Gift:1, Manabound:1, Debuff:1 };
const STATUS_KW = { poison:'Poison', burn:'Burn', weaken:'Weaken', slow:'Slow',
  stun:'Stun', haste:'Haste', thorns:'Thorns', dodge:'Dodge', frenzy:'Frenzy',
  shield:'Shield', bleed:'Bleed' };

function kwFromEffects(effs, out){
  out = out || {};
  (effs || []).forEach(function(e){
    if(!e || !e.type) return;
    if(e.type === 'apply_status' && STATUS_KW[e.status]) out[STATUS_KW[e.status]] = 1;
    if(e.type === 'mana_burn') out['Mana Burn'] = 1;
    if(e.type === 'churn' || e.type === 'churn_all_damage' || e.type === 'churn_both') out['Churn'] = 1;
    if(e.type === 'hellbent'){ out['Hellbent'] = 1; if(e.effect) kwFromEffects([e.effect], out); }
    if(e.type === 'sorcery'){ out['Sorcery'] = 1; if(e.effect) kwFromEffects([e.effect], out); if(e.effects) kwFromEffects(e.effects, out); }
    if(e.crit) out['Crit'] = 1;
  });
  return out;
}

function kwFromText(txt, out){
  out = out || {};
  if(!txt) return out;
  (String(txt).match(/\[([A-Za-z][A-Za-z ]*)\]/g) || []).forEach(function(t){
    var w = t.slice(1, -1);
    if(KEYWORDS[w]) out[w] = 1;
  });
  return out;
}

function keywordsOf(cr){
  var found = {};
  if(cr.innate){ kwFromText(cr.innate.desc, found); kwFromEffects(cr.innate.effect, found); }
  (cr.deckOrder || []).forEach(function(id){
    var c = CARDS[id];
    if(!c) return;
    kwFromEffects(c.effects, found);
    kwFromText(c.effect, found);
  });
  var all = Object.keys(found);
  return {
    all: all,
    identity: all.filter(function(w){ return !STRUCTURAL[w]; }),
    structural: all.filter(function(w){ return STRUCTURAL[w]; }),
  };
}

// ── Build a full report row for a creature-like object ──
// Accepts { baseStats|str/agi/wis, growth, innate, deckOrder, name }
function analyze(cr){
  var s = cr.baseStats || { str: cr.str, agi: cr.agi, wis: cr.wis };
  var g = cr.growth || { str: 0, agi: 0, wis: 0 };
  var total = (s.str||0) + (s.agi||0) + (s.wis||0);
  var gTotal = (g.str||0) + (g.agi||0) + (g.wis||0);
  var t = classifyTier(total, gTotal);
  var curve = curveOf(s);
  var kw = keywordsOf(cr);
  var flags = [];
  ['str','agi','wis'].forEach(function(k){ if((s[k]||0) < 10) flags.push('STAT FLOOR: ' + k + '=' + s[k] + ' (<10)'); });
  if(!t.inBand) flags.push('OUT-OF-BAND: total ' + total + '/growth ' + gTotal + ' for ' + t.tier);
  // Curve only matters at Legendary tier (~44+ total, ~50 pts spent) where
  // a strong-but-capped primary keeps off-stat splashing viable. Commons
  // are EXPECTED to be a single-bump (near-flat) shape — don't flag them.
  if(total >= 44 && curve.shape === 'spike') flags.push('SPIKE stat split (' + curve.sorted + ') — off-stat splashing weak');
  if(total >= 44 && curve.shape === 'flat') flags.push('FLAT stat split (' + curve.sorted + ') — no clear identity lean');
  // Shield is the near-universal "flex/defense" keyword (almost every kit
  // carries a defensive card), so it does NOT count against the ≤2
  // identity-keyword budget. Still listed, just not counted here.
  var soupKw = kw.identity.filter(function(w){ return w !== 'Shield'; });
  if(soupKw.length > 2) flags.push('KEYWORD SOUP: ' + soupKw.length + ' identity keywords (excl. Shield) [' + soupKw.join(', ') + ']');
  return {
    name: cr.name || cr.id || '(unnamed)',
    s: s, g: g, total: total, gTotal: gTotal,
    tier: t.tier, inBand: t.inBand,
    hp: calcHp(s.str||0), mana: calcMaxMana(s.wis||0), regen: calcManaRegen(s.wis||0),
    draw: calcDrawInterval(s.agi||0), reaction: calcReactionInterval(s.agi||0),
    family: primaryFamily(s), curve: curve, kw: kw, flags: flags,
  };
}

function fmtRow(r){
  return [
    r.name.padEnd(20),
    (r.s.str + '/' + r.s.agi + '/' + r.s.wis).padEnd(10),
    ('Σ' + r.total + ' g' + r.gTotal).padEnd(8),
    (r.tier + (r.inBand ? '' : '!')).padEnd(13),
    ('HP' + r.hp).padEnd(6),
    ('M' + r.mana + '+' + r.regen).padEnd(8),
    ('draw' + (r.draw/1000).toFixed(1) + 's').padEnd(10),
    r.curve.shape.padEnd(6),
    (r.kw.identity.join(',') || '-'),
  ].join(' ');
}

// ── Queen-rule signature for a card's PRIMARY effect ──
function primaryEffect(card){
  var effs = card.effects || [];
  for(var i = 0; i < effs.length; i++){
    var e = effs[i];
    if(e.type === 'dmg_conditional' || e.type === 'dmg_scaling' || e.type === 'apply_status') return e;
  }
  return effs[0] || null;
}
// Rider effect types (everything other than the primary effect), sorted.
// Two cards only "compare" if they share the same rider shape too — else
// they're differentiated (which is the Queen-rule escape hatch).
// A rider's content-tag: includes the STATUS keyword (Poison vs Stun is a
// real difference, not "both apply_status") and the sorcery inner effect.
// The deep magnitude/payoff comparison stays manual — this just stops the
// tool clustering genuinely-different riders together.
function riderTag(e){
  if(!e || !e.type) return '?';
  if(e.type === 'apply_status') return 'status:' + e.status;
  if(e.type === 'sorcery'){
    var inner = e.effect || (e.effects && e.effects[0]);
    return 'sorc:' + (inner ? (inner.type === 'apply_status' ? ('status:' + inner.status) : inner.type) : '?');
  }
  return e.type;
}
// Riders = effects[] beyond the primary, PLUS keyword-riders that live
// outside effects[]: [Echo] (onDiscard), [Drawn] (onDraw), [Accrue] (accrue).
function riderTypes(card, primary){
  var tags = (card.effects || []).filter(function(e){ return e !== primary; }).map(riderTag);
  (card.onDiscard || []).forEach(function(e){ tags.push('echo(' + riderTag(e) + ')'); });
  (card.onDraw || []).forEach(function(e){ tags.push('drawn(' + riderTag(e) + ')'); });
  if(card.accrue) tags.push('accrue');
  return tags.sort().join('+');
}
function sigOf(card){
  var e = primaryEffect(card);
  if(!e) return null;
  var r = riderTypes(card, e);
  var rs = r ? (' | +' + r) : '';
  if(e.type === 'dmg_conditional'){
    // A conditional crit/bonus (e.g. devour's "below 50% HP: crit") is a real
    // differentiator — fold it into the signature, not just the flat crit field.
    var cond = (e.condition && e.condition !== 'always')
      ? (' if:' + e.condition + '>' + (e.on_true || 'crit'))
      : (e.crit ? ' +crit' : '');
    return 'dmg stat=' + (e.stat||'flat') + ' div=' + (e.stat_div||'-') + ' hits=' + (e.hits||1) + cond + rs;
  }
  if(e.type === 'dmg_scaling')  return 'dmgscale src=' + (e.source||'-') + ' stat=' + (e.stat||'-') + ' div=' + (e.stat_div||'-') + rs;
  if(e.type === 'apply_status') return 'status:' + e.status + ' stat=' + (e.stat||'flat') + ' div=' + (e.stat_div||'-') + rs;
  return e.type + rs;
}

// ════════════════════════════════════════════════════════════════
// COMMANDS
// ════════════════════════════════════════════════════════════════
function cmdRoster(){
  var ids = Object.keys(CREATURES).sort();
  console.log('CREATURE ROSTER (' + ids.length + ') — bands are PROVISIONAL; "!" = out-of-band');
  console.log('name                 stats      tier     tierBand     HP    mana    draw      curve  identity-keywords');
  console.log('─'.repeat(110));
  var flagged = [];
  ids.forEach(function(id){
    var r = analyze(CREATURES[id]);
    console.log(fmtRow(r));
    if(r.flags.length) flagged.push({ name: r.name, flags: r.flags });
  });
  if(flagged.length){
    console.log('\nFLAGS (' + flagged.length + ' creatures):');
    flagged.forEach(function(f){ f.flags.forEach(function(x){ console.log('  ' + f.name + ': ' + x); }); });
  } else {
    console.log('\nNo flags — all creatures in-band, no stat floors, no keyword soup.');
  }
}

function cmdCreature(id){
  var cr = CREATURES[id];
  if(!cr){ console.error('Unknown creature: ' + id + '. Known: ' + Object.keys(CREATURES).sort().join(', ')); process.exit(1); }
  var r = analyze(cr);
  console.log('═══ ' + r.name + ' (' + id + ') ═══');
  console.log('Stats:    ' + r.s.str + ' STR / ' + r.s.agi + ' AGI / ' + r.s.wis + ' WIS   (total ' + r.total + ')');
  console.log('Growth:   ' + r.g.str + '/' + r.g.agi + '/' + r.g.wis + '   (total ' + r.gTotal + ')');
  console.log('Tier:     ' + r.tier + (r.inBand ? '  [in-band]' : '  [OUT OF BAND]'));
  console.log('Profile:  HP ' + r.hp + ' | mana ' + r.mana + ' +' + r.regen + '/s | draw ' + (r.draw/1000).toFixed(2) + 's | reaction ' + (r.reaction/1000).toFixed(2) + 's');
  console.log('Family:   ' + r.family + '   | curve: ' + r.curve.shape + ' (' + r.curve.sorted + ', spread ' + r.curve.spread + ')');
  console.log('Innate:   ' + (cr.innate ? (cr.innate.name + ' — ' + (cr.innate.active ? 'ACTIVE cost ' + (cr.innate.cost||0) + '/cd ' + (cr.innate.cooldown||0) : 'passive')) : '(none)'));
  console.log('          ' + ((cr.innate && cr.innate.desc) || ''));
  console.log('Keywords: identity [' + r.kw.identity.join(', ') + ']  |  structural [' + r.kw.structural.join(', ') + ']');
  console.log('Cards:    ' + (cr.deckOrder || []).join(', '));
  if(r.flags.length){ console.log('FLAGS:'); r.flags.forEach(function(x){ console.log('  ⚠ ' + x); }); }
  else console.log('No flags.');
}

function cmdSpec(json){
  var spec;
  try { spec = JSON.parse(json); }
  catch(e){ console.error('spec needs valid JSON. ' + e.message); process.exit(1); }
  // Normalize growth shorthand
  if(!spec.growth && (spec.gstr !== undefined)) spec.growth = { str: spec.gstr, agi: spec.gagi, wis: spec.gwis };
  // For keyword detection, allow spec.cards as ids (existing) — analyze() reads deckOrder
  spec.deckOrder = spec.cards || spec.deckOrder || [];
  // Allow an inline innate { desc, active, cost, cooldown, effect }
  var r = analyze(spec);
  console.log('═══ SPEC: ' + r.name + (spec.archetype ? '  [' + spec.archetype + ']' : '') + ' ═══');
  console.log('Stats:    ' + r.s.str + '/' + r.s.agi + '/' + r.s.wis + ' (total ' + r.total + ')   growth ' + r.g.str + '/' + r.g.agi + '/' + r.g.wis + ' (total ' + r.gTotal + ')');
  console.log('Tier:     ' + r.tier + (r.inBand ? '  ✓ in-band' : '  ✗ OUT OF BAND'));
  console.log('Profile:  HP ' + r.hp + ' | mana ' + r.mana + ' +' + r.regen + '/s | draw ' + (r.draw/1000).toFixed(2) + 's | reaction ' + (r.reaction/1000).toFixed(2) + 's');
  console.log('Family:   ' + r.family + '   | curve: ' + r.curve.shape + ' (' + r.curve.sorted + ')');
  if(r.kw.all.length) console.log('Keywords: identity [' + r.kw.identity.join(', ') + ']  structural [' + r.kw.structural.join(', ') + ']');
  // Archetype sanity hint
  if(spec.archetype){
    var fam = r.family.split(' ')[0]; // STR/AGI/WIS
    var hint = { beast:'AGI or STR', insect:'AGI (STR low)', demon:'WIS', construct:'STR', caster:'WIS', plant:'WIS or STR', undead:'STR or even', goblin:'AGI' };
    if(hint[spec.archetype]) console.log('Archetype expectation: ' + spec.archetype + ' → ' + hint[spec.archetype] + ' (creature primary: ' + fam + ')');
  }
  if(r.flags.length){ console.log('FLAGS:'); r.flags.forEach(function(x){ console.log('  ⚠ ' + x); }); }
  else console.log('FLAGS: none ✓');
  // Queen check on the spec's cards vs the pool
  if(spec.deckOrder && spec.deckOrder.length){
    console.log('\nQueen check (spec cards vs pool):');
    spec.deckOrder.forEach(function(id){
      var c = CARDS[id];
      if(!c){ console.log('  ' + id + ': (not found in CARDS — new/unimplemented card; queen-check it manually)'); return; }
      var sig = sigOf(c);
      var clash = Object.keys(CARDS).filter(function(oid){ return oid !== id && sigOf(CARDS[oid]) === sig; });
      console.log('  ' + id + '  [' + sig + ']  ' + (clash.length ? 'shares signature with: ' + clash.join(', ') : 'unique signature ✓'));
    });
  }
}

// cardtext — verify GENERATED card text (no-actor) headlessly, and diff
// against any hand-written effect: string (drift detection).
//   arg = a card id        → that card
//   arg = a creature id     → all its deckOrder cards
//   arg = (omitted)/'all'   → drift report over every card with both fields
function cmdCardtext(arg){
  var ids, detailed = true;
  if(arg && CREATURES[arg]) ids = (CREATURES[arg].deckOrder || []).slice();
  else if(arg && CARDS[arg]) ids = [arg];
  else { ids = Object.keys(CARDS).sort(); detailed = false; } // 'all' → drift-only

  if(detailed){
    ids.forEach(function(id){
      var c = CARDS[id];
      if(!c){ console.log(id + ': (not in CARDS)'); return; }
      var gen = genCardText(id);
      var hand = c.effect ? normTxt(c.effect) : null;
      var status = !c.effects ? 'no-effects[]' : (hand === null ? 'no hand-text' : (gen === hand ? 'MATCH ✓' : 'DRIFT ✗'));
      console.log('● ' + id + '   [' + status + ']');
      console.log('   gen:  ' + gen);
      if(hand !== null) console.log('   hand: ' + hand);
    });
    return;
  }
  // Drift report across the whole pool.
  var drift = [];
  ids.forEach(function(id){
    var c = CARDS[id];
    if(!c || !c.effect || !c.effects) return;
    var gen = genCardText(id), hand = normTxt(c.effect);
    if(gen !== hand) drift.push({ id: id, gen: gen, hand: hand });
  });
  if(!drift.length){ console.log('No drift — every hand-written effect matches the generator.'); return; }
  console.log('CARD-TEXT DRIFT (' + drift.length + ' cards): generated vs hand-written\n');
  drift.forEach(function(d){
    console.log('● ' + d.id);
    console.log('   gen:  ' + d.gen);
    console.log('   hand: ' + d.hand);
  });
}

function cmdQueen(){
  var groups = {};
  Object.keys(CARDS).forEach(function(id){
    var c = CARDS[id];
    if(!c || !c.effects) return;
    var sig = sigOf(c);
    if(!sig) return;
    (groups[sig] = groups[sig] || []).push(id);
  });
  console.log('QUEEN-RULE CLUSTERS — cards sharing a primary-effect signature.');
  console.log('Signature = effect + scaling stat + divisor + hits/crit + rider TYPES.');
  console.log('A cluster = directly-comparable cards. Inspect numbers (and sorcery');
  console.log('rider CONTENT, which the signature does NOT see) to judge domination.');
  console.log('(Single-card signatures omitted.)\n');
  var clusters = Object.keys(groups).filter(function(s){ return groups[s].length > 1; }).sort();
  if(!clusters.length){ console.log('No multi-card clusters — every card has a unique primary signature.'); return; }
  clusters.forEach(function(sig){
    console.log('● ' + sig);
    groups[sig].forEach(function(id){
      var c = CARDS[id];
      var e = primaryEffect(c);
      var detail = '';
      if(e){
        if(e.type === 'dmg_conditional') detail = 'base ' + (e.base||0) + (e.hits>1?(' x'+e.hits):'') + (e.crit?(' crit'+e.crit):'');
        else if(e.type === 'apply_status') detail = 'val ' + (e.value||0) + (e.dur?(' '+e.dur+'s'):'');
        else if(e.type === 'dmg_scaling') detail = 'base ' + (e.base||0) + ' x' + (e.mult||1);
      }
      var riders = (c.effects||[]).filter(function(x){ return x !== e; }).map(function(x){ return x.type; });
      console.log('    ' + id.padEnd(26) + detail.padEnd(20) + (riders.length ? ('+ ' + riders.join(',')) : ''));
    });
  });
  console.log('\nNOTE: clustering is mechanical; declaring "A is strictly better than B"');
  console.log('requires comparing numbers AND riders AND cost — done by reading each cluster.');
}

// ── CLI ──
var argv = process.argv.slice(2);
var cmd = argv[0];
if(cmd === 'roster') cmdRoster();
else if(cmd === 'creature') cmdCreature(argv[1]);
else if(cmd === 'spec') cmdSpec(argv[1] || '{}');
else if(cmd === 'queen') cmdQueen();
else if(cmd === 'cardtext') cmdCardtext(argv[1]);
else {
  console.log('Usage:');
  console.log('  node tools/design_check.js roster');
  console.log('  node tools/design_check.js creature <id>');
  console.log('  node tools/design_check.js spec \'{"name":"X","str":10,"agi":18,"wis":12,"growth":{"str":1,"agi":2,"wis":1},"archetype":"beast","cards":["snake_bite"]}\'');
  console.log('  node tools/design_check.js queen');
  console.log('  node tools/design_check.js cardtext [cardId | creatureId]   (omit arg = drift report over all cards)');
}
