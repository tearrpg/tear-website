// Converts every eligible School in a read-only Sheets snapshot into static Astro data.
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {convertSheet} from './convert-spells.mjs';

const REQUIRED=['name','college','school','level','mp','ap','fatigue','scriptedPrep','ritualTier','effect','description'];
const slug=value=>String(value??'').toLowerCase().normalize('NFKD')
  .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const isMissing=d=>d.severity==='error'&&d.message.startsWith('Missing required ');

export function buildSpellbook(snapshot){
  if(!snapshot||!Array.isArray(snapshot.sheets))
    throw new Error('Expected a workbook snapshot containing a sheets array');
  const spells=[], warnings=[], errors=[], names=new Set(), ids=new Set();
  for(const sheet of snapshot.sheets){
    if(!sheet||typeof sheet.sheet!=='string'||!Array.isArray(sheet.values)){
      errors.push('Invalid School tab snapshot');continue;
    }
    if(names.has(sheet.sheet.toLowerCase())){
      errors.push('Duplicate School tab: '+sheet.sheet);continue;
    }
    names.add(sheet.sheet.toLowerCase());
    const parsed=convertSheet(sheet);
    for(const d of parsed.diagnostics){
      const message=d.cell+': '+d.message;
      if(isMissing(d)) warnings.push('INCOMPLETE '+message);
      else if(d.severity==='error'||d.message.includes('does not match tab')) errors.push(message);
      else warnings.push(message);
    }
    for(const spell of parsed.spells){
      const incompleteFields=REQUIRED.filter(field=>!spell[field]);
      const id=slug(sheet.sheet)+'-'+spell.id;
      if(ids.has(id)||!spell.id){
        errors.push('Duplicate or invalid spell identifier '+id);continue;
      }
      ids.add(id);
      spells.push({...spell,id,incompleteFields});
    }
  }
  return {spells,warnings,errors};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const input=process.argv[2]??'scripts/snapshots/spellbook.values.json';
  const output=process.argv[3]??'src/data/spellbook.json';
  const snapshot=JSON.parse(readFileSync(input,'utf8'));
  const result=buildSpellbook(snapshot);
  for(const message of result.warnings)console.warn('WARN '+message);
  if(result.errors.length||!result.spells.length){
    for(const message of result.errors)console.error('ERROR '+message);
    console.error('Refusing to generate spellbook due to errors or no named spells');
    process.exitCode=1;
  }else{
    mkdirSync(dirname(resolve(output)),{recursive:true});
    writeFileSync(output,JSON.stringify(result.spells,null,2)+'\n','utf8');
    console.log('Generated '+result.spells.length+' spells from '+snapshot.sheets.length+' School tabs ('+
      result.spells.filter(s=>s.incompleteFields.length).length+' incomplete entries).');
  }
}
