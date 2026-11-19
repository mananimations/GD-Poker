// Discord login: create an app at https://discord.com/developers/applications, copy its Client ID here,
// and add this page's address (e.g. https://you.github.io/picture-poker/) under OAuth2 > Redirects.
const DISCORD_CLIENT_ID="1572850368642023424";
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
let actx=null,mg=null,sfxVol=.7,sfxOn=true,musVol=.35,musicOn=true,wantPlay=false;
const store={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},del:k=>{try{localStorage.removeItem(k)}catch(e){}}};
function ac(){if(!actx){actx=new(window.AudioContext||window.webkitAudioContext)();mg=actx.createGain();mg.gain.value=sfxVol;mg.connect(actx.destination)}if(actx.state==="suspended")actx.resume();return actx}
function sfxFlip(){if(!sfxOn)return;try{const a=ac(),n=a.sampleRate*.14|0,b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);
 for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.2);
 const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type="bandpass";f.Q.value=.9;f.frequency.setValueAtTime(1400,a.currentTime);f.frequency.exponentialRampToValueAtTime(5200,a.currentTime+.13);
 const g=a.createGain();g.gain.value=.7;s.connect(f);f.connect(g);g.connect(mg);s.start()}catch(e){}}
function sfxClick(){if(!sfxOn)return;try{const a=ac(),o=a.createOscillator(),g=a.createGain(),t=a.currentTime;
 o.type="square";o.frequency.setValueAtTime(880,t);o.frequency.exponentialRampToValueAtTime(440,t+.06);
 g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.001,t+.08);o.connect(g);g.connect(mg);o.start(t);o.stop(t+.09)}catch(e){}}
function tone(f,t0,d,type,v){const a=ac(),o=a.createOscillator(),g=a.createGain(),t=a.currentTime+t0;o.type=type;o.frequency.value=f;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(mg);o.start(t);o.stop(t+d+.02)}
function sfxWin(){if(!sfxOn)return;try{[523,659,784,1047,784,1047].forEach((f,i)=>tone(f,i*.12,i>3?.35:.16,"square",.13));[262,330,392,523].forEach((f,i)=>tone(f,i*.12+.02,.3,"triangle",.14))}catch(e){}}
function sfxApex(){if(!sfxOn)return;try{
 tone(65,0,1.1,"sine",.3);tone(98,0,1,"triangle",.18);
 [1047,1319,1568,2093,2637,3136].forEach((f,i)=>tone(f,.08+i*.07,.3,"triangle",.07));
 [523,659,784,1047].forEach(f=>tone(f,.55,1.2,"square",.06))}catch(e){}}
function sfxLose(){if(!sfxOn)return;try{[392,370,349,330].forEach((f,i)=>tone(f,i*.22,i>2?.7:.3,"sawtooth",.1))}catch(e){}}
const bgm=new Audio("assets/bgm.mp3");bgm.loop=true;bgm.volume=musVol;bgm.preload="auto";
let musicWarned=false;
function startMusic(){wantPlay=true;if(!musicOn)return;const p=bgm.play();
 if(p&&p.catch)p.catch(()=>{if(!musicWarned){musicWarned=true;$("#st").insertAdjacentHTML("beforeend"," · Browser blocked the music: move the 🎵 slider to start it.")}})}
["pointerdown","keydown"].forEach(ev=>document.addEventListener(ev,()=>{if(wantPlay===false)startMusic()},{once:true}));
{const sv=$("#sfxv"),mv=$("#musv"),ss=store.get("dpp_sfx"),ms=store.get("dpp_mus");
 if(ss!==null&&!isNaN(+ss))sv.value=ss;if(ms!==null&&!isNaN(+ms))mv.value=ms;
 const applySfx=()=>{sfxVol=sv.value/100;sfxOn=sfxVol>0;if(mg)mg.gain.value=sfxVol};
 const applyMus=()=>{musVol=mv.value/100;musicOn=musVol>0;bgm.volume=musVol;if(musicOn){if(wantPlay&&bgm.paused)startMusic()}else bgm.pause()};
 sv.oninput=()=>{applySfx();store.set("dpp_sfx",sv.value)};sv.onchange=()=>sfxClick();
 mv.oninput=()=>{applyMus();store.set("dpp_mus",mv.value);if(musicOn)startMusic()};
 applySfx();applyMus();}
let ready=Promise.resolve(),levels=[],deck=[],hand=[],dhand=[],held=[],phase="idle",coins=100,bet=5,live=false;
const pEls=[],dEls=[];
$("#pay").innerHTML=Object.values(HANDS).map(h=>`<div><span>${h[0]}</span><b>×${h[1]}</b></div>`).join("");
$("#barrows").innerHTML=[7,6,5,4,3,2,1,0].map(i=>{const t=TIERS[i];return `<div class="rb${i===7?" ap":""}" style="--c:${t.c}"><b>${t.n}</b><span>${t.r}</span>${i===7?"<em>wins the game!</em>":""}</div>`}).join("");
const ytId=s=>{const m=String(s).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);return m?m[1]:null};
const ENDPOINTS=["https://api.aredl.net/v2/api/aredl/levels","https://api.aredl.net/v2/api/aredl/levels?exclude_legacy=false"];
let errs=[];
async function load(){
 for(const u of ENDPOINTS){
  try{const ac=new AbortController(),tm=setTimeout(()=>ac.abort(),10000);
   let r;try{r=await fetch(u,{signal:ac.signal});if(!r.ok)throw new Error("HTTP "+r.status);var d=await r.json()}finally{clearTimeout(tm)}
   d=Array.isArray(d)?d:(d.data||d.levels||d.results||[]);
   const L=d.filter(l=>l&&l.name&&Number.isFinite(+l.position)&&+l.position>0).map(l=>({id:l.id,name:l.name,position:+l.position,...grab(l)}));
   if(L.length<20)throw new Error("only "+L.length+" levels parsed");
   levels=L;live=true;API_USED=u;break}
  catch(e){errs.push(e.name==="AbortError"?"timed out":(e.message||String(e)));if(e.name==="AbortError")break}
 }
 if(!live)levels=FB.map((n,i)=>({id:"f"+i,name:n,position:FBP[i]}));
 const st=$("#st");
 if(live){st.textContent=`Live AREDL data: ${levels.length} levels from aredl.net's API.`}
 else{st.className="bad";st.textContent="⚠ COULD NOT REACH THE AREDL API ("+errs[0]+"). Showing an OFFLINE DEMO with placeholder rankings and no thumbnails.";}
 $("#mload").textContent=live?"Ready!":"Offline demo mode (couldn't reach the AREDL API)";
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
  e.innerHTML='<div class="in"><div class="face back"><img src="assets/demon.png" alt="" draggable="false"></div><div class="face front"></div></div>';
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
// ---- Bot difficulty levels
const DIFFS={
 pussy:{label:"Pussy",say:"Pussy bot: it barely knows the rules."},
 easy:{label:"Easy",say:"Easy bot."},
 medium:{label:"Medium",say:"Medium bot."},
 hard:{label:"Hard",say:"Hard bot."},
 insane:{label:"Insane",say:"Insane bot."},
 mogger:{label:"Mogger",say:"Mogger bot is locked in."}};
let diff="medium";
const apexN=h=>h.filter(c=>c.position===1).length;
// +1 if hand a beats hand b, -1 if it loses, 0 for a draw (same rules as the showdown)
function versus(a,b){const x=apexN(a),y=apexN(b);return(x||y)?Math.sign(x-y):cmp(evalHand(a).score,evalHand(b).score)}
// Basic strategy: keep any matching rarities and the #1 card; with nothing, keep the rarest cards
function basicPick(h){
 const t=h.map(c=>tierOf(c.position)),cnt={};t.forEach(x=>cnt[x]=(cnt[x]||0)+1);
 let keep=t.map((x,i)=>cnt[x]>1||h[i].position===1);
 if(!keep.some(Boolean)){const m=Math.max(...t);keep=t.map(x=>x===m||x>=5)}
 return keep;
}
const randKeep=(p=.5)=>[0,1,2,3,4].map(()=>Math.random()<p);
// Look at every possible hold (32 of them), simulate the draws from the unseen cards, and pick the best.
// objective(finalHand) -> number. Common random numbers: every hold is scored on the same simulated draws.
function searchKeep(h,pool,trials,objective){
 const n=pool.length,draws=[];
 for(let t=0;t<trials;t++){const used=new Set(),d=[];while(d.length<5){const i=Math.random()*n|0;if(!used.has(i)){used.add(i);d.push(pool[i])}}draws.push(d)}
 let best=null,bs=-Infinity;
 for(let m=0;m<32;m++){
  const keep=[0,1,2,3,4].map(i=>!!(m>>i&1)),kept=h.filter((_,i)=>keep[i]),k=5-kept.length;let sum=0;
  for(let t=0;t<trials;t++)sum+=objective(kept.concat(draws[t].slice(0,k)));
  const sc=sum/trials+Math.random()*1e-9;if(sc>bs){bs=sc;best=keep}
 }
 return best;
}
// Payout-style value of a hand when the bot can't see (or doesn't use) the player's hand
const handValue=x=>apexN(x)?1000*apexN(x):evalHand(x).mult+evalHand(x).tier/100;
// Returns the indices the bot discards. `mine` = bot hand, `theirs` = player's final hand, `pool` = unseen cards
function botPick(mine,theirs,pool){
 let keep;
 switch(diff){
  case"pussy": // random nonsense, and sometimes deliberately keeps the WORST cards
   if(Math.random()<.5)keep=randKeep();
   else{const o=mine.map((c,i)=>i).sort((a,b)=>mine[b].position-mine[a].position),k=Math.random()*4|0;keep=[0,0,0,0,0].map(()=>false);o.slice(0,k).forEach(i=>keep[i]=true)}
   break;
  case"easy": keep=Math.random()<.4?randKeep(.6):basicPick(mine);break;
  case"medium": keep=Math.random()<.15?randKeep(.7):basicPick(mine);break;
  case"hard": keep=Math.random()<.04?basicPick(mine):searchKeep(mine,pool,40,handValue);break;
  case"insane": // sees your final hand and plays to beat it, fewer simulations than Mogger
   keep=searchKeep(mine,pool,250,x=>versus(x,theirs));break;
  default: // mogger: exact-ish search against your real hand, no mistakes
   keep=searchKeep(mine,pool,3000,x=>versus(x,theirs));
 }
 return keep.map((k,i)=>k?-1:i).filter(i=>i>=0);
}
function paint(){pEls.forEach((e,i)=>{e.classList.toggle("on",phase==="hold");e.classList.toggle("hold",phase==="hold"&&held[i]);e.classList.toggle("dis",phase==="hold"&&!held[i])})}
function evalHand(h){
 const cnt={};h.forEach(c=>{const t=tierOf(c.position);cnt[t]=(cnt[t]||0)+1});
 const g=Object.entries(cnt).map(([t,n])=>[+t,n]).sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
 const H=HANDS[g.map(x=>x[1]).join("")];
 return{name:H[0],mult:H[1],lvl:H[2],tier:g[0][0],score:[H[2],...g.map(x=>x[0])],txt:H[0]};
}
function cmp(a,b){for(let i=0;i<a.length;i++){if(a[i]!==b[i])return a[i]>b[i]?1:-1}return 0}

// ================= GAME FLOW =================
const OPPDUMMY={id:"?",name:"???",position:9999};
const APEXMSG="You got the top #1! This card lets you instantly win the game!";
let mode="bot",OPP="Dealer",myName="You",oppAnimP=Promise.resolve();
const showOv=(msg,small,onclick)=>new Promise(r=>{const o=$("#ov");$("#ovb p").textContent=msg;$("#ovb small").textContent=small||"click to continue";o.classList.add("on");
 o.onclick=()=>{if(onclick){onclick();return}o.classList.remove("on");o.onclick=null;r()}});
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const pub=c=>({id:c.id,name:c.name,position:c.position,yt:c.yt,img:c.img});
const lockBet=()=>phase==="hold"||phase==="busy";
$("#bm").onclick=()=>{sfxClick();if(!lockBet()&&bet>1)$("#bet").textContent=--bet};
$("#bp").onclick=()=>{sfxClick();if(!lockBet()&&bet<Math.min(10,coins))$("#bet").textContent=++bet};

// Deal my five cards and flip them up (shared by bot + player modes)
async function startRound(h){
 phase="busy";$("#go").disabled=true;$("#table").classList.remove("done");
 if(coins<bet){coins=100;bet=Math.min(bet,5);$("#bet").textContent=bet;say("Out of coins! Fresh stack on the house.")}
 coins-=bet;$("#coins").textContent=coins;$("#win").textContent=0;$("#pn").textContent=$("#dn").textContent="";
 [...pEls,...dEls].forEach(e=>{e.classList.remove("up","hold","dis","on");e.style.translate="";e.style.opacity=""});
 dEls.forEach(e=>fill(e,OPPDUMMY));
 hand=h;held=[true,true,true,true,true];
 say("Shuffling… loading the pictures!");
 await Promise.all(hand.map(ensure));
 await Promise.all(pEls.map((e,i)=>flip(e,hand[i],i*140)));
 await sleep(500);if(hand.some(c=>c.position===1)){await sleep(1100);await showOv(APEXMSG)}
 phase="hold";paint();$("#pn").textContent=evalHand(hand).txt;
 $("#go").textContent="DRAW";$("#go").disabled=false;say("All cards are held. Tap any card you want to DISCARD, then DRAW!");
}
async function applyMyDraw(rep,nc){
 const had1=hand.some(c=>c.position===1);
 await Promise.all(nc.map(ensure));
 await Promise.all(rep.map((i,k)=>{hand[i]=nc[k];return replaceCard(pEls[i],nc[k],k*170,true,"0 170%")}));
 $("#pn").textContent=evalHand(hand).txt;
 if(!had1&&hand.some(c=>c.position===1)){await sleep(1100);await showOv(APEXMSG)}
}
// Opponent's face-down cards slide out and fresh ones slide in
function oppDiscard(idx){
 say(idx.length?`${OPP} discards ${idx.length} card${idx.length>1?"s":""}.`:`${OPP} stands pat.`);
 oppAnimP=Promise.all(idx.map((i,k)=>replaceCard(dEls[i],OPPDUMMY,k*170,false,"0 -170%"))).then(()=>sleep(idx.length?0:700));
 return oppAnimP;
}
async function showdown(oh){
 await oppAnimP;await sleep(300);
 await Promise.all(oh.map(ensure));
 say(`Now let's see ${OPP}'s cards…`);await sleep(700);
 dEls.forEach((e,i)=>fill(e,oh[i]));await sleep(60);
 await Promise.all(dEls.map((e,i)=>sleep(i*220).then(()=>{e.classList.add("up");oh[i].position===1?sfxApex():sfxFlip()})));
 const dl=evalHand(oh),me=evalHand(hand);$("#dn").textContent=dl.txt;await sleep(700);
 const pA=hand.filter(c=>c.position===1).length,dA=oh.filter(c=>c.position===1).length;
 const r=(pA||dA)?Math.sign(pA-dA):cmp(me.score,dl.score);let w=0;
 if(r>0){sfxWin();w=Math.max(bet,Math.round(bet*me.mult));
  say(pA?(dA?`More #1s than ${OPP}! You got ${w} coins!`:`Top #1! You got ${w} coins!`):`${me.name}! You got ${w} coins!`)}
 else if(r===0){w=bet;say(pA?"You both have the top #1: it's a draw! Bet returned.":"A tie! Your bet is returned.")}
 else{sfxLose();say(dA?`${OPP} has the top #1! ${OPP} wins.`:`${OPP} wins this one. Deal again?`)}
 coins+=w;$("#table").classList.add("done");$("#coins").textContent=coins;$("#win").textContent=w;
 phase="idle";$("#go").textContent="DEAL";$("#go").disabled=false;
}
const repIdx=()=>[0,1,2,3,4].filter(i=>!held[i]);
const lockDraw=()=>{phase="busy";$("#go").disabled=true;pEls.forEach(e=>e.classList.remove("hold","dis","on"))};

// ---- vs BOT
async function botDeal(){
 phase="busy";$("#go").disabled=true;
 deck=shuffle(levels.slice());dhand=deck.splice(5,5);
 await startRound(deck.splice(0,5));
}
async function botDraw(){
 lockDraw();const rep=repIdx();if(!rep.length)say("Standing pat!");
 await applyMyDraw(rep,rep.map(()=>deck.shift()));
 say(`${OPP}'s turn…`);await sleep(diff==="mogger"?200:800);
 const dd=botPick(dhand,hand,deck);
 dd.forEach(i=>{dhand[i]=deck.shift()});
 await oppDiscard(dd);
 await showdown(dhand);
}

// ---- vs PLAYER (peer-to-peer via PeerJS; host deals, guest asks the host for cards)
const net={role:null,conn:null,gp:null,hp:null,hc:null,isHub:false,regs:new Map(),hubConns:new Set(),room:null,rooms:[],stage:null,connecting:null,gen:0,started:false,last:0,hb:null,onCards:null};
let hostReady=false,guestReady=false,meDrew=false,guestDrew=false,revealed=false,oppReveal=null,ghand=[];
const send=m=>{try{if(net.conn&&net.conn.open)net.conn.send(m)}catch(e){}};
const clean=n=>String(n||"").replace(/[\u0000-\u001f]/g,"").trim().slice(0,14)||"Player";
function resetSync(){meDrew=guestDrew=revealed=false;oppReveal=null;oppAnimP=Promise.resolve()}
function pvpReady(){
 phase="busy";$("#go").disabled=true;say(`Waiting for ${OPP} to press DEAL…`);
 if(net.role==="host"){hostReady=true;hostMaybeDeal()}else send({t:"ready"});
}
function hostMaybeDeal(){
 if(!(hostReady&&guestReady))return;hostReady=guestReady=false;
 deck=shuffle(levels.slice());const h=deck.splice(0,5);ghand=deck.splice(0,5);
 resetSync();send({t:"deal",hand:ghand.map(pub)});startRound(h);
}
async function pvpDraw(){
 lockDraw();const rep=repIdx();if(!rep.length)say("Standing pat!");
 let nc;
 if(net.role==="host"){nc=rep.map(()=>deck.shift());send({t:"opdraw",idx:rep})}
 else nc=await new Promise(res=>{net.onCards=res;send({t:"draw",rep})});
 await applyMyDraw(rep,nc);meDrew=true;
 if(net.role==="host")hostMaybeReveal();
 else if(oppReveal)showdown(oppReveal);
 else say(`Waiting for ${OPP} to draw…`);
}
function hostMaybeReveal(){
 if(revealed||!meDrew||!guestDrew)return;revealed=true;
 send({t:"reveal",hand:hand.map(pub)});showdown(ghand);
}
function onMsg(m){
 if(!m||typeof m!=="object")return;net.last=Date.now();
 switch(m.t){
  case"hello":if(net.started)return;
   if(net.role==="host")send({t:"hello",name:myName,pic:myPic});
   beginPvp(clean(m.name),goodPic(m.pic));break;
  case"ready":if(net.role==="host"){guestReady=true;hostMaybeDeal()}break;
  case"deal":if(net.role==="guest"&&Array.isArray(m.hand)){resetSync();startRound(m.hand)}break;
  case"draw":if(net.role==="host"&&Array.isArray(m.rep)&&!guestDrew){
    const rep=m.rep.filter(i=>Number.isInteger(i)&&i>=0&&i<5).slice(0,5),cs=rep.map(()=>deck.shift());
    rep.forEach((i,k)=>{ghand[i]=cs[k]});send({t:"cards",cards:cs.map(pub)});
    guestDrew=true;oppDiscard(rep);hostMaybeReveal()}break;
  case"cards":if(net.onCards){const f=net.onCards;net.onCards=null;f(m.cards)}break;
  case"opdraw":oppDiscard(m.idx||[]);break;
  case"reveal":oppReveal=m.hand;if(meDrew)showdown(oppReveal);break;
  case"chat":if(typeof m.x==="string"&&rateOk("c",350)){chatAdd(OPP,clean2(m.x),false);sfxClick()}break;
  case"emote":if(EMOTES.includes(m.e)&&rateOk("e",350)){popEmote($("#av"),m.e);sfxFlip()}break;
  case"bye":opponentLeft();break;
 }
}
// ---- Room chat + emotes (PvP only)
const EMOTES=["😈","😭","🙏","💀","✌️","🐴","🥀","💔","🔥","🐔","🤑","‼️","⁉️"];
const clean2=t=>String(t).replace(/[\u0000-\u001f]/g,"").trim().slice(0,120);
const lastT={};const rateOk=(k,ms)=>{const n=Date.now();if(n-(lastT[k]||0)<ms)return false;lastT[k]=n;return true};
function chatAdd(who,text,mine,sys){
 const log=$("#clog"),d=document.createElement("div");
 if(sys)d.className="sys";else{d.className=mine?"me":"";const b=document.createElement("b");b.textContent=who+": ";d.appendChild(b)}
 d.appendChild(document.createTextNode(text));log.appendChild(d);
 while(log.children.length>60)log.firstChild.remove();log.scrollTop=log.scrollHeight;
}
function popEmote(host,e){
 const p=document.createElement("span");p.className="pop";p.textContent=e;host.appendChild(p);setTimeout(()=>p.remove(),2300);
}
$("#emotes").innerHTML=EMOTES.map(e=>`<button type="button" aria-label="Emote ${e}">${e}</button>`).join("");
$("#emotes").onclick=ev=>{const b=ev.target.closest("button");if(!b||mode!=="pvp"||!net.started||!rateOk("se",500))return;
 const e=b.textContent;sfxClick();send({t:"emote",e});popEmote($("#mlbl"),e)};
$("#cform").onsubmit=ev=>{ev.preventDefault();const t=clean2($("#cin").value);
 if(!t||mode!=="pvp"||!net.started||!rateOk("sc",400))return;
 send({t:"chat",x:t});chatAdd(myName,t,true);$("#cin").value=""};
function opponentLeft(why){
 if(!net.started)return;net.started=false;clearInterval(net.hb);
 showOv(`${OPP} ${why||"left the game"}.`,"click to return to the menu",()=>location.reload());
 setTimeout(()=>location.reload(),8000);
}
// tell the opponent right away when this tab is closed or refreshed
const sayBye=()=>{if(!net.started)return;send({t:"bye"});try{net.conn.close()}catch(e){}};
addEventListener("pagehide",sayBye);addEventListener("beforeunload",sayBye);
function setupConn(c,role){
 net.conn=c;net.role=role;net.last=Date.now();
 c.on("data",onMsg);c.on("close",()=>opponentLeft());c.on("error",()=>{});
}

let myPic=null;
const goodPic=p=>typeof p==="string"&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p)&&p.length<80000?p:null;
function beginPvp(name,pic){
 net.started=true;OPP=name;mode="pvp";$("#chat").hidden=false;$("#clog").textContent="";chatAdd("",`Chat with ${OPP}. Emotes pop up over avatars.`,false,true);
 clearInterval(net.hb);net.hb=setInterval(()=>{send({t:"ping"});if(Date.now()-net.last>25000)opponentLeft("lost connection")},3000);
 enterGame(`Matched with ${OPP}! Press DEAL when you're ready.`,pic);
 $("#st").className=live?"":"bad";$("#st").textContent=`Playing against ${OPP} (peer-to-peer). Both players press DEAL to start each round.`;
}

// ================= LOBBY (rooms) =================
// A well-known "hub" peer keeps the room directory. Whoever claims the id first is the hub; if the hub leaves, the others elect a new one and re-register their rooms.
const HUB="demon-picture-poker-hub-v2";
const scr=id=>document.querySelectorAll(".mscr").forEach(e=>e.hidden=e.id!==id);
const lobErr=t=>{$("#lerr").textContent=t||""};
function netCleanup(){
 net.gen++;
 for(const k of["gp","hp"]){try{net[k]&&net[k].destroy()}catch(e){}net[k]=null}
 if(net.conn&&!net.started){try{net.conn.close()}catch(e){}}
 net.conn=net.hc=net.room=null;net.isHub=false;net.regs.clear();net.hubConns.clear();net.rooms=[];net.stage=null;net.connecting=null;
}
function regInfo(){return{hid:net.gp.id,host:myName,locked:!!(net.room&&net.room.pw)}}
function hubBroadcast(){
 const list=[...net.regs.values()];
 net.hubConns.forEach(c=>{try{c.open&&c.send({t:"rooms",list})}catch(e){}});
 setRooms(list);
}
function sendReg(){
 if(!net.room||!net.gp)return;
 if(net.isHub){net.regs.set("self",regInfo());hubBroadcast()}
 else if(net.hc&&net.hc.open)net.hc.send({t:"reg",room:regInfo()});
}
function unregRoom(){
 if(net.isHub){if(net.regs.delete("self"))hubBroadcast()}
 else if(net.hc&&net.hc.open)net.hc.send({t:"unreg"});
}
function hubMsg(c,m){
 if(!m||typeof m!=="object")return;
 if(m.t==="hi")c.send({t:"rooms",list:[...net.regs.values()]});
 else if(m.t==="reg"&&m.room&&typeof m.room.hid==="string"){net.regs.set(c,{hid:m.room.hid.slice(0,60),host:clean(m.room.host),locked:!!m.room.locked});hubBroadcast()}
 else if(m.t==="unreg"){if(net.regs.delete(c))hubBroadcast()}
}
function tryHub(){
 const gen=net.gen,alive=()=>gen===net.gen&&net.gp;if(!alive())return;
 let hp;try{hp=new Peer(HUB)}catch(e){return}net.hp=hp;
 hp.on("open",()=>{if(!alive())return;net.isHub=true;net.hc=null;if(net.room)net.regs.set("self",regInfo());hubBroadcast()});
 hp.on("connection",c=>{net.hubConns.add(c);c.on("data",m=>hubMsg(c,m));c.on("error",()=>{});
  c.on("close",()=>{net.hubConns.delete(c);if(net.regs.delete(c))hubBroadcast()})});
 hp.on("error",e=>{if(!alive())return;try{hp.destroy()}catch(x){}if(net.hp===hp)net.hp=null;
  if(e.type==="unavailable-id")connectHub();else setTimeout(tryHub,3000)});
}
function connectHub(){
 const gen=net.gen,alive=()=>gen===net.gen&&net.gp;if(!alive())return;
 const c=net.gp.connect(HUB,{reliable:true});net.hc=c;net.connecting="hub";let ok=false;
 const retry=()=>setTimeout(()=>{if(alive()&&!net.isHub&&!net.hp)tryHub()},1000+Math.random()*1500);
 const to=setTimeout(()=>{if(!ok&&alive()){try{c.close()}catch(e){}net.hc=null;retry()}},7000);
 c.on("open",()=>{ok=true;clearTimeout(to);net.connecting=null;c.send({t:"hi"});if(net.room)sendReg()});
 c.on("data",m=>{if(m&&m.t==="rooms"&&Array.isArray(m.list))setRooms(m.list)});
 c.on("close",()=>{if(!alive()||net.hc!==c)return;net.hc=null;setTimeout(tryHub,200+Math.random()*1200)});
}
function startLobby(){
 netCleanup();const gen=net.gen;net.stage="entering";
 if(typeof Peer==="undefined"){$("#mwait").textContent="Couldn't load the multiplayer library. Check your connection and reload.";return}
 let gp;try{gp=new Peer()}catch(e){$("#mwait").textContent="Multiplayer isn't available here.";return}
 net.gp=gp;
 gp.on("open",()=>{if(gen===net.gen)tryHub()});
 gp.on("connection",onRoomConn);
 gp.on("error",e=>{if(gen!==net.gen||net.started)return;
  if(e.type==="peer-unavailable"){
   if(net.connecting==="hub"){net.connecting=null;net.hc=null;setTimeout(()=>{if(gen===net.gen&&!net.isHub&&!net.hp)tryHub()},1000+Math.random()*1500)}
   else if(net.connecting==="room")joinFail("That room is gone.")}
  else if(["network","server-error","socket-error","socket-closed"].includes(e.type)&&net.stage==="entering"){$("#mwait").textContent="Connection problem, retrying…";setTimeout(()=>{if(gen===net.gen&&net.stage==="entering")startLobby()},3000)}});
}
// someone wants into my room
function onRoomConn(c){
 let done=false;
 c.on("data",m=>{
  if(done||!m||m.t!=="hello")return;done=true;
  const deny=why=>{try{c.send({t:"deny",why})}catch(e){}setTimeout(()=>{try{c.close()}catch(e){}},400)};
  if(net.conn||!net.room)return deny("full");
  if(net.room.pw&&m.pw!==net.room.pw)return deny("password");
  setupConn(c,"host");unregRoom();net.room=null;onMsg(m);
 });
}
function setRooms(list){
 const me=net.gp&&net.gp.id;net.rooms=(list||[]).filter(r=>r&&r.hid&&r.hid!==me);
 renderRooms();
 if(net.stage==="entering"&&net.gp){net.stage="lobby";net.rooms.length?showLobby():createRoom("")}
}
function renderRooms(){
 for(const id of["rlist","rlist2"]){
  const box=$("#"+id);box.textContent="";
  if(!net.rooms.length&&id==="rlist"){const d=document.createElement("div");d.className="rempty";d.textContent="No open rooms right now.";box.appendChild(d)}
  net.rooms.forEach(r=>{const d=document.createElement("div");d.className="room";
   const n=document.createElement("span");n.className="rn";n.textContent=(r.locked?"🔒 ":"")+r.host+"'s room";
   const b=document.createElement("button");b.className="btn sm go";b.textContent="JOIN";b.onclick=()=>{sfxClick();tryJoin(r)};
   d.append(n,b);box.appendChild(d)});
 }
 $("#w2").hidden=!net.rooms.length;
}
function showLobby(){net.stage="lobby";$("#jpw").hidden=true;scr("m-lobby");renderRooms()}
function createRoom(pw){
 net.room={pw:pw||""};net.stage="room";
 $("#mwait").textContent="Waiting for another player to join…";
 $("#wroom").hidden=false;$("#wlock").checked=!!pw;$("#wpw").hidden=$("#wset").hidden=!pw;$("#wpw").value=pw||"";
 $("#wst").textContent=pw?"🔒 Room locked.":"Room is open to anyone.";
 scr("m-wait");sendReg();renderRooms();
}
function tryJoin(r){
 lobErr("");
 if(r.locked){$("#jpwn").textContent=r.host;$("#jpwi").value="";$("#jpw").hidden=false;$("#jpw").dataset.hid=r.hid;net.pending=r;
  if(!$("#m-lobby").hidden)$("#jpwi").focus();else{scr("m-lobby");$("#jpw").hidden=false;$("#jpwi").focus()}}
 else joinRoom(r,"");
}
function joinRoom(r,pw){
 if(net.conn)return;
 if(net.room){unregRoom();net.room=null}
 $("#jpw").hidden=true;scr("m-lobby");lobErr(`Joining ${r.host}'s room…`);
 const gen=net.gen,c=net.gp.connect(r.hid,{reliable:true});net.connecting="room";
 net.conn=c;net.role="guest";net.joinTo=setTimeout(()=>joinFail("Couldn't connect to that room."),9000);
 setupConn(c,"guest");
 c.on("open",()=>{net.connecting=null;c.send({t:"hello",name:myName,pic:myPic,pw})});
 c.on("data",m=>{if(m&&m.t==="deny")joinFail(m.why==="password"?"Wrong password.":"That room is full or busy.")});
}
function joinFail(msg){
 clearTimeout(net.joinTo);if(net.started)return;
 const c=net.conn;net.conn=null;net.role=null;net.connecting=null;try{c&&c.close()}catch(e){}
 showLobby();lobErr(msg);
}

// ================= MENU =================
function enterGame(msg,pic,chr){
 $("#menu").classList.add("gone");
 $("#dname").textContent=OPP;$("#dimg").alt=OPP;$("#dlbl").textContent=OPP+"'s hand";
 const di=$("#dimg");di.src=pic||"assets/dealer.png";di.classList.toggle("custom",!!pic&&!chr);di.classList.toggle("char",!!chr);
 const mv=$("#myav");mv.hidden=!myPic;if(myPic)mv.src=myPic;
 say(msg);$("#go").disabled=false;
}
// optional profile picture (kept in this browser, shrunk to 160px)
let customPic=null,dcPic=null,dcUser=null;
function refreshPic(){myPic=customPic||dcPic;const e=$("#pfimg");e.style.backgroundImage=myPic?`url("${myPic}")`:"";e.textContent=myPic?"":"?";
 $("#pfclear").hidden=!customPic;$("#pfedit").hidden=!customPic||!store.get("dpp_picsrc");$("#pf").classList.toggle("dc",!!dcPic&&!customPic)}
function setPic(p){customPic=p;refreshPic()}
{const saved=store.get("dpp_pic");if(goodPic(saved))setPic(saved)}
// picture editor: drag to position, slider / wheel to zoom, circle shows exactly what opponents will see
const CV=$("#cropcv"),cx2=CV.getContext("2d"),CS=260,CR=120;
const cr={img:null,src:null,z:1,x:CS/2,y:CS/2};
const crBase=()=>2*CR/Math.min(cr.img.width,cr.img.height);
function crClamp(){const s=crBase()*cr.z,w=cr.img.width*s/2,h=cr.img.height*s/2,c=CS/2;
 cr.x=Math.min(c-CR+w,Math.max(c+CR-w,cr.x));cr.y=Math.min(c-CR+h,Math.max(c+CR-h,cr.y))}
function crDraw(){
 crClamp();const s=crBase()*cr.z,w=cr.img.width*s,h=cr.img.height*s;
 cx2.clearRect(0,0,CS,CS);cx2.drawImage(cr.img,cr.x-w/2,cr.y-h/2,w,h);
 cx2.fillStyle="rgba(0,0,0,.62)";cx2.beginPath();cx2.rect(0,0,CS,CS);cx2.arc(CS/2,CS/2,CR,0,Math.PI*2,true);cx2.fill("evenodd");
 cx2.strokeStyle="#ffd23f";cx2.lineWidth=3;cx2.beginPath();cx2.arc(CS/2,CS/2,CR,0,Math.PI*2);cx2.stroke();
}
function openCrop(img,src,st){
 cr.img=img;cr.src=src;cr.z=st?st.z:1;cr.x=st?st.x*CS:CS/2;cr.y=st?st.y*CS:CS/2;
 $("#cropz").value=Math.round(cr.z*100);crDraw();scr("m-crop");
}
$("#cropz").oninput=e=>{cr.z=e.target.value/100;crDraw()};
CV.addEventListener("wheel",e=>{e.preventDefault();cr.z=Math.min(4,Math.max(1,cr.z*(e.deltaY<0?1.08:1/1.08)));$("#cropz").value=Math.round(cr.z*100);crDraw()},{passive:false});
{let drag=null;
 CV.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,ox:cr.x,oy:cr.y,k:CS/CV.getBoundingClientRect().width};CV.setPointerCapture(e.pointerId)};
 CV.onpointermove=e=>{if(!drag)return;cr.x=drag.ox+(e.clientX-drag.x)*drag.k;cr.y=drag.oy+(e.clientY-drag.y)*drag.k;crDraw()};
 CV.onpointerup=CV.onpointercancel=()=>{drag=null}}
$("#pfile").onchange=e=>{
 const f=e.target.files[0];e.target.value="";if(!f||!/^image\//.test(f.type))return;
 const url=URL.createObjectURL(f),im=new Image();
 im.onload=()=>{ // keep a copy (max 640px) so the picture can be adjusted again later
  const m=Math.min(1,640/Math.max(im.width,im.height)),cv=document.createElement("canvas");cv.width=Math.round(im.width*m);cv.height=Math.round(im.height*m);
  cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);URL.revokeObjectURL(url);
  const src=cv.toDataURL("image/jpeg",.85),i2=new Image();i2.onload=()=>openCrop(i2,src,null);i2.src=src};
 im.onerror=()=>URL.revokeObjectURL(url);im.src=url;
};
$("#pfedit").onclick=()=>{sfxClick();const src=store.get("dpp_picsrc");if(!src)return;const im=new Image();
 im.onload=()=>{let st=null;try{st=JSON.parse(store.get("dpp_crop"))}catch(e){}openCrop(im,src,st&&isFinite(st.z)?st:null)};im.src=src};
$("#cropno").onclick=()=>{sfxClick();scr("m-main")};
$("#cropok").onclick=()=>{
 sfxClick();crClamp();const s=crBase()*cr.z,iw=cr.img.width,ih=cr.img.height,c=CS/2;
 const sx=(c-CR-(cr.x-iw*s/2))/s,sy=(c-CR-(cr.y-ih*s/2))/s,sw=2*CR/s,o=document.createElement("canvas");o.width=o.height=160;
 o.getContext("2d").drawImage(cr.img,sx,sy,sw,sw,0,0,160,160);
 const p=o.toDataURL("image/jpeg",.88);store.set("dpp_pic",p);store.set("dpp_picsrc",cr.src);store.set("dpp_crop",JSON.stringify({z:cr.z,x:cr.x/CS,y:cr.y/CS}));
 setPic(p);scr("m-main");
};
$("#pfclear").onclick=()=>{sfxClick();setPic(null);["dpp_pic","dpp_picsrc","dpp_crop"].forEach(store.del)};
// ---- Discord login (OAuth2 implicit flow, "identify" scope only; the token is used once and never stored)
const dcErr=t=>{$("#dcerr").textContent=t||""};
function dcShow(){
 const u=dcUser;$("#dcin").hidden=!!u;$("#dcuser").hidden=!u;
 if(u){$("#dcname").textContent=u.name;$("#dcav").src=u.avatar;
  if(!$("#mname").value)$("#mname").value=clean(store.get("dpp_name")||u.name)}
 refreshPic();
}
function dcApply(u){ // u = {id,name,avatar(url),pic(data url)}
 dcUser=u;dcPic=goodPic(u.pic);dcShow();
}
function avatarData(url){return new Promise((res,rej)=>{const im=new Image();im.crossOrigin="anonymous";
 im.onload=()=>{const o=document.createElement("canvas");o.width=o.height=160;o.getContext("2d").drawImage(im,0,0,160,160);try{res(o.toDataURL("image/jpeg",.88))}catch(e){rej(e)}};
 im.onerror=()=>rej(new Error("avatar"));im.src=url})}
async function dcFinish(token){
 try{
  const r=await fetch("https://discord.com/api/users/@me",{headers:{Authorization:"Bearer "+token}});
  if(!r.ok)throw new Error("HTTP "+r.status);const j=await r.json();
  const id=String(j.id),av=j.avatar?`https://cdn.discordapp.com/avatars/${id}/${j.avatar}.png?size=128`:`https://cdn.discordapp.com/embed/avatars/${Number((BigInt(id)>>22n)%6n)}.png`;
  let pic=null;try{pic=await avatarData(av)}catch(e){}
  const u={id,name:clean(j.global_name||j.username),avatar:av,pic};
  store.set("dpp_dc",JSON.stringify(u));dcApply(u);
 }catch(e){dcErr("Discord login failed: "+(e.message||e))}
}
$("#dcin").onclick=()=>{sfxClick();
 if(!DISCORD_CLIENT_ID){dcErr("Discord login isn't set up yet: add your Client ID at the top of script.js.");return}
 if(location.protocol==="file:"){dcErr("Discord login needs the game to be hosted (not opened as a file).");return}
 const st=Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,"0")).join("");
 try{sessionStorage.setItem("dpp_state",st)}catch(e){}
 location.href="https://discord.com/oauth2/authorize?"+new URLSearchParams({client_id:DISCORD_CLIENT_ID,response_type:"token",scope:"identify",state:st,redirect_uri:location.origin+location.pathname,prompt:"none"})};
$("#dcout").onclick=()=>{sfxClick();dcUser=dcPic=null;store.del("dpp_dc");store.del("dpp_name");$("#dcin").hidden=false;$("#dcuser").hidden=true;$("#mname").value="";refreshPic()};
{ // coming back from Discord?
 const hp=new URLSearchParams(location.hash.slice(1)),tok=hp.get("access_token"),err=hp.get("error_description")||hp.get("error");
 if(tok||err){history.replaceState(null,"",location.pathname+location.search);
  let want=null;try{want=sessionStorage.getItem("dpp_state");sessionStorage.removeItem("dpp_state")}catch(e){}
  if(err)dcErr(err==="access_denied"?"Discord login was cancelled.":"Discord login failed: "+err);
  else if(!want||hp.get("state")!==want)dcErr("Discord login failed: security check didn't match. Try again.");
  else dcFinish(tok)}
 else{try{const u=JSON.parse(store.get("dpp_dc"));if(u&&u.id&&u.name)dcApply({id:String(u.id),name:clean(u.name),avatar:/^https:\/\/cdn\.discordapp\.com\//.test(u.avatar)?u.avatar:"",pic:u.pic})}catch(e){}}
}
// the bot's dealer is a random character each time you start a bot game
const CHARS=[{n:"Shopkeeper",i:null},{n:"The Wizard Grandmaster",i:"assets/chars/wizard.png"},{n:"The Biger F",i:"assets/chars/biger-f.png"},{n:"Npesta",i:"assets/chars/npesta.png"}];
$("#mBot").onclick=()=>{sfxClick();startMusic();scr("m-diff")};
$("#mBack3").onclick=()=>{sfxClick();scr("m-main")};
document.querySelectorAll(".dbtn").forEach(b=>b.onclick=async()=>{sfxClick();await ready;mode="bot";diff=b.dataset.d;
 const c=CHARS[Math.random()*CHARS.length|0],D=DIFFS[diff];OPP=c.n;enterGame(`${OPP} is your dealer (${D.label}). Press DEAL to start.`,c.i,!!c.i);
 $("#dlbl").textContent=`${OPP}'s hand · ${D.label}`;
 if(live){$("#st").className="";$("#st").textContent=`Bot difficulty: ${D.label}. ${D.say}`}});
$("#mPvp").onclick=()=>{sfxClick();startMusic();scr("m-name");$("#mname").focus()};
$("#mBack1").onclick=()=>{sfxClick();scr("m-main")};
const goLobby=async()=>{
 if(!$("#mname").value.trim()){$("#mname").focus();$("#mname").placeholder="Please type a name!";return}
 myName=clean($("#mname").value);if(dcUser)store.set("dpp_name",myName);sfxClick();lobErr("");scr("m-wait");$("#wroom").hidden=true;$("#mwait").textContent="Loading the demon list…";await ready;$("#mwait").textContent="Connecting to the lobby…";if($("#m-wait").hidden)return;startLobby()};
$("#mFind").onclick=goLobby;$("#mname").onkeydown=e=>{if(e.key==="Enter")goLobby()};
$("#mBack2").onclick=()=>{sfxClick();netCleanup();scr("m-main")};
$("#mCancel").onclick=()=>{sfxClick();
 if(net.room){unregRoom();net.room=null;showLobby()}else{netCleanup();scr("m-main")}};
$("#mklock").onchange=e=>{$("#mkpw").hidden=!e.target.checked;if(e.target.checked)$("#mkpw").focus()};
$("#mkgo").onclick=()=>{
 const pw=$("#mklock").checked?$("#mkpw").value.trim():"";
 if($("#mklock").checked&&!pw){$("#mkpw").focus();$("#mkpw").placeholder="Type a password!";return}
 sfxClick();createRoom(pw)};
$("#wlock").onchange=e=>{
 $("#wpw").hidden=$("#wset").hidden=!e.target.checked;
 if(e.target.checked)$("#wpw").focus();
 else if(net.room){net.room.pw="";sendReg();$("#wst").textContent="Room is open to anyone."}};
const setPw=()=>{const pw=$("#wpw").value.trim();if(!pw||!net.room){$("#wpw").focus();return}
 net.room.pw=pw;sendReg();$("#wst").textContent="🔒 Room locked with that password."};
$("#wset").onclick=()=>{sfxClick();setPw()};$("#wpw").onkeydown=e=>{if(e.key==="Enter")setPw()};
const doJoinPw=()=>{if(net.pending)joinRoom(net.pending,$("#jpwi").value)};
$("#jpwgo").onclick=()=>{sfxClick();doJoinPw()};$("#jpwi").onkeydown=e=>{if(e.key==="Enter")doJoinPw()};
$("#jpwx").onclick=()=>{sfxClick();$("#jpw").hidden=true};
// MENU button asks first
const cf=$("#cf");
$("#leave").onclick=()=>{sfxClick();cf.classList.add("on")};
$("#cfstay").onclick=()=>{sfxClick();cf.classList.remove("on")};
$("#cfleave").onclick=()=>location.reload();
document.addEventListener("keydown",e=>{if(e.key==="Escape")cf.classList.remove("on")});
cf.onclick=e=>{if(e.target===cf)cf.classList.remove("on")};
$("#go").onclick=async()=>{
 sfxClick();startMusic();
 if(phase==="busy")return;
 if(phase!=="hold"){mode==="bot"?await botDeal():pvpReady()}
 else{mode==="bot"?await botDraw():await pvpDraw()}
};
mk($("#drow"),dEls,false);mk($("#prow"),pEls,true);pEls.forEach((e,i)=>e.dataset.k=i+1);
// Keyboard: 1-5 toggle discards, Space deals/draws (Space also dismisses the pop-up message)
document.addEventListener("keydown",e=>{
 const t=e.target,typing=t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.isContentEditable);
 if(typing||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
 if(!$("#menu").classList.contains("gone")||cf.classList.contains("on"))return;
 if(e.key===" "||e.code==="Space"){e.preventDefault();if(t&&t.blur&&t.tagName==="BUTTON")t.blur();
  if($("#ov").classList.contains("on"))$("#ov").click();else $("#go").click()}
 else if(/^[1-5]$/.test(e.key)&&!$("#ov").classList.contains("on")){const c=pEls[+e.key-1];if(c&&c.onclick)c.onclick()}
});
document.addEventListener("keyup",e=>{if(e.code==="Space"&&!(e.target.tagName==="INPUT"))e.preventDefault()});
$("#mBot").disabled=$("#mPvp").disabled=false;$("#mload").textContent="Loading the demon list…";
ready=load().catch(e=>{levels=FB.map((n,i)=>({id:"f"+i,name:n,position:FBP[i]}));$("#mload").textContent="Offline demo mode"});
