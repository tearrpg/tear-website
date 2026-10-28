// Run after astro build; ensures every generated canonical spell URL exists.
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {slug,spellPath,collegePath,schoolPath} from '../src/scripts/spell-model.mjs';

const spells=JSON.parse(readFileSync('src/data/spellbook.json','utf8'));
if(!Array.isArray(spells)||!spells.length)throw new Error('No generated spells to verify');
const colleges=new Set(spells.map(s=>s.college));
const schools=new Set(spells.map(s=>s.college+'\u0000'+s.school));

const expected=[
  'spells/index.html',
  'spells/colleges/index.html',
  ...spells.map(s=>spellPath(s)+'index.html'),
  ...[...colleges].map(college=>collegePath(college)+'index.html'),
  ...[...schools].map(value=>{
    const [college,school]=value.split('\u0000');
    return schoolPath(college,school)+'index.html';
  })
];

if(new Set(expected).size!==expected.length)throw new Error('Some generated URLs collide');
const missing=expected.filter(path=>!existsSync(resolve('dist',path)));
if(missing.length)throw new Error('Missing generated pages: \n'+missing.slice(0,20).join('\n'));
console.log('Verified '+spells.length+' individual spell pages, '+colleges.size+' College pages, '+schools.size+' School pages and indexes.');
