// Tear spellblock importer: accepts a JSON snapshot of a bounded Google Sheets range.
// It NEVER writes to the original spreadsheet. Only validated input produces output.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const LABELS = Object.freeze({
  college:'college', school:'school', 'minimum level':'level', spell:'level',
  element:'element', type:'type', 'mp cost':'mp', 'ap cost':'ap',
  'sustain cost':'sustainCost', 'attack type':'attackType',
  duration:'duration', save:'save', range:'range', 'sustain range':'sustainRange',
  target:'target', area:'area', 'sacrificial - fatigue':'fatigue',
  'sacrificial - additional cost':'additionalCost',
  'scripted - base preparation time':'scriptedPrep',
  'ritual - ritual tier':'ritualTier', description:'description', effect:'effect'
});
const REQUIRED = ['name','college','school','level','mp','ap','fatigue','scriptedPrep','ritualTier','effect','description'];
const clean = value => String(value ?? '').replace(/[\u200b-\u200d\ufeff]/g,'').trim();
const labelKey = value => clean(value).replace(/[—–]/g,'-').replace(/:\s*$/,'').replace(/\s+/g,' ').trim().toLowerCase();
const slugify = value => clean(value).normalize('NFKD').toLowerCase()
  .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

export function convertSheet(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.values) || !Number.isInteger(snapshot.startRow) || !snapshot.sheet)
    throw new Error('Expected {sheet, startRow, values} from a bounded Google Sheets range');
  const { values, startRow, sheet } = snapshot;
  const spells = [], diagnostics = [], ids = new Set();
  const report = (severity, row, col, message) => diagnostics.push({
    severity, cell: sheet + '!' + 'ABCD'[col] + row, message
  });
  const starts = [];
  for (let i=0; i<values.length; i++)
    if (labelKey(values[i]?.[0]) === 'spell name') starts.push(i);

  for (let block=0; block<starts.length; block++) {
    const start = starts[block], end = starts[block+1] ?? values.length;
    const top = startRow + start;
    const name = clean(values[start]?.[1]);
    if (!name) continue; // Explicitly blank templates are NOT publishable spells.
    const id = slugify(name);
    const item = {
      id, name, college:'', school:'', level:'', element:'', type:'',
      mp:'', ap:'', fatigue:'', sustainCost:'', attackType:'', save:'',
      duration:'', range:'', sustainRange:'', target:'', area:'',
      additionalCost:'', scriptedPrep:'', ritualTier:'', effect:'',
      description:'', upgrades:[], source:{sheet, row:top}
    };
    if (!id || ids.has(id))
      report('error', top, 1, 'Invalid or duplicate spell ID for "' + name + '"');
    ids.add(id);
    const positions = {name:{row:top,col:1}};
    for (let i=start+1; i<end; i++) {
      for (const col of [0,2]) {
        const label = clean(values[i]?.[col]);
        if (!label) continue;
        const key = labelKey(label), value = clean(values[i]?.[col+1]);
        if (key === 'cast level' || key === 'casting methods') continue;
        const upgrade = /^level\s+(\d+)$/.exec(key);
        if (upgrade) {
          if (value) item.upgrades.push({level:upgrade[1], text:value});
          continue;
        }
        const field = LABELS[key];
        if (!field) {
          report('warning',startRow+i,col,'Unrecognized field label "'+label+'"');
          continue;
        }
        positions[field] = {row:startRow+i,col:col+1};
        if (key === 'spell')
          report('warning',startRow+i,col,'Legacy label "Spell"; expected "Minimum Level"');
        if (item[field] && value && item[field] !== value) {
          report('error',startRow+i,col+1,'Conflicting values for '+field);
        } else if (value) {
          item[field] = value;
        }
      }
    }
    for (const field of REQUIRED) {
      if (!item[field]) {
        const pos = positions[field] ?? {row:top,col:1};
        report('error',pos.row,pos.col,'Missing required '+field+' for "'+name+'"');
      }
    }
    if (item.school && labelKey(item.school) !== labelKey(sheet))
      report('warning',top,1,'School "'+item.school+'" does not match tab "'+sheet+'"');
    spells.push(item);
  }
  return {spells, diagnostics};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath) {
    console.error('Usage: npm run import:spells -- source-snapshot.json output.json');
    process.exitCode = 2;
  } else {
    const snapshot = JSON.parse(readFileSync(inputPath,'utf8'));
    const {spells, diagnostics} = convertSheet(snapshot);
    for (const x of diagnostics)
      console.error(x.severity.toUpperCase() + ' ' + x.cell + ': ' + x.message);
    const errors = diagnostics.filter(x => x.severity === 'error');
    if (errors.length) {
      console.error('Import aborted: ' + errors.length + ' error(s). No output written.');
      process.exitCode = 1;
    } else {
      writeFileSync(outputPath,JSON.stringify(spells,null,2)+'\n','utf8');
      console.log('Imported '+spells.length+' spells from '+snapshot.sheet+' to '+outputPath);
    }
  }
}
