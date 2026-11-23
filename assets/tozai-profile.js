'use strict';
(function(){
  const data=window.KENDO_TOZAI_PUBLIC, links=window.KENDO_TOZAI_PROFILE_LINKS?.links;
  if(!data||!links)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sourceOk=url=>typeof url==='string' && /^https:\/\/(www\.)?(kendo\.or\.jp|old2\.kendo\.or\.jp|kendo-fik\.org|youtube\.com|youtu\.be)\//i.test(url);
  const href=(year,gender,bout)=>`tozai.html?year=${year}&gender=${encodeURIComponent(gender)}&bout=${encodeURIComponent(bout)}`;
  const playerLink=(name,id)=>id?`<a class="data-link" href="#/player/${encodeURIComponent(id)}">${esc(name)}</a>`:esc(name);
  const byPlayer=new Map();
  for(const r of data.records)for(const bout of r.bouts){
    const linked=links[bout.id];if(!linked)continue;
    for(const side of ['left','right']){
      const id=linked[side];if(!id)continue;
      const own=bout[side],opp=bout[side==='left'?'right':'left'];
      const oppId=linked[side==='left'?'right':'left']||'';
      const entry={r,bout,own,opp,oppId,side};
      if(!byPlayer.has(id))byPlayer.set(id,[]);
      byPlayer.get(id).push(entry);
    }
  }
  const score=(own,opp)=>{
    const points=p=>Number.isInteger(p.points)?`${p.points}本`:'本数未確認';
    const techniques=p=>Array.isArray(p.strikes)&&p.strikes.length?p.strikes.join('・'):'技未確認';
    return `${points(own)}（${esc(techniques(own))}） / ${points(opp)}（${esc(techniques(opp))}）`;
  };
  function sync(){
    const match=(location.hash||'').match(/^#\/player\/([^/?]+)/);
    if(!match)return;
    const id=decodeURIComponent(match[1]);const list=byPlayer.get(id);
    const grid=document.querySelector('#app .profile-grid');
    if(!grid||!list?.length||grid.querySelector('.tozai-linked-history'))return;
    const rows=[...list].sort((a,b)=>b.r.year-a.r.year||(b.bout.order||0)-(a.bout.order||0));
    const wins=rows.filter(({bout,own})=>bout.winner===own.side).length;
    const losses=rows.filter(({bout,own})=>bout.winner&&bout.winner!==own.side).length;
    const draws=rows.filter(({bout})=>String(bout.outcome||'').includes('引')).length;
    const unknown=rows.length-wins-losses-draws;
    const newProfile=Array.isArray(window.KENDO_TOZAI_NEW_PLAYERS?.players) && window.KENDO_TOZAI_NEW_PLAYERS.players.some(p=>p.id===id);
    const allMulti=[...(window.KENDO_TOZAI_MULTI_PROFILES?.players||[]),...(window.KENDO_TOZAI_MULTI_257?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_258?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_259?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_262?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_263?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_264?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_266?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_267?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_268?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_269?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_270?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_271?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_272?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_273?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_274?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_275?.newProfiles||[])];const multiProfile=allMulti.find(p=>p.id===id);
    const sourceScope=multiProfile?(rows.some(x=>x.r.year<=2010)?'全剣連の歴代大会記録・公式記事と別年度の人物資料で照合した出場歴を含みます。古い年度の年齢は未確認です。':([...new Set(rows.map(x=>x.r.year))].sort((a,b)=>a-b).join('・')+'年の公式名簿で都道府県と年齢の連続性を照合した記録のみ掲載。他年度は未照合。')):newProfile?'この年度の全剣連公式大会記録から確認できた本人実戦のみを掲載。別年度の同姓同名は統合していません。':'公式大会名簿等で人物照合した試合のみ掲載。';
    const body=rows.map(({r,bout,own,opp,oppId,side})=>{
      const result=bout.winner?bout.winner===own.side?'勝':'負':String(bout.outcome||'').includes('引')?'引き分け':'勝敗未確認';
      const ext=bout.extension===true?'延長あり':bout.extension===false?'延長なし':'延長未確認';
      const award=(bout.awards||[]).length?` / ${esc(bout.awards.join('・'))}`:'';
      const link=href(r.year,r.gender,bout.id);
      const ageDiscrepancy=id==='tzm_264_371d7d84d3ed'&&r.year===2012 ? window.KENDO_TOZAI_IDENTITY_266?.ageDiscrepancies?.[id] : null;
      const ageWarning=ageDiscrepancy?`<div class="small muted">※ ${esc(ageDiscrepancy.note)} <a class="data-link" href="${esc(ageDiscrepancy.comparisonSource)}" target="_blank" rel="noopener noreferrer">2014年公式八段審査 ↗</a></div>`:'';
      return `<tr><td><a class="data-link" href="${esc(link)}">${r.year}年・第${r.year-1954}回</a><div class="small muted">${esc(own.side)} / ${esc(bout.position||'位置未確認')}</div></td><td>${playerLink(opp.name,oppId)}</td><td>${esc(result)}</td><td>${score(own,opp)}<div class="small muted">${esc(ext)}${award}</div></td><td><a class="data-link" href="${esc(link)}">対戦詳細</a>${sourceOk(bout.source)?`<div class="small"><a class="data-link" href="${esc(bout.source)}" target="_blank" rel="noopener noreferrer">公式資料 ↗</a></div>`:''}${(window.KENDO_TOZAI_IDENTITY_277?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_276?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_275?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_274?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_273?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_272?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_271?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_270?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_269?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_268?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_267?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_266?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_265?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_264?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_263?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_262?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_261?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_260?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_259?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_258?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_257?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_256?.evidence?.[bout.id]?.[side])?`<div class="small"><a class="data-link" href="${esc((window.KENDO_TOZAI_IDENTITY_277?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_276?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_275?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_274?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_273?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_272?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_271?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_270?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_269?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_268?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_267?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_266?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_265?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_264?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_263?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_262?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_261?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_260?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_259?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_258?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_257?.evidence?.[bout.id]?.[side]||window.KENDO_TOZAI_IDENTITY_256?.evidence?.[bout.id]?.[side]).rosterSource)}" target="_blank" rel="noopener noreferrer">人物照合：当時の名簿 ↗</a></div>`:''}${ageWarning}</td></tr>`;
    }).join('');
    const section=document.createElement('section');section.className='pane wide tozai-linked-history';
    section.innerHTML=`<div class="pane-pad"><h3 class="section-title">全日本東西対抗剣道大会・本人対戦記録</h3><p class="small muted">公式資料で対戦者が確認されています。${sourceScope}${rows.length}試合（${wins}勝${losses}敗${draws}分${unknown?'・勝敗未確認'+unknown+'件':''}）。未収録試合や紐付け保留は出場なしを意味しません。全日本選手権の通算成績・ランキングとは分離しています。</p></div><div class="table-wrap"><table class="profile-match-table"><thead><tr><th>大会年度・東西</th><th>対戦相手</th><th>勝敗</th><th>取得本数・技（本人 / 相手）</th><th>根拠</th></tr></thead><tbody>${body}</tbody></table></div>`;
    grid.appendChild(section);
  }
  window.addEventListener('hashchange',sync);
  sync();
})();
