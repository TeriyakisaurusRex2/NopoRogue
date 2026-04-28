// ════════════════════════════════════════════════════
// AREA DEFINITIONS  —  locations, enemy pools, loot
// ════════════════════════════════════════════════════

var AREA_DEFS=[
  {id:'sewers',      name:'The Sewers',              icon:'🐀',materialGroup:'sewer', levelRange:[1,3], theme:'shallow tunnels crawling with vermin',
   lore:'The first tunnels beneath the old city. Water runs brown here, fed by something upstream that nobody has gone to investigate. The rats are larger than they should be, and they move with a coordinated purpose that unsettles even seasoned scouts.\n\nGoblins have claimed sections of the upper tunnels. They seem as surprised to see travellers as travellers are to see them.',
   enemyPool:['rat','goblin','squanchback','drain_lurker','zombie'],           bg:'#0a0d06', loot:{always:'key_sewers',      bonus:null,          bonusChance:0}},

  {id:'pale_road',    name:'The Pale Road',            icon:'🗡️',materialGroup:'forest', levelRange:[1,3], theme:'the old road out of town — bandits and beasts',
   lore:'The road that leads away from the city has not been maintained in years. Merchant caravans stopped running when the wolves moved in. Then came the bandits, drawn to the abandoned wagons. Now the road belongs to neither — just whatever is hungry enough to stay.\n\nSlimes have begun pooling in the ditches. Nobody knows where they come from.',
   enemyPool:['slime','wolf','bandit'],           bg:'#0d0a06', loot:{always:'key_pale_road',   bonus:null,          bonusChance:0}},

  {id:'swamp',       name:'Bogmire Swamp',            icon:'🌿',materialGroup:'wetlands', levelRange:[1,3], theme:'fetid waters, toxic fog, things that grow wrong',
   lore:'The swamp has no clear boundary — it simply begins where the road softens and ends where solid ground returns, if it returns. Locals avoid the eastern edge entirely. They say the fog moves against the wind.\n\nThe mushrooms here communicate. The flowers here corrupt. The snakes here are patient.',
   enemyPool:['snake','bloom','sporepuff','mycelid'],  bg:'#060e06', loot:{always:'key_bog',         bonus:null,          bonusChance:0}},

  {id:'ransacked_temple', name:'The Ransacked Temple',  icon:'🏛️',materialGroup:'ruins', levelRange:[2,5], theme:'shattered sanctum, corrupted guardians, infernal invaders',
   lore:'The Sanctum of Light stood for centuries. Then something came from below. The paladins fought. They lost. Now iron sentinels still patrol empty halls, raiders pick through the wreckage, and infernal beasts roam where prayers once echoed.\n\nThe temple is not dead. It is occupied.',
   enemyPool:['iron_sentinel','raider','infernal_beast'], bg:'#120608', loot:{always:'key_temple', bonus:null, bonusChance:0}},

  {id:'dojo',        name:'The Dojo',                  icon:'🥋',materialGroup:'dojo', levelRange:[1,99], theme:'debug arena — fight the Dojo Tiger', singleEnemy:true,
   lore:'A timeless training ground. The Dojo Tiger fights however you configure it. Swap its innate and deck in dojo_tiger.js to test any ability.',
   enemyPool:['dojo_tiger'],
   bg:'#0a0a10', loot:{always:null, bonus:null, bonusChance:0}},

  // ── DISABLED AREAS — creatures not yet redesigned ──
  // Uncomment as creature rosters are completed.
  //
  // {id:'sewers_deep', name:'The Deep Sewers', levelRange:[3,4], enemyPool:['goblin','roach','grub','wretch','lurker','plague']},
  // {id:'sewers_foul', name:'The Foul Depths', levelRange:[5,7], enemyPool:['wretch','lurker','plague','watcher','amalgam']},
  // {id:'swamp',       name:'Bogmire Swamp',   levelRange:[2,5], enemyPool:['mudcrab','wisp','snake','toadking']},
  // {id:'crypt',       name:'The Forgotten Crypt', levelRange:[2,6], enemyPool:['skeleton','witch']},
  // {id:'forest',      name:'Thornwood Forest', levelRange:[3,7], enemyPool:['troll','harpy','bandit']},
  // {id:'cave',        name:"Eagle's Cave",    levelRange:[4,8], enemyPool:['harpy','golem','bandit']},
  // {id:'ruins',       name:'Sunken Ruins',    levelRange:[5,9], enemyPool:['golem','witch','knight','orc']},
  // {id:'shattered_vault', name:'The Shattered Vault', levelRange:[5,8], enemyPool:['cursedurn','ironsentinel','vaultspectre']},
  // {id:'dragonsnest', name:"Dragon's Nest",   levelRange:[6,12], enemyPool:['wyrm','dragon','flamesprite','embergolem']},
  // {id:'boneyard',    name:'The Boneyard',    levelRange:[7,13], enemyPool:['skeleton','lich','watcher','amalgam']},
  // {id:'drowned_temple', name:'The Drowned Temple', levelRange:[7,10], enemyPool:['corruptionbloom','abysscrawler','temple_guardian']},
  // {id:'starmaze',    name:'Maze of Fractured Mirrors', levelRange:[9,16], enemyPool:['wisp','lich','dragon','vaultspectre']},
  // {id:'mistwoods',   name:'The Mistwoods',   levelRange:[2,5], enemyPool:['mistraven','foghast','moonsquirrel','nightentling']},
  // {id:'waxdunes',    name:'The Wax Dunes',   levelRange:[1,3], enemyPool:['waxsoldier','waxhound','dunecrawler','waxeffigy','waxoasis']},
  // {id:'fungalwarren', name:'The Fungal Warren', levelRange:[1,3], enemyPool:['sporepuff','cavegrub','mycelid','tunnelant']},
  // {id:'sunkenhabour', name:'The Sunken Harbour', levelRange:[2,4], enemyPool:['tidecrab','drownedsailor','inksquall','siren']},
  // {id:'charmines',   name:'The Char Mines',  levelRange:[2,4], enemyPool:['flamesprite','embergolem','ashbat','mineghoul']},
  // {id:'blackpool',   name:'The Black Pool',  levelRange:[3,3], enemyPool:['rat','roach','harbourmaster'], isBossArea:true},
];
