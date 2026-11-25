(() => {
  'use strict';
  const d=window.KENDO_POLICE_TEAM;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={'1':'男子1部','2':'男子2部','3':'男子3部',W:'女子'};
  const name='全国警察剣道大会（団体戦）';
  const href=(y,div)=>`#/police-team/${y}/${div||'1'}`;
  const source=url=>`<a class="data-link pt-source" href="${esc(url)}" target="_blank" rel="noopener noreferrer">公式資料 ↗</a>`;
  const filter=(key,y,div)=>d[key].filter(r=>r.year===y&&r.division===div);
  const yearList=Array.from({length:25},(_,i)=>String(2026-i));
  const coverageText=c=>c.coverage==='partial'?'部分収録':c.excluded?'全対戦調査済み・一部非掲載':'全団体対戦収録';
  const entries=()=>d.coverage.flatMap(c=>c.divisions.map(div=>({name,edition:`${c.year}年 ${labels[div]}`,year:Number(c.year),heldYear:Number(c.year),gender:div==='W'?'女子':'男子',href:href(c.year,div),sub:`${coverageText(c)}・団体${filter('matches',c.year,div).length}対戦`,type:'police-team'})));
  const table=(headers,rows,empty)=>rows.length?`<div class="table-wrap pt-table"><table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:`<div class="pane-pad muted">${esc(empty)}</div>`;
  const section=(title,body,id)=>`<section class="pane pt-section" id="${id}"><div class="pane-pad"><h3 class="section-title">${title}</h3></div>${body}</section>`;
  const score=(a,b)=>a==null||b==null?'未確認':`${a} – ${b}`;
  const team=(m,side)=>`${m.winner===side?'<strong>':''}${esc(m[side])}${m.winner===side?'</strong>':''}`;
  const stageSort=(a,b)=>{const priority=s=>s.includes('リーグ')?0:({'1回戦':1,'2回戦':2,'3回戦':3,'4回戦':4,'準決勝':5,'3位決定戦':6,'決勝':7}[s]??8);return priority(a)-priority(b)||a.localeCompare(b,'ja',{numeric:true});};
  const playerRows=window.KENDO_POLICE_TEAM_PLAYERS;
  const sourceName=r=>r.source_name.replace(/\s/g,'')!==r.name.replace(/\s/g,'')?`<span class="row-sub">資料表記：${esc(r.source_name)}</span>`:'';
  const kindLabel=r=>r.kind==='name_list'?'選手名一覧で確認':'参加報告で確認';
  const details=window.KENDO_POLICE_TEAM_DETAILS;
  const resultLabel=v=>({left:'左勝利',right:'右勝利',draw:'引き分け'})[v];
  const named=(v,link)=>v.id&&link?`<a class="data-link" href="#/player/${esc(v.id)}">${esc(v.name)}</a>`:v.name?esc(v.name)+(v.surname_only?'（姓のみ）':''):'氏名未確認';
  const detailSource=(url,label)=>`<a class="data-link pt-source" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
  const detailScore=(r,side)=>side==='right'?score(r.right_points,r.left_points):score(r.left_points,r.right_points);
  const awardRows=(rows,link)=>rows.map(r=>[link?esc(r.team):`<a class="data-link" href="${href(r.year,r.division)}">${r.year}年・${labels[r.division]}</a>`,link?`<a class="data-link" href="#/player/${esc(r.player_id)}">${esc(r.name)}</a>`:esc(r.team),esc(r.award),...(link?[detailSource(r.source_url,r.source_label)+(r.corroboration_url?' / '+detailSource(r.corroboration_url,'補足資料'):'')]:[])]);
  function playerHistory(id){
    const rows=playerRows.filter(r=>r.player_id===id).sort((a,b)=>Number(b.year)-Number(a.year)||a.division.localeCompare(b.division));
    const bouts=details.bouts.filter(r=>r.left.id===id||r.right.id===id).sort((a,b)=>Number(b.year)-Number(a.year));
    const awards=details.awards.filter(r=>r.player_id===id).sort((a,b)=>Number(b.year)-Number(a.year));
    if(!rows.length&&!bouts.length&&!awards.length)return '';
    return `<section class="pane wide pt-player-history"><div class="pane-pad"><h3 class="section-title">全国警察剣道大会・団体戦</h3><p class="small muted">登録・参加確認、本人実戦、表彰は別記録です。個人通算ランキングには加算しません。</p></div>`+
      (rows.length?`<div class="pane-pad"><h4>選手名・参加確認（${rows.length}枠）</h4><p class="small muted">正式登録票・本人実戦・個人勝敗の完全確認を意味しません。順位は所属団体の成績です。</p></div>${table(['年度・部門','当時の所属','団体最終順位','リーグ順位','確認区分'],rows.map(r=>[`<a class="data-link" href="${href(r.year,r.division)}">${esc(r.year)}年・${labels[r.division]}</a>`,esc(r.team)+sourceName(r),r.rank?esc(r.rank)+'位':'未収録',r.league.length?r.league.map(l=>esc(l.stage)+'・'+esc(l.rank)+'位').join('<br>'):'未収録',kindLabel(r)]),'')}`:'')+
      (bouts.length?`<div class="pane-pad"><h4>本人実戦（部分確認・${bouts.length}件）</h4><p class="small muted">本人の勝敗が確認できた記録。相手の氏名・ID、技、本数、延長・反則は確認できた項目だけ表示。代表戦は通常戦とは別です。</p></div><div class="pt-personal-bouts">${table(['年度・部門','回戦・役割','当時の所属','相手所属・氏名','勝敗','本数','技'],bouts.map(r=>{const side=r.left.id===id?'left':'right',other=side==='left'?'right':'left';return [`<a class="data-link" href="${href(r.year,r.division)}">${r.year}年・${labels[r.division]}</a>`,esc(r.stage)+'・'+esc(r.position),esc(r[side+'_team']),esc(r[other+'_team'])+'・'+named(r[other],false),r.winner==='draw'?'引き分け':r.winner===side?'勝利':'敗戦',detailScore(r,side),r.technique&&r.winner===side?esc(r.technique):'未確認'];}),'')}</div>`:'')+
      (awards.length?`<div class="pane-pad"><h4>表彰（${awards.length}件）</h4><p class="small muted">全勝賞は表彰の事実のみ。個別試合数や勝利数を推定しません。</p></div><div class="pt-player-awards">${table(['年度・部門','当時の所属','表彰'],awardRows(awards,false),'')}</div>`:'')+'</section>';
  }
  function render(y,div){
    y=y||'2026'; if(!yearList.includes(y))return `<div class="pane pane-pad">対象年度外です。 <a class="data-link" href="${href('2026','1')}">2026年へ</a></div>`;
    const c=d.coverage.find(x=>x.year===y),cancel=d.canceled.find(x=>x.year===y);
    if(c&&!c.divisions.includes(div))div=c.divisions[0];
    const header=`<div class="page-head"><p class="eyebrow">POLICE KENDO TEAM TOURNAMENT</p><h2>${esc(y)}年 ${name}</h2><p class="muted">団体戦の公式確認済み記録。全国警察剣道選手権大会（個人戦）とは別大会です。</p></div><div class="toolbar pt-toolbar"><div class="field"><label for="pt-year">大会年度</label><select class="control" id="pt-year">${yearList.map(yr=>`<option value="${yr}" ${yr===y?'selected':''}>${yr}年${d.canceled.some(x=>x.year===yr)?'（中止）':''}</option>`).join('')}</select></div>${c?`<div class="field"><label for="pt-division">部門</label><select class="control" id="pt-division">${c.divisions.map(v=>`<option value="${v}" ${v===div?'selected':''}>${labels[v]}</option>`).join('')}</select></div>`:''}</div>`;
    if(cancel)return header+`<section class="pane pane-pad"><h3>大会中止</h3><p>${source(cancel.source_url)}</p></section>`;
    if(!c)return header+'<section class="pane pane-pad">収録なし</section>';
    const ms=filter('matches',y,div),fs=filter('final',y,div),ls=filter('league',y,div),ts=filter('tiebreaks',y,div),ws=filter('withdrawals',y,div),fm=filter('formats',y,div)[0];
    const ps=playerRows.filter(r=>r.year===y&&r.division===div).sort((a,b)=>a.team.localeCompare(b.team,'ja')||a.name.localeCompare(b.name,'ja'));
    const stages=[...new Set(ms.map(x=>x.stage))].sort(stageSort);
    const lg=[...new Set(ls.map(x=>x.stage))].sort(stageSort);
    const full=ms.filter(m=>m.left_points!=null&&m.left_wins!=null).length;
    const matchRows=stages.map(stage=>`<details class="pt-group" open><summary>${esc(stage)} <span class="muted">${ms.filter(m=>m.stage===stage).length}対戦</span></summary>${table(['団体（左）','団体（右）','勝敗','勝者数','取得本数','決着代表戦','出典'],ms.filter(m=>m.stage===stage).map(m=>[team(m,'left'),team(m,'right'),m.winner==='draw'?'引き分け':`${esc(m[m.winner])} 勝利`,score(m.left_wins,m.right_wins),score(m.left_points,m.right_points),m.representative_winner?`${esc(m[m.representative_winner])} 勝利`:'—',source(m.source_url)]),'未収録')}</details>`).join('');
    const leagueRows=lg.map(stage=>`<details class="pt-group" open><summary>${esc(stage)}</summary>${table(['順位','団体','出典'],ls.filter(r=>r.stage===stage).sort((a,b)=>Number(a.rank)-Number(b.rank)).map(r=>[esc(r.rank)+'位',esc(r.team),source(r.source_url)]),'未収録')}</details>`).join('');
    return header+`<section class="pane pane-pad pt-coverage"><h3>${labels[div]} · ${coverageText(c)}</h3><p>${c.coverage==='partial'?'この年度は部分収録です。掲載のない対戦・順位は未収録であり、対戦がなかったことを意味しません。':c.excluded?'この年度は全団体対戦を調査済みですが、公式資料の不整合がある1対戦は非掲載です。':'この年度の全団体対戦を収録しています。個人別の実戦・取得技等の完全収録を意味しません。'}</p>${fm?`<p>実戦人数：${esc(fm.active_positions)}人制${fm.registration_limit?` ／ 登録上限：${esc(fm.registration_limit)}人`:''} ${source(fm.source_url)}</p>`:''}${y==='2017'?'<p>女子団体戦は2017年新設。</p>':''}<div class="pt-stats"><div><strong>${ms.length}</strong>団体対戦</div><div><strong>${full}</strong>完全スコア</div><div><strong>${fs.length}</strong>最終順位</div><div><strong>${ls.length}</strong>リーグ順位</div></div><p class="small muted">個人通算ランキングには加算しません。空欄・未確認は推測で補いません。</p></section>`+
    section('最終順位',table(['順位','団体','出典'],fs.slice().sort((a,b)=>Number(a.rank)-Number(b.rank)).map(r=>[esc(r.rank)+'位',esc(r.team),source(r.source_url)]),'確認済み順位の収録なし'),'pt-final')+
    section('リーグ順位',leagueRows||'<div class="pane-pad muted">確認済みリーグ順位の収録なし</div>','pt-league')+
    section('選手名・参加確認（本人実戦とは別）',`<p class="pane-pad small muted">選手IDを確定できた確認記録のみ。全登録選手名簿ではありません。掲載のない選手が不参加だったことを意味しません。</p>${table(['所属団体','選手','確認区分','出典'],ps.map(r=>[esc(r.team),`<a class="data-link pt-player-link" href="#/player/${esc(r.player_id)}">${esc(r.name)}</a>${sourceName(r)}`,kindLabel(r),detailSource(r.event_source_url,'大会参加・顕彰資料')]),'選手ID確定の記録は未収録')}`,'pt-players')+
    (ws.length?section('欠場記録',table(['組','団体','状況','出典'],ws.map(r=>[esc(r.stage),esc(r.team),esc(r.status),source(r.source_url)]),''),'pt-withdrawal'):'')+
    section('団体対戦結果',`<p class="pane-pad small muted">勝者数・取得本数は左対右の順です。代表戦の「—」は勝者の収録なし（実施なしと断定しません）。</p>${matchRows||'<div class="pane-pad muted">確認済み団体対戦の収録なし</div>'}`,'pt-matches')+
    (details.bouts.some(r=>r.year===y&&r.division===div)?section('個人別対戦結果（部分確認）',`<p class="pane-pad small muted">姓・勝敗のみの記録を含みます。両選手ID確定の対戦はありません。代表戦は通常戦に加算しません。</p>${table(['回戦・役割','左団体・選手','右団体・選手','勝敗','取得本数','技','出典'],details.bouts.filter(r=>r.year===y&&r.division===div).map(r=>[esc(r.stage)+'・'+esc(r.position),esc(r.left_team)+'・'+named(r.left,true),esc(r.right_team)+'・'+named(r.right,true),resultLabel(r.winner),detailScore(r,'left'),r.technique?esc(r.technique):'未確認',detailSource(r.source_url,r.year==='2015'?'記録板写真':'福岡県剣連・剣脈')]),'')}`,'pt-bouts'):'')+
    (details.awards.some(r=>r.year===y&&r.division===div)?section('表彰（氏名確認済み）',`<p class="pane-pad small muted">全勝賞の確認記録。全受賞者名簿ではありません。個別勝利数には加算しません。</p>${table(['所属団体','選手','表彰','出典'],awardRows(details.awards.filter(r=>r.year===y&&r.division===div),true),'')}`,'pt-awards'):'')+
    (ts.length?section('リーグ順位決定代表戦（別記録）',`<p class="pane-pad small muted">団体対戦の決着用代表戦とは別に扱い、団体対戦数に加算しません。</p>${table(['組','団体（左）','団体（右）','勝者','出典'],ts.map(r=>[esc(r.stage),esc(r.left),esc(r.right),esc(r.winner),source(r.source_url)]),'')}`,'pt-tiebreaks'):'');
  }
  function bind(){const y=document.getElementById('pt-year'),div=document.getElementById('pt-division');if(!y)return;y.addEventListener('change',()=>{const c=d.coverage.find(x=>x.year===y.value);location.hash=href(y.value,c?.divisions.includes(div?.value)?div.value:c?.divisions[0]||'1');});div?.addEventListener('change',()=>{location.hash=href(y.value,div.value);});}
  window.KENDO_POLICE_TEAM_UI={entries,render,bind,playerHistory};
})();
