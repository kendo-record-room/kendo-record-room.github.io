'use strict';
/* Round 282: dated official-roster prefecture history across championships,
   prefectural teams and Tozai. Does not alter person IDs, appearances or results. */
(function () {
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const official = url => typeof url === 'string' && /^https:\/\/(?:www\.)?(?:kendo\.or\.jp|old2\.kendo\.or\.jp)\//i.test(url);
  const fullPref = value => {
    const v = String(value || '').trim();
    if (!v || v === '未確認') return '';
    return /^(?:北海道|東京都|京都府|大阪府|.{2,3}県)$/.test(v) ? v : ({東京:'東京都',京都:'京都府',大阪:'大阪府',北海道:'北海道'}[v] || v + '県');
  };
  const byId = new Map();
  const dedupe = new Set();
  const add = (id, row) => {
    if (!id || !row.pref || !official(row.source)) return;
    const key = [id,row.kind,row.year,row.eventKey,row.pref].join('|');
    if (dedupe.has(key)) return;
    dedupe.add(key);
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id).push(row);
  };
  const allRosters = [roster2011,roster2012,roster2013,roster2014,roster2015,
    roster2016,roster2017,roster2018,roster2019,roster2020,roster2021,
    roster2022,roster2023,roster2024,roster2025];
  for (let year=2011;year<=2025;year++) for(const item of allRosters[year-2011]) {
    const pref=fullPref(item['prefecture'+year]);
    if (!pref) continue; // No year-by-year interpolation from the latest prefecture.
    add(item.playerId,{kind:'champ',year,pref,source:item.source,
      eventKey:item.event,gender:item.gender,description:'全日本選手権・登録県'});
  }
  // The 2026 championship 128 IDs carry the registered prefecture from that
  // year's official roster; never reuse that field for another year.
  const pmap=new Map(players.map(p=>[p.id,p]));
  for(const r of records) if(r.event==='m74'||r.event==='w65') {
    const p=pmap.get(r.player);if(!p)continue;
    add(p.id,{kind:'champ',year:2026,pref:fullPref(p.pref),
      source:r.event==='m74'?'https://www.kendo.or.jp/competition/champ-74th/':'https://www.kendo.or.jp/competition/champ-joshi-65th/',
      eventKey:r.event,gender:p.gender,description:'全日本選手権・登録県'});
  }
  // A-linked registered roster only. Registration never implies an actual bout.
  for(const r of todo2026.roster) {
    if(!r.playerId || !String(r.identityStatus||'').startsWith('A-'))continue;
    add(r.playerId,{kind:'team',year:2026,pref:fullPref(r.prefecture),source:r.source,
      eventKey:'td26-'+r.gender,gender:r.gender,description:'都道府県対抗・代表県（登録のみ）'});
  }
  for(const [id,profile] of Object.entries(todoWomenLinkedProfiles)) for(const r of profile.entries||[]) {
    add(id,{kind:'team',year:r.year,pref:fullPref(r.prefecture),source:r.source,
      eventKey:'tdw'+r.year,gender:'女子',description:'都道府県対抗女子・代表県（登録のみ）'});
  }
  // A-confirmed Tozai participants whose official source explicitly lists a prefecture.
  const identityEvidence=new Map();
  for(let round=256;round<=281;round++) {
    const group=window['KENDO_TOZAI_IDENTITY_'+round];
    for(const [boutId,parts] of Object.entries(group?.evidence||{}))
      for(const [side,item] of Object.entries(parts||{})) identityEvidence.set(boutId+'|'+side,item);
  }
  const tozaiById=new Map();
  for(const event of window.KENDO_TOZAI_PUBLIC?.records||[]) for(const bout of event.bouts||[])
    tozaiById.set(bout.id,{event,bout});
  for(const [boutId,sides] of Object.entries(window.KENDO_TOZAI_PROFILE_LINKS?.links||{}))
    for(const [side,id] of Object.entries(sides)) {
      const src=identityEvidence.get(boutId+'|'+side), pair=tozaiById.get(boutId);
      if(!src||!pair||src.playerId!==id)continue;
      add(id,{kind:'tozai',year:pair.event.year,pref:fullPref(src.prefecture),
        source:src.rosterSource,eventKey:boutId,gender:pair.event.gender,
        description:'東西対抗・大会資料の県（人物照合A）'});
    }
  const sourceLink = source => `<a class="data-link" href="${esc(source)}" target="_blank" rel="noopener noreferrer">全剣連公式資料 ↗</a>`;
  const internalLink = r => {
    const label=r.kind==='champ'?`${r.year===2020?'2020年大会（延期）':r.year+'年'}・全日本${r.gender==='女子'?'女子':''}選手権`:
      r.kind==='team'?`${r.year}年・都道府県対抗${r.gender==='女子'?'女子':''}`:`${r.year}年・東西対抗${r.gender==='女子'?'女子':''}`;
    if (r.kind==='champ') return `<a class="data-link" href="#/event/${esc(r.eventKey)}">${esc(label)}</a>`;
    if (r.kind==='team'&&r.year===2026) return `<a class="data-link" href="#/todo2026">${esc(label)}</a>`;
    if (r.kind==='tozai') return `<a class="data-link" href="tozai.html?year=${r.year}&gender=${encodeURIComponent(r.gender)}&bout=${encodeURIComponent(r.eventKey)}">${esc(label)}</a>`;
    return esc(label); // Historical prefectural team competitions lack a site year route.
  };
  function render() {
    const match=(location.hash||'').match(/^#\/player\/([^/?]+)/);
    if(!match)return;
    let id; try{id=decodeURIComponent(match[1]);}catch{return;}
    const grid=document.querySelector('#app .profile-grid');
    if(!grid || grid.querySelector('.player-roster-history-282'))return;
    const history=byId.get(id);
    const employment=lastEventAffiliations[id];
    const hasEmployment=Boolean(employment?.aff && official(employment?.source));
    if(!history?.length && !hasEmployment)return;
    const sorted=[...(history||[])].sort((a,b)=>b.year-a.year||({champ:0,team:1,tozai:2}[a.kind]-{champ:0,team:1,tozai:2}[b.kind])||a.eventKey.localeCompare(b.eventKey));
    const body=sorted.map(r=>`<tr><td>${internalLink(r)}</td><td><strong>${esc(r.pref)}</strong></td><td>${esc(r.description)}</td><td>${sourceLink(r.source)}</td></tr>`).join('');
    const occupation=hasEmployment?`<p class="small"><strong>職業・勤務先（${esc(employment.year)}年の全日本選手権資料）：</strong>${esc(employment.aff)} ／ ${sourceLink(employment.source)}</p>`:'';
    const section=document.createElement('section');section.className='pane wide player-roster-history-282';
    section.style.padding='0';
    section.innerHTML=`<div class="pane-pad"><h3 class="section-title">大会横断・所属県／代表県の履歴（${sorted.length}件）</h3><p class="small muted">各年度の<strong>公式名簿・大会資料に県の記載がある場合のみ</strong>掲載。全日本選手権の登録県、都道府県対抗の代表県、東西対抗の大会資料上の県は意味が異なるため、別々に示しています。県の変更だけで転籍・移住・同姓同名の別人とは判定しません。都道府県対抗の登録は本人実戦を意味しません。県が未確認の年度や人物照合B保留は、この表に推測で加えていません。職業・勤務先は別欄にある公式最終確認分のみを掲載し、在職の継続は推定しません。</p>${occupation}</div>${sorted.length?`<div class="table-wrap"><table class="profile-match-table"><thead><tr><th>年度・大会（記録へ）</th><th>当時の県</th><th>資料上の区分</th><th>一次資料</th></tr></thead><tbody>${body}</tbody></table></div>`:""}`;
    const target=grid.querySelector('.profile-history');
    if(target)grid.insertBefore(section,target);else grid.appendChild(section);
  }
  window.KENDO_PLAYER_ROSTER_AUDIT_282={version:282,rows:[...byId.values()].reduce((s,v)=>s+v.length,0),players:byId.size,employmentSources:Object.values(lastEventAffiliations).filter(x=>x.aff&&official(x.source)).length};
  window.addEventListener('hashchange',render);render();
})();
