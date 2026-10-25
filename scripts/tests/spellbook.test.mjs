import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildSpellbook} from '../build-spellbook.mjs';
const snapshot=JSON.parse(readFileSync(new URL('../snapshots/spellbook.values.json',import.meta.url),'utf8'));

test('all current School tabs are discovered and parsed',()=>{
 const {spells,errors}=buildSpellbook(snapshot);
 assert.deepEqual(errors,[]);
 assert.equal(snapshot.sheets.length,9);
 assert.equal(spells.length,148);
 assert.equal(new Set(spells.map(s=>s.id)).size,148);
 assert.equal(new Set(spells.map(s=>s.school)).size,8); // Materiokinesis is currently empty.
 assert(spells.some(s=>s.name==='Inertial Projectile Shield'));
 assert(spells.some(s=>s.name==='Dancing Weapon'));
 assert(spells.some(s=>s.name==='Phantom Burst'));
 assert(spells.some(s=>s.name==='Fire Bolt'));
});

test('work-in-progress spells are included and marked as incomplete instead of invented',()=>{
 const {spells,warnings}=buildSpellbook(snapshot);
 const drafts=spells.filter(s=>s.incompleteFields.length);
 assert.equal(drafts.length,5);
 assert(drafts.some(s=>s.name==='Phantom Burst'&&s.incompleteFields.includes('mp')));
 assert(warnings.some(s=>s.includes('Phantom Burst')));
 assert(spells.every(s=>s.source.sheet===s.school));
});

test('new School tabs require no hardcoded importer configuration',()=>{
 const synthetic={sheet:'New School',startRow:34,values:[
  ['Spell Name','Test of New School'],
  ['College:','Genesis','Minimum Level:','1'],
  ['School:','New School','MP Cost:','1'],
  ['', '', 'AP Cost:','1'],
  ['Sacrificial — Fatigue:','2'],
  ['Scripted — Base Preparation Time:','5 minutes'],
  ['Ritual — Ritual Tier:','Quick (4 seconds)'],
  ['Description:','Test-only description','Effect:','Test-only effect']
 ]};
 const {spells,errors}=buildSpellbook({sheets:[...snapshot.sheets,synthetic]});
 assert.deepEqual(errors,[]);
 assert.equal(spells.length,149);
 assert(spells.some(s=>s.id==='new-school-test-of-new-school'));
});

test('wrong school labels and duplicate tab names fail safely',()=>{
 const copied=structuredClone(snapshot.sheets[0]);
 const result=buildSpellbook({sheets:[snapshot.sheets[0],copied]});
 assert(result.errors.some(x=>x.includes('Duplicate School tab')));
});
