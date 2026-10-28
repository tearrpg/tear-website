// Pure spell helpers shared by browser UI, static page generation and tests.
export const slug=value=>String(value??'').toLowerCase().normalize('NFKD')
  .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const levelNumber=spell=>{
  if(String(spell.level??'').trim()==='')return Number.POSITIVE_INFINITY;
  const n=Number(spell.level);
  return Number.isFinite(n)&&n>=0?n:Number.POSITIVE_INFINITY;
};
export const byLevel=list=>[...list].sort((a,b)=>
  levelNumber(a)-levelNumber(b)||a.name.localeCompare(b.name)
);
export const byName=list=>[...list].sort((a,b)=>a.name.localeCompare(b.name));
export const spellPath=spell=>'spells/'+encodeURIComponent(spell.id)+'/';
export const collegePath=college=>'spells/colleges/'+slug(college)+'/';
export const schoolPath=(college,school)=>'spells/schools/'+slug(college)+'/'+slug(school)+'/';
// Paths are strictly relative. They must not contain arbitrary URLs, queries or traversal.
export const validDiagramPath=path=>typeof path==='string'&&/^diagrams\/[a-z0-9][a-z0-9/_-]*\.(?:png|jpg|jpeg|webp|svg)$/i.test(path);
