import {FORT_WORLD,FORT_WALLS,SKINS,RELICS,createMazeLevel,createForestLevel,createDesertLevel} from './levels.js';

export const WORLD={w:FORT_WORLD.w,h:FORT_WORLD.h};
export const WALLS=FORT_WALLS.map(w=>({...w}));
export {SKINS};

export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const cell=40;
let cols=60,rows=38,grid=[];

export function applyGeometry(world,walls){
 WORLD.w=world.w;
 WORLD.h=world.h;
 WALLS.length=0;
 for(const w of walls)WALLS.push(w);
 rebuildNav();
}

export function blocked(x,y,r=20){
 if(x<r+8||x>WORLD.w-r-8||y<r+8||y>WORLD.h-r-8)return true;
 return WALLS.some(w=>x+r>w.x&&x-r<w.x+w.w&&y+r>w.y&&y-r<w.y+w.h);
}

export function visible(a,b){
 const d=dist(a,b),n=Math.ceil(d/14);
 for(let i=1;i<n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,3))return false;
 return true;
}

export function move(e,dx,dy){
 const ox=e.x,oy=e.y;
 if(!blocked(e.x+dx,e.y,e.r))e.x+=dx;
 if(!blocked(e.x,e.y+dy,e.r))e.y+=dy;
 e.moving=Math.hypot(e.x-ox,e.y-oy)>0.1;
}

function rebuildNav(){
 cols=Math.max(1,Math.ceil(WORLD.w/cell));
 rows=Math.max(1,Math.ceil(WORLD.h/cell));
 grid=Array.from({length:cols*rows},(_,i)=>!blocked(i%cols*cell+20,Math.floor(i/cols)*cell+20,23));
}

function nodeFor(p){
 let x=clamp(Math.floor(p.x/cell),0,cols-1),y=clamp(Math.floor(p.y/cell),0,rows-1);
 if(grid[y*cols+x])return y*cols+x;
 let best=-1,bd=Infinity;
 for(let yy=Math.max(0,y-3);yy<=Math.min(rows-1,y+3);yy++){
  for(let xx=Math.max(0,x-3);xx<=Math.min(cols-1,x+3);xx++){
   const n=yy*cols+xx,d=(xx-x)**2+(yy-y)**2;
   if(grid[n]&&d<bd){bd=d;best=n;}
  }
 }
 return best;
}

export function pathBetween(a,b){
 if(visible(a,b))return[{x:b.x,y:b.y}];
 const start=nodeFor(a),end=nodeFor(b);
 if(start<0||end<0)return[];
 const q=[start],prev=new Int32Array(cols*rows).fill(-2);
 prev[start]=-1;
 for(let h=0;h<q.length;h++){
  let n=q[h];
  if(n===end)break;
  const x=n%cols,y=Math.floor(n/cols);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const xx=x+dx,yy=y+dy,j=yy*cols+xx;
   if(xx<0||xx>=cols||yy<0||yy>=rows||!grid[j]||prev[j]!==-2)continue;
   prev[j]=n;
   q.push(j);
  }
 }
 if(prev[end]===-2)return[];
 const path=[];
 for(let n=end;n!==start&&n!==-1;n=prev[n])path.push({x:n%cols*cell+20,y:Math.floor(n/cols)*cell+20});
 return path.reverse();
}

function chase(e,target,speed,dt){
 e.pathTime=(e.pathTime||0)-dt;
 let t=target;
 if(!visible(e,target)){
  if(e.pathTime<=0||!e.path?.length){e.path=pathBetween(e,target);e.pathTime=.65;}
  while(e.path?.length&&dist(e,e.path[0])<17)e.path.shift();
  t=e.path?.[0];
 }
 if(!t){e.moving=false;return;}
 const d=dist(e,t);
 if(d>1)move(e,(t.x-e.x)/d*speed*dt,(t.y-e.y)/d*speed*dt);
}

function statsFor(skin,bonus){
 const base=SKINS[skin]||SKINS.warrior;
 return {
  dmg:base.dmg+(bonus.dmg||0),
  range:base.range+(bonus.range||0),
  cd:base.cd,
  speed:base.speed,
  shieldCost:base.shieldCost,
  energyDrain:base.energyDrain,
  energyRegen:base.energyRegen,
  regen:base.regen+(bonus.regen||0)
 };
}

applyGeometry(FORT_WORLD,FORT_WALLS);

export class Game{
 constructor(){
  this.mission='fort';
  this.reset();
 }
 reset(){
  this.state='ready';
  this.time=0;
  this.kills=0;
  this.blocks=0;
  this.rescued=false;
  this.bossSpawned=false;
  this.reason='';
  this.foundHermit=false;
  this.chosenSkin='';
  this.secrets=0;
  this.seen=new Set();
  this.bonus={dmg:0,range:0,regen:0};
  this.events=[];
  this.bullets=[];
  this.effects=[];
  this.enemies=[];
  this.pickups=[];
  this.relics=[];
  this.hazards=[];
  this.hermit={x:0,y:0,r:22};
  this.warden=null;
  this.drywind=null;
  this.cloak=null;
  if(this.mission==='maze')this.setupMaze();
  else if(this.mission==='forest')this.setupForest();
  else if(this.mission==='desert')this.setupDesert();
  else this.setupFort();
  this.markSeen(true);
 }
 setupFort(){
  applyGeometry(FORT_WORLD,FORT_WALLS);
  this.player={x:190,y:800,r:22,hp:100,maxHp:100,energy:100,angle:0,inv:0,cd:0,swing:0,moving:false,shield:false,skin:'warrior'};
  this.ally={x:2110,y:460,r:20,hp:100,maxHp:100,angle:Math.PI,inv:0,cd:0,moving:false,waiting:false};
  this.exit={x:165,y:800};
  this.pickups=[{x:880,y:980,used:false},{x:1680,y:610,used:false}];
  this.relics=[];
  this.hermit={x:-999,y:-999,r:22};
  const spots=[['melee',470,700],['melee',480,920],['shooter',825,735],['melee',1000,930],['melee',1190,450],['shooter',1220,1000],['shooter',1540,520],['melee',1780,470],['melee',2000,760],['shooter',2140,870],['melee',1960,420],['shooter',1750,960]];
  for(const [type,x,y] of spots)this.spawn(type,x,y);
 }
 setupMaze(){
  const level=createMazeLevel();
  applyGeometry(level.world,level.walls);
  this.maze=level;
  this.player={x:level.start.x,y:level.start.y,r:22,hp:100,maxHp:100,energy:100,angle:-Math.PI/2,inv:0,cd:0,swing:0,moving:false,shield:false,skin:'warrior'};
  this.ally={x:level.start.x+36,y:level.start.y-8,r:20,hp:100,maxHp:100,angle:-Math.PI/2,inv:0,cd:0,moving:false,waiting:true};
  this.exit=level.exit;
  this.hermit={x:level.hermit.x,y:level.hermit.y,r:22,hp:100,maxHp:100,angle:Math.PI};
  this.pickups=level.pickups.map(p=>({...p}));
  this.relics=level.relics.map(r=>({...r}));
  for(const e of level.enemies)this.spawn(e.type,e.x,e.y);
 }
 setupForest(){
  const level=createForestLevel();
  applyGeometry(level.world,level.walls);
  this.forest=level;
  this.player={x:level.start.x,y:level.start.y,r:22,hp:100,maxHp:100,energy:100,angle:-Math.PI/2,inv:0,cd:0,swing:0,moving:false,shield:false,skin:'warrior'};
  this.ally={x:level.start.x+40,y:level.start.y+12,r:20,hp:100,maxHp:100,angle:-Math.PI/2,inv:0,cd:0,moving:false,waiting:true};
  this.exit=level.exit;
  this.hermit={x:-999,y:-999,r:22};
  this.pickups=level.pickups.map(p=>({...p}));
  this.relics=[];
  this.hazards=[];
  for(const e of level.enemies)this.spawn(e.type,e.x,e.y);
  this.spawn('warden',level.warden.x,level.warden.y);
  this.warden=this.enemies.find(e=>e.type==='warden')||null;
 }
 setupDesert(){
  const level=createDesertLevel();
  applyGeometry(level.world,level.walls);
  this.desert=level;
  this.player={x:level.start.x,y:level.start.y,r:22,hp:100,maxHp:100,energy:100,angle:-Math.PI/2,inv:0,cd:0,swing:0,moving:false,shield:false,skin:'warrior'};
  this.ally={x:level.start.x+42,y:level.start.y+14,r:20,hp:100,maxHp:100,angle:-Math.PI/2,inv:0,cd:0,moving:false,waiting:true};
  this.exit=level.exit;
  this.hermit={x:-999,y:-999,r:22};
  this.pickups=level.pickups.map(p=>({...p}));
  this.relics=level.relics.map(r=>({...r}));
  this.hazards=[];
  this.cloak={x:level.cloak.x,y:level.cloak.y,used:false};
  for(const e of level.enemies){
   if(e.type==='mirage')this.spawnMirage(e.x,e.y);
   else this.spawn(e.type,e.x,e.y);
  }
  this.spawn('drywind',level.drywind.x,level.drywind.y);
  this.drywind=this.enemies.find(e=>e.type==='drywind')||null;
 }
 spawnMirage(x,y){
  this.spawn('mirage',x,y,{fake:false,homeX:x,homeY:y});
  this.spawn('mirage',x+56,y-28,{fake:true,homeX:x+56,homeY:y-28});
  this.spawn('mirage',x-48,y+36,{fake:true,homeX:x-48,homeY:y+36});
 }
 applyCollection(skin,relicIds=[]){
  if(SKINS[skin])this.player.skin=skin;
  this.bonus={dmg:0,range:0,regen:0};
  for(const id of relicIds){
   const relic=RELICS[id];
   if(!relic)continue;
   this.bonus.dmg+=relic.dmg||0;
   this.bonus.range+=relic.range||0;
   this.bonus.regen+=relic.regen||0;
  }
  if(this.mission==='maze'||this.mission==='desert')this.relics=this.relics.filter(r=>!relicIds.includes(r.id));
 }
 spawn(type,x,y,extra={}){
  const sizes={
   boss:{r:26,hp:210},
   beast:{r:23,hp:86},
   warden:{r:34,hp:480},
   burrow:{r:22,hp:72},
   vulture:{r:21,hp:64},
   scorpion:{r:24,hp:96},
   mirage:{r:20,hp:58},
   drywind:{r:36,hp:520},
   melee:{r:20,hp:60},
   shooter:{r:20,hp:55}
  };
  const s=sizes[type]||sizes.melee;
  this.enemies.push({
   type,x,y,r:s.r,hp:s.hp,maxHp:s.hp,
   cd:.8+(x%5)*.2,inv:0,angle:0,wind:0,active:false,stagger:0,moving:false,leap:0,
   open:0,bundleBroken:false,move:'idle',pattern:0,smashIn:0,chargeT:0,
   buried:type==='burrow'?1.2:0,fake:!!extra.fake,homeX:extra.homeX??x,homeY:extra.homeY??y,
   ...extra
  });
 }
 emit(text){this.events.push(text)}
 begin(mission='fort'){
  this.mission=mission==='maze'?'maze':mission==='forest'?'forest':mission==='desert'?'desert':'fort';
  this.reset();
  this.state='playing';
  if(this.mission==='maze')this.emit('Ковбой ждёт у входа. Лабиринт — твоё испытание. Найди Хранителя.');
  else if(this.mission==='forest')this.emit('Ковбой на опушке. В глубине — Страж леса. Щит ловит брёвна. Бей, когда вязанка открылась.');
  else if(this.mission==='desert')this.emit('Ковбой на опушке дюн. В храме — плащ Сирокко. Пескорои бьют из-под земли. Мираж без тени — фальшивка.');
  else this.emit('Ковбой в дальнем дворе. Щит: пробел. Удар: мышь или F.');
 }
 stats(){return statsFor(this.player.skin,this.bonus)}
 free(){
  if(this.mission!=='fort'||this.state!=='playing'||this.rescued||dist(this.player,this.ally)>115)return false;
  this.rescued=true;
  this.ally.hp=100;
  this.player.hp=Math.min(100,this.player.hp+20);
  this.emit('Напарник с тобой! Вернитесь к воротам. Прикрой его щитом.');
  this.spawn('boss',1090,570);
  this.spawn('melee',980,840);
  this.bossSpawned=true;
  return true;
 }
 talkHermit(){
  if(this.mission!=='maze'||this.state!=='playing'||this.foundHermit||dist(this.player,this.hermit)>125)return false;
  this.foundHermit=true;
  this.state='choosing';
  this.player.shield=false;
  this.emit('Хранитель предлагает один дар. Выбери, кем станешь.');
  return true;
 }
 chooseSkin(id){
  if(this.state!=='choosing'||!(id==='spirit'||id==='molten'||id==='wood'))return false;
  this.player.skin=id;
  this.chosenSkin=id;
  this.player.hp=Math.min(100,this.player.hp+25);
  this.player.energy=100;
  this.effect(this.player.x,this.player.y-80,SKINS[id].name,'#b1841e');
  this.finish(true);
  return true;
 }
 interact(){
  if(this.mission==='maze')return this.talkHermit();
  if(this.mission==='forest'||this.mission==='desert')return false;
  return this.free();
 }
 finish(win,why=''){
  this.state=win?'won':'lost';
  this.reason=why;
  this.player.shield=false;
  this.bullets=[];
 }
 assault(){
  if(this.state!=='playing')return 0;
  const p=this.player;
  let hit=0;
  for(const e of this.enemies){
   if(e.hp<=0||!e.active)continue;
   const d=dist(p,e);
   if(e.leap>0||e.wind>0)hit=Math.max(hit,1);
   else if(d<80&&visible(p,e))hit=Math.max(hit,1);
   else if(d<150&&visible(p,e))hit=Math.max(hit,.45);
  }
  if(p.inv>0.4)hit=Math.max(hit,1);
  return hit;
 }
 nearest(e,range=Infinity){
  let best=null;
  for(const a of this.enemies){
   if(a.hp<=0)continue;
   const d=dist(e,a);
   if(d<range&&visible(e,a)){best=a;range=d;}
  }
  return best;
 }
 effect(x,y,text,color='#b8323a'){this.effects.push({x,y,text,color,t:.8,max:.8})}
 hit(target,damage,source){
  if(target.inv>0||target.hp<=0)return;
  if(this.enemies.includes(target)&&(target.buried||0)>0){
   this.effect(target.x,target.y-70,'ПОД ПЕСКОМ','#c4a574');
   return;
  }
  if(this.enemies.includes(target)&&target.fake){
   target.hp=0;
   this.effect(target.x,target.y-70,'МИРАЖ','#7aa0c4');
   this.emit('Копия рассыпалась. Ищи того, у кого есть тень.');
   return;
  }
  const st=this.stats();
  const sandHit=source&&(source.kind==='sand'||source.kind==='sting'||source.type==='drywind');
  if(target===this.player&&target.shield){
   const a=Math.atan2(source.y-target.y,source.x-target.x);
   const need=target.skin==='sirocco'&&sandHit?-0.25:.1;
   if(Math.cos(a-target.angle)>need&&target.energy>=st.shieldCost){
    target.energy=Math.max(0,target.energy-st.shieldCost);
    this.blocks++;
    this.effect(target.x,target.y-50,'ЩИТ','#b1841e');
    return;
   }
  }
  if(target===this.player&&target.skin==='sirocco'&&sandHit)damage=Math.max(1,Math.floor(damage*.6));
  if(this.enemies.includes(target)&&target.type==='warden'&&!target.bundleBroken&&!(target.open>0)){
   damage=Math.max(1,Math.floor(damage*.28));
   this.effect(target.x,target.y-82,'ДРОВА','#8a6a32');
  }
  if(this.enemies.includes(target)&&target.type==='drywind'&&!(target.open>0)){
   damage=Math.max(1,Math.floor(damage*.22));
   this.effect(target.x,target.y-82,'БУРЯ','#c4a574');
  }
  target.hp=Math.max(0,target.hp-damage);
  target.inv=target===this.player?.75:target===this.ally?.85:target.type==='warden'||target.type==='drywind'?.12:.18;
  target.stagger=target.type==='warden'||target.type==='drywind'?.12:.25;
  this.effect(target.x,target.y-65,'−'+damage);
  if(target.hp===0&&this.enemies.includes(target)){
   this.kills++;
   this.effect(target.x,target.y-60,'✓','#52705d');
   if(target.type==='warden'){
    this.emit('Страж леса пал. Лес выдохнул.');
    this.finish(true);
   }else if(target.type==='drywind'){
    this.emit('Суховей стих. Плащ Сирокко лежит у алтаря. Возьми его.');
   }else if(target.type==='mirage'&&!target.fake){
    for(const e of this.enemies)if(e.type==='mirage'&&e.fake)e.hp=0;
    this.emit('Настоящий мираж пал.');
   }
  }
  const lost=this.mission==='maze'?'Ты пал в коридорах. Щит к твари, удар в паузу между рогами.':this.mission==='forest'?'Страж сломал тебя. Щит ловит брёвна, удар — когда вязанка открылась.':this.mission==='desert'?'Пустыня забрала тебя. Пескорой бьёт снизу. Мираж без тени — фальшивка. Суховея бей в тишине.':'Воин пал. Поднимай щит перед выстрелом и наступай во время перезарядки.';
  if(this.player.hp<=0)this.finish(false,lost);
  else if(this.mission==='fort'&&this.ally.hp<=0)this.finish(false,'Напарник пал. Держись ближе и встречай выстрелы щитом.');
 }
 fire(e,target,friendly=false){
  const a=Math.atan2(target.y-e.y,target.x-e.x);
  const count=e.type==='boss'?3:1;
  for(let i=0;i<count;i++){
   let angle=a+(i-(count-1)/2)*.16;
   this.bullets.push({x:e.x+Math.cos(angle)*30,y:e.y+Math.sin(angle)*30,dx:Math.cos(angle),dy:Math.sin(angle),speed:friendly?480:e.type==='boss'?300:275,life:2.7,friendly,damage:friendly?22:e.type==='boss'?12:10});
  }
  this.effects.push({x:e.x,y:e.y-28,text:'',color:friendly?'#38a1b0':'#e6ad35',t:.13,max:.13,flash:true});
 }
 wardenThrow(e,aim,rage){
  const a=Math.atan2(aim.y-e.y,aim.x-e.x);
  const n=rage?5:3;
  for(let i=0;i<n;i++){
   const angle=a+(i-(n-1)/2)*(rage?.18:.22);
   this.bullets.push({x:e.x+Math.cos(angle)*36,y:e.y+Math.sin(angle)*36,dx:Math.cos(angle),dy:Math.sin(angle),speed:rage?240:190,life:2.8,friendly:false,damage:rage?13:11,kind:'log',r:12});
  }
  this.effects.push({x:e.x,y:e.y-28,text:'',color:'#7a4e22',t:.16,max:.16,flash:true});
 }
 wardenRoots(e,aim,rage){
  const spots=[{x:aim.x,y:aim.y}];
  const dx=aim.x-e.x,dy=aim.y-e.y,len=Math.hypot(dx,dy)||1;
  spots.push({x:e.x+dx*0.45,y:e.y+dy*0.45});
  spots.push({x:aim.x+dy/len*70,y:aim.y-dx/len*70});
  if(rage)spots.push({x:aim.x-dy/len*80,y:aim.y+dx/len*80});
  for(const s of spots){
   this.hazards.push({kind:'root',x:s.x,y:s.y,r:rage?46:40,wait:rage?.7:.95,life:.45,dmg:rage?16:13,armed:false,struck:false});
  }
 }
 wardenSmash(e,aim){
  e.wind=0;
  e.open=e.bundleBroken?1:1.45;
  const d=dist(e,aim);
  const facing=Math.cos(Math.atan2(aim.y-e.y,aim.x-e.x)-e.angle);
  if(d<125&&facing>.05)this.hit(aim,e.bundleBroken?20:16,e);
  this.effects.push({x:e.x,y:e.y,text:'',color:'#6b4420',t:.22,max:.22,swing:true,angle:e.angle,range:120});
 }
 thinkWarden(e,aim,dt){
  const smashWas=e.smashIn||0;
  e.open=Math.max(0,(e.open||0)-dt);
  e.smashIn=Math.max(0,smashWas-dt);
  e.chargeT=Math.max(0,(e.chargeT||0)-dt);
  if(!e.bundleBroken&&e.hp<=e.maxHp*.5){
   e.bundleBroken=true;
   e.open=1.9;
   e.wind=0;
   e.move='recover';
   this.emit('Вязанка треснула! Страж в ярости — бей без оглядки.');
   this.effect(e.x,e.y-96,'ЯРОСТЬ','#c45a12');
  }
  const rage=!!e.bundleBroken;
  const d=dist(e,aim);
  if(d<560)e.active=true;
  if(!e.active||e.stagger>0)return;
  e.angle=Math.atan2(aim.y-e.y,aim.x-e.x);
  if(smashWas>0&&e.smashIn===0)this.wardenSmash(e,aim);
  if(e.move==='charge'&&e.chargeT>0){
   const sp=rage?300:240;
   move(e,Math.cos(e.angle)*sp*dt,Math.sin(e.angle)*sp*dt);
   e.wind=.2;
   if(d<e.r+aim.r+10)this.hit(aim,rage?18:15,e);
   if(e.chargeT===0){e.open=rage?.8:1.2;e.wind=0;e.move='recover';}
   return;
  }
  if(e.smashIn>0){e.wind=Math.max(e.wind,e.smashIn);return;}
  if(e.cd>0){
   if(e.open<=0&&d>140)chase(e,aim,rage?86:68,dt);
   return;
  }
  e.pattern=(e.pattern||0)+1;
  const step=e.pattern%4;
  if(d>230||step===1){
   this.wardenThrow(e,aim,rage);
   e.move='throw';
   e.cd=rage?1.85:2.45;
   e.open=rage?.85:1.2;
   e.wind=0;
   this.emit(rage?'Страж швыряет брёвна пачкой!':'Брёвна! Подними щит.');
  }else if(step===2){
   this.wardenRoots(e,aim,rage);
   e.move='roots';
   e.cd=rage?2:2.6;
   e.open=rage?1:1.35;
   e.wind=0;
   this.emit('Корни! Отойди от светящихся кругов.');
  }else if(d>130&&step===3){
   e.move='charge';
   e.chargeT=rage?.5:.68;
   e.cd=rage?2.05:2.7;
   e.open=0;
   e.wind=.42;
   this.emit('Страж разбегается. Шагни в сторону.');
  }else{
   e.move='smash';
   e.smashIn=rage?.4:.58;
   e.cd=rage?1.55:2.05;
   e.open=0;
   e.wind=e.smashIn;
   this.emit('Вязанка занесена! Отойди или закройся щитом.');
  }
 }
 thinkBurrow(e,aim,dt){
  const d=dist(e,aim);
  if(d<520)e.active=true;
  if(!e.active||e.stagger>0)return;
  e.angle=Math.atan2(aim.y-e.y,aim.x-e.x);
  e.buried=Math.max(0,(e.buried||0)-dt);
  if(e.buried>0){
   chase(e,aim,170,dt);
   e.wind=0;
   if(d<58&&e.buried<.2){e.buried=0;e.wind=.28;e.cd=.35;}
   return;
  }
  e.wind=Math.max(e.wind,.12);
  if(d<68&&visible(e,aim)&&e.cd<=0){
   e.cd=1.55;
   this.hit(aim,12,e);
   e.buried=2.1;
   e.wind=0;
   this.effect(e.x,e.y-80,'↓','#c4a574');
  }else if(d>95)e.buried=1.4;
  else chase(e,aim,70,dt);
 }
 thinkVulture(e,aim,dt){
  const d=dist(e,aim);
  if(d<560)e.active=true;
  if(!e.active||e.stagger>0)return;
  e.angle=Math.atan2(aim.y-e.y,aim.x-e.x);
  if(e.leap>0){
   move(e,Math.cos(e.angle)*310*dt,Math.sin(e.angle)*310*dt);
   e.wind=.25;
   if(d<e.r+aim.r+8)this.hit(aim,15,e);
   return;
  }
  if(d<140)move(e,-Math.cos(e.angle)*80*dt,-Math.sin(e.angle)*80*dt);
  else if(d>240||!visible(e,aim))chase(e,aim,88,dt);
  else{
   const side=d>1?{x:e.x-(aim.y-e.y)/d*70,y:e.y+(aim.x-e.x)/d*70}:aim;
   chase(e,side,70,dt);
  }
  if(d<280&&d>70&&visible(e,aim)&&e.cd<=0){
   e.leap=.42;
   e.cd=2.15;
   e.wind=.4;
   this.effect(e.x,e.y-90,'!','#8a1f1f');
  }else if(e.leap<=0)e.wind=e.cd<.4?.2:0;
 }
 scorpionSting(e,aim){
  const a=e.angle;
  this.bullets.push({x:e.x+Math.cos(a)*36,y:e.y+Math.sin(a)*36,dx:Math.cos(a),dy:Math.sin(a),speed:340,life:.7,friendly:false,damage:16,kind:'sting',r:13});
  if(dist(e,aim)<210&&Math.cos(Math.atan2(aim.y-e.y,aim.x-e.x)-a)>.45&&visible(e,aim))this.hit(aim,16,e);
  this.effects.push({x:e.x,y:e.y,text:'',color:'#c4a574',t:.2,max:.2,swing:true,angle:a,range:210});
 }
 thinkScorpion(e,aim,dt){
  const stingWas=e.smashIn||0;
  e.smashIn=Math.max(0,stingWas-dt);
  const d=dist(e,aim);
  if(d<520)e.active=true;
  if(!e.active||e.stagger>0)return;
  e.angle=Math.atan2(aim.y-e.y,aim.x-e.x);
  if(stingWas>0&&e.smashIn===0)this.scorpionSting(e,aim);
  if(e.smashIn>0){e.wind=e.smashIn;return;}
  if(d>160)chase(e,aim,62,dt);
  else if(d<90)move(e,-Math.cos(e.angle)*40*dt,-Math.sin(e.angle)*40*dt);
  if(e.cd<=0&&d<230&&visible(e,aim)){
   e.smashIn=.48;
   e.cd=2.2;
   e.wind=.48;
   this.emit('Жало! Отойди с линии или закройся щитом.');
  }
 }
 thinkMirage(e,aim,dt){
  const d=dist(e,aim);
  if(d<500)e.active=true;
  if(!e.active||e.stagger>0)return;
  const real=this.enemies.find(o=>o.type==='mirage'&&!o.fake&&o.hp>0);
  if(e.fake){
   if(!real){e.hp=0;return;}
   chase(e,{x:real.x+(e.homeX-real.homeX),y:real.y+(e.homeY-real.homeY)},110,dt);
   e.angle=real.angle;
   return;
  }
  e.angle=Math.atan2(aim.y-e.y,aim.x-e.x);
  if(d>48)chase(e,aim,96,dt);
  if(d<62&&visible(e,aim)&&e.cd<=0){e.cd=1.3;this.hit(aim,10,e);}
  e.cdFake=(e.cdFake||0)-dt;
  if(e.cdFake<=0){
   e.cdFake=5;
   const fakes=this.enemies.filter(o=>o.type==='mirage'&&o.fake&&o.hp>0).length;
   if(fakes<2){
    const nx=e.x+40-Math.random()*80,ny=e.y+40-Math.random()*80;
    this.spawn('mirage',nx,ny,{fake:true,homeX:nx,homeY:ny});
    this.emit('Мираж размножился. Бей того, у кого тень.');
   }
  }
 }
 drywindGust(e,aim,rage){
  const a=Math.atan2(aim.y-e.y,aim.x-e.x);
  const n=rage?6:4;
  for(let i=0;i<n;i++){
   const angle=a+(i-(n-1)/2)*(rage?.16:.2);
   this.bullets.push({x:e.x+Math.cos(angle)*40,y:e.y+Math.sin(angle)*40,dx:Math.cos(angle),dy:Math.sin(angle),speed:rage?260:210,life:2.6,friendly:false,damage:rage?14:11,kind:'sand',r:11});
  }
  this.effects.push({x:e.x,y:e.y-28,text:'',color:'#d2b46a',t:.16,max:.16,flash:true});
 }
 drywindRing(e,aim,rage){
  const n=rage?10:8;
  const rad=rage?150:130;
  const spots=[{x:aim.x,y:aim.y}];
  for(let i=0;i<n;i++){
   const a=i/n*Math.PI*2;
   spots.push({x:aim.x+Math.cos(a)*rad,y:aim.y+Math.sin(a)*rad});
  }
  for(const s of spots)this.hazards.push({kind:'sand',x:s.x,y:s.y,r:rage?50:42,wait:rage?.65:.9,life:.5,dmg:rage?17:14,armed:false,struck:false});
 }
 thinkDrywind(e,aim,dt){
  e.open=Math.max(0,(e.open||0)-dt);
  e.chargeT=Math.max(0,(e.chargeT||0)-dt);
  if(!e.bundleBroken&&e.hp<=e.maxHp*.5){
   e.bundleBroken=true;
   e.open=1.7;
   e.wind=0;
   e.move='recover';
   this.emit('Буря рванула! Суховей в ярости — бей в тишине.');
   this.effect(e.x,e.y-96,'ЯРОСТЬ','#d27a22');
  }
  const rage=!!e.bundleBroken;
  const d=dist(e,aim);
  if(d<620)e.active=true;
  if(!e.active||e.stagger>0)return;
  e.angle=Math.atan2(aim.y-e.y,aim.x-e.x);
  if(e.move==='charge'&&e.chargeT>0){
   move(e,Math.cos(e.angle)*(rage?280:230)*dt,Math.sin(e.angle)*(rage?280:230)*dt);
   e.wind=.2;
   if(d<e.r+aim.r+12)this.hit(aim,rage?18:15,e);
   if(e.chargeT===0){e.open=rage?.85:1.25;e.wind=0;e.move='recover';}
   return;
  }
  if(e.cd>0){
   if(e.open<=0&&d>150)chase(e,aim,rage?78:60,dt);
   return;
  }
  e.pattern=(e.pattern||0)+1;
  const step=e.pattern%4;
  if(step===0||d>250){
   this.drywindRing(e,aim,rage);
   e.move='ring';
   e.cd=rage?2:2.55;
   e.open=rage?.7:1.05;
   e.wind=0;
   this.emit('Песчаное кольцо! Выйди из кругов, щит ловит песок.');
  }else if(step===1){
   this.drywindGust(e,aim,rage);
   e.move='gust';
   e.cd=rage?1.9:2.4;
   e.open=rage?.8:1.15;
   e.wind=0;
   this.emit('Суховей плюёт песком. Подними щит.');
  }else if(step===2){
   e.move='quiet';
   e.cd=rage?1.4:1.9;
   e.open=rage?1.35:1.8;
   e.wind=0;
   this.emit('Тишина! Бей Суховея сейчас.');
  }else{
   e.move='charge';
   e.chargeT=rage?.48:.62;
   e.cd=rage?2.1:2.6;
   e.open=0;
   e.wind=.4;
   this.emit('Суховей несётся. Шагни в сторону.');
  }
 }
 fogMission(){return this.mission==='maze'||this.mission==='forest'||this.mission==='desert'}
 markSeen(force=false){
  if(!this.fogMission()&&!force)return;
  const p=this.player;
  const step=48;
  const sight=this.mission==='desert'?(p.skin==='sirocco'?205:138):175;
  this.seen.add(`${Math.floor(p.x/step)},${Math.floor(p.y/step)}`);
  for(let x=p.x-sight;x<=p.x+sight;x+=step){
   for(let y=p.y-sight;y<=p.y+sight;y+=step){
    if(dist(p,{x,y})>sight)continue;
    if(!visible(p,{x,y}))continue;
    this.seen.add(`${Math.floor(x/step)},${Math.floor(y/step)}`);
   }
  }
 }
 isSeen(x,y){
  if(!this.fogMission())return true;
  const step=48;
  return this.seen.has(`${Math.floor(x/step)},${Math.floor(y/step)}`);
 }
 update(dt,input={}){
  if(this.state!=='playing')return;
  dt=Math.min(dt,.05);
  this.time+=dt;
  const p=this.player;
  const st=this.stats();
  const actors=this.mission==='fort'?[p,this.ally,...this.enemies]:[p,...this.enemies];
  for(const e of actors){
   e.inv=Math.max(0,e.inv-dt);
   e.cd=Math.max(0,e.cd-dt);
   e.stagger=Math.max(0,(e.stagger||0)-dt);
   e.leap=Math.max(0,(e.leap||0)-dt);
   e.moving=false;
  }
  p.swing=Math.max(0,p.swing-dt);
  p.shield=!!input.shield&&p.energy>1&&p.swing<=0;
  if(st.regen>0)p.hp=Math.min(p.maxHp,p.hp+st.regen*dt);
  let mx=input.x||0,my=input.y||0,l=Math.hypot(mx,my);
  if(l>1){mx/=l;my/=l;}
  const target=this.nearest(p,p.shield?440:170);
  if(target)p.angle=Math.atan2(target.y-p.y,target.x-p.x);
  else if(l>.05)p.angle=Math.atan2(my,mx);
  const speed=p.shield?Math.min(96,st.speed*.5):st.speed;
  move(p,mx*speed*dt,my*speed*dt);
  p.energy=clamp(p.energy+(p.shield?-st.energyDrain:st.energyRegen)*dt,0,100);
  if(input.attack&&p.cd<=0){
   p.shield=false;
   p.cd=st.cd;
   p.swing=.22;
   for(const e of this.enemies){
    if(e.hp>0&&dist(p,e)<st.range&&visible(p,e)&&Math.cos(Math.atan2(e.y-p.y,e.x-p.x)-p.angle)>.12)this.hit(e,st.dmg,p);
   }
   this.effects.push({x:p.x,y:p.y,text:'',color:'#f7edcc',t:.18,max:.18,swing:true,angle:p.angle,range:st.range});
  }
  if(input.interact)this.interact();
  for(const e of this.enemies){
   if(e.hp<=0||this.state!=='playing')continue;
   let aim=p;
   if(this.mission==='fort'&&this.rescued&&dist(e,this.ally)<dist(e,p)*.78)aim=this.ally;
   const d=dist(e,aim);
   if(d<(this.mission==='maze'?380:470))e.active=true;
   if(!e.active||e.stagger>0)continue;
   e.angle=Math.atan2(aim.y-e.y,aim.x-e.x);
   if(e.type==='melee'){
    if(d>45)chase(e,aim,92,dt);
    if(d<65&&visible(e,aim)&&e.cd<=0){e.cd=1.35;this.hit(aim,9,e);}
   }else if(e.type==='beast'){
    if(d>52)chase(e,aim,e.leap>0?250:138,dt);
    if(d<210&&d>70&&visible(e,aim)&&e.cd<=0){e.leap=.32;e.cd=1.85;e.wind=.25;this.effect(e.x,e.y-90,'!','#8a1f1f');}
    else e.wind=e.leap>0?.2:0;
    if(d<60&&visible(e,aim)&&e.cd<=1.2){e.cd=1.2;this.hit(aim,14,e);}
   }   else if(e.type==='shooter'||e.type==='boss'){
    if(d>310||!visible(e,aim)){chase(e,aim,e.type==='boss'?72:74,dt);e.wind=0;}
    else if(d<120)move(e,-Math.cos(e.angle)*55*dt,-Math.sin(e.angle)*55*dt);
    if(d<420&&visible(e,aim)){
     if(e.cd<=.65)e.wind=.65-e.cd;else e.wind=0;
     if(e.cd<=0){this.fire(e,aim);e.cd=e.type==='boss'?2.25:2.4;e.wind=0;}
    }
   }else if(e.type==='warden'){
    this.thinkWarden(e,aim,dt);
   }else if(e.type==='burrow'){
    this.thinkBurrow(e,aim,dt);
   }else if(e.type==='vulture'){
    this.thinkVulture(e,aim,dt);
   }else if(e.type==='scorpion'){
    this.thinkScorpion(e,aim,dt);
   }else if(e.type==='mirage'){
    this.thinkMirage(e,aim,dt);
   }else if(e.type==='drywind'){
    this.thinkDrywind(e,aim,dt);
   }
  }
  if(this.mission==='fort'&&this.rescued&&this.state==='playing'){
   const a=this.ally,d=dist(a,p);
   if(d>72)chase(a,p,d>210?220:178,dt);
   const e=this.nearest(a,340);
   if(e){a.angle=Math.atan2(e.y-a.y,e.x-a.x);if(a.cd<=0){this.fire(a,e,true);a.cd=1.1;}}
   else a.angle=p.angle;
   if(dist(p,this.exit)<110&&dist(a,this.exit)<150){this.finish(true);return;}
  }
  for(const b of this.bullets){
   b.life-=dt;
   const steps=Math.max(1,Math.ceil(b.speed*dt/8));
   for(let i=0;i<steps&&b.life>0;i++){
    b.x+=b.dx*b.speed*dt/steps;
    b.y+=b.dy*b.speed*dt/steps;
    if(blocked(b.x,b.y,4)){b.life=0;break;}
    const targets=b.friendly?this.enemies:[p,...(this.mission==='fort'&&this.rescued?[this.ally]:[])];
    for(const t of targets){
     if(t.hp>0&&dist(b,t)<t.r+(b.r||7)){this.hit(t,b.damage,{x:b.x-b.dx*45,y:b.y-b.dy*45,kind:b.kind,type:b.kind});b.life=0;break;}
    }
   }
  }
  this.bullets=this.bullets.filter(b=>b.life>0);
  this.effects.forEach(e=>e.t-=dt);
  this.effects=this.effects.filter(e=>e.t>0);
  for(const h of this.hazards){
   h.wait-=dt;
   if(h.wait<=0){
    h.armed=true;
    h.life-=dt;
    if(!h.struck&&dist(p,h)<h.r){h.struck=true;this.hit(p,h.dmg,h);}
   }
  }
  this.hazards=this.hazards.filter(h=>h.wait>0||h.life>0);
  for(const item of this.pickups){
   if(!item.used&&dist(p,item)<42&&p.hp<p.maxHp){
    item.used=true;
    p.hp=Math.min(p.maxHp,p.hp+38);
    if(this.mission==='fort'&&this.rescued)this.ally.hp=Math.min(100,this.ally.hp+38);
    this.effect(p.x,p.y-70,'+38','#33826b');
    this.emit('Аптечка: здоровье восстановлено.');
   }
  }
  for(const relic of this.relics){
   if(!relic.used&&dist(p,relic)<46){
    relic.used=true;
    this.secrets++;
    this.bonus.dmg+=relic.dmg||0;
    this.bonus.range+=relic.range||0;
    this.effect(p.x,p.y-76,relic.name,'#c9a227');
    this.emit(relic.text);
   }
  }
  if(this.mission==='desert'&&this.cloak&&!this.cloak.used&&dist(p,this.cloak)<50){
   const boss=this.enemies.find(e=>e.type==='drywind'&&e.hp>0);
   if(boss){
    if(!this.cloak.warned){this.cloak.warned=true;this.emit('Плащ под охраной Суховея. Сначала пережди бурю.');}
   }else{
    this.cloak.used=true;
    this.player.skin='sirocco';
    this.chosenSkin='sirocco';
    this.effect(p.x,p.y-76,'Сирокко','#d2a04a');
    this.emit('Ты надел плащ Сирокко. Пустыня твоя.');
    this.finish(true);
    return;
   }
  }
  if(this.fogMission())this.markSeen();
 }
 snapshot(){
  const warden=this.enemies.find(e=>e.type==='warden'&&e.hp>0)||null;
  const drywind=this.enemies.find(e=>e.type==='drywind'&&e.hp>0)||null;
  const objective=this.mission==='maze'
   ?(this.foundHermit?'Выбери облик у Хранителя':'Найди Хранителя в лабиринте')
   :this.mission==='forest'
    ?(warden?(warden.bundleBroken?'Страж в ярости — бей':'Дождись открытия и бей Стража'):'Страж пал')
    :this.mission==='desert'
     ?(drywind?(drywind.open>0?'Тишина — бей Суховея':'Доберись до храма и бей в тишине'):(this.cloak&&!this.cloak.used?'Возьми плащ Сирокко':'Плащ твой'))
     :(this.rescued?'Вернитесь к воротам вместе':'Освободи ковбоя');
  return{
   state:this.state,
   mission:this.mission,
   rescued:this.rescued,
   foundHermit:this.foundHermit,
   skin:this.player.skin,
   chosenSkin:this.chosenSkin,
   secrets:this.secrets,
   time:Math.round(this.time),
   hero:{x:Math.round(this.player.x),y:Math.round(this.player.y),hp:this.player.hp},
   companion:{x:Math.round(this.ally.x),y:Math.round(this.ally.y),hp:this.ally.hp},
   enemies:this.enemies.filter(e=>e.hp>0).length,
   warden:warden?{hp:Math.round(warden.hp),maxHp:warden.maxHp,open:warden.open>0,bundleBroken:!!warden.bundleBroken,move:warden.move}:null,
   drywind:drywind?{hp:Math.round(drywind.hp),maxHp:drywind.maxHp,open:drywind.open>0,bundleBroken:!!drywind.bundleBroken,move:drywind.move}:null,
   cloak:this.cloak?{x:Math.round(this.cloak.x),y:Math.round(this.cloak.y),used:!!this.cloak.used}:null,
   objective,
   kills:this.kills,
   blocks:this.blocks
  };
 }
}
