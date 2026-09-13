import {Game,WORLD,WALLS,dist,SKINS} from './engine.js';
import {createAtmosphere} from './music.js';
import {loadWardrobe,unlockMage,unlockSkin,unlockRelic,equipSkin,skinMeta,relicMeta,WARDROBE_SKINS,WARDROBE_RELICS} from './wardrobe.js';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d'),game=new Game();
const keys=new Set(),input={x:0,y:0,attack:false,shield:false,interact:false};
let width=innerWidth,height=innerHeight,dpr=1,camera={x:0,y:0},zoom=1,last=0,frame=0,previousState='ready',toastUntil=0,assetsReady=false,mouseDown=false,joy={x:0,y:0},touchAttack=false,touchShield=false,soundOn=true,audio=null,prevKills=0,prevBlocks=0,prevHp=100,lastAttack=0,prevSecrets=0;
const music=createAtmosphere();
const coarse=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
const atlas=new Image();atlas.src='assets/characters.png';
const stickArt={
 hermit:Object.assign(new Image(),{src:'assets/hermit.png'}),
 spirit:Object.assign(new Image(),{src:'assets/skin-spirit.png'}),
 molten:Object.assign(new Image(),{src:'assets/skin-molten.png'}),
 wood:Object.assign(new Image(),{src:'assets/skin-wood.png'}),
 beast:Object.assign(new Image(),{src:'assets/beast.png'}),
 warden:Object.assign(new Image(),{src:'assets/warden.png'})
};
atlas.onload=()=>{assetsReady=true;$('assetStatus').hidden=true;$('play').disabled=false;$('maze').disabled=false;$('forest').disabled=false;refreshOwned();};
atlas.onerror=()=>{$('assetStatus').textContent='Не удалось загрузить героев. Обнови страницу.';$('play').disabled=true;$('maze').disabled=true;$('forest').disabled=true;};
$('play').disabled=true;$('maze').disabled=true;$('forest').disabled=true;
const sprites={warrior:{x:45,y:10,w:525,h:990},cowboy:{x:542,y:96,w:451,h:905},bandit:{x:1010,y:170,w:500,h:828}};
function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.floor(width*dpr);canvas.height=Math.floor(height*dpr);zoom=Math.max(.48,Math.min(1.2,width/1050,height/660));if(width<600&&height>width)zoom=.64;ctx.setTransform(dpr,0,0,dpr,0,0);}
addEventListener('resize',resize);resize();
function initSound(){
 if(!audio){
  try{audio=new(window.AudioContext||window.webkitAudioContext)();music.attach(audio);}
  catch{soundOn=false;}
 }
 if(audio?.state==='suspended')audio.resume();
 music.setEnabled(soundOn);
}
function tone(f,d=.07,type='triangle',vol=.055){if(!audio||!soundOn)return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(30,f*.5),audio.currentTime+d);g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+d);}
function syncMusic(){
 if(!audio)return;
 const foe=game.state==='playing'?game.nearest(game.player,270):null;
 music.setMood({
  place:game.mission==='maze'?'maze':game.mission==='forest'?'forest':'fort',
  beat:game.state,
  danger:foe?Math.max(0,1-dist(game.player,foe)/270):0,
  hurt:game.player.hp<32,
  assault:game.assault()
 });
}
function clearInput(){keys.clear();mouseDown=false;touchShield=false;touchAttack=false;joy={x:0,y:0};$('knob').style.transform='';$('shieldTouch').classList.remove('held');$('attackTouch').classList.remove('held');}
function showToast(t){$('toast').textContent=t;$('toast').classList.add('show');toastUntil=performance.now()+4300;}
function formatTime(t){return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');}
let wardrobeIntent='browse';
function collection(){return loadWardrobe();}
function refreshOwned(){
 const data=collection();
 const el=$('ownedSkin');
 const skin=SKINS[data.equipped];
 if(skin&&data.equipped!=='warrior'){el.hidden=false;el.textContent='Надет: '+skin.name+'. Открой гардероб.';}
 else if(data.mage||data.relics.length){el.hidden=false;el.textContent='В гардеробе есть находки.';}
 else el.hidden=true;
}
function renderWardrobe(){
 const data=collection();
 const skins=$('wardrobeSkins');
 const relics=$('wardrobeRelics');
 skins.innerHTML='';
 relics.innerHTML='';
 for(const id of WARDROBE_SKINS){
  const meta=skinMeta(id);
  const open=data.skins.includes(id);
  const card=document.createElement(open?'button':'div');
  card.className='ward-card'+(open?'':' locked');
  if(open){card.type='button';card.dataset.equip=id;}
  const visual=open?(id==='warrior'?'<div class="portrait">Λ</div>':`<img src="${meta.img}" alt="${meta.name}">`):'<div class="portrait mystery">?</div>';
  card.innerHTML=`${visual}<strong>${open?meta.name:'???'}</strong><span>${open?meta.hint:'Ещё в лабиринте.'}</span>${open&&data.equipped===id?'<em class="badge">Надет</em>':''}`;
  skins.appendChild(card);
 }
 for(const id of WARDROBE_RELICS){
  const meta=relicMeta(id);
  const open=data.relics.includes(id);
  const card=document.createElement('div');
  card.className='ward-card'+(open?'':' locked');
  const mark=open?`<div class="relic-mark ${id}"></div>`:'<div class="portrait mystery">?</div>';
  card.innerHTML=`${mark}<strong>${open?meta.name:'???'}</strong><span>${open?meta.hint:meta.locked}</span>${open?'<em class="badge">Найдена</em>':''}`;
  relics.appendChild(card);
 }
 const bits=[];
 if(data.mage)bits.push('Маг найден');
 const gifts=data.skins.filter(id=>id!=='warrior'&&id!=='mage');
 if(gifts.length)bits.push('дар: '+gifts.map(id=>SKINS[id].name).join(', '));
 if(data.relics.length)bits.push('находки '+data.relics.length+'/'+WARDROBE_RELICS.length);
 $('wardrobeCopy').textContent=wardrobeIntent==='forest'
  ?'Надень облик и входи. Страж бьёт вязанкой, брёвнами и корнями. Щит ловит брёвна, удар — когда броня открылась.'
  :(bits.length?bits.join(' · '):'Пройди лабиринт — сюда придут Маг, выбранный облик и пасхалки.');
}
function openWardrobe(intent='browse'){
 if(game.state==='playing'||game.state==='choosing'||game.state==='paused')return;
 wardrobeIntent=intent==='forest'?'forest':'browse';
 const prep=wardrobeIntent==='forest';
 $('wardrobeEyebrow').textContent=prep?'ТРЕТЬЯ МИССИЯ · ВЫБЕРИ ОБЛИК':'ТРОФЕИ · ОБЛИКИ · НАХОДКИ';
 $('wardrobeTitle').textContent=prep?'ПЕРЕД ЛЕСОМ':'ГАРДЕРОБ';
 $('wardrobeSub').textContent=prep?'НАДЕНЬ ОБЛИК':'ЧТО УНЁС С СОБОЙ';
 $('wardrobeGo').hidden=!prep;
 renderWardrobe();
 $('wardrobe').hidden=false;
 $('overlay').hidden=true;
}
function closeWardrobe(stayHidden=false){
 $('wardrobe').hidden=true;
 wardrobeIntent='browse';
 $('wardrobeGo').hidden=true;
 if(!stayHidden&&game.state!=='playing'&&game.state!=='choosing')$('overlay').hidden=false;
}
function setPlayingUI(){
 const playing=game.state==='playing';
 const choosing=game.state==='choosing';
 $('hud').hidden=!playing;
 $('desktopHelp').hidden=!playing||coarse;
 $('touch').hidden=!playing||!coarse;
 $('overlay').hidden=playing||choosing||!$('wardrobe').hidden;
 $('skinPick').hidden=!choosing;
 $('allyHud').hidden=!playing||game.mission!=='fort'||!game.rescued;
 $('secretHud').hidden=!playing||game.mission!=='maze';
 $('bossHud').hidden=!playing||game.mission!=='forest';
 $('maze').hidden=game.state==='paused';
 $('forest').hidden=game.state==='paused';
 $('wardrobeBtn').hidden=game.state==='paused';
 if(playing||choosing)$('wardrobe').hidden=true;
 if(!playing){$('interact').hidden=true;if(!choosing)$('toast').classList.remove('show');}
}
function rebuildMap(){
 map.width=WORLD.w;
 map.height=WORLD.h;
 seed=game.mission==='maze'?3301:game.mission==='forest'?4417:917;
 buildMap();
}
function begin(mission='fort'){
 if(!assetsReady)return;
 initSound();
 closeWardrobe(true);
 game.begin(mission);
 const bag=collection();
 game.applyCollection(bag.equipped,bag.relics);
 rebuildMap();
 clearInput();
 camera={x:game.player.x-200,y:game.player.y-200};
 prevKills=prevBlocks=0;prevHp=100;prevSecrets=0;previousState='playing';
 $('overlay').className='overlay';
 $('skinPick').hidden=true;
 setPlayingUI();
 updateHUD();
 syncMusic();
 tone(380,.12);
}
function pause(){
 if(game.state==='choosing')return;
 if(game.state==='playing'){
  game.state='paused';
  clearInput();
  $('overlay').className='overlay paused';
  $('cast').hidden=true;
  $('menuTitle').innerHTML='ПЕРЕДЫШКА';
  $('menuSub').textContent='МИССИЯ ПРИОСТАНОВЛЕНА';
  $('menuCopy').textContent=game.mission==='maze'?'Коридоры никуда не убегут. Хранитель ждёт.':game.mission==='forest'?'Страж никуда не денется. Щит ловит брёвна, удар — когда вязанка открылась.':'Соберись с мыслями. Напарник ждёт.';
  $('play').textContent='ПРОДОЛЖИТЬ';
  $('maze').hidden=true;
  $('forest').hidden=true;
  $('wardrobe').hidden=true;
  $('wardrobeBtn').hidden=true;
  $('restart').hidden=false;
  $('results').hidden=true;
  $('menuFoot').textContent='WASD: движение · F: удар · Пробел: щит';
  setPlayingUI();
  syncMusic();
 }else if(game.state==='paused'){
  game.state='playing';
  clearInput();
  setPlayingUI();
  syncMusic();
 }
}
$('play').onclick=()=>{if(game.state==='paused')pause();else begin('fort');};
$('maze').onclick=()=>begin('maze');
$('forest').onclick=()=>openWardrobe('forest');
$('wardrobeBtn').onclick=()=>openWardrobe('browse');
$('wardrobeBack').onclick=closeWardrobe;
$('wardrobeGo').onclick=()=>begin('forest');
$('wardrobeSkins').onclick=e=>{
 const card=e.target.closest('[data-equip]');
 if(!card)return;
 equipSkin(card.dataset.equip);
 renderWardrobe();
 refreshOwned();
 tone(320,.08);
};
$('restart').onclick=()=>begin(game.mission);
$('pause').onclick=pause;
$('sound').onclick=()=>{soundOn=!soundOn;initSound();music.setEnabled(soundOn);if(soundOn)syncMusic();$('sound').textContent=soundOn?'♪':'♪̸';$('sound').setAttribute('aria-label',soundOn?'Выключить звук':'Включить звук');$('sound').title=soundOn?'Музыка и звуки':'Звук выключен';};
$('interact').onclick=()=>{if(game.interact())tone(700,.2);};
for(const btn of document.querySelectorAll('.skin-card')){
 btn.onclick=()=>{
  if(game.chooseSkin(btn.dataset.skin)){
   unlockSkin(btn.dataset.skin);
   refreshOwned();
   tone(520,.25);
  }
 };
}
addEventListener('keydown',e=>{
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','KeyF','KeyE','Escape','KeyP'].includes(e.code))e.preventDefault();
 keys.add(e.code);
 if((e.code==='Escape'||e.code==='KeyP')&&!e.repeat){
  if(!$('wardrobe').hidden){closeWardrobe();return;}
  pause();
 }
 if(e.code==='KeyE'&&!e.repeat)game.interact();
});
addEventListener('keyup',e=>keys.delete(e.code));
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0){mouseDown=true;canvas.setPointerCapture(e.pointerId);initSound();}});
canvas.addEventListener('pointerup',()=>mouseDown=false);
canvas.addEventListener('pointercancel',()=>mouseDown=false);
canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('blur',()=>{clearInput();if(game.state==='playing')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.state==='playing')pause();});
const stick=$('stick');let stickId=null;
function stickMove(e){if(stickId!==e.pointerId)return;const r=stick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,d=Math.hypot(dx,dy),m=Math.min(38,d),a=Math.atan2(dy,dx);joy={x:Math.cos(a)*m/38,y:Math.sin(a)*m/38};$('knob').style.transform=`translate(${joy.x*32}px,${joy.y*32}px)`}
stick.onpointerdown=e=>{stickId=e.pointerId;stick.setPointerCapture(e.pointerId);stickMove(e);initSound();};
stick.onpointermove=stickMove;
stick.onpointerup=stick.onpointercancel=e=>{if(e.pointerId===stickId){stickId=null;joy={x:0,y:0};$('knob').style.transform='';}};
function touchButton(id,set){const el=$(id);el.onpointerdown=e=>{el.setPointerCapture(e.pointerId);set(true);el.classList.add('held');initSound();};el.onpointerup=el.onpointercancel=()=>{set(false);el.classList.remove('held');};}
touchButton('attackTouch',v=>touchAttack=v);touchButton('shieldTouch',v=>touchShield=v);
const map=document.createElement('canvas');map.width=WORLD.w;map.height=WORLD.h;const m=map.getContext('2d');
let seed=917;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function roundRect(c,x,y,w,h,r=5){c.beginPath();c.roundRect(x,y,w,h,r);}
function buildMap(){
 m.setTransform(1,0,0,1,0,0);
 m.fillStyle=game.mission==='forest'?'#c9d4b8':game.mission==='maze'?'#d4c7ab':'#e7ddc8';
 m.fillRect(0,0,WORLD.w,WORLD.h);
 m.strokeStyle='#c2b39755';m.lineWidth=1;
 const specks=game.mission==='maze'||game.mission==='forest'?9000:15000;
 for(let i=0;i<specks;i++){const x=rnd()*WORLD.w,y=rnd()*WORLD.h;m.globalAlpha=.13+rnd()*.22;m.beginPath();m.moveTo(x,y);m.lineTo(x+rnd()*8-4,y+rnd()*3);m.stroke();}
 m.globalAlpha=1;
 if(game.mission==='fort'){
  m.strokeStyle='#d9caae';m.lineWidth=190;m.lineCap='round';m.beginPath();m.moveTo(130,800);m.lineTo(520,800);m.lineTo(790,770);m.lineTo(1230,550);m.lineTo(1500,530);m.lineTo(2110,460);m.stroke();
  m.setLineDash([8,12]);m.strokeStyle='#b4a38155';m.lineWidth=2;m.beginPath();m.moveTo(140,865);m.lineTo(480,865);m.lineTo(830,825);m.lineTo(1250,605);m.lineTo(1530,590);m.lineTo(2100,530);m.stroke();m.setLineDash([]);
 }
 for(let i=0;i<(game.mission==='maze'?140:220);i++){const x=rnd()*WORLD.w,y=rnd()*WORLD.h;m.fillStyle='#756b5140';m.beginPath();m.ellipse(x,y,2+rnd()*5,1+rnd()*2,rnd()*3,0,Math.PI*2);m.fill();}
 for(const w of WALLS){
  m.fillStyle='#453c3230';m.fillRect(w.x+8,w.y+12,w.w,w.h);
  m.fillStyle=game.mission==='forest'?'#2f4a33':game.mission==='maze'?'#3f382f':(w.w>70&&w.h>50?'#b7a88c':'#bfb29b');
  m.fillRect(w.x,w.y,w.w,w.h);
  m.strokeStyle=game.mission==='forest'?'#1c2e20':game.mission==='maze'?'#2a251f':'#5a574c';m.lineWidth=2;m.strokeRect(w.x,w.y,w.w,w.h);
  m.strokeStyle='#655b4655';m.lineWidth=1;
  if(game.mission==='maze'||game.mission==='forest'){
   if(w.h>w.w){for(let y=w.y+14;y<w.y+w.h;y+=22){m.beginPath();m.moveTo(w.x,y);m.lineTo(w.x+w.w,y+3);m.stroke();}}
   else {for(let x=w.x+16;x<w.x+w.w;x+=26){m.beginPath();m.moveTo(x,w.y);m.lineTo(x+4,w.y+w.h);m.stroke();}}
  }else if(w.w>70&&w.h>50){
   m.strokeRect(w.x+5,w.y+5,w.w-10,w.h-10);
   m.beginPath();m.moveTo(w.x+5,w.y+5);m.lineTo(w.x+w.w-5,w.y+w.h-5);m.moveTo(w.x+w.w-5,w.y+5);m.lineTo(w.x+5,w.y+w.h-5);m.stroke();
  }else{
   for(let x=w.x+10;x<w.x+w.w;x+=42){m.beginPath();m.moveTo(x,w.y);m.lineTo(x+5,w.y+w.h);m.stroke();}
   for(let y=w.y+18;y<w.y+w.h;y+=36){m.beginPath();m.moveTo(w.x,y);m.lineTo(w.x+w.w,y);m.stroke();}
  }
  m.strokeStyle='#eee4ceaa';m.beginPath();m.moveTo(w.x+2,w.y+2);m.lineTo(w.x+w.w-2,w.y+2);m.stroke();
 }
 function label(t,x,y,size=23){m.save();m.translate(x,y);m.rotate(-.03);m.fillStyle='#73634666';m.font=`bold ${size}px Georgia`;m.fillText(t,0,0);m.restore();}
 if(game.mission==='maze'){
  label('ВХОД',game.exit.x-30,game.exit.y+70,22);
  m.fillStyle='#388079';m.font='bold 16px Arial';m.fillText('КОВБОЙ ЖДЁТ',game.exit.x-54,game.exit.y+92);
 }else if(game.mission==='forest'){
  label('ОПУШКА',game.exit.x-28,game.exit.y+64,22);
  label('ПОЛЯНА СТРАЖА',1360,120,24);
  m.fillStyle='#388079';m.font='bold 16px Arial';m.fillText('КОВБОЙ ЖДЁТ',game.exit.x-54,game.exit.y+86);
 }else{
  label('ПОДСТУПЫ',205,265,30);label('ВНЕШНИЙ ДВОР',835,255,28);label('ФОРТ ЖЁЛТОГО ШАРФА',1610,210,25);label('ПУТЬ НАЗАД',120,1190,21);
  m.strokeStyle='#378178';m.lineWidth=4;m.setLineDash([10,8]);m.strokeRect(100,690,125,220);m.setLineDash([]);m.fillStyle='#388079';m.font='bold 18px Arial';m.fillText('ВЫХОД',128,939);
 }
}
buildMap();
function playerKind(){
 const s=game.player.skin;
 if(s==='spirit'||s==='molten'||s==='wood')return s;
 if(s==='mage')return 'hermit';
 return 'warrior';
}
function drawPaper(e,kind,scale=1){
 const r=sprites[kind];if(!r)return;
 const h=(kind==='warrior'?108:94)*scale,w=r.w/r.h*h;
 const bob=e.moving?Math.sin(game.time*15)*2.7:Math.sin(game.time*2)*.6;
 ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle='#2c292926';ctx.beginPath();ctx.ellipse(0,6,w*.34,9*scale,0,0,Math.PI*2);ctx.fill();
 if(e.inv>0&&Math.floor(e.inv*17)%2===0)ctx.globalAlpha=.55;
 const flip=Math.cos(e.angle)<-.1;ctx.translate(0,-h*.43+bob);if(flip)ctx.scale(-1,1);if(e.moving)ctx.rotate(Math.sin(game.time*15)*.028);
 ctx.globalCompositeOperation='multiply';
 if(assetsReady){
  if(kind==='warrior'){
   ctx.save();ctx.beginPath();ctx.moveTo(-w/2,-h/2);ctx.lineTo(-w/2+490/r.w*w,-h/2);ctx.lineTo(-w/2+490/r.w*w,-h/2+375/r.h*h);ctx.lineTo(w/2,-h/2+375/r.h*h);ctx.lineTo(w/2,h/2);ctx.lineTo(-w/2,h/2);ctx.closePath();ctx.clip();
   ctx.drawImage(atlas,r.x,r.y,r.w,r.h,-w/2,-h/2,w,h);ctx.restore();
  }else ctx.drawImage(atlas,r.x,r.y,r.w,r.h,-w/2,-h/2,w,h);
 }
 ctx.restore();
}
function drawStick(e,kind,scale=1){
 const img=stickArt[kind];if(!img||!img.complete||!img.naturalWidth)return;
 const h=(kind==='beast'?92:kind==='warden'?132:108)*scale,w=img.naturalWidth/img.naturalHeight*h;
 const bob=e.moving?Math.sin(game.time*15)*2.7:Math.sin(game.time*2)*.6;
 ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle='#2c292926';ctx.beginPath();ctx.ellipse(0,6,w*.28,9*scale,0,0,Math.PI*2);ctx.fill();
 if(e.inv>0&&Math.floor(e.inv*17)%2===0)ctx.globalAlpha=.55;
 const flip=Math.cos(e.angle)<-.1;ctx.translate(0,-h*.42+bob);if(flip)ctx.scale(-1,1);if(e.moving)ctx.rotate(Math.sin(game.time*14)*.03);
 ctx.globalCompositeOperation='multiply';
 ctx.drawImage(img,-w/2,-h/2,w,h);
 ctx.restore();
}
function drawActor(e,kind,scale=1){
 if(kind==='hermit'||kind==='spirit'||kind==='molten'||kind==='wood'||kind==='beast'||kind==='warden')drawStick(e,kind,scale);
 else drawPaper(e,kind,scale);
 if(kind==='warden')return;
 if(e.hp<e.maxHp&&e.hp>0){
  ctx.fillStyle='#34353844';ctx.fillRect(e.x-23,e.y-113*scale,46,5);
  ctx.fillStyle=kind==='cowboy'?'#2d8a9d':kind==='beast'?'#6b1d1d':'#b62e34';
  ctx.fillRect(e.x-23,e.y-113*scale,46*e.hp/e.maxHp,5);
 }
}
function marker(x,y,color,label){ctx.save();ctx.translate(x,y);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash([5,7]);ctx.beginPath();ctx.ellipse(0,0,48,22,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=color;ctx.font='bold 13px Arial';ctx.textAlign='center';ctx.fillText(label,0,40);ctx.restore();}
function arrowTo(target,label,color){const sx=(target.x-camera.x)*zoom,sy=(target.y-camera.y-50)*zoom;if(sx>65&&sx<width-65&&sy>145&&sy<height-100)return;const cx=width/2,cy=height/2,a=Math.atan2(sy-cy,sx-cx),rx=width/2-65,ry=height/2-125,t=Math.min(rx/Math.max(.001,Math.abs(Math.cos(a))),Math.max(45,ry)/Math.max(.001,Math.abs(Math.sin(a)))),x=cx+Math.cos(a)*t,y=cy+Math.sin(a)*t;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-9,-10);ctx.lineTo(-5,0);ctx.lineTo(-9,10);ctx.closePath();ctx.fill();ctx.restore();ctx.fillStyle='#312f2d';ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.fillText(label,x,y+26);}
function drawFog(){
 if(game.mission!=='maze'&&game.mission!=='forest')return;
 ctx.fillStyle=game.mission==='forest'?'#0c1610':'#140f0c';
 ctx.fillRect(0,0,WORLD.w,WORLD.h);
 const step=48;
 for(const key of game.seen){
  const [gx,gy]=key.split(',').map(Number);
  const x=gx*step,y=gy*step;
  ctx.drawImage(map,x,y,step+1,step+1,x,y,step+1,step+1);
 }
}
function minimap(){
 if(width<760)return;
 const w=155,h=96,x=width-w-24,y=height-h-80;
 ctx.fillStyle='#f4ecdddb';roundRect(ctx,x-5,y-5,w+10,h+10);ctx.fill();ctx.strokeStyle='#8c7d6255';ctx.stroke();
 const sx=w/WORLD.w,sy=h/WORLD.h;
 ctx.fillStyle='#82776390';
 for(const r of WALLS){
  if((game.mission==='maze'||game.mission==='forest')&&!game.isSeen(r.x+r.w/2,r.y+r.h/2))continue;
  ctx.fillRect(x+r.x*sx,y+r.y*sy,Math.max(2,r.w*sx),Math.max(2,r.h*sy));
 }
 function dot(e,c,s=3){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x+e.x*sx,y+e.y*sy,s,0,Math.PI*2);ctx.fill();}
 if(game.mission==='maze'){
  dot(game.player,'#bf3138',4);
  if(game.foundHermit||game.isSeen(game.hermit.x,game.hermit.y))dot(game.hermit,'#6b4ea1',4);
 }else if(game.mission==='forest'){
  dot(game.player,'#bf3138',4);
  const warden=game.enemies.find(e=>e.type==='warden'&&e.hp>0);
  if(warden&&game.isSeen(warden.x,warden.y))dot(warden,'#2f5a32',5);
 }else{
  dot(game.exit,'#398a80',4);dot(game.ally,'#348fa3');dot(game.player,'#bf3138',4);
 }
 ctx.strokeStyle='#ac3037';ctx.strokeRect(x+camera.x*sx,y+camera.y*sy,Math.min(w,width/zoom*sx),Math.min(h,height/zoom*sy));
}
function draw(){
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);ctx.fillStyle='#e7ddc8';ctx.fillRect(0,0,width,height);
 const focus=game.state==='ready'?{x:WORLD.w*0.45,y:WORLD.h*0.48}:game.player;
 const tx=Math.max(0,Math.min(WORLD.w-width/zoom,focus.x-width/zoom*.47));
 const ty=Math.max(0,Math.min(WORLD.h-height/zoom,focus.y-height/zoom*.56));
 camera.x+=(tx-camera.x)*.12;camera.y+=(ty-camera.y)*.12;
 ctx.save();ctx.scale(zoom,zoom);ctx.translate(-camera.x,-camera.y);ctx.drawImage(map,0,0);drawFog();
 for(const item of game.pickups){
  if(item.used||((game.mission==='maze'||game.mission==='forest')&&!game.isSeen(item.x,item.y)))continue;
  ctx.save();ctx.translate(item.x,item.y);ctx.fillStyle='#fcf7e8';ctx.strokeStyle='#6d7863';ctx.lineWidth=2;roundRect(ctx,-17,-13,34,27,4);ctx.fill();ctx.stroke();ctx.fillStyle='#ae3c40';ctx.fillRect(-3,-9,6,18);ctx.fillRect(-10,-3,20,6);ctx.restore();
 }
 for(const relic of game.relics){
  if(relic.used||!game.isSeen(relic.x,relic.y))continue;
  ctx.save();ctx.translate(relic.x,relic.y);ctx.rotate(game.time);ctx.fillStyle=relic.id==='ember'?'#d27a22':'#4f7a3a';ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(10,0);ctx.lineTo(0,13);ctx.lineTo(-10,0);ctx.closePath();ctx.fill();ctx.restore();
 }
 for(const h of game.hazards||[]){
  if(game.mission==='forest'&&!game.isSeen(h.x,h.y))continue;
  ctx.save();ctx.translate(h.x,h.y);
  ctx.strokeStyle=h.armed?'#3d7a3acc':'#6db36a99';
  ctx.fillStyle=h.armed?'#2f6b2a55':'#5aa45a33';
  ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,h.r,h.r*.7,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.restore();
 }
 if(game.mission==='maze'){
  if(!game.foundHermit&&game.isSeen(game.hermit.x,game.hermit.y))marker(game.hermit.x,game.hermit.y,'#6b4ea1','ХРАНИТЕЛЬ');
  if(game.isSeen(game.ally.x,game.ally.y)||dist(game.player,game.ally)<220)marker(game.ally.x,game.ally.y,'#2c7f92','ЖДЁТ ЗДЕСЬ');
 }else if(game.mission==='forest'){
  const warden=game.enemies.find(e=>e.type==='warden'&&e.hp>0);
  if(warden&&game.isSeen(warden.x,warden.y))marker(warden.x,warden.y,'#2f5a32',warden.open>0?'БЕЙ СЕЙЧАС':'СТРАЖ ЛЕСА');
  if(game.isSeen(game.ally.x,game.ally.y)||dist(game.player,game.ally)<220)marker(game.ally.x,game.ally.y,'#2c7f92','ЖДЁТ ЗДЕСЬ');
 }else if(!game.rescued){
  marker(game.ally.x,game.ally.y,'#2c7f92','НАПАРНИК');
  ctx.strokeStyle='#645b4ca0';ctx.lineWidth=3;
  for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(2020+i*40,335);ctx.lineTo(2020+i*40,565);ctx.stroke();}
 }else marker(game.exit.x,game.exit.y,'#3b8774','СЮДА, ВМЕСТЕ!');
 const entities=[
  ...game.enemies.filter(e=>e.hp>0).map(e=>({e,kind:e.type==='beast'?'beast':e.type==='warden'?'warden':'bandit'})),
  {e:game.ally,kind:'cowboy'},
  ...(game.mission==='maze'?[{e:game.hermit,kind:'hermit'}]:[]),
  {e:game.player,kind:playerKind()}
 ].sort((a,b)=>a.e.y-b.e.y);
 for(const{e,kind} of entities){
  if(e.x<camera.x-100||e.x>camera.x+width/zoom+100||e.y<camera.y-100||e.y>camera.y+height/zoom+120)continue;
  if((game.mission==='maze'||game.mission==='forest')&&kind!=='warrior'&&kind!==playerKind()&&!game.isSeen(e.x,e.y)&&kind!=='cowboy')continue;
  if(e.type&&e.wind>0){
   ctx.strokeStyle='#b62e3455';ctx.setLineDash([6,8]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(e.x,e.y-10);ctx.lineTo(e.x+Math.cos(e.angle)*250,e.y+Math.sin(e.angle)*250-10);ctx.stroke();ctx.setLineDash([]);
   ctx.fillStyle='#bc3137';ctx.font='bold 24px Arial';ctx.textAlign='center';ctx.fillText('!',e.x,e.y-105);
  }
  const scale=e.type==='warden'?1.38:e.type==='boss'?1.22:e.type==='beast'?1.08:e.type==='melee'?.9:kind==='hermit'?1.12:1;
  drawActor(e,kind,scale);
  if(e.type==='boss'){ctx.fillStyle='#463d2c';ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.fillText('ЖЁЛТЫЙ ШАРФ',e.x,e.y-151);}
  if(e.type==='beast'){ctx.fillStyle='#5a1d1d';ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillText('ТВАРЬ',e.x,e.y-122);}
  if(e.type==='warden'){ctx.fillStyle='#1f3d24';ctx.font='bold 13px Arial';ctx.textAlign='center';ctx.fillText(e.bundleBroken?'СТРАЖ · ЯРОСТЬ':'СТРАЖ ЛЕСА',e.x,e.y-168);}
 }
 const p=game.player;
 if(p.shield){ctx.save();ctx.translate(p.x,p.y-15);ctx.strokeStyle=p.skin==='spirit'?'#b38cff':'#e7bc4e';ctx.lineWidth=7;ctx.shadowColor=p.skin==='spirit'?'#9b6dff':'#efc865';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(0,0,44,p.angle-1.2,p.angle+1.2);ctx.stroke();ctx.restore();}
 for(const b of game.bullets){
  if(b.kind==='log'){
   ctx.save();ctx.translate(b.x,b.y-12);ctx.rotate(Math.atan2(b.dy,b.dx));
   ctx.fillStyle='#6b4423';ctx.fillRect(-14,-5,28,10);ctx.restore();
  }else{
   ctx.strokeStyle=b.friendly?'#2d92ad':'#ba6932';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(b.x-b.dx*15,b.y-b.dy*15-15);ctx.lineTo(b.x,b.y-15);ctx.stroke();
  }
 }
 for(const f of game.effects){
  ctx.save();ctx.globalAlpha=f.t/f.max;
  if(f.swing){ctx.strokeStyle='#a52c35';ctx.lineWidth=4;ctx.beginPath();ctx.arc(f.x,f.y-20,f.range?Math.min(90,f.range*.7):80,f.angle-.9,f.angle+.9);ctx.stroke();}
  else if(f.flash){ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(f.x,f.y,8,0,Math.PI*2);ctx.fill();}
  else{ctx.fillStyle=f.color;ctx.strokeStyle='#fff5df';ctx.lineWidth=3;ctx.font='bold 18px Arial';ctx.textAlign='center';const y=f.y-(1-f.t/f.max)*30;ctx.strokeText(f.text,f.x,y);ctx.fillText(f.text,f.x,y);}
  ctx.restore();
 }
 ctx.restore();
 if(game.state==='playing'){
  if(game.mission==='maze')arrowTo(game.hermit,'ХРАНИТЕЛЬ','#6b4ea1');
  else if(game.mission==='forest'){
   const warden=game.enemies.find(e=>e.type==='warden'&&e.hp>0);
   if(warden)arrowTo(warden,warden.open>0?'БЕЙ':'СТРАЖ',warden.open>0?'#b62e34':'#2f5a32');
  }else arrowTo(game.rescued?game.exit:game.ally,game.rescued?'К ВОРОТАМ':'КОВБОЙ',game.rescued?'#397e6c':'#b62e34');
  minimap();
  if(game.player.hp<30){const grad=ctx.createRadialGradient(width/2,height/2,height*.25,width/2,height/2,Math.max(width,height)*.65);grad.addColorStop(0,'#a9232700');grad.addColorStop(1,'#a9232735');ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);}
 }
}
function showHomeButtons(win){
 $('play').hidden=false;
 $('maze').hidden=false;
 $('forest').hidden=false;
 $('wardrobeBtn').hidden=false;
 $('play').textContent=game.mission==='fort'?(win?'СЫГРАТЬ ЕЩЁ':'ПОПРОБОВАТЬ СНОВА'):'В ФОРТ';
 $('maze').textContent=game.mission==='maze'?(win?'ЛАБИРИНТ СНОВА':'СНОВА В КОРИДОРЫ'):'В ЛАБИРИНТ';
 $('forest').textContent=game.mission==='forest'?(win?'ЛЕС СНОВА':'СНОВА К СТРАЖУ'):'В ТЁМНЫЙ ЛЕС';
 $('restart').hidden=true;
}
function endScreen(){
 const win=game.state==='won';
 clearInput();
 $('overlay').className='overlay end';
 $('cast').hidden=true;
 $('skinPick').hidden=true;
 $('toast').classList.remove('show');
 $('toast').textContent='';
 if(game.mission==='maze'){
  const skin=SKINS[game.chosenSkin];
  $('menuTitle').innerHTML=win?'ДАР<br><em>ПРИНЯТ</em>':'ЕЩЁ<br><em>ПОПЫТКА?</em>';
  $('menuSub').textContent=win?'ХРАНИТЕЛЬ ДОВОЛЕН':'ЛАБИРИНТ НЕ ПРОЩАЕТ';
  $('menuCopy').textContent=win?(skin?`Ты стал: ${skin.name}. ${skin.hint}`:'Ты нашёл Хранителя.'):game.reason;
  $('stampNum').textContent='02';
  $('stampPlace').textContent='ЛАБИРИНТ';
 }else if(game.mission==='forest'){
  if(win)unlockRelic('bark');
  $('menuTitle').innerHTML=win?'ЛЕС<br><em>ВЫДОХНУЛ</em>':'ЕЩЁ<br><em>ПОПЫТКА?</em>';
  $('menuSub').textContent=win?'СТРАЖ ПОВЕРЖЕН':'СТРАЖ СИЛЬНЕЕ';
  $('menuCopy').textContent=win?'Вязанка падает. Кора Стража лежит в гардеробе.':'Страж сломал тебя. Щит ловит брёвна, удар — когда вязанка открылась.';
  $('stampNum').textContent='03';
  $('stampPlace').textContent='ЛЕС';
 }else{
  $('menuTitle').innerHTML=win?'СВОИХ<br><em>НЕ БРОСАЕМ</em>':'ЕЩЁ<br><em>ПОПЫТКА?</em>';
  $('menuSub').textContent=win?'МИССИЯ ВЫПОЛНЕНА':'МИССИЯ НЕ ЗАВЕРШЕНА';
  $('menuCopy').textContent=win?'Вы оба добрались до ворот. Дальше — лабиринт Хранителя.':game.reason;
  $('stampNum').textContent='01';
  $('stampPlace').textContent='ФОРТ';
 }
 $('results').hidden=false;
 const secretBit=game.mission==='maze'?`<div><b>${game.secrets}/2</b><span>тайны</span></div>`:'';
 $('results').innerHTML=`<div><b>${formatTime(game.time)}</b><span>время</span></div><div><b>${game.kills}</b><span>побеждено</span></div><div><b>${game.blocks}</b><span>блоков щитом</span></div>${secretBit}`;
 showHomeButtons(win);
 $('menuFoot').textContent=win?(game.mission==='maze'?'Облик лежит в гардеробе. Можешь надеть его перед новой миссией.':game.mission==='forest'?'Перед новым лесом снова выбери облик в гардеробе.':'Ты прикрывал. Он доверял. Вы справились.'):'Укрытие, щит, удар. И ещё один шанс.';
 refreshOwned();
 setPlayingUI();
 tone(win?660:140,.3,'triangle');
 syncMusic();
}
function updateHUD(){
 const p=game.player;
 $('hpText').textContent=Math.round(p.hp);
 $('hpBar').style.width=p.hp+'%';
 $('energyBar').style.width=p.energy+'%';
 $('allyBar').style.width=game.ally.hp+'%';
 $('allyText').textContent=Math.round(game.ally.hp);
 $('clock').textContent=formatTime(game.time);
 $('secretHud').textContent='тайны '+game.secrets+'/2';
 $('secretHud').hidden=game.mission!=='maze'||game.state!=='playing';
 const warden=game.enemies.find(e=>e.type==='warden'&&e.hp>0);
 const showBoss=game.mission==='forest'&&game.state==='playing'&&warden&&(warden.active||dist(p,warden)<420);
 $('bossHud').hidden=!showBoss;
 if(showBoss){
  $('bossText').textContent=Math.round(warden.hp);
  $('bossBar').style.width=(warden.hp/warden.maxHp*100)+'%';
  $('bossHint').textContent=warden.open>0?'Бей сейчас — броня открылась!':warden.bundleBroken?'Ярость: все удары проходят.':'Жди удара, потом бей.';
 }
 if(game.mission==='maze'){
  $('chapter').textContent='03 / ЛАБИРИНТ';
  $('goal').textContent=game.foundHermit?'Выбери облик':'Найди Хранителя в лабиринте';
  $('allyHud').hidden=true;
  const near=dist(p,game.hermit)<=125&&!game.foundHermit;
  $('interact').hidden=!near||game.state!=='playing';
  $('interact').innerHTML='Говорить с Хранителем <kbd>E</kbd>';
 }else if(game.mission==='forest'){
  $('chapter').textContent='04 / ТЁМНЫЙ ЛЕС';
  $('goal').textContent=warden?(warden.open>0?'Бей Стража сейчас!':'Победи Стража леса'):'Страж пал';
  $('allyHud').hidden=true;
  $('interact').hidden=true;
  document.querySelector('.help-note').textContent='Щит ловит брёвна. Бей, когда вязанка открылась';
 }else{
  $('chapter').textContent=game.rescued?'02 / ВОЗВРАЩЕНИЕ':'01 / ПРОНИКНОВЕНИЕ';
  $('goal').textContent=game.rescued?'Вернитесь к воротам вместе':'Освободи ковбоя в форте';
  $('allyHud').hidden=!game.rescued||game.state!=='playing';
  $('interact').hidden=game.rescued||game.state!=='playing'||dist(p,game.ally)>115;
  $('interact').innerHTML='Освободить ковбоя <kbd>E</kbd>';
  document.querySelector('.help-note').textContent='Щит прикрывает только спереди';
 }
}
function loop(t){
 const dt=Math.min((t-last)/1000,.05)||0;last=t;
 input.x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joy.x;
 input.y=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+joy.y;
 input.attack=mouseDown||keys.has('KeyF')||touchAttack;
 input.shield=keys.has('Space')||touchShield;
 game.update(dt,input);
 if(game.state==='playing'||game.state==='choosing'){
  if(game.player.swing>lastAttack)tone(190,.065,'sawtooth',.025);
  lastAttack=game.player.swing;
  if(game.blocks>prevBlocks)tone(850,.075,'square',.025);
  if(game.kills>prevKills)tone(360,.11);
  if(game.secrets>prevSecrets){
   tone(740,.18,'triangle',.04);
   for(const relic of game.relics)if(relic.used)unlockRelic(relic.id);
  }
  if(game.player.hp<prevHp){tone(85,.15,'sawtooth',.055);syncMusic();}
  prevBlocks=game.blocks;prevKills=game.kills;prevHp=game.player.hp;prevSecrets=game.secrets;
  while(game.events.length)showToast(game.events.shift());
  if(t>toastUntil)$('toast').classList.remove('show');
  if(frame%5===0)updateHUD();
  if(frame%4===0)syncMusic();
 }
 if(game.state!==previousState){
  if(game.state==='choosing'){clearInput();setPlayingUI();unlockMage();refreshOwned();syncMusic();tone(420,.2);}
  if(game.state==='won'||game.state==='lost')endScreen();
 }
 previousState=game.state;draw();music.tick();frame++;requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
window.redShield={
 status:()=>game.snapshot(),
 wardrobe:()=>loadWardrobe(),
 audio:()=>({on:soundOn,ctx:audio?audio.state:'none',time:audio?Math.round(audio.currentTime*10)/10:0}),
 __test:{
  gotoHermit(){
   if(game.mission!=='maze'||game.state!=='playing')return false;
   game.player.x=game.hermit.x;
   game.player.y=game.hermit.y;
   game.player.hp=100;
   game.markSeen(true);
   return game.talkHermit();
  },
  collectRelic(){
   if(game.mission!=='maze'||game.state!=='playing')return null;
   const next=game.relics.find(r=>!r.used);
   if(!next)return null;
   game.player.x=next.x;
   game.player.y=next.y;
   game.markSeen(true);
   return next.id;
  },
  gotoWarden(){
   if(game.mission!=='forest'||game.state!=='playing')return false;
   const warden=game.enemies.find(e=>e.type==='warden'&&e.hp>0);
   if(!warden)return false;
   game.player.x=warden.x-110;
   game.player.y=warden.y;
   game.player.hp=100;
   game.player.energy=100;
   warden.active=true;
   game.markSeen(true);
   return true;
  },
  openWarden(){
   const warden=game.enemies.find(e=>e.type==='warden'&&e.hp>0);
   if(!warden)return false;
   warden.open=3;
   warden.wind=0;
   warden.smashIn=0;
   warden.chargeT=0;
   warden.cd=2;
   warden.move='recover';
   return true;
  },
  defeatWarden(){
   if(game.mission!=='forest'||game.state!=='playing')return false;
   const warden=game.enemies.find(e=>e.type==='warden'&&e.hp>0);
   if(!warden)return false;
   warden.bundleBroken=true;
   warden.open=3;
   warden.hp=1;
   game.hit(warden,999,game.player);
   return game.state==='won';
  }
 }
};
if(document.modelContext?.registerTool){try{void Promise.resolve(document.modelContext.registerTool({name:'mission_status',description:'Read the current Red Shield mission status, health and objective.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:async(input)=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Параметры не требуются');return game.snapshot();}})).catch(()=>{});}catch{}}
