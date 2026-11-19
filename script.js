// Discord login: create an app at https://discord.com/developers/applications, copy its Client ID here,
// and add this page's address (e.g. https://you.github.io/picture-poker/) under OAuth2 > Redirects.
const DISCORD_CLIENT_ID="1572850368642023424";
// Global leaderboard storage: a Firebase Realtime Database URL (see README), e.g. "https://my-game-default-rtdb.firebaseio.com"
const LEADERBOARD_DB="https://gd-poker-default-rtdb.firebaseio.com";
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
wantPlay=true;
if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",()=>startMusic(),{once:true})}else{startMusic()}
{const sv=$("#sfxv"),mv=$("#musv"),ss=store.get("dpp_sfx"),ms=store.get("dpp_mus");
 if(ss!==null&&!isNaN(+ss))sv.value=ss;if(ms!==null&&!isNaN(+ms))mv.value=ms;
 const applySfx=()=>{sfxVol=sv.value/100;sfxOn=sfxVol>0;if(mg)mg.gain.value=sfxVol};
 const applyMus=()=>{musVol=mv.value/100;musicOn=musVol>0;bgm.volume=musVol;if(musicOn){if(wantPlay&&bgm.paused)startMusic()}else bgm.pause()};
 sv.oninput=()=>{applySfx();store.set("dpp_sfx",sv.value)};sv.onchange=()=>sfxClick();
 mv.oninput=()=>{applyMus();store.set("dpp_mus",mv.value);if(musicOn)startMusic()};
 applySfx();applyMus();}
let ready=Promise.resolve(),levels=[],deck=[],hand=[],dhand=[],held=[],phase="idle",coins=100,bet=5,live=false;
const pEls=[],dEls=[];
let cardInputReady=false,cardInputTimer=0;
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
  if(click){
   // Strict card targeting: ignore gestures that began before discard mode,
   // on another element, or outside this card's visible rectangle.
   let press=null;
   const inside=(ev)=>{
    const r=e.getBoundingClientRect();
    return ev.clientX>=r.left&&ev.clientX<=r.right&&ev.clientY>=r.top&&ev.clientY<=r.bottom;
   };
   const toggle=(keyboard=false)=>{
    if(phase!=="hold"||(!keyboard&&!cardInputReady))return;
    sfxClick();held[i]=!held[i];paint();specHolds();
   };
   e.addEventListener("pointerdown",ev=>{
    const cardTarget=ev.target===e||e.contains(ev.target);
    press=(phase==="hold"&&cardInputReady&&ev.isPrimary&&ev.isTrusted&&cardTarget&&inside(ev))
      ?{id:ev.pointerId,x:ev.clientX,y:ev.clientY}:null;
   },true);
   e.addEventListener("pointerup",ev=>{
    const valid=!!(press&&phase==="hold"&&cardInputReady&&ev.isPrimary&&ev.isTrusted&&
      ev.pointerId===press.id&&inside(ev));
    press=null;
    if(valid){ev.preventDefault();ev.stopPropagation();toggle();}
   },true);
   e.addEventListener("pointercancel",()=>{press=null;},true);
   e.addEventListener("click",ev=>{ev.preventDefault();ev.stopPropagation();},true);
   e._toggleCard=()=>toggle(true);
  }
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
let diff="medium",botLuck="normal",playerLuck="normal",matchTarget=5,roundsPlayed=0;
const luckName=v=>["bad","normal","good"][Math.max(0,Math.min(2,+v||0))];
const selectedRounds=id=>{const v=Number($(id).value);return Number.isFinite(v)&&v>=0?v:5};
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
let mode="bot",OPP="Dealer",myName="You",myId="",oppId="",oppAnimP=Promise.resolve();
const showOv=(msg,small,onclick)=>new Promise(r=>{const o=$("#ov");$("#ovb p").textContent=msg;$("#ovb small").textContent=small||"click to continue";o.classList.add("on");
 o.onclick=()=>{if(onclick){onclick();return}o.classList.remove("on");o.onclick=null;r()}});
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const pub=c=>({id:c.id,name:c.name,position:c.position,yt:c.yt,img:c.img});
const lockBet=()=>phase==="hold"||phase==="busy";
$("#bm").onclick=()=>{sfxClick();if(!lockBet()&&bet>1)$("#bet").textContent=--bet};
$("#bp").onclick=()=>{sfxClick();if(!lockBet()&&bet<Math.min(10,coins))$("#bet").textContent=++bet};

// Deal my five cards and flip them up (shared by bot + player modes)
async function startRound(h){
 cardInputReady=false;clearTimeout(cardInputTimer);
 phase="busy";rstage="dealing";$("#go").disabled=true;$("#table").classList.remove("done");
 if(coins<bet){coins=100;bet=Math.min(bet,5);$("#bet").textContent=bet;say("Out of coins! Fresh stack on the house.")}
 coins-=bet;$("#coins").textContent=coins;$("#win").textContent=0;$("#pn").textContent=$("#dn").textContent="";
 [...pEls,...dEls].forEach(e=>{e.classList.remove("up","hold","dis","on");e.style.translate="";e.style.opacity=""});
 dEls.forEach(e=>fill(e,OPPDUMMY));
 hand=h;held=[true,true,true,true,true];
 say("Shuffling… loading the pictures!");
 await Promise.all(hand.map(ensure));
 await Promise.all(pEls.map((e,i)=>flip(e,hand[i],i*140)));
 await sleep(500);if(hand.some(c=>c.position===1)){await sleep(1100);await showOv(APEXMSG)}
 phase="hold";held=[true,true,true,true,true];paint();$("#pn").textContent=evalHand(hand).txt;
 // Do not let a lingering pointer/touch release from DEAL or the deal animation select a card.
 cardInputTimer=setTimeout(()=>{if(phase==="hold")cardInputReady=true;},450);
 rstage="holding";specPush();
 $("#go").textContent="DRAW";$("#go").disabled=false;say("All cards are held. Tap any card you want to DISCARD, then DRAW!");
}
async function applyMyDraw(rep,nc){
 const had1=hand.some(c=>c.position===1);
 await Promise.all(nc.map(ensure));
 await Promise.all(rep.map((i,k)=>{hand[i]=nc[k];return replaceCard(pEls[i],nc[k],k*170,true,"0 170%")}));
 $("#pn").textContent=evalHand(hand).txt;
 specPush();
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
 if(r>0){sfxWin();w=Math.round(Math.max(bet,Math.round(bet*me.mult))*Math.max(1,pwE("payMult")));if(mode==="pvp")recordWin();
  say(pA?(dA?`More #1s than ${OPP}! You got ${w} coins!`:`Top #1! You got ${w} coins!`):`${me.name}! You got ${w} coins!`)}
 else if(r===0){w=bet;say(pA?"You both have the top #1: it's a draw! Bet returned.":"A tie! Your bet is returned.")}
 else{sfxLose();say(dA?`${OPP} has the top #1! ${OPP} wins.`:`${OPP} wins this one. Deal again?`)}
 coins+=w;$("#table").classList.add("done");$("#coins").textContent=coins;$("#win").textContent=w;
 phase="idle";$("#go").textContent="DEAL";$("#go").disabled=false;
 rstage="result";lastRes=$("#say").textContent;roundsPlayed++;
 if(matchTarget>0&&roundsPlayed>=matchTarget){if(mode==="bot"||net.role==="host")finishMatch();return}
 specPush();
}
function finishMatch(){
 if(!net.started&&mode==="pvp")return;
 if(mode==="pvp"){send({t:"matchEnd"});net.started=false;clearInterval(net.hb);try{net.conn&&net.conn.close()}catch(e){}}
 showOv(`Match complete! ${roundsPlayed} round${roundsPlayed===1?"":"s"} played.`,"click to return to the menu",()=>location.reload());
 setTimeout(()=>location.reload(),7000);
}
const repIdx=()=>[0,1,2,3,4].filter(i=>!held[i]);
const lockDraw=()=>{cardInputReady=false;clearTimeout(cardInputTimer);phase="busy";rstage="drawing";$("#go").disabled=true;pEls.forEach(e=>e.classList.remove("hold","dis","on"))};

// ---- vs BOT
async function botDeal(){
 phase="busy";$("#go").disabled=true;
 deck=shuffle(levels.slice());
 const[mine,theirs]=await dealRig(myId,null,true,false); // admin card grants + power hour only affect the player, never the bot
 dhand=theirs;tuneLuck(mine,playerLuck);tuneLuck(dhand,botLuck);
 await startRound(mine);
}
async function botDraw(){
 lockDraw();const rep=repIdx();if(!rep.length)say("Standing pat!");
 const fresh=drawNew(hand,rep,true),finalHand=hand.slice();rep.forEach((i,k)=>{finalHand[i]=fresh[k]});
 if(rep.length)tuneLuck(finalHand,playerLuck,rep);
 const changed=finalHand.map((c,i)=>c!==hand[i]?i:-1).filter(i=>i>=0);
 await applyMyDraw(changed,changed.map(i=>finalHand[i]));
 say(`${OPP}'s turn…`);await sleep(diff==="mogger"?200:800);
 const dd=botPick(dhand,hand,deck);
 dd.forEach(i=>{dhand[i]=deck.shift()});if(dd.length)tuneLuck(dhand,botLuck,dd);specPush();
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
async function hostMaybeDeal(){
 if(!(hostReady&&guestReady))return;hostReady=guestReady=false;
 deck=shuffle(levels.slice());const[h,g]=await dealRig(myId,oppId,true,true);ghand=g;guestHeld=[true,true,true,true,true];
 resetSync();send({t:"deal",hand:ghand.map(pub)});startRound(h);
}
async function pvpDraw(){
 lockDraw();const rep=repIdx();if(!rep.length)say("Standing pat!");
 let nc;
 if(net.role==="host"){nc=drawNew(hand,rep,true);send({t:"opdraw",idx:rep})}
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
   if(net.role==="host")send({t:"hello",name:myName,pic:myPic,did:myId,rounds:net.room&&net.room.rounds||matchTarget});
   else if(Number.isFinite(+m.rounds))matchTarget=Math.max(0,Math.min(1000,+m.rounds));
   roundsPlayed=0;oppId=String(m.did||"").slice(0,30);beginPvp(clean(m.name),goodPic(m.pic));break;
  case"ready":if(net.role==="host"){guestReady=true;hostMaybeDeal()}break;
  case"deal":if(net.role==="guest"&&Array.isArray(m.hand)){resetSync();startRound(m.hand)}break;
  case"draw":if(net.role==="host"&&Array.isArray(m.rep)&&!guestDrew){
    const rep=m.rep.filter(i=>Number.isInteger(i)&&i>=0&&i<5).slice(0,5),cs=drawNew(ghand,rep,true);
    rep.forEach((i,k)=>{ghand[i]=cs[k]});send({t:"cards",cards:cs.map(pub)});
    guestDrew=true;oppDiscard(rep);specPush();hostMaybeReveal()}break;
  case"holds":if(net.role==="host"&&Array.isArray(m.h)){guestHeld=m.h.slice(0,5).map(Boolean);specPush()}break;
  case"cards":if(net.onCards){const f=net.onCards;net.onCards=null;f(m.cards)}break;
  case"opdraw":oppDiscard(m.idx||[]);break;
  case"reveal":oppReveal=m.hand;if(meDrew)showdown(oppReveal);break;
  case"chat":if(typeof m.x==="string"&&rateOk("c",350)){chatAdd(OPP,clean2(m.x),false);sfxClick()}break;
  case"emote":if(EMOTES.includes(m.e)&&rateOk("e",350)){popEmote($("#av"),m.e);sfxFlip()}break;
  case"matchEnd":finishMatch();break;
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
 if(!sys){specChat.push({w:String(who).slice(0,20),x:String(text).slice(0,120)});if(specChat.length>40)specChat.shift();specPush()}
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
 enterGame(`Matched with ${OPP}! First to ${matchTarget||"infinite"} rounds. Press DEAL when you're ready.`,pic);
 $("#st").className=live?"":"bad";$("#st").textContent=`Playing against ${OPP} · ${matchTarget?`first to ${matchTarget} rounds`:`infinite rounds`} · both players press DEAL to start each round.`;
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
function regInfo(){return{hid:net.gp.id,host:myName,locked:!!(net.room&&net.room.pw),rounds:net.room&&Number.isFinite(+net.room.rounds)?+net.room.rounds:5}}
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
 else if(m.t==="reg"&&m.room&&typeof m.room.hid==="string"){net.regs.set(c,{hid:m.room.hid.slice(0,60),host:clean(m.room.host),locked:!!m.room.locked,rounds:Number.isFinite(+m.room.rounds)?Math.max(0,Math.min(1000,+m.room.rounds)):5});hubBroadcast()}
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
 c.on("data",async m=>{
  if(done||!m||m.t!=="hello")return;done=true;
  const deny=why=>{try{c.send({t:"deny",why})}catch(e){}setTimeout(()=>{try{c.close()}catch(e){}},400)};
  if(net.conn||!net.room)return deny("full");
  if(net.room.pw&&m.pw!==net.room.pw)return deny("password");
  if(await getBan(String(m.did||"").slice(0,30)))return deny("banned"); // banned accounts can't join anyone's room
  if(net.conn||!net.room)return deny("full"); // somebody else got in while we were checking
  setupConn(c,"host");unregRoom();net.room=null;onMsg(m);
 });
}
function setRooms(list){
 const me=net.gp&&net.gp.id;net.rooms=(list||[]).filter(r=>r&&r.hid&&r.hid!==me);
 renderRooms();
 if(net.stage==="entering"&&net.gp){net.stage="lobby";showLobby()}
}
function renderRooms(){
 for(const id of["rlist","rlist2"]){
  const box=$("#"+id);box.textContent="";
  if(!net.rooms.length&&id==="rlist"){const d=document.createElement("div");d.className="rempty";d.textContent="No open rooms right now.";box.appendChild(d)}
  net.rooms.forEach(r=>{const d=document.createElement("div");d.className="room";
   const n=document.createElement("span");n.className="rn";n.textContent=(r.locked?"🔒 ":"")+r.host+"'s room · "+(r.rounds===0?"∞ rounds":r.rounds+" rounds");
   const b=document.createElement("button");b.className="btn sm go";b.textContent="JOIN";b.onclick=()=>{sfxClick();tryJoin(r)};
   d.append(n,b);box.appendChild(d)});
 }
 $("#w2").hidden=!net.rooms.length;
}
function showLobby(){net.stage="lobby";$("#jpw").hidden=true;scr("m-lobby");renderRooms()}
function createRoom(pw,rounds){
 matchTarget=Number.isFinite(+rounds)?Math.max(0,Math.min(1000,+rounds)):selectedRounds("#lobbyRounds");roundsPlayed=0;
 net.room={pw:pw||"",rounds:matchTarget};net.stage="room";
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
 c.on("open",()=>{net.connecting=null;c.send({t:"hello",name:myName,pic:myPic,did:myId,pw})});
 c.on("data",m=>{if(m&&m.t==="deny")joinFail(m.why==="password"?"Wrong password.":m.why==="banned"?"You can't join this game.":"That room is full or busy.")});
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
 say(msg);$("#go").disabled=false;rstage="idle";specPush();
}
let dcPic=null,dcUser=null;
// ---- Global leaderboard (wins against other players; bot games never count)
const LB=LEADERBOARD_DB.replace(/\/+$/,"");let lbMe=null,lbBusy=false,lbHidden=false;
const okAv=u=>typeof u==="string"&&/^https:\/\/cdn\.discordapp\.com\//.test(u);
async function lbCall(path,method,body,ms){
 const c=new AbortController(),t=setTimeout(()=>c.abort(),ms||8000);
 try{const r=await fetch(LB+path,{method,signal:c.signal,body:body?JSON.stringify(body):undefined});if(!r.ok)throw new Error("HTTP "+r.status);return await r.json()}
 finally{clearTimeout(t)}
}
// Public showcase of Ethereal/Apex cards awarded by admins.
let cardFeed=[],cardFeedIndex=0,cardFeedTimer=null,cardFeedRefreshTimer=null;
async function feedRefresh(){
 if(!LB)return;
 try{
  const raw=await lbCall("/cardfeed.json","GET",null,6000);
  cardFeed=Object.values(raw||{}).filter(x=>x&&(+x.position<=19)&&(+x.position>0)&&x.name&&x.player)
   .sort((a,b)=>(+b.ts||0)-(+a.ts||0)).slice(0,40);
  if(cardFeedIndex>=cardFeed.length)cardFeedIndex=0;
  feedPaint();
 }catch(e){/* The feed is an optional menu feature; keep the menu usable if it is unavailable. */}
}
function feedPaint(){
 const empty=$("#feedempty"),item=$("#feeditem");
 if(!cardFeed.length){empty.hidden=false;item.hidden=true;return}
 empty.hidden=true;item.hidden=false;
 const a=cardFeed[cardFeedIndex%cardFeed.length],tier=TIERS[tierOf(+a.position)];
 $("#feedwho").textContent=String(a.player).slice(0,32)+" got:";
 $("#feedmeta").textContent="#"+a.position+" · "+tier.n;
 const box=$("#feedcard");box.replaceChildren();box.style.borderColor=tier.c;
 const bg=document.createElement("div");bg.className="fbg";bg.style.background=`linear-gradient(135deg,${tier.c},#2b1850)`;
 const pos=document.createElement("b");pos.className="fpos";pos.textContent="#"+a.position;
 const nm=document.createElement("b");nm.className="fname";nm.textContent=a.name;
 const tr=document.createElement("b");tr.className="ftier";tr.textContent=tier.n;
 box.append(bg,pos);
 if(a.yt){const im=document.createElement("img");im.className="fimg";im.alt="";im.referrerPolicy="no-referrer";im.src=`https://i.ytimg.com/vi/${encodeURIComponent(a.yt)}/mqdefault.jpg`;im.onerror=()=>im.remove();box.append(im)}
 box.append(nm,tr);
}
function feedStart(){feedRefresh();if(cardFeedTimer)clearInterval(cardFeedTimer);if(cardFeedRefreshTimer)clearInterval(cardFeedRefreshTimer);cardFeedTimer=setInterval(()=>{if(cardFeed.length){cardFeedIndex=(cardFeedIndex+1)%cardFeed.length;feedPaint()}},5000);cardFeedRefreshTimer=setInterval(feedRefresh,60000)}
function lbRow(rank,p,me){
 const d=document.createElement("div");d.className="lbr"+(me?" me":"");
 const k=document.createElement("span");k.className="k";k.textContent="#"+rank;
 const im=document.createElement("img");im.alt="";im.src=okAv(p.av)?p.av:"assets/dealer.png";
 const n=document.createElement("span");n.className="n";n.textContent=p.name;
 const w=document.createElement("span");w.className="w";w.textContent=p.wins+(p.wins===1?" win":" wins");
 d.append(k,im,n,w);return d;
}
async function lbRefresh(){
 const box=$("#lblist");
 if(!LB){box.innerHTML='<div class="rempty">Leaderboard not set up yet. Add your database URL at the top of script.js.</div>';return}
 if(lbBusy||!dcUser)return;lbBusy=true;
 try{
  const raw=await lbCall("/players.json","GET")||{};
  const mineRaw=raw[myId]&&typeof raw[myId]==="object"?raw[myId]:null;lbHidden=!!(mineRaw&&mineRaw.hidden===true);
  const all=Object.entries(raw).filter(([id,p])=>p&&typeof p.name==="string"&&Number.isFinite(+p.wins)&&+p.wins>0&&p.hidden!==true)
   .map(([id,p])=>({id,name:p.name.slice(0,14),av:p.av,wins:+p.wins})).sort((a,b)=>b.wins-a.wins||a.name.localeCompare(b.name));
  const rank=p=>1+all.filter(x=>x.wins>p.wins).length;
  box.textContent="";
  if(!all.length)box.innerHTML='<div class="rempty">No wins yet. Beat a player to get on the board!</div>';
  let shown=false;all.slice(0,10).forEach(p=>{const me=p.id===myId;shown=shown||me;box.appendChild(lbRow(rank(p),p,me))});
  const mine=all.find(p=>p.id===myId);
  if(mine&&!shown){const g=document.createElement("div");g.className="lbr gap";g.textContent="⋯";box.append(g,lbRow(rank(mine),mine,true))}
  lbMe={wins:mineRaw&&Number.isFinite(+mineRaw.wins)?+mineRaw.wins:0};
  $("#mywins").textContent=lbMe.wins;
  $("#myrank").textContent=lbHidden?"Hidden":mine?`#${rank(mine)} of ${all.length}`:"Unranked";
  syncSettings();
 }catch(e){box.innerHTML='<div class="rempty">Couldn\'t load the leaderboard ('+(e.name==="AbortError"?"timed out":e.message)+').</div>'}
 lbBusy=false;
}
// ---- Usernames: chosen by the player (never taken from Discord), unique (ignoring case) and changeable any time in Account settings.
// The name lives on the leaderboard record (/players/<discordId>/name), so it follows the player to other browsers.
const NAME_RE=/^[A-Za-z0-9_.-]{3,14}$/,NAME_RESERVED=["admin","administrator","moderator","mod","dealer","player","system","you"];
function nameProblem(n){
 if(!NAME_RE.test(n))return "Use 3–14 letters, numbers, _ . or - (no spaces).";
 if(NAME_RESERVED.includes(n.toLowerCase()))return "That name is reserved. Pick another.";
 return "";
}
async function saveName(n){ // validates, checks nobody else has it, stores it on the leaderboard. Returns "" on success or a message.
 const bad=nameProblem(n);if(bad)return bad;
 if(!dcUser)return "Log in first.";
 if(LB){
  try{
   const raw=await lbCall("/players.json","GET")||{},low=n.toLowerCase();
   if(Object.entries(raw).some(([id,p])=>id!==myId&&p&&typeof p.name==="string"&&p.name.toLowerCase()===low))return "That username is taken. Try another.";
   const b={name:n};if(okAv(dcUser.avatar))b.av=dcUser.avatar;
   await lbCall("/players/"+encodeURIComponent(myId)+".json","PATCH",b);
  }catch(e){return "Couldn't save your username ("+(e.name==="AbortError"?"timed out":e.message)+"). Try again."}
 }
 return "";
}
function applyName(n){ // the username changed: update everything that shows or sends it
 if(!dcUser)return;
 dcUser.name=myName=n;store.set("dpp_dc",JSON.stringify(dcUser));
 $("#dcname").textContent=n;syncSettings();
}
let lbStarted=false;
async function lbStart(){ // once per page load: sync my name/avatar with the board, then load it
 if(lbStarted||!LB||!dcUser||!dcUser.name)return;lbStarted=true;
 try{
  const path="/players/"+encodeURIComponent(myId);
  const cur=await lbCall(path+"/name.json","GET");
  if(typeof cur==="string"&&cur.trim()&&clean(cur)!==dcUser.name)applyName(clean(cur)); // renamed on another device: the board is the source of truth
  const b={name:dcUser.name};if(okAv(dcUser.avatar))b.av=dcUser.avatar;await lbCall(path+".json","PATCH",b);
 }catch(e){}
 lbRefresh();
}
async function recordWin(){
 if(!LB||!dcUser||!oppId||oppId===myId)return; // no backend, or playing yourself in two tabs
 try{const b={name:dcUser.name,wins:{".sv":{increment:Math.round(Math.max(1,pwE("winMult")))}}};if(okAv(dcUser.avatar))b.av=dcUser.avatar;
  await lbCall("/players/"+encodeURIComponent(myId)+".json","PATCH",b);lbRefresh()}catch(e){}
}
$("#lbref").onclick=()=>{sfxClick();if(!LB)return lbRefresh();lbStarted=true;lbRefresh()};

// ================= ADMIN-CONTROLLED FEATURES (see admin.html) =================
// The admin panel writes to the same Firebase database as the leaderboard:
//   /bans/<discordId>          banned accounts
//   /config/power              the active power hour
//   /grants/<discordId>/<id>   cards queued for a player's next round
//   /live/<matchId>            written by games so the admin can watch them (only the admin can read it)
const fbp=(...a)=>"/"+a.map(x=>encodeURIComponent(x)).join("/")+".json";
const rnd=a=>a[Math.random()*a.length|0],roll=p=>Math.random()*100<p,clamp=(v,a,b)=>Math.min(b,Math.max(a,+v||0));

// ---- Bans: checked at login, every minute while playing, and by a room's host before letting someone in
let banState="checking";
async function getBan(id){
 if(!LB||!id)return null;
 try{const b=await lbCall(fbp("bans",id),"GET",null,5000);return b?(typeof b==="object"?b:{}):null}catch(e){return null}
}
function showBanned(b){banState="banned";$("#banwhy").textContent=b&&b.reason?"Reason: "+String(b.reason).slice(0,200):"";scr("m-banned")}
$("#banout").onclick=()=>$("#dcout").click();
setInterval(async()=>{if(!dcUser||banState==="banned")return;if(await getBan(myId)){sayBye();location.reload()}},60000);

// ---- Power hours: a timed bonus for everybody, shown as a banner
let power=null;
const pwOn=()=>!!(power&&power.endsAt>Date.now());
const pwE=k=>pwOn()?(+(power.effects&&power.effects[k])||0):0;
async function pwFetch(){
 if(!LB)return;
 try{const p=await lbCall("/config/power.json","GET",null,5000);
  if(p&&typeof p==="object"&&Number.isFinite(+p.endsAt)){const e=p.effects||{};
   power={name:String(p.name||"Bonus").slice(0,30),endsAt:+p.endsAt,effects:{apexPct:clamp(e.apexPct,0,100),matchPct:clamp(e.matchPct,0,100),rarePct:clamp(e.rarePct,0,100),payMult:clamp(e.payMult,1,10),winMult:Math.round(clamp(e.winMult,1,5))}}}
  else power=null}catch(e){}
 pwPaint();
}
function pwPaint(){
 const el=$("#pwr");if(!pwOn()){el.hidden=true;return}
 const e=power.effects,o=[];
 if(e.apexPct>0)o.push(`#1 card ${e.apexPct}% per hand`);if(e.matchPct>0)o.push(`matches +${e.matchPct}%`);if(e.rarePct>0)o.push(`rare cards +${e.rarePct}%`);
 if(e.payMult>1)o.push(`payouts ×${e.payMult}`);if(e.winMult>1)o.push(`leaderboard wins ×${e.winMult}`);
 const s=Math.max(0,Math.round((power.endsAt-Date.now())/1000));
 el.hidden=false;el.textContent=`⚡ POWER HOUR: ${power.name}${o.length?" — "+o.join(" · "):""} — ${s/60|0}:${String(s%60).padStart(2,"0")} left`;
}
pwFetch();setInterval(pwFetch,30000);setInterval(pwPaint,1000);

// Power hour card tweaks. h = the 5-card hand, free = the slots that may be changed. Cards are only ever swapped with the undealt deck, so there are never duplicates.
function powerHand(h,free){
 const back=c=>deck.splice(Math.random()*(deck.length+1)|0,0,c);
 const pull=f=>{const i=deck.findIndex(f);return i<0?null:deck.splice(i,1)[0]};
 const swap=(i,c)=>{back(h[i]);h[i]=c};
 const rare=pwE("rarePct"),match=pwE("matchPct"),apex=pwE("apexPct");
 if(rare)free.forEach(i=>{if(h[i].position>1&&roll(rare)){const c=pull(x=>x.position>1&&tierOf(x.position)>=3);if(c)swap(i,c)}}); // Epic or better
 if(match&&roll(match)){ // grow the biggest group of same-rarity cards by one
  const cnt={};h.forEach(c=>{const t=tierOf(c.position);cnt[t]=(cnt[t]||0)+1});
  const groups=Object.entries(cnt).map(([t,n])=>[+t,n]).filter(g=>g[0]<7&&g[1]<4).sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
  for(const[t]of groups){
   const slots=free.filter(i=>tierOf(h[i].position)!==t&&h[i].position!==1);if(!slots.length)continue;
   const c=pull(x=>tierOf(x.position)===t&&x.position!==1);if(!c)continue;
   swap(rnd(slots),c);break}
 }
 if(apex&&roll(apex)&&free.length&&!h.some(c=>c.position===1)){const c=pull(x=>x.position===1);if(c)swap(rnd(free),c)}
}
// New cards for a draw (power hour applies to the final hand; only the replaced slots can change)
function drawNew(h,rep,boost){
 const cs=rep.map(()=>deck.shift());
 if(!boost||!pwOn()||!rep.length)return cs;
 const fin=h.slice();rep.forEach((i,k)=>{fin[i]=cs[k]});powerHand(fin,rep);return rep.map(i=>fin[i]);
}
// Luck gently changes rarity and matching odds ONLY in slots being dealt/re-dealt.
// A kept card is immutable: this function never swaps or replaces a slot outside `eligibleSlots`.
function tuneLuck(h,luck,eligibleSlots){
 if(!h||!deck.length||luck==="normal")return h;
 const eligible=new Set((eligibleSlots||h.map((_,i)=>i)).filter(i=>Number.isInteger(i)&&i>=0&&i<h.length));
 if(!eligible.size)return h;
 const pull=fn=>{const i=deck.findIndex(fn);return i<0?null:deck.splice(i,1)[0]};
 const replace=(slot,fn)=>{
  if(!eligible.has(slot))return false;
  const c=pull(fn);if(!c)return false;
  deck.push(h[slot]);h[slot]=c;return true;
 };
 const counts=()=>{const o={};h.forEach(c=>{const t=tierOf(c.position);o[t]=(o[t]||0)+1});return o};
 const slots=[...eligible];
 if(luck==="good"){
  // Improve rarity only among cards that were just dealt into replaceable slots.
  const rareSlots=slots.filter(i=>h[i].position>1&&tierOf(h[i].position)<3);
  if(rareSlots.length&&Math.random()<.62)replace(rnd(rareSlots),c=>c.position>1&&tierOf(c.position)>=3);
  // Match a kept group by changing only one of the newly dealt slots.
  const ct=counts(),group=Object.entries(ct).filter(([t,n])=>+t<7&&n>=2&&n<4).sort((a,b)=>b[1]-a[1]);
  if(group.length&&Math.random()<.72){
   const t=+group[0][0],matchSlots=slots.filter(i=>tierOf(h[i].position)!==t&&h[i].position!==1);
   if(matchSlots.length)replace(rnd(matchSlots),c=>tierOf(c.position)===t&&c.position!==1);
  }else if(!group.length&&Math.random()<.38){
   const candidates=h.filter(c=>c.position!==1);if(candidates.length){
    const target=candidates[rnd(candidates.length)],matchSlots=slots.filter(i=>h[i].position!==1);
    if(matchSlots.length)replace(rnd(matchSlots),c=>tierOf(c.position)===tierOf(target)&&c.position!==1);
   }
  }
 }else{
  // Bad luck can lower rarity or weaken a match only in newly dealt slots.
  const rareSlots=slots.filter(i=>h[i].position>1&&tierOf(h[i].position)>=3);
  if(rareSlots.length&&Math.random()<.68)replace(rnd(rareSlots),c=>c.position>=750);
  const ct=counts(),group=Object.entries(ct).filter(([t,n])=>+t<7&&n>=2).sort((a,b)=>b[1]-a[1]);
  if(group.length&&Math.random()<.58){
   const t=+group[0][0],groupSlots=slots.filter(i=>tierOf(h[i].position)===t&&h[i].position!==1);
   if(groupSlots.length)replace(rnd(groupSlots),c=>tierOf(c.position)!==t&&c.position>=500);
  }
 }
 return h;
}

// ---- Card grants: the admin queues cards for a player; their next dealt round uses the oldest unused grant
async function takeGrant(uid){
 if(!LB||!uid)return null;
 try{const all=await lbCall(fbp("grants",uid),"GET",null,2500);if(!all||typeof all!=="object")return null;
  const g=Object.entries(all).filter(([k,v])=>v&&!v.used&&Array.isArray(v.cards)).sort((a,b)=>(a[1].ts||0)-(b[1].ts||0))[0];
  if(!g)return null;
  await lbCall("/grants/"+encodeURIComponent(uid)+"/"+encodeURIComponent(g[0])+"/used.json","PUT",true,2500);
  return g[1].cards.slice(0,5);
 }catch(e){return null}
}
const findLevel=g=>g&&(levels.find(l=>String(l.id)===String(g.id))||levels.find(l=>l.name===g.name))||null;
// Deals two 5-card hands from `deck`. Granted cards go into the player's hand (pulled out of the deck or the other hand so nobody holds a duplicate); otherwise the power hour may tweak the hand.
async function dealRig(idA,idB,boostA,boostB){
 const H=[deck.splice(0,5),deck.splice(0,5)],kept=[new Set(),new Set()],boost=[boostA,boostB];
 const gs=await Promise.all([idA,idB].map(takeGrant));
 H.forEach((h,p)=>{
  const g=gs[p];
  if(!g||!g.length){if(boost[p]&&pwOn())powerHand(h,[0,1,2,3,4]);return}
  g.forEach(gc=>{
   const c=findLevel(gc);if(!c||kept[p].size>=5)return;
   const at=h.indexOf(c);if(at>=0){kept[p].add(at);return}
   const d=deck.indexOf(c),o=H[1-p],oi=o.indexOf(c);
   if(d>=0)deck.splice(d,1);else if(oi>=0&&!kept[1-p].has(oi))o[oi]=deck.shift();else return;
   const slot=[0,1,2,3,4].find(i=>!kept[p].has(i));
   deck.splice(Math.random()*(deck.length+1)|0,0,h[slot]);h[slot]=c;kept[p].add(slot)});
 });
 return H;
}

// ---- Live spectating: the game publishes its table to /live/<id> so the admin panel can watch it
const SPEC_ID=Array.from(crypto.getRandomValues(new Uint8Array(12)),x=>(x%36).toString(36)).join("");
let rstage="menu",lastRes="",specChat=[],guestHeld=[],specTimer=0,specOn=false;
const pubS=c=>c?{n:String(c.name).slice(0,40),p:c.position,y:c.yt||null,i:String(c.id)}:null;
function specBody(){
 const pvp=mode==="pvp";
 return{mode,diff:pvp?null:diff,stage:rstage,bet,res:lastRes.slice(0,120),chat:specChat.slice(-20),
  a:{id:myId,name:myName,hand:hand.map(pubS),held:held.slice(),coins},
  b:{id:pvp?oppId:"",name:OPP,hand:(pvp?ghand:dhand).map(pubS),held:pvp?guestHeld:[]},
  ts:{".sv":"timestamp"}};
}
function specPush(){ // debounced; in PvP only the host publishes (it knows both hands)
 if(adminEnded||!LB||!dcUser||rstage==="menu"||(mode==="pvp"&&net.role!=="host"))return;
 clearTimeout(specTimer);specTimer=setTimeout(()=>{specOn=true;lbCall(fbp("live",SPEC_ID),"PUT",specBody(),4000).catch(()=>{})},300);
}
const specHolds=()=>{if(mode==="pvp"&&net.role==="guest")send({t:"holds",h:held});else specPush()};
let adminEndCheckBusy=false,adminEnded=false;
function handleAdminGameEnd(){
 if(adminEnded)return;adminEnded=true;specOn=false;clearTimeout(specTimer);
 // Tell the other PvP player to leave too, then close the peer connection.
 if(net.started){try{send({t:"bye"})}catch(e){}net.started=false;clearInterval(net.hb);try{net.conn&&net.conn.close()}catch(e){}}
 showOv("An admin ended this game.","click to return to the menu",()=>location.reload());
 setTimeout(()=>location.reload(),5000);
}
async function checkAdminGameEnd(){
 if(adminEndCheckBusy||adminEnded||!LB||!dcUser||rstage==="menu")return;
 adminEndCheckBusy=true;
 try{if(await lbCall(fbp("ended",SPEC_ID),"GET",null,4000)===true)handleAdminGameEnd()}
 catch(e){}finally{adminEndCheckBusy=false}
}
setInterval(()=>{if(specOn)specPush()},20000); // heartbeat so the admin can tell live games from stale ones
setInterval(checkAdminGameEnd,1500); // watch for an admin termination signal while in a game
addEventListener("pagehide",()=>{if(!specOn)return;specOn=false;try{fetch(LB+fbp("live",SPEC_ID),{method:"DELETE",keepalive:true})}catch(e){}});
// ---- Account settings screen
const MOT_KEY="dpp_motion",DATA_KEYS=["dpp_dc","dpp_sfx","dpp_mus",MOT_KEY];
const mq=window.matchMedia?matchMedia("(prefers-reduced-motion: reduce)"):null;
function applyMotion(){
 const m=store.get(MOT_KEY)||"auto",el=document.documentElement;
 el.dataset.motion=m;el.toggleAttribute("data-reduce",m==="reduce"||(m==="auto"&&!!(mq&&mq.matches)));
}
applyMotion();if(mq&&mq.addEventListener)mq.addEventListener("change",applyMotion);
function syncSettings(){
 if(!dcUser)return;
 $("#sname").textContent=dcUser.name;$("#sav").src=dcUser.avatar||"assets/dealer.png";$("#sdelname").textContent=dcUser.name;
 $("#ssfx").value=$("#sfxv").value;$("#ssfxv").textContent=$("#sfxv").value+"%";
 $("#smus").value=$("#musv").value;$("#smusv").textContent=$("#musv").value+"%";
 $("#smot").value=store.get(MOT_KEY)||"auto";
 const hb=$("#shide");hb.checked=!lbHidden;hb.disabled=!LB;
 $("#shidenote").textContent=LB?"Turn off to hide your name and wins from other players. Your wins are still counted.":"Leaderboard isn't set up yet.";
}
const serr=t=>{$("#serr").textContent=t||""};
const sunMsg=(t,ok)=>{const m=$("#sunmsg");m.textContent=t||"";m.className=ok?"err ok":"err"};
$("#sunform").onsubmit=async e=>{
 e.preventDefault();if(!dcUser)return;
 const n=$("#sun").value.trim();
 if(n===dcUser.name)return sunMsg("That's already your username.",false);
 sfxClick();$("#sunsave").disabled=true;sunMsg("Checking…",true);
 const err=await saveName(n);$("#sunsave").disabled=false;
 if(err)return sunMsg(err,false);
 applyName(n);$("#sun").value=n;sunMsg("Username changed to "+n+".",true);lbBusy=false;lbRefresh();
};
$("#setopen").onclick=()=>{sfxClick();syncSettings();serr("");sunMsg("");$("#sun").value=dcUser?dcUser.name:"";$("#sdelin").value="";$("#sdel").disabled=true;$("#set").hidden=false;$("#set").scrollTop=0};
$("#setback").onclick=()=>{sfxClick();$("#set").hidden=true};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#set").hidden&&!cf.classList.contains("on"))$("#set").hidden=true});
for(const[a,b]of[["ssfx","sfxv"],["smus","musv"]])$("#"+a).oninput=e=>{$("#"+b).value=e.target.value;$("#"+b).dispatchEvent(new Event("input"));$("#"+a+"v").textContent=e.target.value+"%"};
$("#ssfx").onchange=()=>sfxClick();
$("#smot").onchange=e=>{store.set(MOT_KEY,e.target.value);applyMotion()};
$("#stest").onclick=()=>{sfxWin();setTimeout(sfxFlip,900)};
$("#shide").onchange=async e=>{
 if(!LB||!dcUser)return;const show=e.target.checked;serr("");
 try{await lbCall("/players/"+encodeURIComponent(myId)+".json","PATCH",{name:dcUser.name,hidden:!show});lbHidden=!show;lbBusy=false;lbRefresh()}
 catch(err){e.target.checked=!show;serr("Couldn't save that: "+err.message)}
};
$("#srefresh").onclick=()=>{sfxClick();startDiscord()};
$("#sdata").onclick=async()=>{
 sfxClick();serr("");if(!dcUser)return;
 const out={exportedAt:new Date().toISOString(),username:dcUser.name,discord:{id:dcUser.id,avatar:dcUser.avatar},
  settings:{sfxVolume:+$("#sfxv").value,musicVolume:+$("#musv").value,reducedMotion:store.get(MOT_KEY)||"auto"},leaderboard:null};
 if(LB){try{out.leaderboard=await lbCall("/players/"+encodeURIComponent(myId)+".json","GET")}catch(e){serr("Couldn't fetch your leaderboard data, so the file doesn't include it ("+e.message+").")}}
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:"application/json"}));
 a.download="demon-picture-poker-data.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
};
$("#sdelin").oninput=e=>{$("#sdel").disabled=!dcUser||e.target.value!==dcUser.name};
$("#sdel").onclick=async()=>{
 if(!dcUser||$("#sdelin").value!==dcUser.name)return;sfxClick();serr("");$("#sdel").disabled=true;
 try{if(LB)await lbCall("/players/"+encodeURIComponent(myId)+".json","DELETE")}
 catch(e){serr("Couldn't delete your leaderboard entry ("+e.message+"). Nothing was deleted, try again.");$("#sdel").disabled=false;return}
 DATA_KEYS.forEach(store.del);
 location.reload();
};
// ---- Discord login (OAuth2 implicit flow, "identify" scope only; the token is used once and never stored)
const dcErr=t=>{$("#dcerr").textContent=t||""};
function dcShow(){ // logged in -> main menu, otherwise the login screen
 const u=dcUser;myPic=dcPic;myName=u&&u.name?u.name:"You";myId=u?u.id:"";
 if(u){$("#dcname").textContent=u.name;$("#dcav").src=u.avatar||"assets/dealer.png";feedStart();banState="checking";
  getBan(u.id).then(b=>{if(dcUser!==u)return;if(b)showBanned(b);else{banState="ok";lbStart()}})}
 if(u&&!u.name){$("#nmin").value="";nmErr("");setTimeout(()=>$("#nmin").focus(),50)} // first login: pick a username
 scr(!u?"m-login":u.name?"m-main":"m-name");
}
const nmErr=t=>{$("#nmerr").textContent=t||""};
$("#nmform").onsubmit=async e=>{
 e.preventDefault();if(!dcUser||dcUser.name||banState==="banned")return;
 sfxClick();nmErr("");$("#nmgo").disabled=true;
 const n=$("#nmin").value.trim(),err=await saveName(n);$("#nmgo").disabled=false;
 if(err)return nmErr(err);
 if(LB){try{await lbCall("/deleted/"+encodeURIComponent(myId)+".json","DELETE")}catch(e){}}
 applyName(n);scr("m-main");lbStart();
};
$("#nmout").onclick=()=>$("#dcout").click();
function dcApply(u){dcUser=u;dcPic=goodPic(u.pic);dcShow()}
function avatarData(url){return new Promise((res,rej)=>{const im=new Image();im.crossOrigin="anonymous";
 im.onload=()=>{const o=document.createElement("canvas");o.width=o.height=160;o.getContext("2d").drawImage(im,0,0,160,160);try{res(o.toDataURL("image/jpeg",.88))}catch(e){rej(e)}};
 im.onerror=()=>rej(new Error("avatar"));im.src=url})}
async function dcFinish(token){
 $("#dcin").disabled=true;
 try{
  const r=await fetch("https://discord.com/api/users/@me",{headers:{Authorization:"Bearer "+token}});
  if(!r.ok)throw new Error("HTTP "+r.status);const j=await r.json();
  const id=String(j.id),av=j.avatar?`https://cdn.discordapp.com/avatars/${id}/${j.avatar}.png?size=128`:`https://cdn.discordapp.com/embed/avatars/${Number((BigInt(id)>>22n)%6n)}.png`;
  let pic=null;try{pic=await avatarData(av)}catch(e){}
  // The username is the player's own choice, not their Discord name. Reuse the one this browser remembers,
  // let the leaderboard record (the source of truth) override it, and send brand-new players to the "choose a username" screen.
  let name="";try{const o=JSON.parse(store.get("dpp_dc"));if(o&&String(o.id)===id&&o.name)name=clean(o.name)}catch(e){}
  if(LB){
   try{const cur=await lbCall("/players/"+encodeURIComponent(id)+"/name.json","GET");if(typeof cur==="string"&&cur.trim())name=clean(cur)}
   catch(e){if(!name)throw new Error("couldn't check for your username ("+(e.name==="AbortError"?"timed out":e.message)+")")}
  }
  const u={id,name,avatar:av,pic};
  store.set("dpp_dc",JSON.stringify(u));dcErr("");dcApply(u);
 }catch(e){dcErr("Discord login failed: "+(e.message||e))}
 $("#dcin").disabled=false;
}
function startDiscord(){
 if(!DISCORD_CLIENT_ID){dcErr("Discord login isn't set up yet: add your Client ID at the top of script.js.");return false}
 if(location.protocol==="file:"){dcErr("Discord login needs the game to be hosted (not opened as a file).");return false}
 const st=Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,"0")).join("");
 try{sessionStorage.setItem("dpp_state",st)}catch(e){}
 location.href="https://discord.com/oauth2/authorize?"+new URLSearchParams({client_id:DISCORD_CLIENT_ID,response_type:"token",scope:"identify",state:st,redirect_uri:location.origin+location.pathname});
 return true}
$("#dcin").onclick=()=>{sfxClick();startDiscord()};
$("#dcout").onclick=()=>{sfxClick();dcUser=dcPic=myPic=null;banState="checking";myId=myName="";lbMe=null;store.del("dpp_dc");dcErr("");scr("m-login")};
{ // coming back from Discord?
 const hp=new URLSearchParams(location.hash.slice(1)),tok=hp.get("access_token"),err=hp.get("error_description")||hp.get("error");
 if(tok||err){history.replaceState(null,"",location.pathname+location.search);
  let want=null;try{want=sessionStorage.getItem("dpp_state");sessionStorage.removeItem("dpp_state")}catch(e){}
  if(err)dcErr(err==="access_denied"?"Discord login was cancelled.":"Discord login failed: "+err);
  else if(!want||hp.get("state")!==want)dcErr("Discord login failed: security check didn't match. Try again.");
  else dcFinish(tok)}
 else{try{const u=JSON.parse(store.get("dpp_dc"));if(u&&u.id)dcApply({id:String(u.id),name:u.name?clean(u.name):"",avatar:/^https:\/\/cdn\.discordapp\.com\//.test(u.avatar)?u.avatar:"",pic:u.pic})}catch(e){}}
}
// the bot's dealer is a random character each time you start a bot game
const CHARS=[{n:"Shopkeeper",i:null},{n:"The Wizard Grandmaster",i:"assets/chars/wizard.png"},{n:"The Biger F",i:"assets/chars/biger-f.png"},{n:"Npesta",i:"assets/chars/npesta.png"}];
$("#mBot").onclick=()=>{if(banState==="banned")return;sfxClick();startMusic();scr("m-diff")};
$("#mBack3").onclick=()=>{sfxClick();scr("m-main")};
document.querySelectorAll(".dbtn").forEach(b=>b.onclick=async()=>{sfxClick();await ready;mode="bot";diff=b.dataset.d;
 matchTarget=selectedRounds("#botRounds");roundsPlayed=0;botLuck=luckName($("#botLuck").value);playerLuck=luckName($("#playerLuck").value);
 const c=CHARS[Math.random()*CHARS.length|0],D=DIFFS[diff];OPP=c.n;enterGame(`${OPP} is your dealer (${D.label}). First to ${matchTarget||"infinite"} rounds. Press DEAL to start.`,c.i,!!c.i);
 $("#dlbl").textContent=`${OPP}'s hand · ${D.label}`;
 if(live){$("#st").className="";$("#st").textContent=`Bot difficulty: ${D.label}. ${D.say}`}});
$("#mPvp").onclick=()=>{startMusic();goLobby()};
const goLobby=async()=>{
 if(!dcUser||banState==="banned")return;sfxClick();lobErr("");scr("m-wait");$("#wroom").hidden=true;$("#mwait").textContent="Loading the demon list…";await ready;$("#mwait").textContent="Connecting to the lobby…";if($("#m-wait").hidden)return;startLobby()};
$("#mBack2").onclick=()=>{sfxClick();netCleanup();scr("m-main");lbRefresh()};
$("#mCancel").onclick=()=>{sfxClick();
 if(net.room){unregRoom();net.room=null;showLobby()}else{netCleanup();scr("m-main")}};
$("#mklock").onchange=e=>{$("#mkpw").hidden=!e.target.checked;if(e.target.checked)$("#mkpw").focus()};
$("#mkgo").onclick=()=>{
 const pw=$("#mklock").checked?$("#mkpw").value.trim():"";
 if($("#mklock").checked&&!pw){$("#mkpw").focus();$("#mkpw").placeholder="Type a password!";return}
 sfxClick();createRoom(pw,selectedRounds("#lobbyRounds"))};
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
 if(phase==="busy"||banState==="banned")return;
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
 else if(/^[1-5]$/.test(e.key)&&!$("#ov").classList.contains("on")){const c=pEls[+e.key-1];if(c&&c._toggleCard)c._toggleCard()}
});
document.addEventListener("keyup",e=>{if(e.code==="Space"&&!(e.target.tagName==="INPUT"))e.preventDefault()});
$("#mBot").disabled=$("#mPvp").disabled=false;$("#mload").textContent="Loading the demon list…";
ready=load().catch(e=>{levels=FB.map((n,i)=>({id:"f"+i,name:n,position:FBP[i]}));$("#mload").textContent="Offline demo mode"});


/* ---------- ADMIN CONFIG POLLING: MAINTENANCE, CACHE CLEAR & ACCOUNT DELETION ---------- */
(function initSiteControlWatcher(){
 const VER_KEY="gdpoker_cache_ver";
 let wasLocked=false;
 let savedMenuEl=null;
 let menuPlaceholder=null;

 function applyMaintenanceState(locked){
  const lockEl=document.getElementById("maint-lock");
  if(lockEl){
   lockEl.hidden=!locked;
   lockEl.style.display=locked?"flex":"none";
  }
  if(locked){
   const menuEl=document.getElementById("menu");
   if(menuEl){
    menuEl.hidden=true;
    menuEl.style.display="none";
    if(!savedMenuEl){
     savedMenuEl=menuEl;
     menuPlaceholder=document.createComment("menu-unloaded");
     if(menuEl.parentNode)menuEl.parentNode.replaceChild(menuPlaceholder,menuEl);
    }
   }

  }else{
   if(savedMenuEl&&menuPlaceholder&&menuPlaceholder.parentNode){
    menuPlaceholder.parentNode.replaceChild(savedMenuEl,menuPlaceholder);
    menuPlaceholder=null;
   }
   const menuEl=savedMenuEl||document.getElementById("menu");
   if(menuEl){
    menuEl.hidden=false;
    menuEl.style.display="";
   }
   savedMenuEl=null;
  }
  wasLocked=locked;
 }

 // Disabled by default on initial load
 applyMaintenanceState(false);

 async function checkSiteControl(){
  try{
   const r=await fetch(`${LEADERBOARD_DB}/config.json?t=${Date.now()}`,{cache:"no-store"});
   if(!r.ok)return;
   const cfg=(await r.json())||{};

   // 1. Maintenance lock (default false unless strictly true)
   const locked=cfg.maintenance===true;
   applyMaintenanceState(locked);

   // 2. Remote cache clear
   if(cfg.cacheVersion){
    const remoteVer=String(cfg.cacheVersion);
    const localVer=store.get(VER_KEY);
    if(!localVer){
     store.set(VER_KEY,remoteVer);
    }else if(localVer!==remoteVer){
     store.set(VER_KEY,remoteVer);
     if("caches"in window){
      const keys=await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
     }
     if("serviceWorker"in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(reg=>reg.unregister()));
     }
     const u=new URL(location.href);
     u.searchParams.set("v",remoteVer);
     location.replace(u.toString());
     return;
    }
   }

   // 3. Kick logged-in user if admin deleted their account
   if(myId){
    const dr=await fetch(`${LEADERBOARD_DB}/deleted/${encodeURIComponent(myId)}.json?t=${Date.now()}`,{cache:"no-store"});
    if(dr.ok&&(await dr.json())!==null){
     try{localStorage.clear();sessionStorage.clear();}catch(e){}
     location.reload();
    }
   }
  }catch(e){}
 }

 checkSiteControl();
 setInterval(checkSiteControl,5000);
})();
