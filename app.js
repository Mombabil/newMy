const STORAGE_KEY = "newmy_data_v1";
const PROGRAMS = {
  A: [
    {name:"Développé horizontal",sets:3,reps:10,group:"Pecs"},
    {name:"Poulie verticale",sets:3,reps:10,group:"Dos"},
    {name:"Presse à jambes",sets:3,reps:10,group:"Jambes"},
    {name:"Leg Curl",sets:2,reps:12,group:"Jambes"},
    {name:"Tirage horizontal",sets:2,reps:10,group:"Dos"},
    {name:"Abdos",sets:2,reps:12,group:"Gainage"}
  ],
  B: [
    {name:"Pec Deck",sets:2,reps:12,group:"Pecs"},
    {name:"Tirage horizontal",sets:3,reps:10,group:"Dos"},
    {name:"Presse à jambes",sets:3,reps:10,group:"Jambes"},
    {name:"Leg Curl",sets:2,reps:12,group:"Jambes"},
    {name:"Développé épaules",sets:2,reps:10,group:"Épaules"},
    {name:"Curl biceps poulie",sets:2,reps:12,group:"Bras"},
    {name:"Abdos",sets:2,reps:12,group:"Gainage"}
  ]
};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const todayISO = () => new Date().toISOString().slice(0,10);
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const defaultData = () => ({sessions:[],goal:3});
let data = loadData();
let workout = null;
let toastTimer;

function loadData(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultData();
    const parsed=JSON.parse(raw);
    if(!parsed || !Array.isArray(parsed.sessions)) return defaultData();
    return {sessions:parsed.sessions,goal:Number.isInteger(parsed.goal)?Math.min(7,Math.max(1,parsed.goal)):3};
  }catch(e){return defaultData();}
}
function saveData(){localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function formatDate(date){return new Date(date+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"});}
function shortDate(date){return new Date(date+"T12:00:00").toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"});}
function weekStart(d=new Date()){const x=new Date(d);x.setHours(0,0,0,0);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x;}
function isThisWeek(date){const d=new Date(date+"T12:00:00");return d>=weekStart() && d<new Date(weekStart().getTime()+7*86400000);}
function sessionVolume(s){return s.exercises.reduce((sum,e)=>sum+e.sets.filter(x=>x.done).reduce((a,x)=>a+(Number(x.weight)||0)*(Number(x.reps)||0),0),0);}
function totalDoneSets(s){return s.exercises.reduce((n,e)=>n+e.sets.filter(x=>x.done).length,0);}
function allExerciseNames(){return [...new Set(Object.values(PROGRAMS).flat().map(e=>e.name))];}
function latestForExercise(name){
  const sessions=[...data.sessions].sort((a,b)=>b.date.localeCompare(a.date));
  for(const s of sessions){const e=s.exercises.find(x=>x.name===name);if(e){const done=e.sets.filter(x=>x.done);if(done.length)return done[done.length-1].weight;}}
  return "";
}
function showToast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2300);}
function navigate(view){
  $$(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${view}`));
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.nav===view));
  if(view==="home")renderHome();if(view==="history")renderHistory();if(view==="progress")renderProgress();if(view==="settings")renderSettings();
  window.scrollTo({top:0,behavior:"smooth"});
}
$$("[data-nav]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.nav)));

function renderHome(){
  const count=data.sessions.filter(s=>isThisWeek(s.date)).length;
  const pct=Math.min(100,Math.round(count/data.goal*100));
  $("#todayLabel").textContent=new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"}).toUpperCase();
  $("#weekCount").textContent=count;$("#weekPercent").textContent=pct+"%";$("#weekBar").style.width=pct+"%";
  $("#weekRing").style.background=`conic-gradient(#fff ${pct*3.6}deg,#ffffff4a 0deg)`;
  $("#weekMessage").textContent=count>=data.goal?"Objectif atteint, bravo !":"Chaque séance compte.";
  $("#weekRemaining").textContent=count>=data.goal?"Objectif validé":`${data.goal-count} à faire`;
  $("#totalSessions").textContent=data.sessions.length;
  const volume=data.sessions.reduce((n,s)=>n+sessionVolume(s),0);
  $("#totalVolume").innerHTML=`${Math.round(volume).toLocaleString("fr-FR")} <em>kg</em>`;
  const last=[...data.sessions].sort((a,b)=>b.date.localeCompare(a.date))[0];
  $("#lastSessionBox").innerHTML=last?`<div class="last-card"><div><strong>Dernière séance · ${last.type}</strong><small>${formatDate(last.date)} · ${totalDoneSets(last)} séries validées</small></div><strong>${Math.round(sessionVolume(last)).toLocaleString("fr-FR")} kg</strong></div>`:`<div class="empty-mini"><span>✦</span><div><strong>Ton historique commence ici</strong><small>Enregistre ta première séance pour voir tes progrès.</small></div></div>`;
}
function startWorkout(type){
  workout={id:uid(),type,date:todayISO(),exercises:PROGRAMS[type].map(template=>({name:template.name,group:template.group,sets:Array.from({length:template.sets},()=>({weight:latestForExercise(template.name),reps:String(template.reps),done:false}))}))};
  $("#workoutTitle").textContent=`Séance ${type}`;
  $("#workoutDate").textContent=new Date().toLocaleDateString("fr-FR",{day:"numeric",month:"short"});
  $("#exerciseCount").textContent=`${workout.exercises.length} exercices`;
  renderWorkout();navigate("workout");
}
$$("[data-start]").forEach(b=>b.addEventListener("click",()=>startWorkout(b.dataset.start)));
function renderWorkout(){
  $("#exerciseList").innerHTML=workout.exercises.map((e,ei)=>`<article class="exercise-card" data-exercise="${ei}">
    <div class="exercise-head"><div><strong>${escapeHTML(e.name)}</strong><small>${escapeHTML(e.group)}</small></div><span class="exercise-tag">${e.sets.length} séries</span></div>
    <div class="set-head"><span>SÉRIE</span><span>POIDS (KG)</span><span>RÉPÉTITIONS</span><span></span></div>
    <div class="sets">${e.sets.map((s,si)=>setRow(s,ei,si)).join("")}</div>
    <button class="add-set" data-add="${ei}">＋ Ajouter une série</button>
  </article>`).join("");
  $$("#exerciseList input").forEach(input=>input.addEventListener("input",onSetInput));
  $$("#exerciseList .set-check").forEach(btn=>btn.addEventListener("click",()=>toggleSet(Number(btn.dataset.e),Number(btn.dataset.s))));
  $$("#exerciseList [data-add]").forEach(btn=>btn.addEventListener("click",()=>addSet(Number(btn.dataset.add))));
  updateWorkoutProgress();
}
function setRow(s,ei,si){return `<div class="set-row"><span class="set-number">${si+1}</span><input type="number" min="0" max="999" step="0.5" inputmode="decimal" placeholder="—" aria-label="Poids en kilogrammes" data-e="${ei}" data-s="${si}" data-field="weight" value="${escapeHTML(s.weight)}"><input type="number" min="1" max="100" step="1" inputmode="numeric" placeholder="12" aria-label="Répétitions" data-e="${ei}" data-s="${si}" data-field="reps" value="${escapeHTML(s.reps)}"><button class="set-check ${s.done?"done":""}" data-e="${ei}" data-s="${si}" aria-label="${s.done?"Série validée":"Valider la série"}">${s.done?"✓":"○"}</button></div>`;}
function onSetInput(ev){const i=Number(ev.target.dataset.e),j=Number(ev.target.dataset.s),field=ev.target.dataset.field;workout.exercises[i].sets[j][field]=ev.target.value;}
function toggleSet(i,j){
  const s=workout.exercises[i].sets[j];
  if(!s.weight || Number(s.weight)<0 || !s.reps || Number(s.reps)<1){showToast("Renseigne le poids et les répétitions.");return;}
  s.done=!s.done;renderWorkout();
}
function addSet(i){const prev=workout.exercises[i].sets.at(-1);workout.exercises[i].sets.push({weight:prev?.weight||"",reps:prev?.reps||"10",done:false});renderWorkout();}
function updateWorkoutProgress(){const done=workout.exercises.reduce((n,e)=>n+e.sets.filter(s=>s.done).length,0);const total=workout.exercises.reduce((n,e)=>n+e.sets.length,0);$("#workoutProgress").textContent=`${done} série${done>1?"s":""} validée${done>1?"s":""} sur ${total}`;}
$("#finishBtn").addEventListener("click",()=>{
  const completed=workout.exercises.map(e=>({...e,sets:e.sets.filter(s=>s.done).map(s=>({weight:Number(s.weight),reps:Number(s.reps),done:true}))})).filter(e=>e.sets.length);
  if(!completed.length){showToast("Valide au moins une série avant d'enregistrer.");return;}
  data.sessions.push({...workout,exercises:completed});
  saveData();workout=null;navigate("home");showToast("Séance enregistrée. Bien joué !");
});
$("#cancelWorkout").addEventListener("click",()=>{if(confirm("Abandonner cette séance ? Les saisies en cours seront perdues.")){workout=null;navigate("home");}});

function renderHistory(){
  const sorted=[...data.sessions].sort((a,b)=>b.date.localeCompare(a.date));
  $("#historySummary").innerHTML=`<div><strong>${data.sessions.length}</strong><small>Séances au total</small></div><div><strong>${Math.round(data.sessions.reduce((n,s)=>n+sessionVolume(s),0)).toLocaleString("fr-FR")}</strong><small>kg de volume cumulé</small></div>`;
  $("#historyList").innerHTML=sorted.length?sorted.map(s=>`<article class="history-item"><div class="history-main"><span class="history-letter ${s.type==="B"?"b":""}">${s.type}</span><div class="history-info"><strong>Full body ${s.type}</strong><small>${formatDate(s.date)} · ${s.exercises.length} exercices · ${totalDoneSets(s)} séries</small></div><div class="history-volume"><strong>${Math.round(sessionVolume(s)).toLocaleString("fr-FR")} kg</strong><small>volume estimé</small></div></div><div class="history-actions"><button data-detail="${s.id}">Détails</button><button class="delete-btn" data-delete="${s.id}">Supprimer</button></div></article>`).join(""):`<div class="empty-state"><span>▤</span><strong>Pas encore de séance</strong><p>Ta première séance apparaîtra ici une fois enregistrée.</p></div>`;
  $$("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteSession(b.dataset.delete)));
  $$("[data-detail]").forEach(b=>b.addEventListener("click",()=>showSessionDetail(b.dataset.detail)));
}
function deleteSession(id){if(!confirm("Supprimer définitivement cette séance ?"))return;data.sessions=data.sessions.filter(s=>s.id!==id);saveData();renderHistory();showToast("Séance supprimée.");}
function showSessionDetail(id){
  const s=data.sessions.find(x=>x.id===id);if(!s)return;
  const lines=s.exercises.map(e=>`${e.name} : ${e.sets.map(x=>`${x.weight} kg × ${x.reps}`).join(" · ")}`).join("\n");
  alert(`Séance ${s.type} — ${formatDate(s.date)}\n\n${lines}`);
}
function renderProgress(){
  const select=$("#progressExercise"),names=allExerciseNames();
  const current=select.value;
  select.innerHTML=names.map(n=>`<option value="${escapeHTML(n)}">${escapeHTML(n)}</option>`).join("");
  if(names.includes(current))select.value=current;
  drawProgress(select.value);
}
$("#progressExercise").addEventListener("change",e=>drawProgress(e.target.value));
function drawProgress(name){
  const entries=[];
  [...data.sessions].sort((a,b)=>a.date.localeCompare(b.date)).forEach(s=>{
    const ex=s.exercises.find(e=>e.name===name);if(!ex)return;
    const max=Math.max(...ex.sets.map(x=>Number(x.weight)||0));
    if(max>0)entries.push({date:s.date,weight:max});
  });
  const weights=entries.map(x=>x.weight),last=weights.at(-1),best=weights.length?Math.max(...weights):null;
  $("#latestWeight").textContent=last==null?"—":last;
  $("#bestWeight").textContent=best==null?"—":best;
  if(!entries.length){$("#progressChart").innerHTML="";$("#progressNote").textContent="Aucune donnée pour cet exercice. Enregistre une séance pour commencer le suivi.";return;}
  const max=Math.max(...weights,1);
  $("#progressChart").innerHTML=entries.slice(-12).map(x=>`<div class="bar-col"><span class="bar-value">${x.weight}</span><div class="bar" style="height:${Math.max(4,x.weight/max*100)}%"></div><span class="bar-date">${shortDate(x.date)}</span></div>`).join("");
  $("#progressNote").textContent=`${entries.length} séance${entries.length>1?"s":""} avec cet exercice. Charge maximale enregistrée : ${best} kg.`;
}
function renderSettings(){$("#goalValue").textContent=data.goal;}
$("#goalMinus").addEventListener("click",()=>changeGoal(-1));$("#goalPlus").addEventListener("click",()=>changeGoal(1));
function changeGoal(n){data.goal=Math.min(7,Math.max(1,data.goal+n));saveData();renderSettings();renderHome();}
$("#exportBtn").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify({app:"NewMy",version:1,exportedAt:new Date().toISOString(),data},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`newmy-sauvegarde-${todayISO()}.json`;a.click();URL.revokeObjectURL(url);$("#dataStatus").textContent="Sauvegarde exportée.";
});
$("#importFile").addEventListener("change",async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
    const parsed=JSON.parse(await file.text()),incoming=parsed.data||parsed;
    if(!Array.isArray(incoming.sessions))throw new Error("Format invalide");
    const valid=incoming.sessions.every(s=>s&&["A","B"].includes(s.type)&&typeof s.date==="string"&&Array.isArray(s.exercises));
    if(!valid)throw new Error("Données de séances invalides");
    if(!confirm(`Importer ${incoming.sessions.length} séance(s) ? Cela remplacera les données actuelles.`))return;
    data={sessions:incoming.sessions,goal:Math.min(7,Math.max(1,Number(incoming.goal)||3))};saveData();renderSettings();renderHome();$("#dataStatus").textContent="Sauvegarde importée avec succès.";showToast("Données restaurées.");
  }catch(err){$("#dataStatus").textContent="Impossible d'importer : fichier invalide.";showToast("Fichier de sauvegarde invalide.");}
  finally{e.target.value="";}
});

renderHome();
if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
let deferredPrompt;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("#installBtn").hidden=false;});
$("#installBtn").addEventListener("click",async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("#installBtn").hidden=true;});
