export const FORT_WORLD={w:2400,h:1500};
export const FORT_WALLS=[
 {x:40,y:90,w:2320,h:38},{x:40,y:1370,w:2320,h:38},{x:40,y:90,w:38,h:560},{x:40,y:950,w:38,h:458},{x:2322,y:90,w:38,h:1318},
 {x:670,y:90,w:50,h:560},{x:670,y:890,w:50,h:518},
 {x:1390,y:90,w:50,h:320},{x:1390,y:650,w:50,h:758},
 {x:300,y:430,w:120,h:90},{x:400,y:1020,w:115,h:115},{x:850,y:380,w:160,h:75},
 {x:1080,y:700,w:100,h:100},{x:875,y:1080,w:170,h:80},
 {x:1580,y:300,w:145,h:90},{x:1820,y:740,w:140,h:85},{x:1610,y:1100,w:190,h:90},
 {x:1990,y:260,w:235,h:30},{x:2210,y:260,w:25,h:330},{x:1990,y:590,w:245,h:25}
];

export const SKINS={
 warrior:{id:'warrior',name:'Красный щит',hint:'Твой привычный облик.',dmg:30,range:115,cd:.43,speed:190,shieldCost:9,energyDrain:4,energyRegen:23,regen:0},
 spirit:{id:'spirit',name:'Лиловый страж',hint:'Щит держится дольше. Энергия течёт быстрее.',dmg:27,range:128,cd:.4,speed:188,shieldCost:5,energyDrain:2.2,energyRegen:34,regen:0},
 molten:{id:'molten',name:'Огненный клинок',hint:'Удар тяжелее, шаг чуть медленнее.',dmg:44,range:120,cd:.5,speed:168,shieldCost:9,energyDrain:5,energyRegen:18,regen:0},
 wood:{id:'wood',name:'Пьетон',hint:'Копьё достаёт дальше. Раны медленно затягиваются.',dmg:33,range:160,cd:.36,speed:204,shieldCost:8,energyDrain:3.5,energyRegen:24,regen:3.4},
 mage:{id:'mage',name:'Маг',hint:'Хранитель, которого ты нашёл. Посох достаёт далеко, раны тихо заживают.',dmg:28,range:148,cd:.41,speed:176,shieldCost:7,energyDrain:3,energyRegen:28,regen:2.4},
 sirocco:{id:'sirocco',name:'Сирокко',hint:'Плащ режет песок. Щит дешевле против бури, шаг чуть быстрее.',dmg:31,range:122,cd:.4,speed:214,shieldCost:5,energyDrain:2.4,energyRegen:27,regen:0},
 nautilus:{id:'nautilus',name:'Наутилус',hint:'Жемчужный панцирь. Пузырь аппарата держится дольше, в воде легче дышать.',dmg:30,range:130,cd:.4,speed:198,shieldCost:5,energyDrain:2.2,energyRegen:32,regen:1.2}
};

export const RELICS={
 ember:{id:'ember',name:'Жар копья',text:'Пасхалка: оружие вспыхнуло. Удары стали тяжелее.',dmg:10,range:0,regen:0},
 vine:{id:'vine',name:'Жила рощи',text:'Пасхалка: древко выросло. Достаёшь дальше.',dmg:0,range:28,regen:0},
 bark:{id:'bark',name:'Кора стража',text:'Трофей: кора Стража леса. Раны чуть быстрее заживают.',dmg:0,range:0,regen:1.5},
 fang:{id:'fang',name:'Зуб скорпиона',text:'Пасхалка: жало колодезя. Копьё достаёт дальше.',dmg:0,range:32,regen:0},
 pearl:{id:'pearl',name:'Жемчужина жёлоба',text:'Находка рифа. Раны в воде чуть быстрее заживают.',dmg:0,range:0,regen:1.8}
};

export const FOREST_WORLD={w:2000,h:1400};
export const FOREST_WALLS=[
 {x:20,y:20,w:1960,h:32},{x:20,y:1348,w:1960,h:32},{x:20,y:20,w:32,h:1360},{x:1948,y:20,w:32,h:1360},
 {x:70,y:70,w:140,h:980},
 {x:270,y:70,w:910,h:410},
 {x:490,y:720,w:680,h:200},
 {x:490,y:940,w:1430,h:380},
 {x:1680,y:70,w:240,h:210}
];

export const DESERT_WORLD={w:3600,h:1600};

function carveRooms(world,rooms,cell=40){
 const cols=Math.ceil(world.w/cell),rows=Math.ceil(world.h/cell);
 const open=Array(cols*rows).fill(false);
 for(const r of rooms){
  const x0=Math.max(0,Math.floor(r.x/cell));
  const y0=Math.max(0,Math.floor(r.y/cell));
  const x1=Math.min(cols,Math.ceil((r.x+r.w)/cell));
  const y1=Math.min(rows,Math.ceil((r.y+r.h)/cell));
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)open[y*cols+x]=true;
 }
 const used=Array(cols*rows).fill(false);
 const walls=[];
 for(let y=0;y<rows;y++){
  for(let x=0;x<cols;x++){
   const i=y*cols+x;
   if(open[i]||used[i])continue;
   let w=1;
   while(x+w<cols&&!open[y*cols+x+w]&&!used[y*cols+x+w])w++;
   let h=1;
   grow:while(y+h<rows){
    for(let xx=0;xx<w;xx++)if(open[(y+h)*cols+x+xx]||used[(y+h)*cols+x+xx])break grow;
    h++;
   }
   for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)used[(y+yy)*cols+x+xx]=true;
   walls.push({x:x*cell,y:y*cell,w:w*cell,h:h*cell});
  }
 }
 return walls;
}

export function createDesertLevel(){
 const world={...DESERT_WORLD};
 const rooms=[
  {x:80,y:1100,w:520,h:380},
  {x:540,y:1240,w:1160,h:250},
  {x:1420,y:400,w:300,h:890},
  {x:1660,y:720,w:680,h:300},
  {x:1760,y:70,w:400,h:700},
  {x:2280,y:640,w:660,h:540},
  {x:2680,y:70,w:260,h:640},
  {x:2900,y:70,w:580,h:660}
 ];
 const walls=carveRooms(world,rooms,40);
 walls.push(
  {x:1920,y:260,w:80,h:80},
  {x:1490,y:760,w:100,h:36},
  {x:2470,y:900,w:88,h:48},
  {x:2710,y:1040,w:96,h:44},
  {x:3060,y:180,w:40,h:140},
  {x:3380,y:180,w:40,h:140}
 );
 const start={x:280,y:1280};
 return {
  world,
  walls,
  start,
  exit:start,
  well:{x:2080,y:180},
  bazaar:{x:2580,y:880},
  temple:{x:3200,y:360},
  drywind:{x:3180,y:400},
  cloak:{x:3280,y:250},
  pickups:[{x:420,y:1280,used:false},{x:1540,y:680,used:false},{x:2520,y:720,used:false}],
  relics:[{...RELICS.fang,x:1860,y:130,used:false}],
  enemies:[
   {type:'burrow',x:1080,y:1360},
   {type:'burrow',x:1320,y:1365},
   {type:'burrow',x:1540,y:920},
   {type:'vulture',x:1540,y:540},
   {type:'vulture',x:2480,y:780},
   {type:'vulture',x:2780,y:1000},
   {type:'scorpion',x:2080,y:180},
   {type:'scorpion',x:2520,y:1100},
   {type:'mirage',x:2580,y:880}
  ]
 };
}

export function createForestLevel(){
 const start={x:330,y:1180};
 const warden={x:1460,y:360};
 return {
  world:{...FOREST_WORLD},
  walls:FOREST_WALLS.map(w=>({...w})),
  start,
  exit:{x:start.x,y:start.y},
  warden,
  pickups:[{x:360,y:980,used:false},{x:720,y:610,used:false},{x:1280,y:430,used:false}],
  enemies:[{type:'beast',x:360,y:880},{type:'beast',x:840,y:620},{type:'melee',x:1120,y:600}]
 };
}

export const REEF_WORLD={w:17600,h:1000};

export const REEF_BEATS=[
 {x:1680,kind:'snap'},
 {x:2920,kind:'darklash'},
 {x:4300,kind:'net'},
 {x:5720,kind:'rip'},
 {x:7080,kind:'clam'},
 {x:9720,kind:'shock'},
 {x:11440,kind:'whirl'},
 {x:13280,kind:'decoy'},
 {x:14840,kind:'squeeze'}
];

export function reefTunnel(x){
 const fade=Math.min(1,Math.max(0,(x-280)/1600));
 const wave=(Math.sin(x/720)*160+Math.sin(x/1480)*70)*fade;
 const gap=x>15600?700:(500+Math.sin(x/480)*36);
 const mid=500+wave;
 const y=Math.max(60,Math.min(REEF_WORLD.h-60-gap,mid-gap/2));
 return {y,h:gap,mid:y+gap/2};
}

export function createReefLevel(){
 const world={...REEF_WORLD};
 const rooms=[];
 for(let x=20;x<15720;x+=100){
  const t=reefTunnel(x);
  rooms.push({x,y:t.y-28,w:220,h:t.h+56});
 }
 rooms.push({x:15560,y:90,w:1980,h:820});
 const walls=carveRooms(world,rooms,40);
 for(let x=980;x<15200;x+=820){
  const t=reefTunnel(x);
  walls.push({x:x+30,y:t.y+8,w:40,h:48});
  walls.push({x:x+310,y:t.y+t.h-56,w:48,h:46});
 }
 const start={x:240,y:reefTunnel(240).mid};
 const maw={x:16240,y:500};
 const enemies=[];
 const pickups=[];
 const crabAt=reefTunnel(6400);
 enemies.push({type:'crab',x:6420,y:crabAt.y+crabAt.h-54});
 const crab2=reefTunnel(10880);
 enemies.push({type:'crab',x:10900,y:crab2.y+crab2.h-54});
 for(let x=1500;x<15000;x+=1900){
  const t=reefTunnel(x);
  pickups.push({x,y:t.mid,used:false});
 }
 const pearlAt=reefTunnel(8480);
 return {
  world,
  walls,
  start,
  exit:start,
  maw,
  pickups,
  relics:[{...RELICS.pearl,x:8510,y:pearlAt.mid-70,used:false}],
  enemies
 };
}
