// ════════════════════════════════════════════════════
// AREA DEFINITIONS  —  locations, enemy pools, loot
// ════════════════════════════════════════════════════

var AREA_DEFS=[
  {id:'sewers',      name:'The Sewers',              icon:'🐀',materialGroup:'sewer', levelRange:[1,2], theme:'shallow tunnels crawling with vermin',
   lore:'The first tunnels beneath the old city. Water runs brown here, fed by something upstream that nobody has gone to investigate. The rats are larger than they should be, and they move with a coordinated purpose that unsettles even seasoned scouts.\n\nGoblins have claimed sections of the upper tunnels. They seem as surprised to see travellers as travellers are to see them.',
   enemyPool:['rat','mudcrab','goblin','roach','grub'],           bg:'#0a0d06', loot:{always:'key_sewers',      bonus:null,          bonusChance:0}},

  {id:'sewers_deep', name:'The Deep Sewers',         icon:'🐀',materialGroup:'sewer', levelRange:[3,4], theme:'deeper tunnels, fouler creatures lurk here',
   lore:'The upper sewers were unpleasant. The deep sewers are worse. The air tastes of rot and old iron. Whatever built these lower passages did not intend for them to ever be found.\n\nThe wretches here were human, once. Most scouts who reach this depth elect not to think too hard about what changed them.',
   enemyPool:['goblin','roach','grub','wretch','lurker','plague'], bg:'#08100a', loot:{always:'key_sewers_deep', bonus:'chest_sewers', bonusChance:0.08}},

  {id:'sewers_foul', name:'The Foul Depths',         icon:'🐀',materialGroup:'sewer', levelRange:[5,7], theme:'the deepest filth — things that should not exist',
   lore:'Beyond the deep sewers lies something the city\'s founders never mapped. The walls here are organic. The architecture is wrong. Things that have never seen sunlight move through chambers that should not exist beneath a city this young.\n\nThe Amalgam at the bottom is not a creature. It is an accumulation. It grows.',
   enemyPool:['wretch','lurker','plague','watcher','amalgam'],   bg:'#060e0a', loot:{always:'key_sewers_foul', bonus:'chest_sewers', bonusChance:0.18}},

  {id:'swamp',       name:'Bogmire Swamp',           icon:'🌿',materialGroup:'wetlands', levelRange:[2,5], theme:'fetid waters, toxic fog',
   lore:'The swamp has no clear boundary — it simply begins where the road softens and ends where solid ground returns, if it returns. Locals avoid the eastern edge entirely. They say the fog moves against the wind.\n\nThe Toad King is not a myth. Merchants who once considered it one no longer do.',
   enemyPool:['mudcrab','wisp','snake','toadking'],               bg:'#060e06', loot:{always:'key_bog',bonus:'chest_bog',bonusChance:0.10}},

  {id:'crypt',       name:'The Forgotten Crypt',     icon:'💀',materialGroup:'crypt', levelRange:[2,6], theme:'undead bones, cursed ground',
   lore:'The crypt predates the city by several centuries. Whoever built it was meticulous about keeping things in. Whatever they were keeping in eventually got bored and started keeping visitors out instead.\n\nThe witches here are not undead. They chose to live among the dead. That choice says something.',
   enemyPool:['skeleton','skeleton','witch'],                     bg:'#080610', loot:{always:'key_crypt',bonus:'chest_crypt',bonusChance:0.12}},

  {id:'forest',      name:'Thornwood Forest',        icon:'🌲',materialGroup:'forest', levelRange:[3,7], theme:'ancient trees, feral hunters',
   lore:'The Thornwood is older than the kingdom. The trees are wide enough that three men cannot join hands around the largest of them, and some of the oldest have faces in the bark that do not appear to be carvings.\n\nThe bandits here were driven from the roads. Whatever drove them preferred the trees.',
   enemyPool:['troll','harpy','bandit'],                 bg:'#060a04', loot:{always:'key_forest',bonus:'chest_forest',bonusChance:0.12}},

  {id:'cave',        name:"Eagle's Cave",            icon:'🦅',materialGroup:'forest', levelRange:[4,8], theme:'soaring cliffs, nest guardians',
   lore:'High in the cliffs above the eastern pass, a cave system extends for several miles through the rock. The harpies nesting here are territorial in a way that suggests intelligence — they do not attack at random, they defend specific chambers, and they remember faces.\n\nThe golems below are older than the harpies. What they were guarding is no longer there.',
   enemyPool:['harpy','harpy','golem','bandit'],                  bg:'#0a0806', loot:{always:'key_cave',bonus:'chest_cave',bonusChance:0.14}},

  {id:'ruins',          name:'Sunken Ruins',           icon:'🏛️',materialGroup:'ruins', levelRange:[5,9], theme:'crumbling empire, enchanted traps',
   lore:'The ruins of a pre-imperial settlement, partially reclaimed by earth and time. Scholars argue about who built them. The enchanted traps still functioning after four centuries suggest the builders were considerably more capable than their successors.\n\nThe knights here are not human. They are armour that learned to prefer combat to emptiness.',
   enemyPool:['golem','witch','knight','orc'],                                   bg:'#0a0a06', loot:{always:'key_ruins', bonus:'chest_ruins', bonusChance:0.16}},

  {id:'shattered_vault', name:'The Shattered Vault',    icon:'🏺',materialGroup:'ruins', levelRange:[5,8], theme:'collapsed treasury, cursed guardians and arcane traps',
   lore:'The empire stored things here that it did not want found. When the ceiling collapsed — nobody knows when, or why — it buried the most sensitive material under fifty feet of stone and activated every protective measure simultaneously.\n\nThe vault spectres are what remain of the people who were inside when it sealed.',
   enemyPool:['cursedurn','ironsentinel','vaultspectre','witch','golem'],         bg:'#0a0806', loot:{always:'key_ruins', bonus:'chest_ruins', bonusChance:0.16}},

  {id:'dragonsnest',     name:"Dragon's Nest",          icon:'🐉',materialGroup:'fire', levelRange:[6,12],theme:'scorched earth, draconic fury',
   lore:'The mountain has been smoking for eleven years. Locals moved away nine years ago. The nest itself is not hard to find — you follow the ash. What is hard is convincing yourself to keep walking toward it once you can smell the sulphur.\n\nThe elder dragon has been here longer than the mountain has been called by its current name.',
   enemyPool:['wyrm','dragon','flamesprite','embergolem'],                       bg:'#100402', loot:{always:'key_dragon',bonus:'chest_dragon',bonusChance:0.20}},

  {id:'boneyard',        name:'The Boneyard',           icon:'🦴',materialGroup:'crypt', levelRange:[7,13],theme:'fields of the ancient dead',
   lore:'There are no graves here. The bones simply surface, pushed up by soil that seems eager to be rid of them. The field stretches for miles and the oldest bones at the centre date to a war nobody has a name for.\n\nThe Lich at the far end has been catalogued three times by three separate expeditions. Each report describes something slightly different.',
   enemyPool:['skeleton','lich','watcher','amalgam'],                            bg:'#08080e', loot:{always:'key_bone',  bonus:'chest_bone',  bonusChance:0.22}},

  {id:'drowned_temple',  name:'The Drowned Temple',     icon:'🌊',materialGroup:'ruins', levelRange:[7,10],theme:'submerged ancient ruins, aquatic corruption, deep horror',
   lore:'The temple sank. The faith that built it did not — it simply moved underwater with the structure and kept practicing. The corruption here is not magical in any conventional sense. It is more like an opinion the water holds about organic matter.\n\nNothing that enters the inner sanctum comes back unchanged. Most do not come back at all.',
   enemyPool:['corruptionbloom','abysscrawler','temple_guardian','lurker','drownedsailor'], bg:'#020810', loot:{always:'key_ruins', bonus:'chest_crypt', bonusChance:0.20}},

  {id:'starmaze',        name:'Maze of Fractured Mirrors',icon:'🔮',materialGroup:'arcane', levelRange:[9,16],theme:'impossible geometry, void horrors',
   lore:'The maze does not exist in the same way other places exist. Compasses stop working fifty paces in. Time is unreliable. Two scouts entered separately and arrived at the same chamber simultaneously from opposite directions, having taken routes of different lengths.\n\nThe void horrors inside are not visiting. This is their native geometry.',
   enemyPool:['wisp','lich','dragon','vaultspectre'],                            bg:'#060210', loot:{always:'key_astral',bonus:'chest_astral',bonusChance:0.28}},

  {id:'mistwoods',   name:'The Mistwoods',             icon:'🌫️',materialGroup:'arcane', levelRange:[2,5], theme:'moonlit fog, eerie silence, things that watch',
   lore:'The mist in these woods is not weather. It arrives at dusk regardless of conditions and retreats at dawn with equal precision. What lives within it has adapted to a world of reduced visibility in ways that make them considerably more dangerous in clear conditions.\n\nThe Moon Squirrel is not as harmless as it sounds. Nothing in these woods is.',
   enemyPool:['mistraven','foghast','moonsquirrel','nightentling','orbweaver','maskedowl'], bg:'#060810', loot:{always:'key_mist',bonus:'chest_mist',bonusChance:0.12}},

  {id:'waxdunes',    name:'The Wax Dunes',              icon:'🕯️',materialGroup:'wax', levelRange:[1,3], theme:'golden sands, heat haze, creatures of ancient amber wax',
   lore:'The dunes are warm to the touch at all hours, even in winter, as if something below generates heat. The wax creatures here were not crafted recently — the oldest are partially fossilised and predate any known civilization with the skill to make them.\n\nThe Wax Oasis cannot be destroyed. Explorers have tried. It simply reforms. The recommended approach is to take what you need and leave before it decides you\'ve overstayed.',
   enemyPool:['waxsoldier','waxhound','dunecrawler','waxeffigy','waxoasis'], bg:'#1a0e00', loot:{always:'key_wax',bonus:'chest_wax',bonusChance:0.10}},

  {id:'fungalwarren',  name:'The Fungal Warren',  icon:'🍄', materialGroup:'sewer', levelRange:[1,3], theme:'mushroom caverns thick with spores — DoTs linger here',
   lore:'The warren smells of earth and something sweeter underneath — the kind of sweet that makes experienced delvers reach for their masks. The spores here communicate. The mycelia network connects every creature in the cave.\n\nKilling one alerts the others. There is no quiet approach.',
   enemyPool:['sporepuff','cavegrub','mycelid','tunnelant','venomstalker'], bg:'#080c04', loot:{always:'key_sewers',bonus:'chest_sewers',bonusChance:0.08}},

  {id:'sunkenhabour',  name:'The Sunken Harbour',  icon:'⚓', materialGroup:'wetlands', levelRange:[2,4], theme:'drowned port town, salt-crusted ruins, tidal chambers',
   lore:'The harbour flooded three decades ago. Nobody evacuated — the water rose too fast. The buildings are still mostly intact below the waterline, which means the old city is navigable for those willing to hold their breath and ignore what navigates alongside them.\n\nThe drowned sailors do not know they are dead. This makes them more dangerous, not less.',
   enemyPool:['tidecrab','drownedsailor','inksquall','siren','sharknight'], bg:'#04080e', loot:{always:'key_bog',  bonus:'chest_bog',  bonusChance:0.10}},

  {id:'charmines',     name:'The Char Mines',      icon:'🔥', materialGroup:'fire', levelRange:[2,4], theme:'scorched tunnels, ember-lit passages, ancient fire',
   lore:'The mines burned two hundred years ago and have not stopped burning since. The fire moved inward rather than consuming outward, as if retreating into the rock. The creatures that live here came after it, drawn by something in the heat.\n\nThe ember golems are not constructs. They grew. The distinction matters.',
   enemyPool:['flamesprite','embergolem','ashbat','mineghoul','lavacrawler'],bg:'#100400', loot:{always:'key_sewers',bonus:'chest_sewers',bonusChance:0.10}},

  {id:'blackpool',     name:'The Black Pool',      icon:'🌑', materialGroup:'arcane', levelRange:[3,3], theme:'something old lives here. one fight. no escape.',
   lore:'There is no record of anyone finding the Black Pool twice. The path to it changes. The pool itself does not — it is always the same still, lightless water, always the same cold that has nothing to do with temperature.\n\nThe Harbourmaster waits beside it. What it is harbourmaster of, and what it is waiting for, are questions best left unasked.',
   enemyPool:['rat','roach','harbourmaster'],                                    bg:'#030305', loot:{always:'key_sewers',bonus:'chest_crypt', bonusChance:0.50}, isBossArea:true},
];
