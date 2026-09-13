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
 mage:{id:'mage',name:'Маг',hint:'Хранитель, которого ты нашёл. Посох достаёт далеко, раны тихо заживают.',dmg:28,range:148,cd:.41,speed:176,shieldCost:7,energyDrain:3,energyRegen:28,regen:2.4}
};

export const RELICS={
 ember:{id:'ember',name:'Жар копья',text:'Пасхалка: оружие вспыхнуло. Удары стали тяжелее.',dmg:10,range:0},
 vine:{id:'vine',name:'Жила рощи',text:'Пасхалка: древко выросло. Достаёшь дальше.',dmg:0,range:28}
};

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
