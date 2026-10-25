import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {convertSheet} from '../convert-spells.mjs';
const snapshot=JSON.parse(readFileSync(new URL('../snapshots/inertia.values.json',import.meta.url),'utf8'));
const {spells,diagnostics}=convertSheet(snapshot);
test('Inertia snapshot imports nine named spellblocks with no errors',()=>{
 assert.equal(spells.length,9);
 assert.deepEqual(diagnostics.filter(d=>d.severity==='error'),[]);
 assert.deepEqual(spells.map(x=>x.name),['Inertial Projectile Shield','Slow Fall','Inertial Brace','Inertial Suppression Field','Slow','Immovable Object','Stasis','Inertial Diffusion','Inertial Tether']);
});
test('nine spells have complete required casting fields and source addresses',()=>{
 const keys=['name','college','school','level','mp','ap','fatigue','scriptedPrep','ritualTier','effect','description'];
 for(const s of spells){
  for(const k of keys)assert.notEqual(s[k],'',s.name+': missing '+k);
  assert.equal(s.college,'Kinetics');assert.equal(s.school,'Inertia');assert.equal(s.source.sheet,'Inertia');
  assert(Number.isInteger(s.source.row));assert(Array.isArray(s.upgrades));
 }
 assert.equal(new Set(spells.map(s=>s.id)).size,9);
 assert.equal(spells[0].source.row,34);assert.equal(spells[8].source.row,266);
});
test('verbatim original descriptions and effects survive import',()=>{
 assert.equal(spells[0].description,snapshot.values[16][1].trim());
 assert.equal(spells[0].effect,snapshot.values[16][3].trim());
});
