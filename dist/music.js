export function createAtmosphere(){
 let ctx=null,master=null,comp=null,filter=null,drones=null,heart=null,heartGain=null,whisper=null,whisperGain=null;
 let pianoGain=null,horrorGain=null,noiseBuf=null;
 let enabled=true,ready=false;
 let nextBeat=0,beatGap=1.15,heartAmt=0.04;
 let nextNote=0,noteAt=0,phrase=0,mode='explore';
 let nextChord=0,chordAt=0,place='fort',assault=0,lastAssault=0;

 const EXPLORE=[
  [146.83,.55],[0,.85],[220,.95],[0,1.15],[174.61,.7],[164.81,1.25],[0,1.9],
  [196,.45],[146.83,1.05],[0,.75],[233.08,.65],[220,1.35],[0,2.1],
  [293.66,.28],[0,2.4],[174.61,.4],[196,.9],[0,1.6]
 ];
 const HALL=[
  [146.83,.4],[0,1],[207.65,.85],[164.81,.5],[0,1.45],
  [174.61,.4],[246.94,.95],[0,1.5],[138.59,.7],[0,.55],[220,1.15],[0,1.9],
  [311.13,.22],[0,2.2],[155.56,.8],[0,1.3]
 ];
 const RITE=[
  [174.61,.8],[196,.8],[220,1.1],[0,.7],[246.94,.6],[220,1.4],[0,1.2]
 ];
 const WIN=[
  [146.83,.5],[185,.5],[220,.9],[293.66,1.2],[0,1.4]
 ];
 const STAB=[
  [146.83,.11],[207.65,.11],[311.13,.16],[0,.12],[155.56,.1],[0,.2]
 ];
 const FORT_CHORDS=[[73.4,110],[98,146.8],[87.3,116.5],[82.4,123.47]];
 const MAZE_CHORDS=[[55,77.8],[58.27,87.3],[61.74,92.5],[51.91,73.4]];

 function ramp(param,value,sec=.9){
  if(!ctx||!param)return;
  const now=ctx.currentTime;
  const from=Number.isFinite(param.value)?param.value:0.0001;
  param.cancelScheduledValues(now);
  param.setValueAtTime(Math.max(0.0001,from),now);
  param.linearRampToValueAtTime(Math.max(0.0001,value),now+sec);
 }

 function attach(audioCtx){
  if(ready||!audioCtx)return;
  ctx=audioCtx;
  master=ctx.createGain();
  master.gain.value=0.0001;
  comp=ctx.createDynamicsCompressor();
  comp.threshold.value=-16;
  comp.knee.value=12;
  comp.ratio.value=5;
  comp.attack.value=.01;
  comp.release.value=.25;
  master.connect(comp);
  comp.connect(ctx.destination);

  filter=ctx.createBiquadFilter();
  filter.type='lowpass';
  filter.frequency.value=360;
  filter.Q.value=.8;
  filter.connect(master);

  const sway=ctx.createOscillator();
  const swayAmt=ctx.createGain();
  sway.type='sine';
  sway.frequency.value=.05;
  swayAmt.gain.value=55;
  sway.connect(swayAmt);
  swayAmt.connect(filter.frequency);
  sway.start();

  function makeDrone(freq,type,vol){
   const o=ctx.createOscillator();
   const g=ctx.createGain();
   o.type=type;
   o.frequency.value=freq;
   g.gain.value=vol;
   o.connect(g);
   g.connect(filter);
   o.start();
   return {o,g};
  }
  drones={
   root:makeDrone(73.4,'triangle',.16),
   fifth:makeDrone(110,'sine',.1),
   grit:makeDrone(73.1,'sawtooth',.03),
   sub:makeDrone(36.7,'sine',.24)
  };

  heart=ctx.createOscillator();
  heart.type='sine';
  heart.frequency.value=48;
  heartGain=ctx.createGain();
  heartGain.gain.value=0.0001;
  heart.connect(heartGain);
  heartGain.connect(master);
  heart.start();

  whisper=ctx.createOscillator();
  whisper.type='sine';
  whisper.frequency.value=622.3;
  whisperGain=ctx.createGain();
  whisperGain.gain.value=0.0001;
  whisper.connect(whisperGain);
  whisperGain.connect(filter);
  whisper.start();

  pianoGain=ctx.createGain();
  pianoGain.gain.value=.12;
  pianoGain.connect(master);

  horrorGain=ctx.createGain();
  horrorGain.gain.value=0.0001;
  horrorGain.connect(master);

  noiseBuf=ctx.createBuffer(1,Math.floor(ctx.sampleRate*1.1),ctx.sampleRate);
  const data=noiseBuf.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,1.35);

  ready=true;
 }

 function pluck(freq,dur,vol){
  if(!ctx||!enabled||freq<=0)return;
  const now=ctx.currentTime;
  const o=ctx.createOscillator();
  const o2=ctx.createOscillator();
  const g=ctx.createGain();
  o.type='triangle';
  o2.type='sine';
  o.frequency.value=freq;
  o2.frequency.value=freq*2;
  g.gain.setValueAtTime(vol,now);
  g.gain.exponentialRampToValueAtTime(0.0001,now+dur);
  o.connect(g);
  o2.connect(g);
  g.connect(pianoGain);
  o.start(now);o2.start(now);
  o.stop(now+dur+.05);o2.stop(now+dur+.05);
 }

 function thud(){
  if(!ctx||!enabled)return;
  const now=ctx.currentTime;
  const g=heartGain.gain;
  const peak=Math.max(0.012,heartAmt);
  g.cancelScheduledValues(now);
  g.setValueAtTime(0.0001,now);
  g.linearRampToValueAtTime(peak,now+.04);
  g.linearRampToValueAtTime(0.0001,now+.16);
  g.linearRampToValueAtTime(peak*.4,now+.28);
  g.linearRampToValueAtTime(0.0001,now+.44);
 }

 function stinger(){
  if(!ctx||!enabled)return;
  const now=ctx.currentTime;
  const src=ctx.createBufferSource();
  const ng=ctx.createGain();
  src.buffer=noiseBuf;
  ng.gain.setValueAtTime(.9,now);
  ng.gain.exponentialRampToValueAtTime(0.0001,now+.55);
  src.connect(ng);
  ng.connect(horrorGain);
  src.start(now);
  for(const f of [51.9,55,77.8,92.5,311.13,466.16]){
   const o=ctx.createOscillator();
   const g=ctx.createGain();
   o.type=f>200?'square':'sawtooth';
   o.frequency.setValueAtTime(f,now);
   o.frequency.exponentialRampToValueAtTime(f*.72,now+.4);
   g.gain.setValueAtTime(.22,now);
   g.gain.exponentialRampToValueAtTime(0.0001,now+.5);
   o.connect(g);g.connect(horrorGain);
   o.start(now);o.stop(now+.55);
  }
  heartAmt=.12;
  beatGap=.42;
  thud();
 }

 function pattern(){
  if(mode==='stab')return STAB;
  if(mode==='rite')return RITE;
  if(mode==='win')return WIN;
  return place==='maze'?HALL:EXPLORE;
 }

 function setEnabled(on){
  enabled=!!on;
  if(!ready)return;
  ramp(master.gain,enabled?0.1:0.0001,.25);
  if(!enabled)ramp(horrorGain.gain,0.0001,.1);
 }

 function setMood(mood){
  if(!ready)return;
  place=mood.place||'fort';
  const beat=mood.beat||'ready';
  const danger=Math.max(0,Math.min(1,mood.danger||0));
  const hurt=!!mood.hurt;
  assault=Math.max(0,Math.min(1,mood.assault||0));
  const maze=place==='maze';
  let vol=0.0001,root=73.4,fifth=110,grit=.025,cut=340,whisperLvl=.0016,heartVol=.028,gap=1.2,piano=.11;
  mode='explore';

  if(beat==='playing'){
   vol=maze?0.1:0.082;
   root=maze?55:73.4;
   fifth=maze?77.8:110;
   grit=maze?.05:.028;
   cut=(maze?250:380)+danger*90+(hurt?50:0);
   whisperLvl=maze?0.0038:0.0018;
   heartVol=(maze?0.04:0.03)+danger*.03+(hurt?0.02:0);
   gap=Math.max(.7,(maze?1.35:1.12)-danger*.3-(hurt?.18:0));
   piano=maze?.13:.12;
   mode='explore';
   if(assault>=.75){
    vol=.28;
    grit=.14;
    cut=900;
    whisperLvl=.012;
    heartVol=.14;
    gap=.4;
    piano=.2;
    mode='stab';
    ramp(horrorGain.gain,.85,.08);
   }else{
    ramp(horrorGain.gain,0.0001,1.1);
   }
  }else if(beat==='choosing'){
   vol=0.09;root=65.41;fifth=98;grit=.015;cut=620;whisperLvl=.005;heartVol=.01;gap=1.8;piano=.16;mode='rite';
   ramp(horrorGain.gain,0.0001,.4);
  }else if(beat==='paused'){
   vol=0.03;root=maze?55:73.4;fifth=maze?82:110;grit=.015;cut=200;whisperLvl=.0008;heartVol=.008;gap=2;piano=.05;mode='explore';
   ramp(horrorGain.gain,0.0001,.3);
  }else if(beat==='won'){
   vol=0.08;root=73.4;fifth=110;grit=.008;cut=880;whisperLvl=.002;heartVol=0;gap=99;piano=.14;mode='win';
   ramp(horrorGain.gain,0.0001,.3);
  }else if(beat==='lost'){
   vol=0.05;root=49;fifth=58.27;grit=.09;cut=130;whisperLvl=.001;heartVol=.018;gap=1.9;piano=.04;mode='explore';
   ramp(horrorGain.gain,.2,.2);
  }

  if(!enabled)vol=0.0001;
  if(assault>=.75&&lastAssault<.75)stinger();
  lastAssault=assault;
  ramp(master.gain,vol,assault>=.75?.12:.7);
  ramp(drones.root.o.frequency,root,1.2);
  ramp(drones.fifth.o.frequency,fifth,1.2);
  ramp(drones.grit.o.frequency,root*.996,1.2);
  ramp(drones.sub.o.frequency,root*.5,1.2);
  ramp(drones.grit.g.gain,grit,.6);
  ramp(filter.frequency,cut,assault>=.75?.15:.8);
  ramp(whisperGain.gain,whisperLvl,.6);
  ramp(whisper.frequency,maze?554.4:622.3,2);
  ramp(pianoGain.gain,piano,.4);
  heartAmt=heartVol;
  beatGap=gap;
 }

 function tick(){
  if(!ready||!enabled||!ctx)return;
  const now=ctx.currentTime;
  if(heartAmt>0.011&&now>=nextBeat){
   thud();
   nextBeat=now+beatGap;
  }
  if(now>=nextChord&&mode!=='stab'&&(mode==='explore'||mode==='rite')){
   const list=place==='maze'?MAZE_CHORDS:FORT_CHORDS;
   chordAt=(chordAt+1)%list.length;
   const [r,f]=list[chordAt];
   ramp(drones.root.o.frequency,r,2.2);
   ramp(drones.fifth.o.frequency,f,2.2);
   ramp(drones.sub.o.frequency,r*.5,2.2);
   nextChord=now+7.5+(place==='maze'?2:0);
  }
  if(now>=nextNote){
   const seq=pattern();
   const [freq,hold]=seq[noteAt%seq.length];
   noteAt++;
   if(freq>0)pluck(freq,mode==='stab'?hold+.08:hold+.35,mode==='stab'?.18:.09);
   nextNote=now+hold;
  }
 }

 return {attach,setEnabled,setMood,tick,ready:()=>ready};
}
