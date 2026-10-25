/**
 * Tear website: manual spell publishing for the source Google Sheet.
 * Installation: Extensions > Apps Script (in RPG Project Spells).
 * Store a fine-grained GitHub token as a Script Property named GITHUB_TOKEN.
 * The code deliberately contains no credentials.
 */
const TEAR_REPO = 'tearrpg/tear-website';
const TEAR_SNAPSHOT_PATH = 'scripts/snapshots/spellbook.values.json';
const TEAR_EXCLUDED_TABS = ['Magic Overview', 'Blank', 'Data Validation', 'Old Blank'];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Tear Website')
    .addItem('Publish spell updates', 'publishTearSpells')
    .addToUi();
}

function tearLabel_(value) {
  return String(value || '').replace(/[\u200b-\u200d\ufeff]/g, '').trim().replace(/:\s*$/, '').toLowerCase();
}

function tearSourceSnapshot_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = [];
  let namedSpellCount = 0;
  for (const tab of book.getSheets()) {
    const name = tab.getName();
    if (tab.isSheetHidden() || TEAR_EXCLUDED_TABS.indexOf(name) >= 0 ||
        /^\(Old\)/i.test(name) || tab.getMaxRows() < 34) continue;
    const last = Math.max(34, tab.getLastRow());
    const values = tab.getRange(34, 1, last - 33, 4).getDisplayValues();
    const blockStarts = [];
    for (let i = 0; i < values.length; i++) {
      if (tearLabel_(values[i][0]) === 'spell name') blockStarts.push(i);
    }
    if (!blockStarts.length) continue; // New administrative tabs are ignored.
    const lastBlock = blockStarts[blockStarts.length - 1];
    const relevantRows = values.slice(0, Math.min(values.length, lastBlock + 29));
    for (const index of blockStarts) {
      const spellName = String(values[index][1] || '').trim();
      if (!spellName) continue; // Empty spell templates do not count.
      namedSpellCount++;
      const end = Math.min(values.length, index + 12);
      const school = values.slice(index + 1, end).find(row => tearLabel_(row[0]) === 'school');
      if (school && String(school[1]).trim().toLowerCase() !== name.toLowerCase()) {
        throw new Error('Spell "' + spellName + '" has School "' + school[1] +
                        '" but is in tab "' + name + '". Correct the spreadsheet before publishing.');
      }
    }
    sheets.push({
      sheet: name,
      startRow: 34,
      endRow: 33 + relevantRows.length,
      values: relevantRows
    });
  }
  if (namedSpellCount === 0) throw new Error('No named spells found. Nothing was published.');
  return { snapshot: { spreadsheetId: book.getId(), sheets: sheets },
           spells: namedSpellCount, tabs: sheets.length };
}

function tearGitHubRequest_(method, url, token, payload) {
  const request = {
    method: method,
    muteHttpExceptions: true,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  };
  if (payload) {
    request.contentType = 'application/json';
    request.payload = JSON.stringify(payload);
  }
  const response = UrlFetchApp.fetch(url, request);
  const status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    let message = 'HTTP ' + status;
    try { message += ': ' + JSON.parse(response.getContentText()).message; } catch (ignore) {}
    throw new Error('GitHub rejected the publish request: ' + message);
  }
  return JSON.parse(response.getContentText());
}

function publishTearSpells() {
  const ui = SpreadsheetApp.getUi();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1500)) {
    ui.alert('Another publish operation is already running.');
    return;
  }
  try {
    const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
    if (!token) {
      ui.alert('Setup required: add a GITHUB_TOKEN script property in Apps Script Project Settings. Do not put the token into sheet cells or source code.');
      return;
    }
    const data = tearSourceSnapshot_();
    const answer = ui.alert(
      'Publish Tear spells?',
      'This will publish ' + data.spells + ' named spells from ' + data.tabs +
      ' eligible School tabs to the public website. The website updates only after GitHub successfully builds it. Continue?',
      ui.ButtonSet.YES_NO
    );
    if (answer !== ui.Button.YES) return;

    const url = 'https://api.github.com/repos/' + TEAR_REPO +
      '/contents/' + TEAR_SNAPSHOT_PATH;
    const existing = tearGitHubRequest_('get', url + '?ref=main', token);
    const newJson = JSON.stringify(data.snapshot, null, 2) + '\n';

    // Avoid unnecessary deployment when the spreadsheet is unchanged.
    const oldJson = Utilities.newBlob(Utilities.base64Decode(existing.content.replace(/\s/g, ''))).getDataAsString('UTF-8');
    if (JSON.stringify(JSON.parse(oldJson)) === JSON.stringify(data.snapshot)) {
      ui.alert('No new spell data to publish. The website is already using this snapshot.');
      return;
    }

    tearGitHubRequest_('put', url, token, {
      message: 'Publish updated Tear spell sheets (' + data.spells + ' spells)',
      branch: 'main',
      sha: existing.sha,
      content: Utilities.base64Encode(newJson, Utilities.Charset.UTF_8)
    });
    ui.alert('Spell data submitted. GitHub is now rebuilding the website. You can check its status at https://github.com/' +
      TEAR_REPO + '/actions');
  } catch (error) {
    ui.alert('Nothing published: ' + error.message);
  } finally {
    lock.releaseLock();
  }
}
