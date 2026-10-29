import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {buildSpellbook} from '../build-spellbook.mjs';
import {validArtworkPath} from '../../src/scripts/spell-model.mjs';
import {spellArtwork} from '../../src/data/spell-artwork.mjs';

const snapshot=JSON.parse(readFileSync(new URL('../snapshots/spellbook.values.json',import.meta.url),'utf8'));
const {spells,errors}=buildSpellbook(snapshot);

test('all assigned artwork is local, credited and linked to a published spell',()=>{
  assert.deepEqual(errors,[]);
  const ids=new Set(spells.map(s=>s.id));
  for(const [spellId,gallery] of Object.entries(spellArtwork)){
    assert(ids.has(spellId),'Known spell id: '+spellId);
    assert(Array.isArray(gallery.images)&&gallery.images.length>0,'Images for '+spellId);
    assert(gallery.images.some(image=>image.id===gallery.defaultId),'Default illustration exists');
    assert.equal(new Set(gallery.images.map(image=>image.id)).size,gallery.images.length,'Unique illustration IDs');
    for(const image of gallery.images){
      assert(validArtworkPath(image.src),'Local artwork path');
      assert(existsSync('public/'+image.src)||existsSync(image.source||''),'Public image or original source exists: '+image.src);
      assert(image.artist?.trim(),'Artist credit exists: '+image.src);
      assert(image.alt?.trim(),'Artwork has accessible description: '+image.src);
    }
  }
});
test('Earth Bolt displays Jade Saserna as the credited illustrator',()=>{
  const gallery=spellArtwork['evocation-earth-bolt'];
  assert(gallery);
  assert.equal(gallery.images.find(i=>i.id===gallery.defaultId)?.artist,'Jade Saserna');
});
