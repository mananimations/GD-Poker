const API="https://api.aredl.net/v2/api/aredl/levels";
const TIERS=[
 {n:"Common",r:"1000+",c:"#9aa0a6",m:1},{n:"Uncommon",r:"750–999",c:"#4ade80",m:1.5},{n:"Rare",r:"500–749",c:"#38bdf8",m:2},
 {n:"Epic",r:"300–499",c:"#a855f7",m:3},{n:"Legendary",r:"100–299",c:"#fb923c",m:5},{n:"Mythic",r:"20–99",c:"#ef4444",m:8},
 {n:"Ethereal",r:"2–19",c:"#67e8f9",m:12},{n:"Apex",r:"#1 only",c:"#ffd23f",m:25}];
const tierOf=p=>p<=1?7:p<20?6:p<100?5:p<300?4:p<500?3:p<750?2:p<1000?1:0;
const HANDS={"5":["Five of a Kind",30,5],"41":["Four of a Kind",15,4],"32":["Full House",8,3],"311":["Three of a Kind",5,2],"221":["Two Pair",3,1],"2111":["Pair",2,0],"11111":["High Rarity",1,-1]};
const FB=["Tidal Wave","Acheron","Bloodbath","Avernus","Kenos","Sakupen Circles","Silent Clubstep","Thinking Space II","Cognition","Crimson Planet","Nine Circles","Sonic Wave Infinity","Zodiac","Deimos","Slaughterhouse","Arcturus","Edge of Destiny","Hard Machine","Tartarus","Yatagarasu","Fuzzy Vision","Firework","Mayhem","Poocubed","Kyouki","Sunny Day","Windy Landscape","Whirl","Trueffet","Aeon Air"];
const FBP=[3,4,9,14,18,25,40,55,80,95,120,160,200,250,290,320,400,480,520,600,700,740,780,850,950,1050,1200,1400,1600,1900];
const $=s=>document.querySelector(s),say=t=>$("#say").textContent=t,sleep=ms=>new Promise(r=>setTimeout(r,ms));

// ---- Sound effects (synthesised with Web Audio) and background music (YouTube embed)
let actx=null,sfxOn=true,musicOn=true,wantPlay=false;
function ac(){if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();if(actx.state==="suspended")actx.resume();return actx}
function sfxFlip(){if(!sfxOn)return;try{const a=ac(),n=a.sampleRate*.14|0,b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);
 for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.2);
 const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type="bandpass";f.Q.value=.9;f.frequency.setValueAtTime(1400,a.currentTime);f.frequency.exponentialRampToValueAtTime(5200,a.currentTime+.13);
 const g=a.createGain();g.gain.value=.7;s.connect(f);f.connect(g);g.connect(a.destination);s.start()}catch(e){}}
function sfxClick(){if(!sfxOn)return;try{const a=ac(),o=a.createOscillator(),g=a.createGain(),t=a.currentTime;
 o.type="square";o.frequency.setValueAtTime(880,t);o.frequency.exponentialRampToValueAtTime(440,t+.06);
 g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.001,t+.08);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+.09)}catch(e){}}
function tone(f,t0,d,type,v){const a=ac(),o=a.createOscillator(),g=a.createGain(),t=a.currentTime+t0;o.type=type;o.frequency.value=f;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.02)}
function sfxWin(){if(!sfxOn)return;try{[523,659,784,1047,784,1047].forEach((f,i)=>tone(f,i*.12,i>3?.35:.16,"square",.13));[262,330,392,523].forEach((f,i)=>tone(f,i*.12+.02,.3,"triangle",.14))}catch(e){}}
function sfxApex(){if(!sfxOn)return;try{
 tone(65,0,1.1,"sine",.3);tone(98,0,1,"triangle",.18);
 [1047,1319,1568,2093,2637,3136].forEach((f,i)=>tone(f,.08+i*.07,.3,"triangle",.07));
 [523,659,784,1047].forEach(f=>tone(f,.55,1.2,"square",.06))}catch(e){}}
function sfxLose(){if(!sfxOn)return;try{[392,370,349,330].forEach((f,i)=>tone(f,i*.22,i>2?.7:.3,"sawtooth",.1))}catch(e){}}
const bgm=new Audio("assets/bgm.mp3");bgm.loop=true;bgm.volume=.35;bgm.preload="auto";
let musicWarned=false;
function startMusic(){wantPlay=true;if(!musicOn)return;const p=bgm.play();
 if(p&&p.catch)p.catch(()=>{if(!musicWarned){musicWarned=true;$("#st").insertAdjacentHTML("beforeend"," · Browser blocked the music: click the 🎵 button twice to start it.")}})}
["pointerdown","keydown"].forEach(ev=>document.addEventListener(ev,()=>{if(wantPlay===false)startMusic()},{once:true}));
$("#snd").onclick=e=>{sfxOn=!sfxOn;e.target.textContent=sfxOn?"🔊":"🔇";e.target.classList.toggle("off",!sfxOn);sfxClick()};
$("#mus").onclick=e=>{musicOn=!musicOn;e.target.classList.toggle("off",!musicOn);sfxClick();
 if(musicOn)startMusic();else bgm.pause()};
let levels=[],deck=[],hand=[],dhand=[],held=[],phase="idle",coins=100,bet=5,live=false;
const pEls=[],dEls=[];
$("#pay").innerHTML=Object.values(HANDS).map(h=>`<div><span>${h[0]}</span><b>×${h[1]}</b></div>`).join("");
$("#barrows").innerHTML=[7,6,5,4,3,2,1,0].map(i=>{const t=TIERS[i];return `<div class="rb${i===7?" ap":""}" style="--c:${t.c}"><b>${t.n}</b><span>${t.r}</span>${i===7?"<em>wins the game!</em>":""}</div>`}).join("");
const ytId=s=>{const m=String(s).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);return m?m[1]:null};
const ENDPOINTS=["https://api.aredl.net/v2/api/aredl/levels","https://api.aredl.net/v2/api/aredl/levels?exclude_legacy=false"];
let errs=[];
async function load(){
 for(const u of ENDPOINTS){
  try{const r=await fetch(u);if(!r.ok)throw new Error("HTTP "+r.status);let d=await r.json();
   d=Array.isArray(d)?d:(d.data||d.levels||d.results||[]);
   const L=d.filter(l=>l&&l.name&&Number.isFinite(+l.position)&&+l.position>0).map(l=>({id:l.id,name:l.name,position:+l.position,...grab(l)}));
   if(L.length<20)throw new Error("only "+L.length+" levels parsed");
   levels=L;live=true;API_USED=u;break}
  catch(e){errs.push(e.message||String(e))}
 }
 if(!live)levels=FB.map((n,i)=>({id:"f"+i,name:n,position:FBP[i]}));
 const st=$("#st");
 if(live){st.textContent=`Live AREDL data: ${levels.length} levels from aredl.net's API.`}
 else{st.className="bad";st.textContent="⚠ COULD NOT REACH THE AREDL API ("+errs[0]+"). Showing an OFFLINE DEMO with placeholder rankings and no thumbnails. Open this file in a normal browser tab (not the chat preview) for the real list.";}
 say("Welcome! Press DEAL to start.");$("#go").disabled=false;
}
let API_USED=ENDPOINTS[0];
function grab(o){const t=JSON.stringify(o);const yt=ytId(t);const m=t.match(/https?:[^"\s]+?\.(?:jpe?g|png|webp)/i);return{yt:yt||undefined,img:m?m[0].replace(/\\\//g,"/"):undefined}}
async function ensure(c){
 if(c.yt||c.img||!live||c.tried)return;c.tried=1;
 try{const ac=new AbortController(),t=setTimeout(()=>ac.abort(),6000);
  const r=await fetch(API_USED.split("?")[0]+"/"+c.id,{signal:ac.signal});clearTimeout(t);
  Object.assign(c,grab(await r.json()))}catch(e){}
}
function mk(host,arr,click){
 for(let i=0;i<5;i++){const e=document.createElement("div");e.className="card";
  e.innerHTML='<div class="in"><div class="face back">👹</div><div class="face front"></div></div>';
  if(click)e.onclick=()=>{if(phase!=="hold")return;sfxClick();held[i]=!held[i];paint()};
  host.appendChild(e);arr.push(e)}
}
function fill(e,c){
 const t=TIERS[tierOf(c.position)];e.style.setProperty("--c",t.c);e.classList.toggle("apex",t.n==="Apex");
 const h=(c.name.length*37+c.position*17)%360,f=e.querySelector(".front");
 f.innerHTML=`<div class="bg" style="background-image:linear-gradient(135deg,hsl(${h},75%,55%),hsl(${(h+70)%360},75%,28%))"></div><div class="pos">#${c.position}</div><div class="tr">${t.n}</div><div class="img" style="background:linear-gradient(135deg,hsl(${h},75%,55%),hsl(${(h+70)%360},75%,28%))"></div><div class="nm"></div>`;
 f.querySelector(".nm").textContent=c.name;
  const box=f.querySelector(".img"),srcs=c.yt?["mqdefault","hqdefault","default"].map(k=>`https://i.ytimg.com/vi/${c.yt}/${k}.jpg`):(c.img?[c.img]:[]);
 if(srcs.length){const im=new Image();let k=0;im.referrerPolicy="no-referrer";
  im.onload=()=>{box.classList.add("ok");box.style.background="#000";f.querySelector(".bg").style.backgroundImage='url("'+im.src+'")'};
  im.onerror=()=>{if(++k<srcs.length)im.src=srcs[k];else im.remove()};
  im.src=srcs[0];box.appendChild(im)}else box.classList.add("ok")
}
async function flip(e,c,delay){await sleep(delay);e.classList.remove("up");await sleep(c?300:0);if(c){fill(e,c);await sleep(30);e.classList.add("up");c.position===1?sfxApex():sfxFlip()}}
async function replaceCard(e,c,delay,faceUp,dir){
 await sleep(delay);
 if(faceUp){e.classList.remove("up");await sleep(620)}   // flip face-down
 sfxFlip();e.style.translate=dir;e.style.opacity="0";await sleep(580);  // slide off the table
 fill(e,c);await sleep(60);
 sfxFlip();e.style.translate="0 0";e.style.opacity="1";await sleep(580); // slide new card on
 if(faceUp){await sleep(120);e.classList.add("up");c.position===1?sfxApex():sfxFlip()}            // flip to reveal
}
function dealerPick(h){
 const t=h.map(c=>tierOf(c.position)),cnt={};t.forEach(x=>cnt[x]=(cnt[x]||0)+1);
 let keep=t.map((x,i)=>cnt[x]>1||h[i].position===1);
 if(!keep.some(Boolean)){const m=Math.max(...t);keep=t.map(x=>x===m||x>=5)}
 return keep.map((k,i)=>k?-1:i).filter(i=>i>=0);
}
function paint(){pEls.forEach((e,i)=>{e.classList.toggle("on",phase==="hold");e.classList.toggle("hold",phase==="hold"&&held[i]);e.classList.toggle("dis",phase==="hold"&&!held[i])})}
let forcedList={p:[],d:[]};
function setupAdmin(k,inp,btn,st,who){
 const apply=()=>{const v=$(inp).value.trim(),out=$(st);
  if(!v){forcedList[k]=[];out.textContent="Cleared. Next game is random.";return}
  const cards=[],bad=[];
  v.split(/[\s,]+/).filter(Boolean).slice(0,5).forEach(x=>{const l=levels.find(y=>y.position===+x);l?cards.push(l):bad.push(x)});
  if(bad.length){forcedList[k]=[];out.textContent="No level at #"+bad.join(", #")+" in the loaded list.";return}
  forcedList[k]=cards;out.textContent=`Next game ${who}: `+cards.map(c=>`#${c.position} ${c.name}`).join(", ")};
 $(btn).onclick=apply;$(inp).onkeydown=e=>{if(e.key==="Enter")apply()};
}
setupAdmin("p","#adm","#admset","#admst","you get");
setupAdmin("d","#adm2","#admset2","#admst2","the dealer gets");
const showOv=()=>new Promise(r=>{const o=$("#ov");o.classList.add("on");o.onclick=()=>{o.classList.remove("on");o.onclick=null;r()}});
function evalHand(h){
 const cnt={};h.forEach(c=>{const t=tierOf(c.position);cnt[t]=(cnt[t]||0)+1});
 const g=Object.entries(cnt).map(([t,n])=>[+t,n]).sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
 const H=HANDS[g.map(x=>x[1]).join("")];
 return{name:H[0],mult:H[1],lvl:H[2],tier:g[0][0],score:[H[2],...g.map(x=>x[0])],txt:H[0]};
}
function cmp(a,b){for(let i=0;i<a.length;i++){if(a[i]!==b[i])return a[i]>b[i]?1:-1}return 0}
const draw1=async()=>{const c=deck.shift();await ensure(c);return c};
$("#bm").onclick=()=>{sfxClick();if(phase!=="hold"&&phase!=="busy"&&bet>1)$("#bet").textContent=--bet};
$("#bp").onclick=()=>{sfxClick();if(phase!=="hold"&&phase!=="busy"&&bet<Math.min(10,coins))$("#bet").textContent=++bet};
$("#go").onclick=async()=>{
 sfxClick();startMusic();
 if(phase==="busy")return;
 if(phase!=="hold"){ // DEAL
  phase="busy";$("#go").disabled=true;$("#table").classList.remove("done");
  if(coins<bet){coins=100;bet=Math.min(bet,5);$("#bet").textContent=bet;say("Out of coins! Fresh stack on the house.")}
  coins-=bet;$("#coins").textContent=coins;$("#win").textContent=0;$("#pn").textContent=$("#dn").textContent="";
  [...pEls,...dEls].forEach(e=>{e.classList.remove("up","hold","dis","on");e.style.translate="";e.style.opacity=""});
  deck=levels.slice();for(let i=deck.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[deck[i],deck[j]]=[deck[j],deck[i]]}
  const ids=new Set([...forcedList.p,...forcedList.d].map(c=>c.id));deck=deck.filter(c=>!ids.has(c.id));
  const build=fl=>{const h=deck.splice(0,5),slots=[0,1,2,3,4].sort(()=>Math.random()-.5);fl.slice(0,5).forEach((c,i)=>{h[slots[i]]={...c}});return h};
  hand=build(forcedList.p);dhand=build(forcedList.d);
  if(forcedList.p.length||forcedList.d.length){forcedList={p:[],d:[]};["#admst","#admst2"].forEach(x=>$(x).textContent="Used! Enter numbers to queue the next game.");["#adm","#adm2"].forEach(x=>$(x).value="")}
  held=[0,0,0,0,0].map(()=>true);
  say("Shuffling… loading the pictures!");
  await Promise.all([...hand,...dhand].map(ensure));
  dEls.forEach((e,i)=>fill(e,dhand[i]));
  await Promise.all(pEls.map((e,i)=>flip(e,hand[i],i*140)));
  await sleep(500);if(hand.some(c=>c.position===1)){await sleep(1100);await showOv()}phase="hold";paint();$("#pn").textContent=evalHand(hand).txt;
  $("#go").textContent="DRAW";$("#go").disabled=false;say("All cards are held. Tap any card you want to DISCARD, then DRAW!");
 }else{ // DRAW + showdown
  phase="busy";$("#go").disabled=true;pEls.forEach(e=>e.classList.remove("hold","dis","on"));
  const rep=[];for(let i=0;i<5;i++)if(!held[i])rep.push(i);if(!rep.length)say("Standing pat!");
  const had1=hand.some(c=>c.position===1);
  const nc=await Promise.all(rep.map(draw1));
  await Promise.all(rep.map((i,k)=>{hand[i]=nc[k];return replaceCard(pEls[i],nc[k],k*170,true,"0 170%")}));
  const me=evalHand(hand);$("#pn").textContent=me.txt;
  if(!had1&&hand.some(c=>c.position===1)){await sleep(1100);await showOv()}
  const pA=hand.filter(c=>c.position===1).length;
  const dd=(say("Dealer's turn…"),await sleep(800),dealerPick(dhand));
  if(dd.length){say(`Dealer discards ${dd.length} card${dd.length>1?"s":""}.`);
   const nd=await Promise.all(dd.map(draw1));
   await Promise.all(dd.map((i,k)=>{dhand[i]=nd[k];return replaceCard(dEls[i],nd[k],k*170,false,"0 -170%")}))}
  else{say("Dealer stands pat.");await sleep(700)}
  await sleep(300);
  say("Now let's see the dealer's cards…");await sleep(700);
  await Promise.all(dEls.map((e,i)=>sleep(i*220).then(()=>{e.classList.add("up");dhand[i].position===1?sfxApex():sfxFlip()})));
  const dl=evalHand(dhand);$("#dn").textContent=dl.txt;await sleep(700);
  const dA=dhand.filter(c=>c.position===1).length;
  const r=(pA||dA)?Math.sign(pA-dA):cmp(me.score,dl.score);let w=0;
  if(r>0){sfxWin();w=Math.max(bet,Math.round(bet*me.mult));
   say(pA?(dA?`More #1s than the dealer! You got ${w} coins!`:`Top #1! You got ${w} coins!`):`${me.name}! You got ${w} coins!`)}
  else if(r===0){w=bet;say(pA?"You both have the top #1: it's a draw! Bet returned.":"A tie! Your bet is returned.")}
  else{sfxLose();say(dA?"The dealer has the top #1! Dealer wins.":"Dealer wins this one. Deal again?")}
  coins+=w;$("#table").classList.add("done");$("#coins").textContent=coins;$("#win").textContent=w;
  phase="idle";$("#go").textContent="DEAL";$("#go").disabled=false;
 }
};
mk($("#drow"),dEls,false);mk($("#prow"),pEls,true);load();
