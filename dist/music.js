export function createAtmosphere(){
 let ctx=null,master=null,filter=null,drones=null,heart=null,heartGain=null,whisper=null,whisperGain=null;
 let enabled=true,nextBeat=0,beatGap=1.15,heartAmt=0.04,ready=false;

 function ramp(param,value,sec=.9){
  if(!ctx||!param)return;
  const now=ctx.currentTime;
  const from=param.value||0.0001;
  param.cancelScheduledValues(now);
  param.setValueAtTime(Math.max(0.0001,from),now);
  param.linearRampToValueAtTime(Math.max(0.0001,value),now+sec);
 }

 function attach(audioCtx){
  if(ready||!audioCtx)return;
  ctx=audioCtx;
  master=ctx.createGain();
  master.gain.value=0.0001;
  master.connect(ctx.destination);

  filter=ctx.createBiquadFilter();
  filter.type='lowpass';
  filter.frequency.value=360;
  filter.Q.value=.85;
  filter.connect(master);

  const sway=ctx.createOscillator();
  const swayAmt=ctx.createGain();
  sway.type='sine';
  sway.frequency.value=.06;
  swayAmt.gain.value=70;
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
   root:makeDrone(73.4,'triangle',.2),
   fifth:makeDrone(110,'sine',.12),
   grit:makeDrone(73.1,'sawtooth',.045),
   sub:makeDrone(36.7,'sine',.28)
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
  ready=true;
 }

 function thud(){
  if(!ctx||!enabled)return;
  const now=ctx.currentTime;
  const g=heartGain.gain;
  const peak=Math.max(0.012,heartAmt);
  g.cancelScheduledValues(now);
  g.setValueAtTime(0.0001,now);
  g.linearRampToValueAtTime(peak,now+.045);
  g.linearRampToValueAtTime(0.0001,now+.18);
  g.linearRampToValueAtTime(peak*.42,now+.3);
  g.linearRampToValueAtTime(0.0001,now+.48);
 }

 function setEnabled(on){
  enabled=!!on;
  if(!ready)return;
  ramp(master.gain,enabled?0.09:0.0001,.25);
 }

 function setMood(mood){
  if(!ready)return;
  const place=mood.place||'fort';
  const beat=mood.beat||'ready';
  const danger=Math.max(0,Math.min(1,mood.danger||0));
  const hurt=!!mood.hurt;
  const maze=place==='maze';
  let vol=0.0001,root=73.4,fifth=110,grit=.03,cut=340,whisperLvl=.0018,heartVol=.03,gap=1.18;

  if(beat==='playing'){
   vol=maze?0.11:0.085;
   root=maze?55:73.4;
   fifth=maze?77.8:110;
   grit=maze?.07:.035;
   cut=(maze?240:360)+danger*160+(hurt?80:0);
   whisperLvl=maze?0.0045:0.0022;
   heartVol=(maze?0.05:0.034)+danger*.045+(hurt?0.025:0);
   gap=Math.max(.62,(maze?1.32:1.08)-danger*.45-(hurt?.22:0));
  }else if(beat==='choosing'){
   vol=0.08;root=65.4;fifth=98;grit=.02;cut=520;whisperLvl=.006;heartVol=.012;gap=1.7;
  }else if(beat==='paused'){
   vol=0.035;root=maze?55:73.4;fifth=maze?82:110;grit=.02;cut=220;whisperLvl=.001;heartVol=.01;gap=1.8;
  }else if(beat==='won'){
   vol=0.07;root=87.3;fifth=130.8;grit=.01;cut=720;whisperLvl=.002;heartVol=0;gap=99;
  }else if(beat==='lost'){
   vol=0.045;root=49;fifth=58;grit=.08;cut=140;whisperLvl=.001;heartVol=.02;gap=1.9;
  }

  if(!enabled)vol=0.0001;
  ramp(master.gain,vol,.7);
  ramp(drones.root.o.frequency,root,1.4);
  ramp(drones.fifth.o.frequency,fifth,1.4);
  ramp(drones.grit.o.frequency,root*.997,1.4);
  ramp(drones.sub.o.frequency,root*.5,1.4);
  ramp(drones.grit.g.gain,grit,1);
  ramp(filter.frequency,cut,.8);
  ramp(whisperGain.gain,whisperLvl,.8);
  ramp(whisper.frequency,maze?587:622.3,2);
  heartAmt=heartVol;
  beatGap=gap;
 }

 function tick(){
  if(!ready||!enabled||!ctx)return;
  const now=ctx.currentTime;
  if(heartAmt<=0.011)return;
  if(now>=nextBeat){
   thud();
   nextBeat=now+beatGap;
  }
 }

 return {attach,setEnabled,setMood,tick,ready:()=>ready};
}
