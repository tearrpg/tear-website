// Builds the public WebP artwork from original image files committed by Apps Script.
// The Google Drive folder remains private; no original file links appear in the site.
import {mkdir,readFile,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {buildSpellbook} from './build-spellbook.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const published=JSON.parse(await readFile(resolve(root,'src/data/managed-spell-artwork.json'),'utf8'));
const snapshot=JSON.parse(await readFile(resolve(root,'scripts/snapshots/spellbook.values.json'),'utf8'));
const {spells,errors}=buildSpellbook(snapshot);
if(errors.length)throw Error('Spell data failed validation: '+errors.join('; '));
const valid=new Set(spells.map(s=>s.id));
const source=/^artwork-source\/spells\/[a-z0-9-]+\.(?:tiff?|png|jpe?g|webp)$/;
const target=/^art\/spells\/[a-z0-9-]+\.webp$/;
const tasks=[];
for(const [spellId,gallery] of Object.entries(published)){
  if(!valid.has(spellId))throw Error('Artwork targets unknown spell '+spellId);
  if(!Array.isArray(gallery.images)||!gallery.images.length)throw Error('Empty artwork gallery: '+spellId);
  if(!gallery.images.some(x=>x.id===gallery.defaultId))throw Error('Gallery lacks selected default: '+spellId);
  for(const image of gallery.images){
    if(!source.test(image.source)||!target.test(image.src))throw Error('Unsafe artwork path for '+spellId);
    if(!image.artist||!image.alt||!image.id)throw Error('Incomplete artwork credit for '+spellId);
    const input=resolve(root,image.source),output=resolve(root,'public',image.src);
    // Source/target paths have been checked above and cannot escape the repository.
    await stat(input);
    await mkdir(dirname(output),{recursive:true});
    // Keep original proportions. Sharp handles TIFF, PNG, JPEG and WebP inputs.
    tasks.push(sharp(input).rotate().resize({width:1080,height:1080,fit:'inside',withoutEnlargement:true})
      .webp({quality:85,effort:4}).toFile(output));
  }
}
await Promise.all(tasks);
console.log('Prepared '+tasks.length+' managed artwork image(s).');
