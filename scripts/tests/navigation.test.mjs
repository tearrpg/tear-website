import test from 'node:test';
import assert from 'node:assert/strict';
import {species,facets,characterSteps,tourStops,libraryCategories,rulesCategories} from '../../src/data/site-map.mjs';

function assertUniqueSlugs(items,name){
  assert.ok(items.length>0,name+' contains entries');
  assert.equal(new Set(items.map(x=>x.slug)).size,items.length,name+' has no duplicate slugs');
  for(const entry of items) {
    assert.match(entry.slug,/^[a-z0-9-]+$/,name+' slugs can be used in URLs');
    assert.ok(entry.title||entry.name,name+' entries have labels');
  }
}
test('site map has stable IDs in each collection',()=>{
  for(const [name,items] of Object.entries({species,facets,characterSteps,tourStops,libraryCategories,rulesCategories})) assertUniqueSlugs(items,name);
});
test('homepage destinations have independent content sections',()=>{
  assert.equal(species.length,6);
  assert.deepEqual(species.map(s=>s.name),['Human','Tor','Dow','Zia','Azu','Vessel']);
  assert.deepEqual(characterSteps.map(s=>s.slug),['species','facets','attributes','skills','gear','finish']);
  assert.ok(rulesCategories.some(c=>c.slug==='spells'));
  assert.ok(rulesCategories.some(c=>c.slug==='equipment'));
  assert.ok(rulesCategories.some(c=>c.slug==='bestiary'));
  assert.ok(libraryCategories.some(c=>c.slug==='magic'));
  assert.ok(libraryCategories.some(c=>c.slug==='creatures'));
});
test('tour is navigable and facet entries match source index count',()=>{
  assert.ok(tourStops.length>=2);
  assert.equal(facets.length,9);
});
