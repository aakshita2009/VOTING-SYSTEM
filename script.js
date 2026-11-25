const KEY="campusvote_v3";
const defaultState={
  title:"Student Council Election 2026",post:"President",open:true,live:false,
  password:"admin123",nextAllowed:true,
  candidates:[
    {id:"c1",name:"Aarav Mehta",symbol:"🌻",slogan:"Better campus, better tomorrow"},
    {id:"c2",name:"Diya Sharma",symbol:"🏀",slogan:"Students first, always"},
    {id:"c3",name:"Kabir Singh",symbol:"💻",slogan:"Smart ideas, real action"}
  ],
  voters:[],votes:{},slips:[],logs:[]
};
let S=load();
function load(){try{return {...defaultState,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch(e){return structuredClone(defaultState)}}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
function log(text){S.logs.unshift({time:new Date().toLocaleString(),text});S.logs=S.logs.slice(0,100);save()}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function openTab(id){
  document.querySelectorAll(".tab").forEach(x=>x.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  document.querySelectorAll(".nav-btn").forEach(x=>x.classList.remove("active"));
  document.getElementById("nav-"+id)?.classList.add("active");
  if(id==="homeTab")renderHome(); if(id==="voteTab")renderVote(); if(id==="resultTab")renderResults(); if(id==="adminTab")renderAdmin();
  window.scrollTo({top:0,behavior:"smooth"});
}
function updateHeader(){
  document.getElementById("bannerTitle").textContent=S.title;
  document.getElementById("bannerPost").textContent=S.post;
  document.getElementById("statusBadge").textContent=S.open?"Voting Open":"Voting Closed";
  document.getElementById("statusBadge").style.color=S.open?"#11794e":"#a32931";
  document.getElementById("statusBadge").style.background=S.open?"#dff8ed":"#ffe7e9";
  document.getElementById("topStatus").textContent=S.open?"Voting Open":"Voting Closed";
  document.querySelector(".status-dot").style.background=S.open?"#19a974":"#e5484d";
}
function totalVotes(){return S.voters.length}
function renderHome(){
  updateHeader();
  const t=totalVotes();
  document.getElementById("homeVotes").textContent=t;
  document.getElementById("heroVotes").textContent=t;
  document.getElementById("homeCand").textContent=S.candidates.length;
  document.getElementById("homeDept").textContent=new Set(S.voters.map(v=>v.dept)).size;
  document.getElementById("homeStatus").textContent=S.open?"Open":"Closed";
  document.getElementById("homeStatus2").textContent=S.open?"Open":"Closed";
  document.getElementById("homeStatusText").textContent=S.open?"Voting is currently accepting ballots.":"Voting has been closed by the election officer.";
  document.getElementById("homeProgress").style.width=Math.min(100,t*5)+"%";
  document.getElementById("homeProgressText").textContent=`${t} vote${t===1?"":"s"} recorded`;
  document.getElementById("homeCands").innerHTML=S.candidates.map((c,i)=>`<div class="candidate"><span class="tag">Candidate ${i+1}</span><div class="candidate-symbol">${esc(c.symbol)}</div><h4>${esc(c.name)}</h4><p>${esc(c.slogan)}</p></div>`).join("")+
  `<div class="candidate"><span class="tag">Option</span><div class="candidate-symbol">🚫</div><h4>NOTA</h4><p>None of the above</p></div>`;
}
function verifyVoter(){
  const name=vName.value.trim(),roll=vRoll.value.trim().toUpperCase(),dept=vDept.value,year=vYear.value;
  verifyMsg.textContent="";
  if(!name||!roll||!dept||!year||!vAgree.checked){verifyMsg.textContent="Please complete every field and accept the declaration.";return}
  if(S.voters.some(v=>v.roll===roll)){verifyMsg.textContent="This roll number has already voted in this demo.";return}
  if(!S.open){verifyMsg.textContent="Voting is currently closed.";return}
  if(!S.nextAllowed){verifyMsg.textContent="The officer must allow the next voter from Admin → Overview.";return}
  sessionStorage.setItem("currentVoter",JSON.stringify({name,roll,dept,year}));
  S.nextAllowed=false;save();renderVote();
}
function renderVote(){
  updateHeader();
  verifyBox.classList.remove("hidden");evmBox.classList.add("hidden");doneBox.classList.add("hidden");closedBox.classList.add("hidden");
  if(!S.open){verifyBox.classList.add("hidden");closedBox.classList.remove("hidden");return}
  const v=JSON.parse(sessionStorage.getItem("currentVoter")||"null");
  if(v){verifyBox.classList.add("hidden");evmBox.classList.remove("hidden");stepState(2);voterInfo.textContent=`Verified: ${v.name} • ${v.roll} • ${v.dept} • ${v.year}`;renderBallot()}
  else stepState(1);
}
function stepState(n){[1,2,3].forEach(i=>document.getElementById("step"+i).classList.toggle("active",i===n))}
function renderBallot(){
  const list=S.candidates.map((c,i)=>`<div class="ballot-row"><div class="ballot-num">${String(i+1).padStart(2,"0")}</div><div class="ballot-name">${esc(c.name)}<small>${esc(c.slogan)}</small></div><button class="vote-btn" onclick="castVote('${c.id}')">●</button></div>`).join("");
  document.getElementById("ballot").innerHTML=list+`<div class="ballot-row"><div class="ballot-num">00</div><div class="ballot-name">NOTA<small>None of the above</small></div><button class="vote-btn" onclick="castVote('nota')">●</button></div>`;
}
function castVote(id){
  const v=JSON.parse(sessionStorage.getItem("currentVoter")||"null"); if(!v||!S.open)return;
  const c=id==="nota"?{name:"NOTA",symbol:"🚫"}:S.candidates.find(x=>x.id===id); if(!c)return;
  S.voters.push({...v,time:new Date().toLocaleString()});
  S.votes[id]=(S.votes[id]||0)+1;
  S.slips.push({id:Date.now(),candidate:id,name:c.name,symbol:c.symbol});
  log(`Vote recorded for roll ${v.roll}; ballot choice stored separately.`);
  S.nextAllowed=false;save();sessionStorage.removeItem("currentVoter");
  showSlip(c);setTimeout(()=>{vvpat.classList.add("hidden");doneBox.classList.remove("hidden");evmBox.classList.add("hidden");stepState(3);doneTime.textContent="Submitted "+new Date().toLocaleString();},5200);
}
function showSlip(c){
  slipNo.textContent="SLIP • "+String(S.slips.length).padStart(4,"0");slipSymbol.textContent=c.symbol;slipName.textContent=c.name;
  let n=5;slipTimer.textContent=`Displaying for ${n} seconds`;vvpat.classList.remove("hidden");
  const timer=setInterval(()=>{n--;if(n<=0)clearInterval(timer);else slipTimer.textContent=`Displaying for ${n} seconds`},1000);
}
function resultData(){
  const arr=S.candidates.map(c=>({id:c.id,name:c.name,symbol:c.symbol,v:S.votes[c.id]||0}));arr.push({id:"nota",name:"NOTA",symbol:"🚫",v:S.votes.nota||0});return arr.sort((a,b)=>b.v-a.v)
}
function renderResults(){
  updateHeader();const t=totalVotes();statVotes.textContent=t;statCand.textContent=S.candidates.length;statStatus.textContent=S.open?"Open":"Closed";lockedVotes.textContent=t;
  const visible=S.open&&S.live||!S.open;resultLocked.classList.toggle("hidden",visible);resultContent.classList.toggle("hidden",!visible);if(!visible)return;
  const data=resultData(),max=Math.max(1,...data.map(x=>x.v));const winner=data[0];
  winnerBox.innerHTML=t?`<small>LEADING RESULT</small><h2>${esc(winner.name)} ${esc(winner.symbol)}</h2><p>${winner.v} vote${winner.v===1?"":"s"} · ${Math.round(winner.v/t*100)}% of counted ballots</p>`:`<small>RESULTS</small><h2>No votes yet</h2>`;
  let acc=0,colors=["#315efb","#6c63ff","#19a974","#f59e0b","#e5484d","#0ea5e9","#8b5cf6","#64748b","#94a3b8"];
  data.forEach((x,i)=>{x.p=t?x.v/t*100:0;x.color=colors[i%colors.length]});let stops=data.map(x=>{let a=acc;acc+=x.p;return `${x.color} ${a}% ${acc}%`}).join(",");
  pie.style.background=t?`conic-gradient(${stops})`:"#e8edf5";
  legend.innerHTML=data.filter(x=>x.v||t===0).map(x=>`<div class="legend-item"><i class="legend-dot" style="background:${x.color}"></i>${esc(x.name)} — ${x.v}</div>`).join("");
  bars.innerHTML=data.map(x=>`<div class="bar-row"><div class="bar-top"><span>${esc(x.name)}</span><span>${x.v} · ${Math.round(x.p)}%</span></div><div class="bar-bg"><div class="bar-fill" style="width:${x.v/max*100}%;background:${x.color}"></div></div></div>`).join("");
  const deps={};S.voters.forEach(v=>deps[v.dept]=(deps[v.dept]||0)+1);const dm=Math.max(1,...Object.values(deps));
  deptList.innerHTML=Object.keys(deps).length?Object.entries(deps).map(([k,n])=>`<div class="dept-row"><span>${esc(k)}</span><div class="dept-bg"><div class="dept-fill" style="width:${n/dm*100}%"></div></div><b>${n}</b></div>`).join(""):"<p class='small'>No voter activity yet.</p>";
}
function adminLogin(){if(adminPass.value===S.password){sessionStorage.setItem("admin","1");loginMsg.textContent="";renderAdmin()}else{loginMsg.textContent="Incorrect password.";passHint.textContent="Demo default password: admin123"}}
function adminLogout(){sessionStorage.removeItem("admin");renderAdmin()}
function renderAdmin(){
  if(sessionStorage.getItem("admin")!=="1"){loginBox.classList.remove("hidden");adminPanel.classList.add("hidden");return}
  loginBox.classList.add("hidden");adminPanel.classList.remove("hidden");renderOverview();renderCandidates();renderVoters();renderBox();renderLog();setTitle.value=S.title;setPost.value=S.post;setLive.checked=S.live;
}
function openAdminPage(id){document.querySelectorAll(".admin-page").forEach(x=>x.classList.add("hidden"));document.getElementById(id).classList.remove("hidden");document.querySelectorAll(".sub-btn").forEach(x=>x.classList.remove("active"));document.getElementById("sub-"+id).classList.add("active");}
function renderOverview(){
  ovVotes.textContent=totalVotes();ovCand.textContent=S.candidates.length;ovStatus.textContent=S.open?"Open":"Closed";ovLast.textContent=S.voters.at(-1)?.time||"—";
  toggleBtn.textContent=S.open?"Close voting":"Re-open voting";toggleBtn.className="main-btn "+(S.open?"red":"");
  checkBox.textContent=S.nextAllowed?"✓ Next voter is allowed to proceed.":"• Waiting for the current voter to complete or the officer to allow the next voter.";
  const d=resultData(),t=totalVotes(),m=Math.max(1,...d.map(x=>x.v));ovResultTable.innerHTML=d.map((x,i)=>`<tr><td>${i+1}</td><td><b>${esc(x.name)}</b></td><td>${esc(x.symbol)}</td><td>${x.v}</td><td>${t?Math.round(x.v/t*100):0}%</td><td><div class="bar-bg"><div class="bar-fill" style="width:${x.v/m*100}%"></div></div></td></tr>`).join("");
  const deps={},years={};S.voters.forEach(v=>{deps[v.dept]=(deps[v.dept]||0)+1;years[v.year]=(years[v.year]||0)+1});
  ovDept.innerHTML=miniStats(deps);ovYear.innerHTML=miniStats(years);
  const hours={};S.voters.forEach(v=>{const h=new Date(v.time).getHours();hours[h]=(hours[h]||0)+1});ovHours.innerHTML=miniStats(hours,true);
}
function miniStats(obj, hours=false){const vals=Object.values(obj),m=Math.max(1,...vals);if(!vals.length)return "<p class='small'>No data yet.</p>";return Object.entries(obj).sort((a,b)=>Number(a[0])-Number(b[0])).map(([k,n])=>`<div class="dept-row"><span>${esc(hours?String(k).padStart(2,"0")+":00":k)}</span><div class="dept-bg"><div class="dept-fill" style="width:${n/m*100}%"></div></div><b>${n}</b></div>`).join("")}
function toggleVoting(){S.open=!S.open;log(S.open?"Officer reopened voting.":"Officer closed voting.");save();renderAdmin();updateHeader()}
function nextVoter(){S.nextAllowed=true;log("Officer allowed the next voter.");save();renderOverview();adminMsg.textContent="Next voter is now allowed."}
function resetElection(){if(!confirm("Reset all demo votes, voters, slips and activity?"))return;const keep={...S,voters:[],votes:{},slips:[],logs:[],open:true,nextAllowed:true};S=keep;log("Demo election was reset.");save();renderAdmin();renderHome()}
function renderCandidates(){
  candList.innerHTML=S.candidates.map((c,i)=>`<div class="candidate" style="margin:10px 0"><div class="candidate-symbol">${esc(c.symbol)}</div><h4>${esc(c.name)}</h4><p>${esc(c.slogan)}</p>${!S.voters.length?`<button class="small-btn" style="margin-top:10px" onclick="removeCandidate('${c.id}')">Remove</button>`:""}</div>`).join("");
}
function addCandidate(){if(S.voters.length){candMsg.textContent="Candidates are locked after the first vote.";return}const name=cName.value.trim(),slogan=cSlogan.value.trim(),symbol=cSymbol.value;if(!name){candMsg.textContent="Enter a candidate name.";return}S.candidates.push({id:"c"+Date.now(),name,symbol,slogan:slogan||"Student council candidate"});log(`Candidate added: ${name}.`);save();cName.value="";cSlogan.value="";candMsg.textContent="Candidate added.";renderCandidates();renderHome()}
function removeCandidate(id){if(S.candidates.length<=1)return;if(!confirm("Remove this candidate?"))return;S.candidates=S.candidates.filter(c=>c.id!==id);save();renderCandidates();renderHome()}
function renderVoters(){const q=(searchVoter.value||"").toLowerCase(),d=filterDept.value,y=filterYear.value;const list=S.voters.filter(v=>(!q||v.name.toLowerCase().includes(q)||v.roll.toLowerCase().includes(q))&&(!d||v.dept===d)&&(!y||v.year===y));voterCount.textContent=`Showing ${list.length} of ${S.voters.length} voter records`;voterTable.innerHTML=list.map((v,i)=>`<tr><td>${i+1}</td><td>${esc(v.name)}</td><td>${esc(v.roll)}</td><td>${esc(v.dept)}</td><td>${esc(v.year)}</td><td>${esc(v.time)}</td></tr>`).join("")||`<tr><td colspan="6">No voter records found.</td></tr>`}
function renderBox(){const d=resultData();verifyTable.innerHTML=d.map(x=>`<tr><td>${esc(x.symbol)} ${esc(x.name)}</td><td>${x.v}</td><td>${S.slips.filter(s=>s.candidate===x.id).length}</td><td>${x.v===S.slips.filter(s=>s.candidate===x.id).length?"✓ Match":"✕ Check"}</td></tr>`).join("");slipTotal.textContent=S.slips.length;slipGrid.innerHTML=S.slips.slice().reverse().map((s,i)=>`<div class="mini-slip"><div class="sym">${esc(s.symbol)}</div><b>${esc(s.name)}</b><div class="small">Slip #${S.slips.length-i}</div></div>`).join("")||"<p class='small'>No slips yet.</p>"}
function renderLog(){logList.innerHTML=S.logs.map(x=>`<div class="log-item"><span class="log-time">${esc(x.time)}</span><span class="log-text">${esc(x.text)}</span></div>`).join("")||"<p class='small'>No activity yet.</p>"}
function saveDetails(){S.title=setTitle.value.trim()||defaultState.title;S.post=setPost.value.trim()||defaultState.post;log("Election details updated.");save();detailsMsg.textContent="Details saved.";updateHeader();renderHome()}
function toggleLiveResults(){S.live=setLive.checked;log(`Public live results ${S.live?"enabled":"disabled"}.`);save()}
function changePassword(){if(oldPass.value!==S.password){passMsg.textContent="Current password is incorrect.";return}if(newPass.value.length<6||newPass.value!==newPass2.value){passMsg.textContent="New passwords must match and contain at least 6 characters.";return}S.password=newPass.value;log("Admin password changed.");save();passMsg.textContent="Password changed successfully.";oldPass.value=newPass.value=newPass2.value=""}
function togglePassView(){adminPass.type=showPass.checked?"text":"password"}
function csv(rows){return rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n")}
function download(name,content,type="text/csv"){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
function downloadResults(){const d=resultData(),t=totalVotes();download("campusvote-results.csv",csv([["Rank","Candidate","Symbol","Votes","Share"],...d.map((x,i)=>[i+1,x.name,x.symbol,x.v,(t?x.v/t*100:0).toFixed(1)+"%"])]))}
function downloadVoters(){download("campusvote-voters.csv",csv([["Name","Roll Number","Department","Year","Time"],...S.voters.map(v=>[v.name,v.roll,v.dept,v.year,v.time])]))}
updateHeader();renderHome();
