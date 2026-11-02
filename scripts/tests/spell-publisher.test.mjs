import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const script=readFileSync('integrations/google-apps-script/Code.gs','utf8');
const json=readFileSync('scripts/snapshots/spellbook.values.json','utf8');
const sha='297ae337e891a11cb98ebb4b79a1b3ea7c2b69b3';
const url='https://api.github.com/repos/tearrpg/tear-website/contents/scripts/snapshots/spellbook.values.json';
const blobUrl='https://api.github.com/repos/tearrpg/tear-website/git/blobs/'+sha;

test('spell publisher reads over-1MB snapshots via Git Blob API, not empty Contents payload',()=>{
  assert(Buffer.byteLength(json)>1024*1024);
  const calls=[];
  const context={
    Utilities:{
      base64Decode:s=>Buffer.from(s,'base64'),
      newBlob:bytes=>({getDataAsString:()=>Buffer.from(bytes).toString('utf8')})
    }
  };
  runInNewContext(script,context,{filename:'Code.gs'});
  context.tearGitHubRequest_=(method,path,token)=>{
    calls.push({method,path,token});
    if(path===url+'?ref=main')return {sha,encoding:'none',content:''};
    if(path===blobUrl)return {sha,encoding:'base64',content:Buffer.from(json).toString('base64')};
    throw Error('Unexpected request to '+path);
  };
  const result=context.tearExistingSnapshot_(url,'test-secret');
  assert.equal(result.sha,sha);
  assert.equal(result.snapshot.spreadsheetId,'18kR8W4xmUt_vSgri-JvJCjMppquKQeBsFidbtUyIrIQ');
  assert(result.snapshot.sheets.length>0);
  assert.deepEqual(calls.map(c=>c.path),[url+'?ref=main',blobUrl]);
});

test('spell publisher reports missing or broken blob data instead of obscure JSON errors',()=>{
  const context={
    Utilities:{
      base64Decode:s=>Buffer.from(s,'base64'),
      newBlob:bytes=>({getDataAsString:()=>Buffer.from(bytes).toString('utf8')})
    }
  };
  runInNewContext(script,context);
  context.tearGitHubRequest_=(method,path)=>{
    if(path===url+'?ref=main')return {sha,encoding:'none',content:''};
    return {sha,encoding:'base64',content:''};
  };
  assert.throws(()=>context.tearExistingSnapshot_(url,'test-secret'),/did not return the spell snapshot data/);
});
