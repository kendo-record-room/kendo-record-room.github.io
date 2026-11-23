'use strict';
(function(){
 const data = window.KENDO_TOZAI_PUBLIC;
 const profileLinks = window.KENDO_TOZAI_PROFILE_LINKS?.links || {};
 if (!data || !Array.isArray(data.records)) return;
 const $ = (id)=>document.getElementById(id);
 const esc = (v)=>String(v ?? '').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const permittedSource = (url)=>typeof url==='string' && /^https:\/\/(www\.)?(kendo\.or\.jp|old2\.kendo\.or\.jp|kendo-fik\.org|www\.kendo-fik\.org)\//i.test(url);
 const srcLink = (url,text)=>permittedSource(url) ? `<a class="verified-link" target="_blank" rel="noopener noreferrer" href="${esc(url)}">${esc(text)} ↗</a>` : '―';
 const yearSelect=$('yearSelect');
 const years=[...new Set(data.records.map(r=>r.year))].sort((a,b)=>b-a);
 yearSelect.innerHTML=years.map(y=>`<option value="${y}">${y}年（第${y-1954}回）</option>`).join('');
 const params=new URLSearchParams(location.search); if(years.includes(Number(params.get('year'))))yearSelect.value=params.get('year');
 if(params.get('gender')==='女子')$('genderSelect').value='女子';
 const allBouts=data.records.reduce((n,r)=>n+r.bouts.length,0);
 $('totalBouts').textContent=allBouts.toLocaleString('ja-JP');
 $('unconfirmedBouts').textContent=(data.expected-allBouts).toLocaleString('ja-JP');
 $('totalYears').textContent=years.length;
 function displayTechnique(b){
   const details=[b.left,b.right].filter(Boolean).map(p=>{
     if(Array.isArray(p.strikes) && p.strikes.length)return `${esc(p.name)}：${esc(p.strikes.join('・'))}`;
     return null;
   }).filter(Boolean);
   if(details.length)return details.join('<span class="skill"> / </span>');
   if(b.finishingTechnique)return `決まり技：${esc(b.finishingTechnique)}<span class="skill">全取得技は未確認</span>`;
   return '<span class="unknown">―</span>';
 }
 function scoreText(p){ if(p.points === null || p.points === undefined)return '本数未確認';return `${p.points}本`; }
 function render(){
   const year=Number(yearSelect.value),gender=$('genderSelect').value;
   const term=$('nameSearch').value.trim().normalize('NFKC');
   const r=data.records.find(r=>r.year===year && r.gender===gender);if(!r)return;
   $('yearCaption').textContent=`${r.date || year} / ${gender}`;
   $('eventTitle').textContent=r.event+'・'+gender;
   const source=$('primarySource'); if(permittedSource(r.source)){source.href=r.source;source.hidden=false}else{source.hidden=true}
   const team=r.result || {};
   $('scoreboard').innerHTML=['東軍','西軍'].map(side=>{
      const s=team[side]||{};
      return `<div class="scorebox ${team.winner===side?'won':''}"><div class="side">${side}${team.winner===side?' · 勝利':''}</div><div class="score">${s.wins===null||s.wins===undefined?'―':esc(s.wins)}勝</div><div class="small">${s.points===null||s.points===undefined?'取得本数未確認':`${esc(s.points)}本取得`}</div></div>`;
   }).join('') + (team.winner ? '' : '<span class="score-foot">団体勝者未確認</span>');
   const expected = year>=2022? (gender==='男子'?31:9):(gender==='男子'?35:5);
   const visible=r.bouts.filter(b=>!term || [b.left.name,b.right.name].some(n=>String(n??'').normalize('NFKC').includes(term)));
   $('coverage').textContent=`確認済み対戦 ${r.bouts.length} / ${expected}試合${r.bouts.length < expected ? '（他は個人別結果未収録）' : ''}。勝敗不明の試合は空欄を推測しません。`;
   $('matchRows').innerHTML=visible.map(b=>{
     const east=b.left.side==='東軍'?b.left:b.right;const west=b.left.side==='西軍'?b.left:b.right;
     const showName=(p,side)=>{const id=profileLinks[b.id]?.[side];return `${id?`<a class="player-link" href="index.html#/player/${encodeURIComponent(id)}">${esc(p.name??'未確認')}</a>`:`<strong>${esc(p.name??'未確認')}</strong>`}<span class="skill">${esc(scoreText(p))}</span>`};
     const result=b.winner ? `<span class="winner">${esc(b.winner)}勝利</span>` : (String(b.outcome||'').includes('引')?'引き分け':'<span class="unknown">勝敗未確認</span>');
     const ext=b.extension===true?'あり':b.extension===false?'なし':'<span class="unknown">未確認</span>';
     return `<tr data-bout="${esc(b.id)}" class="${params.get('bout')===b.id?'linked-target':''}"><td>${esc(b.order??'―')}<span class="skill">${esc(b.position||'―')}</span></td><td>${showName(east,east===b.left?'left':'right')}</td><td>${showName(west,west===b.left?'left':'right')}</td><td>${result}</td><td>${displayTechnique(b)}</td><td>${ext}</td><td>${srcLink(b.source,'公式')}</td></tr>`;
   }).join('');
   $('emptyMatches').hidden=visible.length>0;
   const partial=r.partialObservations.filter(o=>o.name);
   $('partialBox').hidden=partial.length===0;
   $('partialBox').innerHTML=partial.length?'<h4>片側のみ公式確認された試合</h4>'+partial.map(o=>`<p>${esc(o.name)}（${esc(o.side)}）：${esc(o.summary)}。対戦相手未確認のため試合数に含めません。 ${srcLink(o.source,'公式記事')}</p>`).join(''):'';
   const old=year<=2011;$('awardsSection').hidden=!old;
   if(old){
     const pair=data.awardPairs.filter(a=>a.year===year);
     $('awardPairs').innerHTML=pair.map(a=>`<div class="award-item"><div class="award-label">第${a.pairIndex}組・勝敗は別途照合</div><strong>${esc(a.participantA)}</strong>（${esc(a.participantAPref)}）― <strong>${esc(a.participantB)}</strong>（${esc(a.participantBPref)}）</div>`).join('');
     const individuals=data.individualAwards.filter(a=>a.year===year);
     $('awardPlayers').innerHTML=individuals.map(a=>`<div class="award-item"><span class="award-label">${esc(a.gender)}</span>　<strong>${esc(a.name)}</strong></div>`).join('');
     const awardsSource=$('awardsSource');awardsSource.href=permittedSource(data.awardsSource)?data.awardsSource:'#';
   }
   try{const next=new URL(location.href);next.searchParams.set('year',year);next.searchParams.set('gender',gender);history.replaceState(null,'',next.href)}catch(_err){}
 }
 ['yearSelect','genderSelect'].forEach(id=>$(id).addEventListener('change',render));
 $('nameSearch').addEventListener('input',render);render();
 const targetId=params.get('bout');if(targetId){const target=[...document.querySelectorAll('[data-bout]')].find(el=>el.dataset.bout===targetId);if(target)requestAnimationFrame(()=>target.scrollIntoView({block:'center'}));}
})();
