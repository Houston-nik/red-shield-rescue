export const WORLD={w:2400,h:1500};
export const WALLS=[
 {x:40,y:90,w:2320,h:38},{x:40,y:1370,w:2320,h:38},{x:40,y:90,w:38,h:560},{x:40,y:950,w:38,h:458},{x:2322,y:90,w:38,h:1318},
 {x:670,y:90,w:50,h:560},{x:670,y:890,w:50,h:518},
 {x:1390,y:90,w:50,h:320},{x:1390,y:650,w:50,h:758},
 {x:300,y:430,w:120,h:90},{x:400,y:1020,w:115,h:115},{x:850,y:380,w:160,h:75},
 {x:1080,y:700,w:100,h:100},{x:875,y:1080,w:170,h:80},
 {x:1580,y:300,w:145,h:90},{x:1820,y:740,w:140,h:85},{x:1610,y:1100,w:190,h:90},
 {x:1990,y:260,w:235,h:30},{x:2210,y:260,w:25,h:330},{x:1990,y:590,w:245,h:25}
];
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function blocked(x,y,r=20){return x<r+42||x>WORLD.w-r-42||y<r+92||y>WORLD.h-r-92||WALLS.some(w=>x+r>w.x&&x-r<w.x+w.w&&y+r>w.y&&y-r<w.y+w.h)}
export function visible(a,b){const d=dist(a,b),n=Math.ceil(d/14);for(let i=1;i<n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,3))return false;return true}
export function move(e,dx,dy){const ox=e.x,oy=e.y;if(!blocked(e.x+dx,e.y,e.r))e.x+=dx;if(!blocked(e.x,e.y+dy,e.r))e.y+=dy;e.moving=Math.hypot(e.x-ox,e.y-oy)>0.1;}
const cell=40,cols=60,rows=38;
const grid=Array.from({length:cols*rows},(_,i)=>!blocked(i%cols*cell+20,Math.floor(i/cols)*cell+20,23));
function nodeFor(p){let x=clamp(Math.floor(p.x/cell),0,cols-1),y=clamp(Math.floor(p.y/cell),0,rows-1);if(grid[y*cols+x])return y*cols+x;let best=-1,bd=Infinity;for(let yy=Math.max(0,y-3);yy<=Math.min(rows-1,y+3);yy++)for(let xx=Math.max(0,x-3);xx<=Math.min(cols-1,x+3);xx++){const n=yy*cols+xx,d=(xx-x)**2+(yy-y)**2;if(grid[n]&&d<bd){bd=d;best=n;}}return best;}
export function pathBetween(a,b){if(visible(a,b))return[{x:b.x,y:b.y}];const start=nodeFor(a),end=nodeFor(b);if(start<0||end<0)return[];const q=[start],prev=new Int32Array(cols*rows).fill(-2);prev[start]=-1;for(let h=0;h<q.length;h++){let n=q[h];if(n===end)break;const x=n%cols,y=Math.floor(n/cols);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,j=yy*cols+xx;if(xx<0||xx>=cols||yy<0||yy>=rows||!grid[j]||prev[j]!==-2)continue;prev[j]=n;q.push(j);}}if(prev[end]===-2)return[];const path=[];for(let n=end;n!==start&&n!==-1;n=prev[n])path.push({x:n%cols*cell+20,y:Math.floor(n/cols)*cell+20});return path.reverse();}
function chase(e,target,speed,dt){e.pathTime=(e.pathTime||0)-dt;let t=target;if(!visible(e,target)){if(e.pathTime<=0||!e.path?.length){e.path=pathBetween(e,target);e.pathTime=.65;}while(e.path?.length&&dist(e,e.path[0])<17)e.path.shift();t=e.path?.[0];}if(!t){e.moving=false;return;}const d=dist(e,t);if(d>1)move(e,(t.x-e.x)/d*speed*dt,(t.y-e.y)/d*speed*dt);}
export class Game{
 constructor(){this.reset()}
 reset(){this.state='ready';this.time=0;this.kills=0;this.blocks=0;this.rescued=false;this.bossSpawned=false;this.reason='';this.player={x:190,y:800,r:22,hp:100,maxHp:100,energy:100,angle:0,inv:0,cd:0,swing:0,moving:false,shield:false};this.ally={x:2110,y:460,r:20,hp:100,maxHp:100,angle:Math.PI,inv:0,cd:0,moving:false};this.exit={x:165,y:800};this.bullets=[];this.effects=[];this.events=[];this.enemies=[];this.pickups=[{x:880,y:980,used:false},{x:1680,y:610,used:false}];this.spawn('melee',470,700);this.spawn('melee',480,920);this.spawn('shooter',825,735);this.spawn('melee',1000,930);this.spawn('melee',1190,450);this.spawn('shooter',1220,1000);this.spawn('shooter',1540,520);this.spawn('melee',1780,470);this.spawn('melee',2000,760);this.spawn('shooter',2140,870);this.spawn('melee',1960,420);this.spawn('shooter',1750,960);}
 spawn(type,x,y){this.enemies.push({type,x,y,r:type==='boss'?26:20,hp:type==='boss'?210:type==='melee'?60:55,maxHp:type==='boss'?210:type==='melee'?60:55,cd:.8+(x%5)*.2,inv:0,angle:0,wind:0,active:false,stagger:0,moving:false});}
 emit(text){this.events.push(text)}
 begin(){this.reset();this.state='playing';this.emit('Ковбой в дальнем дворе. Щит: пробел. Удар: мышь или F.');}
 free(){if(this.state!=='playing'||this.rescued||dist(this.player,this.ally)>115)return false;this.rescued=true;this.ally.hp=100;this.player.hp=Math.min(100,this.player.hp+20);this.emit('Напарник с тобой! Вернитесь к воротам. Прикрой его щитом.');this.spawn('boss',1090,570);this.spawn('melee',980,840);this.bossSpawned=true;return true;}
 finish(win,why=''){this.state=win?'won':'lost';this.reason=why;this.player.shield=false;this.bullets=[];}
 nearest(e,range=Infinity){let best=null;for(const a of this.enemies){if(a.hp<=0)continue;const d=dist(e,a);if(d<range&&visible(e,a)){best=a;range=d;}}return best;}
 effect(x,y,text,color='#b8323a'){this.effects.push({x,y,text,color,t:.8,max:.8})}
 hit(target,damage,source){if(target.inv>0||target.hp<=0)return;if(target===this.player&&target.shield){const a=Math.atan2(source.y-target.y,source.x-target.x);if(Math.cos(a-target.angle)>.1&&target.energy>=9){target.energy=Math.max(0,target.energy-9);this.blocks++;this.effect(target.x,target.y-50,'ЩИТ','#b1841e');return;}}target.hp=Math.max(0,target.hp-damage);target.inv=target===this.player?.75:target===this.ally?.85:.18;target.stagger=.25;this.effect(target.x,target.y-65,'−'+damage);if(target.hp===0&&this.enemies.includes(target)){this.kills++;this.effect(target.x,target.y-60,'✓','#52705d');}if(this.player.hp<=0)this.finish(false,'Воин пал. Поднимай щит перед выстрелом и наступай во время перезарядки.');else if(this.ally.hp<=0)this.finish(false,'Напарник пал. Держись ближе и встречай выстрелы щитом.');}
 fire(e,target,friendly=false){const a=Math.atan2(target.y-e.y,target.x-e.x);const count=e.type==='boss'?3:1;for(let i=0;i<count;i++){let angle=a+(i-(count-1)/2)*.16;this.bullets.push({x:e.x+Math.cos(angle)*30,y:e.y+Math.sin(angle)*30,dx:Math.cos(angle),dy:Math.sin(angle),speed:friendly?480:e.type==='boss'?300:275,life:2.7,friendly,damage:friendly?22:e.type==='boss'?12:10});}this.effects.push({x:e.x,y:e.y-28,text:'',color:friendly?'#38a1b0':'#e6ad35',t:.13,max:.13,flash:true});}
 update(dt,input={}){if(this.state!=='playing')return;dt=Math.min(dt,.05);this.time+=dt;const p=this.player;for(const e of[p,this.ally,...this.enemies]){e.inv=Math.max(0,e.inv-dt);e.cd=Math.max(0,e.cd-dt);e.stagger=Math.max(0,(e.stagger||0)-dt);e.moving=false;}p.swing=Math.max(0,p.swing-dt);p.shield=!!input.shield&&p.energy>1&&p.swing<=0;
 let mx=input.x||0,my=input.y||0,l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l;}const target=this.nearest(p,p.shield?440:170);if(target)p.angle=Math.atan2(target.y-p.y,target.x-p.x);else if(l>.05)p.angle=Math.atan2(my,mx);move(p,mx*(p.shield?96:190)*dt,my*(p.shield?96:190)*dt);p.energy=clamp(p.energy+(p.shield?-4:23)*dt,0,100);
 if(input.attack&&p.cd<=0){p.shield=false;p.cd=.43;p.swing=.22;for(const e of this.enemies){if(e.hp>0&&dist(p,e)<115&&visible(p,e)&&Math.cos(Math.atan2(e.y-p.y,e.x-p.x)-p.angle)>.12)this.hit(e,30,p);}this.effects.push({x:p.x,y:p.y,text:'',color:'#f7edcc',t:.18,max:.18,swing:true,angle:p.angle});}
 if(input.interact)this.free();
 for(const e of this.enemies){if(e.hp<=0||this.state!=='playing')continue;let target=p;if(this.rescued&&dist(e,this.ally)<dist(e,p)*.78)target=this.ally;const d=dist(e,target);if(d<470)e.active=true;if(!e.active||e.stagger>0)continue;e.angle=Math.atan2(target.y-e.y,target.x-e.x);
 if(e.type==='melee'){if(d>45)chase(e,target,92,dt);if(d<65&&visible(e,target)&&e.cd<=0){e.cd=1.35;this.hit(target,9,e);}}
 else {if(d>310||!visible(e,target)){chase(e,target,e.type==='boss'?72:74,dt);e.wind=0;}else if(d<120){move(e,-Math.cos(e.angle)*55*dt,-Math.sin(e.angle)*55*dt);}if(d<420&&visible(e,target)){if(e.cd<=.65)e.wind=.65-e.cd;else e.wind=0;if(e.cd<=0){this.fire(e,target);e.cd=e.type==='boss'?2.25:2.4;e.wind=0;}}}
 }
 if(this.rescued&&this.state==='playing'){const a=this.ally,d=dist(a,p);if(d>72)chase(a,p,d>210?220:178,dt);const e=this.nearest(a,340);if(e){a.angle=Math.atan2(e.y-a.y,e.x-a.x);if(a.cd<=0){this.fire(a,e,true);a.cd=1.1;}}else a.angle=p.angle;if(dist(p,this.exit)<110&&dist(a,this.exit)<150){this.finish(true);return;}}
 for(const b of this.bullets){b.life-=dt;const steps=Math.max(1,Math.ceil(b.speed*dt/8));for(let i=0;i<steps&&b.life>0;i++){b.x+=b.dx*b.speed*dt/steps;b.y+=b.dy*b.speed*dt/steps;if(blocked(b.x,b.y,4)){b.life=0;break;}const targets=b.friendly?this.enemies:[p,...(this.rescued?[this.ally]:[])];for(const t of targets){if(t.hp>0&&dist(b,t)<t.r+7){this.hit(t,b.damage,{x:b.x-b.dx*45,y:b.y-b.dy*45});b.life=0;break;}}}}
 this.bullets=this.bullets.filter(b=>b.life>0);this.effects.forEach(e=>e.t-=dt);this.effects=this.effects.filter(e=>e.t>0);
 for(const item of this.pickups){if(!item.used&&dist(p,item)<42&&(p.hp<100||(this.rescued&&this.ally.hp<100))){item.used=true;p.hp=Math.min(100,p.hp+38);if(this.rescued)this.ally.hp=Math.min(100,this.ally.hp+38);this.effect(p.x,p.y-70,'+38','#33826b');this.emit('Аптечка: здоровье восстановлено.');}}
 }
 snapshot(){return{state:this.state,rescued:this.rescued,time:Math.round(this.time),hero:{x:Math.round(this.player.x),y:Math.round(this.player.y),hp:this.player.hp},companion:{x:Math.round(this.ally.x),y:Math.round(this.ally.y),hp:this.ally.hp},enemies:this.enemies.filter(e=>e.hp>0).length,objective:this.rescued?'Вернитесь к воротам вместе':'Освободи ковбоя',kills:this.kills,blocks:this.blocks};}
}
