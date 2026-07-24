const socket = io();
const $ = id => document.getElementById(id);
const qs = new URLSearchParams(location.search);
let roomId = (qs.get('room') || '').toUpperCase();
let role = qs.get('role') || '';
let selected = null;
let latest = null;

function show(id){['home','namePanel','hostPanel','playerPanel'].forEach(x=>$(x).classList.add('hidden'));$(id).classList.remove('hidden')}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function letter(i){return String.fromCharCode(65+i)}

$('createHost').onclick=()=>socket.emit('host:create',{},async res=>{if(!res.ok)return;roomId=res.summary.roomId;role='host';history.replaceState(null,'',`/?room=${roomId}&role=host`);show('hostPanel');$('roomPill').textContent=`Room ${roomId}`;$('hostRoomCode').textContent=roomId;const qr=await fetch(`/api/room/${roomId}/qr`).then(r=>r.json());$('qr').src=qr.dataUrl;$('joinLink').href=qr.joinUrl;$('joinLink').textContent=qr.joinUrl;render(res.summary)});
$('joinManual').onclick=()=>{roomId=$('manualRoom').value.trim().toUpperCase();if(roomId){role='player';history.replaceState(null,'',`/?room=${roomId}&role=player`);show('namePanel')}};
$('confirmJoin').onclick=()=>joinPlayer();
if(roomId && role==='player') show('namePanel');

function joinPlayer(){const name=$('playerName').value.trim()||'Guest';socket.emit('player:join',{roomId,name},res=>{if(!res.ok){$('joinError').textContent=res.error;return;}show('playerPanel');$('roomPill').textContent=`Room ${roomId}`;render(res.summary)})}
$('startQuiz').onclick=()=>socket.emit('host:start',{roomId});
$('revealAnswer').onclick=()=>socket.emit('host:reveal',{roomId});
$('nextQuestion').onclick=()=>socket.emit('host:next',{roomId});
$('loadQuestions').onclick=()=>{try{const questions=JSON.parse($('questionJson').value);socket.emit('host:loadQuestions',{roomId,questions},res=>{$('loadStatus').textContent=res.ok?'Questions loaded.':res.error})}catch(e){$('loadStatus').textContent='Invalid JSON.'}}

socket.on('room:update', summary=>{latest=summary;render(summary)});

function render(summary){if(!summary)return;const q=summary.question;selected = summary.responses?.[socket.id] ?? selected;
  if(role==='host') renderHost(summary,q); else renderPlayer(summary,q);
}
function renderHost(summary,q){$('progress').textContent=`${summary.currentIndex+1}/${summary.totalQuestions}`;$('hostQuestion').textContent=q.question;$('participantCount').textContent=`(${summary.participants.length})`;
  $('hostOptions').innerHTML=q.options.map((o,i)=>`<div class="option ${summary.revealed&&i===q.answer?'correct':''}"><b>${letter(i)}.</b> ${esc(o)}</div>`).join('');
  const total=Math.max(1,Object.keys(summary.responses).length);
  $('bars').innerHTML=q.options.map((o,i)=>{const c=summary.counts[i]||0;const pct=Math.round(c/total*100);return `<div class="barRow"><div class="barLabel"><span>${letter(i)}. ${esc(o)}</span><b>${c} (${pct}%)</b></div><div class="bar"><div class="barFill" style="width:${pct}%"></div></div></div>`}).join('');
  $('participants').innerHTML=summary.participants.map(p=>`<span class="chip">${esc(p.name)}${summary.responses[p.id]!==undefined?' ✓':''}</span>`).join('')||'<p class="muted">No participants yet.</p>';
  $('hostExplanation').classList.toggle('hidden',!summary.revealed);$('hostExplanation').innerHTML=summary.revealed?`<b>Correct answer: ${letter(q.answer)}. ${esc(q.options[q.answer])}</b><br>${esc(q.explanation)}`:'';
}
function renderPlayer(summary,q){$('playerRoom').textContent=`Room ${summary.roomId} • Question ${summary.currentIndex+1}/${summary.totalQuestions}`;$('playerQuestion').textContent=summary.started?q.question:'Waiting for host to start...';
  if(!summary.started){$('playerOptions').innerHTML='';return;}
  $('playerOptions').innerHTML=q.options.map((o,i)=>`<button class="playerOption ${selected===i?'selected':''} ${summary.revealed&&i===q.answer?'correct':''}" data-i="${i}" ${summary.revealed?'disabled':''}><b>${letter(i)}.</b> ${esc(o)}</button>`).join('');
  document.querySelectorAll('.playerOption').forEach(btn=>btn.onclick=()=>{selected=Number(btn.dataset.i);socket.emit('player:answer',{roomId,optionIndex:selected});renderPlayer(latest,q)});
  $('playerExplanation').classList.toggle('hidden',!summary.revealed);$('playerExplanation').innerHTML=summary.revealed?`<b>Correct answer: ${letter(q.answer)}. ${esc(q.options[q.answer])}</b><br>${esc(q.explanation)}`:'';
}
