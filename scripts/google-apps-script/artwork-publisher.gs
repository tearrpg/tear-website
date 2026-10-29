/** Tear Artwork Publisher (bound to the Tear Artwork Registry Google Sheet).
 * Store GITHUB_TOKEN in Apps Script > Project Settings > Script properties.
 * Do not put your token in a cell, a source file, or a chat message.
 */
const ARTWORK={
  tab:'Artwork',repo:'tearrpg/tear-website',branch:'main',
  manifest:'src/data/managed-spell-artwork.json',
  maxReady:10,maxBytes:20*1024*1024
};
function onOpen(){
  SpreadsheetApp.getUi().createMenu('Tear Artwork')
    .addItem('Validate Ready Artwork','validateArtworkRegistry')
    .addItem('Publish Ready Artwork','publishArtwork').addToUi();
}
function validateArtworkRegistry(){
  try{
    const rows=artRows_(),ready=rows.filter(x=>x.status==='Ready');
    if(!ready.length)return artMessage_('No artwork marked Ready. Change column K to Ready first.');
    artValidate_(rows,artSpellIds_());
    artFiles_(ready);
    artMessage_('Validation passed: '+ready.length+' image(s) ready to publish. Nothing was uploaded.');
  }catch(e){artError_(e);}
}
function publishArtwork(){
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(10000))return artMessage_('Another publish is running.');
  try{
    const rows=artRows_(),ready=rows.filter(x=>x.status==='Ready');
    if(!ready.length)return artMessage_('Nothing to publish. Mark row(s) Ready in column K.');
    if(ready.length>ARTWORK.maxReady)throw Error('Publish at most '+ARTWORK.maxReady+' Ready images per batch.');
    artValidate_(rows,artSpellIds_());
    const files=artFiles_(ready);
    const fileByRow=new Map(files.map(f=>[f.row,f]));
    const ref=artGit_('GET','/git/ref/heads/'+ARTWORK.branch);
    const parentSha=ref.object.sha;
    const parent=artGit_('GET','/git/commits/'+parentSha);
    const managed=JSON.parse(artGitText_(ARTWORK.manifest));
    if(!managed||typeof managed!=='object'||Array.isArray(managed))throw Error('Corrupt artwork manifest.');
    const entries=[];
    for(const row of ready){
      const asset=fileByRow.get(row.row);
      const key=row.contentId+'--'+row.artId;
      const source='artwork-source/spells/'+key+'.'+asset.ext;
      const src='art/spells/'+key+'.webp';
      const blob=artGit_('POST','/git/blobs',{
        content:Utilities.base64Encode(asset.file.getBlob().getBytes()),
        encoding:'base64'
      });
      entries.push({path:source,mode:'100644',type:'blob',sha:blob.sha});
      const group=managed[row.contentId]||{defaultId:row.artId,images:[]};
      if(!Array.isArray(group.images))throw Error('Corrupt gallery for '+row.contentId);
      group.images=group.images.filter(x=>x.id!==row.artId);
      group.images.push({
        id:row.artId,src,source,title:row.title,artist:row.artist,
        caption:row.caption,alt:row.alt,displayOrder:row.order
      });
      group.images.sort((a,b)=>(a.displayOrder||9999)-(b.displayOrder||9999)||a.id.localeCompare(b.id));
      if(row.defaultImage==='Yes'||!group.images.some(x=>x.id===group.defaultId))group.defaultId=row.artId;
      managed[row.contentId]=group;
    }
    entries.push({path:ARTWORK.manifest,mode:'100644',type:'blob',
      content:JSON.stringify(managed,null,2)+'\n'});
    const tree=artGit_('POST','/git/trees',{base_tree:parent.tree.sha,tree:entries});
    const commit=artGit_('POST','/git/commits',{
      message:'Publish '+ready.length+' artwork image(s) from Tear Artwork Registry',
      tree:tree.sha,parents:[parentSha]
    });
    // GitHub rejects non-fast-forward updates: do not overwrite simultaneous edits.
    artGit_('PATCH','/git/refs/heads/'+ARTWORK.branch,{sha:commit.sha,force:false});
    const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ARTWORK.tab);
    for(const row of ready)sheet.getRange(row.row,11).setValue('Published');
    SpreadsheetApp.flush();
    artMessage_(ready.length+' image(s) committed to GitHub. The Pages deployment is still pending.\n'+
      'https://github.com/'+ARTWORK.repo+'/commit/'+commit.sha);
  }catch(e){artError_(e);}
  finally{lock.releaseLock();}
}
function artRows_(){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ARTWORK.tab);
  if(!sh)throw Error('Missing sheet tab '+ARTWORK.tab);
  const all=sh.getDataRange().getValues(),head=all.shift().map(v=>String(v).trim());
  const names=['Content Type','Content ID','Artwork ID','Drive File URL',
    'Artwork Role','Artist Credit','Artwork Title','Caption','Alt Text',
    'Default Image','Publish Status','Display Order'];
  const col=Object.fromEntries(names.map(n=>{
    const i=head.indexOf(n);if(i<0)throw Error('Missing header: '+n);return [n,i];
  }));
  const str=(cells,name)=>String(cells[col[name]]||'').trim();
  return all.map((cells,i)=>({
    row:i+2,type:str(cells,'Content Type'),contentId:str(cells,'Content ID'),
    artId:str(cells,'Artwork ID'),driveUrl:str(cells,'Drive File URL'),
    role:str(cells,'Artwork Role'),artist:str(cells,'Artist Credit'),
    title:str(cells,'Artwork Title'),caption:str(cells,'Caption'),
    alt:str(cells,'Alt Text'),defaultImage:str(cells,'Default Image'),
    status:str(cells,'Publish Status'),order:Number(cells[col['Display Order']]||9999)
  })).filter(x=>x.status==='Ready'||x.status==='Published');
}
function artValidate_(rows,spellIds){
  const seen=new Set(),defaults=new Map();
  for(const r of rows){
    const label='Row '+r.row+': ';
    if(r.type!=='Spell'||r.role!=='Illustration')throw Error(label+'v1 supports Spell / Illustration only.');
    const slug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if(!slug.test(r.contentId)||!spellIds.has(r.contentId))
      throw Error(label+'unknown spell ID '+r.contentId);
    if(!slug.test(r.artId))throw Error(label+'invalid Artwork ID');
    if(!r.artist||!r.alt)throw Error(label+'Artist Credit and Alt Text are required.');
    if(!['Yes','No'].includes(r.defaultImage))throw Error(label+'Default Image must be Yes or No.');
    if(!Number.isFinite(r.order)||r.order<0)throw Error(label+'invalid Display Order');
    const key=r.contentId+'/'+r.artId;
    if(seen.has(key))throw Error(label+'duplicate ID '+key);
    seen.add(key);
    if(r.defaultImage==='Yes'){
      if(defaults.has(r.contentId))throw Error(label+'more than one default for '+r.contentId+
        '. Set the other to No (row '+defaults.get(r.contentId)+').');
      defaults.set(r.contentId,r.row);
    }
  }
  for(const r of rows.filter(x=>x.status==='Ready')){
    if(!defaults.has(r.contentId))throw Error('No Yes default for '+r.contentId);
  }
}
function artFiles_(ready){
  const mimes={'image/tiff':'tiff','image/png':'png',
    'image/jpeg':'jpg','image/webp':'webp'};
  return ready.map(r=>{
    const match=/^https:\/\/drive\.google\.com\/(?:file\/d\/|open\?id=)([A-Za-z0-9_-]{20,})(?:[/?#&].*)?$/.exec(r.driveUrl);
    if(!match)throw Error('Row '+r.row+': invalid Google Drive file link in column D');
    let file;
    try{file=DriveApp.getFileById(match[1]);}
    catch(e){throw Error('Row '+r.row+': cannot access the image in Google Drive');}
    const ext=mimes[file.getMimeType()];
    if(!ext)throw Error('Row '+r.row+': unsupported image format '+file.getMimeType());
    if(file.getSize()>ARTWORK.maxBytes)throw Error('Row '+r.row+': image exceeds 20 MB');
    return {row:r.row,file,ext};
  });
}
function artToken_(){
  const token=PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if(!token)throw Error('Set GITHUB_TOKEN under Apps Script > Project Settings > Script properties.');
  return token;
}
function artGit_(method,path,body){
  const opts={method:method.toLowerCase(),muteHttpExceptions:true,
    headers:{Authorization:'Bearer '+artToken_(),Accept:'application/vnd.github+json',
      'X-GitHub-Api-Version':'2022-11-28'}};
  if(body!==undefined){opts.contentType='application/json';opts.payload=JSON.stringify(body);}
  const result=UrlFetchApp.fetch('https://api.github.com/repos/'+ARTWORK.repo+path,opts);
  const code=result.getResponseCode();
  let data;
  try{data=JSON.parse(result.getContentText());}
  catch(e){throw Error('Unreadable GitHub response (HTTP '+code+')');}
  if(code<200||code>=300)throw Error('GitHub HTTP '+code+': '+(data.message||'request failed'));
  return data;
}
function artGitText_(path){
  const data=artGit_('GET','/contents/'+path+'?ref='+encodeURIComponent(ARTWORK.branch));
  if(data.encoding!=='base64')throw Error('Expected base64 file response: '+path);
  return Utilities.newBlob(Utilities.base64Decode(data.content.replace(/\s/g,'')))
    .getDataAsString('UTF-8');
}
function artSpellIds_(){
  const spells=JSON.parse(artGitText_('src/data/spellbook.json'));
  if(!Array.isArray(spells)||!spells.length)throw Error('Cannot read spell IDs from the website.');
  return new Set(spells.map(s=>s.id));
}
function artMessage_(msg){
  SpreadsheetApp.getUi().alert('Tear Artwork',msg,SpreadsheetApp.getUi().ButtonSet.OK);
}
function artError_(err){
  const message=String(err&&err.message||err);
  console.error(message);
  artMessage_('Publishing stopped or needs attention.\n\n'+message);
}
