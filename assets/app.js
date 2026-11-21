'use strict';
(() => {
  const app=document.getElementById('app');
  const nav=[['#/','⌂','ホーム'],['#/players','♙','選手名鑑'],['#/events','♜','大会データ'],['#/wkc','◎','世界選手権'],['#/rankings','▥','ランキング'],['#/compare','⇄','選手比較'],['#/updates','≡','更新履歴']];
  const prefecturesNorthSouth=['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];
  let playerQuery='', genderFilter='すべて', prefFilter='すべて', eventQuery='', eventGender='すべて', eventYear='すべて', rankMetric='wins',rankGender='すべて',compA='m002',compB='m005';
  const norm=s=>String(s??'').normalize('NFKC').replace(/[\s　]+/g,'').replace(/[﨑崎]/g,'崎').replace(/[髙高]/g,'高').toLowerCase();
  const normKana=s=>norm(s).replace(/[ァ-ヶ]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-96));
  // Normalize only the human-readable name, retaining source rosters and player IDs.
  const displayNameForRaw=raw=>{
    const shown=String(raw??'').trim().replace(/[\s　]+/g,' ');
    return historicalDisplayNames[shown.replace(/ /g,'')]||shown;
  };
  for (const p of players) p.name=displayNames[p.id]||p.name;
  for (const p of players) { const r=nameReadings[p.id];p.reading=r?.reading||'';p.readingStatus=r?.status||'未確認'; }
  // Latest-attended-championship occupations: only apply to empty/unverified source fields.
  for (const p of players) {
    const lastAff=lastEventAffiliations[p.id];
    if (lastAff && (!p.aff || /未入力|未登録|未確認/.test(p.aff))) {
      p.aff=lastAff.aff;
      p.affAsOfYear=lastAff.year;
      p.affSourceUrl=lastAff.source;
    }
  }
  // Identity links are shared by the player directory, historic match rendering and WKC pages.
  // Identity registry must not generate additional player records or independent rankings.
  for (const p of players) {
    const identity=identityLinks[p.id];
    if (!identity) continue;
    p.nameAliases=[...new Set([...(p.nameAliases||[]),...identity.formerNames])];
    p.readingAliases=[...new Set([...(p.readingAliases||[]),identity.formerReading].filter(Boolean))];
    p.formerName=identity.formerNames[0];
    p.formerReading=identity.formerReading;
    p.identitySource=identity.identitySource;
    p.oldNameReadingSource=identity.oldNameReadingSource;
  }
  // Historic official-roster spellings, under one stable identity, are searchable.
  const historicNameIndex=new Map();
  for (const r of [roster2011,roster2012,roster2013,roster2014,roster2015,roster2016,roster2017,roster2018,roster2019,roster2020,roster2021,roster2022,roster2023,roster2024,roster2025].flat()) {
    if (!r.name || !r.playerId) continue;
    const names=historicNameIndex.get(r.playerId)||new Set();names.add(r.name);historicNameIndex.set(r.playerId,names);
  }
  for (const p of players) {
    const old=[...(historicNameIndex.get(p.id)||[])].filter(n=>norm(n)!==norm(p.name));
    if (old.length) p.nameAliases=[...new Set([...(p.nameAliases||[]),...old])];
  }
  const readingCount=players.filter(p=>p.readingStatus==='A').length;
  const readingLabel=p=>p.reading?`<span class="name-reading">${esc(p.reading)}</span>`:'';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const asText=s=>s?esc(s):'<span class="muted">未登録</span>';
  const playerIdAliases={"m11_02":"m13_62","m21_26":"m24_31","w19_47":"w25_04","w19_45":"w23_33","w13_30":"w25_05","w14_18":"w20_30","w12_64":"w13_24","w13_16":"w18_64","w13_07":"w15_36","w16_12":"w17_49","w13_50":"w17_08","w14_26":"w20_25","w14_03":"w20_31","w13_12":"w14_20","w16_49":"w19_61","w17_63":"w19_27","w19_38":"w24_14","w19_63":"w24_05","w12_23":"w034"}; // 2021 凛 / 2024 凜, verified same person
  const canonicalPlayerId=id=>playerIdAliases[id]||id;
  const playersById=new Map(players.map(p=>[p.id,p]));
  const eventsById=new Map(events.map(e=>[e.id,e]));
  const findP=id=>playersById.get(canonicalPlayerId(id)),findE=id=>eventsById.get(id);
  const eventGradeFor=(eventId,playerId)=>eventGrades[eventId]?.[canonicalPlayerId(playerId)]?.grade||'';
  const eventGradeDisplay=(eventId,playerId)=>{const value=eventGradeFor(eventId,playerId);return value?esc(value):'<span class="muted">—</span>';};
  const past=records.filter(r=>r.kind==='past');
  const complete=records.filter(r=>r.kind==='past'||r.kind==='current'||r.kind==='legacy');
  const verifiedBanner='<div class="privacy-banner"><strong>このサイトの掲載範囲</strong> 本サイトは全日本剣道連盟の公式サイトではありません。ランキング・比較は男女とも2012〜2026年の各15大会を対象に集計。2011年男子は参考記録のみで、女子2011年以前は非収録です。2020年大会は2021年3月14日開催（延期開催）として2021年大会とは区別しています。延長未確認77試合・取得技未確認2試合は推測で補わず、確認できた項目だけを集計します。<a class="data-link" href="#/updates">確認の経緯・更新履歴</a></div>';
  const oldByPlayer=new Map(players.map(p=>[p.id,matchesHistorical.filter(m=>m.player===p.id && !['m65','w56','m66','w57','m67','w58','m68','w59','m69','w60','m70','w61','m71','w62','m72','w63','m73','w64'].includes(m.event))]));
  const official2011Event=e=>['m59'].includes(typeof e==='string'?e:e.id);
  const official2012Event=e=>['m60','w51'].includes(typeof e==='string'?e:e.id);
  const official2013Event=e=>['m61','w52'].includes(typeof e==='string'?e:e.id);
  const official2014Event=e=>['m62','w53'].includes(typeof e==='string'?e:e.id);
  const official2015Event=e=>['m63','w54'].includes(typeof e==='string'?e:e.id);
  const official2016Event=e=>['m64','w55'].includes(typeof e==='string'?e:e.id);
  const official2017Event=e=>['m65','w56'].includes(typeof e==='string'?e:e.id);
  const official2018Event=e=>['m66','w57'].includes(typeof e==='string'?e:e.id);
  const official2019Event=e=>['m67','w58'].includes(typeof e==='string'?e:e.id);
  const official2025Event=e=>['m73','w64'].includes(typeof e==='string'?e:e.id);
  const official2024Event=e=>['m72','w63'].includes(typeof e==='string'?e:e.id);
  const official2023Event=e=>['m71','w62'].includes(typeof e==='string'?e:e.id);
  const official2022Event=e=>['m70','w61'].includes(typeof e==='string'?e:e.id);
  const official2020Event=e=>['m68','w59'].includes(typeof e==='string'?e:e.id);
  const official2021Event=e=>['m69','w60'].includes(typeof e==='string'?e:e.id);
  const fullOfficialEvent=e=>official2011Event(e) || official2012Event(e) || official2013Event(e) || official2014Event(e) || official2015Event(e) || official2016Event(e) || official2017Event(e) || official2018Event(e) || official2019Event(e) || e.year===2026 || official2025Event(e) || official2024Event(e) || official2023Event(e) || official2022Event(e) || official2021Event(e) || official2020Event(e);
  const fullMatchesFor=e=>official2011Event(e)?matches2011.filter(m=>m.event===e.id):official2012Event(e)?matches2012.filter(m=>m.event===e.id):official2013Event(e)?matches2013.filter(m=>m.event===e.id):official2014Event(e)?matches2014.filter(m=>m.event===e.id):official2015Event(e)?matches2015.filter(m=>m.event===e.id):official2016Event(e)?matches2016.filter(m=>m.event===e.id):official2017Event(e)?matches2017.filter(m=>m.event===e.id):official2018Event(e)?matches2018.filter(m=>m.event===e.id):official2019Event(e)?matches2019.filter(m=>m.event===e.id):e.year===2026?matches2026.filter(m=>m.event===e.id):official2025Event(e)?matches2025.filter(m=>m.event===e.id):official2024Event(e)?matches2024.filter(m=>m.event===e.id):official2023Event(e)?matches2023.filter(m=>m.event===e.id):official2022Event(e)?matches2022.filter(m=>m.event===e.id):official2021Event(e)?matches2021.filter(m=>m.event===e.id):official2020Event(e)?matches2020.filter(m=>m.event===e.id):[];
  const prefectureFor=(e,p)=>official2011Event(e)?(roster2011.find(x=>x.playerId===p.id && x.gender===e.gender)?.prefecture2011||'未確認'):official2012Event(e)?(roster2012.find(x=>x.playerId===p.id && x.gender===e.gender)?.prefecture2012||'未確認'):official2013Event(e)?(roster2013.find(x=>x.playerId===p.id && x.gender===e.gender)?.prefecture2013||'未確認'):official2014Event(e)?(roster2014.find(x=>x.playerId===p.id && x.gender===e.gender)?.prefecture2014||p.pref):official2015Event(e)?(roster2015.find(x=>x.playerId===p.id && x.gender===e.gender)?.prefecture2015||p.pref):official2016Event(e)?(roster2016.find(x=>x.playerId===p.id && x.gender===e.gender)?.prefecture2016||p.pref):official2017Event(e)?(roster2017.find(x=>x.playerId===p.id && x.gender===e.gender)?.prefecture2017||p.pref):official2018Event(e)?(roster2018.find(x=>x.playerId===p.id && x.gender===e.gender)?.prefecture2018||p.pref):official2019Event(e)?(roster2019.find(x=>x.playerId===p.id && x.gender===e.gender)?.prefecture2019||p.pref):official2020Event(e)?(roster2020.find(x=>x.playerId===p.id && x.gender===e.gender)?.prefecture2020||p.pref):official2021Event(e)?(roster2021.find(x=>x.playerId===p.id && x.gender===e.gender)?.prefecture2021||p.pref):official2022Event(e)?(roster2022.find(x=>x.playerId===p.id && x.gender===e.gender)?.prefecture2022||p.pref):official2023Event(e)?(roster2023.find(x=>x.playerId===p.id && x.gender===e.gender)?.prefecture2023||p.pref):official2024Event(e)?(roster2024.find(x=>x.playerId===p.id && x.gender===e.gender)?.prefecture2024||p.pref):official2025Event(e)?(roster2025.find(x=>x.playerId===p.id && x.gender===e.gender)?.prefecture2025||p.pref):p.pref;
  const archivedNameFor=(e,p)=>displayNameForRaw(official2011Event(e)?(roster2011.find(x=>x.playerId===p.id && x.gender===e.gender)?.name||p.name):official2012Event(e)?(roster2012.find(x=>x.playerId===p.id && x.gender===e.gender)?.name||p.name):official2013Event(e)?(roster2013.find(x=>x.playerId===p.id && x.gender===e.gender)?.name||p.name):official2014Event(e)?(roster2014.find(x=>x.playerId===p.id && x.gender===e.gender)?.name||p.name):official2015Event(e)?(roster2015.find(x=>x.playerId===p.id && x.gender===e.gender)?.name||p.name):official2016Event(e)?(roster2016.find(x=>x.playerId===p.id && x.gender===e.gender)?.name||p.name):official2017Event(e)?(roster2017.find(x=>x.playerId===p.id && x.gender===e.gender)?.name||p.name):official2018Event(e)?(roster2018.find(x=>x.playerId===p.id && x.gender===e.gender)?.name||p.name):official2019Event(e)?(roster2019.find(x=>x.playerId===p.id && x.gender===e.gender)?.name||p.name):official2020Event(e)?(roster2020.find(x=>x.playerId===p.id && x.gender===e.gender)?.name||p.name):official2021Event(e)?(roster2021.find(x=>x.playerId===p.id && x.gender===e.gender)?.name||p.name):official2022Event(e)?(roster2022.find(x=>x.playerId===p.id && x.gender===e.gender)?.name||p.name):official2023Event(e)?(roster2023.find(x=>x.playerId===p.id && x.gender===e.gender)?.name||p.name):official2024Event(e)?(roster2024.find(x=>x.playerId===p.id && x.gender===e.gender)?.name||p.name):official2025Event(e)?(roster2025.find(x=>x.playerId===p.id && x.gender===e.gender)?.name||p.name):p.name);
  const oldByEvent=new Map(events.map(e=>[e.id,matchesHistorical.filter(m=>m.event===e.id && !official2013Event(e) && !official2014Event(e) && !official2015Event(e) && !official2016Event(e) && !official2017Event(e) && !official2018Event(e) && !official2019Event(e) && !official2025Event(e) && !official2024Event(e) && !official2023Event(e) && !official2022Event(e) && !official2021Event(e) && !official2020Event(e))]));
  const techniqueByPlayer=new Map(players.map(p=>[p.id,strikesHistorical.filter(t=>t.player===p.id)]));
  const techAbbr={'面':'メ','小手':'コ','胴':'ド','突き':'ツ'};
  const technical2026=(p,kind)=>matches2026.reduce((n,m)=>{
    const side=p.id===m.left?'left':(p.id===m.right?'right':'');
    const codes=side?m[side+'Tech']:'';
    const target=techAbbr[kind]||'反';
    return n+[...codes].filter(x=>x===target).length;
  },0);
  const technical2024=(p,kind)=>matches2024.reduce((n,m)=>{const side=p.id===m.left?'left':(p.id===m.right?'right':'');return n+(side?[...(m[side+'Tech']||'')].filter(x=>x===(techAbbr[kind]||'反')).length:0)},0);
  const technical2025=(p,kind)=>matches2025.reduce((n,m)=>{const side=p.id===m.left?'left':(p.id===m.right?'right':'');return n+(side?[...(m[side+'Tech']||'')].filter(x=>x===(techAbbr[kind]||'反')).length:0)},0);
  const technical2023=(p,kind)=>matches2023.reduce((n,m)=>{const side=p.id===m.left?'left':(p.id===m.right?'right':'');return n+(side?[...(m[side+'Tech']||'')].filter(x=>x===(techAbbr[kind]||'反')).length:0)},0);
  const technical2020=(p,kind)=>matches2020.reduce((n,m)=>{const side=p.id===m.left?'left':(p.id===m.right?'right':'');return n+(side?[...(m[side+'Tech']||'')].filter(x=>x===(techAbbr[kind]||'反')).length:0)},0);
  const technical2021=(p,kind)=>matches2021.reduce((n,m)=>{const side=p.id===m.left?'left':(p.id===m.right?'right':'');return n+(side?[...(m[side+'Tech']||'')].filter(x=>x===(techAbbr[kind]||'反')).length:0)},0);
  const technical2022=(p,kind)=>matches2022.reduce((n,m)=>{const side=p.id===m.left?'left':(p.id===m.right?'right':'');return n+(side?[...(m[side+'Tech']||'')].filter(x=>x===(techAbbr[kind]||'反')).length:0)},0);
  const technical2014=(p,kind)=>matches2014.reduce((n,m)=>{const side=p.id===m.left?'left':(p.id===m.right?'right':'');return n+(side?[...(m[side+'Tech']||'')].filter(x=>x===(techAbbr[kind]||'反')).length:0)},0);
  const technical2015=(p,kind)=>matches2015.reduce((n,m)=>{const side=p.id===m.left?'left':(p.id===m.right?'right':'');return n+(side?[...(m[side+'Tech']||'')].filter(x=>x===(techAbbr[kind]||'反')).length:0)},0);
  const technical2016=(p,kind)=>matches2016.reduce((n,m)=>{const side=p.id===m.left?'left':(p.id===m.right?'right':'');return n+(side?[...(m[side+'Tech']||'')].filter(x=>x===(techAbbr[kind]||'反')).length:0)},0);
  const technical2017=(p,kind)=>matches2017.reduce((n,m)=>{const side=p.id===m.left?'left':(p.id===m.right?'right':'');return n+(side?[...(m[side+'Tech']||'')].filter(x=>x===(techAbbr[kind]||'反')).length:0)},0);
  const technical2018=(p,kind)=>matches2018.reduce((n,m)=>{const side=p.id===m.left?'left':(p.id===m.right?'right':'');return n+(side?[...(m[side+'Tech']||'')].filter(x=>x===(techAbbr[kind]||'反')).length:0)},0);
  const technical2019=(p,kind)=>matches2019.reduce((n,m)=>{const side=p.id===m.left?'left':(p.id===m.right?'right':'');return n+(side?[...(m[side+'Tech']||'')].filter(x=>x===(techAbbr[kind]||'反')).length:0)},0);
  // 同一基準の連続収録期間のみ。男女混合の場合も双方2012年以降。
  const startYearFor=gender=>2012;
  const allScopedMatches=[matches2011,matches2012,matches2013,matches2014,matches2015,matches2016,matches2017,matches2018,matches2019,matches2020,matches2021,matches2022,matches2023,matches2024,matches2025,matches2026].flat();
  const countedTechs=new Map();
  function techCount(p,kind,startYear=startYearFor(p.gender)){
    const key=p.id+'|'+kind+'|'+startYear;
    if(countedTechs.has(key))return countedTechs.get(key);
    const target=techAbbr[kind]||'反';
    const n=allScopedMatches.reduce((n,m)=>{
      // Exclude unverified strike types, but preserve the match, winner and point count.
      if(findE(m.event).year<startYear||m.gender!==p.gender||m.techVerified==='B')return n;
      const side=m.left===p.id?'left':(m.right===p.id?'right':'');
      return n+(side?[...(m[side+'Tech']||'')].filter(t=>t===target).length:0);
    },0);
    countedTechs.set(key,n);return n;
  }
  function aggregate(p,startYear=startYearFor(p.gender)){
    const rs=complete.filter(r=>r.player===p.id && findE(r.event).year>=startYear && r.kind!=='legacy');
    const current=rs.find(r=>r.kind==='current');
    return {appearances:rs.length,pastAppearances:rs.filter(r=>r.kind==='past').length,
      wins:rs.reduce((s,r)=>s+(r.wins??0),0),titles:rs.filter(r=>r.finish==='優勝').length,
      finals:rs.filter(r=>['優勝','準優勝'].includes(r.finish)).length,
      currentWins:current?.wins??0,currentFinish:current?.finish??'未登録',
      historical:0,men:techCount(p,'面',startYear),kote:techCount(p,'小手',startYear),
      do:techCount(p,'胴',startYear),tsuki:techCount(p,'突き',startYear)};
  }
  const profileRow=(label,value)=>`<div>${esc(label)}</div><div>${value?esc(value):'<span class="muted">未登録</span>'}</div>`;

  // Fields awaiting official evidence are kept exclusively in the separate research audit.
  // For current students, the official page supports enrollment, not graduation.
  const educationFor=(p,kind)=>{
    const isHigh=kind==='high', enrolled=isHigh?p.enrolledHigh:p.enrolledUniversity;
    const label=enrolled?(isHigh?'在籍高校（2026年）':'在籍大学（2026年）'):(isHigh?'出身高校':'出身大学');
    const pending=isHigh?p.highUnderReview:p.univUnderReview;
    const value=enrolled||p[kind]||'';
    return {label,value,pending:Boolean(pending),notApplicable:!isHigh&&Boolean(p.univNotApplicable)};
  };
  const educationText=(p,kind)=>{const e=educationFor(p,kind);return e.value?e.value+(e.label.startsWith('在籍')?'（在学・2026年）':''):(e.pending?'確認中（非表示）':(e.notApplicable?'—':'未登録'));};
  const educationCardRow=(p,kind)=>{const e=educationFor(p,kind);return `<dt>${esc(e.label)}</dt><dd>${e.value?esc(e.value):'<span class="muted">'+(e.pending?'確認中（非表示）':e.notApplicable?'—':'未登録')+'</span>'}</dd>`;};
  const educationProfileRow=(p,kind)=>{const e=educationFor(p,kind);return `<div>${esc(e.label)}</div><div>${e.value?esc(e.value):'<span class="muted">'+(e.pending?'確認中（非表示）':e.notApplicable?'—':'未登録')+'</span>'}</div>`;};

  const statCard=(label,value,suffix,foot)=>`<div class="stat"><div class="stat-label">${esc(label)}</div><div class="stat-value">${esc(value)}<span class="stat-suffix">${esc(suffix)}</span></div><div class="stat-foot">${esc(foot)}</div></div>`;
  const badge=(t,k='')=>`<span class="tag ${k}">${esc(t)}</span>`;
  const pLink=p=>p?`<a class="data-link" href="#/player/${encodeURIComponent(p.id)}">${esc(p.name)}</a>${readingLabel(p)}`:'（選手不明）';
  const eDisplay=e=>e.year===2020?`2020年大会 ${e.edition} ${e.name}（2021年3月14日開催・延期開催）`:`${e.year}年度 ${e.edition} ${e.name}${e.heldYear!==e.year?`（${e.heldYear}年開催）`:''}`;
  const eLink=e=>e?`<a class="data-link" href="#/event/${encodeURIComponent(e.id)}">${esc(eDisplay(e))}</a>`:'（大会不明）';
  const sourceLink=(url,title='公式大会ページ')=>/^https:\/\/(www|old2)\.kendo\.or\.jp\//.test(url||'')?`<a class="data-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)} ↗</a>`:'—';

  // Round 41: official event-page availability is not equivalent to match-level evidence.
  const sourceScopeLimit={
    m62:'2014年男子：旧全剣連公式ギャラリーには全63試合の動画が番号順に掲載されています。旧公式結果HTMLの試合欄は空欄であり、動画一覧だけでは各試合の得点・技・反則・延長を検証済みとはいえません。',
    m74:'2026年男子：公式大会ページは入賞者・出場選手を確認できますが、今回取得できた本文では個別試合結果表を直接確認できません。得点・技等の根拠は個別資料と対応づけて照合中です。',
    w65:'2026年女子：公式大会ページは入賞者・出場選手を確認できますが、今回取得できた本文では個別試合結果表を直接確認できません。得点・技等の根拠は個別資料と対応づけて照合中です。'
  };
  const sourceScopeNote=e=>sourceScopeLimit[e?.id]?`<p class="small muted result-entry-note"><strong>出典の確認範囲：</strong>${esc(sourceScopeLimit[e.id])} （既存の試合記録・A/B判定は変更していません）</p>`:'';

  // Round 42: source routes, not new score/technique/overtime verification.
  // All 63 men's 2014 bouts are indexed by bout number in the official AJKF gallery.
  const officialVideoGallery2014='https://old2.kendo.or.jp/competition/champ/62nd/gallery/';
  const officialBoutVideo2014={27:'https://www.youtube.com/watch?v=57F5zptVX0I',55:'https://www.youtube.com/watch?v=1LxW1lrcmPA',60:'https://www.youtube.com/watch?v=z3AraQCLx6Q'};
  const isOfficialYouTubeUrl=u=>/^https:\/\/(?:www\.)?youtube\.com\/watch\?v=[-\w]{11}(?:&.*)?$|^https:\/\/youtu\.be\/[-\w]{11}(?:\?.*)?$/.test(u||'');
  const boutEvidenceRoute=m=>{
    if(m.event==='m62'){
      const n=m.globalMatchNumber;const direct=officialBoutVideo2014[n];
      if(direct && isOfficialYouTubeUrl(direct))return {url:direct,label:'公式試合動画',detail:`旧全剣連公式ギャラリー・第${n}試合。映像内容未再視認`};
      return {url:officialVideoGallery2014,label:`公式動画一覧（第${n}試合）`,detail:`旧全剣連公式ギャラリー・全63試合を番号順に掲載。映像内容未再視認`};
    }
    if(m.event==='m74'||m.event==='w65'){
      const url=m.overtimeOfficialVideo||m.overtimeReviewVideoURL||m.techEvidenceURL;
      if(isOfficialYouTubeUrl(url))return {url,label:'試合別動画',detail:'以前の調査で収録した動画リンク。今回の映像内容の再視認は未実施'};
    }
    return null;
  };
  const boutEvidenceLink=m=>{
    const ev=boutEvidenceRoute(m),extra=[];
    if(ev)extra.push(`<a class="data-link" href="${esc(ev.url)}" target="_blank" rel="noopener noreferrer" title="${esc(ev.detail)}">${esc(ev.label)} ↗</a>`);
    if(m.event==='m74'&&m.overtimeEvidenceURL&&/^https:\/\/wakayama-kendo\.com\//.test(m.overtimeEvidenceURL))extra.push(`<a class="data-link" href="${esc(m.overtimeEvidenceURL)}" target="_blank" rel="noopener noreferrer" title="小倉－星子戦の延長に言及する県剣連の記事">県剣連公式記事 ↗</a>`);
    if(m.event==='w65'&&m.techEvidenceConflictURL&&/^https:\/\/kyodonewsprwire\.jp\//.test(m.techEvidenceConflictURL))extra.push(`<a class="data-link" href="${esc(m.techEvidenceConflictURL)}" target="_blank" rel="noopener noreferrer" title="公式動画のタイトルと技表記が食い違う公式プレス資料">公式プレス資料（表記不一致） ↗</a>`);
    return extra.length?`<span class="row-sub source-route">${extra.join(' ／ ')}<span class="muted source-route-note">（出典導線・内容の再視認未実施）</span></span>`:'';
  };

  const sourceScopeUnverified=e=>Boolean(sourceScopeLimit[e?.id]);

  const reportLink=(url,label='試合別結果の参照元')=>/^https:\/\/(www\.letskendo\.com|www\.sportzorg24\.tv)\//.test(url||'')?`<a class="data-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`:'—';
  // All player-specific 2026 result rows are displayed from the chosen player's perspective.
  // The source sheet retains winner/loser points separately; do not mutate it.
  const matchPoints=m=>m.winPoints===null?'得点詳細未確認':`${m.winPoints} - ${m.losePoints}`;
  const scoreNumber=n=>n==null?'—':String(n);
  const cleanTech=s=>String(s||'').trim();
  function playerOrientedScore2026(m,profileId){
    const isWinner=profileId===m.winner, isLeft=profileId===m.left;
    const ownPoints=isWinner?m.winPoints:m.losePoints;
    const oppPoints=isWinner?m.losePoints:m.winPoints;
    const ownTech=cleanTech(isLeft?m.leftTech:m.rightTech);
    const oppTech=cleanTech(isLeft?m.rightTech:m.leftTech);
    const ownFoul=Boolean(isLeft?m.leftFoul:m.rightFoul);
    const oppFoul=Boolean(isLeft?m.rightFoul:m.leftFoul);
    const triangle=(label)=>`<span class="foul-marker" role="img" aria-label="${label}に反則の記録あり" title="${label}に反則の記録あり">▲</span>`;
    const techPending=m.techVerified==='B';const technique=techPending?'<span class="tech-side">技未確認</span>':`<span class="tech-side">${ownTech?esc(ownTech):'&emsp;'}</span><span class="tech-separator">-</span><span class="tech-side">${oppTech?esc(oppTech):'&emsp;'}</span>`;
    return `<div class="oriented-score" aria-label="本人 ${scoreNumber(ownPoints)} 本、相手 ${scoreNumber(oppPoints)} 本。取得技 ${m.techVerified==='B'?'未確認':(ownTech||'なし')}、相手の技 ${m.techVerified==='B'?'未確認':(oppTech||'なし')}">
       <strong class="score-numbers">${scoreNumber(ownPoints)} - ${scoreNumber(oppPoints)}</strong>
       <div class="score-techs">${ownFoul?triangle('本人'):'<span class="foul-spacer" aria-hidden="true"></span>'}<span class="tech-parentheses">（${technique}）</span>${oppFoul?triangle('相手'):'<span class="foul-spacer" aria-hidden="true"></span>'}</div>
      </div>`;
  }
  function matchRows2026(ms,profileId='') {return ms.map(m=>{
    const left=findP(m.left),right=findP(m.right),win=findP(m.winner);
    const own=profileId&&profileId===m.winner;
    const opp=profileId?findP(profileId===m.left?m.right:m.left):null;
    const leftFoul=m.leftFoul?' ▲':'';const rightFoul=m.rightFoul?' ▲':'';
    const extensionState=['あり','なし','未確認'].includes(m.overtimeStatus)?m.overtimeStatus:(m.overtime===true?'あり':m.overtime===false?'なし':'未確認');
    const extensionLabel=extensionState==='あり'?badge('延長あり','green'):(extensionState==='なし'?badge('延長なし',''):badge('延長未確認',''));
    const matchCard=(profileId?pLink(opp):(pLink(left)+leftFoul+' <span class="muted">対</span> '+pLink(right)+rightFoul))+boutEvidenceLink(m);
    // Player-specific views: the selected player is always on the left, even when they lost.
    if(profileId){return `<tr><td>${esc(m.round)} ${extensionLabel}</td><td>${matchCard}</td><td>${badge(own?'勝':'負',own?'green':'amber')}</td><td>${playerOrientedScore2026(m,profileId)}</td></tr>`;}
    const skills=m.techVerified==='B'?'技未確認（公式資料で表記不一致）':`${esc(m.leftTech||'—')} / ${esc(m.rightTech||'—')}<span class="row-sub">左 / 右 （反＝反則点）</span>`;
    return `<tr><td>${esc(m.round)} <span class="row-sub">${m.matchIndex}試合</span> ${extensionLabel}</td><td>${matchCard}</td><td>${pLink(win)}</td><td>${esc(matchPoints(m))}</td><td>${skills}</td></tr>`;
  }).join('');}
  const archiveSource=(url,label='出典資料')=>/^https:\/\//.test(url||'')?`<a class="data-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`:'—';
  const roundNo={ '1回戦':1,'2回戦':2,'3回戦':3,'4回戦':4,'準々決勝':4,'準決勝':5,'決勝':6 };
  const byRound=(a,b)=>(roundNo[a.round]||0)-(roundNo[b.round]||0);
  function historicalOpponent(m){
    const p=m.opponentId?findP(m.opponentId):null;
    // Preserve the archived bracket spelling and former name next to a current-profile link.
    return p?`${pLink(p)}${norm(m.opponentName)!==norm(p.name)?`<span class="row-sub">当時の掲載名：${esc(displayNameForRaw(m.opponentName))}</span>`:''}`:esc(displayNameForRaw(m.opponentName));
  }
  function ownMatchRow(m){
    const good=m.result==='勝';
    const extended=m.overtime==='延長'?badge('延長'):'';
    const fouls=(m.ownFouls==null||m.opponentFouls==null)?'—':`${esc(m.ownFouls)} / ${esc(m.opponentFouls)}`;
    const technique=(m.ownTech&&m.ownTech!=='—'?'得 '+esc(m.ownTech):'')+(m.opponentTech&&m.opponentTech!=='—'?`<span class="row-sub">被 ${esc(m.opponentTech)}</span>`:'');
    return `<tr><td>${esc(m.round)} ${extended}</td><td>${historicalOpponent(m)}</td><td>${badge(good?'勝':'敗',good?'green':'amber')}</td><td>${technique||'未特定'}</td><td>${fouls}</td><td>${archiveSource(m.source,'出典')}</td></tr>`;
  }
  function renderHistoricPlayerMatches(p){return '';}
  function render2011PlayerHistory(p){
    if(p.gender!=='男子')return '';
    const ms=matches2011.filter(m=>m.left===p.id||m.right===p.id).sort((a,b)=>a.roundIndex-b.roundIndex);
    if(!ms.length)return '';
    const e=findE('m59');
    return `<section class="pane wide" style="padding:0"><div class="pane-pad"><h3 class="section-title">2011年・参考試合記録（${ms.length}試合）</h3><p class="small muted">ランキング対象外。全剣連公式試合結果の1巡目収録。${eLink(e)}</p></div><div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>技</th></tr></thead><tbody>${matchRows2026(ms,p.id)}</tbody></table></div></section>`;
  }
  function render2012PlayerHistory(p){
    if(p.gender==='女子' && p.isArchive2012)return '';
    const ms=matches2012.filter(m=>m.left===p.id||m.right===p.id).sort((a,b)=>a.roundIndex-b.roundIndex);
    if(!ms.length)return '';
    const e=findE(p.gender==='男子'?'m60':'w51');
    return `<section class="pane wide" style="padding:0"><div class="pane-pad"><h3 class="section-title">2012年・試合別結果（${ms.length}試合）</h3><p class="small muted">全剣連公式結果表から収録。延長判定はその後の公式結果表再照合を反映済み。${eLink(e)}</p></div><div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・技（本人 − 相手）</th></tr></thead><tbody>${matchRows2026(ms,p.id)}</tbody></table></div></section>`;
  }
  function render2013PlayerHistory(p){
    if(p.gender==='女子' && p.isArchive2013)return '';
    const ms=matches2013.filter(m=>m.left===p.id||m.right===p.id).sort((a,b)=>a.roundIndex-b.roundIndex);
    if(!ms.length)return '';
    const e=findE(p.gender==='男子'?'m61':'w52');
    return `<section class="pane wide" style="padding:0"><div class="pane-pad"><h3 class="section-title">2013年・試合別結果（${ms.length}試合）</h3><p class="small muted">全剣連公式結果ページから収録。延長判定の更新を反映済み。本人 - 対戦相手の順。${eLink(e)}</p></div><div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・技（本人 − 相手）</th></tr></thead><tbody>${matchRows2026(ms,p.id)}</tbody></table></div></section>`;
  }
  function render2014PlayerHistory(p){
    if(p.gender==='女子' && p.isArchive2014)return '';
    const ms=matches2014.filter(m=>m.left===p.id||m.right===p.id).sort((a,b)=>a.roundIndex-b.roundIndex);
    if(!ms.length)return '';
    const e=findE(p.gender==='男子'?'m62':'w53');
    const provenance='公式試合記録・公式動画掲載情報を照合済み（技などの未確認項目は個別保留）';
    return `<section class="pane wide" style="padding:0"><div class="pane-pad"><h3 class="section-title">2014年・試合別結果（${ms.length}試合）</h3><p class="small muted">${provenance}。男子は2巡目照合済み。本人 - 対戦相手の順。${eLink(e)}</p></div><div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・技（本人 − 相手）</th></tr></thead><tbody>${matchRows2026(ms,p.id)}</tbody></table></div></section>`;
  }
  function render2015PlayerHistory(p){
    if(p.isArchive2015)return '';
    const ms=matches2015.filter(m=>m.left===p.id||m.right===p.id).sort((a,b)=>a.roundIndex-b.roundIndex);
    if(!ms.length)return '';
    const e=findE(p.gender==='男子'?'m63':'w54');
    return `<section class="pane wide" style="padding:0"><div class="pane-pad"><h3 class="section-title">2015年・公式試合別結果（${ms.length}試合）</h3><p class="small muted">全剣連2015年公式全試合表で独立2巡目照合済み（不一致0件）。本人 - 対戦相手の順。${eLink(e)}</p></div><div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・技（本人 − 相手）</th></tr></thead><tbody>${matchRows2026(ms,p.id)}</tbody></table></div></section>`;
  }
  function render2016PlayerHistory(p){
    if(p.isArchive2016)return '';
    const ms=matches2016.filter(m=>m.left===p.id||m.right===p.id).sort((a,b)=>a.roundIndex-b.roundIndex);
    if(!ms.length)return '';
    const e=findE(p.gender==='男子'?'m64':'w55');
    return `<section class="pane wide" style="padding:0"><div class="pane-pad"><h3 class="section-title">2016年・公式試合別結果（${ms.length}試合）</h3><p class="small muted">全剣連2016年公式全試合表で独立2巡目照合済み（不一致0件）。本人 - 対戦相手の順。${eLink(e)}</p></div><div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・技（本人 − 相手）</th></tr></thead><tbody>${matchRows2026(ms,p.id)}</tbody></table></div></section>`;
  }
  function render2017PlayerHistory(p){
    if(p.isArchive2017)return '';
    const ms=matches2017.filter(m=>m.left===p.id||m.right===p.id).sort((a,b)=>a.roundIndex-b.roundIndex);
    if(!ms.length)return '';
    const e=findE(p.gender==='男子'?'m65':'w56');
    return `<section class="pane wide" style="padding:0"><div class="pane-pad"><h3 class="section-title">2017年・公式試合別結果（${ms.length}試合）</h3><p class="small muted">全剣連2017年公式全試合表で独立2巡目照合済み（不一致0件）。本人 - 対戦相手の順。${eLink(e)}</p></div><div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・技（本人 − 相手）</th></tr></thead><tbody>${matchRows2026(ms,p.id)}</tbody></table></div></section>`;
  }
  function render2018PlayerHistory(p){
    if(p.isArchive2018)return '';
    const ms=matches2018.filter(m=>m.left===p.id||m.right===p.id).sort((a,b)=>a.roundIndex-b.roundIndex);
    if(!ms.length)return '';
    const e=findE(p.gender==='男子'?'m66':'w57');
    return `<section class="pane wide" style="padding:0"><div class="pane-pad"><h3 class="section-title">2018年・公式試合別結果（${ms.length}試合）</h3><p class="small muted">全剣連2018年公式全試合表で独立2巡目照合済み（不一致0件）。本人 - 対戦相手の順。${eLink(e)}</p></div><div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・技（本人 − 相手）</th></tr></thead><tbody>${matchRows2026(ms,p.id)}</tbody></table></div></section>`;
  }
  function render2019PlayerHistory(p){
    if(p.isArchive2019)return '';
    const ms=matches2019.filter(m=>m.left===p.id||m.right===p.id).sort((a,b)=>a.roundIndex-b.roundIndex);
    if(!ms.length)return '';
    const e=findE(p.gender==='男子'?'m67':'w58');
    return `<section class="pane wide" style="padding:0"><div class="pane-pad"><h3 class="section-title">2019年・公式試合別結果（${ms.length}試合）</h3><p class="small muted">全剣連2019年公式全試合表に基づく。本人が左・対戦相手が右。${eLink(e)}</p></div><div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・技（本人 − 相手）</th></tr></thead><tbody>${matchRows2026(ms,p.id)}</tbody></table></div></section>`;
  }
  function render2020PlayerHistory(p){
    if(p.isArchive2020)return '';
    const ms=matches2020.filter(m=>m.left===p.id||m.right===p.id).sort((a,b)=>a.roundIndex-b.roundIndex);
    if(!ms.length)return '';
    const e=findE(p.gender==='男子'?'m68':'w59');
    return `<section class="pane wide" style="padding:0"><div class="pane-pad"><h3 class="section-title">2020年大会・公式試合別結果（${ms.length}試合）</h3><p class="small muted">2021年3月14日開催（延期開催）。2021年大会とは別の開催回です。本人 - 対戦相手の順。${eLink(e)}</p></div><div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・技（本人 − 相手）</th></tr></thead><tbody>${matchRows2026(ms,p.id)}</tbody></table></div></section>`;
  }
  function render2021PlayerHistory(p){
    if(p.isArchive2021)return '';
    const ms=matches2021.filter(m=>m.left===p.id||m.right===p.id).sort((a,b)=>a.roundIndex-b.roundIndex);
    if(!ms.length)return '';
    const e=findE(p.gender==='男子'?'m69':'w60');
    return `<section class="pane wide" style="padding:0"><div class="pane-pad"><h3 class="section-title">2021年度・公式試合別結果（${ms.length}試合）</h3><p class="small muted">全剣連2021年度全試合結果。本人が左・対戦相手が右。${eLink(e)}</p></div><div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・技（本人 − 相手）</th></tr></thead><tbody>${matchRows2026(ms,p.id)}</tbody></table></div></section>`;
  }
  function render2022PlayerHistory(p){
    if(p.isArchive2022)return '';
    const ms=matches2022.filter(m=>m.left===p.id||m.right===p.id).sort((a,b)=>a.roundIndex-b.roundIndex);
    if(!ms.length)return '';
    const e=findE(p.gender==='男子'?'m70':'w61');
    return `<section class="pane wide" style="padding:0"><div class="pane-pad"><h3 class="section-title">2022年・公式試合別結果（${ms.length}試合）</h3><p class="small muted">全剣連2022年全試合結果。本人が左・対戦相手が右。${eLink(e)}</p></div><div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・技（本人 − 相手）</th></tr></thead><tbody>${matchRows2026(ms,p.id)}</tbody></table></div></section>`;
  }
  function render2023PlayerHistory(p){
    if(p.isArchive2023)return '';
    const ms=matches2023.filter(m=>m.left===p.id||m.right===p.id).sort((a,b)=>a.roundIndex-b.roundIndex);
    if(!ms.length)return '';
    const e=findE(p.gender==='男子'?'m71':'w62');
    return `<section class="pane wide" style="padding:0"><div class="pane-pad"><h3 class="section-title">2023年・公式試合別結果（${ms.length}試合）</h3><p class="small muted">全剣連公式2023年全試合結果。本人が左・対戦相手が右。${eLink(e)}</p></div><div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・技（本人 − 相手）</th></tr></thead><tbody>${matchRows2026(ms,p.id)}</tbody></table></div></section>`;
  }
  function render2024PlayerHistory(p){
    if(p.isArchive2024)return '';
    const ms=matches2024.filter(m=>m.left===p.id||m.right===p.id).sort((a,b)=>a.roundIndex-b.roundIndex);
    if(!ms.length)return '';
    const e=findE(p.gender==='男子'?'m72':'w63');
    return `<section class="pane wide" style="padding:0"><div class="pane-pad"><h3 class="section-title">2024年・公式試合別結果（${ms.length}試合）</h3><p class="small muted">全剣連の2024年公式全試合結果から取得。本人が左・対戦相手が右。${eLink(e)}</p></div><div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・技（本人 − 相手）</th></tr></thead><tbody>${matchRows2026(ms,p.id)}</tbody></table></div></section>`;
  }
  function render2025PlayerHistory(p){
    if(p.isArchive2025)return '';
    const ms=matches2025.filter(m=>m.left===p.id||m.right===p.id).sort((a,b)=>a.roundIndex-b.roundIndex);
    if(!ms.length)return '';
    const e=findE(p.gender==='男子'?'m73':'w64');
    return `<section class="pane wide" style="padding:0"><div class="pane-pad"><h3 class="section-title">2025年・公式試合別結果（${ms.length}試合）</h3><p class="small muted">2025年出場者全64名の公式対戦表から取得。本人が左・対戦相手が右。${eLink(e)}</p></div><div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・技（本人 − 相手）</th></tr></thead><tbody>${matchRows2026(ms,p.id)}</tbody></table></div></section>`;
  }
  function renderTechniqueSummary(p){
    const a=aggregate(p),total=a.men+a.kote+a.do+a.tsuki, foul=techCount(p,'反則');
    return `<section class="pane wide"><h3 class="section-title">有効打突の内訳（${startYearFor(p.gender)}〜2026年・公式照合）</h3><p class="small muted">本人が取得した技のみ。${startYearFor(p.gender)}〜2026年の連続収録した公式全試合記録から算出。対象期間外・部分記録は加算しません。反則による一本は通常の有効打突から除外しています。</p><div class="tech-summary">${[['面',a.men],['小手',a.kote],['胴',a.do],['突き',a.tsuki]].map(([k,v])=>`<div><span>${k}</span><strong>${v}本</strong><small>${total?(100*v/total).toFixed(1):'—'}%</small></div>`).join('')}</div><p class="small muted" style="margin-top:12px">有効打突合計：${total}本 ／ 反則による一本：${foul}本（別集計）</p></section>`;
  }
  function eventHistoricalRows(id){
    const ms=oldByEvent.get(id)||[];let seen=new Set();const unique=[];
    for(const m of ms){const pair=m.opponentId?[m.player,m.opponentId].sort().join('::'):m.player+'::'+norm(m.opponentName);const key=m.event+'|'+m.round+'|'+pair;if(!seen.has(key)){seen.add(key);unique.push(m)}}
    unique.sort(byRound);
    if(!unique.length)return '<div class="eyecatch">この年度は、入賞・出場の確認記録のみを収録しています。全試合の勝敗や技は未復元のため、推定表示していません。</div>';
    return `<section class="pane" style="margin-top:20px"><div class="pane-pad"><h3 class="section-title">対象選手の過去の対戦記録（${unique.length}試合）</h3><p class="small muted">2026年の出場者に関係する試合のみ。双方が掲載対象の場合の重複を統合。大会全63試合を網羅した表ではありません。</p></div><div class="table-wrap"><table><thead><tr><th>回戦</th><th>対象選手</th><th>対戦相手</th><th>勝敗</th><th>決まり技</th><th>出典</th></tr></thead><tbody>${unique.map(m=>`<tr><td>${esc(m.round)}</td><td>${pLink(findP(m.player))}</td><td>${historicalOpponent(m)}</td><td>${badge(m.result,m.result==='勝'?'green':'amber')}</td><td>${m.tech&&m.tech!=='—'?esc(m.tech):'未特定'}</td><td>${archiveSource(m.source,'資料')}</td></tr>`).join('')}</tbody></table></div></section>`;
  }
  // Data source is unchanged; this display layer reads the same records/matches as the main pages.
  let openResultEvent=null, resultView='summary', resultPlayerId=null, resultReturnFocus=null;
  const outcomeOrder=['優勝','準優勝','3位','ベスト8','ベスト16','3回戦敗退','2回戦敗退','1回戦敗退'];
  const finishCategory=x=>{const t=String(x||'');return t.includes('準優勝')?'準優勝':t==='優勝'?'優勝':t.includes('3位')?'3位':t.includes('ベスト8')||t.includes('4回戦')?'ベスト8':t.includes('ベスト16')||t.includes('3回戦')?'ベスト16':t;};
  const outcomeIndex=x=>{const idx=outcomeOrder.indexOf(finishCategory(x));return idx<0?outcomeOrder.length:idx;};
  function sortedResults(eventId){return records.filter(r=>r.event===eventId).sort((a,b)=>outcomeIndex(a.finish)-outcomeIndex(b.finish)||((b.wins??-1)-(a.wins??-1))||findP(a.player).name.localeCompare(findP(b.player).name,'ja'));}
  function archivedUnique(eventId){
    const seen=new Set(),out=[];
    for(const m of oldByEvent.get(eventId)||[]){const pair=m.opponentId?[m.player,m.opponentId].sort().join('::'):m.player+'::'+norm(m.opponentName);const key=m.event+'|'+m.round+'|'+pair;if(!seen.has(key)){seen.add(key);out.push(m)}}
    return out.sort(byRound);
  }
  function eventQuickButtons(eventId){const current=fullOfficialEvent(findE(eventId));return `<div class="event-quick-actions"><button type="button" class="btn red" data-open-results="${esc(eventId)}" data-result-view="summary">☷ ${current?'最終成績一覧':'掲載成績一覧'}を見る</button><button type="button" class="btn secondary" data-open-results="${esc(eventId)}" data-result-view="matches">♜ ${current?'全63試合の結果':'確認済み対戦記録'}を見る</button></div>`;}
  // Tournament result rows expand in place, directly beneath each player, without navigation.
  function inlineMatchPanel(e,p){
    const current=fullOfficialEvent(e);
    const ms=current?fullMatchesFor(e).filter(m=>m.left===p.id||m.right===p.id):(oldByPlayer.get(p.id)||[]).filter(m=>m.event===e.id).sort(byRound);
    if(!ms.length)return `<div class="inline-match-empty">${esc(p.name)}の、この大会の試合別明細は未収録です。確認済みの到達成績のみ表示しています。</div>`;
    const columnHeads=current?'<th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・取得技（本人 - 相手）</th>':'<th>回戦</th><th>対戦相手</th><th>勝敗</th><th>取得・被取得技</th><th>反則△ 本人/相手</th><th>出典</th>';
    const rows=current?matchRows2026(ms,p.id):ms.map(ownMatchRow).join('');
    return `<div class="inline-match-panel"><div class="inline-match-heading"><strong>${esc(p.name)} の試合結果（${ms.length}試合）</strong><span class="small muted">${current?(sourceScopeUnverified(e)?e.year+'年 試合記録収録済・大会URLの試合別根拠は監査中':e.year+'年 全剣連公式A確定'):'元DBの確認済み範囲のみ・全試合とは限りません'}</span></div><div class="table-wrap inline-table-wrap"><table class="inline-match-table ${current?'is-current':'is-historical'}"><thead><tr>${columnHeads}</tr></thead><tbody>${rows}</tbody></table></div><p class="inline-match-source small muted">${current?sourceLink(e.source,sourceScopeUnverified(e)?'全剣連公式大会情報（試合別根拠の照合中）':'全剣連公式大会記録'):archiveSource(ms[0]?.source||e.source,'出典資料')} ／ 本数・技は「本人 - 対戦相手」の順。▲は反則した選手の側に仮表示し、反は反則による得点を表します。 同じ行の ▼ を押すと閉じられます。</p></div>`;
  }
  function renderEventPlayerTable(e,rs){
    return `<div class="table-wrap event-result-wrap"><table class="event-results-table"><thead><tr><th>選手</th><th>代表都道府県・称号段位（大会当時）</th><th>到達成績</th><th>勝利数</th><th>確認</th><th class="result-action-col">試合結果</th></tr></thead><tbody>${rs.map(r=>{
      const p=findP(r.player);
      if(!p)return '';
      const hasMatches=fullOfficialEvent(e)?fullMatchesFor(e).some(m=>m.left===p.id||m.right===p.id):(oldByPlayer.get(p.id)||[]).some(m=>m.event===e.id);
      const detailsId=`event-detail-${e.id}-${p.id}`;
      const control=hasMatches?`<button type="button" class="event-row-toggle" data-toggle-event-player="${esc(p.id)}" data-toggle-event="${esc(e.id)}" aria-expanded="false" aria-controls="${esc(detailsId)}" aria-label="${esc(p.name)}の試合結果を開く" title="${esc(p.name)}の試合結果を開く"><span aria-hidden="true" class="chevron">▼</span></button>`:'<span class="muted small" title="試合別明細未収録">—</span>';
      return `<tr class="event-player-row"><td>${pLink(p)}${norm(archivedNameFor(e,p))!==norm(p.name)?`<span class="row-sub">当時の掲載名：${esc(archivedNameFor(e,p))}</span>`:''}</td><td>${esc(prefectureFor(e,p))}<div class="row-sub event-grade-caption">${eventGradeFor(e.id,p.id)?'当時の称号・段位：'+esc(eventGradeFor(e.id,p.id)):'当時の段位：未確認'}</div></td><td><strong class="result ${r.finish==='優勝'?'win':''}">${esc(r.finish)}</strong></td><td>${r.wins==null?'—':r.wins+'勝'}</td><td>${badge(r.verified==='A'||r.kind!=='current'?'全剣連公式A':'要確認',r.verified==='A'||r.kind!=='current'?'green':'amber')}</td><td class="result-action-col">${control}</td></tr><tr class="event-player-detail" id="${esc(detailsId)}" hidden><td colspan="6"></td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function renderDialogSummary(e){
    const rs=sortedResults(e.id),current=fullOfficialEvent(e);
    const types=[...new Set(rs.map(r=>r.finish))].sort((a,b)=>outcomeIndex(a)-outcomeIndex(b));
    const options=types.map(t=>`<option value="${esc(t)}">${esc(t)}（${rs.filter(r=>r.finish===t).length}名）</option>`).join('');
    return `<div class="result-dialog-tools"><div class="field search"><label for="resultNameFilter">この大会の選手を探す</label><input class="control" id="resultNameFilter" type="search" placeholder="選手名・ふりがな・都道府県・所属"></div><div class="field"><label for="resultFinishFilter">到達成績</label><select class="control" id="resultFinishFilter"><option value="">すべての成績</option>${options}</select></div></div>
      <p class="result-dialog-caption"><span id="resultShownCount">${rs.length}名を表示</span> / 登録${rs.length}名。${current?'2015年大会〜2026年大会は全64名の最終成績・勝敗を掲載しています。':'旧大会は2026年出場者の記録のみ。全出場者の一覧ではありません。'}</p>
      <div class="table-wrap"><table class="result-dialog-table"><thead><tr><th>成績</th><th>選手</th><th>代表都道府県・称号段位（大会当時）</th><th>勝利数</th><th>確認</th><th>その大会の対戦</th></tr></thead><tbody>${rs.map(r=>{const p=findP(r.player),hasMatches=fullOfficialEvent(e)?fullMatchesFor(e).some(m=>m.left===p.id||m.right===p.id):(oldByPlayer.get(p.id)||[]).some(m=>m.event===e.id);return `<tr data-result-name="${esc([p.name,p.reading,p.pref,p.aff].join(' '))}" data-result-finish="${esc(r.finish)}"><td><strong class="result ${r.finish==='優勝'?'win':''}">${esc(r.finish)}</strong></td><td>${pLink(p)}</td><td>${esc(prefectureFor(e,p))}<div class="row-sub event-grade-caption">${eventGradeFor(e.id,p.id)?'当時の称号・段位：'+esc(eventGradeFor(e.id,p.id)):'当時の段位：未確認'}</div></td><td>${r.wins==null?'—':r.wins+'勝'}</td><td>${badge(r.verified==='A'||r.kind!=='current'?'A確定':'要確認',r.verified==='A'||r.kind!=='current'?'green':'amber')}</td><td>${hasMatches?`<button type="button" class="mini-action" data-open-player-matches="${esc(p.id)}">試合を見る →</button>`:'<span class="muted small">明細未収録</span>'}</td></tr>`}).join('')}</tbody></table></div><p class="result-no-matches" id="resultNoMatches" hidden>該当する選手はいません。</p>`;
  }
  function renderDialogMatches(e){
    const current=fullOfficialEvent(e),player=resultPlayerId?findP(resultPlayerId):null;
    const ms=current?fullMatchesFor(e).filter(m=>!player||m.left===player.id||m.right===player.id):(player?(oldByPlayer.get(player.id)||[]).filter(m=>m.event===e.id).sort(byRound):archivedUnique(e.id));
    const title=player?`${esc(player.name)} の試合（${ms.length}試合）`:`${current?'全試合':'確認済み対戦'}（${ms.length}試合）`;
    const note=current?('試合別記録を収録済み。大会URLや動画リンクの掲載は個別の技・反則・延長等をすべて再検証したことを意味しません。2012〜2014年男子、2015〜2019年男女は過去の独立2巡目照合履歴あり。選手指定時は本人 - 相手の順に表示。▲は反則の記録、反は反則による得点を表します。'+(e.year===2026?'2026年男女の延長は「あり」14試合、「なし」37試合、残る75試合は未確認です。「なし」37試合は公式結果2対0の25試合と全剣連公式動画の「一本勝」明記12試合による判定で、結果表の延長欄を直接視認した判定ではありません。':'')):'この大会の全試合ではなく、2026年出場者に関係する復元済みの試合だけを掲載しています。';
    let table='';
    if(!ms.length){table='<div class="result-empty">この選手の試合別明細は、元DBでまだ確認できていません。</div>';}
    else if(current){table=`<div class="table-wrap"><table><thead><tr><th>回戦</th><th>${player?'対戦相手':'対戦カード'}</th><th>${player?'勝敗':'勝者'}</th><th>${player?'本数・取得技（本人 - 相手）':'本数（勝者 - 敗者）'}</th>${player?'':'<th>取得技・反則</th>'}</tr></thead><tbody>${matchRows2026(ms,player?.id||'')}</tbody></table></div>`;}
    else if(player){table=`<div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>取得・被取得技</th><th>反則△ 本人/相手</th><th>出典</th></tr></thead><tbody>${ms.map(ownMatchRow).join('')}</tbody></table></div>`;}
    else {table=`<div class="table-wrap"><table><thead><tr><th>回戦</th><th>対象選手</th><th>対戦相手</th><th>勝敗</th><th>決まり技</th><th>出典</th></tr></thead><tbody>${ms.map(m=>`<tr><td>${esc(m.round)}</td><td>${pLink(findP(m.player))}</td><td>${historicalOpponent(m)}</td><td>${badge(m.result,m.result==='勝'?'green':'amber')}</td><td>${m.tech&&m.tech!=='—'?esc(m.tech):'未特定'}</td><td>${archiveSource(m.source,'資料')}</td></tr>`).join('')}</tbody></table></div>`;}
    return `<div class="result-dialog-detail-head"><div><h3>${title}</h3><p class="small muted">${note}</p></div>${player?`<button type="button" class="btn ghost" data-clear-player>全員の試合に戻る</button>`:''}</div>${table}${sourceScopeNote(e)}<div class="dialog-source small">${current?sourceLink(e.source,sourceScopeUnverified(e)?'全剣連公式大会情報（試合別根拠の照合中）':'全剣連公式大会ページ'):archiveSource(e.source,'大会の出典')}${e.id==='m62'?' ／ '+archiveSource(officialVideoGallery2014,'全剣連公式・全63試合動画一覧'):''}</div>`;
  }
  function renderResultDialog(){
    const e=findE(openResultEvent),overlay=document.getElementById('resultOverlay');
    if(!e){closeResultDialog();return;}
    const head=document.getElementById('resultDialogTitle'),content=document.getElementById('resultDialogContent');
    head.textContent=eDisplay(e);
    document.getElementById('resultDialogSubtitle').textContent=fullOfficialEvent(e)?'全63試合の勝敗A・個別の技／延長は表示の判定欄を参照':'対象選手の確認済み記録を掲載（全員網羅ではありません）';
    document.querySelectorAll('#resultOverlay [data-modal-tab]').forEach(btn=>{const active=btn.dataset.modalTab===resultView;btn.classList.toggle('active',active);btn.setAttribute('aria-selected',String(active))});
    content.innerHTML=resultView==='summary'?renderDialogSummary(e):renderDialogMatches(e);
    content.scrollTop=0;
    if(resultView==='summary'){
      const search=document.getElementById('resultNameFilter'),finish=document.getElementById('resultFinishFilter'),rows=[...content.querySelectorAll('tr[data-result-name]')];
      const apply=()=>{const q=normKana(search.value),f=finish.value;let n=0;for(const row of rows){const show=(!f||row.dataset.resultFinish===f)&&normKana(row.dataset.resultName).includes(q);row.hidden=!show;if(show)n++;}document.getElementById('resultShownCount').textContent=`${n}名を表示`;document.getElementById('resultNoMatches').hidden=n!==0;};
      search.addEventListener('input',apply);finish.addEventListener('change',apply);
    }
  }
  function showResultDialog(eventId,view='summary',playerId=null,trigger=null){
    if(!findE(eventId))return;
    const overlay=document.getElementById('resultOverlay');
    if(overlay.hidden)resultReturnFocus=trigger||document.activeElement;
    openResultEvent=eventId;resultView=view;resultPlayerId=playerId;
    overlay.hidden=false;document.body.classList.add('modal-open');renderResultDialog();
    overlay.querySelector('.result-close').focus();
  }
  function closeResultDialog(){
    const overlay=document.getElementById('resultOverlay');
    overlay.hidden=true;openResultEvent=null;resultPlayerId=null;document.body.classList.remove('modal-open');
    if(resultReturnFocus?.isConnected)resultReturnFocus.focus();
    resultReturnFocus=null;
  }
  // Register once: works for dynamically created tournament cards and links.
  document.addEventListener('click',ev=>{
    const toggle=ev.target.closest('[data-toggle-event-player]');
    if(toggle){
      ev.preventDefault();
      const row=document.getElementById(toggle.getAttribute('aria-controls'));
      if(!row)return;
      const expanded=toggle.getAttribute('aria-expanded')==='true';
      if(!expanded && !row.dataset.loaded){
        const e=findE(toggle.dataset.toggleEvent),p=findP(toggle.dataset.toggleEventPlayer);
        if(!e||!p)return;
        row.querySelector('td').innerHTML=inlineMatchPanel(e,p);
        row.dataset.loaded='true';
      }
      row.hidden=expanded;
      toggle.setAttribute('aria-expanded',String(!expanded));
      toggle.setAttribute('aria-label',`${findP(toggle.dataset.toggleEventPlayer).name}の試合結果を${expanded?'開く':'閉じる'}`);
      toggle.title=toggle.getAttribute('aria-label');
      toggle.querySelector('.chevron').textContent=expanded?'▼':'▲';
      toggle.closest('tr').classList.toggle('is-expanded',!expanded);
      return;
    }
    const open=ev.target.closest('[data-open-results]');
    if(open){ev.preventDefault();showResultDialog(open.dataset.openResults,open.dataset.resultView||'summary',null,open);return;}
    const player=ev.target.closest('[data-open-player-matches]');
    if(player){ev.preventDefault();resultView='matches';resultPlayerId=player.dataset.openPlayerMatches;renderResultDialog();document.getElementById('resultDialogContent').focus();return;}
    if(ev.target.closest('[data-clear-player]')){resultPlayerId=null;renderResultDialog();return;}
    const tab=ev.target.closest('[data-modal-tab]');
    if(tab){resultView=tab.dataset.modalTab;resultPlayerId=null;renderResultDialog();return;}
    if(ev.target.closest('[data-close-results]')){closeResultDialog();return;}
    const overlay=document.getElementById('resultOverlay');
    if(!overlay.hidden&&ev.target.closest('#resultOverlay a[href^="#/"]'))closeResultDialog();
  });
  document.addEventListener('keydown',ev=>{
    const overlay=document.getElementById('resultOverlay');
    if(overlay.hidden)return;
    if(ev.key==='Escape'){ev.preventDefault();closeResultDialog();return;}
    if(ev.key==='Tab'){
      const focusable=[...overlay.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled])')].filter(x=>x.getClientRects().length>0);
      if(!focusable.length)return;
      if(ev.shiftKey&&document.activeElement===focusable[0]){ev.preventDefault();focusable[focusable.length-1].focus()}
      if(!ev.shiftKey&&document.activeElement===focusable[focusable.length-1]){ev.preventDefault();focusable[0].focus()}
    }
  });
  const pageHeader=(eng,title,desc)=>`<p class="eyebrow">${esc(eng)}</p><h2 class="heading">${esc(title)}</h2><p class="lead">${esc(desc)}</p>`;
  const siteUpdates=[
    {date:'2026-11-21',tag:'第92組・2009WKC初回追加',title:'2009年第14回WKCの入賞16枠・日本団体8対戦・個人5試合を初収録',desc:'FIK公式4種目のトーナメント表と全剣連公式「剣窓」2009年10月号を照合し、個人出場8名、男女団体の決勝T勝数、男子団体韓国準決勝5人の実戦と決勝寺本大将の面・小手をA確認。未収録の技・団体登録は保留。'},
    {date:'2026-11-21',tag:'第91組・2012WKC個人3巡終了',title:'女子個人１回戦表記を訂正・２回戦追加／男子団体決勝4人の勝敗A',desc:'FIK公式図面から正代小百合のM.KOMAKI戦を１回戦に修正し、C.LIM戦を２回戦として追加。全剣連公式「剣窓」2012年7月号で男子団体決勝の内村・正代勝利、木和田敗戦、高鍋引き分けを確定。個人戦は３巡終了し残りの未確定を後回し。'},
    {date:'2026-11-21',tag:'第90組・2012年WKC個人・団体',title:'2012年WKCの決勝T一部12試合と男子団体決勝出場5人を追加',desc:'FIK公式結果表で男女個人戦の序盤・準々決勝12試合を追加。全剣連公式動画から男子個人5試合の取得技を確認（新規2・既存3）。男子団体決勝は5人の本人実戦・出場順のみA確定し、個人別得点は保留。'},
    {date:'2026-11-21',tag:'第88組・WKC団体追加／3巡保留',title:'2015年WKC団体本人実戦25枠追加・女子2回戦の対戦国訂正',desc:'全剣連公式動画から男子ハワイ・ブラジル、女子フランス・チリ・ベルギーの5国別対戦25人枠を追加。FIK公式表から女子2回戦の相手をタイからシンガポールへ訂正。個人戦取得技未確認17試合は3巡調査終了で一時保留。'},

    {date:'2026-11-21',tag:'第86組・WKC予選・取得技',title:'2015年WKC予選2試合追加と既存6試合の取得技確定',desc:'全剣連公式YouTubeの各試合結果説明文から、竹ノ内佑也・松本弥月の予選2試合を追加。村瀬諒の決勝T1回戦と女子5試合の取得技もA確認。2015年掲載42試合のうち25試合で取得技を掲載。残りは未確認のまま保持。'},
{date:'2026-11-21',tag:'第80組・ランキングの0件非表示',title:'各ランキングで集計値1以上の選手だけを表示',desc:'勝利・出場・優勝・決勝進出・面・小手・胴・突きの8項目と男子・女子・男女混合の全24表示で、0の選手を除外。1以上の記録値・同率同順位・集計対象期間は不変。'},{date:'2026-11-21',tag:'第67組・同順位と所属資料照合',title:'ランキング同率順位と最終出場大会の職業・勤務先',desc:'出場回数・勝利・優勝・決勝進出・取得技のランキングを同率同順位（1・1・3方式）へ変更。既存の選手ID・試合・集計値は不変。全剣連公式プロフィールで最後の選手権出場時の所属を確認した25名を空欄から補完し、年度を注記。未確認者は推測せず保留。'},{date:'2026-11-21',tag:'第65組・大会当時の段位と氏名表示',title:'年別段位の公式照合と姓名の半角スペース統一',desc:'2023〜2025年の男女各64名の当時段位を全剣連公式出場選手一覧から追加、2012・2013年女子各64名の保存済み公式名簿の当時段位も反映。2026年の128枠は維持。名鑑999名と試合結果の姓名表示を姓＋半角スペース＋名に統一し、原票・選手IDは変更なし。根拠不足の年度は未確認のまま。'},{date:'2026-11-21',tag:'第64組・選手プロフィール改修',title:'選手ページの成績・大会出場回数・年度別展開を整理',desc:'最高成績を全年度から算出、通算勝利・優勝は大会名と対象開始年を明記。2026年の男女128選手は全剣連公式プログラムの出場回数へ置換（サイト集計値との差異を補正）。過年度の公式回数は未確認としサイト収録数を代用しない。最終出場大会の所属都道府県と段位を表示し、年度・回次をクリックして試合結果を展開。検証状況の説明パネルを削除。'},{date:'2026-11-20',tag:'第63組・選手名鑑の表示改善',title:'五十音の行内ジャンプと大会当時の段位表示へ統一',desc:'選手名鑑の各行に1文字単位のジャンプを追加。名鑑カードと選手基本プロフィールの固定段位・出場回数を削除。段位は2026年公式登録128名の大会別スナップショットを使用し、過去年は同時点根拠のないものを未確認扱いに変更。国内成績・試合・選手IDに変更なし。'},{date:'2026-11-20',tag:'第62組・旧姓重複登録点検',title:'7組の旧姓・登録名変更を同一選手IDに統合',desc:'全1,006名と年別名簿を照合し、旧姓を直接明記する資料3組と公式プロフィール経年比較で確定した4組を統合。登録選手999名、全1,984成績行・全1,953試合は維持。旧名・読み検索と過去名義表示、旧ID互換を追加。' },{date:'2026-11-20',tag:'第41組・出典範囲監査',title:'31大会の公式URLを照合し、3大会の試合別根拠の制約を明示',desc:'28大会で個別試合結果表の実データ掲載を確認。2014年男子は旧公式の試合結果表が空欄、2026年男女は取得した大会本文で個別試合表を直接確認できないため、それぞれ大会ページ・結果ダイアログに出典範囲の注記を追加。6試合の標本照合は一致。過去の試合A/B・勝敗・技・延長・ランキングは変更なし。'},{date:'2026-11-20',tag:'第40組・技B保留表示と集計統一',title:'公式資料で取得技が競合する2試合を保留し、技ランキングの集計処理を修正',desc:'2014年男子第55試合と2026年女子準決勝第62試合の技種は、勝敗・得点と分けてB保留で表示。技ランキング・選手比較から未確定技を除外。元の公式資料の表記とURLは調査用に保持し、勝敗・得点・延長・登録選手・試合数を変更しない。'},{date:"2026-11-20",tag:"第39組・公開前棚卸し",title:"試合数・公開表示・出典未確認の棚卸しを実施",desc:"31大会・1,953試合の構造を再計算。2026年延長あり14／なし37／未確認75を維持。2011年男子参考成績64件を含む全1,984件のホーム集計表示を修正。2014年男子1試合と2026年女子準決勝1試合の技の資料競合を未解決事項として保存。過去の更新履歴にある『未実施』等は当時の状況。"},{date:'2026-11-20',tag:'2026年延長一次資料の再確認',title:'小倉進志―星子啓太の延長を県剣連公式記事で確認（第35組）',desc:'和歌山県剣道連盟の2026年11月4日付の公式大会記事で同試合が延長に入ったことを明記。男子1試合のみA確定へ戻し、2026年未確認は75試合。2012年と2014年の選手別画面に残った古い説明を修正。プレスリリースと個別試合動画の技表記差を内部監査に分離。'},{"date":"2026-11-20","tag":"出典監査・公開前点検","title":"2026年速報23件を一次資料の直接確認待ちに戻し、ランキングと出典表示を再点検（第34組）","desc":"第33組でA扱いした速報23件のうち16件は保存URLが無関係な検索ページ、7件は公式X原投稿に直接アクセスできないため、延長判定をB保留へ再分類。試合結果・取得技・選手ID・対象大会は変更なし。2026年の延長未確認76試合、2014年男子2試合。"},{date:'2026-11-20',tag:'2012年からランキング統一',title:'男子2012〜2014年の2巡目照合と技訂正・男女共通集計開始年を2012年へ（第27組）',desc:'男子2012年・2013年の全126試合を公式詳細結果表と再照合し得点・反則に不一致0。2014年63試合の公式映像掲載表記を照合し、3回戦第55試合・高橋秀人の得点を小手2本へ修正。勝敗・技について189試合整合。2011年男子は参考掲載だがランキング対象外。2012〜2026年の男女各15大会、男女混合は同じ2012〜2026年で集計。延長なしの根拠未確認分・2014年の反則未確認はそのまま。'},{date:'2026-11-19',tag:'過去大会5年区切り総点検',title:'2015年大会の男女126試合を追加・2015〜2019年を統合点検（v2.8）',desc:'男子第63回・女子第54回の男女128名・126試合を全剣連公式試合表と出場者名簿から収録。旧2015年部分記録4件と一致して置換。新規55名を登録。改姓した阿部美洸・近藤美洸の人物IDを統合。ふりがなと独立した原票2巡目照合は後日。'},{date:'2026-11-19',tag:'過去大会の全試合収録',title:'2016年大会・男女128名126試合を追加（v2.8）',desc:'男子第64回・女子第55回を全剣連公式試合表・出場者名簿から収録。既存2016年部分記録10件と全件一致し、128名の成績へ置換。新規51名・既存77名を統合。ふりがなは未確認のまま保留。2017年試合IDの年号衝突も修正。独立2巡目照合は後日の総点検で実施。'},{date:'2026-11-19',tag:'過去大会の全試合収録',title:'2017年大会・男女128名126試合を追加（v2.6）',desc:'男子第65回・女子第56回の全剣連公式記録を収録。既存2017年部分記録16件と全件一致し、128名の成績に置換。新規57名・既存71名を統合。ふりがなは未確認のまま保留し、独立2巡目の照合を後日実施。2015年収録後に5年分の総点検を予定。'},{date:'2026-11-19',tag:'過去大会の全試合収録',title:'2018年大会・男女128名126試合を追加（v2.5）',desc:'男子第66回・女子第57回の全剣連公式結果を収録。既存2018年部分記録13件と全件一致し、128名の成績に置換。新規55名、既存73名の選手IDへ統合。ふりがなは未確認のまま保留、独立2巡目照合は今後実施。'},{date:'2026-11-19',tag:'過去大会の全試合収録',title:'2019年大会・男女128名126試合を追加（v2.4）',desc:'男子第67回・女子第58回の全剣連公式表を転記。2019年部分記録17件を128件に置き換え、既存選手64名に統合し新規64名を追加（うち旧姓名の同一人物2件を整理）。勝者の勝ち上がりと旧成績17件を照合済み。新規64名の読みと試合表の独立2巡目照合は継続。'}, {date:'2026-11-19',tag:'記録修正・独立原票照合',title:'2026年大会男女126試合の技・反則を照合（v2.4）',desc:'第74回男子・第65回女子の全126試合で左右の技・反則を公式表と独立照合。男子1回戦の内堀聡一郎の反則▲の欠落1件を修正、再照合不一致0件。2026年の公式表では延長表示が確認できないため別途保留。'},{date:'2026-11-19',tag:'独立原票照合',title:'2025年大会男女126試合を再照合（v2.2）',desc:'第73回男子・第64回女子の全126試合について、全剣連公式表と左右技・反則▲・延長を独立照合。不一致0件、修正0件。2020〜2025年の累計756試合を独立照合済み。2026年は引き続き独立点検対象。'},{date:'2026-11-19',tag:'記録修正・二重照合',title:'2024年大会男女126試合を再照合（v2.1）',desc:'男子第72回・女子第63回の全剣連公式表を独立転記して126試合を点検。右側選手の技の表示順6件（男子2・女子4）を修正。延長・左右の反則▲・勝敗の変更なし。再照合差分0件。2020〜2024年累計630試合検査済み。'},{date:'2026-11-19',tag:'記録修正・二重照合',title:'2023年大会男女126試合を再照合（v2.0）',desc:'男子第71回・女子第62回の全剣連公式表を独立転記し、全126試合を点検。右側選手の技の表示順7件（男子6・女子1）を修正。延長、反則▲、勝敗の変更なし。再照合差分0件。2020〜2023年の累計504試合を検査済み。'},{date:'2026-11-19',tag:'記録修正・二重照合',title:'2022年大会男女126試合を再照合（v1.9）',desc:'男子第70回・女子第61回の全剣連公式トーナメント表を独立転記して全126試合を点検。延長記録の欠落2件、右側選手の技の表記順6件を修正。再照合後は不一致0件。2020〜2022年の累計378試合を確認、2023〜2026年は504試合が未実施。'},{date:'2026-11-19',tag:'独立原票照合',title:'2021年大会男女126試合を再照合（v1.8）',desc:'男子第69回・女子第60回の公式トーナメント表を独立転記。左右技、反則▲、延長について126試合すべて一致。2020年大会と合わせて252試合を検査済み。残り630試合は2022〜2026年大会。'},{date:'2026-11-19',tag:'独立原票照合',title:'2020年大会男女126試合の技・反則・延長を二重照合（v1.7）',desc:'全剣連公式大会の試合表をあらためて独立転記し、男子63試合・女子63試合の取得技、反則▲、延長を照合。不一致0件。2021〜2026年756試合は今後の対象。'},{date:'2026-11-19',tag:'読みがな補完',title:'2020年大会新規選手75名の公式読みを追加（v1.7）',desc:'第68回男子39名・第59回女子36名のふりがなを全剣連公式プロフィールで確認し、531名全員を五十音索引へ登録。試合・成績の数値は変更なし。2020年男女126試合を独立再照合済み。残り756試合は継続。'},{date:'2026-11-19',tag:'大会記録追加',title:'2020年大会（2021年3月延期開催）の男女全試合を追加',desc:'男子第68回・女子第59回の128名・126試合を全剣連公式結果から収録。2021年大会とは別大会として管理。従来の2020年部分記録13件を置換し二重集計を防止。新規選手のふりがなは公式資料に基づき後日補完済み。'},{date:'2026-11-19',tag:'大会記録追加',title:'2021年度全日本剣道選手権・全日本女子剣道選手権の全試合を追加',desc:'第69回男子・第60回女子の128名・126試合を全剣連公式結果からA確定で登録。56名を既存選手へ紐付け、72名を新規追加。2021年度の旧部分記録22件を統合し、重複を除去。72名の読みも全剣連公式から確認済み。2020年度延期大会は別大会として保持。'},{date:'2026-11-19',tag:'大会記録追加',title:'2022年全日本選手権・全日本女子選手権の全試合を追加',desc:'第70回男子・第61回女子の出場者128名、公式126試合を追加。新規54名・既存74名に統合。旧姓や登録都道府県を年度別に保存し、五十音索引・▼展開・技別ランキングの集計に反映。'},{date:'2026-11-19',tag:'大会記録追加',title:'2023年全日本選手権・全日本女子選手権の全試合を追加',desc:'第71回男子・第62回女子を各64名・63試合で掲載。新規53名・既存75名を照合、公式の読みを新規53名全員に登録。2024〜2026年の内容は維持したまま、五十音索引・大会一覧の▼試合展開・ランキング・選手比較へ反映。'},{date:'2026-11-19',tag:'操作改善',title:'選手名鑑を五十音順に並べ、行別ジャンプを追加',desc:'氏名の公式読みを使って、あ・か・さ・た・な・は・ま・や・ら・わ行で選手を整理。索引ボタンから各行にジャンプし、検索や男女・都道府県絞り込み後も索引件数が更新されます。読み未確認は推測せず別枠。'},{date:'2026-11-19',tag:'表示改善',title:'試合結果の本数・技を選手視点で統一',desc:'▼で展開する2026年の試合結果と選手詳細ページで、本数は常に本人 - 相手の順とし、取得技を本数の直下に括弧付きで表示。反則▲は本人側なら括弧の左、相手側なら右に仮配置。元データは変更なし。'},{date:'2026-11-19',tag:'操作改善',title:'大会の個人成績一覧を常時表示し、▼で試合結果を行内展開',desc:'v0.7形式の大会別成績表を復元。各選手の右端▼を押すと、すぐ下にその大会の対戦・勝敗・得点技が表示され、もう一度押すと閉じます。過去大会にも対応。都道府県47件の北から南への順番も維持。データ更新なし。'},{date:'2026-11-19',tag:'操作改善',title:'都道府県検索の北から南への固定順／結果一覧をワンクリック表示',desc:'代表都道府県を北海道から沖縄県の47都道府県順に統一。大会一覧と大会詳細に結果ダイアログを追加し、選手別の対戦も同じ画面で確認可能に。戦績データはv0.7のまま。'},...updates];
  // Newest verified milestones first. Earlier entries preserve the chronology, not the current policy.
  const visibleUpdates=[
    {date:'2026-11-21',tag:'第92組・2009WKC初回追加',title:'2009年第14回WKCの公式記録を追加',desc:'FIK結果表で入賞16枠・団体決勝T8国別対戦の勝数・日本個人出場8名・準決勝決勝5試合を確定。全剣連「剣窓」で男子団体本人実戦6枠を追加。未確認の本数や女子団体本人実戦は推測せず保留。'},
    {date:'2026-11-21',tag:'第88組・WKC団体追加／3巡保留',title:'2015年WKC団体本人実戦25枠追加・女子2回戦の対戦国訂正',desc:'全剣連公式動画から男子ハワイ・ブラジル、女子フランス・チリ・ベルギーの5国別対戦25人枠を追加。FIK公式表から女子2回戦の相手をタイからシンガポールへ訂正。個人戦取得技未確認17試合は3巡調査終了で一時保留。'},

    {date:'2026-11-21',tag:'第85組・WKC個人戦',title:'2015年WKCの日本選手の決勝T全回戦と予選2試合を追加',desc:'FIK公式勝ち上がり表で日本選手の男女決勝T計38試合の勝敗を照合。全剣連公式動画で17試合の取得技を確認。予選は動画が確認できた2試合を追加し、未収録の予選・延長・団体本人実戦は保留。5名の日本代表漢字表記も全剣連公式発表に照合。'},
    {date:'2026-11-21',tag:'第84組・WKC追加',title:'2015年第16回WKCを公式資料から追加（入賞・日本代表登録・決勝Tの一部）',desc:'FIK・大会公式から男女個人・団体入賞16枠、男子10名・女子10名の日本代表登録、個人戦準決勝・決勝6試合と団体決勝T日本8試合の勝者を収録。各試合の取得技・得点、予選、団体本人実戦は未収録。国内ランキングは無変更。'},
    {date:'2026-11-20',tag:'第61組・同一人物ID統合',title:'末永真理（旧姓名・山本真理子）の2018年WKC記録を既存ID w023に統合',desc:'剣道日本の旧姓名明記と全剣連の旧名読みを根拠に、2018年女子WKC個人準優勝・8試合を末永真理に連携。旧姓名と読みの検索に対応。名鑑16枠すべて既存選手IDに紐付け。国内大会の試合・順位・ランキング、WKC試合総数は変更なし。'},
    {date:'2026-11-20',tag:'第60組・WKC追加',title:'2018・2024年WKCの表彰台32枠、日本団体28試合・日本選手個人106試合を収録',desc:'FIK・全剣連公式資料を確認。男女16名分の日本代表個人試合を取得技・延長付きで収録。選手名鑑15名に連携し、別大会の勝敗ランキングへは加算しない。2024年女子の取消線付き試合は集計対象外。'},
    {date:'2026-11-20',tag:'第43組・公開前の表示点検',title:'現在の集計方針を優先表示し、過去の変更履歴を区別',desc:'男女とも2012〜2026年をランキング・比較の共通期間として明示。2011年男子は参考扱い。確認保留の延長77試合と技2試合は推測せず、試合結果と別管理。大会の根拠範囲・非公式サイトである旨を表示。試合データは変更していません。'},
    {date:'2026-11-20',tag:'第42組・出典導線と画面検査',title:'2014年男子・2026年男女の出典導線189試合を整理',desc:'2014年男子63試合の公式動画一覧との試合番号対応、2026年男女の既存動画リンクを整理。PC・スマホ模擬画面で各13項目を確認。実際の一般公開URL・iPhone実機Safariは未試験。'},
    ...siteUpdates.filter(x=>!x.title.includes('2014年大会の復元')).map((u,i)=>i>=6?{...u,desc:'【作業当時の状況。現在の集計範囲は2012〜2026年男女共通】'+u.desc}:u),
    {date:'2026-11-20',tag:'第26組・男子2011〜2014年復元',title:'男子2011〜2014年の4大会・252試合を収録',desc:'【作業当時】2012〜2014年のランキング反映は2巡目照合まで保留でしたが、その後第27組で照合して2012〜2026年へ対象期間を統一しました。2011年は現在も参考記録のみです。'},
    {date:'2026-11-20',tag:'第21組・2012年女子追加',title:'2012年女子の全63試合を収録',desc:'女子2012年大会を追加した当時の調査記録です。現在は男女とも2012〜2026年の15大会を集計しています。'},
    {date:'2026-11-20',tag:'第20組・2013年女子追加',title:'2013年女子の全63試合を収録',desc:'女子2013年大会を追加した当時の調査記録です。現在は男女とも2012〜2026年の15大会を集計しています。'}
  ];
  function renderHome(){return `${verifiedBanner}<div class="hero"><p class="eyebrow">KENDO RECORDS & INSIGHTS</p><h2>剣道の記録を、<br>もっと深く、もっと探しやすく。</h2><p>男女とも2012〜2026年の連続15大会の公式記録を、対象期間をそろえて検索・集計する。</p><form class="hero-search" id="heroSearch"><input id="heroQ" type="search" placeholder="選手名・ふりがな・所属・出身校を検索" aria-label="選手検索"><button type="submit" class="btn red">検索する →</button></form></div>
  <div class="stats">${statCard('登録選手',players.length,'名','男女とも2012年〜')}${statCard('大会・開催回',events.length,'件','男女・年度別')}${statCard('収録大会別成績',records.length,'件','2011年参考記録を含む')}${statCard('収録試合',allScopedMatches.length,'件','2011年参考試合を含む')}</div>
  <div class="two-col"><section><div class="section-head"><h3 class="section-title">記録を探す</h3></div><div class="quick-grid"><a class="quick" href="#/players"><span class="qicon">♙</span><span><strong>選手名鑑</strong><span>名前・読み・所属・出身校</span></span></a><a class="quick" href="#/events"><span class="qicon">♜</span><span><strong>大会データ</strong><span>開催年度・大会回次</span></span></a><a class="quick" href="#/wkc"><span class="qicon">◎</span><span><strong>世界剣道選手権（WKC）</strong><span>2015・2018・2024の記録を検索</span></span></a><a class="quick" href="#/rankings"><span class="qicon">▥</span><span><strong>ランキング</strong><span>集計範囲を明示</span></span></a><a class="quick" href="#/compare"><span class="qicon">⇄</span><span><strong>選手比較</strong><span>2人の記録を比較</span></span></a></div></section>
  <section><div class="section-head"><h3 class="section-title">最近の更新</h3><a class="quiet-link" href="#/updates">一覧へ →</a></div><div class="pane">${visibleUpdates.slice(0,4).map(u=>`<a class="list-row" href="#/updates" aria-label="${esc(u.title)}：更新履歴で読む"><div><div class="row-sub">${esc(u.date)} ${badge(u.tag)}</div><div class="row-title">${esc(u.title)}</div></div><span class="arrow" aria-hidden="true">›</span></a>`).join('')}</div></section></div>
  <section class="section-block"><div class="section-head"><h3 class="section-title">2026年の大会結果を見る</h3><a href="#/events" class="quiet-link">全大会一覧 →</a></div><div class="pane">${events.filter(e=>e.year===2026).map(e=>`<a class="list-row" href="#/event/${e.id}"><div><div class="row-title">${esc(e.edition)} ${esc(e.name)}</div><div class="row-sub">2026年 / ${esc(e.gender)} / 出場64名・全63試合収録</div></div><span class="arrow">›</span></a>`).join('')}</div></section>
    <section class="pane" style="margin-top:19px"><div class="pane-pad"><h3 class="section-title">記録の読み方</h3><p class="small muted">掲載範囲：男女とも2012〜2026年の15大会（計1,890試合）。2011年男子63試合は参考収録で、ランキングには含めません。<strong>通算</strong>は生涯通算ではなく、このサイトの集計対象期間の合計です。</p><p class="small muted">2020年大会は2021年3月14日開催の延期大会として独立管理。延長未確認77試合と、公式資料間で取得技が食い違う2試合は勝敗を残したまま未確認扱いにし、技別集計から未確認の技を除外しています。</p><p class="small muted">出典は全日本剣道連盟などの公式発表を優先。大会ページの存在だけを、個別試合のすべての記録が検証済みという意味にはしません。</p></div></section>
    <p class="footnote">※本サイトは全日本剣道連盟とは独立した非公式の記録サイトです。出典と掲載の制約を明示し、未確認情報を断定しません。</p>`;}
  // 氏名の推測読みは使わない。全剣連公式ふりがなを五十音順の唯一の並び替えキーとする。
  const kanaGroups=[['あ','あいうえお'],['か','かきくけこ'],['さ','さしすせそ'],['た','たちつてと'],['な','なにぬねの'],['は','はひふへほ'],['ま','まみむめも'],['や','やゆよ'],['ら','らりるれろ'],['わ','わをん']];
  const kanaSorter=new Intl.Collator('ja',{usage:'sort',sensitivity:'base',numeric:true});
  function kanaInitial(p){
    if(!p.reading || p.readingStatus!=='A')return '';
    return normKana(p.reading).normalize('NFD').replace(/[\u3099\u309a]/g,'').charAt(0);
  }
  function kanaHead(p){
    const initial=kanaInitial(p);
    if(!initial)return '未';
    return kanaGroups.find(([,letters])=>letters.includes(initial))?.[0]||'未';
  }
  const kanaCompare=(a,b)=>{
    const x=normKana(a.reading),y=normKana(b.reading);
    return kanaSorter.compare(x,y)||kanaSorter.compare(normKana(a.name),normKana(b.name))||a.id.localeCompare(b.id);
  };
  function directoryPlayerCard(p){return `<article class="person-card" data-player="${esc(p.id)}"><div class="person-top"><div class="avatar ${p.gender==='女子'?'f':''}">${esc(p.name.slice(-1))}</div><div><a href="#/player/${encodeURIComponent(p.id)}" class="person-name data-link">${esc(p.name)}</a>${readingLabel(p)}<div class="person-meta">${esc(p.gender)} / ${esc(p.pref)}</div></div></div><dl class="mini-dl"><dt>所属</dt><dd>${asText(p.aff)}</dd>${educationCardRow(p,'high')}${educationCardRow(p,'univ')}</dl><div class="card-actions"><a href="#/player/${p.id}" class="textbtn">プロフィールを見る →</a><button type="button" class="textbtn" data-compare-add="${p.id}">比較に追加 ＋</button></div></article>`;}
  function playerCards(){
    const q=normKana(playerQuery);
    const shown=players.filter(p=>(genderFilter==='すべて'||p.gender===genderFilter)&&(prefFilter==='すべて'||p.pref===prefFilter)&&normKana([p.name,...(p.nameAliases||[]),p.reading,...(p.readingAliases||[]),p.aff,p.high,p.univ,p.enrolledHigh,p.enrolledUniversity,p.pref].join(' ')).includes(q));
    const groups=new Map([...kanaGroups.map(([k])=>[k,[]]),['未',[]]]);
    for(const p of shown)groups.get(kanaHead(p)).push(p);
    for(const values of groups.values())values.sort(kanaCompare);
    document.getElementById('playerCount').textContent=`${shown.length}名を表示 / 全${players.length}名（読み確認済み ${readingCount}名）`;
    const index=document.getElementById('kanaIndex');
    index.innerHTML=`<span class="kana-index-title">五十音から探す</span><div class="kana-index-buttons">${[...kanaGroups.map(([k])=>k),'未'].map(k=>{const n=groups.get(k).length;return `<button type="button" class="kana-jump" data-jump-kana="${k}" ${!n?'disabled':''} aria-label="${k==='未'?'読み確認中':k+'行'}へ移動（${n}名）">${k==='未'?'未確認':k}<span class="kana-jump-count">${n}</span></button>`;}).join('')}</div>`;
    document.getElementById('playerResults').innerHTML=shown.length?[...groups.entries()].filter(([,ps])=>ps.length).map(([key,ps])=>{
      const groupLetters=kanaGroups.find(([k])=>k===key)?.[1]||'';
      const subgroups=new Map([...groupLetters].map(c=>[c,[]]));
      if(key!=='未')for(const p of ps)subgroups.get(kanaInitial(p)).push(p);
      const subButtons=key==='未'?'':`<nav class="kana-sub-index" aria-label="${key}行の文字別ジャンプ">${[...subgroups.entries()].map(([c,arr])=>`<button type="button" class="kana-sub-jump" data-jump-sub="${key}-${c}" ${arr.length?'':'disabled'} aria-label="${c}から始まる選手${arr.length}名へ移動">${c}<span class="kana-sub-count">${arr.length}</span></button>`).join('')}</nav>`;
      const content=key==='未'?`<p class="small muted kana-pending-note">公式ふりがなを未確認の選手です。読みを推測して別の行に入れないようにしています。</p><div class="grid-cards">${ps.map(directoryPlayerCard).join('')}</div>`:[...subgroups.entries()].filter(([,arr])=>arr.length).map(([c,arr])=>`<section class="kana-subgroup" aria-labelledby="kana-sub-${key}-${c}"><h4 class="kana-subgroup-title" id="kana-sub-${key}-${c}" tabindex="-1">${c} <span class="kana-group-count">${arr.length}名</span></h4><div class="grid-cards">${arr.map(directoryPlayerCard).join('')}</div></section>`).join('');
      return `<section class="kana-group" aria-labelledby="kana-${key}" id="section-kana-${key}"><div class="kana-group-head"><h3 id="kana-${key}" tabindex="-1">${key==='未'?'読み確認中':key+'行'} <span class="kana-group-count">${ps.length}名</span></h3>${subButtons}<button type="button" class="kana-back" data-back-kana>↑ 五十音索引へ</button></div>${content}</section>`;
    }).join(''):'<div class="empty pane">該当する選手はいません。検索条件を変更してください。</div>';
    bindCompareButtons();
  }
  function jumpDirectory(targetId){const target=document.getElementById(targetId);if(!target)return;target.scrollIntoView({behavior:'instant',block:'start'});if(target.hasAttribute('tabindex'))target.focus({preventScroll:true});}
  function renderPlayers(){const prefs=prefecturesNorthSouth;return `${verifiedBanner}${pageHeader('PLAYER DIRECTORY','選手名鑑','2011年までの男子復元記録と2012年以降の女子記録を含む出場選手を氏名の読みで五十音順に整理。上部の「あ・か・さ…」から各行へ移動し、各行の「か・き・く・け・こ」などから頭文字別に移動できます。')}
    <div class="toolbar"><div class="field search"><label for="playerSearch">フリーワード</label><input id="playerSearch" class="control" type="search" placeholder="例：ほしこ、ナカダ、筑波大学" value="${esc(playerQuery)}"></div><div class="field"><label for="playerGender">区分</label><select id="playerGender" class="control">${['すべて','男子','女子'].map(g=>`<option ${genderFilter===g?'selected':''}>${g}</option>`).join('')}</select></div><div class="field"><label for="prefFilter">代表都道府県</label><select id="prefFilter" class="control">${['すべて',...prefs].map(g=>`<option ${prefFilter===g?'selected':''}>${esc(g)}</option>`).join('')}</select></div></div><div class="count-line"><span id="playerCount"></span><span>代表都道府県は北海道→沖縄県の順</span></div><nav id="kanaIndex" class="kana-index" aria-label="選手名鑑の五十音索引"></nav><div id="playerResults" class="kana-results"></div>`;}
  // Profile cards use the highest result among recorded years, not the last year's result.
  const finishRank=finish=>{
    const f=String(finish||'');
    if(f==='優勝')return 7;
    if(f.includes('準優勝')||f.includes('2位'))return 6;
    if(f.includes('準決勝')||f==='3位')return 5;
    if(f.includes('ベスト8')||f.includes('4回戦'))return 4;
    if(f.includes('ベスト16')||f.includes('3回戦'))return 3;
    if(f.includes('2回戦'))return 2;
    if(f.includes('1回戦'))return 1;
    return 0;
  };
  const finishLabel=rank=>({7:'優勝',6:'準優勝',5:'3位',4:'ベスト8',3:'ベスト16',2:'2回戦',1:'1回戦'})[rank]||'未確認';
  const playerChampionshipName=p=>p.gender==='男子'?'全日本選手権':'全日本女子選手権';
  const eventShortName=e=>`${e.year%100}${e.gender==='女子'?'全日本女子選手権':'全日本選手権'}`;
  const officialAppearanceAt=(p,e)=>{const x=officialAppearances[p.id];return x&&x.event===e?.id&&x.year===e.year?x:null;};
  const profileEventMatches=(p,e)=>fullMatchesFor(e).filter(m=>m.left===p.id||m.right===p.id).sort((a,b)=>(a.roundIndex??0)-(b.roundIndex??0));
  function profileEventNotes(r,e,ms){
    const notes=[];
    if(r.verified!=='A')notes.push('到達成績の確認中');
    if(!ms.length)notes.push('個別対戦未収録');
    const techniquePending=ms.filter(m=>m.techVerified==='B').length;
    if(techniquePending)notes.push(`取得技未確認${techniquePending}試合`);
    const overtimePending=ms.filter(m=>m.overtimeStatus==='未確認').length;
    if(overtimePending)notes.push(`延長未確認${overtimePending}試合`);
    if(sourceScopeUnverified(e))notes.push('試合別出典の一部照合中');
    return notes.length?notes.map(esc).join('・'):'';
  }
  function renderPlayer(id){
    id=canonicalPlayerId(id);
    const p=findP(id);if(!p)return notFound();
    const rs=records.filter(r=>r.player===id).sort((a,b)=>{const x=findE(a.event),y=findE(b.event);return y.year-x.year||parseInt(y.edition.replace(/\D/g,''))-parseInt(x.edition.replace(/\D/g,''));});
    const a=aggregate(p);
    const newest=rs[0]||null, latestEvent=newest?findE(newest.event):null;
    const latestYear=latestEvent?.year;
    const titleName=playerChampionshipName(p);
    const bestRank=Math.max(0,...rs.map(r=>finishRank(r.finish)));
    const bestYears=rs.filter(r=>finishRank(r.finish)===bestRank).map(r=>findE(r.event).year).sort((a,b)=>a-b);
    const bestFoot=bestYears.length?`最高到達年度：${bestYears.map(y=>y+'年').join('・')}`:'掲載成績なし';
    const grade=latestEvent?eventGradeFor(latestEvent.id,p.id):'';
    const officialAppearance=officialAppearanceAt(p,latestEvent);
    const appearanceText=officialAppearance?`${officialAppearance.count}回（${latestYear}年大会公式）`:'公式出場回数：確認中';
    const latestPref=latestEvent?prefectureFor(latestEvent,p):p.pref;
    const when=latestEvent?`（${eventShortName(latestEvent)}）`:'';
    const rows=rs.map(r=>{
      const e=findE(r.event), ms=profileEventMatches(p,e), yearTitle=e.year===2020?'2020年大会':`${e.year}年度`;
      const key=`year-matches-${e.id}-${p.id}`;
      const notes=profileEventNotes(r,e,ms);
      const table=ms.length?`<div class="table-wrap profile-match-wrap"><table class="profile-match-table"><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・技（本人 − 相手）</th></tr></thead><tbody>${matchRows2026(ms,p.id)}</tbody></table></div>`:'<p class="small muted">個別対戦記録はまだ収録されていません。</p>';
      const source=e.source?sourceLink(e.source,'大会公式記録'):'';
      return `<tr class="profile-year-row"><td><button type="button" class="profile-year-toggle" data-profile-year="${esc(key)}" aria-expanded="false" aria-controls="${esc(key)}" aria-label="${yearTitle} 第${esc(e.edition.replace(/[^\d]/g,''))}回の全対戦結果を開く"><span>${esc(yearTitle)}</span><strong>${esc(e.edition)}</strong><span class="profile-year-arrow" aria-hidden="true">▼</span></button>${e.heldYear!==e.year?'<div class="profile-year-foot">2021年3月14日開催（延期開催）</div>':''}</td><td>${eventGradeDisplay(e.id,p.id)}</td><td class="result ${r.finish==='優勝'?'win':''}">${esc(r.finish)}</td><td class="profile-row-note">${notes}</td></tr><tr class="profile-year-detail" id="${esc(key)}" hidden><td colspan="4"><div class="profile-inline-panel"><div class="profile-inline-head"><strong>${esc(e.year)}年・${esc(e.edition)} 全対戦結果（${ms.length}試合）</strong><span class="small muted">${source}</span></div>${table}</div></td></tr>`;
    }).join('');
    return `<div class="breadcrumb"><a href="#/players">選手名鑑</a> › ${esc(p.name)}</div>
    <div class="detail-hero"><div class="detail-main"><div class="avatar ${p.gender==='女子'?'f':''}">${esc(p.name.slice(-1))}</div><div><p class="eyebrow" style="margin:0">PLAYER PROFILE</p><h2>${esc(p.name)}</h2><p class="detail-reading">${p.reading?esc(p.reading):'読み：確認中'}</p>${p.formerName?`<p class="detail-former">過去の登録名：${esc(displayNameForRaw(p.formerName))}${p.formerReading?`（${esc(p.formerReading)}）`:''}</p>`:''}<div class="detail-pills">${badge(p.gender)} ${badge(latestPref||'代表未確認')} ${badge(p.stance||'構え未登録')}</div></div></div><button class="btn secondary" data-compare-add="${p.id}">⇄ この選手を比較に追加</button></div>
    <div class="stats profile-stats">
      ${statCard(titleName+'通算勝利',a.wins,'勝','2012年以降の公式掲載試合')}
      ${statCard(titleName+'優勝',a.titles,'回','2012年以降の収録大会')}
      ${statCard(titleName+'最高成績',finishLabel(bestRank),'',bestFoot)}
    </div>
    <div class="detail-grid profile-grid">
      <section class="pane wide"><h3 class="section-title">基本プロフィール</h3><div class="definition">${profileRow('氏名の読み',p.reading||'未確認')}${p.formerName?profileRow('過去の登録名・その読み',displayNameForRaw(p.formerName)+(p.formerReading?'（'+p.formerReading+'）':'')):''}${profileRow('所属',(latestPref||'未確認')+when)}${profileRow('職業・勤務先',p.aff?`${p.aff}${p.affAsOfYear?`（${p.affAsOfYear}年大会時点）`:''}`:'')}${profileRow('出場回数',appearanceText)}${profileRow(latestYear?'年齢（'+latestYear+'年資料）':'年齢',latestYear===2026&&p.ageAt2026?`${p.ageAt2026}歳`:'')}${educationProfileRow(p,'high')}${educationProfileRow(p,'univ')}${profileRow('称号・段位',grade?`${grade}${when}`:`未確認${when}`)}${profileRow('構え',p.stance)}${profileRow('得意技',p.skill)}</div>${latestEvent?`<p class="small muted profile-last-source">最終出場大会：${eLink(latestEvent)}${officialAppearance?` ／ <a class="data-link" href="${esc(officialAppearance.source)}" target="_blank" rel="noopener noreferrer">出場回数の公式根拠 ↗</a>`:''}</p>`:''}</section>
      <section class="pane wide profile-history" style="padding:0"><div class="pane-pad"><h3 class="section-title">${esc(titleName)}・年度別成績</h3><p class="small muted">年度を押すと、その大会での全対戦結果が開きます。当時の段位は公式登録で確認できた場合のみ表示します。</p></div><div class="table-wrap profile-history-wrap"><table class="profile-history-table"><thead><tr><th>大会年度・回次</th><th>当時の称号・段位</th><th>到達成績</th><th>備考</th></tr></thead><tbody>${rows}</tbody></table></div></section>
      ${renderTechniqueSummary(p)}
      ${renderWkcPlayerHistory(p)}
      ${renderWkcTeamPlayerHistory(p)}
    </div>${p.formerName?`<div class="source-box small"><strong>氏名の履歴：</strong>現在の表示は${esc(p.name)}。過去の登録名 ${esc(displayNameForRaw(p.formerName))} は同じ選手IDに統合しています。<a class="data-link" href="${esc(p.identitySource)}" target="_blank" rel="noopener noreferrer">同一人物判定の根拠資料 ↗</a></div>`:''}
    <p class="footnote">※勝利・優勝の通算値は2012〜2026年の連続収録期間を対象とし、2011年の参考記録は含めていません。2020年は2021年3月の延期開催大会です。</p>`;
  }
  function eventRows(){const q=norm(eventQuery);const shown=events.filter(e=>(eventGender==='すべて'||e.gender===eventGender)&&(eventYear==='すべて'||String(e.year)===eventYear)&&norm(e.name+e.edition+e.year+e.gender+e.heldYear).includes(q)).sort((a,b)=>b.year-a.year||parseInt(b.edition.replace(/\D/g,''))-parseInt(a.edition.replace(/\D/g,'')));
    document.getElementById('eventCount').textContent=`${shown.length}大会を表示 / 全${events.length}大会`;
    document.getElementById('eventResults').innerHTML=shown.length?shown.map(e=>`<div class="list-row event-directory-row"><div><a class="row-title data-link" href="#/event/${e.id}">${esc(e.edition)} ${esc(e.name)}</a><div class="row-sub">${e.year===2020?'2020年大会':e.year+'年度'}${e.heldYear!==e.year?'（2021年3月14日開催・延期開催）':''} / ${esc(e.gender)} / 登録${records.filter(r=>r.event===e.id).length}名分</div></div><div class="event-list-actions"><a class="mini-action" href="#/event/${e.id}">成績・試合結果を見る →</a></div></div>`).join(''):'<div class="empty">該当する大会はありません。</div>';
  }

  // 世界剣道選手権：全日本選手権のランキング統計から完全に分離した公式記録。
  const wkcNames=(name,id)=>{
    const p=id?findP(id):null;
    if(!p)return `<strong>${esc(displayNameForRaw(name))}</strong>`;
    const historic=norm(name)!==norm(p.name) && (p.nameAliases||[]).some(a=>norm(a)===norm(name));
    return `${pLink(p)}${historic?`<span class="tiny muted wkc-historic-name">（当時の登録名：${esc(displayNameForRaw(name))}）</span>`:''}`;
  };
  const wkcSource=(src)=>`<a class="data-link" href="${esc(src.ajkf)}" target="_blank" rel="noopener noreferrer">${src.edition===14?'全剣連公式大会報告':[15,16].includes(src.edition)?'全剣連公式大会案内':'全剣連公式結果'} ↗</a> / <a class="data-link" href="${esc(src.fik)}" target="_blank" rel="noopener noreferrer">FIK公式結果 ↗</a>${src.officialResults?` / <a class="data-link" href="${esc(src.officialResults)}" target="_blank" rel="noopener noreferrer">大会公式結果 ↗</a>`:''}`;
  const wkcEventSource=(y)=>wkcRecords.sources[y];
  const wkcMatchDetails=(m,code)=>{
    const own=m.playerCode===code;
    const them=own?m.opponent:m.player;
    const theirsId=own?m.opponentPlayerId:m.playerId;
    const myTech=own?m.playerTech:m.opponentTech;
    const theirTech=own?m.opponentTech:m.playerTech;
    const selfFoul=Boolean(own?m.fouls.includes('左'):m.fouls.includes('右'));
    const opponentFoul=Boolean(own?m.fouls.includes('右'):m.fouls.includes('左'));
    const myStr=myTech.join('・')||'—'; const theirStr=theirTech.join('・')||'—';
    const myPoints=myTech.length;const theirPoints=theirTech.length;
    return `<tr><td>${esc(m.round)}</td><td>${wkcNames(them,theirsId)}<div class="tiny muted">${esc(own?m.opponentCode:m.playerCode)}</div></td><td class="${m.winnerCode===code?'result win':'result'}">${m.winnerCode===code?'勝':'敗'}</td><td>${m.scoreVerified===false?'<span class="muted">未収録</span>':`<strong>${myPoints} - ${theirPoints}</strong><div class="tiny muted">${esc(myStr)}${selfFoul?' ▲':''} / ${esc(theirStr)}${opponentFoul?' ▲':''}</div>`}</td><td>${m.scoreVerified===false?`<a class="data-link" href="${esc(m.source)}" target="_blank" rel="noopener noreferrer">FIK公式表 ↗</a>（勝敗のみ）`:`${m.overtime?'延長':''}${m.onePointMark&&!m.overtime?'一本勝ち':''}${[2012,2015].includes(m.year)&&m.source?.startsWith('https://www.youtube.com/watch?v=')?`<div class="tiny"><a class="data-link" href="${esc(m.source)}" target="_blank" rel="noopener noreferrer">全剣連公式動画 ↗</a></div>`:''}`}</td></tr>`;
  };
  const wkcMatchTable=(mm,code)=>mm.length?`<div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・取得技（本人 / 相手）</th><th>備考</th></tr></thead><tbody>${mm.map(m=>wkcMatchDetails(m,code)).join('')}</tbody></table></div>`:'<p class="small muted">個人戦出場は確認済みですが、この年度の個別試合は未収録です。</p>';
  const wkcFindMatch=k=>wkcRecords.individual.find(m=>m.matchKey===k);
  const wkcTeamBouts=(year,gender)=> (wkcRecords.teamBouts||[]).filter(b=>b.year===year&&b.gender===gender);
  const wkcBoutResultRow=b=>`<tr><td>${esc(b.order)}番</td><td>${wkcNames(b.player,b.playerId)}<div class="tiny muted">${esc(b.playerCode)}</div></td><td>${esc(b.opponent)}<div class="tiny muted">${esc(b.opponentCode)}</div></td><td class="${b.result==='勝'?'result win':'result'}">${esc(b.result)}</td><td>${b.scoreVerified===false?'<span class="muted">未収録</span>':`<strong>${b.playerTech.length} - ${b.opponentTech.length}</strong><div class="tiny muted">${esc(b.playerTech.join('・')||'—')} / ${esc(b.opponentTech.join('・')||'—')}</div>`}</td><td><a class="data-link" target="_blank" rel="noopener noreferrer" href="${esc(b.source)}">${b.source?.includes('youtube.com')?'全剣連公式動画':'全剣連公式記事'} ↗</a>${b.resultSource?`<div class="tiny"><a class="data-link" target="_blank" rel="noopener noreferrer" href="${esc(b.resultSource)}">全剣連公式記事（勝敗） ↗</a></div>`:""}</td></tr>`;
  const wkcTeamBoutsTable=(bouts)=>`<div class="table-wrap"><table><thead><tr><th>順</th><th>日本選手</th><th>対戦相手</th><th>勝敗</th><th>本数・技（日本 / 相手）</th><th>出典</th></tr></thead><tbody>${bouts.map(wkcBoutResultRow).join('')}</tbody></table></div>`;
  function renderWkcTeamPlayerHistory(p){
    const bs=(wkcRecords.teamBouts||[]).filter(b=>b.playerId===p.id).sort((x,y)=>y.year-x.year||(['予選１','予選２','１回戦','２回戦','準決勝','決勝'].indexOf(x.teamRound)-['予選１','予選２','１回戦','２回戦','準決勝','決勝'].indexOf(y.teamRound)));
    if(!bs.length)return '';
    return `<section class="pane wide history-pane"><h3 class="section-title">世界剣道選手権（WKC）・団体本人実戦</h3><p class="small muted">全剣連の公式動画・公式大会報告で出場を直接確認できた団体戦のみ表示。2009年は「剣窓」大会報告による男子団体準決勝5人と決勝寺本大将の実戦のみ。代表登録・個人戦出場とは別管理。2012年は男子団体決勝5人の本人実戦・出場順を公式動画で確認し、内村・正代の勝利、木和田の敗戦、高鍋の引き分けを全剣連公式記事でA確定。勝見の本人勝敗と全員の技・本数は未確認。2015年は動画から本人別の対戦・取得技を確認した試合を掲載。資料未確認の試合への出場・不出場は断定しません。全日本選手権の通算・ランキングには加算しません。</p><div class="history-group">${wkcTeamBoutsTable(bs)}<div class="pane-pad small">${[...new Set(bs.map(b=>b.year))].sort((a,b)=>b-a).map(y=>`<a href="#/wkc/${y}" class="data-link">${y}年WKC大会一覧へ</a>`).join(" / ")}</div></div></section>`;
  }
  function renderWkcPlayerHistory(p){
    const es=wkcRecords.japanIndividuals.filter(e=>e.playerId===p.id).sort((a,b)=>b.year-a.year);
    if(!es.length)return '';
    return `<section class="pane wide history-pane"><h3 class="section-title">世界剣道選手権（WKC）・個人戦</h3><p class="small muted">FIK・全剣連・大会公式資料で確認できた個人戦。2009年・2012年はFIK公式表に基づく決勝Tの一部のみ収録。2015年は決勝トーナメントと公式動画で確認した予選の一部を収録。取得技は全剣連公式動画などで直接確認した試合だけ表示。全日本選手権の通算勝敗・ランキングには含めません。代表登録・団体の本人実戦とは別の記録です。</p>${es.map(e=>{const mm=e.matchKeys.map(wkcFindMatch).filter(Boolean);return `<details class="history-group" open><summary>${e.year}年・第${wkcEventSource(e.year).edition}回${e.name&&norm(e.name)!==norm(p.name)?`（当時：${esc(displayNameForRaw(e.name))}）`:""} ${e.medal?esc(e.medal)+' / ':''}${e.year===2015?'決勝T・予選一部':(e.year===2012||e.year===2009)?'決勝T・一部収録' :`${e.wins}勝${e.losses}敗`} <span class="history-count">${mm.length}試合を掲載</span></summary>${wkcMatchTable(mm,e.code)}<div class="pane-pad small">${wkcSource(wkcEventSource(e.year))} / <a class="data-link" href="#/wkc/${e.year}">WKC大会一覧へ</a></div></details>`}).join('')}</section>`;
  }
  function renderWkc(year){
    if(![2009,2012,2015,2018,2024].includes(year))return notFound();
    const src=wkcEventSource(year),pod=wkcRecords.podium.filter(r=>Number(r['大会年度'])===year), team=wkcRecords.team.filter(r=>r.year===year), mm=wkcRecords.individual.filter(r=>r.year===year), people=wkcRecords.japanIndividuals.filter(r=>r.year===year);const partial2015=year===2015,partial2012=year===2012,partial2009=year===2009;
    const podiumTable=(g,kind)=>{
      const pp=pod.filter(r=>r['性別']===g&&r['種別']===kind);
      return `<div class="table-wrap"><table><thead><tr><th>順位</th><th>${kind==='個人'?'選手名':'国・地域'}</th></tr></thead><tbody>${pp.map(r=>`<tr><td>${esc(r['順位'])}</td><td>${wkcNames(r['選手または国地域'],r['選手ID'])}</td></tr>`).join('')}</tbody></table></div>`;
    };
    const teamTable=g=>{const tt=team.filter(t=>t.gender===g);return `<div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦国・地域</th><th>勝数（日本 - 相手）</th><th>本数（日本 - 相手）</th></tr></thead><tbody>${tt.map(t=>`<tr><td>${esc(t.round)}</td><td>${esc(t.opponent)}${[2009,2012,2015].includes(t.year)?`<div class="tiny"><a class="data-link" href="${esc(t.source)}" target="_blank" rel="noopener noreferrer">${[2009,2012].includes(t.year)?t.source?.includes('old2.kendo.or.jp')?'全剣連公式記事':'FIK公式表':t.scoreVerified?'全剣連公式動画':'FIK公式表'} ↗</a></div>`:t.scoreVerified===false?`<div class="tiny"><a class="data-link" href="${esc(t.source)}" target="_blank" rel="noopener noreferrer">FIK公式表 ↗</a></div>`:''}</td><td class="result win">${t.scoreVerified===false && !t.winsVerified?'日本の勝利':`${t.playerWins} - ${t.opponentWins}`}</td><td>${t.scoreVerified===false?'未収録':`${t.playerPoints} - ${t.opponentPoints}`}</td></tr>`).join('')}</tbody></table></div>`};
    const teamBoutsPanel=g=>{
      const bb=wkcTeamBouts(year,g);
      if(!bb.length)return '';
      const rounds=['予選１','予選２','１回戦','２回戦','準決勝','決勝'].filter(r=>bb.some(b=>b.teamRound===r));
      return `<div class="pane wkc-match-panel"><div class="pane-pad"><h4>日本代表・団体戦の本人実戦（公式資料確認済み）</h4><p class="small muted">${g}は公式動画・公式記事から計${bb.length}人枠をA確認。2009年は「剣窓」記事で男子団体準決勝5人の順番・勝敗と決勝寺本大将の面・小手2本を確認。2012年男子決勝は5人の本人実戦と順番A確定。内村・正代・木和田・高鍋の勝敗は全剣連公式記事でA確定、次鋒勝見は未確認。全員の技・本数・相手氏名は未確認。2015年は各対戦の出場順・相手・勝敗・取得技を確認。2015年女子2回戦の本人実戦は未確認。反則・延長は未確認として保留。</p></div>${rounds.map(r=>{const mm=bb.filter(b=>b.teamRound===r).sort((a,b)=>a.order-b.order);return `<details class="history-group" open><summary>${esc(r)}・日本 対 ${esc(mm[0].teamOpponent)} <span class="history-count">${year===2009?'公式報告で出場・勝敗A（本数は一部のみ）':year===2012?'5人出場A・個人勝敗4人A':'5人の本人実戦・取得技 A確定'}</span></summary>${wkcTeamBoutsTable(mm)}</details>`}).join('')}</div>`;
    };
    const playersTable=g=>{
      const pp=people.filter(e=>e.gender===g);
      return pp.map(e=>{const mx=e.matchKeys.map(wkcFindMatch).filter(Boolean);return `<details class="history-group"><summary><span>${wkcNames(e.name,e.playerId)} <span class="muted small">(${esc(e.code)})</span> ${e.medal?badge(e.medal,'green'):''}</span><span class="history-count">${partial2015?`掲載${mx.length}試合（決勝T・予選一部）`:(partial2012||partial2009)?`決勝Tの掲載${mx.length}試合（部分収録）`:`${e.wins}勝${e.losses}敗 / ${mx.length}試合`}</span></summary>${wkcMatchTable(mx,e.code)}<div class="pane-pad small">${wkcSource(src)}</div></details>`}).join('');
    };
    const blocks=['男子','女子'].map(g=>`<section class="wkc-division"><h3 class="section-title">${g}・個人戦</h3><div class="wkc-podium-group pane"><div class="pane-pad"><h4>個人戦の入賞者</h4></div>${podiumTable(g,'個人')}</div><div class="pane wkc-match-panel"><div class="pane-pad"><h4>日本代表・個人戦の試合別結果</h4><p class="small muted">${partial2009?'2009年はFIK公式男女個人戦トーナメントで日本の出場選手男女各4名を確認。今回は準決勝・決勝のうち日本選手が関係した5試合の勝敗を部分収録。試合別の得点・取得技・延長、予選や序盤戦は未確認（第92組、1巡目）。':partial2012?'2012年はFIK公式表で日本選手8名の出場と決勝T一部19試合（取得技Aは5試合）を確認。女子の１回戦表記を公式図面で修正し、２回戦１試合を追加。個人戦は3巡調査終了につき、残る予選・未収録回戦・技・延長は後回しです。':partial2015?'2015年はFIK公式決勝トーナメント表から日本選手の全回戦と、全剣連公式動画で確認できた予選の一部を掲載。取得技は公式動画で確認できた試合のみ表示します。未確認の予選試合は網羅済みとみなしません。':'選手名を開くと試合結果を確認できます。日本選手同士の試合は総件数に重複計上しません。'}</p></div>${playersTable(g)}</div><h3 class="section-title wkc-team-heading">${g}・団体戦</h3><div class="pane wkc-podium-group"><div class="pane-pad"><h4>団体戦の入賞国・地域</h4></div>${podiumTable(g,'団体')}</div><div class="pane wkc-match-panel"><div class="pane-pad"><h4>日本チームの団体対戦結果</h4><p class="small muted">${partial2009?'2009年はFIK公式決勝トーナメント表から日本の男女各4国別対戦の勝数だけA確認。得点本数は未収録。男子準決勝は全剣連公式「剣窓」の報告から5人の出場順・勝敗を確認し、決勝は寺本大将の対戦・技のみ確認。女子団体の本人実戦は未確認。':partial2012?'2012年はFIK公式表で決勝Tの国別8対戦をA確定。男子決勝は出場5人・順番を公式動画で確認し、全剣連「剣窓」の公式報告から4人の個人勝敗を確定（勝見は未確認）。全員の取得技・本数と女子の団体本人実戦は未収録です。':partial2015?'2015年は国別対戦10試合のうち9試合で全剣連公式動画の得点・本人実戦を確認。女子2回戦シンガポール戦の本人実戦・本数は未確認です。':'国別対戦の勝数・本数を確認できた範囲で表示。代表登録と本人の実戦を混同しません。'}</p></div>${teamTable(g)}</div>${(partial2009||partial2012||partial2015)?teamBoutsPanel(g):''}</section>`).join('');
    return `${verifiedBanner}${pageHeader('WORLD KENDO CHAMPIONSHIPS','世界剣道選手権（WKC）','FIK・全剣連公式結果に基づき、国際大会の入賞結果と日本代表の試合結果を別集計で整理。')}<nav class="wkc-years" aria-label="WKC大会年度"><a href="#/wkc/2024" class="${year===2024?'active':''}">2024年・第19回</a><a href="#/wkc/2018" class="${year===2018?'active':''}">2018年・第17回</a><a href="#/wkc/2015" class="${year===2015?'active':''}">2015年・第16回</a><a href="#/wkc/2012" class="${year===2012?'active':''}">2012年・第15回</a><a href="#/wkc/2009" class="${year===2009?'active':''}">2009年・第14回</a></nav><p class="lead">${src.date} / ${esc(src.city)} / 第${src.edition}回。公式情報：${wkcSource(src)}</p><div class="stats">${statCard('個人・団体入賞枠',pod.length,'枠','男女個人・団体の各4枠')}${statCard('日本団体の対戦',team.length,'試合',partial2009?'決勝Tの男女各4対戦・勝数のみ':partial2012?'決勝Tの男女各4対戦':partial2015?'予選一部＋決勝T':'男子7・女子7')}${statCard(partial2009||partial2012||partial2015?'日本選手の個人戦・掲載試合':'日本選手個人の実戦',mm.length,'試合',partial2009?'準決勝・決勝一部':partial2012?'決勝T一部':partial2015?'決勝T＋予選一部':'日本選手同士は1試合に統合')}${statCard(partial2009||partial2012||partial2015?'個人戦出場を確認した日本選手':'詳細掲載の日本選手',people.length,'名','男女各4名')}</div><div class="privacy-banner"><strong>集計の注意：</strong>${partial2009?'2009年はFIK公式入賞16枠、日本団体の決勝T8国別対戦（勝数のみ、本数未収録）、個人戦出場8名と準決勝・決勝5試合を一部収録。男子団体は全剣連公式報告から準決勝の本人実戦5枠と決勝の寺本1枠を確定。代表20名全員の名簿、ほかの個人戦、女子団体本人実戦は未確認です。':partial2012?'2012年は入賞16枠、日本選手個人戦出場8名・決勝T一部19試合の勝敗（うち取得技5試合）、団体決勝T8対戦の勝数・本数をA確認。男子団体決勝の5人については全剣連公式動画で実戦と順番のみA確認。4人の勝敗のみ公式報告でA確定済み。次鋒勝見の本人勝敗、個人得点、他の団体実戦、代表20名全員の登録名簿、予選・未掲載回戦は未確認です。':partial2015?'2015年は入賞結果16枠・日本代表登録20名を収録。日本選手の決勝トーナメント38試合と公式動画で確認した予選4試合の勝敗を収録し、うち全剣連公式動画25試合は取得技を掲載。団体戦は男子決勝T4試合、女子予選2試合・決勝T4試合の計10国別対戦を掲載。うち9試合は勝数・本数と本人実戦45人枠・取得技を全剣連公式動画からA確認。女子2回戦シンガポール戦の本人実戦や未確認の延長・反則は収録していません。個人技未確認17試合は3巡調査のため一時保留。':'日本選手の個人戦を全試合収録し、日本チームの団体対戦を別に収録。海外選手同士の個人戦・団体戦、団体の日本代表本人実戦は未収録。2024年の取消線付き予選1件は実戦から除外。'}全日本選手権のランキングや出場回数には加算しません。</div>${partial2015?`<section class="pane wkc-roster-panel"><div class="pane-pad"><h3 class="section-title">2015年 日本代表登録名簿（男女各10名）</h3><p class="small muted">代表登録と、個人戦・団体戦の本人実戦は別管理。個人戦の出場選手（各4名）は大会公式の決勝トーナメント表と照合済みです。未リンクの氏名は既存の選手IDを確認中です。</p><div class="wkc-roster-grid">${['男子','女子'].map(g=>`<section><h4>${g}</h4><ul>${wkcRecords.roster.filter(r=>r.year===2015&&r.gender===g).map(r=>`<li><span class="muted small">${esc(r.code)}</span> ${wkcNames(r.name,r.playerId)}${people.some(p=>p.gender===g&&p.code===r.code)?'<span class="wkc-roster-mark">個人戦出場</span>':''}</li>`).join('')}</ul></section>`).join('')}</div><p class="small"><a class="data-link" href="${esc(src.officialRoster)}" target="_blank" rel="noopener noreferrer">大会公式・日本代表登録名簿 ↗</a></p></div></section>`:''}${blocks}<div class="source-box"><strong>一次資料：</strong> ${wkcSource(src)}<p class="small">大会の個人戦・団体戦を混同せず、入賞・代表登録・団体の本人実戦を分離して管理。2009年は入賞16枠、団体決勝T8国別対戦の勝数、個人出場8名・決勝T5試合、男子団体本人実戦の準決勝5枠と決勝寺本1枠をA確認。国別・個人別の取得本数は未確認分を空欄に保持。2012年は入賞16枠・国別団体決勝T8対戦、個人出場8名・決勝T一部19試合（取得技5試合）をA確認。男子団体決勝の出場順5枠と4人の本人別勝敗A（技・本人得点未確認）。2006年以前のWKCは今後追加予定。2015年は個人戦の決勝Tと予選の一部、団体戦の男子全4対戦・女子5対戦で確認済みの本人実戦計45人枠を収録。個人技17試合は3巡目終了で後回し、女子団体シンガポール戦は本人実戦未確認。</p></div>`;
  }
  function renderEvents(){return `${verifiedBanner}${pageHeader('TOURNAMENT DIRECTORY','大会データベース','男子2011〜2026年（2011年はランキング対象外）・女子2012〜2026年の全63試合収録大会を掲載。男子2012〜2014年は公式結果表・公式動画の記載を用いた独立2巡目照合済み。')}
    <div class="toolbar"><div class="field search"><label for="eventSearch">大会名・回次</label><input class="control" id="eventSearch" type="search" placeholder="例：第69回、女子" value="${esc(eventQuery)}"></div><div class="field"><label for="eventYear">大会年度</label><select id="eventYear" class="control">${['すべて',...[...new Set(events.map(e=>String(e.year)))].sort((a,b)=>Number(b)-Number(a))].map(y=>`<option ${eventYear===y?'selected':''}>${y}</option>`).join('')}</select></div><div class="field"><label for="eventGender">区分</label><select id="eventGender" class="control">${['すべて','男子','女子'].map(g=>`<option ${eventGender===g?'selected':''}>${g}</option>`).join('')}</select></div></div><div class="count-line"><span id="eventCount"></span><span>2020年大会は2021年3月14日開催（延期開催）。2021年大会とは別の開催回</span></div><div class="pane" id="eventResults"></div>`;}
  function renderEvent(id){const e=findE(id);if(!e)return notFound();const rs=sortedResults(id);const current=fullOfficialEvent(e);const edMatches=fullMatchesFor(e);
    const medal=(key)=>rs.filter(r=>finishCategory(r.finish)===key).map(r=>{const p=findP(r.player),old=archivedNameFor(e,p);return pLink(p)+((official2012Event(e)||official2013Event(e))&&norm(old)!==norm(p.name)?` <span class="muted">（当時：${esc(old)}）</span>`:'');}).join(' / ');
    const podium=current?`<div class="event-podium"><div class="podium-cell champion"><span>優勝</span><strong>${medal('優勝')||'—'}</strong></div><div class="podium-cell"><span>準優勝</span><strong>${medal('準優勝')||'—'}</strong></div><div class="podium-cell"><span>第3位</span><strong>${medal('3位')||'—'}</strong></div></div>`:'';
    return `${verifiedBanner}<div class="breadcrumb"><a href="#/events">大会データ</a> › ${esc(e.year===2020?'2020年大会':e.year+'年度')} ${esc(e.edition)}</div><p class="eyebrow">TOURNAMENT EDITION</p><h2 class="heading">${esc(e.edition)} ${esc(e.name)}</h2>${eventQuickButtons(e.id)}<p class="lead">${e.year===2020?'2020年大会':e.year+'年度'} / ${esc(e.gender)}${e.year===2020?' / 2021年3月14日開催（延期開催）':''}</p>
    <div class="stats">${statCard('大会表示年',e.year,e.year===2020?'年大会':'年度',e.year===2020?'2021年3月14日開催（延期開催）':'')}${statCard('このDBの掲載選手',rs.length,'名',current?'大会全出場選手':'2026年出場者の過去記録のみ')}${statCard('結果の状態',current?'登録済み':'照合済み','',current?'全63試合を掲載':'元Excelの確認済み範囲のみ')}${statCard('大会回次',e.edition,'','全日本選手権')}</div>
    <section class="pane event-result-entry"><div class="pane-pad"><div class="event-entry-head"><div><p class="eyebrow">TOURNAMENT RESULTS</p><h3 class="section-title">${current?e.year+'年 個人別の最終成績':'この大会の掲載選手の成績'}</h3><p class="small muted">選手の右端にある ▼ を押すと、この場でその選手の試合結果が開きます。もう一度押すと閉じます。段位は各大会当時の公式登録を確認できたものだけ掲載します。</p></div>${badge(current?'64名・63試合（勝敗A）':`${rs.length}名分・一部記録`,current?'green':'')}</div>
    ${podium}${e.id==='m62'?'<p class="small muted result-entry-note">※2014年男子の反則▲は独立検証が未完了です。▲が表示されない試合も「反則なし」とは断定していません。</p>':''}<p class="small muted result-entry-note">${current?'この大会の出場者64名・公式試合63件の記録です。':'過去大会は2026年出場者に関係する確認済みの部分記録です。大会全選手の成績ではありません。'}</p></div>
    ${renderEventPlayerTable(e,rs)}</section>
    ${sourceScopeNote(e)}
    <div class="source-box">大会の出典：${current?sourceLink(e.source,'全日本剣道連盟の公式資料'):archiveSource(e.source,'原本DBの確認資料')}。${current?'大会の全63試合を収録。試合別出典の確認範囲は大会ごとに異なり、技・延長・反則などには未確認項目があります。':'過去大会は掲載範囲を限定し、未確認成績を推測していません。'}</div>`;}
  function rankingRows(){
    const start=2012;
    const labels={wins:'対象期間の勝利数',appearances:'対象期間の出場回数',titles:'対象期間の優勝回数',finals:'対象期間の決勝進出回数',men:'面取得数',kote:'小手取得数',do:'胴取得数',tsuki:'突き取得数'};
    const ps=players.filter(p=>rankGender==='すべて'||p.gender===rankGender)
      .map(p=>({p,value:aggregate(p,start)[rankMetric],countedAppearances:aggregate(p,start).appearances}))
      .filter(v=>v.countedAppearances>0 && Number.isFinite(v.value) && v.value>=1)
      .sort((a,b)=>b.value-a.value||a.p.name.localeCompare(b.p.name,'ja'));
    // Standard competition ranks: equal metric values share the same rank (1,1,3,3,5).
    let previousValue=null, sharedRank=0;
    document.getElementById('rankingBody').innerHTML=ps.map((r,i)=>{
      if (i===0 || r.value!==previousValue) sharedRank=i+1;
      previousValue=r.value;
      const affiliation=r.p.aff&&!/未入力|未登録|未確認/.test(r.p.aff)
        ?`${esc(r.p.aff)}${r.p.affAsOfYear?`（${r.p.affAsOfYear}年大会時点）`:''}`
        :`<span class="muted">所属未確認</span>`;
      return `<tr><td><span class="rank-number">${sharedRank}</span></td><td>${pLink(r.p)}<div class="row-sub">${affiliation} / ${esc(r.p.gender)}</div></td><td><strong>${r.value}</strong> ${rankMetric==='wins'?'勝':['men','kote','do','tsuki'].includes(rankMetric)?'本':'回'}</td><td><button class="textbtn" data-compare-add="${r.p.id}">比較 ＋</button></td></tr>`;
    }).join('') || '<tr><td colspan="4" class="muted">この項目で1以上の記録がある選手はいません。</td></tr>';
    document.getElementById('metricHeading').textContent=labels[rankMetric]+'（'+start+'〜2026年）ランキング';
    const el=document.getElementById('rankingScope');
    if(el)el.textContent=rankGender==='女子'?'女子単独：2012〜2026年の連続15大会を集計。':rankGender==='男子'?'男子単独：2012〜2026年の連続15大会を集計。':'男女混合：男女とも2012〜2026年の共通15大会だけを集計。2011年以前は除外。';
    bindCompareButtons();
  }
  function renderRankings(){return `${verifiedBanner}${pageHeader('RECORDS & RANKINGS','記録・ランキング','期間内の公式記録に基づくランキング。男女とも2012年以降。男女混合も2012年以降の共通15大会。')}
    <div class="toolbar"><div class="field"><label for="rankMetric">集計指標</label><select id="rankMetric" class="control">${[['wins','勝利数'],['appearances','出場回数'],['titles','優勝回数'],['finals','決勝進出回数'],['men','面取得数'],['kote','小手取得数'],['do','胴取得数'],['tsuki','突き取得数']].map(([v,t])=>`<option value="${v}" ${rankMetric===v?'selected':''}>${t}</option>`).join('')}</select></div><div class="field"><label for="rankGender">区分</label><select id="rankGender" class="control">${['すべて','男子','女子'].map(g=>`<option ${rankGender===g?'selected':''}>${g}</option>`).join('')}</select></div></div>
    <div class="eyecatch"><strong>集計範囲：</strong><span id="rankingScope">男子・女子の対象期間を統一</span><p class="small muted">各ランキング項目は集計値が1以上の選手だけを掲載し、0の選手は表示しません。通算の生涯記録ではありません。対象期間外の部分記録はランキングに一切加算しません。公式資料同士で取得技が食い違う試合は、勝敗・本数は残し、技別集計のみ保留として除外します。</p></div>
    <div class="pane"><div class="pane-pad"><h3 class="section-title" id="metricHeading">記録ランキング</h3></div><div class="table-wrap"><table><thead><tr><th>順</th><th>選手</th><th>集計値</th><th>操作</th></tr></thead><tbody id="rankingBody"></tbody></table></div></div>
    <p class="footnote">※2020年大会は2021年3月14日開催（延期開催）で2021年大会と別集計。ランキングは男女とも2012〜2026年の共通15大会を使用し、生涯通算ではありません。技の公式資料間不一致2試合は技別集計から除外。延長の未確認77試合は勝敗記録を残して保留しています。</p>`;}
  // Search only recorded names and official readings. Unknown readings stay after confirmed names.
  const comparePlayersSorted=[...players].sort((a,b)=>{
    const ax=a.readingStatus==='A'&&a.reading?0:1;
    const bx=b.readingStatus==='A'&&b.reading?0:1;
    return ax-bx||(ax===0?kanaCompare(a,b):kanaSorter.compare(normKana(a.name),normKana(b.name)))||a.id.localeCompare(b.id);
  });
  function comparePicker(p,side){
    const id='comp'+side;
    const order=side==='A'?'①':'②';
    return `<div class="compare-side"><label class="small muted" for="${id}">比較する選手${order}</label>
      <div class="compare-current" aria-live="polite"><strong>${esc(p.name)}</strong><span>${p.readingStatus==='A'&&p.reading?esc(p.reading):'読み未確認'} / ${esc(p.gender)}</span></div>
      <div class="compare-combobox"><input type="search" class="control compare-search" id="${id}" placeholder="名前・ふりがなで検索" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-controls="${id}List" aria-expanded="false" aria-label="比較する選手${order}を名前で検索">
      <div class="compare-results" id="${id}List" role="listbox" aria-label="比較する選手${order}の候補" hidden></div></div>
      <p class="compare-hint">入力するたびに候補を絞り込みます</p></div>`;
  }
  function compareNameMatches(p,q){
    return [p.name,...(p.nameAliases||[]),p.formerName||'',p.reading,...(p.readingAliases||[]),p.formerReading||''].some(name=>normKana(name).startsWith(q));
  }
  function bindComparePickers(){
    for(const side of ['A','B']){
      const id='comp'+side;
      const input=document.getElementById(id);
      const list=document.getElementById(id+'List');
      if(!input||!list)continue;
      let active=-1;
      const close=()=>{list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;};
      const buttons=()=>[...list.querySelectorAll('[data-compare-choice]')];
      const mark=index=>{
        const items=buttons();
        active=items.length?Math.max(0,Math.min(items.length-1,index)):-1;
        items.forEach((el,i)=>{el.classList.toggle('is-active',i===active);el.setAttribute('aria-selected',String(i===active));});
        if(active>=0){input.setAttribute('aria-activedescendant',items[active].id);items[active].scrollIntoView({block:'nearest'});}
        else input.removeAttribute('aria-activedescendant');
      };
      const show=()=>{
        const q=normKana(input.value);
        const all=q?comparePlayersSorted.filter(p=>compareNameMatches(p,q)):comparePlayersSorted;
        const visible=all.slice(0,q?60:30);
        const count=q?`${all.length}名が一致${all.length>visible.length?'（先頭60名を表示）':''}`:`五十音順・全${all.length}名（先頭30名を表示）`;
        list.innerHTML=`<div class="compare-result-count" role="status">${count}</div>`+(visible.length?visible.map((p,i)=>`<button type="button" role="option" tabindex="-1" id="${id}Option${i}" data-compare-choice="${esc(p.id)}" aria-selected="false"><span class="compare-option-name">${esc(p.name)}</span><span class="compare-option-reading">${p.readingStatus==='A'&&p.reading?esc(p.reading):'読み未確認'} / ${esc(p.gender)}</span></button>`).join(''):'<p class="compare-no-results">一致する選手はいません</p>');
        list.hidden=false;input.setAttribute('aria-expanded','true');active=-1;input.removeAttribute('aria-activedescendant');
      };
      const choose=button=>{
        const id=button?.dataset.compareChoice;
        if(!id||!findP(id))return;
        if(side==='A')compA=id;else compB=id;
        close();render();
      };
      input.addEventListener('focus',show);
      input.addEventListener('input',show);
      input.addEventListener('keydown',event=>{
        if(event.isComposing||event.keyCode===229)return;
        if(event.key==='Escape'){if(!list.hidden){event.preventDefault();close();}return;}
        if(event.key==='ArrowDown'||event.key==='ArrowUp'){
          event.preventDefault();if(list.hidden)show();
          const length=buttons().length;
          if(length)mark(active<0?(event.key==='ArrowDown'?0:length-1):active+(event.key==='ArrowDown'?1:-1));
          return;
        }
        if(event.key==='Enter'&&!list.hidden){const items=buttons();if(items.length){event.preventDefault();choose(items[active<0?0:active]);}}
      });
      // pointerdown selection happens before Safari blurs the input.
      list.addEventListener('pointerdown',event=>{const target=event.target.closest('[data-compare-choice]');if(target){event.preventDefault();choose(target);}});
      list.addEventListener('click',event=>{const target=event.target.closest('[data-compare-choice]');if(target)choose(target);});
      input.addEventListener('blur',()=>window.setTimeout(()=>{if(!list.contains(document.activeElement))close();},160));
    }
  }
  // The comparison uses only the common, continuously recorded championship years.
  // Tied best finishes display every corresponding year; never infer missing years.
  function compareBestFinish(p,fromYear=2012){
    const rs=complete.filter(r=>r.player===p.id&&r.kind!=='legacy'&&findE(r.event)?.year>=fromYear);
    const highest=Math.max(0,...rs.map(r=>finishRank(r.finish)));
    if(!highest)return '—';
    const years=[...new Set(rs.filter(r=>finishRank(r.finish)===highest).map(r=>findE(r.event).year))].sort((a,b)=>a-b);
    return `${finishLabel(highest)}（${years.join('・')}年）`;
  }
  // Only an actual recorded meeting of both canonical player IDs qualifies.
  // 2011 men's bouts are included in the meeting list as reference, never in totals.
  function compareHeadToHead(a,b){
    if(a.id===b.id)return [];
    return allScopedMatches.filter(m=>((m.left===a.id&&m.right===b.id)||(m.left===b.id&&m.right===a.id))
      &&String(m.status||'').startsWith('A')&&Boolean(findE(m.event)))
      .sort((x,y)=>findE(y.event).year-findE(x.event).year||(y.roundIndex??0)-(x.roundIndex??0));
  }
  function compareHeadToHeadView(a,b){
    if(a.id===b.id)return '';
    const meetings=compareHeadToHead(a,b);
    const firstWins=meetings.filter(m=>m.winner===a.id).length;
    const secondWins=meetings.filter(m=>m.winner===b.id).length;
    const heading=`${esc(a.name)} ${firstWins}勝 − ${secondWins}勝 ${esc(b.name)}`;
    const rows=meetings.map(m=>{
      const e=findE(m.event);
      const aIsLeft=m.left===a.id;
      const aWon=m.winner===a.id;
      const bWon=m.winner===b.id;
      const aPoints=aWon?m.winPoints:m.losePoints;
      const bPoints=bWon?m.winPoints:m.losePoints;
      const aTech=aIsLeft?m.leftTech:m.rightTech;
      const bTech=aIsLeft?m.rightTech:m.leftTech;
      const tech=m.techVerified==='B'?'取得技未確認':`${esc(aTech||'—')} − ${esc(bTech||'—')}`;
      const official=sourceLink(m.source||e.source,'公式結果');
      const ref2011=e.year<2012?'<span class="compare-meeting-reference">参考記録・集計対象外</span>':'';
      return `<article class="compare-meeting">
        <div class="compare-meeting-top"><strong>${eLink(e)}</strong><span>${esc(m.round)}${ref2011}</span></div>
        <div class="compare-meeting-content">
          <div class="compare-meeting-contender ${aWon?'is-winner':''}"><span>${esc(a.name)}</span><strong>${aWon?'勝':'敗'}</strong></div>
          <div class="compare-meeting-result"><strong>${scoreNumber(aPoints)} − ${scoreNumber(bPoints)}</strong><small>取得技 ${tech}</small></div>
          <div class="compare-meeting-contender ${bWon?'is-winner':''}"><span>${esc(b.name)}</span><strong>${bWon?'勝':'敗'}</strong></div>
        </div><div class="compare-meeting-link">${official}</div>
      </article>`;
    }).join('');
    return `<section class="compare-head-to-head" aria-label="選手同士の直接対戦履歴">
      <h3 class="section-title">過去の直接対戦</h3>
      ${meetings.length?`<p class="compare-meeting-summary">収録済み ${meetings.length}試合：${heading}</p><div class="compare-meeting-list">${rows}</div>`
        :'<p class="compare-meeting-empty">収録済みの公式試合記録では、2人の直接対戦は確認されていません。</p>'}
    </section>`;
  }
  function renderCompare(){
    const a=findP(compA)||players[0],b=findP(compB)||players[1];
    const compareFrom=2012,aa=aggregate(a,compareFrom),bb=aggregate(b,compareFrom);
    const tournament=a.gender===b.gender?playerChampionshipName(a):'全日本選手権／全日本女子選手権';
    const profileRows=[
      ['氏名の読み',a.reading||'未確認',b.reading||'未確認'],
      ['区分',a.gender,b.gender],['登録時の代表',a.pref,b.pref],['所属',a.aff,b.aff],
      ['高校（出身・在籍を区別）',educationText(a,'high'),educationText(b,'high')],
      ['大学（出身・在籍を区別）',educationText(a,'univ'),educationText(b,'univ')],
      ['構え',a.stance||'—',b.stance||'—']
    ].map(([label,x,y])=>({label,x,y,championship:false}));
    const championshipRows=[
      ['出場回数',aa.appearances,bb.appearances],
      ['最高成績（最高年）',compareBestFinish(a,compareFrom),compareBestFinish(b,compareFrom)],
      ['勝利数',aa.wins,bb.wins],
      ['面取得本数',aa.men,bb.men],
      ['小手取得本数',aa.kote,bb.kote],
      ['胴取得本数',aa.do,bb.do],
      ['突き取得本数',aa.tsuki,bb.tsuki],
      ['優勝回数',aa.titles,bb.titles],
      ['決勝進出回数',aa.finals,bb.finals]
    ].map(([label,x,y])=>({label,x,y,championship:true}));
    const rows=[...profileRows,...championshipRows].map(({label,x,y,championship})=>{
      const metricLabel=championship?`<span class="compare-tournament-name">${esc(tournament)}</span><span class="compare-metric-name">${esc(label)}</span>`:esc(label);
      const valueCell=value=>`<div class="${typeof value==='number'?'big':championship&&label.startsWith('最高成績')?'compare-best-finish':''}">${esc(value)}</div>`;
      return `${valueCell(x)}<div class="compare-label">${metricLabel}</div>${valueCell(y)}`;
    }).join('');
    return `${verifiedBanner}${pageHeader('PLAYER COMPARISON','選手比較','2人の全日本選手権の記録と過去の直接対戦を比較します。')}
      <div class="compare-selects">${comparePicker(a,'A')}<div class="vs">VS</div>${comparePicker(b,'B')}</div>
      ${a.id===b.id?'<div class="privacy-banner">同じ選手が選ばれています。別の選手を選ぶと比較できます。</div>':''}
      <div class="comparison"><div><strong>${pLink(a)}</strong></div><div>比較項目</div><div><strong>${pLink(b)}</strong></div>${rows}</div>
      ${compareHeadToHeadView(a,b)}
      <div class="source-box"><strong>集計期間・注記</strong><p>全日本選手権（女子は全日本女子選手権）の出場回数・最高成績・勝利数・面／小手／胴／突きの取得本数・優勝回数・決勝進出回数は、男女とも<strong>${compareFrom}〜2026年</strong>の連続収録15大会を対象とします。2020年大会は2021年3月14日開催の延期大会で、2021年大会とは別に集計しています。</p><p>2011年男子の試合は集計に含めませんが、2人の直接対戦が確認できる場合は参考記録として表示します。技の確認が保留の試合は勝敗・勝利数を維持し、技別取得本数には加算しません。「直接対戦なし」は収録済み記録の範囲を示し、他大会での対戦がなかったことを意味しません。</p></div>`;
  }
  function renderUpdates(){return `${pageHeader('CHANGELOG','更新履歴','記録追加・表示改善・調査上の判断の履歴。古い項目は作業当時の記述であり、現在の集計範囲とは異なる場合があります。')}<div class="eyecatch"><strong>現在の集計方針：</strong>男女とも2012〜2026年の15大会を対象に比較。2011年男子は参考記録のみ。延長B77試合・技B2試合は未確認として扱います。</div><div class="pane">${visibleUpdates.map(u=>`<article class="update"><div class="update-date">${esc(u.date)}</div><div><div style="margin-bottom:7px">${badge(u.tag)}</div><h3>${esc(u.title)}</h3><p>${esc(u.desc)}</p></div></article>`).join('')}</div><div class="source-box"><strong>取り込み元：</strong><p>男子：${esc(meta.sourceMen)}</p><p>女子：${esc(meta.sourceWomen)}</p><p>元Excel本体は変更していません。今後Excelのデータを更新した場合は、再変換することでサイト側にも反映します。</p></div>`;}
  const notFound=()=>'<h2 class="heading">ページが見つかりません</h2><a href="#/" class="btn">ホームへ戻る</a>';
  function bindCompareButtons(){document.querySelectorAll('[data-compare-add]').forEach(btn=>{btn.onclick=()=>{compA=compB;compB=btn.dataset.compareAdd;if(compA===compB){compA=players.find(p=>p.id!==compB).id;}location.hash='#/compare';render()}})}
  function render(){const hash=location.hash||'#/';const route=hash.slice(2).split('/');const key=route[0]||'';const activeKey=key==='player'?'players':key==='event'?'events':key;const pageTitles={'':'ホーム',players:'選手名鑑',player:'選手プロフィール',events:'大会データベース',event:'大会詳細',rankings:'記録・ランキング',wkc:'世界剣道選手権',compare:'選手比較',updates:'更新履歴'};
    document.getElementById('topTitle').textContent='剣道記録室 / '+(pageTitles[key]||'ページ');
    document.getElementById('desktopNav').innerHTML=nav.map(([url,icon,title])=>`<a class="nav-link ${url.slice(2)===(activeKey||'')?'active':''}" href="${url}"><span class="ico">${icon}</span>${title}</a>`).join('');
    document.getElementById('mobileNav').innerHTML=nav.map(([url,icon,title])=>`<a class="${url.slice(2)===(activeKey||'')?'active':''}" href="${url}"><span class="ico">${icon}</span>${title}</a>`).join('');
    const views={'':renderHome,players:renderPlayers,player:()=>renderPlayer(route[1]),events:renderEvents,event:()=>renderEvent(route[1]),wkc:()=>renderWkc(Number(route[1])||2024),rankings:renderRankings,compare:renderCompare,updates:renderUpdates};app.innerHTML=views[key]?views[key]():notFound();
    if(key==='players'){playerCards();document.getElementById('playerSearch').addEventListener('input',e=>{playerQuery=e.target.value;playerCards()});document.getElementById('playerGender').addEventListener('change',e=>{genderFilter=e.target.value;playerCards()});document.getElementById('prefFilter').addEventListener('change',e=>{prefFilter=e.target.value;playerCards()});document.getElementById('kanaIndex').addEventListener('click',e=>{const b=e.target.closest('[data-jump-kana]');if(b&&!b.disabled)jumpDirectory('kana-'+b.dataset.jumpKana);});document.getElementById('playerResults').addEventListener('click',e=>{const sub=e.target.closest('[data-jump-sub]');if(sub&&!sub.disabled)jumpDirectory('kana-sub-'+sub.dataset.jumpSub);if(e.target.closest('[data-back-kana]'))jumpDirectory('kanaIndex')});}
    if(key==='events'){eventRows();document.getElementById('eventSearch').addEventListener('input',e=>{eventQuery=e.target.value;eventRows()});document.getElementById('eventGender').addEventListener('change',e=>{eventGender=e.target.value;eventRows()});document.getElementById('eventYear').addEventListener('change',e=>{eventYear=e.target.value;eventRows()})}
    if(key==='rankings'){rankingRows();document.getElementById('rankMetric').addEventListener('change',e=>{rankMetric=e.target.value;rankingRows()});document.getElementById('rankGender').addEventListener('change',e=>{rankGender=e.target.value;rankingRows()})}
    if(key==='compare')bindComparePickers();
    if(key==='player'){
      bindCompareButtons();
      app.querySelectorAll('[data-profile-year]').forEach(btn=>btn.addEventListener('click',()=>{
        const row=document.getElementById(btn.dataset.profileYear);if(!row)return;
        const opening=row.hidden;row.hidden=!opening;btn.setAttribute('aria-expanded',String(opening));
        btn.closest('.profile-year-row')?.classList.toggle('is-expanded',opening);
      }));
    }
    if(key==='')document.getElementById('heroSearch').addEventListener('submit',e=>{e.preventDefault();playerQuery=document.getElementById('heroQ').value;location.hash='#/players';render()});
  }
  window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0)});render();
})();
