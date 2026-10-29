import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spellArtwork} from '../../src/data/spell-artwork.mjs';
import managed from '../../src/data/managed-spell-artwork.json' with {type:'json'};

test('managed galleries merge without removing curated art',()=>{
  assert(spellArtwork['evocation-earth-bolt']);
  assert(spellArtwork['evocation-earth-bolt'].images.some(x=>x.id==='jade-saserna-2026'));
  assert(spellArtwork['evocation-earth-bolt'].images.find(x=>x.id==='jade-saserna-2026').artist==='Jade Saserna');
});
test('the managed artwork manifest is machine-readable',()=>{
  assert(managed && typeof managed==='object' && !Array.isArray(managed));
  for(const [id, gallery] of Object.entries(managed)){
    assert(gallery.images.some(x=>x.id===gallery.defaultId), 'Default exists for '+id);
  }
});
