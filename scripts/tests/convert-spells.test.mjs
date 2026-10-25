import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {convertSheet} from '../convert-spells.mjs';

const source = JSON.parse(readFileSync(new URL('./fixtures/inertia-sample.json',import.meta.url),'utf8'));

test('parses a labeled vertical spellblock and ignores empty templates',()=>{
 const {spells,diagnostics}=convertSheet(source);
 assert.equal(spells.length,1);
 assert.equal(diagnostics.length,0);
 assert.equal(spells[0].name,'Example Test Spell');
 assert.equal(spells[0].mp,'1');
 assert.equal(spells[0].ap,'2');
 assert.equal(spells[0].fatigue,'3');
 assert.equal(spells[0].ritualTier,'Quick (4 seconds)');
 assert.deepEqual(spells[0].upgrades,[{level:'2',text:'Synthetic level 2 upgrade.'}]);
 assert.deepEqual(spells[0].source,{sheet:'Inertia',row:34});
});
test('reports the precise cell with a missing required value',()=>{
 const copy=structuredClone(source);
 copy.values[2][3]=''; // Original cell D36: MP Cost value
 const {diagnostics}=convertSheet(copy);
 assert(diagnostics.some(x=>x.severity==='error'&&x.cell==='Inertia!D36'&&x.message.includes('mp')));
});
test('recognizes harmless label formatting changes and warns about legacy alias',()=>{
 const copy=structuredClone(source);
 copy.values[1][2]=' Spell: ';
 copy.values[2][2]='MP COST :';
 const {spells,diagnostics}=convertSheet(copy);
 assert.equal(spells[0].level,'1');
 assert.equal(spells[0].mp,'1');
 assert(diagnostics.some(x=>x.severity==='warning'&&x.cell==='Inertia!C35'));
 assert(!diagnostics.some(x=>x.severity==='error'));
});
test('refuses to treat two identically named entries as unique spells',()=>{
 const copy=structuredClone(source);
 copy.values.push(...source.values.slice(0,-1));
 const {spells,diagnostics}=convertSheet(copy);
 assert.equal(spells.length,2);
 assert(diagnostics.some(x=>x.severity==='error'&&x.message.includes('duplicate')));
});
test('invalid snapshot fails clearly',()=>{
 assert.throws(()=>convertSheet({sheet:'Inertia',startRow:34}),/Expected/);
});
