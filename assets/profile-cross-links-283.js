'use strict';
/* Round 283: on-page navigation generated ONLY from sections already rendered
   for the current player. No new person identities, results or URL assertions. */
(function(){
  const style=document.createElement('style');
  style.textContent='.profile-crossnav-283{margin:16px 0 8px;padding:15px 18px;background:#fff;border:1px solid var(--line);border-radius:13px}.profile-crossnav-283 h3{font-size:15px;margin:0 0 8px}.profile-crossnav-283 p{font-size:11px;color:var(--muted);margin:0 0 12px}.profile-crossnav-items-283{display:flex;gap:8px;flex-wrap:wrap}.profile-crossnav-items-283 button{appearance:none;background:#f7f9fa;color:var(--navy);border:1px solid var(--line);border-radius:8px;font-weight:700;padding:9px 11px;font-size:12px;cursor:pointer;max-width:100%;text-align:left}.profile-crossnav-items-283 button:hover,.profile-crossnav-items-283 button:focus-visible{background:#eef5f7;border-color:#64889a;outline-offset:2px}.profile-crossnav-283 [data-nav-count]{font-weight:600;color:var(--muted);font-size:11px}';
  document.head.append(style);
  const kinds=[
    [/大会横断・所属県／代表県の履歴/,'所属県・代表県の履歴'],
    [/全日本(?:女子)?選手権・年度別成績/,'全日本選手権'],
    [/世界剣道選手権（WKC）・個人戦/,'WKC・個人戦'],
    [/世界剣道選手権（WKC）・団体本人実戦/,'WKC・団体本人実戦'],
    [/アジア・オセアニア剣道選手権（AOKC）・個人戦/,'AOKC・個人戦'],
    [/アジア・オセアニア剣道選手権（AOKC）・団体本人実戦/,'AOKC・団体本人実戦'],
    [/アジア・オセアニア剣道選手権（AOKC）$/,'AOKC・代表登録'],
    [/全日本都道府県対抗女子・年度別登録履歴/,'都道府県対抗・登録履歴'],
    [/全日本都道府県対抗・2026年登録/,'都道府県対抗・2026年登録'],
    [/2026年・本人実戦記録/,'都道府県対抗・2026年本人実戦'],
    [/2025年・(?:都道府県対抗女子\s*本人実戦|本人実戦記録)/,'都道府県対抗・2025年本人実戦'],
    [/全日本東西対抗剣道大会・本人対戦記録/,'東西対抗・本人実戦']
  ];
  function draw(){
    if(!/^#\/player\//.test(location.hash))return;
    const grid=document.querySelector('#app .profile-grid');
    if(!grid||document.querySelector('#app .profile-crossnav-283'))return;
    const sections=[...grid.children].filter(el=>el.matches('section'));
    const items=[];
    for(const section of sections){
      const title=section.querySelector('h3')?.textContent?.trim()||'';
      const match=kinds.find(([re])=>re.test(title));
      if(!match)continue;
      const id='profile-cross-283-'+items.length;
      section.id=id;items.push({id,label:match[1]});
    }
    if(items.length<2)return;
    const nav=document.createElement('nav');nav.className='profile-crossnav-283';
    nav.setAttribute('aria-label','選手ページの大会横断目次');
    const heading=document.createElement('h3');heading.textContent='この選手の収録記録へ移動';nav.append(heading);
    const note=document.createElement('p');note.textContent='このページに掲載された各記録への移動です。登録・本人実戦や公式確認の範囲は各欄の出典・注記を確認してください。表示されない大会は不出場を意味しません。';nav.append(note);
    const wrap=document.createElement('div');wrap.className='profile-crossnav-items-283';
    for(const item of items){
      const button=document.createElement('button');button.type='button';button.textContent=item.label;
      button.dataset.go=item.id;button.addEventListener('click',()=>{
        const target=document.getElementById(item.id);if(target){target.scrollIntoView({behavior:'smooth',block:'start'});}
      });wrap.append(button);
    }
    nav.append(wrap);grid.before(nav);
  }
  window.addEventListener('hashchange',draw);draw();
})();
