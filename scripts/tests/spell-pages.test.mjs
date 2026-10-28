import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildSpellbook} from '../build-spellbook.mjs';
import {byLevel,slug,spellPath,collegePath,schoolPath,validDiagramPath} from '../../src/scripts/spell-model.mjs';
import {spellDiagrams} from '../../src/data/spell-diagrams.mjs';

const snapshot=JSON.parse(readFileSync(new URL('../snapshots/spellbook.values.json',import.meta.url),'utf8'));
const {spells,errors}=buildSpellbook(snapshot);

test('all published spells have stable, unique canonical URLs',()=>{
 assert.deepEqual(errors,[]);
 assert.equal(spells.length,148);
 assert.equal(new Set(spells.map(spellPath)).size,spells.length);
 assert(spells.every(s=>spellPath(s).startsWith('spells/')&&spellPath(s).endsWith('/')));
 const bolt=spells.find(s=>s.name==='Fire Bolt');
 assert(bolt);
 assert.equal(spellPath(bolt),'spells/'+bolt.id+'/');
});

test('College and School routes cannot collide in current source',()=>{
 const colleges=[...new Set(spells.map(s=>s.college))];
 const schools=[...new Set(spells.map(s=>s.college+'|'+s.school))].map(x=>x.split('|'));
 assert.equal(new Set(colleges.map(collegePath)).size,colleges.length);
 assert.equal(new Set(schools.map(([college,school])=>schoolPath(college,school))).size,schools.length);
 assert.equal(slug('Kinetics'),'kinetics');
});

test('spell ordering is by minimum level, then alphabetically',()=>{
 const sample=[
  {name:'Zed',level:'2'},
  {name:'Blank',level:''},
  {name:'Beta',level:'1'},
  {name:'Alpha',level:'1'},
  {name:'Gamma',level:'3'}
 ];
 assert.deepEqual(byLevel(sample).map(s=>s.name),['Alpha','Beta','Zed','Gamma','Blank']);
});

test('diagram assignments allow only local curated image files',()=>{
 assert(validDiagramPath('diagrams/cone-five-meters.png'));
 assert(validDiagramPath('diagrams/ranges/long-line.svg'));
 assert(!validDiagramPath('https://other.site/img.png'));
 assert(!validDiagramPath('../secrets.png'));
 assert(!validDiagramPath('diagrams/<script>.png'));
 for(const [id,assigned] of Object.entries(spellDiagrams)){
  assert(spells.some(s=>s.id===id),'Diagram assignment references a published spell: '+id);
  for(const kind of ['range','area'])
   if(assigned[kind]!=null)assert(validDiagramPath(assigned[kind]),id+' has valid '+kind+' image');
 }
});
