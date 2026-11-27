'use strict';
(() => {
  const app=document.getElementById('app');
  const nav=[['#/','⌂','ホーム'],['#/players','♙','選手名鑑'],['#/events','♜','大会データ'],['#/japan','◎','日本代表'],['#/rankings','▥','ランキング'],['#/compare','⇄','選手比較'],['#/updates','≡','更新履歴']];
  const prefecturesNorthSouth=['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];
  let playerQuery='', genderFilter='すべて', prefFilter='すべて', eventQuery='', eventGender='すべて', eventYear='すべて', rankMetric='wins',rankGender='すべて',compA='m002',compB='m005';
  const norm=s=>String(s??'').normalize('NFKC').replace(/[\s　]+/g,'').replace(/[﨑崎]/g,'崎').replace(/[髙高]/g,'高').toLowerCase();
  const normKana=s=>norm(s).replace(/[ァ-ヶ]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-96));
  // Normalize only the human-readable name, retaining source rosters and player IDs.
  const displayNameForRaw=raw=>{
    const shown=String(raw??'').trim().replace(/[\s　]+/g,' ');
    return historicalDisplayNames[shown.replace(/ /g,'')]||shown;
  };
  // 2026 prefectural team registrations: new first-time site records (count from the roster only); unresolved identities stay unlinked.
  const todoNewRegistered = todo2026.roster.filter(r=>r.identityStatus==='A-new-2026-registration');
  const todoPrefFull=p=>/^(?:北海道|.{2,3}[都府県])$/.test(p)?p:p==='東京'?'東京都':p==='京都'?'京都府':p==='大阪'?'大阪府':p+'県';
  for(const r of todoNewRegistered){
    if(!r.playerId || players.some(p=>p.id===r.playerId))throw new Error('Duplicate team-registration player ID: '+r.playerId);
    players.push({id:r.playerId,name:r.name,gender:r.gender,pref:todoPrefFull(r.prefecture),aff:'2026年都道府県対抗登録（勤務先未確認）',ageAt2026:null,grade:'',skill:'',stance:'',high:'',univ:'',source:r.source,registrationOnly:true});
  }
  // Round 213: the independently verified 2009–2026 women's team-registration links
  // did not previously generate a player-directory entry for any of these 12 IDs.
  // Create ONE registration-only profile per proven identity, never a championship record.
  const tozaiMultiProfiles=[...(window.KENDO_TOZAI_MULTI_PROFILES?.players||[]),...(window.KENDO_TOZAI_MULTI_257?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_258?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_259?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_262?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_263?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_264?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_266?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_267?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_268?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_269?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_270?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_271?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_272?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_273?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_274?.newProfiles||[]),...(window.KENDO_TOZAI_MULTI_275?.newProfiles||[])];
  for(const [id,history] of Object.entries(todoWomenLinkedProfiles)){
    if(players.some(p=>p.id===id)||(window.KENDO_TOZAI_NEW_PLAYERS?.players||[]).some(t=>t.id===id)||tozaiMultiProfiles.some(t=>t.id===id))continue;
    const latest=history.entries[history.entries.length-1];
    const names=[...new Set(history.entries.map(e=>e.name))].filter(n=>norm(n)!==norm(history.name));
    players.push({id,name:history.name,gender:'女子',pref:todoPrefFull(latest.prefecture),
      aff:'所属・勤務先未確認',ageAt2026:null,grade:'',skill:'',stance:'',high:'',univ:'',
      registrationOnly:true,nameAliases:names,source:latest.source});
  }
  for(const bout of todo2025.individualBouts){
    if(!bout.actualBoutConfirmed||players.some(p=>p.id===bout.playerId))continue;
    players.push({id:bout.playerId,name:bout.name,gender:'女子',pref:bout.prefecture,
      aff:'所属・勤務先未確認',ageAt2026:null,grade:'',skill:'',stance:'',high:'',univ:'',
      registrationOnly:true,source:bout.officialRosterSource});
  }
  // Round 255: create minimal, source-scoped profiles for East-West match participants
  // whose names appear in a single match/year and have no existing person-ID match.
  // No birth year, affiliation, dan, school, or inter-year identity is inferred.
  const tozaiNewPlayers=window.KENDO_TOZAI_NEW_PLAYERS?.players||[];
  for(const t of tozaiNewPlayers){
    if(players.some(p=>p.id===t.id))throw new Error('東西対抗新規ID重複: '+t.id);
    players.push({id:t.id,name:t.name,gender:t.gender,pref:'未確認',aff:'',ageAt2026:null,
      grade:'',skill:'',stance:'',high:'',univ:'',source:t.source,
      tozaiOnly:true,tozaiYear:t.year,tozaiBoutId:t.boutId,
      tozaiIdentityNote:'この年度の一試合だけを個人プロフィールに結び付けています。別年度の同姓同名は未照合。'});
  }
  // Round256: multi-year new profiles, only 2012/2014/2016 official roster confirmed.
  for(const t of tozaiMultiProfiles){
    if(players.some(p=>p.id===t.id))throw new Error('東西対抗複数年度新規ID重複: '+t.id);
    players.push({id:t.id,name:t.name,gender:t.gender,pref:t.prefecture,aff:'',ageAt2026:null,grade:'',skill:'',stance:'',high:'',univ:'',source:t.source,
      tozaiOnly:true,tozaiMultiYear:true,tozaiYears:t.years,tozaiRecordCount:t.records.length,tozaiRosters:t.records,tozaiYear:t.years[0],tozaiBoutId:t.records[0].boutId,
      tozaiIdentityNote:t.identityNote||'公式名簿で年齢と県の連続性を確認した年度のみ人物照合済み。'});
  }
  // R391: verified police individual results; no change to championship aggregates.
  players.push({id:'pol25_m_01',name:'加納 誠也',gender:'男子',pref:'東京都',aff:'警察官 警視庁',ageAt2026:null,grade:'',skill:'',stance:'',high:'',univ:'',source:'https://www.kendo.or.jp/competition/keisatsu-champ-2025/',registrationOnly:true,policeOnly:true});
  players.push({"id":"pol24_m_01","name":"内村 光伸","gender":"男子","pref":"宮崎県","aff":"警察官 宮崎県警察","ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/competition/keisatsu-champ-2024/","registrationOnly":true,"policeOnly":true});
  const kunitomo=players.find(p=>p.id==='m060'); if(kunitomo)kunitomo.nameAliases=[...new Set([...(kunitomo.nameAliases||[]),'國友 錬太朗'])];
  players.push({"id":"pol22_m_01","name":"中松 真喜","gender":"男子","pref":"滋賀県","aff":"警察官 滋賀県警察","ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/competition/keisatsu-champ-2022/","registrationOnly":true,"policeOnly":true});
  players.push({"id":"pol22_w_01","name":"宮坊 祥世","gender":"女子","pref":"静岡県","aff":"警察官 静岡県警察","ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/competition/keisatsu-champ-2022/","registrationOnly":true,"policeOnly":true});
  players.push({"id":"pol19_m_01","name":"豊富 俊介","gender":"男子","pref":"滋賀県","aff":"警察官 滋賀県警察","ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/competition/keisatsu-champ-2019/","registrationOnly":true,"policeOnly":true});
  players.push({"id":"pol18_m_01","name":"山中 駿","gender":"男子","pref":"","aff":"警察官 皇宮警察","ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/competition/keisatsu-champ-2018/","registrationOnly":true,"policeOnly":true});
  players.push({"id":"pol17_m_02","name":"横尾 徹","gender":"男子","pref":"神奈川県","aff":"警察官 神奈川県警察","ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/competition/keisatsu-champ-2017/","registrationOnly":true,"policeOnly":true});
  players.push({"id":"pol17_w_03","name":"北川 桃子","gender":"女子","pref":"滋賀県","aff":"警察官 滋賀県警察","ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/competition/keisatsu-champ-2017/","registrationOnly":true,"policeOnly":true});
  players.push({"id":"pol17_w_04","name":"三木 聖代","gender":"女子","pref":"東京都","aff":"警察官 警視庁","ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/competition/keisatsu-champ-2017/","registrationOnly":true,"policeOnly":true});
  players.push({"id":"pol17_w_05","name":"岩谷 千裕","gender":"女子","pref":"東京都","aff":"警察官 警視庁","ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/competition/keisatsu-champ-2017/","registrationOnly":true,"policeOnly":true});
  players.push({"id":"pol17_w_06","name":"角田 諭香","gender":"女子","pref":"東京都","aff":"警察官 警視庁","ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/competition/keisatsu-champ-2017/","registrationOnly":true,"policeOnly":true});
  players.push({"id":"pol16_m_01","name":"宮本 大幹","gender":"男子","pref":"神奈川県","aff":"警察官 神奈川県警察","ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/competition/keisatsu-champ-2016/","registrationOnly":true,"policeOnly":true});
  players.push({"id":"pol15_m_02","name":"川口 尚史","gender":"男子","pref":"神奈川県","aff":"警察官 神奈川県警察","ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/competition/keisatsu-champ-2015/","registrationOnly":true,"policeOnly":true});
  players.push({"id":"pol15_m_03","name":"川口 武光","gender":"男子","pref":"大阪府","aff":"警察官 大阪府警察","ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/competition/keisatsu-champ-2015/","registrationOnly":true,"policeOnly":true});
  players.push({"id":"pol13_m_01","name":"大坪 和哉","gender":"男子","pref":"神奈川県","aff":"警察官 神奈川県警察","ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/competition/keisatsu-champ-2013/","registrationOnly":true,"policeOnly":true});
  players.push({"id":"pol12_m_01","name":"砂川 脩","gender":"男子","pref":"山口県","aff":"警察官 山口県警察","ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/competition/keisatsu-champ-2012/","registrationOnly":true,"policeOnly":true});
  players.push({"id":"pol12_m_02","name":"三根 祐介","gender":"男子","pref":"神奈川県","aff":"警察官 神奈川県警察","ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/competition/keisatsu-champ-2012/","registrationOnly":true,"policeOnly":true});
  players.push({"id":"pol12_m_03","name":"横山 岳史","gender":"男子","pref":"大分県","aff":"警察官 大分県警察","ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/competition/keisatsu-champ-2012/","registrationOnly":true,"policeOnly":true});
  players.push({"id":"pol12_m_04","name":"伊藤 剛","gender":"男子","pref":"長野県","aff":"警察官 長野県警察","ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/competition/keisatsu-champ-2012/","registrationOnly":true,"policeOnly":true});
  // R405: historical police profiles; affiliation is as of the recorded event.
  players.push({"id":"polhist_m_2010_23","name":"古澤 伸晃","gender":"男子","pref":"","aff":"警察官 皇宮警察","affAsOfYear":2010,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"日本体育大学","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2010_58/danshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_m_2010_08","name":"松村 信幸","gender":"男子","pref":"兵庫県","aff":"警察官 兵庫県警察","affAsOfYear":2010,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2010_58/danshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_m_2010_13","name":"城 祐司","gender":"男子","pref":"東京都","aff":"警察官 警視庁","affAsOfYear":2010,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2010_58/danshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_m_2010_18","name":"井本 壮","gender":"男子","pref":"埼玉県","aff":"警察官 埼玉県警察","affAsOfYear":2010,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2010_58/danshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_m_2009_18","name":"松本 誠","gender":"男子","pref":"大阪府","aff":"警察官 大阪府警察","affAsOfYear":2009,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2009_57/danshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_m_2009_02","name":"権瓶 豪人","gender":"男子","pref":"","aff":"警察官 皇宮警察","affAsOfYear":2009,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2009_57/danshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_m_2009_09","name":"飯田 章太郎","gender":"男子","pref":"北海道","aff":"警察官 北海道警察","affAsOfYear":2009,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2009_57/danshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_m_2009_20","name":"林 豊大","gender":"男子","pref":"北海道","aff":"警察官 北海道警察","affAsOfYear":2009,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2009_57/danshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_m_2009_29","name":"鈴木 栄治","gender":"男子","pref":"","aff":"警察官 皇宮警察","affAsOfYear":2009,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2009_57/danshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_m_2008_26","name":"谷岡 憲太郎","gender":"男子","pref":"三重県","aff":"警察官 三重県警察","affAsOfYear":2008,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2008_56/danshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_m_2008_08","name":"井澤 武史","gender":"男子","pref":"滋賀県","aff":"警察官 滋賀県警察","affAsOfYear":2008,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2008_56/danshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_m_2008_18","name":"中村 雅宏","gender":"男子","pref":"福岡県","aff":"警察官 福岡県警察","affAsOfYear":2008,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2008_56/danshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_m_2008_23","name":"小磯 優","gender":"男子","pref":"茨城県","aff":"警察官 茨城県警察","affAsOfYear":2008,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2008_56/danshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_m_2008_30","name":"高島 一宏","gender":"男子","pref":"千葉県","aff":"警察官 千葉県警察","affAsOfYear":2008,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2008_56/danshi.gif","registrationOnly":true,"policeOnly":true});
  // R406: verified historical women police profiles.
  players.push({"id":"polhist_w_2010_02","name":"吉田 真希子","gender":"女子","pref":"宮城県","aff":"警察官 宮城県警察","affAsOfYear":2010,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2010_58/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2010_03","name":"木村 久美","gender":"女子","pref":"東京都","aff":"警察官 警視庁","affAsOfYear":2010,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2010_58/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2010_05","name":"野田 幸美","gender":"女子","pref":"兵庫県","aff":"警察官 兵庫県警察","affAsOfYear":2010,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2010_58/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2010_08","name":"道下 三保子","gender":"女子","pref":"大阪府","aff":"警察官 大阪府警察","affAsOfYear":2010,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2010_58/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2010_09","name":"大辻 祥子","gender":"女子","pref":"大阪府","aff":"警察官 大阪府警察","affAsOfYear":2010,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2010_58/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2010_11","name":"伊沢 彰子","gender":"女子","pref":"千葉県","aff":"警察官 千葉県警察","affAsOfYear":2010,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2010_58/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2010_13","name":"三輪 とし子","gender":"女子","pref":"","aff":"警察官 皇宮警察","affAsOfYear":2010,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2010_58/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2009_02","name":"太田 泰代","gender":"女子","pref":"静岡県","aff":"警察官 静岡県警察","affAsOfYear":2009,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2009_57/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2009_06","name":"永島 恵","gender":"女子","pref":"神奈川県","aff":"警察官 神奈川県警察","affAsOfYear":2009,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2009_57/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2009_05","name":"佐々木 由貴","gender":"女子","pref":"東京都","aff":"警察官 警視庁","affAsOfYear":2009,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2009_57/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2008_02","name":"石川 香苗","gender":"女子","pref":"愛知県","aff":"警察官 愛知県警察","affAsOfYear":2008,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2008_56/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2008_01","name":"山川 千穂","gender":"女子","pref":"神奈川県","aff":"警察官 神奈川県警察","affAsOfYear":2008,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2008_56/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2008_03","name":"秋山 実穂","gender":"女子","pref":"長野県","aff":"警察官 長野県警察","affAsOfYear":2008,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2008_56/joshi.gif","registrationOnly":true,"policeOnly":true});
  // R407: historical men police profiles.
  players.push({"id":"polhist_m_2007_02","name":"荒川 隆史","gender":"男子","pref":"栃木県","aff":"警察官 栃木県警察","affAsOfYear":2007,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2007_55/danshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_m_2005_03","name":"磯合 和彦","gender":"男子","pref":"京都府","aff":"警察官 京都府警察","affAsOfYear":2005,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2005_53/danshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_m_2003_02","name":"藤本 剛","gender":"男子","pref":"","aff":"警察官 皇宮警察","affAsOfYear":2003,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2003_51/danshi.gif","registrationOnly":true,"policeOnly":true});
  // R408: historical women police profiles.
  players.push({"id":"polhist_w_2006_01","name":"岡田 圭","gender":"女子","pref":"熊本県","aff":"警察官 熊本県警察","affAsOfYear":2006,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2006_54/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2005_02","name":"齋藤 真紀","gender":"女子","pref":"東京都","aff":"警察官 警視庁","affAsOfYear":2005,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2005_53/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2005_06","name":"今村 阿耶","gender":"女子","pref":"大阪府","aff":"警察官 大阪府警察","affAsOfYear":2005,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2005_53/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2005_08","name":"馬場 恵子","gender":"女子","pref":"大阪府","aff":"警察官 大阪府警察","affAsOfYear":2005,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2005_53/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2004_06","name":"杉本 いずみ","gender":"女子","pref":"北海道","aff":"警察官 北海道警察","affAsOfYear":2004,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2004_52/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2004_08","name":"甲斐 敦子","gender":"女子","pref":"大阪府","aff":"警察官 大阪府警察","affAsOfYear":2004,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2004_52/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2003_01","name":"朝比奈 静香","gender":"女子","pref":"東京都","aff":"警察官 警視庁","affAsOfYear":2003,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2003_51/joshi.gif","registrationOnly":true,"policeOnly":true});
  players.push({"id":"polhist_w_2002_02","name":"多々良 なお子","gender":"女子","pref":"静岡県","aff":"警察官 静岡県警察","affAsOfYear":2002,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","source":"https://www.kendo.or.jp/old/competition/others/img/keisatsu-champ/2002_50/joshi.gif","registrationOnly":true,"policeOnly":true});
  nameReadings["polhist_m_2010_23"]={reading:"ふるさわ のぶあき",status:"A"};
  const uetake=players.find(p=>p.id==='tdw26_042'); if(uetake){uetake.nameAliases=[...new Set([...(uetake.nameAliases||[]),'駒田 奈都','駒田奈都'])];}
  const shodai=players.find(p=>p.id==='w17_05'); if(shodai)shodai.nameAliases=[...new Set([...(shodai.nameAliases||[]),'石突 小百合','石突小百合'])];
  // Round 450: police team verified name/participation profiles; no bout claims.
  players.push(...[{"id":"ptm_e5442f66e8ce","name":"植田 雄貴","gender":"男子","pref":"京都府","aff":"京都府警察","affAsOfYear":2022,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_14c4afca57c4","name":"菊池 友鷹","gender":"男子","pref":"京都府","aff":"京都府警察","affAsOfYear":2022,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_058d2bdc3214","name":"小笠原 亮","gender":"男子","pref":"京都府","aff":"京都府警察","affAsOfYear":2022,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_f32e21968131","name":"有馬 耕大","gender":"男子","pref":"京都府","aff":"京都府警察","affAsOfYear":2022,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_579e3f9dd368","name":"小林 一高","gender":"男子","pref":"京都府","aff":"京都府警察","affAsOfYear":2022,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_80fec6a83fab","name":"三宅 泰輝","gender":"男子","pref":"京都府","aff":"京都府警察","affAsOfYear":2022,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptw_ec133c0f8ad1","name":"上田 渚","gender":"女子","pref":"京都府","aff":"京都府警察","affAsOfYear":2022,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_b8f25c63f8bf","name":"上原 裕二郎","gender":"男子","pref":"宮崎県","aff":"宮崎県警察","affAsOfYear":2026,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_fe9ab7db0a7e","name":"深田 望史","gender":"男子","pref":"宮崎県","aff":"宮崎県警察","affAsOfYear":2026,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_1dc319bb23a5","name":"井本 李玖","gender":"男子","pref":"宮崎県","aff":"宮崎県警察","affAsOfYear":2026,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_6f55373692c5","name":"河野 隼佑","gender":"男子","pref":"宮崎県","aff":"宮崎県警察","affAsOfYear":2026,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_d993eb08ac7b","name":"松栄 翔","gender":"男子","pref":"宮崎県","aff":"宮崎県警察","affAsOfYear":2026,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptw_9793e68d93de","name":"川﨑 抹緒","gender":"女子","pref":"宮崎県","aff":"宮崎県警察","affAsOfYear":2026,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_a1630518f7fe","name":"曽我 貴昭","gender":"男子","pref":"熊本県","aff":"熊本県警察","affAsOfYear":2023,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"九州学院高等学校","univ":"中央大学","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_97449dac75d4","name":"後藤 武士","gender":"男子","pref":"大阪府","aff":"大阪府警察","affAsOfYear":2018,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_8c0850d9ae0d","name":"藤木 琢也","gender":"男子","pref":"大阪府","aff":"大阪府警察","affAsOfYear":2018,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_cef11c6b04e9","name":"舞原 倫秀","gender":"男子","pref":"大阪府","aff":"大阪府警察","affAsOfYear":2017,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_b50704e3d5f1","name":"飯蓋 深水","gender":"男子","pref":"東京都","aff":"警視庁","affAsOfYear":2017,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_aabbe4d6a783","name":"笹川 裕貴","gender":"男子","pref":"佐賀県","aff":"佐賀県警察","affAsOfYear":2014,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_17dd7e20a175","name":"前田 智博","gender":"男子","pref":"熊本県","aff":"熊本県警察","affAsOfYear":2014,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_0ab543986689","name":"阿部 康成","gender":"男子","pref":"山形県","aff":"山形県警察","affAsOfYear":2014,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_df1ae15b1ba4","name":"塩屋 裕斗","gender":"男子","pref":"愛知県","aff":"愛知県警察","affAsOfYear":2026,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"東福岡高等学校","univ":"日本大学","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_547171ef1da4","name":"大津 遼馬","gender":"男子","pref":"兵庫県","aff":"兵庫県警察","affAsOfYear":2026,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"育英高等学校","univ":"日本大学","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_26d2f8e0a8d5","name":"小畔 直","gender":"男子","pref":"大阪府","aff":"大阪府警察","affAsOfYear":2025,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"福岡大学附属大濠高等学校","univ":"中央大学","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true},{"id":"ptm_a597f0725316","name":"菊地 裕志","gender":"男子","pref":"","aff":"皇宮警察","affAsOfYear":2017,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true}]);
  nameReadings["ptm_a1630518f7fe"]={"reading": "そが たかあき", "status": "A"};
  nameReadings["ptm_547171ef1da4"]={"reading": "おおつ りょうま", "status": "A"};
  nameReadings["ptm_26d2f8e0a8d5"]={"reading": "こあぜ すなお", "status": "A"};
  // Round 451: named award recipient; no individual bout inferred.
  players.push({"id":"ptm_a286c965168a","name":"林 雄貴","gender":"男子","pref":"東京都","aff":"警視庁","affAsOfYear":2014,"ageAt2026":null,"grade":"","skill":"","stance":"","high":"","univ":"","registrationOnly":true,"policeOnly":true,"policeTeamOnly":true,"policeTeamAwardOnly":true});
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
  // Round 213: link the seven pre-existing women's championship profiles to their
  // previously audited prefectural-team roster names without creating duplicate persons.
  for(const p of players){
    const linked=todoWomenLinkedProfiles[p.id];
    if(!linked)continue;
    const aliases=linked.entries.map(e=>e.name).filter(n=>norm(n)!==norm(p.name));
    if(aliases.length)p.nameAliases=[...new Set([...(p.nameAliases||[]),...aliases])];
  }
  // R574: source spelling search aliases.
  for(const [id,alias] of [["m22_34", "地白充大"], ["m16_45", "上池安一郎"]]){const p=players.find(p=>p.id===id);if(!p)throw new Error("R574 canonical ID missing: "+id);p.nameAliases=[...new Set([...(p.nameAliases||[]),alias])];}
  window.KENDO_8DAN_UI.register(players);
  const readingCount=players.filter(p=>p.readingStatus==='A').length;
  const readingLabel=p=>p.reading?`<span class="name-reading">${esc(p.reading)}</span>`:'';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const asText=s=>s?esc(s):'<span class="muted">未登録</span>';
  const playerIdAliases={"tzm_dd2c75fca9d6":"m22_34","tzm_4644396fb27f":"m16_45","m11_02":"m13_62","m21_26":"m24_31","w19_47":"w25_04","w19_45":"w23_33","w13_30":"w25_05","w14_18":"w20_30","w12_64":"w13_24","w13_16":"w18_64","w13_07":"w15_36","w16_12":"w17_49","w13_50":"w17_08","w14_26":"w20_25","w14_03":"w20_31","w13_12":"w14_20","w16_49":"w19_61","w17_63":"w19_27","w19_38":"w24_14","w19_63":"w24_05","w12_23":"w034","tdw23_024":"w25_24","tdw25_032":"w25_62","tdw22_010":"w25_30","tdw25_065":"w22_58","tdw25_073":"w046","tdw25_080":"w008","tdw18_058":"w25_04","tdw18_077":"w25_29","tdw25_151":"w18_60","tdw24_212":"w25_09","tdw25_194":"w25_05","tdw19_142":"w002","tdw25_207":"w14_54","tdw19_036":"w039","tdw25_230":"tzw_cbc27db48eff","tdw25_244":"w19_62","tdw23_258":"w16_34","tdw24_009":"w23_55","tdw24_051":"w040","tdw24_059":"w25_46","tdw24_066":"w24_47","tdw17_152":"w24_05","tdw24_086":"w25_26","tdw24_096":"w24_23","tdw24_131":"w17_33","tdw24_170":"w24_37","tdw24_179":"w21_24","tdw24_234":"w22_26","tdw23_276":"w23_32","tdw24_311":"w22_23","tdw24_324":"w24_63","tdw24_007":"tzw_06087f22529e","tdw23_013":"w13_13","tdw24_041":"tzw_5d021d425a5e","tdw24_119":"tzw_28c99c11af7a","tdw24_285":"w23_34","tdw23_023":"w23_26","tdw23_048":"w22_60","tdw23_079":"w21_35","tdw23_108":"w23_51","tdw23_122":"w16_06","tdw23_149":"w049","tdw23_158":"w22_36","tdw23_180":"w16_58","tdw23_304":"w20_64","tdw23_321":"w15_39","tdw23_082":"w20_34","tdw23_088":"w17_04","tdw23_093":"w20_47","tdw23_094":"w029","tdw23_095":"w20_31","tdw23_110":"w20_61","tdw23_161":"tzw_2b41523b5721","tdw23_164":"w21_38","tdw23_193":"w22_09","tdw18_167":"w19_52","tdw23_257":"w13_61","tdw23_282":"w21_57","tdw23_296":"w20_46","tdw25_013":"tdw24_013","tdw25_114":"tdw24_114","tdw25_138":"tdw24_137","tdw19_022":"w24_51","tdw22_192":"w22_63","tdw25_299":"tdw24_300","tdw25_312":"tdw24_312","tdw22_038":"w19_15","tdw22_044":"w20_29","tdw22_295":"w24_61","tdw21_227":"w21_16","tdw19_038":"w19_01","tdw19_073":"w005","tdw19_103":"w14_05","tdw19_104":"w20_21","tdw19_108":"w19_53","tdw19_118":"w19_14","tdw19_143":"w19_22","tdw19_178":"w19_05","tdw19_212":"w19_23","tdw19_028":"w22_05","tdw19_067":"w21_52","tdw19_109":"tzm_271_2da952750b06","tdw19_121":"w20_09","tdw19_132":"w043","tdw19_146":"w20_05","tdw19_152":"w17_03","tdw19_157":"w21_23","tdw19_230":"tzm_269_196c1feca1a3","tdw19_040":"tzw_51f639303489","tdw19_120":"tdw25_168","tdw19_134":"tzw_82859d0ea8c7","tdw19_150":"tzw_5d6ec5877220","tdw18_130":"tzw_22_24_67345ffc1e7f","tdw15_009":"tdw24_013","tdw25_304":"w24_44","tdw25_166":"w22_52","tdw25_068":"w16_61","tdw25_214":"tdw26_154","tzm_9cf249b819fe":"tzm_17_19_9ce108d14c14","tzm_b3224f12a441":"tzm_3y_f950f1cc24f"}; // 2021 凛 / 2024 凜, verified same person
  const canonicalPlayerId=id=>playerIdAliases[id]||id;
  const playersById=new Map(players.map(p=>[p.id,p]));
  // R399: verified tournament spellings are search aliases, not changes to canonical names or readings.
  for(const d of policeIndividual)for(const r of d.results){
    const p=playersById.get(canonicalPlayerId(r.id));
    if(p&&norm(r.name)!==norm(p.name))p.nameAliases=[...new Set([...(p.nameAliases||[]),r.name])];
  }
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
  // Round 299: 2026 AJKF detailed player profiles list the actual occupation,
  // not just the participation counts in the program PDF. Direct source links
  // belong to the original 64 men and 64 women, never to historical/guest IDs.
  const occupation2026OfficialSourceRow=p=>{
    if(!/^[mw]0(?:0[1-9]|[1-5][0-9]|6[0-4])$/.test(p.id))return '';
    const url=p.gender==='男子'?'https://www.kendo.or.jp/competition/champ-74th/':'https://www.kendo.or.jp/competition/champ-joshi-65th/';
    return `<div>職業の出典</div><div><a href="${url}" target="_blank" rel="noopener noreferrer">2026年 全剣連選手別プロフィール ↗</a><span class="tiny muted">（同大会出場時点の記載）</span></div>`;
  };

  // Ages and grades are tournament snapshots, not fixed biographical attributes.
  // Use only the most recent event with separately verified data for each field.
  const eventAgeFor=(event,p)=>{
    const snapshot=eventGrades[event?.id]?.[p.id];
    if(Number.isInteger(snapshot?.ageAtEvent))return snapshot.ageAtEvent;
    // Round 139 compatibility: the existing AJKF 2026 roster ages live on players.
    // Never project this value onto a different tournament or a different year.
    if((event?.id==='m74'||event?.id==='w65')&&Number.isInteger(p.ageAt2026))return p.ageAt2026;
    return null;
  };
  const profileFactAsOf=event=>{
    if(!event)return '';
    if(event.id==='m74'||event.id==='w65')return '2026/11/3';
    if(event.id==='td26'&&event.date){const bits=event.date.split('-').map(Number);return `${bits[0]}/${bits[1]}/${bits[2]}`;}
    if(event.year===2020&&event.heldYear!==event.year)return '2021/3/14';
    // A precise day must not be invented when only the event year is recorded.
    return `${event.year}年大会`;
  };
  const profileSnapshotRow=(label,value,event)=>`<div>${esc(label)}</div><div class="profile-fact-cell">${value?`<span class="profile-fact-current">${esc(value)}</span>`:'<span class="muted">未確認</span>'}${value&&event?`<span class="profile-fact-asof">※${esc(profileFactAsOf(event))}時点</span>`:''}</div>`;
  // Tournament-specific prefectures. A prefectural-team entry is the team represented,
  // not proof of registration with a second prefectural kendo federation.
  // Never link unresolved same-name candidates to a known profile.
  // Round 218: official source discrepancies are annotations, not proof that two athletes differ.
  // Preserve both source statements and do not silently rewrite an event's original grade.
  const officialGradeDiscrepancies={
    w21_08:{year:2021,earlierGrade:'四段',laterGrade:'三段',earlierUrl:'https://www.kendo.or.jp/news/20210623/',laterUrl:'https://www.kendo.or.jp/competition/champ-joshi-60th/'},
    w25_12:{year:2023,earlierGrade:'四段',laterGrade:'三段',earlierUrl:'https://www.kendo.or.jp/news/20230621/',laterUrl:'https://www.kendo.or.jp/competition/champ-joshi-62nd/'}
  };
  const renderOfficialGradeDiscrepancy=p=>{
    const d=officialGradeDiscrepancies[p.id];if(!d)return '';
    return `<p class="small muted profile-grade-discrepancy" role="note"><strong>公式資料間の段位表記の違い：</strong>${esc(d.year)}年の<a class="data-link" href="${esc(d.earlierUrl)}" target="_blank" rel="noopener noreferrer">都道府県対抗女子の登録名簿</a>では${esc(d.earlierGrade)}、後に開催された<a class="data-link" href="${esc(d.laterUrl)}" target="_blank" rel="noopener noreferrer">全日本女子選手権の出場名簿</a>では${esc(d.laterGrade)}と記載されています。降段したと断定するものではなく、両大会の記載を原文のまま保存しています。人物IDは同一人物として管理し、別人と確認できた場合は記録を切り離します。</p>`;
  };
  const profileRegistrationRow=(p,latestEvent)=>{
    const snapshots=[];
    if(latestEvent){
      const pref=prefectureFor(latestEvent,p);
      if(pref && pref!=='未確認')snapshots.push({pref,note:`※${String(latestEvent.year).slice(-2)}全日本`,date:latestEvent.id==='m74'||latestEvent.id==='w65'?'2026-11-03':latestEvent.year===2020?'2021-03-14':`${latestEvent.year}-01-01`,type:'championship'});
    }
    for(const r of (typeof todo2026==='undefined'?[]:todo2026.roster)){
      if(r.playerId!==p.id || !String(r.identityStatus||'').startsWith('A-'))continue;
      snapshots.push({pref:todoPrefFull(r.prefecture),note:`※${String(r.eventDate.slice(2,4))}都道府県対抗`,date:r.eventDate,type:'team'});
    }
    for(const r of (todoWomenLinkedProfiles[p.id]?.entries||[])){
      if(r.year===2026)continue; // the 2026 base roster was added above
      snapshots.push({pref:todoPrefFull(r.prefecture),note:`※${String(r.year).slice(-2)}都道府県対抗`,date:r.eventDate||String(r.year),type:'team'});
    }
    if(!snapshots.length && p.pref && p.pref!=='未確認')snapshots.push({pref:p.pref,note:'',date:'',type:'unknown'});
    snapshots.sort((a,b)=>b.date.localeCompare(a.date));
    const byPref=new Map();
    for(const snap of snapshots){
      const notes=byPref.get(snap.pref)||[];
      if(snap.note && !notes.includes(snap.note))notes.push(snap.note);
      byPref.set(snap.pref,notes);
    }
    const content=[...byPref].map(([pref,notes])=>`<div class="profile-pref-entry"><span class="profile-fact-current">${esc(pref)}</span>${notes.map(note=>`<span class="profile-fact-asof">${esc(note)}</span>`).join('')}</div>`).join('');
    const caution=snapshots.some(s=>s.type==='team')?'<span class="profile-pref-caution">都道府県対抗は大会の代表県であり、剣連への二重登録を示すものではありません。</span>':'';
    return `<div>登録</div><div class="profile-fact-cell profile-pref-cell">${content||'<span class="muted">未確認</span>'}${caution}</div>`;
  };


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
    return `<div class="table-wrap event-result-wrap"><table class="event-results-table"><thead><tr><th>選手</th><th>代表都道府県・称号段位（大会当時）</th><th>到達成績</th><th class="result-action-col">試合結果</th></tr></thead><tbody>${rs.map(r=>{
      const p=findP(r.player);
      if(!p)return '';
      const hasMatches=fullOfficialEvent(e)?fullMatchesFor(e).some(m=>m.left===p.id||m.right===p.id):(oldByPlayer.get(p.id)||[]).some(m=>m.event===e.id);
      const detailsId=`event-detail-${e.id}-${p.id}`;
      const control=hasMatches?`<button type="button" class="event-row-toggle" data-toggle-event-player="${esc(p.id)}" data-toggle-event="${esc(e.id)}" aria-expanded="false" aria-controls="${esc(detailsId)}" aria-label="${esc(p.name)}の試合結果を開く" title="${esc(p.name)}の試合結果を開く"><span aria-hidden="true" class="chevron">▼</span></button>`:'<span class="muted small" title="試合別明細未収録">—</span>';
      return `<tr class="event-player-row"><td>${pLink(p)}${norm(archivedNameFor(e,p))!==norm(p.name)?`<span class="row-sub">当時の掲載名：${esc(archivedNameFor(e,p))}</span>`:''}</td><td>${esc(prefectureFor(e,p))}<div class="row-sub event-grade-caption">${eventGradeFor(e.id,p.id)?'当時の称号・段位：'+esc(eventGradeFor(e.id,p.id)):'当時の段位：未確認'}</div></td><td><strong class="result ${r.finish==='優勝'?'win':''}">${esc(r.finish)}</strong>${r.verified==='B'||(r.kind==='current'&&r.verified!=='A')?'<span class="result-b-note">※ B：公式根拠確認保留</span>':''}</td><td class="result-action-col">${control}</td></tr><tr class="event-player-detail" id="${esc(detailsId)}" hidden><td colspan="4"></td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function renderDialogSummary(e){
    const rs=sortedResults(e.id),current=fullOfficialEvent(e);
    const types=[...new Set(rs.map(r=>r.finish))].sort((a,b)=>outcomeIndex(a)-outcomeIndex(b));
    const options=types.map(t=>`<option value="${esc(t)}">${esc(t)}（${rs.filter(r=>r.finish===t).length}名）</option>`).join('');
    return `<div class="result-dialog-tools"><div class="field search"><label for="resultNameFilter">この大会の選手を探す</label><input class="control" id="resultNameFilter" type="search" placeholder="選手名・ふりがな・都道府県・所属"></div><div class="field"><label for="resultFinishFilter">到達成績</label><select class="control" id="resultFinishFilter"><option value="">すべての成績</option>${options}</select></div></div>
      <p class="result-dialog-caption"><span id="resultShownCount">${rs.length}名を表示</span> / 登録${rs.length}名。${current?'2015年大会〜2026年大会は全64名の最終成績・勝敗を掲載しています。':'旧大会は2026年出場者の記録のみ。全出場者の一覧ではありません。'}</p>
      <div class="table-wrap"><table class="result-dialog-table"><thead><tr><th>成績</th><th>選手</th><th>代表都道府県・称号段位（大会当時）</th><th>その大会の対戦</th></tr></thead><tbody>${rs.map(r=>{const p=findP(r.player),hasMatches=fullOfficialEvent(e)?fullMatchesFor(e).some(m=>m.left===p.id||m.right===p.id):(oldByPlayer.get(p.id)||[]).some(m=>m.event===e.id);return `<tr data-result-name="${esc([p.name,p.reading,p.pref,p.aff].join(' '))}" data-result-finish="${esc(r.finish)}"><td><strong class="result ${r.finish==='優勝'?'win':''}">${esc(r.finish)}</strong>${r.verified==='B'||(r.kind==='current'&&r.verified!=='A')?'<span class="result-b-note">※ B：公式根拠確認保留</span>':''}</td><td>${pLink(p)}</td><td>${esc(prefectureFor(e,p))}<div class="row-sub event-grade-caption">${eventGradeFor(e.id,p.id)?'当時の称号・段位：'+esc(eventGradeFor(e.id,p.id)):'当時の段位：未確認'}</div></td><td>${hasMatches?`<button type="button" class="mini-action" data-open-player-matches="${esc(p.id)}">試合を見る →</button>`:'<span class="muted small">明細未収録</span>'}</td></tr>`}).join('')}</tbody></table></div><p class="result-no-matches" id="resultNoMatches" hidden>該当する選手はいません。</p>`;
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
    {date:"2026-11-22",tag:"AOKC・第132組訂正",title:"高橋萌子の個人2回戦を不戦勝へ訂正",desc:"大会公式配信の映像確認により2回戦の○・○は技未確認2本ではなく不戦勝。日本個人戦は実戦18試合と不戦勝1件に分離し、実戦勝利数・取得本数・試合数ランキングから不戦勝を除外。"},
    {date:"2026-11-22",tag:"AOKC・第132組",title:"2026年AOKCの日本個人戦・男女団体戦を公式Tonamel記録で補完",desc:"日本個人戦19試合を照合、団体戦は男女各4国別対戦を確定。団体40オーダー枠＝実戦38件（36勝2分）＋不戦勝2枠。AOKC限定の個人・個人団体合算・団体ランキング試験版を追加。"},
    {date:"2026-11-22",tag:"AOKC・第131組",title:"2026年AOKC団体決勝を男女各1国別対戦で追加",desc:"全剣連公式結果・公式配信動画により日本対韓国の団体決勝2試合をA確定。女子は国別4勝0敗・取得本数6-1。既存の団体入賞8枠を重複登録せず、日本代表18名の登録と団体本人実戦は引き続き分離。準決勝の対戦と本人実戦は確認待ち。"},
{date:"2026-11-22",tag:"AOKC・第129組",title:"2026年AOKC男女決勝の取得技を公式動画題名で確定",desc:"男子は大平翔士が延長で小手一本、女子は高橋萌子が小手一本勝ち。収録済み個人戦8試合の得点記録が揃いました。未収録の準々決勝・女子準決勝は公式原本での直接確認を待ち、敢闘賞をベスト8敗者とみなさない運用に修正。"},    {date:'2026-11-21',tag:'第99組・2006WKC 2巡終了',title:'2006年の個人戦17試合をFIK公式結果で追加',desc:'女子4選手の1回戦～準々決勝12試合、男子3選手の序盤戦5試合をA確定。個人戦は合計23試合。取得技・得点と団体本人実戦は未確認。2巡終了、残件はまとめ総点検に回す。'},
    {date:'2026-11-21',tag:'第98組・2006WKC 1巡目',title:'2006年第13回WKCの公式入賞16枠・団体7対戦・個人6試合を追加',desc:'FIK公式4種目の結果表で男女入賞各8枠、決勝トーナメントでの日本団体男子3試合・女子4試合の勝敗、日本選手個人7名と準決勝・決勝6試合をA確定。取得技・本数と団体本人実戦は未確認。以後2巡＋まとめ総点検方式。'},
    {date:'2026-11-21',tag:'第95組・2009WKC団体1巡目',title:'男子団体決勝の3人分の本人実戦を記録映像から追加',desc:'剣道日本の試合記録映像で男子決勝の先鋒正代・次鋒木和田・中堅内村と米国側の対戦相手を確認。全剣連公式「剣窓」の先鋒～中堅3連勝と照合。既存6枠から9枠へ増加。取得本数・技、女子団体の本人実戦は保留。'},
    {date:'2026-11-21',tag:'第94組・2009WKC個人3巡終了',title:'古澤庸臣の2試合を追加、女子決勝Tの回戦誤記6件を修正',desc:'FIK公式2009年個人結果表を直接再確認。古澤庸臣の2回戦オランダ戦・3回戦米国戦を勝敗A追加して計29試合。女子の1・2回戦6試合は試合番号に合わせ回戦を訂正。個人技未確認28試合、延長・未収録予選は3巡終了につき後回し。団体の未確認本人実戦は別管理。'},
    {date:'2026-11-21',tag:'第92組・2009WKC初回追加',title:'2009年第14回WKCの入賞16枠・日本団体8対戦・個人5試合を初収録',desc:'FIK公式4種目のトーナメント表と全剣連公式「剣窓」2009年10月号を照合し、個人出場8名、男女団体の決勝T勝数、男子団体韓国準決勝5人の実戦と決勝寺本大将の面・小手をA確認。未収録の技・団体登録は保留。'},
    {date:'2026-11-21',tag:'第93組・2009WKC個人2巡目',title:'FIK公式男女トーナメント表から個人戦22試合追加・女子決勝の面を確定',desc:'FIK公式表から男女決勝T19試合、全剣連公式報告とFIK予選組み合わせから予選3試合をA追加。2009年個人戦は27試合、取得技確定1試合。団体は新しい個人実戦の一次資料が見つからず既存6枠を維持。3巡目で残りを再確認する。'},
    {date:'2026-11-21',tag:'第91組・2012WKC個人3巡終了',title:'女子個人１回戦表記を訂正・２回戦追加／男子団体決勝4人の勝敗A',desc:'FIK公式図面から正代小百合のM.KOMAKI戦を１回戦に修正し、C.LIM戦を２回戦として追加。全剣連公式「剣窓」2012年7月号で男子団体決勝の内村・正代勝利、木和田敗戦、高鍋引き分けを確定。個人戦は３巡終了し残りの未確定を後回し。'},
    {date:'2026-11-21',tag:'第90組・2012年WKC個人・団体',title:'2012年WKCの決勝T一部12試合と男子団体決勝出場5人を追加',desc:'FIK公式結果表で男女個人戦の序盤・準々決勝12試合を追加。全剣連公式動画から男子個人5試合の取得技を確認（新規2・既存3）。男子団体決勝は5人の本人実戦・出場順のみA確定し、個人別得点は保留。'},
    {date:'2026-11-21',tag:'第88組・WKC団体追加／3巡保留',title:'2015年WKC団体本人実戦25枠追加・女子2回戦の対戦国訂正',desc:'全剣連公式動画から男子ハワイ・ブラジル、女子フランス・チリ・ベルギーの5国別対戦25人枠を追加。FIK公式表から女子2回戦の相手をタイからシンガポールへ訂正。個人戦取得技未確認17試合は3巡調査終了で一時保留。'},

    {date:'2026-11-21',tag:'第86組・WKC予選・取得技',title:'2015年WKC予選2試合追加と既存6試合の取得技確定',desc:'全剣連公式YouTubeの各試合結果説明文から、竹ノ内佑也・松本弥月の予選2試合を追加。村瀬諒の決勝T1回戦と女子5試合の取得技もA確認。2015年掲載42試合のうち25試合で取得技を掲載。残りは未確認のまま保持。'},
{date:'2026-11-21',tag:'第80組・ランキングの0件非表示',title:'各ランキングで集計値1以上の選手だけを表示',desc:'勝利・出場・優勝・決勝進出・面・小手・胴・突きの8項目と男子・女子・男女混合の全24表示で、0の選手を除外。1以上の記録値・同率同順位・集計対象期間は不変。'},{date:'2026-11-21',tag:'第67組・同順位と所属資料照合',title:'ランキング同率順位と最終出場大会の職業・勤務先',desc:'出場回数・勝利・優勝・決勝進出・取得技のランキングを同率同順位（1・1・3方式）へ変更。既存の選手ID・試合・集計値は不変。全剣連公式プロフィールで最後の選手権出場時の所属を確認した25名を空欄から補完し、年度を注記。未確認者は推測せず保留。'},{date:'2026-11-21',tag:'第65組・大会当時の段位と氏名表示',title:'年別段位の公式照合と姓名の半角スペース統一',desc:'2023〜2025年の男女各64名の当時段位を全剣連公式出場選手一覧から追加、2012・2013年女子各64名の保存済み公式名簿の当時段位も反映。2026年の128枠は維持。名鑑999名と試合結果の姓名表示を姓＋半角スペース＋名に統一し、原票・選手IDは変更なし。根拠不足の年度は未確認のまま。'},{date:'2026-11-21',tag:'第64組・選手プロフィール改修',title:'選手ページの成績・大会出場回数・年度別展開を整理',desc:'最高成績を全年度から算出、通算勝利・優勝は大会名と対象開始年を明記。2026年の男女128選手は全剣連公式プログラムの出場回数へ置換（サイト集計値との差異を補正）。過年度の公式回数は未確認としサイト収録数を代用しない。最終出場大会の所属都道府県と段位を表示し、年度・回次をクリックして試合結果を展開。検証状況の説明パネルを削除。'},{date:'2026-11-20',tag:'第63組・選手名鑑の表示改善',title:'五十音の行内ジャンプと大会当時の段位表示へ統一',desc:'選手名鑑の各行に1文字単位のジャンプを追加。名鑑カードと選手基本プロフィールの固定段位・出場回数を削除。段位は2026年公式登録128名の大会別スナップショットを使用し、過去年は同時点根拠のないものを未確認扱いに変更。国内成績・試合・選手IDに変更なし。'},{date:'2026-11-20',tag:'第62組・旧姓重複登録点検',title:'7組の旧姓・登録名変更を同一選手IDに統合',desc:'全1,006名と年別名簿を照合し、旧姓を直接明記する資料3組と公式プロフィール経年比較で確定した4組を統合。登録選手999名、全1,984成績行・全1,953試合は維持。旧名・読み検索と過去名義表示、旧ID互換を追加。' },{date:'2026-11-20',tag:'第41組・出典範囲監査',title:'31大会の公式URLを照合し、3大会の試合別根拠の制約を明示',desc:'28大会で個別試合結果表の実データ掲載を確認。2014年男子は旧公式の試合結果表が空欄、2026年男女は取得した大会本文で個別試合表を直接確認できないため、それぞれ大会ページ・結果ダイアログに出典範囲の注記を追加。6試合の標本照合は一致。過去の試合A/B・勝敗・技・延長・ランキングは変更なし。'},{date:'2026-11-20',tag:'第40組・技B保留表示と集計統一',title:'公式資料で取得技が競合する2試合を保留し、技ランキングの集計処理を修正',desc:'2014年男子第55試合と2026年女子準決勝第62試合の技種は、勝敗・得点と分けてB保留で表示。技ランキング・選手比較から未確定技を除外。元の公式資料の表記とURLは調査用に保持し、勝敗・得点・延長・登録選手・試合数を変更しない。'},{date:"2026-11-20",tag:"第39組・公開前棚卸し",title:"試合数・公開表示・出典未確認の棚卸しを実施",desc:"31大会・1,953試合の構造を再計算。2026年延長あり14／なし37／未確認75を維持。2011年男子参考成績64件を含む全1,984件のホーム集計表示を修正。2014年男子1試合と2026年女子準決勝1試合の技の資料競合を未解決事項として保存。過去の更新履歴にある『未実施』等は当時の状況。"},{date:'2026-11-20',tag:'2026年延長一次資料の再確認',title:'小倉進志―星子啓太の延長を県剣連公式記事で確認（第35組）',desc:'和歌山県剣道連盟の2026年11月4日付の公式大会記事で同試合が延長に入ったことを明記。男子1試合のみA確定へ戻し、2026年未確認は75試合。2012年と2014年の選手別画面に残った古い説明を修正。プレスリリースと個別試合動画の技表記差を内部監査に分離。'},{"date":"2026-11-20","tag":"出典監査・公開前点検","title":"2026年速報23件を一次資料の直接確認待ちに戻し、ランキングと出典表示を再点検（第34組）","desc":"第33組でA扱いした速報23件のうち16件は保存URLが無関係な検索ページ、7件は公式X原投稿に直接アクセスできないため、延長判定をB保留へ再分類。試合結果・取得技・選手ID・対象大会は変更なし。2026年の延長未確認76試合、2014年男子2試合。"},{date:'2026-11-20',tag:'2012年からランキング統一',title:'男子2012〜2014年の2巡目照合と技訂正・男女共通集計開始年を2012年へ（第27組）',desc:'男子2012年・2013年の全126試合を公式詳細結果表と再照合し得点・反則に不一致0。2014年63試合の公式映像掲載表記を照合し、3回戦第55試合・高橋秀人の得点を小手2本へ修正。勝敗・技について189試合整合。2011年男子は参考掲載だがランキング対象外。2012〜2026年の男女各15大会、男女混合は同じ2012〜2026年で集計。延長なしの根拠未確認分・2014年の反則未確認はそのまま。'},{date:'2026-11-19',tag:'過去大会5年区切り総点検',title:'2015年大会の男女126試合を追加・2015〜2019年を統合点検（v2.8）',desc:'男子第63回・女子第54回の男女128名・126試合を全剣連公式試合表と出場者名簿から収録。旧2015年部分記録4件と一致して置換。新規55名を登録。改姓した阿部美洸・近藤美洸の人物IDを統合。ふりがなと独立した原票2巡目照合は後日。'},{date:'2026-11-19',tag:'過去大会の全試合収録',title:'2016年大会・男女128名126試合を追加（v2.8）',desc:'男子第64回・女子第55回を全剣連公式試合表・出場者名簿から収録。既存2016年部分記録10件と全件一致し、128名の成績へ置換。新規51名・既存77名を統合。ふりがなは未確認のまま保留。2017年試合IDの年号衝突も修正。独立2巡目照合は後日の総点検で実施。'},{date:'2026-11-19',tag:'過去大会の全試合収録',title:'2017年大会・男女128名126試合を追加（v2.6）',desc:'男子第65回・女子第56回の全剣連公式記録を収録。既存2017年部分記録16件と全件一致し、128名の成績に置換。新規57名・既存71名を統合。ふりがなは未確認のまま保留し、独立2巡目の照合を後日実施。2015年収録後に5年分の総点検を予定。'},{date:'2026-11-19',tag:'過去大会の全試合収録',title:'2018年大会・男女128名126試合を追加（v2.5）',desc:'男子第66回・女子第57回の全剣連公式結果を収録。既存2018年部分記録13件と全件一致し、128名の成績に置換。新規55名、既存73名の選手IDへ統合。ふりがなは未確認のまま保留、独立2巡目照合は今後実施。'},{date:'2026-11-19',tag:'過去大会の全試合収録',title:'2019年大会・男女128名126試合を追加（v2.4）',desc:'男子第67回・女子第58回の全剣連公式表を転記。2019年部分記録17件を128件に置き換え、既存選手64名に統合し新規64名を追加（うち旧姓名の同一人物2件を整理）。勝者の勝ち上がりと旧成績17件を照合済み。新規64名の読みと試合表の独立2巡目照合は継続。'}, {date:'2026-11-19',tag:'記録修正・独立原票照合',title:'2026年大会男女126試合の技・反則を照合（v2.4）',desc:'第74回男子・第65回女子の全126試合で左右の技・反則を公式表と独立照合。男子1回戦の内堀聡一郎の反則▲の欠落1件を修正、再照合不一致0件。2026年の公式表では延長表示が確認できないため別途保留。'},{date:'2026-11-19',tag:'独立原票照合',title:'2025年大会男女126試合を再照合（v2.2）',desc:'第73回男子・第64回女子の全126試合について、全剣連公式表と左右技・反則▲・延長を独立照合。不一致0件、修正0件。2020〜2025年の累計756試合を独立照合済み。2026年は引き続き独立点検対象。'},{date:'2026-11-19',tag:'記録修正・二重照合',title:'2024年大会男女126試合を再照合（v2.1）',desc:'男子第72回・女子第63回の全剣連公式表を独立転記して126試合を点検。右側選手の技の表示順6件（男子2・女子4）を修正。延長・左右の反則▲・勝敗の変更なし。再照合差分0件。2020〜2024年累計630試合検査済み。'},{date:'2026-11-19',tag:'記録修正・二重照合',title:'2023年大会男女126試合を再照合（v2.0）',desc:'男子第71回・女子第62回の全剣連公式表を独立転記し、全126試合を点検。右側選手の技の表示順7件（男子6・女子1）を修正。延長、反則▲、勝敗の変更なし。再照合差分0件。2020〜2023年の累計504試合を検査済み。'},{date:'2026-11-19',tag:'記録修正・二重照合',title:'2022年大会男女126試合を再照合（v1.9）',desc:'男子第70回・女子第61回の全剣連公式トーナメント表を独立転記して全126試合を点検。延長記録の欠落2件、右側選手の技の表記順6件を修正。再照合後は不一致0件。2020〜2022年の累計378試合を確認、2023〜2026年は504試合が未実施。'},{date:'2026-11-19',tag:'独立原票照合',title:'2021年大会男女126試合を再照合（v1.8）',desc:'男子第69回・女子第60回の公式トーナメント表を独立転記。左右技、反則▲、延長について126試合すべて一致。2020年大会と合わせて252試合を検査済み。残り630試合は2022〜2026年大会。'},{date:'2026-11-19',tag:'独立原票照合',title:'2020年大会男女126試合の技・反則・延長を二重照合（v1.7）',desc:'全剣連公式大会の試合表をあらためて独立転記し、男子63試合・女子63試合の取得技、反則▲、延長を照合。不一致0件。2021〜2026年756試合は今後の対象。'},{date:'2026-11-19',tag:'読みがな補完',title:'2020年大会新規選手75名の公式読みを追加（v1.7）',desc:'第68回男子39名・第59回女子36名のふりがなを全剣連公式プロフィールで確認し、531名全員を五十音索引へ登録。試合・成績の数値は変更なし。2020年男女126試合を独立再照合済み。残り756試合は継続。'},{date:'2026-11-19',tag:'大会記録追加',title:'2020年大会（2021年3月延期開催）の男女全試合を追加',desc:'男子第68回・女子第59回の128名・126試合を全剣連公式結果から収録。2021年大会とは別大会として管理。従来の2020年部分記録13件を置換し二重集計を防止。新規選手のふりがなは公式資料に基づき後日補完済み。'},{date:'2026-11-19',tag:'大会記録追加',title:'2021年度全日本剣道選手権・全日本女子剣道選手権の全試合を追加',desc:'第69回男子・第60回女子の128名・126試合を全剣連公式結果からA確定で登録。56名を既存選手へ紐付け、72名を新規追加。2021年度の旧部分記録22件を統合し、重複を除去。72名の読みも全剣連公式から確認済み。2020年度延期大会は別大会として保持。'},{date:'2026-11-19',tag:'大会記録追加',title:'2022年全日本選手権・全日本女子選手権の全試合を追加',desc:'第70回男子・第61回女子の出場者128名、公式126試合を追加。新規54名・既存74名に統合。旧姓や登録都道府県を年度別に保存し、五十音索引・▼展開・技別ランキングの集計に反映。'},{date:'2026-11-19',tag:'大会記録追加',title:'2023年全日本選手権・全日本女子選手権の全試合を追加',desc:'第71回男子・第62回女子を各64名・63試合で掲載。新規53名・既存75名を照合、公式の読みを新規53名全員に登録。2024〜2026年の内容は維持したまま、五十音索引・大会一覧の▼試合展開・ランキング・選手比較へ反映。'},{date:'2026-11-19',tag:'操作改善',title:'選手名鑑を五十音順に並べ、行別ジャンプを追加',desc:'氏名の公式読みを使って、あ・か・さ・た・な・は・ま・や・ら・わ行で選手を整理。索引ボタンから各行にジャンプし、検索や男女・都道府県絞り込み後も索引件数が更新されます。読み未確認は推測せず別枠。'},{date:'2026-11-19',tag:'表示改善',title:'試合結果の本数・技を選手視点で統一',desc:'▼で展開する2026年の試合結果と選手詳細ページで、本数は常に本人 - 相手の順とし、取得技を本数の直下に括弧付きで表示。反則▲は本人側なら括弧の左、相手側なら右に仮配置。元データは変更なし。'},{date:'2026-11-19',tag:'操作改善',title:'大会の個人成績一覧を常時表示し、▼で試合結果を行内展開',desc:'v0.7形式の大会別成績表を復元。各選手の右端▼を押すと、すぐ下にその大会の対戦・勝敗・得点技が表示され、もう一度押すと閉じます。過去大会にも対応。都道府県47件の北から南への順番も維持。データ更新なし。'},{date:'2026-11-19',tag:'操作改善',title:'都道府県検索の北から南への固定順／結果一覧をワンクリック表示',desc:'代表都道府県を北海道から沖縄県の47都道府県順に統一。大会一覧と大会詳細に結果ダイアログを追加し、選手別の対戦も同じ画面で確認可能に。戦績データはv0.7のまま。'},...updates];
  // Newest verified milestones first. Earlier entries preserve the chronology, not the current policy.
  const visibleUpdates=[
    {date:"2026-11-25",tag:"第401組・全国警察画像復元",title:"2002〜2010年の全国警察公式結果図を追加",desc:"Workで取得した18画像から222試合・240到達成績を復元。勝敗と確認技を収録し、最終本数・反則・延長・不戦勝は未確認のまま管理。全日本選手権の集計には加算しない。"},
    {date:"2026-11-25",tag:"第400組・人物照合",title:"大会横断の人物IDを整理",desc:"公式名簿・剣歴を照合し、重複6組を統合。全国警察の森山加世・田中美妃・坂本秀樹を既存プロフィールに接続。旧IDは転送し、当時の記録・氏名・得点を維持。"},
    {date:'2026-11-25',tag:'第399組・全国警察総点検',title:'全国警察剣道選手権大会の記録を追加',desc:'2009〜2026年の30大会区分、個人246試合（取得技B2、延長未確認）。2009・2010年は優勝者のみ。人物ID保留は未統合。全日本選手権のランキングには加算せず、確認済みの大会当時の氏名表記を検索に反映。'},
    {date:'2026-11-23',tag:'第261組・東西対抗',title:'人物IDの根拠付き紐付けを19枠追加',desc:'2021年を中心に当時の全剣連公式名簿（氏名・登録県・年齢）と他年公式記録を照合。19枠を選手ページへ追加し、未確定の同姓同名・登録県相違は保留。'},
    {date:'2026-11-23',tag:'第260組・東西対抗',title:'公式名簿で人物ID17枠を追加照合',desc:'2022年大会を中心に、所属県・年齢と全日本選手権・確定済み東西対抗を照合。根拠確認済み17枠だけ選手ページへ紐付け。元の試合結果・選手権ランキングは変更なし。'},
    {date:'2026-11-23',tag:'第259組・東西対抗',title:'2025〜2026年の人物同定・新規9名の複数年度プロフィール',desc:'全剣連公式当時名簿の登録県・年齢を過年度一次記録と照合し、確定できた本人実戦だけを選手ページへ追加。選手権ランキングは変更しない。'},
    {date:'2026-11-23',tag:'第258組・東西対抗',title:'2021〜2024年・人物名寄せと複数年度履歴の充実',desc:'全剣連公式東西名簿の県と年齢推移を2年度以上で照合。既存9人のIDに18枠、新規複数年度13人に26枠、既存複数年度5人に10枠を追加。推測による通算ランキング加算は行わない。'},
    {date:'2026-11-23',tag:'第257組・東西対抗',title:'2017〜2019年の人物照合と複数年度プロフィールの拡充',desc:'2017年HTML公式名簿と2018・2019年PDF公式名簿の県・年齢を独立した大会名簿と照合。確定できた記録のみ選手IDへ連結し、新規20人は2017・2019年の2年度に限定して統合。'},
    {date:'2026-11-23',tag:'第256組・人物照合',title:'東西対抗の既存選手56枠を照合、12人の複数年度プロフィールを新設',desc:'2012〜2016年の公式組合せに掲載された当時の都道府県・年齢等を独立した大会公式名簿と照合。56枠を既存IDへ連結し、3年度連続の年齢推移を確認できた12人（36枠）を新設。保留案件は未連結で保持。'},
    {date:'2026-11-23',tag:'第255組・東西対抗選手名鑑',title:'東西対抗のみ実戦確認の190人を名鑑へ追加',desc:'2012〜2026年の全剣連公式対戦記録を根拠に、既存IDと未照合・今回の資料内で単年度のみ確認された190人に限定して独立プロフィールを新設。対戦結果からプロフィールへの往復リンクを追加。複数年度で同名の記録は一律保留。全日本選手権ランキングと選手比較は変更せず、読み・所属・段位も推測しない。'},
    {date:'2026-11-21',tag:'第95組・2009WKC団体1巡目',title:'男子団体決勝の先鋒・次鋒・中堅3枠を確定',desc:'剣道日本の原試合映像と全剣連公式「剣窓」を照合し、2009年男子団体決勝の正代・木和田・内村の対戦相手と本人勝敗をA確定。本人の技・本数は未確認。団体本人実戦2009年6→9枠。'},
    {date:'2026-11-21',tag:'第94組・2009WKC個人3巡終了',title:'古澤庸臣の個人2試合追加・女子6試合の回戦修正',desc:'FIK公式表から男子2試合をA追加、女子の決勝T回戦表示を6件訂正。2009年個人は29試合（取得技A1試合）。得点技未確認28試合と未掲載予選は3巡終了のため保留し、団体の本人実戦は別調査に分離。'},
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
  <div class="stats">${statCard('登録選手',players.length+3501,'名','全日本・都道府県対抗・東西対抗・実業団等')}${statCard('全日本選手権・開催回',events.length,'件','男女・年度別')}${statCard('収録大会別成績',records.length,'件','2011年参考記録を含む')}${statCard('収録試合',allScopedMatches.length,'件','2011年参考試合を含む')}</div>
  <div class="two-col"><section><div class="section-head"><h3 class="section-title">記録を探す</h3></div><div class="quick-grid"><a class="quick" href="#/players"><span class="qicon">♙</span><span><strong>選手名鑑</strong><span>名前・読み・所属・出身校</span></span></a><a class="quick" href="#/events"><span class="qicon">♜</span><span><strong>大会データ</strong><span>開催年度・大会回次</span></span></a><a class="quick" href="#/japan"><span class="qicon">◎</span><span><strong>日本代表</strong><span>世界選手権・アジア・オセアニア選手権</span></span></a><a class="quick" href="#/rankings"><span class="qicon">▥</span><span><strong>ランキング</strong><span>集計範囲を明示</span></span></a><a class="quick" href="#/compare"><span class="qicon">⇄</span><span><strong>選手比較</strong><span>2人の記録を比較</span></span></a></div></section>
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
  const JP=window.KENDO_JITSUGYODAN_PROFILE;
  const jitsuExists=id=>playersById.has(id)||JP.has(id);
  let unknownLimit=200;
  function directoryPlayerCard(p){if(p.jitsugyodanOnly)return `<article class="person-card" data-player="${esc(p.id)}"><div class="person-top"><div class="avatar">${esc(p.name.slice(-1))}</div><div><a href="#/player/${encodeURIComponent(p.id)}" class="person-name data-link">${esc(p.name)}</a><div class="person-meta">実業団大会 / ${esc(p.reading||'読み未確認')}</div></div></div><dl class="mini-dl"><dt>登録チーム</dt><dd>${asText(p.aff)}${p.affAsOfYear?`（${p.affAsOfYear}年大会）`:""}</dd></dl><div class="card-actions"><a href="#/player/${encodeURIComponent(p.id)}" class="textbtn">プロフィールを見る →</a></div></article>`;return `<article class="person-card" data-player="${esc(p.id)}"><div class="person-top"><div class="avatar ${p.gender==='女子'?'f':''}">${esc(p.name.slice(-1))}</div><div><a href="#/player/${encodeURIComponent(p.id)}" class="person-name data-link">${esc(p.name)}</a>${readingLabel(p)}<div class="person-meta">${esc(p.gender)} / ${esc(p.pref)}${p.tozaiOnly?`<span class="tozai-only-badge">${p.tozaiMultiYear?`東西対抗${esc(p.tozaiYears.join("･"))}年・人物照合済み`:`東西対抗${esc(p.tozaiYear)}年・本人実戦確認`}</span>`:''}</div></div></div><dl class="mini-dl"><dt>所属</dt><dd>${asText(p.aff)}${p.policeTeamOnly?`（${p.affAsOfYear}年大会時点）`:""}</dd>${educationCardRow(p,'high')}${educationCardRow(p,'univ')}</dl><div class="card-actions"><a href="#/player/${p.id}" class="textbtn">プロフィールを見る →</a>${p.tozaiOnly&&!window.KENDO_8DAN_UI.has(p.id)?'':`<button type="button" class="textbtn" data-compare-add="${p.id}">比較に追加 ＋</button>`}</div></article>`;}
  function playerCards(){
    const q=normKana(playerQuery);
    const directory=[...players,...JP.newPlayers()];
    const shown=directory.filter(p=>(genderFilter==='すべて'||p.gender===genderFilter)&&(prefFilter==='すべて'||p.pref===prefFilter)&&normKana([p.name,...(p.nameAliases||[]),p.reading,...(p.readingAliases||[]),p.aff,p.high,p.univ,p.enrolledHigh,p.enrolledUniversity,p.pref,...JP.searchExtra(p.id)].join(' ')).includes(q));
    const groups=new Map([...kanaGroups.map(([k])=>[k,[]]),['未',[]]]);
    for(const p of shown)groups.get(kanaHead(p)).push(p);
    for(const values of groups.values())values.sort(kanaCompare);
    document.getElementById('playerCount').textContent=`${shown.length}名を表示 / 全${directory.length}名（読み確認済み ${readingCount+JP.newPlayers().filter(p=>p.reading).length}名）`;
    const index=document.getElementById('kanaIndex');
    index.innerHTML=`<span class="kana-index-title">五十音から探す</span><div class="kana-index-buttons">${[...kanaGroups.map(([k])=>k),'未'].map(k=>{const n=groups.get(k).length;return `<button type="button" class="kana-jump" data-jump-kana="${k}" ${!n?'disabled':''} aria-label="${k==='未'?'読み確認中':k+'行'}へ移動（${n}名）">${k==='未'?'未確認':k}<span class="kana-jump-count">${n}</span></button>`;}).join('')}</div>`;
    document.getElementById('playerResults').innerHTML=shown.length?[...groups.entries()].filter(([,ps])=>ps.length).map(([key,ps])=>{
      const groupLetters=kanaGroups.find(([k])=>k===key)?.[1]||'';
      const subgroups=new Map([...groupLetters].map(c=>[c,[]]));
      if(key!=='未')for(const p of ps)subgroups.get(kanaInitial(p)).push(p);
      const subButtons=key==='未'?'':`<nav class="kana-sub-index" aria-label="${key}行の文字別ジャンプ">${[...subgroups.entries()].map(([c,arr])=>`<button type="button" class="kana-sub-jump" data-jump-sub="${key}-${c}" ${arr.length?'':'disabled'} aria-label="${c}から始まる選手${arr.length}名へ移動">${c}<span class="kana-sub-count">${arr.length}</span></button>`).join('')}</nav>`;
      const content=key==='未'?`<p class="small muted kana-pending-note">公式ふりがなを未確認の選手です。読みを推測して別の行に入れないようにしています。</p><div class="grid-cards">${ps.slice(0,unknownLimit).map(directoryPlayerCard).join('')}</div>${ps.length>unknownLimit?`<button class="control jitsu-more" type="button" data-jitsu-more>さらに表示（${Math.min(unknownLimit,ps.length)} / ${ps.length}名表示中）</button>`:""}`:[...subgroups.entries()].filter(([,arr])=>arr.length).map(([c,arr])=>`<section class="kana-subgroup" aria-labelledby="kana-sub-${key}-${c}"><h4 class="kana-subgroup-title" id="kana-sub-${key}-${c}" tabindex="-1">${c} <span class="kana-group-count">${arr.length}名</span></h4><div class="grid-cards">${arr.map(directoryPlayerCard).join('')}</div></section>`).join('');
      return `<section class="kana-group" aria-labelledby="kana-${key}" id="section-kana-${key}"><div class="kana-group-head"><h3 id="kana-${key}" tabindex="-1">${key==='未'?'読み確認中':key+'行'} <span class="kana-group-count">${ps.length}名</span></h3>${subButtons}<button type="button" class="kana-back" data-back-kana>↑ 五十音索引へ</button></div>${content}</section>`;
    }).join(''):'<div class="empty pane">該当する選手はいません。検索条件を変更してください。</div>';
    bindCompareButtons();
  }
  function jumpDirectory(targetId){const target=document.getElementById(targetId);if(!target)return;target.scrollIntoView({behavior:'instant',block:'start'});if(target.hasAttribute('tabindex'))target.focus({preventScroll:true});}
  function renderPlayers(){const prefs=prefecturesNorthSouth;return `${verifiedBanner}${pageHeader('PLAYER DIRECTORY','選手名鑑','全日本選手権、都道府県対抗、東西対抗、全国警察個人戦・団体戦、八段優勝大会、全国実業団大会の選手記録を収録（団体戦の氏名・参加確認は本人実戦と区別、大会別の統計は分離）。公式の読みが未確認の選手は「未確認」に分類。上部の「あ・か・さ…」から各行へ移動し、各行の「か・き・く・け・こ」などから頭文字別に移動できます。')}
    <div class="toolbar"><div class="field search"><label for="playerSearch">フリーワード</label><input id="playerSearch" class="control" type="search" placeholder="例：ほしこ、ナカダ、筑波大学" value="${esc(playerQuery)}"></div><div class="field"><label for="playerGender">区分</label><select id="playerGender" class="control">${['すべて','男子','女子','未確認'].map(g=>`<option ${genderFilter===g?'selected':''}>${g}</option>`).join('')}</select></div><div class="field"><label for="prefFilter">登録・所属都道府県</label><select id="prefFilter" class="control">${['すべて',...prefs,'未確認'].map(g=>`<option ${prefFilter===g?'selected':''}>${esc(g)}</option>`).join('')}</select></div></div><div class="jitsu-directory-status small muted" id="jitsu-directory-status" role="status"></div><div class="count-line"><span id="playerCount"></span><span>登録・所属都道府県は北海道→沖縄県の順</span></div><nav id="kanaIndex" class="kana-index" aria-label="選手名鑑の五十音索引"></nav><div id="playerResults" class="kana-results"></div>`;}
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
  function todoBoutResult(b){
    return {勝:'勝ち',負:'負け',分:'引き分け'}[b.individualResult] || '未確認';
  }
  function todoBoutScore(b){
    if(b.scoreIsFullyConfirmed){
      const scored=(Array.isArray(b.scoringTechniques)?b.scoringTechniques:typeof b.scoringTechniques==='string'?[b.scoringTechniques]:[]).join('・')||'—';
      const conceded=(Array.isArray(b.concededTechniques)?b.concededTechniques:typeof b.concededTechniques==='string'?[b.concededTechniques]:[]).join('・')||'—';
      const foulScored=(b.foulAwardIppon||0);
      const foulConceded=(b.concededFoulAwardIppon||0);
      const ownFoul=foulScored?`・反則による得点${foulScored}本`:'';
      const oppFoul=foulConceded?`・反則による被得点${foulConceded}本`:'';
      return `${b.exactTotalScoredIppon}–${b.exactTotalConcededIppon}（技 ${scored}${ownFoul} ／ 被技 ${conceded}${oppFoul}）`;
    }
    return b.minExplicitlyReportedScoredIppon ? `${b.minExplicitlyReportedScoredIppon}本以上（技不明）` : '未確認';
  }
  function todoBoutSource(b){
    const label=b.officialPrimarySource===b.officialTeamResultEvidence?'全剣連公式詳細':'学校公式';
    return `<a class="data-link" href="${esc(b.officialPrimarySource)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`;
  }
  function todoBoutPlayer(name,id){
    if(!name)return '—';
    return id?`<a href="#/player/${esc(id)}">${esc(name)}</a>`:esc(name);
  }
  function todoBoutSummary(bouts){
    const sections=[['通常対戦',false],['代表戦',true]];
    return sections.map(([label,representative])=>{
      const current=bouts.filter(b=>Boolean(b.isRepresentativeBout)===representative);
      if(!current.length)return '';
      const count=result=>current.filter(b=>b.individualResult===result).length;
      const unknown=current.length-count('勝')-count('負')-count('分');
      const scored=current.reduce((total,b)=>total+(b.exactTotalScoredIppon??0),0);
      const incomplete=current.filter(b=>b.exactTotalScoredIppon==null).length;
      return `<p class="small">${label} ${current.length}試合 ／ ${count('勝')}勝${count('負')}敗${count('分')}分${unknown?`・勝敗未確認${unknown}件`:''} ／ 取得${scored}本${incomplete?`（本数未確定${incomplete}試合を除く）`:''}</p>`;
    }).join('');
  }
  // Only documented team *registrations* are shown; never add these to individual-championship rankings.
  function renderTodoWomenProgram2026(p){
    const r=todoWomenProgram2026[p.id];
    if(!r)return '';
    return `<section class="pane wide"><h3 class="section-title">2026年女子都道府県対抗・大会名簿情報</h3><p class="small muted">2026年7月12日大会時点の公式プログラム記載。現在の勤務先・在籍を意味するものではありません。</p><div class="definition">${profileRow('代表県・登録位置',todoPrefFull(r.prefecture)+'・'+r.position)}${r.school?profileRow('出身校（名簿記載）',r.school):''}${r.occupation?profileRow('職業・勤務先・在籍校（名簿記載）',r.occupation):''}${r.career?profileRow('剣歴（名簿記載・年度未特定）',r.career):''}</div>${r.career?'<p class="small muted">剣歴は公式プログラムの記載に基づくもので、個別大会の年度・実戦・ランキングには加算していません。</p>':''}<p class="small muted"><a class="data-link" href="${esc(r.source)}" target="_blank" rel="noopener noreferrer">全剣連公式大会プログラム（PDF） ↗</a> ／ 登録情報と本人実戦は別管理。</p></section>`;
  }
  function renderTodoWomenAwards(p){
    const rows=todoWomenAwards.filter(r=>!p||r.playerId===p.id).sort((a,b)=>b.year-a.year);
    if(!rows.length)return '';
    const table=rs=>`<div class="table-wrap"><table class="profile-match-table"><thead><tr><th>年度</th><th>賞</th><th>受賞者</th><th>代表県</th><th>表彰時位置</th><th>根拠</th></tr></thead><tbody>${rs.map(r=>`<tr><td>${r.year}年</td><td>${esc(r.award)}</td><td>${r.playerId&&findP(r.playerId)?`<a class="data-link" href="#/player/${encodeURIComponent(r.playerId)}">${esc(r.name)}</a>`:esc(r.name)}</td><td>${esc(r.pref)}</td><td>${esc(r.position||'—')}</td><td>${sourceLink(r.source,'全剣連公式結果')}</td></tr>`).join('')}</tbody></table></div>`;
    if(p)return `<section class="pane wide"><div class="pane-pad"><h3 class="section-title">大会別受賞歴（${rows.length}件）</h3><p class="small muted">全日本都道府県対抗女子剣道優勝大会。個人戦ランキング・本人実戦とは別集計です。</p>${table(rows)}<a class="data-link" href="#/todo2026">大会の歴代優秀選手賞へ</a></div></section>`;
    return `<section class="pane" style="margin:20px 0"><div class="pane-pad"><h3 class="section-title">女子・歴代優秀選手賞（${rows.length}件）</h3><p class="small muted">公式結果に基づく表彰記録。2009年は受賞者未確認、2020年は大会中止。人物照合未完了の2件は氏名のみ掲載。</p>${[...new Set(rows.map(r=>r.year))].map(y=>`<details class="history-group" ${y===2026?'open':''}><summary>${y}年・第${y-2008}回（${rows.filter(r=>r.year===y).length}名）</summary>${table(rows.filter(r=>r.year===y))}</details>`).join('')}</div></section>`;
  }
  function renderLinkedTodoWomenHistory(p){
    const linked=todoWomenLinkedProfiles[p.id];
    if(!linked)return '';
    const slots=[...linked.entries].sort((a,b)=>b.year-a.year);
    const cells=slots.map(r=>`<tr><td>${esc(r.year)}年</td><td>${esc(todoPrefFull(r.prefecture))}</td><td>${esc(r.position)}</td><td>${Number.isInteger(r.age)?esc(r.age)+'歳':'—'}${r.ageNote?`<div class="small muted">${esc(r.ageNote)}</div>`:''}</td><td>${esc(r.grade||'—')}</td><td><a class="data-link" href="${esc(r.source)}" target="_blank" rel="noopener noreferrer">全剣連公式名簿 ↗</a></td></tr>`).join('');
    return `<section class="pane wide"><div class="pane-pad"><h3 class="section-title">全日本都道府県対抗女子・年度別登録履歴（${slots.length}大会）</h3><p class="small muted">2009〜2026年の公式選手名簿に掲載された登録記録です。代表県は当該大会の代表県であり、剣連所属県と同じとは限りません。登録は本人実戦・勝敗・取得技を証明しません。年齢は各公式名簿の記載値で、生年月日や現在年齢は推定しません。</p><div class="table-wrap"><table class="profile-match-table"><thead><tr><th>年度</th><th>代表</th><th>登録位置</th><th>名簿年齢</th><th>称号・段位</th><th>公式根拠</th></tr></thead><tbody>${cells}</tbody></table></div></div></section>`;
  }
  // Annual team roster is distinct from actual participation in a bout.
  function renderTodo2025PlayerHistory(p){
    const bouts=todo2025.individualBouts.filter(b=>b.playerId===p.id&&b.actualBoutConfirmed);
    if(!bouts.length)return '';
    const rows=bouts.map(b=>{
      const position=b.isRepresentativeBout?`代表戦（${b.position}）`:b.position;
      const opponent=b.opponentName?todoBoutPlayer(b.opponentName,b.opponentPlayerId):'氏名未確認';
      return `<tr><td>${esc(b.round)}</td><td>${esc(position)}</td><td>${esc(b.opponentPrefecture)} ${opponent}</td><td>${todoBoutResult(b)}</td><td>${esc(todoBoutScore(b))}</td><td><a class="data-link" href="${esc(b.officialPrimarySource)}" target="_blank" rel="noopener noreferrer">参照資料 ↗</a></td></tr>`;
    }).join('');
    return `<section class="pane wide"><div class="pane-pad"><h3 class="section-title">2025年・都道府県対抗女子 本人実戦</h3><p class="small muted">公式大会結果・名簿、当時照合した記録板や所属先の報告等をもとに確認済みの本人実戦を掲載。参照資料へのリンクは個別の技・反則・動画投稿元まで単独で証明するとは限りません。動画の公式帰属と試合結果の確定は別管理です。</p>${todoBoutSummary(bouts)}<div class="table-wrap"><table class="profile-match-table"><thead><tr><th>回戦</th><th>位置</th><th>対戦相手</th><th>勝敗</th><th>本数・技</th><th>根拠</th></tr></thead><tbody>${rows}</tbody></table></div></div></section>`;
  }
  function renderTodoPlayerHistory(p){
    const rs=todo2026.roster.filter(r=>r.playerId===p.id);
    if(!rs.length)return '';
    const linked2026=Boolean(todoWomenLinkedProfiles[p.id]);
    const cells=rs.map(r=>`<tr><td>${esc(r.gender==='男子'?'第74回 男子':'第18回 女子')}</td><td>${esc(todoPrefFull(r.prefecture))}</td><td>${esc(r.order)}</td><td>${r.age!==null?esc(r.age)+'歳':'—'}</td><td>${esc(r.grade||'—')}</td><td><a class="data-link" target="_blank" rel="noopener noreferrer" href="${esc(r.source)}">公式名簿 ↗</a></td></tr>`).join('');
    const confirmed=(todo2026.individualBouts||[]).filter(b=>b.playerId===p.id);
    const confirmedRows=confirmed.map(b=>`<tr><td>${esc(b.round)}</td><td>${esc(b.position)}</td><td>${esc(b.opponentPrefecture)} ${todoBoutPlayer(b.opponentName,b.opponentPlayerId)}</td><td>${todoBoutResult(b)}</td><td>${esc(todoBoutScore(b))}</td><td>${todoBoutSource(b)}</td></tr>`).join('');
    const confirmedSection=confirmed.length?`<h4>本人実戦A確定 ${confirmed.length}試合</h4>${todoBoutSummary(confirmed)}<div class="table-wrap"><table class="profile-match-table"><thead><tr><th>回戦</th><th>位置</th><th>対戦相手</th><th>本人結果</th><th>本数・技</th><th>根拠</th></tr></thead><tbody>${confirmedRows}</tbody></table></div>`:'';
    if(linked2026)return confirmed.length?`<section class="pane wide"><div class="pane-pad"><h3 class="section-title">2026年・本人実戦記録</h3><p class="small muted">上の年度別名簿登録とは別に、本人実戦を確認できた試合だけを掲載します。</p>${confirmedSection}</div></section>`:'';
    return `<section class="pane wide"><div class="pane-pad"><h3 class="section-title">全日本都道府県対抗・2026年登録</h3><p class="small muted">下記は大会当時の公式登録です。登録だけでは個別対戦への出場・勝利・取得技を意味しません。年齢・段位は当日の資料から転記確認できた分のみ表示します。</p><div class="table-wrap"><table class="profile-match-table"><thead><tr><th>大会</th><th>代表</th><th>登録位置</th><th>年齢</th><th>称号・段位</th><th>根拠</th></tr></thead><tbody>${cells}</tbody></table></div>${confirmedSection}<p class="small muted">年齢・称号段位の基準：${rs[0].eventDate.replaceAll('-','/')}大会時点。未転記項目は「—」表示。</p></div></section>`;
  }
  function renderTodo2026(){
    const d=todo2026,orders=['先鋒','次鋒','五将','中堅','三将','副将','大将'];
    const roundOrder=['1回戦','2回戦','3回戦','準々決勝','準決勝','決勝'];
    const individual=(d.individualBouts||[]);
    const detailRows=(gender)=>individual.filter(b=>b.gender===gender).map(b=>`<tr><td>${esc(b.round)}</td><td>${todoBoutPlayer(b.name,b.playerId)}</td><td>${esc(b.position)}</td><td>${esc(b.prefecture)} ― ${esc(b.opponentPrefecture)} ${todoBoutPlayer(b.opponentName,b.opponentPlayerId)}</td><td>${todoBoutResult(b)}</td><td>${esc(todoBoutScore(b))}</td><td>${todoBoutSource(b)}</td></tr>`).join('');
    const awardText=(g)=>{const a=d.awards[g];return a?`<p class="small"><strong>入賞：</strong>${Object.entries(a.teams_ranked||{}).map(([rank,teams])=>`${esc(rank)}位 ${teams.map(esc).join('・')}`).join(' ／ ')}</p>`:'';};
    const genderBlocks=['男子','女子'].map(g=>{
      const rr=d.roster.filter(r=>r.gender===g),mm=d.teamMatches.filter(m=>m.gender===g);
      const prefs=prefecturesNorthSouth.map(p=>rr.find(r=>todoPrefFull(r.prefecture)===p)?.prefecture).filter(Boolean);
      const standings=prefs.map(pref=>{
        const people=rr.filter(r=>r.prefecture===pref).sort((a,b)=>orders.indexOf(a.order)-orders.indexOf(b.order));
        return `<details class="history-group"><summary>${esc(todoPrefFull(pref))}（登録7名）</summary><div class="table-wrap"><table class="profile-match-table"><thead><tr><th>登録順</th><th>選手</th><th>年齢</th><th>称号・段位</th></tr></thead><tbody>${people.map(r=>`<tr><td>${esc(r.order)}</td><td>${r.playerId?`<a class="data-link" href="#/player/${esc(r.playerId)}">${esc(r.name)}</a>`:`${esc(r.name)}<div class="small muted">人物ID照合保留</div>`}</td><td>${r.age!==null?esc(r.age)+'歳':'—'}</td><td>${esc(r.grade||'—')}</td></tr>`).join('')}</tbody></table></div></details>`;
      }).join('');
      const matches=roundOrder.map(round=>{
        const rows=mm.filter(m=>m.round===round);
        return `<details class="history-group"><summary>${esc(round)}（${rows.length}対戦）</summary><div class="table-wrap"><table class="profile-match-table"><thead><tr><th>対戦都道府県</th><th>勝数</th><th>本数</th><th>勝者</th><th>決着</th></tr></thead><tbody>${rows.map(m=>`<tr><td>${esc(m.team_a)} ― ${esc(m.team_b)}</td><td>${esc(m.team_a_wins)}–${esc(m.team_b_wins)}</td><td>${esc(m.team_a_points)}–${esc(m.team_b_points)}</td><td><strong>${esc(m.winner)}</strong></td><td>${esc(m.decision||'未確認')}</td></tr>`).join('')}</tbody></table></div></details>`;
      }).join('');
      const source=g==='男子'?d.meta.sources.menRoster:d.meta.sources.womenRoster;
      const resultSource=g==='男子'?d.meta.sources.menResults:d.meta.sources.womenResults;
      return `<section class="pane" style="margin:20px 0"><div class="pane-pad"><h3 class="section-title">2026年 ${g}・${g==='男子'?'第74回':'第18回'}</h3>${awardText(g)}<p class="small muted">${esc(g==='男子'?'2026/04/29':'2026/07/12')}開催。団体戦46対戦、公式登録329名。<a class="data-link" target="_blank" rel="noopener noreferrer" href="${esc(source)}">公式出場名簿 ↗</a> ／ <a class="data-link" target="_blank" rel="noopener noreferrer" href="${esc(resultSource)}">大会公式結果 ↗</a></p><h4>団体対戦結果</h4>${matches}<h4>本人実戦のA確定記録</h4><p class="small muted">本人の実戦を一次資料で確認できた記録のみ掲載。対戦相手名や未確認の技・勝敗は推測しません。登録名簿とは分離管理しています。</p>${detailRows(g)?`<div class="table-wrap"><table class="profile-match-table"><thead><tr><th>回戦</th><th>選手</th><th>位置</th><th>県対戦</th><th>本人結果</th><th>技</th><th>根拠</th></tr></thead><tbody>${detailRows(g)}</tbody></table></div>`:'<p class="small muted">本人実戦A確定なし（調査中）</p>'}<h4>都道府県別登録選手</h4><p class="small muted">都道府県を押すと7人の登録名簿を確認できます。登録のみで本人実戦とはみなしません。</p>${standings}</div></section>`;
    }).join('');
    return `${verifiedBanner}${pageHeader('ALL JAPAN PREFECTURAL TEAM KENDO','全日本都道府県対抗剣道優勝大会','2026年・男女の公式登録名簿と団体対戦記録。全日本選手権の個人成績・ランキングとは独立した団体大会。')}
      <div class="stats">${statCard('公式登録',658,'枠','男女47都道府県×7名')}${statCard('都道府県別対戦',92,'試合','男女46試合ずつ')}${statCard('選手ID登録',d.meta.counts.registeredProfilesLinked,'枠','既存'+d.meta.counts.existingLinked+'＋新規'+d.meta.counts.newPlayerIds)}</div>
      <section class="pane"><div class="pane-pad"><h3 class="section-title">記録の範囲</h3><p>登録658枠と団体対戦92試合は全剣連の公式資料を根拠として収録しています。本人の出場試合、勝利、技、本数を推定することはありません。</p><p class="small muted">同一人物判定保留は${d.meta.counts.identityUnresolvedB}枠。保留枠は既存IDに連結せず、登録の事実だけ表示。2026年名簿の年齢・段位は確認・転記が済んだもののみ掲載し、空欄は「—」としました。新規${d.meta.counts.newPlayerIds}選手の読みや職業を推測しません。</p></div></section>
      ${renderTodoWomenAwards()}${genderBlocks}<p class="footnote">※本サイトは全日本剣道連盟の公式サイトではありません。出場選手名簿は本人実戦を裏付ける資料ではありません。</p>`;
  }
  function renderTozaiOnlyPlayer(p){
    const multi=!!p.tozaiMultiYear;
    const certifiedYears=multi?p.tozaiYears.join('・')+'年':p.tozaiYear+'年';
    const ownMatches=multi?p.tozaiRecordCount:1;
    const tournamentList=multi?p.tozaiRosters.map(t=>t.year+'年・第'+(t.year-1954)+'回').join('、'):p.tozaiYear+'年・第'+(p.tozaiYear-1954)+'回';
    const ageInfo=multi?p.tozaiRosters.filter(t=>Number.isInteger(t.age)).map(t=>t.year+'年'+t.age+'歳').join('・'):'';
    const officialRosters=multi?p.tozaiRosters.map(t=>`<a class="data-link" href="${esc(t.rosterSource)}" target="_blank" rel="noopener noreferrer">${t.year}年公式組合せ ↗</a>`).join('　'):'';
    const firstOfficialMatch=multi?p.tozaiRosters.find(t=>/^https:\/\/(?:www\.)?kendo\.or\.jp\/competition\//.test(t.matchSource||''))?.matchSource:'';
    const url=/^https:\/\/(?:www\.)?kendo\.or\.jp\/competition\//.test(p.source||'')?p.source:(firstOfficialMatch||'');
    const source=url?`<a class="data-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">全剣連・${esc(p.tozaiYear)}年大会の公式記録 ↗</a>`:'公式記録URL未照合';
    return `<div class="breadcrumb"><a href="#/players">選手名鑑</a> › ${esc(p.name)}</div>
      <div class="detail-hero"><div class="detail-main"><div class="avatar ${p.gender==='女子'?'f':''}">${esc(p.name.slice(-1))}</div><div>
      <p class="eyebrow" style="margin:0">TOZAI-TAIKO · RECORD PROFILE</p><h2>${esc(p.name)}</h2>
      <p class="detail-reading">読み：公式資料未確認</p><div class="detail-pills">${badge(p.gender)} ${badge(todoWomenLinkedProfiles[p.id]?'東西対抗・都道府県対抗':'東西対抗・試合記録のみ')}</div></div></div></div>
      <div class="stats profile-stats">${statCard('東西対抗・本人試合',ownMatches,'試合',multi?('本人照合済み'+p.tozaiYears.length+'年度'):'この年度の公式確認分')}${statCard('確認された大会年度',multi?p.tozaiYears.join('･'):p.tozaiYear,'年',multi?(p.tozaiYears.join('・')+'年のみ連結'):'別年度の同姓同名は未統合')}${statCard('全日本選手権の戦績','未収録','','出場なしの意味ではありません')}</div>
      <div class="detail-grid profile-grid"><section class="pane wide"><h3 class="section-title">基本プロフィール（公式記録で確認できる範囲）</h3>
      <div class="definition">${profileRow('氏名',p.name)}${profileRow('氏名の読み','未確認')}${profileRow('区分',p.gender)}${profileRow('確認できた大会',tournamentList+' 全日本東西対抗剣道大会')}${profileRow('所属・代表都道府県',todoWomenLinkedProfiles[p.id]?todoPrefFull(todoWomenLinkedProfiles[p.id].entries.at(-1).prefecture)+'（'+todoWomenLinkedProfiles[p.id].entries.at(-1).year+'年都道府県対抗代表）':multi?p.pref+'（'+p.tozaiYears.join('・')+'年公式名簿）':'未確認')}${profileRow('年齢・段位',ageInfo?ageInfo+'（段位未確認）':'未確認')}${profileRow('出身校','未確認')}</div>
      <p class="small muted" style="margin-top:15px">出典：${source}${multi?`<div class="small muted">人物照合根拠：${officialRosters}</div>`:''}</p></section>
      ${renderTodoWomenProgram2026(p)}${renderTodoWomenAwards(p)}${renderLinkedTodoWomenHistory(p)}${renderPoliceHistory(p)}${window.KENDO_POLICE_TEAM_UI.playerHistory(p.id)}${renderWkcPlayerHistory(p)}${renderWkcTeamPlayerHistory(p)}</div><p class="footnote">${todoWomenLinkedProfiles[p.id]?'※東西対抗の本人実戦と公式都道府県対抗登録を区別して掲載します。全日本選手権のランキング・比較には加算しません。':multi?'※このプロフィールは'+p.tozaiYears.join('・')+'年の全剣連公式名簿により同県・年齢推移を確認した'+p.tozaiYears.length+'大会に限定します。その他年度の同姓同名は未統合。全日本選手権のランキング・比較には加算しません。':`※このプロフィールは${esc(p.tozaiYear)}年大会の本人実戦１件だけを根拠に追加しました。他大会の出場、複数年度間の同一人物性、年齢・所属・段位は未照合。全日本選手権のランキング・比較には加算しません。`}</p>`;
  }
  function renderPlayerBase(id){
    id=canonicalPlayerId(id);
    const p=findP(id);if(!p)return notFound();
    if(p.eightDanOnly)return `<div class="breadcrumb"><a href="#/players">選手名鑑</a></div>${pageHeader('PLAYER PROFILE',p.name,`${p.gender} / ${p.reading||'読み未確認'}`)}<p class="small muted">八段大会の確認済み記録を収録。所属・勤務先等は未確認。</p><button class="textbtn" data-compare-add="${esc(p.id)}">比較に追加 ＋</button>`;
    if(p.tozaiOnly)return renderTozaiOnlyPlayer(p);
    if(p.policeOnly)return `<div class="breadcrumb"><a href="#/players">選手名鑑</a> › ${esc(p.name)}</div>${pageHeader('PLAYER PROFILE',p.name,`${p.gender} / ${p.reading||'読み未確認'}`)}<div class="detail-grid profile-grid"><section class="pane wide"><div class="pane-pad"><h3 class="section-title">基本プロフィール</h3><p>${esc(p.aff)}${p.affAsOfYear?`（${p.affAsOfYear}年大会時点）`:""}</p><p class="small muted">${p.univ?`出身大学：${esc(p.univ)}。`:""}${p.policeTeamOnly&&p.high?`出身高校：${esc(p.high)}。`:""}年齢・段位・その他の出身校は未確認。</p>${p.policeTeamOnly?'<p class="small muted">団体戦の氏名・参加・表彰資料に基づくプロフィール。勤務先は大会当時の所属であり、個別試合の完全確認を意味しません。</p>':""}</div></section>${renderPoliceHistory(p)}${window.KENDO_POLICE_TEAM_UI.playerHistory(p.id)}${renderWkcPlayerHistory(p)}${renderWkcTeamPlayerHistory(p)}</div>`;
    const rs=records.filter(r=>r.player===id).sort((a,b)=>{const x=findE(a.event),y=findE(b.event);return y.year-x.year||parseInt(y.edition.replace(/\D/g,''))-parseInt(x.edition.replace(/\D/g,''));});
    const a=aggregate(p);
    const newest=rs[0]||null, latestEvent=newest?findE(newest.event):null;
    const latestYear=latestEvent?.year;
    const titleName=playerChampionshipName(p);
    const bestRank=Math.max(0,...rs.map(r=>finishRank(r.finish)));
    const bestYears=rs.filter(r=>finishRank(r.finish)===bestRank).map(r=>findE(r.event).year).sort((a,b)=>a-b);
    const bestFoot=bestYears.length?`最高到達年度：${bestYears.map(y=>y+'年').join('・')}`:'掲載成績なし';
    const latestAgeEvent=rs.map(r=>findE(r.event)).find(e=>e&&eventAgeFor(e,p)!==null)||null;
    const latestAge=latestAgeEvent?eventAgeFor(latestAgeEvent,p):null;
    const latestGradeEvent=rs.map(r=>findE(r.event)).find(e=>e&&Boolean(eventGradeFor(e.id,p.id)))||null;
    const grade=latestGradeEvent?eventGradeFor(latestGradeEvent.id,p.id):'';
    // The team's official roster gives independent dated age/grade facts, not proof of actual participation.
    const linkedSlots=todoWomenLinkedProfiles[p.id]?.entries||[];
    const teamRosterLast=(typeof todo2026==='undefined'?[]:todo2026.roster).find(r=>r.playerId===p.id&&String(r.identityStatus||'').startsWith('A-'));
    const lastLinked=linkedSlots[linkedSlots.length-1]||null;
    const latestTeamFact=teamRosterLast||lastLinked;
    const latestTeamYear=teamRosterLast?2026:lastLinked?.year;
    const teamRosterAsOf=latestTeamYear?{id:'tdw',year:latestTeamYear}:null;
    const showTeamAge=teamRosterAsOf&&Number.isInteger(latestTeamFact?.age)&&(!latestAgeEvent||latestAgeEvent.year<latestTeamYear);
    const showTeamGrade=teamRosterAsOf&&Boolean(latestTeamFact?.grade)&&(!latestGradeEvent||latestGradeEvent.year<latestTeamYear);
    const shownAge=showTeamAge?latestTeamFact.age:latestAge;
    const shownAgeEvent=showTeamAge?teamRosterAsOf:latestAgeEvent;
    const shownGrade=showTeamGrade?latestTeamFact.grade:grade;
    const shownGradeEvent=showTeamGrade?teamRosterAsOf:latestGradeEvent;
    const officialAppearance=officialAppearanceAt(p,latestEvent);
    const appearanceText=officialAppearance?`${officialAppearance.count}回（${latestYear}年大会公式）`:linkedSlots.length?`全日本女子選手権：未照合 ／ 都道府県対抗女子：名簿登録${linkedSlots.length}大会`:'公式出場回数：確認中';
    const latestPref=latestEvent?prefectureFor(latestEvent,p):p.pref;
    const rows=rs.map(r=>{
      const e=findE(r.event), ms=profileEventMatches(p,e), yearTitle=e.year===2020?'2020年大会':`${e.year}年度`;
      const ageAtEvent=eventAgeFor(e,p);
      const key=`year-matches-${e.id}-${p.id}`;
      const notes=profileEventNotes(r,e,ms);
      const table=ms.length?`<div class="table-wrap profile-match-wrap"><table class="profile-match-table"><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・技（本人 − 相手）</th></tr></thead><tbody>${matchRows2026(ms,p.id)}</tbody></table></div>`:'<p class="small muted">個別対戦記録はまだ収録されていません。</p>';
      const source=e.source?sourceLink(e.source,'大会公式記録'):'';
      return `<tr class="profile-year-row"><td><button type="button" class="profile-year-toggle" data-profile-year="${esc(key)}" aria-expanded="false" aria-controls="${esc(key)}" aria-label="${yearTitle} 第${esc(e.edition.replace(/[^\d]/g,''))}回の全対戦結果を開く"><span>${esc(yearTitle)}</span><strong>${esc(e.edition)}</strong><span class="profile-year-arrow" aria-hidden="true">▼</span></button>${e.heldYear!==e.year?'<div class="profile-year-foot">2021年3月14日開催（延期開催）</div>':''}</td><td>${ageAtEvent!==null?`<span class="profile-event-age">${esc(ageAtEvent)}歳</span><span class="profile-event-grade">${eventGradeDisplay(e.id,p.id)}</span>`:eventGradeDisplay(e.id,p.id)}</td><td class="result ${r.finish==='優勝'?'win':''}">${esc(r.finish)}</td><td class="profile-row-note">${notes}</td></tr><tr class="profile-year-detail" id="${esc(key)}" hidden><td colspan="4"><div class="profile-inline-panel"><div class="profile-inline-head"><strong>${esc(e.year)}年・${esc(e.edition)} 全対戦結果（${ms.length}試合）</strong><span class="small muted">${source}</span></div>${table}</div></td></tr>`;
    }).join('');
    return `<div class="breadcrumb"><a href="#/players">選手名鑑</a> › ${esc(p.name)}</div>
    <div class="detail-hero"><div class="detail-main"><div class="avatar ${p.gender==='女子'?'f':''}">${esc(p.name.slice(-1))}</div><div><p class="eyebrow" style="margin:0">PLAYER PROFILE</p><h2>${esc(p.name)}</h2><p class="detail-reading">${p.reading?esc(p.reading):'読み：確認中'}</p>${p.formerName?`<p class="detail-former">過去の登録名：${esc(displayNameForRaw(p.formerName))}${p.formerReading?`（${esc(p.formerReading)}）`:''}</p>`:''}<div class="detail-pills">${badge(p.gender)} ${badge(latestPref||'代表未確認')} ${badge(p.stance||'構え未登録')}</div></div></div><button class="btn secondary" data-compare-add="${p.id}">⇄ この選手を比較に追加</button></div>
    <div class="stats profile-stats">
      ${rs.length?`${statCard(titleName+'通算勝利',a.wins,'勝','2012年以降の公式掲載試合')}${statCard(titleName+'優勝',a.titles,'回','2012年以降の収録大会')}${statCard(titleName+'最高成績',finishLabel(bestRank),'',bestFoot)}`:linkedSlots.length?`${statCard('都道府県対抗女子の名簿登録',linkedSlots.length,'大会','本人実戦・勝敗とは別')}${statCard('本人実戦',((todo2026.individualBouts||[]).filter(b=>b.playerId===p.id&&b.actualBoutConfirmed).length||'未確認'),(todo2026.individualBouts||[]).some(b=>b.playerId===p.id&&b.actualBoutConfirmed)?'試合':'','2026年の確認済み分のみ')}${statCard(titleName+'個人戦成績','未収録','','不出場を意味しません')}`:`${statCard('都道府県対抗登録',1,'枠','2026年公式出場名簿')}${statCard('本人実戦',(todo2026.individualBouts||[]).filter(b=>b.playerId===p.id).length||'未調査',(todo2026.individualBouts||[]).some(b=>b.playerId===p.id)?'試合':'','登録と実戦は分離')}${statCard(titleName+'試合成績','非収録','','個人大会への不出場とは断定しない')}`}
    </div>
    <div class="detail-grid profile-grid">
      <section class="pane wide"><h3 class="section-title">基本プロフィール</h3><div class="definition">${profileRow('氏名の読み',p.reading||'未確認')}${p.formerName?profileRow('過去の登録名・その読み',displayNameForRaw(p.formerName)+(p.formerReading?'（'+p.formerReading+'）':'')):''}${profileRegistrationRow(p,latestEvent)}${profileRow('職業・勤務先',p.aff?`${p.aff}${p.affAsOfYear?`（${p.affAsOfYear}年大会時点）`:''}`:'')}${occupation2026OfficialSourceRow(p)}${profileRow('出場回数',appearanceText)}${profileSnapshotRow('年齢',shownAge!==null?`${shownAge}歳`:'',shownAgeEvent)}${educationProfileRow(p,'high')}${educationProfileRow(p,'univ')}${profileSnapshotRow('称号・段位',shownGrade,shownGradeEvent)}${profileRow('構え',p.stance)}${profileRow('得意技',p.skill)}</div>${renderOfficialGradeDiscrepancy(p)}${latestEvent?`<p class="small muted profile-last-source">最終出場大会：${eLink(latestEvent)}${officialAppearance?` ／ <a class="data-link" href="${esc(officialAppearance.source)}" target="_blank" rel="noopener noreferrer">出場回数の公式根拠 ↗</a>`:''}</p>`:''}</section>
      ${rs.length||!linkedSlots.length?`      <section class="pane wide profile-history" style="padding:0"><div class="pane-pad"><h3 class="section-title">${esc(titleName)}・年度別成績</h3><p class="small muted">年度を押すと、その大会での全対戦結果が開きます。当時の段位は公式登録で確認できた場合のみ表示します。</p></div><div class="table-wrap profile-history-wrap"><table class="profile-history-table"><thead><tr><th>大会年度・回次</th><th>当時の年齢・称号段位</th><th>到達成績</th><th>備考</th></tr></thead><tbody>${rows}</tbody></table></div></section>`:''}
      ${rs.length||!linkedSlots.length?renderTechniqueSummary(p):''}
      ${renderWkcPlayerHistory(p)}
      ${renderWkcTeamPlayerHistory(p)}
      ${renderAokcPlayerHistory(p)}
      ${renderTodoWomenProgram2026(p)}${renderTodoWomenAwards(p)}
      ${renderLinkedTodoWomenHistory(p)}
      ${renderTodo2025PlayerHistory(p)}
      ${renderTodoPlayerHistory(p)}${renderPoliceHistory(p)}${window.KENDO_POLICE_TEAM_UI.playerHistory(p.id)}
    </div>${p.formerName?`<div class="source-box small"><strong>氏名の履歴：</strong>現在の表示は${esc(p.name)}。過去の登録名 ${esc(displayNameForRaw(p.formerName))} は同じ選手IDに統合しています。<a class="data-link" href="${esc(p.identitySource)}" target="_blank" rel="noopener noreferrer">同一人物判定の根拠資料 ↗</a></div>`:''}
    <p class="footnote">※勝利・優勝の通算値は2012〜2026年の連続収録期間を対象とし、2011年の参考記録は含めていません。2020年は2021年3月の延期開催大会です。</p>`;
  }
  const todoGroupName=g=>g==='女子'?'全日本都道府県対抗女子剣道優勝大会':'全日本都道府県対抗剣道優勝大会';
  function policeName(x){const p=findP(x.id);return p?`${pLink(p)}${norm(x.name)!==norm(p.name)?`<span class="row-sub">当時の登録名：${esc(x.name)}</span>`:''}`:esc(x.name)+((x.identityStatus==='B'||String(x.id).includes('pending'))?'<span class="row-sub">人物ID未照合</span>':'');}
  function policeMatchTable(ms,pid=null){return `<div class="table-wrap"><table><thead><tr><th>回戦</th><th>${pid?'対戦相手':'選手'}</th>${pid?'':'<th>対戦相手</th>'}<th>勝敗</th><th>本数・取得技</th><th>延長</th></tr></thead><tbody>${ms.map(m=>{const reverse=pid===m.b.id, a=reverse?m.b:m.a,b=reverse?m.a:m.b,as=reverse?m.bScore:m.aScore,bs=reverse?m.aScore:m.bScore,at=reverse?m.bTech:m.aTech,bt=reverse?m.aTech:m.bTech;const unknown=as==null||bs==null;const score=unknown?'本数未確認':`${as} - ${bs}`;const tech=unknown?(at||bt?`確認技：${esc(at||'未確認')} − ${esc(bt||'未確認')}`:'取得技未確認'):`（${esc(at||'　')} − ${esc(bt||'　')}）`;return `<tr><td>${esc(m.round)}</td><td>${pid?policeName(b):policeName(a)}<span class="row-sub">${esc(pid?b.aff:a.aff)}</span></td>${pid?'':`<td>${policeName(b)}<span class="row-sub">${esc(b.aff)}</span></td>`}<td>${pid?(m.winnerId===pid?'勝':'敗'):policeName(m.winnerId===a.id?a:b)+' 勝利'}</td><td>${score}<span class="row-sub">${tech}</span></td><td>${m.overtime===true?'あり':m.overtime===false?'なし':'未確認'}</td></tr>${m.note?`<tr><td colspan="${pid?5:6}" class="small muted">${esc(m.note)}</td></tr>`:''}`;}).join('')}</tbody></table></div>`;}
  function renderPlayer(id){const p=findP(id);return p?renderPlayerBase(id)+window.KENDO_8DAN_UI.history(p.id)+JP.slot(p.id,false):JP.slot(id,true);}
  function renderPolice(year,g){const d=policeIndividual.find(x=>x.year===year&&x.gender===g);if(!d)return notFound();return `<div class="breadcrumb"><a href="#/events">大会データ</a> › 全国警察剣道選手権大会</div>${pageHeader('POLICE KENDO CHAMPIONSHIP',`${year}年 全国警察剣道選手権大会・${g}`,`${d.date} / ${d.venue}${d.matches.length&&!d.workImageEvidence?" / 一本勝負":""}`)}<p>${sourceLink(d.source,'全剣連公式結果')}${d.resultImageSource?' / '+sourceLink(d.resultImageSource,'公式結果画像'):''}</p><section class="pane"><div class="pane-pad"><h3 class="section-title">最終成績</h3><p class="small muted">${d.coverage?esc(d.coverage):`${d.matches[0].round}以降の${d.results.length}名の成績のみ収録。全出場者名簿・それ以前の試合は未収録。`}</p></div><div class="table-wrap"><table><thead><tr><th>選手</th><th>所属（大会当時）</th><th>到達成績</th></tr></thead><tbody>${d.results.map(r=>`<tr><td>${policeName(r)}</td><td>${esc(r.aff)}${r.dan?`<span class="row-sub">当時の段位：${esc(r.dan)}</span>`:''}</td><td>${esc(r.finish)}</td></tr>`).join('')}</tbody></table></div></section><section class="pane"><div class="pane-pad"><h3 class="section-title">試合結果（${d.matches.length}試合）</h3><p class="small muted">${d.matches.length?(d.workImageEvidence?"公式結果図で勝敗を確認。最終本数・反則・延長・不戦勝は未確認。技記号が読めた試合のみ確認技を表示。":"全剣連公式結果で確認。延長の有無は未確認。"):"公式結果画像未判読。個別対戦は未収録。"}</p></div>${d.matches.length?policeMatchTable(d.matches):''}</section>`;}
  function renderPoliceHistory(p){const ds=policeIndividual.filter(d=>d.results.some(r=>r.id===p.id));if(!ds.length)return '';return `<section class="pane wide"><div class="pane-pad"><h3 class="section-title">全国警察剣道選手権大会・個人戦</h3><p class="small muted">公式確認済みの成績・試合のみ（年度により収録範囲が異なります）。全日本選手権の集計に含めません。</p>${ds.map(d=>{const r=d.results.find(r=>r.id===p.id);return `<details><summary><strong>${d.year}年・${esc(r.finish)}</strong>　${esc(r.aff)}</summary>${d.matches.length?policeMatchTable(d.matches.filter(m=>m.a.id===p.id||m.b.id===p.id),p.id):'<p class="small muted">個別対戦未収録</p>'}<p><a class="data-link" href="#/police/${d.year}/${d.gender==='男子'?'men':'women'}">大会詳細</a> / ${sourceLink(d.source)}</p></details>`;}).join('')}</div></section>`;}
  function domesticEntries(){
    const championship=events.map(e=>({...e,href:'#/event/'+e.id,sub:`登録${records.filter(r=>r.event===e.id).length}名分`,type:'championship'}));
    const pref=[...Object.keys(todoDirectoryHistory).map(Number),2025,2026].map(year=>({name:todoGroupName('女子'),edition:`第${year-2008}回`,year,heldYear:year,gender:'女子',href:`#/todo/${year}/women`,sub:`登録${year===2026?todo2026.roster.filter(r=>r.gender==='女子').length:year===2025?todo2025.roster.length:todoDirectoryHistory[year].roster.length}名分・団体46対戦枠`,type:'pref'}));
    pref.push({name:todoGroupName('男子'),edition:'第74回',year:2026,heldYear:2026,gender:'男子',href:'#/todo/2026/men',sub:'登録329名分・団体46対戦',type:'pref'});
    const eastwest=(window.KENDO_TOZAI_PUBLIC?.records||[]).map(r=>({name:'全日本東西対抗剣道大会',edition:`第${r.year-1954}回`,year:r.year,heldYear:r.year,gender:r.gender,href:`tozai.html?year=${r.year}&gender=${encodeURIComponent(r.gender)}`,sub:'東西対抗・公式確認済み記録',type:'tozai'}));
    const police=policeIndividual.map(d=>({name:"全国警察剣道選手権大会",edition:`${d.year}年`,year:d.year,heldYear:d.year,gender:d.gender,href:`#/police/${d.year}/${d.gender==='男子'?'men':'women'}`,sub:d.matches.length?`${d.matches[0].round}以降${d.matches.length}試合・${d.results.length}名`:"優勝者のみ確認",type:"police"}));return [...championship,...pref,...eastwest,...police,...window.KENDO_POLICE_TEAM_UI.entries(),...window.KENDO_8DAN_UI.entries(),...window.KENDO_JITSUGYODAN_UI.entries()];
  }
  function eventRows(){const q=norm(eventQuery);const all=domesticEntries();const shown=all.filter(e=>(eventGender==='すべて'||e.gender===eventGender)&&(eventYear==='すべて'||String(e.year)===eventYear)&&norm(e.name+e.edition+e.year+e.gender+e.heldYear).includes(q));
    document.getElementById('eventCount').textContent=`${shown.length}大会を表示 / 全${all.length}大会`;
    const groups=[...new Set(all.map(e=>e.name))].sort((a,b)=>{const order=['全日本剣道選手権大会','全日本女子剣道選手権大会',todoGroupName('男子'),todoGroupName('女子'),'全日本東西対抗剣道大会','全国警察剣道選手権大会','全国警察剣道大会（団体戦）','全日本選抜剣道八段優勝大会','全日本実業団剣道大会'];return order.indexOf(a)-order.indexOf(b)}).map(name=>({name,items:shown.filter(e=>e.name===name).sort((a,b)=>b.year-a.year||a.gender.localeCompare(b.gender,'ja'))})).filter(g=>g.items.length);
    document.getElementById('eventResults').innerHTML=shown.length?groups.map(({name,items})=>`<details class="event-directory-group" ${eventQuery||eventYear!=='すべて'||eventGender!=='すべて'?'open':''}><summary><strong>${esc(name)}</strong><span>${items.length}${name==='全国警察剣道大会（団体戦）'?'部門':'開催回'}</span></summary>${items.map(e=>`<div class="list-row event-directory-row"><div><a class="row-title data-link" href="${esc(e.href)}">${esc(e.edition)} ${esc(e.name)}</a><div class="row-sub">${e.year===2020?'2020年大会':e.year+'年度'}${e.heldYear!==e.year?'（2021年3月14日開催・延期開催）':''} / ${esc(e.gender)} / ${esc(e.sub)}</div></div><div class="event-list-actions"><a class="mini-action" href="${esc(e.href)}">成績・試合結果を見る →</a></div></div>`).join('')}</details>`).join(''):'<div class="empty">該当する大会はありません。</div>';
  }
  function japanTabs(active=''){return `<nav class="japan-tabs" aria-label="日本代表の大会"><a href="#/japan" ${!active?'aria-current="page"':''}>日本代表トップ</a><a href="#/wkc" ${active==='wkc'?'aria-current="page"':''}>世界選手権</a><a href="#/aokc" ${active==='aokc'?'aria-current="page"':''}>アジア・オセアニア選手権</a></nav>`;}
  function renderJapan(){return `${verifiedBanner}${pageHeader('JAPAN NATIONAL TEAM','日本代表','日本代表が出場する国際大会の記録。大会ごとに代表登録、個人戦・団体戦の実戦記録を整理。')}${japanTabs()}<div class="pane"><a class="list-row" href="#/wkc/2024"><div><div class="row-title">世界剣道選手権大会（WKC）</div><div class="row-sub">1970〜2024年・開催済み18大会（2021年中止）</div></div><span class="arrow">›</span></a><a class="list-row" href="#/aokc"><div><div class="row-title">アジア・オセアニア剣道選手権大会</div><div class="row-sub">2026年・第1回大会</div></div><span class="arrow">›</span></a></div>`;}
  function todoEditionData(year,g){
    if(year<2025)return g==='女子'?todoDirectoryHistory[year]:null;
    if(year!==2025&&year!==2026||year===2025&&g!=='女子')return null;
    const d=year===2026?todo2026:todo2025, latest=year===2026, a=latest?d.awards[g]:d.awards;
    const podium=latest?Object.entries(a.teams_ranked).flatMap(([k,v])=>v.map(x=>[({'1':'優勝','2':'準優勝','3':'3位'})[k]||k+'位',x])):[['優勝',a.champion],['準優勝',a.runnerup],...a.semifinalists.map(x=>['3位',x])];
    const roster=d.roster.filter(r=>r.gender===g).map(r=>[r.prefecture,r.order,r.name,r.age,r.grade,r.playerId||r.linkedPlayerId||r.rosterSlotId]);
    const matches=latest?d.teamMatches.filter(m=>m.gender===g).map(m=>[m.round,m.team_a,m.team_b,m.team_a_wins,m.team_b_wins,m.team_a_points,m.team_b_points,m.winner,!!m.representative_decision,false,m.source_url,m.decision]):d.teamMatchesAudit.filter(m=>String(m.teamScoreProof).startsWith('A')).map(m=>[m.round,m.team1,m.team2,m.team1WinsDisplay,m.team2WinsDisplay,m.team1Ippon,m.team2Ippon,m.winner,m.representativeDecisionShown,m.actualTeamBoutPlayed===false,m.source]);
    const bouts=d.individualBouts.filter(b=>b.gender===g&&b.actualBoutConfirmed&&String(b.proofLevel).startsWith('A')).map(b=>{const result=String(b.individualResultLevel).startsWith('A')?b.individualResult:null,score=b.scoreIsFullyConfirmed&&result!=null;return [b.round,b.position,b.name,b.playerId,b.prefecture,b.opponentPrefecture,b.opponentName,b.opponentPlayerId,result,score?b.exactTotalScoredIppon:null,score?b.exactTotalConcededIppon:null,score?b.scoringTechniques:null,score?b.concededTechniques:null,b.isRepresentativeBout,b.officialPrimarySource,score?b.foulAwardIppon:null,score?b.concededFoulAwardIppon:null]});
    return {name:latest?a.event:d.meta.event,date:latest?a.date:d.meta.eventDate,rosterSource:latest?d.meta.sources[g==='男子'?'menRoster':'womenRoster']:d.meta.rosterSource,matchSource:latest?a.source_url:d.meta.matchSource,podium,roster,matches,bouts};
  }
  function renderTodoEdition(year,kind){
    const g=kind==='men'?'男子':kind==='women'?'女子':null,d=g&&todoEditionData(year,g);if(!d)return notFound();
    const safe=v=>esc(v==null?'—':v),link=(name,id)=>!name?'—':id&&findP(id)?`<a class="data-link" href="#/player/${encodeURIComponent(findP(id).id)}">${esc(displayNameForRaw(name))}</a>`:esc(displayNameForRaw(name)), src=(u,label)=>typeof u==='string'&&/^https:\/\//.test(u)?`<a class="data-link" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`:'—', table=(heads,rows)=>`<div class="table-wrap"><table class="profile-match-table"><thead><tr>${heads.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`,tr=xs=>`<tr>${xs.map(x=>`<td>${x}</td>`).join('')}</tr>`, group=(title,body)=>`<details class="history-group"><summary>${esc(title)}</summary>${body}</details>`;
    const rounds=[...new Set(d.matches.map(m=>m[0]))];
    const matchGroups=rounds.map(r=>group(`${r}（${d.matches.filter(m=>m[0]===r).length}対戦枠）`,table(['対戦都道府県','勝数','本数','勝者','決着・資料'],d.matches.filter(m=>m[0]===r).map(m=>tr([`${safe(m[1])} ― ${safe(m[2])}`,`${safe(m[3])} − ${safe(m[4])}`,`${safe(m[5])} − ${safe(m[6])}`,safe(m[7]),`${m[9]?'不戦勝（通常実戦なし）':m[8]?'代表戦':safe(m[11]||'—')} ${src(m[10],'公式')}`]))))).join('');
    const rosterGroups=[...new Set(d.roster.map(r=>r[0]))].map(pref=>{const rr=d.roster.filter(r=>r[0]===pref);return group(`${todoPrefFull(pref)}（登録${rr.length}名）`,table(['登録順','選手','年齢','称号・段位'],rr.map(r=>tr([safe(r[1]),link(r[2],r[5]),r[3]==null?'—':safe(r[3])+'歳',safe(r[4])]))))}).join('');
    const boutRows=bs=>table(['回戦・位置','選手','相手','勝敗','本数・取得技','資料'],bs.map(b=>{const tech=(t,n)=>Array.isArray(t)&&t.length?t.join('・'):typeof t==='string'&&t?t:n===0?'—':'未確認';const score=b[9]==null||b[10]==null?'未確認':`${safe(b[9])} − ${safe(b[10])}<div class="small muted">（${safe(tech(b[11],b[9]))}${b[15]?'・反則得点'+safe(b[15])+'本':''} − ${safe(tech(b[12],b[10]))}${b[16]?'・反則得点'+safe(b[16])+'本':''}）</div>`;return tr([safe(b[0])+'・'+safe(b[1]),link(b[2],b[3])+'<div class="small muted">'+safe(b[4])+'</div>',link(b[6],b[7])+'<div class="small muted">'+safe(b[5])+'</div>',safe(b[8]||'未確認'),score,src(b[14],'出典')])}));
    const normal=d.bouts.filter(b=>!b[13]),rep=d.bouts.filter(b=>b[13]);
    const awards=g==='女子'?todoWomenAwards.filter(a=>a.year===year):year===2026?todo2026.awards[g].outstanding_players.map(a=>({name:a.name,pref:a.prefecture,position:a.position,source:d.matchSource})):[];
    return `${verifiedBanner}${pageHeader('TOURNAMENT EDITION',d.name,`${d.date} / ${g} / 団体戦。登録と本人実戦は別管理。`)}<div class="stats">${statCard('大会年度',year,'年','')}${statCard('公式登録',d.roster.length,'名','登録名簿')}${statCard('団体対戦',d.matches.length,'枠','不戦勝を含む場合あり')}${statCard('本人実戦の掲載',d.bouts.length,'選手側記録','全試合網羅とは限りません')}</div><section class="pane"><div class="pane-pad"><h3 class="section-title">最終成績</h3>${table(['順位','都道府県'],d.podium.map(r=>tr(r.map(safe))))}<p class="small">${src(d.rosterSource,'公式出場名簿')} ／ ${src(d.matchSource,'大会公式結果')}</p><h4>優秀選手賞</h4>${awards.length?table(['選手','代表県','位置','資料'],awards.map(a=>tr([link(a.name,a.playerId),safe(a.pref),safe(a.position),src(a.source,'公式')]))):'<p class="small muted">未確認</p>'}</div></section><section class="pane" style="margin-top:20px"><div class="pane-pad"><h3 class="section-title">団体試合結果</h3>${matchGroups}</div></section><section class="pane" style="margin-top:20px"><div class="pane-pad"><h3 class="section-title">本人実戦（確認済み分）</h3><p class="small muted">本人の実戦がA確定の記録のみ掲載。勝敗・技が未確定の部分は未確認と表示。選手側ごとの記録であり、通常戦と代表戦は別管理。</p>${normal.length?group(`通常戦（${normal.length}選手側記録）`,boutRows(normal)):'<p class="small muted">通常戦の本人実戦未収録</p>'}${rep.length?group(`代表戦（${rep.length}選手側記録）`,boutRows(rep)):''}</div></section><section class="pane" style="margin-top:20px"><div class="pane-pad"><h3 class="section-title">都道府県別登録名簿</h3><p class="small muted">登録は本人実戦を意味しません。プロフィールが存在するIDだけリンクします。</p>${rosterGroups}</div></section><p class="footnote">※全日本選手権の個人戦ランキングとは別集計。</p>`;
  }

  // 世界剣道選手権：全日本選手権のランキング統計から完全に分離した公式記録。
  const wkcNames=(name,id)=>{
    const p=id?findP(id):null;
    if(!p)return `<strong>${esc(displayNameForRaw(name))}</strong>`;
    const historic=norm(name)!==norm(p.name) && (p.nameAliases||[]).some(a=>norm(a)===norm(name));
    return `${pLink(p)}${historic?`<span class="tiny muted wkc-historic-name">（当時の登録名：${esc(displayNameForRaw(name))}）</span>`:''}`;
  };
  const wkcSource=(src)=>`${src.ajkf?`<a class="data-link" href="${esc(src.ajkf)}" target="_blank" rel="noopener noreferrer">${src.edition===1?'全剣連公式映像案内':[11,12,14].includes(src.edition)?'全剣連公式大会報告':[15,16].includes(src.edition)?'全剣連公式大会案内':'全剣連公式結果'} ↗</a> / `:''}<a class="data-link" href="${esc(src.fik)}" target="_blank" rel="noopener noreferrer">FIK公式結果 ↗</a>${src.officialPodiumSource&&src.officialPodiumSource!==src.fik?` / <a class="data-link" href="${esc(src.officialPodiumSource)}" target="_blank" rel="noopener noreferrer">FIK公式歴代入賞一覧 ↗</a>`:''}${src.officialResults?` / <a class="data-link" href="${esc(src.officialResults)}" target="_blank" rel="noopener noreferrer">大会公式結果 ↗</a>`:''}`;
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
  const wkcOrderName=b=>b.teamRound==='決勝代表戦'?'代表戦':(['先鋒','次鋒','中堅','副将','大将'][Number(b.order)-1]||esc(b.order)+'番');
  const wkc2009UsaOpponentPending=b=>b.year===2009 && b.teamRound==='決勝' && b.teamOpponentCode==='USA' && [1,2,3].includes(Number(b.order));
  const wkcBoutResultRow=b=>`<tr><td>${esc(b.teamRound)}</td><td>${wkcOrderName(b)}</td><td>${wkcNames(b.player,b.playerId)}<div class="tiny muted">${esc(b.playerCode)}</div></td><td>${wkc2009UsaOpponentPending(b)?'<span class="muted">氏名未確認（調査中）</span>':esc(b.opponent)}<div class="tiny muted">${esc(b.opponentCode)}</div></td><td class="${b.result==='勝'?'result win':'result'}">${esc(b.result)}</td><td>${b.scoreVerified===false?'<span class="muted">未収録</span>':`<strong>${b.playerTech.length} - ${b.opponentTech.length}</strong><div class="tiny muted">${esc(b.playerTech.join('・')||'—')} / ${esc(b.opponentTech.join('・')||'—')}</div>`}</td><td><a class="data-link" target="_blank" rel="noopener noreferrer" href="${esc(b.source)}">${b.sourcePublisher==='剣道日本'?'剣道日本・記録映像':b.source?.includes('youtube.com')?'全剣連公式動画':'全剣連公式記事'} ↗</a>${b.resultSource?`<div class="tiny"><a class="data-link" target="_blank" rel="noopener noreferrer" href="${esc(b.resultSource)}">全剣連公式記事（勝敗） ↗</a></div>`:""}</td></tr>`;
  const wkcTeamBoutsTable=(bouts)=>`<div class="table-wrap"><table><thead><tr><th>回戦</th><th>出場順</th><th>日本選手</th><th>対戦相手</th><th>勝敗</th><th>本数・技（日本 / 相手）</th><th>出典</th></tr></thead><tbody>${bouts.map(wkcBoutResultRow).join('')}</tbody></table></div>`;
  function renderWkcTeamPlayerHistory(p){
    const roundOrder=['予選１','予選２','１回戦','２回戦','３回戦','準々決勝','準決勝','決勝','決勝代表戦'];
    const bs=(wkcRecords.teamBouts||[]).filter(b=>b.playerId===p.id).sort((x,y)=>y.year-x.year||roundOrder.indexOf(x.teamRound)-roundOrder.indexOf(y.teamRound)||x.order-y.order);
    if(!bs.length)return '';
    const years=[...new Set(bs.map(b=>b.year))].sort((a,b)=>b-a);
    const blocks=years.map(y=>{
      const mm=bs.filter(b=>b.year===y);
      const wins=mm.filter(b=>b.result==='勝').length, losses=mm.filter(b=>b.result==='敗').length;
      const draws=mm.filter(b=>b.result==='引分'||b.result==='分'||b.result==='引き分け').length;
      const unknown=mm.filter(b=>!['勝','敗','引分','分','引き分け'].includes(b.result)).length;
      const summary=`${y}年・第${wkcEventSource(y).edition}回 ${wins}勝${losses}敗${draws?'・'+draws+'分':''}${unknown?'・勝敗未確認'+unknown+'件':''} <span class="history-count">${mm.length}試合を掲載</span>`;
      return `<details class="history-group" open><summary>${summary}</summary>${wkcTeamBoutsTable(mm)}<div class="pane-pad small"><a class="data-link" href="#/wkc/${y}">${y}年WKC大会一覧へ</a></div></details>`;
    }).join('');
    return `<section class="pane wide history-pane"><h3 class="section-title">世界剣道選手権（WKC）・団体本人実戦</h3><p class="small muted">全剣連公式動画・公式報告および現地を撮影した一次記録映像から、出場を確認できた団体戦のみ表示。出場順は先鋒・次鋒・中堅・副将・大将で記載し、代表戦は別区分です。2003年は全剣連「剣窓」記載の男子団体決勝・代表戦栄花直輝の突き一本を別枠で確認。2009年は全剣連「剣窓」で男子団体準決勝5人と決勝の先鋒・次鋒・中堅・大将の出場・勝敗を確認。決勝の米国側先鋒〜中堅の氏名は主催者公式資料で未確認のため公開画面では非表示とし、旧記録映像由来の氏名は調査台帳に保留。代表登録・個人戦出場とは別管理。2012年は男子団体決勝5人の本人実戦・出場順を公式動画で確認し、内村・正代の勝利、木和田の敗戦、高鍋の引き分けを全剣連公式記事でA確定。勝見の本人勝敗と全員の技・本数は未確認。2015年は動画から本人別の対戦・取得技を確認した試合を掲載。資料未確認の試合への出場・不出場は断定しません。全日本選手権の通算・ランキングには加算しません。</p>${blocks}</section>`;
  }
  function renderWkcPlayerHistory(p){
    const es=wkcRecords.japanIndividuals.filter(e=>e.playerId===p.id).sort((a,b)=>b.year-a.year);
    if(!es.length)return '';
    return `<section class="pane wide history-pane"><h3 class="section-title">世界剣道選手権（WKC）・個人戦</h3><p class="small muted">FIK・全剣連・大会公式資料で確認できた個人戦。1991年は男子の日本選手4人・決勝T7試合を2巡照合して部分収録。1994年は男子の日本選手7人・決勝T7試合を2巡照合して部分収録。1997年は男子の日本選手5人・決勝T8試合を2巡照合して部分収録（女子国際選抜とは別区分）。2000年はFIK公式表で男女各5名の決勝T出場と2巡照合した決勝Tの対戦15試合を部分収録（女子団体は準公式）。2003年はFIK公式表から男女個人戦各5名の出場と2巡照合済みの決勝T一部を収録。2006年はFIK公式表から日本選手7名の個人戦23試合（部分収録）を掲載。2009年はFIK公式表の決勝Tと全剣連公式報告で勝敗を確認した予選の一部、2012年は決勝Tの一部のみ収録。2015年は決勝トーナメントと公式動画で確認した予選の一部を収録。取得技は全剣連公式動画などで直接確認した試合だけ表示。全日本選手権の通算勝敗・ランキングには含めません。代表登録・団体の本人実戦とは別の記録です。</p>${es.map(e=>{const mm=e.matchKeys.map(wkcFindMatch).filter(Boolean);return `<details class="history-group" open><summary>${e.year}年・第${wkcEventSource(e.year).edition}回${e.name&&norm(e.name)!==norm(p.name)?`（当時：${esc(displayNameForRaw(e.name))}）`:""} ${e.medal?esc(e.medal)+' / ':''}${e.year===2015?'決勝T・予選一部':e.year===2009?'予選・決勝Tの一部収録':e.year===2006?'2巡確認・決勝Tの一部収録':e.year===2003?'2巡確認・決勝T一部収録':e.year===2012?'決勝T・一部収録' :`${e.wins}勝${e.losses}敗`} <span class="history-count">${mm.length}試合を掲載</span></summary>${wkcMatchTable(mm,e.code)}<div class="pane-pad small">${wkcSource(wkcEventSource(e.year))} / <a class="data-link" href="#/wkc/${e.year}">WKC大会一覧へ</a></div></details>`}).join('')}</section>`;
  }
  const wkcHistoricalYears=[1997,1994,1991,1988,1985,1982,1979,1976,1973,1970];
  const wkcHistoricalNav=(year)=>wkcHistoricalYears.map(y=>`<a href="#/wkc/${y}" class="${year===y?'active':''}">${y}年・第${wkcRecords.sources[y].edition}回</a>`).join('');
  function renderWkc(year){
    if(wkcHistoricalYears.includes(year)){
      const src=wkcEventSource(year);
      const podium=wkcRecords.podium.filter(r=>Number(r['大会年度'])===year);
      const categories=[...new Set(podium.map(r=>r['性別']+'|'+r['種別']))];
      const blocks=categories.map(key=>{
        const [g,k]=key.split('|');
        const pp=podium.filter(r=>r['性別']===g&&r['種別']===k);
        return `<section class="wkc-division"><h3 class="section-title">${esc(g)}・${esc(k)}</h3><div class="pane wkc-podium-group"><div class="pane-pad"><h4>FIK公式入賞記録</h4><p class="small muted">${year===1997&&k==='団体'?'1997年男子団体の1部。':year===1997&&k!=='個人'&&k!=='団体'?'1997年の特別区分。男子団体2部・女子国際選抜試合は通常の選手権優勝とは区別。':''}${year===1997&&(k==='個人'||k==='団体')?'入賞順位はA確定。日本選手の個人戦および男子団体1部の確認済み試合は以下の個別表に収録。取得技・本数・予選の試合別結果・団体本人実戦は未確認です。':year===1994||year===1991?'入賞順位はA確定。個別試合と日本の団体対戦は下部に一部収録（2巡調査済み）。技・本数・本人実戦は保留。':'入賞順位のみA確定。各回戦・個別対戦・得点・本人実戦は未確認です。'}</p></div><div class="table-wrap"><table><thead><tr><th>順位</th><th>${k.includes('個人')?'選手名':'国・地域'}</th></tr></thead><tbody>${pp.map(r=>`<tr><td>${esc(r['順位'])}</td><td>${wkcNames(r['選手または国地域'],r['選手ID'])}</td></tr>`).join('')}</tbody></table></div></div></section>`;
      }).join('');
      if(year===1994||year===1991){
        const histIndividuals=wkcRecords.individual.filter(m=>m.year===year);
        const histTeams=wkcRecords.team.filter(m=>m.year===year);
        const histEntrants=wkcRecords.japanIndividuals.filter(m=>m.year===year);
        const personBlocks=histEntrants.map(p=>`<details class="history-group" open><summary>${wkcNames(p.name,p.playerId)} (${esc(p.code)}) <span class="history-count">確認済み ${p.matchKeys.length}試合</span></summary>${wkcMatchTable(p.matchKeys.map(wkcFindMatch).filter(Boolean),p.code)}</details>`).join('');
        const teamTable=`<div class="table-wrap"><table><thead><tr><th>回戦</th><th>相手国</th><th>勝数（日本 - 相手）</th><th>根拠</th></tr></thead><tbody>${histTeams.map(t=>`<tr><td>${esc(t.round)}</td><td>${esc(t.opponent)}</td><td>${esc(t.playerWins)} - ${esc(t.opponentWins)}</td><td><a class="data-link" href="${esc(t.source)}" target="_blank" rel="noopener noreferrer">FIK公式結果表 ↗</a></td></tr>`).join('')}</tbody></table></div>`;
        return `${verifiedBanner}${pageHeader('WORLD KENDO CHAMPIONSHIPS','世界剣道選手権（WKC）','FIK公式の歴代入賞記録を第1回1970年まで収録。2021年の第18回大会は中止。')}<nav class="wkc-years" aria-label="WKC大会年度"><a href="#/wkc/2024">2024年・第19回</a><a href="#/wkc/2018">2018年・第17回</a><a href="#/wkc/2015">2015年・第16回</a><a href="#/wkc/2012">2012年・第15回</a><a href="#/wkc/2009">2009年・第14回</a><a href="#/wkc/2006">2006年・第13回</a><a href="#/wkc/2003">2003年・第12回</a><a href="#/wkc/2000">2000年・第11回</a>${wkcHistoricalNav(year)}</nav><p class="lead">${esc(src.date)} / ${esc(src.city)} / 第${src.edition}回。公式資料：${wkcSource(src)}</p><div class="stats">${statCard('公式入賞記録',podium.length,'枠','男女の競技区分は当時の大会に準拠')}${statCard('男子個人・確認済み試合',histIndividuals.length,'試合','日本選手の決勝T一部')}${statCard('日本団体の国別対戦',histTeams.length,'試合','男子団体決勝T')}${statCard('団体本人実戦',0,'枠','個人別の出場・勝敗は未確認')}</div><div class="privacy-banner"><strong>${year}年・2巡目終了：</strong>${esc(src.scope)} 世界選手権以外の国内ランキング・比較には算入しません。</div>${blocks}<section class="wkc-division"><h3 class="section-title">男子・個人戦（確認済みの対戦記録）</h3><div class="pane wkc-match-panel"><div class="pane-pad"><h4>日本選手${histEntrants.length}名・決勝トーナメント一部 ${histIndividuals.length}試合</h4><p class="small muted">FIK公式表の対戦者・赤い勝ち上がり線でA確定。予選試合別勝敗や中盤の未収録試合、技・本数・延長・反則は保留。</p></div>${personBlocks}</div></section><section class="wkc-division"><h3 class="section-title">男子・団体戦（国別対戦）</h3><div class="pane wkc-match-panel"><div class="pane-pad"><h4>日本の決勝トーナメント ${histTeams.length}対戦</h4><p class="small muted">FIK公式表の勝ち上がり線と勝数を確認。本人実戦および取得技・本数は未確認。</p></div>${teamTable}</div></section><div class="source-box"><strong>FIK公式一次資料：</strong> ${wkcSource(src)} / <a class="data-link" target="_blank" rel="noopener noreferrer" href="${esc(src.menIndividualBracket)}">男子個人結果表 ↗</a> / <a class="data-link" target="_blank" rel="noopener noreferrer" href="${esc(src.menTeamBracket)}">男子団体結果表 ↗</a><p class="small">${year}年は2巡目終了。未収録の回戦・取得技・団体本人実戦は保留し、年次総点検で新証拠が得られた場合のみ補完。</p></div>`;
      }
      const histIndividuals=year===1997?wkcRecords.individual.filter(m=>m.year===1997):[];
      const histTeams=year===1997?wkcRecords.team.filter(m=>m.year===1997):[];
      const histEntrants=year===1997?wkcRecords.japanIndividuals.filter(m=>m.year===1997):[];
      const video1970=year!==1970?'':`<section class="wkc-division"><h3 class="section-title">第1回大会の公式記録映像</h3><div class="pane"><div class="pane-pad"><p>全日本剣道連盟が1970年の16ミリ記録フィルムをデジタル化し公開。映像は日本武道館で行われた親善紅白試合・男子団体選手権の様子を収録し、大阪で行われた男子個人選手権の映像は収録されていません。</p><p><a class="data-link" href="${esc(src.officialVideoJa)}" target="_blank" rel="noopener noreferrer">全剣連公式記録映像（日本語） ↗</a> ／ <a class="data-link" href="${esc(src.officialVideoEn)}" target="_blank" rel="noopener noreferrer">英語版 ↗</a></p><p class="small muted">公式映像の公開元と収録範囲は確認済み。映像本編の試合場面・選手本人は未視認のため、個別試合の対戦・勝敗・取得技・本数・団体本人実戦には加算していません。</p></div></div></section>`;
      const detail1997=year!==1997?'':`<section class="wkc-division"><h3 class="section-title">男子・個人戦（確認済みの対戦記録）</h3><div class="pane wkc-match-panel"><div class="pane-pad"><h4>日本選手5名・決勝トーナメント一部 ${histIndividuals.length}試合</h4><p class="small muted">FIK公式の対戦組み合わせと勝ち上がり線からA確定。重複計上なし。予選の試合別勝敗・取得本数・技・延長・反則は未確認です。</p></div>${histEntrants.map(p=>`<details class="history-group" open><summary>${wkcNames(p.name,p.playerId)} (${esc(p.code)}) <span class="history-count">確認済み ${p.matchKeys.length}試合</span></summary>${wkcMatchTable(p.matchKeys.map(wkcFindMatch).filter(Boolean),p.code)}</details>`).join('')}</div></section><section class="wkc-division"><h3 class="section-title">男子・団体1部（国別対戦）</h3><div class="pane wkc-match-panel"><div class="pane-pad"><h4>日本の決勝トーナメント ${histTeams.length}対戦</h4><p class="small muted">FIK公式結果表と当時の全剣連大会報告で国別勝数を照合。個別選手の出場・技・取得本数は未確認。FIK図面の優勝国バナーには誤表記があるため、優勝順位はFIK公式大会一覧と全剣連記録を優先。</p></div><div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝数（日本 - 相手）</th><th>出典</th></tr></thead><tbody>${histTeams.map(t=>`<tr><td>${esc(t.round)}</td><td>${esc(t.opponent)}</td><td>${esc(t.playerWins)} - ${esc(t.opponentWins)}</td><td><a class="data-link" href="${esc(t.source)}" target="_blank" rel="noopener noreferrer">FIK公式表 ↗</a></td></tr>`).join('')}</tbody></table></div></div></section>`;
      return `${verifiedBanner}${pageHeader('WORLD KENDO CHAMPIONSHIPS','世界剣道選手権（WKC）','FIK公式の歴代入賞記録を第1回1970年まで収録。2021年の第18回大会は中止。')}<nav class="wkc-years" aria-label="WKC大会年度"><a href="#/wkc/2024">2024年・第19回</a><a href="#/wkc/2018">2018年・第17回</a><a href="#/wkc/2015">2015年・第16回</a><a href="#/wkc/2012">2012年・第15回</a><a href="#/wkc/2009">2009年・第14回</a><a href="#/wkc/2006">2006年・第13回</a><a href="#/wkc/2003">2003年・第12回</a><a href="#/wkc/2000">2000年・第11回</a>${wkcHistoricalNav(year)}</nav><p class="lead">${esc(src.date)} / ${esc(src.city)} / 第${src.edition}回。公式資料：${wkcSource(src)}</p><div class="stats">${statCard('公式入賞記録',podium.length,'枠','男子の正式種目、1997年の特別区分を分離')}${statCard('個別対戦の収録',year===1997?histIndividuals.length:0,'試合',year===1997?'男子個人戦の確認済み対戦':'この年度は未調査・未収録')}${year===1997?statCard('日本団体の国別対戦',histTeams.length,'試合','男子団体1部・国別勝数確認'):''}${statCard('団体本人実戦',0,'枠','出場登録と本人実戦は別管理')}</div><div class="privacy-banner"><strong>${src.secondPass||year===1997||year===1988||year===1985||year===1982||year===1979||year===1976?'第2巡目完了：':'第1巡目の対象：'}</strong>${esc(src.scope)} 世界選手権以外の国内ランキング・比較には算入しません。${year===1997?'1997年の女子はFIK公式の「女子国際選抜試合」であり2003年以降の正式女子団体とは別扱いです。':''}</div>${blocks}${video1970}${detail1997}<div class="source-box"><strong>FIK公式一次資料：</strong> ${wkcSource(src)}<p class="small">${year===1997?'1997年男子は確認済み8個人戦と3団体戦をA確定して部分収録。予選の個別対戦・取得技・本数や女子特別区分の本人実戦は未確認。1997年は2巡終了、残件は保留。':(year===1988?'1988年は2巡目終了。入賞記録のみ確定し、個別対戦・決勝オーダーは推測せず保留にしています。':(src.secondPass||[1985,1982,1979,1976].includes(year))?'入賞記録は2巡確認済み。個別の試合別対戦・得点・団体本人実戦は保留し、総点検で新しい公式資料が見つかった場合に再調査。':'入賞結果だけが確定しており、決勝戦の組み合わせ・準決勝の組み合わせ・その他の試合の勝敗を入賞順位から推測していません。第1巡目済み・個別対戦は保留。')}1997年男子団体2部および女子国際選抜各部門の記録は正式種目と混合しません。</p></div>`;
    }
    if(![2000,2003,2006,2009,2012,2015,2018,2024].includes(year))return notFound();
    const src=wkcEventSource(year),pod=wkcRecords.podium.filter(r=>Number(r['大会年度'])===year), team=wkcRecords.team.filter(r=>r.year===year), mm=wkcRecords.individual.filter(r=>r.year===year), people=wkcRecords.japanIndividuals.filter(r=>r.year===year);const partial2015=year===2015,partial2012=year===2012,partial2009=year===2009,partial2006=year===2006,partial2003=year===2003,partial2000=year===2000;
    const podiumTable=(g,kind)=>{
      // 2000 women's team was semi-official under FIK regulations: keep it a separate podium category.
      const officialKind=(year===2000&&g==='女子'&&kind==='団体')?'団体（準公式）':kind;
      const pp=pod.filter(r=>r['性別']===g&&r['種別']===officialKind);
      return `<div class="table-wrap"><table><thead><tr><th>順位</th><th>${kind==='個人'?'選手名':'国・地域'}</th></tr></thead><tbody>${pp.map(r=>`<tr><td>${esc(r['順位'])}</td><td>${wkcNames(r['選手または国地域'],r['選手ID'])}</td></tr>`).join('')}</tbody></table></div>`;
    };
    const teamTable=g=>{const tt=team.filter(t=>t.gender===g);return `<div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦国・地域</th><th>勝数（日本 - 相手）</th><th>本数（日本 - 相手）</th></tr></thead><tbody>${tt.map(t=>`<tr><td>${esc(t.round)}</td><td>${esc(t.opponent)}${[2000,2003,2006,2009,2012,2015].includes(t.year)?`<div class="tiny"><a class="data-link" href="${esc(t.source)}" target="_blank" rel="noopener noreferrer">${[2000,2003,2006,2009,2012].includes(t.year)?t.source?.includes('old2.kendo.or.jp')?'全剣連公式記事':'FIK公式表':t.scoreVerified?'全剣連公式動画':'FIK公式表'} ↗</a></div>`:t.scoreVerified===false?`<div class="tiny"><a class="data-link" href="${esc(t.source)}" target="_blank" rel="noopener noreferrer">FIK公式表 ↗</a></div>`:''}</td><td class="result win">${t.scoreVerified===false && !t.winsVerified?(t.resultLabel||'勝敗のみ確定'):`${t.playerWins} - ${t.opponentWins}`}</td><td>${t.scoreVerified===false?'未収録':`${t.playerPoints} - ${t.opponentPoints}`}</td></tr>`).join('')}</tbody></table></div>`};
    const teamBoutsPanel=g=>{
      const bb=wkcTeamBouts(year,g);
      if(!bb.length)return '';
      const rounds=['予選１','予選２','１回戦','２回戦','準決勝','決勝','決勝代表戦'].filter(r=>bb.some(b=>b.teamRound===r));
      return `<div class="pane wkc-match-panel"><div class="pane-pad"><h4>日本代表・団体戦の本人実戦（公式資料確認済み）</h4><p class="small muted">${g}は公式報告・現地記録映像などの一次資料から計${bb.length}人枠をA確認。2009年は「剣窓」記事で男子団体準決勝5人の順番・勝敗と決勝寺本大将の面・小手2本を確認。男子決勝の先鋒正代・次鋒木和田・中堅内村は「剣道日本」の試合記録映像で各対戦相手を確認し、「剣窓」の3連勝記述で勝敗を照合。本数・取得技は未確認。2012年男子決勝は5人の本人実戦と順番A確定。内村・正代・木和田・高鍋の勝敗は全剣連公式記事でA確定、次鋒勝見は未確認。全員の技・本数・相手氏名は未確認。2015年は各対戦の出場順・相手・勝敗・取得技を確認。2015年女子2回戦の本人実戦は未確認。反則・延長は未確認として保留。</p></div>${rounds.map(r=>{const mm=bb.filter(b=>b.teamRound===r).sort((a,b)=>a.order-b.order);return `<details class="history-group" open><summary>${esc(r)}・日本 対 ${esc(mm[0].teamOpponent)} <span class="history-count">${year===2003?'全剣連公式報告：代表戦の突き1本を確認':year===2009?'公式報告と原記録映像で出場・勝敗A（本数は一部のみ）':year===2012?'5人出場A・個人勝敗4人A':'5人の本人実戦・取得技 A確定'}</span></summary>${wkcTeamBoutsTable(mm)}</details>`}).join('')}</div>`;
    };
    const playersTable=g=>{
      const pp=people.filter(e=>e.gender===g);
      return pp.map(e=>{const mx=e.matchKeys.map(wkcFindMatch).filter(Boolean);return `<details class="history-group"><summary><span>${wkcNames(e.name,e.playerId)} <span class="muted small">(${esc(e.code)})</span> ${e.medal?badge(e.medal,'green'):''}</span><span class="history-count">${partial2015?`掲載${mx.length}試合（決勝T・予選一部）`:(partial2003||partial2006||partial2012||partial2009)?`掲載${mx.length}試合（部分収録）`:`${e.wins}勝${e.losses}敗 / ${mx.length}試合`}</span></summary>${wkcMatchTable(mx,e.code)}<div class="pane-pad small">${wkcSource(src)}</div></details>`}).join('');
    };
    const blocks=['男子','女子'].map(g=>`<section class="wkc-division"><h3 class="section-title">${g}・個人戦</h3><div class="wkc-podium-group pane"><div class="pane-pad"><h4>個人戦の入賞者</h4></div>${podiumTable(g,'個人')}</div><div class="pane wkc-match-panel"><div class="pane-pad"><h4>日本代表・個人戦の試合別結果</h4><p class="small muted">${partial2000?'2000年はFIK公式結果表から男女各5名の決勝T出場と準決勝・決勝6試合をA確定。予選個別実戦・決勝T前半・取得技・本数・延長は未収録。1巡目の部分収録。':partial2003?'2003年はFIK公式結果表から男女各5名の出場と確認済み決勝T18試合をA確定。すべての決勝T対戦を収録したものではありません。予選の本人別対戦・得点・技・延長は未収録。2巡終了、残件は保留。':partial2006?'2006年はFIK公式結果表の赤線で日本選手7名（男子3・女子4）の対戦23試合をA確定。女子は1回戦から決勝まで追跡し、男子は序盤と準決勝・決勝を部分収録。予選・男子中盤戦・得点・技・延長・反則は未確認。2巡終了につき残件は保留。':partial2009?'2009年はFIK公式の男女個人戦結果図と全剣連の大会報告を3巡照合。日本選手8名の予選・決勝トーナメントを計29試合部分収録。取得技までA確定は女子決勝1試合のみ。未掲載の予選・回戦、他28試合の取得技・延長は3巡終了につき後回しとし、全試合網羅ではありません（第94組、3巡目終了）。':partial2012?'2012年はFIK公式表で日本選手8名の出場と決勝T一部19試合（取得技Aは5試合）を確認。女子の１回戦表記を公式図面で修正し、２回戦１試合を追加。個人戦は3巡調査終了につき、残る予選・未収録回戦・技・延長は後回しです。':partial2015?'2015年はFIK公式決勝トーナメント表から日本選手の全回戦と、全剣連公式動画で確認できた予選の一部を掲載。取得技は公式動画で確認できた試合のみ表示します。未確認の予選試合は網羅済みとみなしません。':'選手名を開くと試合結果を確認できます。日本選手同士の試合は総件数に重複計上しません。'}</p></div>${playersTable(g)}</div><h3 class="section-title wkc-team-heading">${g}・${year===2000&&g==='女子'?'団体戦（準公式）':'団体戦'}</h3><div class="pane wkc-podium-group"><div class="pane-pad"><h4>${year===2000&&g==='女子'?'準公式団体戦の入賞国・地域':'団体戦の入賞国・地域'}</h4></div>${podiumTable(g,'団体')}</div><div class="pane wkc-match-panel"><div class="pane-pad"><h4>日本チームの団体対戦結果</h4><p class="small muted">${partial2000?'2000年男子団体・女子準公式団体の決勝Tで日本の国別4対戦ずつの勝利・勝数をFIK公式表で確認。女子団体は正式種目ではなく準公式。選手別の本人実戦・取得本数・技は未確認。':partial2003?'2003年はFIK公式勝ち上がり線から日本の男子・女子決勝T各4対戦の勝敗A。全剣連公式記事から男子決勝・代表戦栄花直輝の突き一本を確認。5試合の本人別出場順・勝数・本数は未確認。':partial2006?'2006年の団体はFIK公式勝ち上がり図から日本の決勝T男子3試合（2勝1敗）・女子4試合（4勝）を確認。各対戦の勝数・本数、選手別の本人実戦・取得技は未確認。':partial2009?'2009年はFIK公式決勝トーナメント表から日本の男女各4国別対戦の勝数だけA確認。得点本数は未収録。男子準決勝5人と決勝寺本大将は全剣連公式「剣窓」で確認し、男子決勝の先鋒・次鋒・中堅は全剣連「剣窓」で本人側の勝敗を確認。米国側の個別対戦者名は主催者一次資料では未確定のため保留。女子団体の本人実戦は未確認。':partial2012?'2012年はFIK公式表で決勝Tの国別8対戦をA確定。男子決勝は出場5人・順番を公式動画で確認し、全剣連「剣窓」の公式報告から4人の個人勝敗を確定（勝見は未確認）。全員の取得技・本数と女子の団体本人実戦は未収録です。':partial2015?'2015年は国別対戦10試合のうち9試合で全剣連公式動画の得点・本人実戦を確認。女子2回戦シンガポール戦の本人実戦・本数は未確認です。':'国別対戦の勝数・本数を確認できた範囲で表示。代表登録と本人の実戦を混同しません。'}</p></div>${teamTable(g)}</div>${(partial2003||partial2009||partial2012||partial2015)?teamBoutsPanel(g):''}</section>`).join('');
    return `${verifiedBanner}${pageHeader('WORLD KENDO CHAMPIONSHIPS','世界剣道選手権（WKC）','FIK・全剣連公式結果に基づき、国際大会の入賞結果と日本代表の試合結果を別集計で整理。第18回（2021年）は中止。')}<nav class="wkc-years" aria-label="WKC大会年度"><a href="#/wkc/2024" class="${year===2024?'active':''}">2024年・第19回</a><a href="#/wkc/2018" class="${year===2018?'active':''}">2018年・第17回</a><a href="#/wkc/2015" class="${year===2015?'active':''}">2015年・第16回</a><a href="#/wkc/2012" class="${year===2012?'active':''}">2012年・第15回</a><a href="#/wkc/2009" class="${year===2009?'active':''}">2009年・第14回</a><a href="#/wkc/2006" class="${year===2006?'active':''}">2006年・第13回</a><a href="#/wkc/2003" class="${year===2003?'active':''}">2003年・第12回</a><a href="#/wkc/2000" class="${year===2000?'active':''}">2000年・第11回</a>${wkcHistoricalNav(year)}</nav><p class="lead">${src.date} / ${esc(src.city)} / 第${src.edition}回。公式情報：${wkcSource(src)}</p><div class="stats">${statCard('個人・団体入賞枠',pod.length,'枠','男女個人・団体の各4枠')}${statCard('日本団体の対戦',team.length,'試合',partial2000?'男女各4対戦・勝数のみ':partial2003?'決勝T・国別勝敗のみ':partial2006?'決勝T・国別勝敗のみ':partial2009?'決勝Tの男女各4対戦・勝数のみ':partial2012?'決勝Tの男女各4対戦':partial2015?'予選一部＋決勝T':'男子7・女子7')}${statCard(partial2000||partial2003||partial2006||partial2009||partial2012||partial2015?'日本選手の個人戦・掲載試合':'日本選手個人の実戦',mm.length,'試合',partial2000?'1巡確認・決勝T一部':partial2003?'2巡確認・決勝T一部':partial2006?'2巡確認・決勝T部分収録':partial2009?'予選一部＋決勝T一部':partial2012?'決勝T一部':partial2015?'決勝T＋予選一部':'日本選手同士は1試合に統合')}${statCard(partial2000||partial2003||partial2006||partial2009||partial2012||partial2015?'個人戦出場を確認した日本選手':'詳細掲載の日本選手',people.length,'名',partial2000?'男女各5名':partial2003?'男女各5名':partial2006?'男子3名・女子4名':'男女各4名')}</div><div class="privacy-banner"><strong>集計の注意：</strong>${partial2000?'2000年はFIK公式で4種目入賞16枠・男子団体4対戦・女子準公式団体4対戦の勝者と勝数、男女各5名の個人戦決勝T出場・準決勝決勝6試合をA確定。女子団体は準公式で正式種目と区別。個人戦序盤と団体本人実戦は未確認。':partial2003?'2003年はFIK公式4種目入賞16枠・男女団体決勝T8対戦、男女各5名の個人戦出場と決勝T一部18試合をA確定。全剣連「剣窓」により男子団体決勝・代表戦の栄花直輝の突き一本を確認。個人戦の未収録対戦・予選個別試合、団体予選と通常5試合の本人実戦・勝数・本数は2巡終了で保留。':partial2006?'2006年はFIK公式の男女4種目の入賞16枠と日本団体決勝T7対戦の勝敗を確定。個人は出場7名・23試合の部分収録で、得点・技は未確認。団体の勝数・本数・選手別実戦・全日本代表登録名簿は未確認です。':partial2009?'2009年はFIK公式入賞16枠、日本団体決勝T8国別対戦（勝数のみ、本数未収録）、個人戦出場8名と予選・決勝T一部の29試合を収録（取得技までAは女子決勝1試合、個人3巡調査終了）。男子団体は全剣連公式報告による準決勝5人枠・決勝寺本1人枠を収録。代表20名の名簿と女子団体本人実戦、未掲載の予選・回戦は未確認です。':partial2012?'2012年は入賞16枠、日本選手個人戦出場8名・決勝T一部19試合の勝敗（うち取得技5試合）、団体決勝T8対戦の勝数・本数をA確認。男子団体決勝の5人については全剣連公式動画で実戦と順番のみA確認。4人の勝敗のみ公式報告でA確定済み。次鋒勝見の本人勝敗、個人得点、他の団体実戦、代表20名全員の登録名簿、予選・未掲載回戦は未確認です。':partial2015?'2015年は入賞結果16枠・日本代表登録20名を収録。日本選手の決勝トーナメント38試合と公式動画で確認した予選4試合の勝敗を収録し、うち全剣連公式動画25試合は取得技を掲載。団体戦は男子決勝T4試合、女子予選2試合・決勝T4試合の計10国別対戦を掲載。うち9試合は勝数・本数と本人実戦45人枠・取得技を全剣連公式動画からA確認。女子2回戦シンガポール戦の本人実戦や未確認の延長・反則は収録していません。個人技未確認17試合は3巡調査のため一時保留。':'日本選手の個人戦を全試合収録し、日本チームの団体対戦を別に収録。海外選手同士の個人戦・団体戦、団体の日本代表本人実戦は未収録。2024年の取消線付き予選1件は実戦から除外。'}全日本選手権のランキングや出場回数には加算しません。</div>${partial2015?`<section class="pane wkc-roster-panel"><div class="pane-pad"><h3 class="section-title">2015年 日本代表登録名簿（男女各10名）</h3><p class="small muted">代表登録と、個人戦・団体戦の本人実戦は別管理。個人戦の出場選手（各4名）は大会公式の決勝トーナメント表と照合済みです。未リンクの氏名は既存の選手IDを確認中です。</p><div class="wkc-roster-grid">${['男子','女子'].map(g=>`<section><h4>${g}</h4><ul>${wkcRecords.roster.filter(r=>r.year===2015&&r.gender===g).map(r=>`<li><span class="muted small">${esc(r.code)}</span> ${wkcNames(r.name,r.playerId)}${people.some(p=>p.gender===g&&p.code===r.code)?'<span class="wkc-roster-mark">個人戦出場</span>':''}</li>`).join('')}</ul></section>`).join('')}</div><p class="small"><a class="data-link" href="${esc(src.officialRoster)}" target="_blank" rel="noopener noreferrer">大会公式・日本代表登録名簿 ↗</a></p></div></section>`:''}${blocks}<div class="source-box"><strong>一次資料：</strong> ${wkcSource(src)}<p class="small">大会の個人戦・団体戦を混同せず、入賞・代表登録・団体の本人実戦を分離して管理。2009年は入賞16枠、団体決勝T8国別対戦の勝数、個人出場8名・予選と決勝Tの一部計29試合（女子決勝の面を取得技A確定、他28試合の取得技は3巡終了で保留）、男子団体本人実戦の準決勝5枠と決勝寺本1枠をA確認。国別・個人別の取得本数は未確認分を空欄に保持。2012年は入賞16枠・国別団体決勝T8対戦、個人出場8名・決勝T一部19試合（取得技5試合）をA確認。男子団体決勝の出場順5枠と4人の本人別勝敗A（技・本人得点未確認）。2003年WKCは公式記録から2巡終了の入賞・団体対戦・個人戦18試合（部分収録）と代表戦を収録。2000年WKCは公式資料の2巡照合で4種目入賞・日本団体8対戦・個人戦15試合（部分収録）を確認。女子団体はFIK公式の「準公式」扱い。1997〜1970年はFIK公式入賞記録の1巡目を済ませ、個別対戦は未収録。2015年は個人戦の決勝Tと予選の一部、団体戦の男子全4対戦・女子5対戦で確認済みの本人実戦計45人枠を収録。個人技17試合は3巡目終了で後回し、女子団体シンガポール戦は本人実戦未確認。</p></div>`;
  }
  function renderEvents(){return `${verifiedBanner}${pageHeader('TOURNAMENT DIRECTORY','大会データベース','国内大会を大会名ごとに整理。全日本選手権・都道府県対抗・東西対抗・全国警察選手権（個人戦）・全国警察大会（団体戦）・八段優勝大会・全国実業団大会の収録年度を検索できます。記録の範囲は各大会ページを参照。')}
    <div class="toolbar"><div class="field search"><label for="eventSearch">大会名・回次</label><input class="control" id="eventSearch" type="search" placeholder="例：第69回、女子" value="${esc(eventQuery)}"></div><div class="field"><label for="eventYear">大会年度</label><select id="eventYear" class="control">${['すべて',...[...new Set(domesticEntries().map(e=>String(e.year)))].sort((a,b)=>Number(b)-Number(a))].map(y=>`<option ${eventYear===y?'selected':''}>${y}</option>`).join('')}</select></div><div class="field"><label for="eventGender">区分</label><select id="eventGender" class="control">${['すべて','男子','女子','団体'].map(g=>`<option ${eventGender===g?'selected':''}>${g}</option>`).join('')}</select></div></div><div class="count-line"><span id="eventCount"></span><span>全日本選手権の2020年大会は2021年3月14日開催（延期開催）。</span></div><div class="pane" id="eventResults"></div>`;}
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
  const comparePlayersSorted=players.filter(p=>!p.tozaiOnly||window.KENDO_8DAN_UI.has(p.id)).sort((a,b)=>{
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
      <h3 class="section-title">過去の直接対戦（全日本選手権）</h3>
      ${meetings.length?`<p class="compare-meeting-summary">収録済み ${meetings.length}試合：${heading}</p><div class="compare-meeting-list">${rows}</div>`
        :'<p class="compare-meeting-empty">収録済みの公式試合記録では、2人の直接対戦は確認されていません。</p>'}
    </section>`;
  }
  function renderPoliceCompare(a,b){
    if(a.id===b.id)return '';
    const ds=policeIndividual.map(d=>({d,ms:d.matches.filter(m=>m.proof==='A'&&((m.a.id===a.id&&m.b.id===b.id)||(m.a.id===b.id&&m.b.id===a.id)))})).filter(x=>x.ms.length);
    if(!ds.length)return '';
    return `<section class="pane wide"><div class="pane-pad"><h3 class="section-title">過去の直接対戦（全国警察剣道選手権大会）</h3><p class="small muted">収録済みの本人照合済み対戦のみ。全日本選手権の集計には含めません。</p>${ds.map(({d,ms})=>`<h4><a class="data-link" href="#/police/${d.year}/${d.gender==='男子'?'men':'women'}">${d.year}年・${esc(d.gender)}</a></h4>${policeMatchTable(ms,a.id)}<p>${sourceLink(d.source,'公式結果')}</p>`).join('')}</div></section>`;
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
      ${renderPoliceCompare(a,b)}
      ${renderAokcCompareBlock(a,b)}
      ${window.KENDO_8DAN_UI.compare(a.id,b.id)}
      <div class="source-box"><strong>集計期間・注記</strong><p>全日本選手権（女子は全日本女子選手権）の出場回数・最高成績・勝利数・面／小手／胴／突きの取得本数・優勝回数・決勝進出回数は、男女とも<strong>${compareFrom}〜2026年</strong>の連続収録15大会を対象とします。2020年大会は2021年3月14日開催の延期大会で、2021年大会とは別に集計しています。</p><p>2011年男子の試合は集計に含めませんが、2人の直接対戦が確認できる場合は参考記録として表示します。技の確認が保留の試合は勝敗・勝利数を維持し、技別取得本数には加算しません。「直接対戦なし」は収録済み記録の範囲を示し、他大会での対戦がなかったことを意味しません。</p></div>`;
  }
  function renderUpdates(){return `${pageHeader('CHANGELOG','更新履歴','記録追加・表示改善・調査上の判断の履歴。古い項目は作業当時の記述であり、現在の集計範囲とは異なる場合があります。')}<div class="eyecatch"><strong>現在の集計方針：</strong>男女とも2012〜2026年の15大会を対象に比較。2011年男子は参考記録のみ。延長B77試合・技B2試合は未確認として扱います。</div><div class="pane">${visibleUpdates.map(u=>`<article class="update"><div class="update-date">${esc(u.date)}</div><div><div style="margin-bottom:7px">${badge(u.tag)}</div><h3>${esc(u.title)}</h3><p>${esc(u.desc)}</p></div></article>`).join('')}</div><div class="source-box"><strong>取り込み元：</strong><p>男子：${esc(meta.sourceMen)}</p><p>女子：${esc(meta.sourceWomen)}</p><p>元Excel本体は変更していません。今後Excelのデータを更新した場合は、再変換することでサイト側にも反映します。</p></div>`;}
  const notFound=()=>'<h2 class="heading">ページが見つかりません</h2><a href="#/" class="btn">ホームへ戻る</a>';
  function bindCompareButtons(){document.querySelectorAll('[data-compare-add]').forEach(btn=>{btn.onclick=()=>{compA=compB;compB=btn.dataset.compareAdd;if(compA===compB){compA=players.find(p=>p.id!==compB).id;}location.hash='#/compare';render()}})}

  // AOKC is separate from the All-Japan championship event records and WKC records.
  const aokcPLink=(r)=>r.playerId&&findP(r.playerId)?pLink(findP(r.playerId)):esc(r.name);
  const aokcRankOrder={'優勝':0,'準優勝':1,'3位':2,'敢闘賞':3};
  const aokcBoutName=(m,side)=>{const id=m[side+'Id'];return id&&findP(id)?pLink(findP(id)):esc(m[side]||'氏名未確認');};
  const aokcBoutWinner=(m)=>m.winnerId&&findP(m.winnerId)?pLink(findP(m.winnerId)):esc(m.winnerName||'未確認');
  const aokcBoutScore=(m)=>m.scoreVerified?esc(m.scoreVerified):'技・本数未確認';
  const aokcRoundOrder={'1回戦':1,'2回戦':2,'3回戦':3,'4回戦':4,'準決勝':5,'決勝':6};
  function aokcRankingRows(mode='all',metric='wins'){
    const d=aokcRecords;
    return ['男子','女子'].map(g=>{
      const rows=d.japanRoster.filter(p=>p.gender===g).map(p=>{
        const im=d.individualMatches.filter(m=>(m.playerAId===p.playerId||m.playerBId===p.playerId)&&m.isActualBout!==false&&!m.walkover);
        const tm=d.teamBouts.filter(m=>m.playerId===p.playerId&&m.isActualBout);
        const iw=im.filter(m=>m.winnerId===p.playerId).length,tw=tm.filter(m=>m.result==='勝ち').length;
        const pts=im.reduce((s,m)=>s+(m.playerAId===p.playerId?m.playerATech.length:m.playerBTech.length),0);
        const tpts=tm.reduce((s,m)=>s+m.playerPoints,0);
        const values={wins:[iw,tw],points:[pts,tpts],matches:[im.length,tm.length]};
        const pair=values[metric]||values.wins;
        return {name:p.name,id:p.playerId,value:mode==='individual'?pair[0]:mode==='team'?pair[1]:pair[0]+pair[1],iw,tw};
      }).filter(p=>p.value>0).sort((x,y)=>y.value-x.value||x.name.localeCompare(y.name,'ja'));
      let rank=0,lastValue=Infinity;
      return `<section class="pane" style="padding:18px"><h4>${esc(g)}（日本代表・記録確認済みのみ）</h4><div class="table-wrap"><table><thead><tr><th>順位</th><th>選手</th><th>${metric==='wins'?'勝利数':metric==='points'?'取得本数':'本人実戦数'}</th></tr></thead><tbody>${rows.map((v,i)=>{if(v.value!==lastValue){rank=i+1;lastValue=v.value;}return `<tr><td>${rank}位</td><td>${v.id&&findP(v.id)?pLink(findP(v.id)):esc(v.name)}</td><td>${v.value}</td></tr>`}).join('')||'<tr><td colspan="3">実績1以上の選手は未収録</td></tr>'}</tbody></table></div></section>`;
    }).join('');
  }
  function renderAokc(){
    const d=aokcRecords;
    const title=pageHeader('ASIA OCEANIA KENDO CHAMPIONSHIPS','アジア・オセアニア剣道選手権大会','第1回（2026年）・日本代表の個人戦と団体戦を、実戦・不戦勝・引き分けを区別して記録。全日本選手権と世界剣道選手権のランキングとは独立して集計。');
    const src=`<a class="data-link" href="${esc(d.sources['2026'].ajkf)}" target="_blank" rel="noopener noreferrer">全剣連公式結果 ↗</a> ／ <a class="data-link" href="${esc(d.sources['2026'].fik)}" target="_blank" rel="noopener noreferrer">FIK公式結果 ↗</a> ／ <a class="data-link" href="${esc(d.sources['2026'].officialTournament)}" target="_blank" rel="noopener noreferrer">大会公式トーナメント表 ↗</a> ／ <a class="data-link" href="${esc(d.sources['2026'].officialRoster)}" target="_blank" rel="noopener noreferrer">日本代表公式名簿 ↗</a>`;
    const ranks=['優勝','準優勝','3位','敢闘賞'];
    const indivCats=['男子個人戦・段位無制限','女子個人戦・段位無制限','男子個人戦・三段以下','女子個人戦・三段以下'];
    const indiv=indivCats.map(cat=>{
      const rows=d.individualMedals.filter(r=>r.category===cat).sort((a,b)=>aokcRankOrder[a.rank]-aokcRankOrder[b.rank]);
      return `<section class="pane wide" style="padding:20px"><h3 class="section-title">${esc(cat)}</h3><div class="table-wrap"><table><thead><tr><th>順位</th><th>選手</th><th>国・地域</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.rank)}</td><td>${aokcPLink(r)}</td><td>${esc(r.country)}</td></tr>`).join('')}</tbody></table></div></section>`;
    }).join('');
    const team=['男子','女子'].map(g=>{
      const ms=d.teamMedals.filter(r=>r.gender===g),aw=d.teamAwards.filter(r=>r.gender===g);
      return `<section class="pane" style="padding:20px"><h3 class="section-title">${esc(g)}団体戦</h3><div class="table-wrap"><table><thead><tr><th>順位</th><th>国・地域</th></tr></thead><tbody>${ms.map(r=>`<tr><td>${esc(r.rank)}</td><td>${esc(r.country)}</td></tr>`).join('')}</tbody></table></div><h4>団体戦・敢闘選手（順位・出場順とは別枠）</h4><p class="small">${aw.map(r=>esc(r.name)+'（'+esc(r.country)+'）').join(' ／ ')}</p></section>`;
    }).join('');
    const countryMatchRows=(d.teamCountryMatches||[]).map(m=>`<tr><td>${esc(m.gender)}</td><td>${esc(m.round)}</td><td>${esc(m.countryA)} 対 ${esc(m.countryB)}</td><td>${esc(m.winnerCountry)}</td><td>${esc(m.matchScore)}</td><td>${esc(m.ipponScore)}</td><td><a class="data-link" target="_blank" rel="noopener noreferrer" href="${esc(m.tonamelSource||m.source)}">公式試合記録 ↗</a></td></tr>`).join('');
    const countryMatchPanel=`<section class="pane" style="padding:20px"><h3 class="section-title">男女団体戦・国別の対戦記録（A確定）</h3><p class="small muted">日本代表の各4試合。国別の勝敗と本人実戦は別々に保存しています。マカオ戦の不戦勝2枠は実際の取得技には加算しません。</p><div class="table-wrap"><table><thead><tr><th>部門</th><th>回戦</th><th>対戦国</th><th>勝者</th><th>勝数</th><th>取得本数</th><th>根拠</th></tr></thead><tbody>${countryMatchRows}</tbody></table></div></section>`;
    const roster=['男子','女子'].map(g=>{
      const rows=d.japanRoster.filter(r=>r.gender===g);
      return `<section class="pane" style="padding:20px"><h3 class="section-title">${esc(g)}日本代表登録（9名）</h3><div class="table-wrap"><table><thead><tr><th>選手</th><th>公式表記</th><th>個人戦</th><th>団体本人実戦</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${aokcPLink(r)}</td><td>${esc(r.officialRoman)}</td><td>${r.individualEntered===true?'確認':'未確認'}</td><td>${r.teamBoutEntered===true?'確認':'未確認'}</td></tr>`).join('')}</tbody></table></div></section>`;
    }).join('');
    const bouts=d.individualMatches.map(m=>{
      return `<tr><td>${esc(m.category)}</td><td>${esc(m.round)}</td><td>${aokcBoutName(m,'playerA')} 対 ${aokcBoutName(m,'playerB')}</td><td>${aokcBoutWinner(m)}</td><td>${aokcBoutScore(m)}<span class="small muted"> ／ ${m.walkover?'不戦勝・実戦なし':m.overtimeStatus==='あり'?'延長あり':m.overtimeStatus==='なし'?'延長なし':'延長未確認'}</span></td><td><a class="data-link" href="${esc(m.tonamelSource||m.source)}" target="_blank" rel="noopener noreferrer">公式試合記録 ↗</a></td></tr>`;
    }).join('');
    const teams=d.teamBouts.map(m=>`<tr><td>${esc(m.gender)}</td><td>${esc(m.teamRound)}</td><td>${esc(m.position)}</td><td>${m.playerId&&findP(m.playerId)?pLink(findP(m.playerId)):esc(m.player)}</td><td>${esc(m.opponent||'相手不在')}</td><td>${esc(m.result)}</td><td>${m.walkover?'不戦勝相当2本・実戦0本':esc(m.playerTech.join('・')||'取得なし')+(m.opponentTech.length?' ／ 相手：'+esc(m.opponentTech.join('・')):'')}</td><td><a class="data-link" href="${esc(m.source)}" target="_blank" rel="noopener noreferrer">公式記録 ↗</a></td></tr>`).join('');
    const rankPanel=`<section class="pane" style="padding:20px"><h3 class="section-title">2026年AOKC 日本代表ランキング（試験版）</h3><p class="small muted">確認済みの日本選手の実績のみ。国別団体勝利は加算せず、団体は本人実戦を対象とします。不戦勝は別保存し、このランキングの勝利数・試合数・取得本数には含めません。値0は非表示。</p><label for="aokcRankMode">集計区分</label> <select id="aokcRankMode" aria-label="ランキング集計区分"><option value="individual">個人のみ</option><option value="all" selected>個人＋団体</option><option value="team">団体のみ</option></select> <label for="aokcRankMetric">指標</label> <select id="aokcRankMetric" aria-label="ランキング指標"><option value="wins">実戦勝利数</option><option value="points">実際の取得本数</option><option value="matches">試合数</option></select><div id="aokcRankRows" class="detail-grid">${aokcRankingRows()}</div></section>`;
    return `${verifiedBanner}${title}<p class="lead">2026年5月30日〜31日 ／ 東京武道館（東京都足立区）</p><div class="stats">${statCard('入賞・敢闘選手',d.individualMedals.length+d.teamMedals.length+d.teamAwards.length,'枠','個人32、団体順位8、団体敢闘選手8')}${statCard('日本選手団登録',d.japanRoster.length,'名','男子9・女子9。実戦とは別管理')}${statCard('個人戦の記録枠',d.individualMatches.length,'件','日本関連19記録枠（実戦18・不戦勝1）＋外国選手間1実戦')}${statCard('団体の国別対戦',(d.teamCountryMatches||[]).length,'試合','日本の男女各4試合')}${statCard('団体本人実戦',d.teamBouts.filter(b=>b.isActualBout).length,'件','別途不戦勝2枠・男女決勝の引き分け2件')}</div><div class="source-box"><strong>公式根拠</strong><p>${src}</p><p class="small muted">大会公式Tonamel対戦詳細を照合。日本選手の個人戦は18実戦＋高橋萌子の2回戦不戦勝1枠。高橋の○・○は大会公式配信での確認により不戦勝と判明し、実戦取得本数には加算しません。団体戦は男女各4国別対戦、40オーダー枠から38本人実戦と2不戦勝を分離。技のない得点表示○・○を実際の打突には加算しません。全日本選手権・WKCと大会の通算ランキングは混同しません。敢闘賞は審判主任の選考によるためベスト8敗者とは同一視しません。</p></div>${rankPanel}<div class="detail-grid">${indiv}${team}${roster}</div>${countryMatchPanel}<section class="pane" style="padding:20px"><h3 class="section-title">日本代表の団体・本人実戦／不戦勝の詳細</h3><div class="table-wrap"><table><thead><tr><th>部門</th><th>回戦</th><th>位置</th><th>日本選手</th><th>相手</th><th>勝敗</th><th>技・本数</th><th>根拠</th></tr></thead><tbody>${teams}</tbody></table></div></section><section class="pane" style="padding:20px"><h3 class="section-title">個人戦の実戦・不戦勝記録（公式確認済み）</h3><div class="table-wrap"><table><thead><tr><th>部門</th><th>回戦</th><th>対戦</th><th>勝者</th><th>技・本数</th><th>根拠</th></tr></thead><tbody>${bouts}</tbody></table></div></section>`;
  }
  // AOKC player histories use the same year-by-year accordion / match table as WKC.
  // Individual matches, actual team bouts, and walkovers remain separate records.
  const aokcRoundSort={'1回戦':1,'2回戦':2,'3回戦':3,'4回戦':4,'準決勝':5,'決勝':6};
  const aokcRecordSource=(url,label='大会公式Tonamel')=>url?`<a class="data-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`:'';
  const aokcScoreCell=(myTech,oppTech,walkover=false)=>walkover
    ?'<strong>—</strong><div class="tiny muted">実戦0本 ／ 公式2本</div>'
    :`<strong>${myTech.length} - ${oppTech.length}</strong><div class="tiny muted">${esc(myTech.join('・')||'—')} / ${esc(oppTech.join('・')||'—')}</div>`;
  const aokcIndividualPlayerRow=(m,p)=>{
    const isA=m.playerAId===p.id,oppName=isA?m.playerB:m.playerA,oppId=isA?m.playerBId:m.playerAId;
    const myTech=isA?(m.playerATech||[]):(m.playerBTech||[]),oppTech=isA?(m.playerBTech||[]):(m.playerATech||[]);
    const won=m.winnerId===p.id;
    const res=m.walkover?'不戦勝':won?'勝':'敗';
    const penaltyMe=won?Number(m.winnerPenaltyCount||0):Number(m.loserPenaltyCount||0);
    const penaltyThem=won?Number(m.loserPenaltyCount||0):Number(m.winnerPenaltyCount||0);
    const remarks=[m.walkover?'実戦なし':m.overtimeStatus==='あり'?'延長':m.overtimeStatus==='なし'?'':'延長未確認'].filter(Boolean);
    if(penaltyMe)remarks.push(`本人反則${penaltyMe}回`);
    if(penaltyThem)remarks.push(`相手反則${penaltyThem}回`);
    const opp=oppId&&findP(oppId)?pLink(findP(oppId)):`<strong>${esc(oppName||'相手未確認')}</strong>`;
    return `<tr><td>${esc(m.round)}</td><td>${opp}</td><td class="${won?'result win':'result'}">${res}</td><td>${aokcScoreCell(myTech,oppTech,Boolean(m.walkover))}</td><td>${esc(remarks.join('・'))}<div class="tiny">${aokcRecordSource(m.tonamelSource||m.source,'記録')}${m.walkover&&m.officialVideoEvidence?` / ${aokcRecordSource(m.officialVideoEvidence,'配信')}`:''}</div></td></tr>`;
  };
  const aokcTeamPlayerRow=b=>{
    const teamWin=b.result==='勝ち',res=b.walkover?'不戦勝':teamWin?'勝':b.result==='引き分け'?'引き分け':esc(b.result);
    const notes=[b.walkover?'実戦なし':b.overtimeStatus==='あり'?'延長':b.overtimeStatus==='なし'?'':'延長未確認'].filter(Boolean);
    if(b.opponentPenaltyCount)notes.push(`相手反則${b.opponentPenaltyCount}回`);
    return `<tr><td>${esc(b.teamRound)}<div class="tiny muted">${esc(b.position)}</div></td><td><strong>${esc(b.opponent||'相手不在')}</strong><div class="tiny muted">${esc(b.opponentCountry||'')}</div></td><td class="${teamWin?'result win':'result'}">${res}</td><td>${aokcScoreCell(b.playerTech||[],b.opponentTech||[],Boolean(b.walkover))}</td><td>${esc(notes.join('・'))}<div class="tiny">${aokcRecordSource(b.source,'記録')}</div></td></tr>`;
  };
  const aokcPlayerTable=(rows)=>`<div class="table-wrap"><table><thead><tr><th>回戦</th><th>対戦相手</th><th>勝敗</th><th>本数・取得技（本人 / 相手）</th><th>備考</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  function renderAokcPlayerHistory(p){
    const roster=aokcRecords.japanRoster.find(r=>r.playerId===p.id);
    const prizes=aokcRecords.individualMedals.filter(r=>r.playerId===p.id);
    const bouts=aokcRecords.individualMatches.filter(m=>m.playerAId===p.id||m.playerBId===p.id)
      .sort((a,b)=>a.year-b.year||(aokcRoundSort[a.round]||99)-(aokcRoundSort[b.round]||99));
    const team=aokcRecords.teamBouts.filter(m=>m.playerId===p.id)
      .sort((a,b)=>a.year-b.year||(aokcRoundSort[a.teamRound]||99)-(aokcRoundSort[b.teamRound]||99)||a.order-b.order);
    if(!roster&&!prizes.length&&!bouts.length&&!team.length)return '';
    const src=aokcRecords.sources[2026];
    const commonSource=`${aokcRecordSource(src.officialResults,'大会公式結果')} / ${aokcRecordSource(src.officialRoster,'日本代表名簿')}`;
    const overview=`<p class="small muted">2026年・第1回${roster?' ／ 日本選手団登録A確認':''}。日本代表登録、個人戦出場、団体本人実戦、不戦勝は区別して管理します。全日本選手権の通算成績には加算しません。</p>`;
    const indivWins=bouts.filter(m=>m.winnerId===p.id&&!m.walkover).length;
    const indivLoss=bouts.filter(m=>m.winnerId!==p.id&&!m.walkover).length;
    const indivWalks=bouts.filter(m=>m.walkover).length;
    const indivPrize=prizes.map(r=>`${esc(r.category)}・${esc(r.rank)}`).join(' ／ ');
    const indivSummary=`2026年・第1回 ${indivPrize?indivPrize+' ／ ':''}${indivWins}勝${indivLoss}敗${indivWalks?' ／ 不戦勝'+indivWalks+'件':''} <span class="history-count">${bouts.filter(m=>!m.walkover).length}実戦${indivWalks?'・不戦勝'+indivWalks+'枠':''}</span>`;
    const indivSection=(bouts.length||prizes.length)?`<section class="pane wide history-pane"><h3 class="section-title">アジア・オセアニア剣道選手権（AOKC）・個人戦</h3><p class="small muted">WKCと同じ試合別一覧。公式確認済みの結果・取得技だけ表示。不戦勝は実戦勝利や実戦取得本数には含めません。</p><details class="history-group" open><summary>${indivSummary}</summary>${bouts.length?aokcPlayerTable(bouts.map(m=>aokcIndividualPlayerRow(m,p)).join('')):'<p class="small muted pane-pad">入賞記録は確認済みですが、試合別の対戦記録は未収録です。</p>'}<div class="pane-pad small">${commonSource} / <a class="data-link" href="#/aokc">AOKC大会一覧へ</a></div></details></section>`:'';
    const actual=team.filter(b=>b.isActualBout),teamWins=actual.filter(b=>b.result==='勝ち').length;
    const teamDraws=actual.filter(b=>b.result==='引き分け').length,teamLosses=actual.filter(b=>b.result==='負け').length;
    const teamWalks=team.filter(b=>b.walkover).length;
    const teamSummary=`2026年・第1回 ${teamWins}勝${teamLosses}敗${teamDraws?'・'+teamDraws+'分':''}${teamWalks?' ／ 不戦勝'+teamWalks+'枠':''} <span class="history-count">${actual.length}実戦${teamWalks?'・不戦勝'+teamWalks+'枠':''}</span>`;
    const teamSection=team.length?`<section class="pane wide history-pane"><h3 class="section-title">アジア・オセアニア剣道選手権（AOKC）・団体本人実戦</h3><p class="small muted">国別の勝敗ではなく、本人が出場した試合の成績です。不戦勝はオーダー登録・公式勝利相当として別枠表示。引き分けも独立して記録しています。</p><details class="history-group" open><summary>${teamSummary}</summary>${aokcPlayerTable(team.map(aokcTeamPlayerRow).join(''))}<div class="pane-pad small">${commonSource} / <a class="data-link" href="#/aokc">AOKC大会一覧へ</a></div></details></section>`:'';
    const rosterOnly=roster&&!indivSection&&!teamSection?`<section class="pane wide history-pane"><h3 class="section-title">アジア・オセアニア剣道選手権（AOKC）</h3>${overview}<p class="small muted">日本選手団の登録のみ確認済みです。本人の出場試合は確認されていません。</p><p class="small">${commonSource} / <a class="data-link" href="#/aokc">AOKC大会一覧へ</a></p></section>`:'';
    return `${indivSection}${teamSection}${rosterOnly}`;
  }
  function renderAokcCompareBlock(a,b){
    const da=aokcRecords,rs=[a,b].map(p=>({roster:da.japanRoster.find(x=>x.playerId===p.id),prizes:da.individualMedals.filter(x=>x.playerId===p.id),individual:da.individualMatches.filter(m=>m.playerAId===p.id||m.playerBId===p.id),team:da.teamBouts.filter(m=>m.playerId===p.id)}));
    if(!rs.some(r=>r.roster||r.prizes.length||r.individual.length||r.team.length))return '';
    const fmt=(r,p)=>`${r.roster?'日本選手団登録／':''}${r.prizes.map(v=>v.category+' '+v.rank).join('・')} ／ 個人戦${r.individual.filter(x=>x.winnerId===p.id&&!x.walkover).length}実戦勝（${r.individual.filter(x=>!x.walkover).length}試合）・不戦勝${r.individual.filter(x=>x.walkover).length}件 ／ 団体本人実戦${r.team.filter(x=>x.isActualBout).length}試合・${r.team.filter(x=>x.result==='勝ち').length}勝・${r.team.filter(x=>x.result==='引き分け').length}分 ／ 不戦勝${r.team.filter(x=>x.walkover).length}枠`;
    const direct=da.individualMatches.filter(m=>[m.playerAId,m.playerBId].includes(a.id)&&[m.playerAId,m.playerBId].includes(b.id));
    return `<section class="pane" style="padding:20px"><h3 class="section-title">アジア・オセアニア選手権</h3><p><strong>${pLink(a)}</strong>：${esc(fmt(rs[0],a))}</p><p><strong>${pLink(b)}</strong>：${esc(fmt(rs[1],b))}</p>${direct.map(m=>`<p><strong>直接対決（${esc(m.year)}年・${esc(m.round)}）</strong>：${pLink(findP(m.winnerId))}が勝利、${pLink(findP(m.loserId))}が敗戦。${esc(m.scoreVerified||'得点不明')}。${m.walkover?'不戦勝・実戦なし':m.overtimeStatus==='あり'?'延長あり':m.overtimeStatus==='なし'?'延長なし':'延長未確認'}。 <a class="data-link" href="${esc(m.tonamelSource||m.source)}" target="_blank" rel="noopener noreferrer">公式試合記録 ↗</a></p>`).join('')}<p class="small muted">不戦勝は実戦勝利・取得技ランキングに含めません。<a class="data-link" href="#/aokc">大会全体を見る</a></p></section>`;
  }

  function render(){const hash=location.hash||'#/';const route=hash.slice(2).split('/');const key=route[0]||'';if(key==='player' && route[1] && playerIdAliases[route[1]] && playersById.has(playerIdAliases[route[1]])){location.replace('#/player/'+encodeURIComponent(playerIdAliases[route[1]]));return;}const activeKey=key==='player'?'players':['event','todo','todo2026','police','police-team','8dan','jitsugyodan'].includes(key)?'events':['wkc','aokc'].includes(key)?'japan':['8dan-ranking','jitsugyodan-ranking'].includes(key)?'rankings':key;const pageTitles={'':'ホーム',players:'選手名鑑',player:'選手プロフィール',events:'大会データベース',event:'大会詳細',todo:'都道府県対抗',police:'全国警察剣道選手権','police-team':'全国警察剣道大会（団体戦）','8dan':'八段優勝大会','jitsugyodan':'全国実業団剣道大会','8dan-ranking':'八段大会ランキング','jitsugyodan-ranking':'全国実業団剣道大会ランキング',japan:'日本代表',rankings:'記録・ランキング',wkc:'世界剣道選手権',aokc:'アジア・オセアニア選手権',todo2026:'都道府県対抗',compare:'選手比較',updates:'更新履歴'};
    document.getElementById('topTitle').textContent='剣道記録室 / '+(pageTitles[key]||'ページ');
    document.getElementById('desktopNav').innerHTML=nav.map(([url,icon,title])=>`<a class="nav-link ${url.slice(2)===(activeKey||'')?'active':''}" href="${url}"><span class="ico">${icon}</span>${title}</a>`).join('');
    document.getElementById('mobileNav').innerHTML=nav.map(([url,icon,title])=>`<a class="${url.slice(2)===(activeKey||'')?'active':''}" href="${url}"><span class="ico">${icon}</span>${title}</a>`).join('');
    const views={'':renderHome,players:renderPlayers,player:()=>renderPlayer(route[1]),events:renderEvents,event:()=>renderEvent(route[1]),todo:()=>renderTodoEdition(Number(route[1]),route[2]),police:()=>renderPolice(Number(route[1]),route[2]==='men'?'男子':'女子'),'police-team':()=>window.KENDO_POLICE_TEAM_UI.render(route[1],route[2]),'8dan':()=>window.KENDO_8DAN_UI.event(route[1]),'jitsugyodan':()=>window.KENDO_JITSUGYODAN_UI.render(),'8dan-ranking':()=>window.KENDO_8DAN_UI.ranking(),'jitsugyodan-ranking':()=>window.KENDO_JITSUGYODAN_RANKING.render(),japan:renderJapan,wkc:()=>renderWkc(Number(route[1])||2024),aokc:renderAokc,todo2026:renderTodo2026,rankings:renderRankings,compare:renderCompare,updates:renderUpdates};app.innerHTML=views[key]?views[key]():notFound();if(['wkc','aokc'].includes(key))app.insertAdjacentHTML('afterbegin',japanTabs(key));if(['event','todo','todo2026','police','police-team','8dan','jitsugyodan'].includes(key))app.insertAdjacentHTML('afterbegin','<p class="directory-back"><a class="data-link" href="#/events">← 大会データへ戻る</a></p>');
    if(key==='police-team')window.KENDO_POLICE_TEAM_UI.bind();
    if(key==='jitsugyodan'){const root=document.getElementById('jitsu-root');if(route[1])JP.load().then(()=>{if(root?.isConnected)window.KENDO_JITSUGYODAN_UI.bind(route,jitsuExists)}).catch(()=>{if(root?.isConnected)window.KENDO_JITSUGYODAN_UI.bind(route,jitsuExists)});else window.KENDO_JITSUGYODAN_UI.bind(route,jitsuExists);}
    if(key==='players'){const status=document.getElementById('jitsu-directory-status');if(!JP.ready()){status.textContent='実業団選手索引を読み込み中…';JP.load().then(()=>{if(status.isConnected){status.textContent='';playerCards()}}).catch(()=>{if(status.isConnected)status.textContent='実業団選手索引の読込に失敗しました。再表示してください。'});}playerCards();document.getElementById('playerSearch').addEventListener('input',e=>{playerQuery=e.target.value;unknownLimit=200;playerCards()});document.getElementById('playerGender').addEventListener('change',e=>{genderFilter=e.target.value;unknownLimit=200;playerCards()});document.getElementById('prefFilter').addEventListener('change',e=>{prefFilter=e.target.value;unknownLimit=200;playerCards()});document.getElementById('kanaIndex').addEventListener('click',e=>{const b=e.target.closest('[data-jump-kana]');if(b&&!b.disabled)jumpDirectory('kana-'+b.dataset.jumpKana);});document.getElementById('playerResults').addEventListener('click',e=>{const sub=e.target.closest('[data-jump-sub]');if(sub&&!sub.disabled)jumpDirectory('kana-sub-'+sub.dataset.jumpSub);if(e.target.closest('[data-back-kana]'))jumpDirectory('kanaIndex');if(e.target.closest('[data-jitsu-more]')){unknownLimit+=200;playerCards()}});}
    if(key==='events'){eventRows();document.getElementById('eventSearch').addEventListener('input',e=>{eventQuery=e.target.value;eventRows()});document.getElementById('eventGender').addEventListener('change',e=>{eventGender=e.target.value;eventRows()});document.getElementById('eventYear').addEventListener('change',e=>{eventYear=e.target.value;eventRows()})}
    if(key==='jitsugyodan-ranking')window.KENDO_JITSUGYODAN_RANKING.bind();
    if(key==='rankings'){app.insertAdjacentHTML('afterbegin','<p><a class="data-link" href="#/jitsugyodan-ranking">全国実業団剣道大会ランキング →</a></p><p><a class="data-link" href="#/8dan-ranking">八段優勝大会・優勝回数ランキング →</a></p>');rankingRows();document.getElementById('rankMetric').addEventListener('change',e=>{rankMetric=e.target.value;rankingRows()});document.getElementById('rankGender').addEventListener('change',e=>{rankGender=e.target.value;rankingRows()})}
    if(key==='aokc'){const update=()=>{const a=document.getElementById('aokcRankRows');if(a)a.innerHTML=aokcRankingRows(document.getElementById('aokcRankMode').value,document.getElementById('aokcRankMetric').value);};document.getElementById('aokcRankMode').addEventListener('change',update);document.getElementById('aokcRankMetric').addEventListener('change',update);}
    if(key==='compare')bindComparePickers();
    if(key==='8dan-ranking')bindCompareButtons();
    if(key==='player'){
      const id=canonicalPlayerId(route[1]);JP.bind(id,!findP(id),jitsuExists);
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
