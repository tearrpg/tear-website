import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('Apps Script artwork validator reads 148 spell IDs from the checked-in snapshot',()=>{
  const script=readFileSync('scripts/google-apps-script/artwork-publisher.gs','utf8');
  const snapshot=readFileSync('scripts/snapshots/spellbook.values.json');
  const paths=[];
  const context={
    Utilities:{
      base64Decode:s=>Buffer.from(s,'base64'),
      newBlob:bytes=>({getDataAsString:()=>Buffer.from(bytes).toString('utf8')})
    }
  };
  runInNewContext(script,context,{filename:'artwork-publisher.gs'});
  context.artGit_=(method,path)=>{
    paths.push(path);
    assert.equal(method,'GET');
    if(path.startsWith('/git/trees/'))return {
      truncated:false,
      tree:[{path:'scripts/snapshots/spellbook.values.json',type:'blob',sha:'test-blob'}]
    };
    if(path==='/git/blobs/test-blob')return {
      encoding:'base64',content:snapshot.toString('base64')
    };
    throw Error('Unexpected GitHub request: '+path);
  };
  const ids=context.artSpellIds_();
  assert.equal(ids.size,148);
  assert(ids.has('evocation-earth-bolt'));
  assert(ids.has('inertia-inertial-projectile-shield'));
  assert.equal(paths.length,2);
});

test('Apps Script validation feedback does not throw without a spreadsheet UI',()=>{
  const script=readFileSync('scripts/google-apps-script/artwork-publisher.gs','utf8');
  const messages=[];
  const context={
    console:{log:s=>messages.push(String(s))},
    SpreadsheetApp:{getUi:()=>{throw Error('Cannot call SpreadsheetApp.getUi() from this context');}}
  };
  runInNewContext(script,context,{filename:'artwork-publisher.gs'});
  assert.doesNotThrow(()=>context.artMessage_('No rows marked Ready'));
  assert(messages.some(x=>x.includes('No rows marked Ready')));
});
