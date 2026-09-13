import {SKINS,RELICS} from './levels.js';

const KEY='redShield.wardrobe';
const OLD_SKIN='redShield.skin';

export const WARDROBE_SKINS=['warrior','mage','spirit','molten','wood'];
export const WARDROBE_RELICS=['ember','vine','bark'];

function empty(){
 return {skins:['warrior'],relics:[],mage:false,equipped:'warrior'};
}

function read(){
 const data=empty();
 try{
  const raw=localStorage.getItem(KEY);
  if(raw){
   const parsed=JSON.parse(raw);
   if(Array.isArray(parsed.skins))data.skins=parsed.skins.filter(id=>SKINS[id]);
   if(Array.isArray(parsed.relics))data.relics=parsed.relics.filter(id=>RELICS[id]);
   data.mage=!!parsed.mage;
   if(parsed.equipped&&SKINS[parsed.equipped])data.equipped=parsed.equipped;
  }
  const legacy=localStorage.getItem(OLD_SKIN);
  if(legacy&&SKINS[legacy]&&legacy!=='warrior'){
   if(!data.skins.includes(legacy))data.skins.push(legacy);
   data.mage=true;
   if(data.equipped==='warrior')data.equipped=legacy;
  }
 }catch{/* private mode */}
 if(!data.skins.includes('warrior'))data.skins.unshift('warrior');
 if(data.mage&&!data.skins.includes('mage'))data.skins.push('mage');
 if(!data.skins.includes(data.equipped))data.equipped='warrior';
 return data;
}

function write(data){
 try{localStorage.setItem(KEY,JSON.stringify(data));}catch{/* ignore */}
}

export function loadWardrobe(){return read();}

export function unlockMage(){
 const data=read();
 data.mage=true;
 if(!data.skins.includes('mage'))data.skins.push('mage');
 write(data);
 return data;
}

export function unlockSkin(id){
 if(!SKINS[id]||id==='warrior')return read();
 const data=read();
 if(!data.skins.includes(id))data.skins.push(id);
 data.equipped=id;
 write(data);
 try{localStorage.setItem(OLD_SKIN,id);}catch{/* ignore */}
 return data;
}

export function unlockRelic(id){
 if(!RELICS[id])return read();
 const data=read();
 if(!data.relics.includes(id))data.relics.push(id);
 write(data);
 return data;
}

export function equipSkin(id){
 const data=read();
 if(!data.skins.includes(id)||!SKINS[id])return data;
 data.equipped=id;
 write(data);
 try{localStorage.setItem(OLD_SKIN,id==='warrior'?'':id);}catch{/* ignore */}
 return data;
}

export function skinMeta(id){
 const base=SKINS[id];
 if(!base)return null;
 const img=id==='mage'?'assets/hermit.png':id==='warrior'?'assets/characters.png':`assets/skin-${id}.png`;
 return {...base,img,sprite:id==='mage'?'hermit':id};
}

export function relicMeta(id){
 const base=RELICS[id];
 if(!base)return null;
 const hint=id==='ember'?'Удары становятся тяжелее.':id==='vine'?'Копьё достаёт дальше.':'После боя со Стражем. Раны чуть быстрее заживают.';
 const locked=id==='bark'?'Победи Стража леса.':'Спрятана ближе к центру.';
 return {...base,hint,locked};
}
