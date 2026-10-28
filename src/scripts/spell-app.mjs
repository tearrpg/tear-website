import {byLevel,spellPath,collegePath,schoolPath,levelNumber,validDiagramPath} from './spell-model.mjs';
import spells from '../data/spellbook.json';
import {spellDiagrams} from '../data/spell-diagrams.mjs';
export function initSpellReference(){

const root=document.querySelector('[data-spell-root]');
if(!root)return;
const base=root.dataset.base;
const diagrams=spellDiagrams;
const initial=spells.find(s=>s.id===root.dataset.initialId)||spells[0];
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stat = (label,value) => '<div class="stat"><span class="stat-number">'+esc(value||'—')+'</span><span class="stat-label">'+esc(label)+'</span></div>';
const attrFor = {ritual:'CHR',scripted:'INT',sacrifice:'SPR'};
let method='sacrifice';
let selected=initial?.id ?? null;
let currentCollege=initial?.college ?? '';
let currentSchool=initial?.school ?? '';
const sorted = xs => [...xs].sort((a,b)=>a.localeCompare(b));
const unique = xs => sorted(new Set(xs));
const adapt = text => String(text ?? '').replace(/\bATR\b/g,attrFor[method]);
const fmt = text => esc(adapt(text)||'—');
const displayStat = (label,value) => '<div><span class="fact-label">'+esc(label)+'</span><span class="fact-value">'+fmt(value)+'</span></div>';
const geometryStat=(label,value,kind,s)=>{
  const path=diagrams[s.id]?.[kind];
  const body=validDiagramPath(path)
    ? '<button type="button" class="geometry-button" data-geometry="'+kind+'" aria-label="View selected '+label.toLowerCase()+' illustration">'+fmt(value)+' <span aria-hidden="true">◇</span></button>'
    : '<span class="fact-value">'+fmt(value)+'</span>';
  return '<div><span class="fact-label">'+esc(label)+'</span>'+body+'</div>';
};
const inSchool = () => byLevel(spells.filter(s=>s.college===currentCollege && s.school===currentSchool));

function navigateTo(spell) {
  if(!spell)return;
  window.location.assign(base+spellPath(spell));
}
function renderNavigation() {
  const collegeSelect=document.getElementById('college-filter');
  const colleges=unique(spells.map(s=>s.college));
  collegeSelect.replaceChildren();
  for(const college of colleges){
    const opt=document.createElement('option');opt.value=college;opt.textContent='College of '+college;
    collegeSelect.add(opt);
  }
  collegeSelect.value=currentCollege;
  const schoolHolder=document.getElementById('school-buttons');
  schoolHolder.replaceChildren();
  const schools=unique(spells.filter(s=>s.college===currentCollege).map(s=>s.school));
  for(const school of schools){
    const button=document.createElement('button');button.type='button';button.className='school-button';
    button.textContent=school;button.setAttribute('aria-pressed',String(school===currentSchool));
    button.addEventListener('click',()=>{
      currentSchool=school;
      const first=inSchool()[0];if(first)navigateTo(first);
    });
    schoolHolder.append(button);
  }
  const picker=document.getElementById('spell-select');picker.replaceChildren();
  let lastLevel=null,group=null;
  for(const spell of inSchool()){
    const label=Number.isFinite(levelNumber(spell))?'Level '+spell.level:'Unspecified level';
    if(label!==lastLevel){
      group=document.createElement('optgroup');group.label=label;picker.add(group);lastLevel=label;
    }
    const option=document.createElement('option');option.value=spell.id;option.textContent=spell.name;
    group.append(option);
  }
  picker.value=selected;
}
function renderSearch() {
  const q=document.getElementById('spell-search').value.trim().toLowerCase();
  const results=document.getElementById('search-results');
  results.replaceChildren();results.hidden=!q;
  if(!q)return;
  const matches=byLevel(spells.filter(s=>(s.name+' '+s.school+' '+s.college+' '+s.type).toLowerCase().includes(q)));
  if(!matches.length){
    const p=document.createElement('p');p.className='search-result-note';p.textContent='No matching spells.';results.append(p);return;
  }
  for(const spell of matches.slice(0,30)){
    const button=document.createElement('button');button.className='search-result';button.type='button';
    button.textContent=spell.name;
    const small=document.createElement('small');small.textContent=spell.college+' / '+spell.school;
    button.append(small);
    button.addEventListener('click',()=>navigateTo(spell));
    results.append(button);
  }
  if(matches.length>30){
    const p=document.createElement('p');p.className='search-result-note';
    p.textContent='Showing the first 30 results. Refine your search for more.';results.append(p);
  }
}
function renderSpell(){
  const s=spells.find(x=>x.id===selected);
  if(!s){document.getElementById('spell').textContent='No spells available.';return;}
  document.getElementById('crumb').innerHTML='<a href="'+base+'rules/spells/">Rules Reference</a> / <a href="'+base+'spells/">Spells</a> / '+esc(s.college)+' / '+esc(s.school);
  const methodButtons=[['ritual','Ritual'],['scripted','Scripted'],['sacrifice','Sacrifice']]
    .map(([key,label])=>'<button type="button" class="method-button" data-method="'+key+'" aria-pressed="'+String(key===method)+'">'+label+'</button>').join('');
  let fields=[];
  if(method==='ritual'){
    const m=/^(.*?)\s*\(([^)]*)\)\s*$/.exec(s.ritualTier);
    fields=[['Ritual Tier',m?m[1]:s.ritualTier],['Ritual Time',m?m[2]:'—']];
  }else if(method==='scripted'){
    fields=[['Base Preparation',s.scriptedPrep]];
  }else{
    fields=[['Fatigue',s.fatigue],['Additional Cost',s.additionalCost]];
  }
  const methodHtml=fields.map(([label,value])=>stat(label,adapt(value))).join('');
  const baseLevel=Number(s.level);
  const baseRow=Number.isInteger(baseLevel)&&baseLevel>0
    ? '<tr><td>'+baseLevel+'</td><td>Base spell: '+fmt(s.effect)+'</td></tr>' : '';
  const upgrades=[...(s.upgrades||[])].sort((a,b)=>Number(a.level)-Number(b.level));
  const upgradeRows=upgrades.map(u=>'<tr><td>'+esc(u.level)+'</td><td>'+fmt(u.text)+'</td></tr>').join('');
  const upgradeHtml=baseRow+upgradeRows
    ? '<table class="upgrades-table"><thead><tr><th>Level</th><th>Effect / Upgrade</th></tr></thead><tbody>'+baseRow+upgradeRows+'</tbody></table>'
    : '<p class="microcopy">No upgrades have been specified in the source yet.</p>';

  document.getElementById('spell').innerHTML=
    '<header><p class="eyebrow"><a href="'+base+collegePath(s.college)+'">'+esc(s.college)+'</a> / <a href="'+base+schoolPath(s.college,s.school)+'">'+esc(s.school)+'</a></p><h1>'+esc(s.name)+'</h1>'+
    '<p class="subhead">Minimum Level '+fmt(s.level)+' · '+fmt(s.type)+' · Element: '+fmt(s.element)+'</p>'+
    '<a class="catalog-link" href="'+base+spellPath(s)+'">Permanent link to this spell →</a></header>'+
    '<div class="artwork-slot" role="img" aria-label="Space reserved for future illustration of '+esc(s.name)+'">'+
    (s.artwork?'<img src="'+esc(s.artwork)+'" alt="Illustration of '+esc(s.name)+'">':'')+'</div>'+
    (s.incompleteFields?.length?'<p class="microcopy">Work in progress: some spell statistics are not yet specified.</p>':'')+
    '<div class="cost-grid" aria-label="Costs for all casting methods">'+stat('MP Cost · All methods',s.mp)+stat('AP Cost · All methods',s.ap)+'</div>'+
    '<div class="method-section"><p class="method-heading">Casting method</p>'+
    '<div class="method-switch" role="group" aria-label="Casting method">'+methodButtons+'</div>'+
    '<div class="method-specific">'+methodHtml+'</div></div>'+
    '<div class="fact-grid">'+geometryStat('Range',s.range,'range',s)+
      geometryStat('Area',s.area,'area',s)+displayStat('Target',s.target)+displayStat('Duration',s.duration)+
      displayStat('Save',s.save)+displayStat('Attack type',s.attackType)+
      displayStat('Sustain cost',s.sustainCost)+displayStat('Sustain range',s.sustainRange)+'</div>'+
    '<section class="section"><h2>Effect</h2><p class="effect">'+fmt(s.effect)+'</p></section>'+
    '<section class="section"><h2>Description</h2><p class="description">'+fmt(s.description)+'</p></section>'+
    '<section class="section"><h2>Upgrades</h2>'+upgradeHtml+'</section>';
  document.getElementById('spell').querySelectorAll('.method-button').forEach(b=>b.addEventListener('click',()=>{
    method=b.dataset.method;renderSpell();
  }));
  document.getElementById('spell').querySelectorAll('.geometry-button').forEach(b=>b.addEventListener('click',()=>openGeometry(b.dataset.geometry)));
}

const diagramDialog=document.getElementById('diagram-dialog');
const diagramImage=document.getElementById('diagram-image');
function openGeometry(kind){
  const s=spells.find(x=>x.id===selected);
  if(!s)return;
  const path=diagrams[s.id]?.[kind];
  if(!validDiagramPath(path))return;
  document.getElementById('diagram-title').textContent=s.name+' — '+(kind==='area'?'Area':'Range');
  document.getElementById('diagram-value').textContent=(kind==='area'?'Area: ':'Range: ')+(adapt(kind==='area'?s.area:s.range)||'Unspecified');
  diagramImage.hidden=false;
  diagramImage.src=base+path;
  diagramImage.alt='Selected '+(kind==='area'?'area':'range')+' illustration for '+s.name;
  document.getElementById('diagram-description').textContent='Illustration selected for this spell. Refer to the written rules for exact coverage.';
  diagramDialog.showModal();
}
document.getElementById('diagram-close').addEventListener('click',()=>diagramDialog.close());
diagramDialog.addEventListener('click',event=>{if(event.target===diagramDialog)diagramDialog.close();});
diagramImage.addEventListener('error',()=>{
  diagramImage.hidden=true;
  document.getElementById('diagram-description').textContent='This illustration is temporarily unavailable. Use the numerical spell statistics.';
});
document.getElementById('spell-search').addEventListener('input',renderSearch);
document.getElementById('college-filter').addEventListener('change',e=>{
  currentCollege=e.target.value;
  currentSchool=unique(spells.filter(s=>s.college===currentCollege).map(s=>s.school))[0]||'';
  navigateTo(inSchool()[0]);
});
document.getElementById('spell-select').addEventListener('change',e=>{
  navigateTo(spells.find(s=>s.id===e.target.value));
});
if(spells.length){renderNavigation();renderSearch();renderSpell();}
else{document.getElementById('spell').textContent='No spell data is available.';}

}
