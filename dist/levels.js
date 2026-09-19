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
 sirocco:{id:'sirocco',name:'Сирокко',hint:'Плащ режет песок. Щит дешевле против бури, шаг чуть быстрее.',dmg:31,range:122,cd:.4,speed:214,shieldCost:5,energyDrain:2.4,energyRegen:27,regen:0}
};

export const RELICS={
 ember:{id:'ember',name:'Жар копья',text:'Пасхалка: оружие вспыхнуло. Удары стали тяжелее.',dmg:10,range:0,regen:0},
 vine:{id:'vine',name:'Жила рощи',text:'Пасхалка: древко выросло. Достаёшь дальше.',dmg:0,range:28,regen:0},
 bark:{id:'bark',name:'Кора стража',text:'Трофей: кора Стража леса. Раны чуть быстрее заживают.',dmg:0,range:0,regen:1.5},
 fang:{id:'fang',name:'Зуб скорпиона',text:'Пасхалка: жало колодезя. Копьё достаёт дальше.',dmg:0,range:32,regen:0}
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

function rng(seed){
 let a=seed>>>0;
 return()=>{
  a=a+0x6D2B79F5>>>0;
  let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;
  return((t^t>>>14)>>>0)/4294967296;
 };
}

function neighbors(n,x,y){
 const list=[];
 if(y>0)list.push({x,y:y-1,dir:'N'});
 if(x<n-1)list.push({x:x+1,y,dir:'E'});
 if(y<n-1)list.push({x,y:y+1,dir:'S'});
 if(x>0)list.push({x:x-1,y,dir:'W'});
 return list;
}

function opposite(dir){
 if(dir==='N')return 'S';
 if(dir==='E')return 'W';
 if(dir==='S')return 'N';
 return 'E';
}

function carveMaze(n,rand){
 const cells=Array.from({length:n},()=>Array.from({length:n},()=>({N:true,E:true,S:true,W:true,seen:false})));
 const stack=[[0,n-1]];
 cells[n-1][0].seen=true;
 let visited=1;
 while(visited<n*n){
  const [x,y]=stack[stack.length-1];
  const opts=neighbors(n,x,y).filter(p=>!cells[p.y][p.x].seen);
  if(!opts.length){stack.pop();continue;}
  const pick=opts[Math.floor(rand()*opts.length)];
  cells[y][x][pick.dir]=false;
  cells[pick.y][pick.x][opposite(pick.dir)]=false;
  cells[pick.y][pick.x].seen=true;
  stack.push([pick.x,pick.y]);
  visited++;
 }
 const extra=Math.round(n*n*0.08);
 for(let i=0;i<extra;i++){
  const x=1+Math.floor(rand()*(n-2));
  const y=1+Math.floor(rand()*(n-2));
  const opts=neighbors(n,x,y);
  const pick=opts[Math.floor(rand()*opts.length)];
  cells[y][x][pick.dir]=false;
  cells[pick.y][pick.x][opposite(pick.dir)]=false;
 }
 return cells;
}

function openings(cell){
 return ['N','E','S','W'].filter(d=>!cell[d]).length;
}

function bfs(cells,sx,sy){
 const n=cells.length;
 const dist=Array.from({length:n},()=>Array(n).fill(-1));
 const q=[[sx,sy]];
 dist[sy][sx]=0;
 for(let i=0;i<q.length;i++){
  const [x,y]=q[i];
  for(const p of neighbors(n,x,y)){
   if(dist[p.y][p.x]!==-1)continue;
   if(cells[y][x][p.dir])continue;
   dist[p.y][p.x]=dist[y][x]+1;
   q.push([p.x,p.y]);
  }
 }
 return dist;
}

function cellCenter(pad,thick,pitch,room,cx,cy){
 return {x:pad+thick+cx*pitch+room/2,y:pad+thick+cy*pitch+room/2};
}

export function createMazeLevel(seed=7741){
 const n=13,room=96,thick=28,pad=48,pitch=room+thick;
 const size=n*pitch+thick;
 const world={w:size+pad*2,h:size+pad*2};
 const rand=rng(seed);
 const cells=carveMaze(n,rand);
 const walls=[];
 const ox=pad,oy=pad;
 for(let y=0;y<n;y++){
  for(let x=0;x<=n;x++){
   const closed=x===0||x===n||(x<n&&cells[y][x].W)||(x>0&&cells[y][x-1].E);
   if(closed)walls.push({x:ox+x*pitch,y:oy+y*pitch,w:thick,h:pitch+thick});
  }
 }
 for(let y=0;y<=n;y++){
  for(let x=0;x<n;x++){
   const closed=y===0||y===n||(y<n&&cells[y][x].N)||(y>0&&cells[y-1][x].S);
   if(closed)walls.push({x:ox+x*pitch,y:oy+y*pitch,w:pitch+thick,h:thick});
  }
 }
 const start={cx:0,cy:n-1};
 const dist=bfs(cells,start.cx,start.cy);
 let hermit={cx:n-1,cy:0,d:dist[0][n-1]};
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  if(dist[y][x]>hermit.d)hermit={cx:x,cy:y,d:dist[y][x]};
 }
 const dead=[];
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  if(x===start.cx&&y===start.cy)continue;
  if(x===hermit.cx&&y===hermit.cy)continue;
  if(openings(cells[y][x])===1&&dist[y][x]>2)dead.push({cx:x,cy:y,d:dist[y][x]});
 }
 dead.sort((a,b)=>b.d-a.d);
 const mid=(n-1)/2;
 const nearCenter=[];
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  if(x===start.cx&&y===start.cy)continue;
  if(x===hermit.cx&&y===hermit.cy)continue;
  if(dist[y][x]<4)continue;
  nearCenter.push({cx:x,cy:y,d:dist[y][x],center:Math.abs(x-mid)+Math.abs(y-mid),dead:openings(cells[y][x])===1});
 }
 nearCenter.sort((a,b)=>{
  if(a.dead!==b.dead)return a.dead?-1:1;
  return a.center-b.center||a.d-b.d;
 });
 const relicCells=[];
 for(const c of nearCenter){
  if(relicCells.every(r=>Math.abs(r.cx-c.cx)+Math.abs(r.cy-c.cy)>=3)){
   relicCells.push(c);
   if(relicCells.length===2)break;
  }
 }
 const kitPool=dead.filter(c=>!relicCells.some(r=>r.cx===c.cx&&r.cy===c.cy));
 const kitCells=kitPool.slice(0,3);
 const used=new Set([
  `${start.cx},${start.cy}`,
  `${hermit.cx},${hermit.cy}`,
  ...relicCells.map(c=>`${c.cx},${c.cy}`),
  ...kitCells.map(c=>`${c.cx},${c.cy}`)
 ]);
 const enemyCells=[];
 const types=['melee','beast','shooter','melee','beast','melee','beast','shooter','beast','melee','shooter','beast'];
 const candidates=[];
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const key=`${x},${y}`;
  if(used.has(key)||dist[y][x]<3)continue;
  candidates.push({cx:x,cy:y,d:dist[y][x]});
 }
 candidates.sort((a,b)=>((a.cx*13+a.cy*7)%11)-(b.cx*13+b.cy*7)%11);
 for(const c of candidates){
  if(enemyCells.some(e=>Math.abs(e.cx-c.cx)+Math.abs(e.cy-c.cy)<2))continue;
  enemyCells.push(c);
  if(enemyCells.length>=types.length)break;
 }
 const at=(c)=>cellCenter(pad,thick,pitch,room,c.cx,c.cy);
 const relics=[{...RELICS.ember,...at(relicCells[0]||{cx:2,cy:2})},{...RELICS.vine,...at(relicCells[1]||{cx:n-2,cy:2})}].map(r=>({...r,used:false}));
 return {
  world,
  walls,
  n,room,thick,pad,pitch,
  start:at(start),
  hermit:at(hermit),
  exit:at(start),
  pickups:kitCells.map(c=>({...at(c),used:false})),
  relics,
  enemies:enemyCells.map((c,i)=>({type:types[i%types.length],...at(c)}))
 };
}
