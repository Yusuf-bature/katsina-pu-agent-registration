/**
 * KATSINA STATE PU AGENT REGISTRATION — WEB APP BACKEND
 * --------------------------------------------------------
 * Lightweight alternative to the giant Google Form: only loads the
 * 34 LGA names up front, then fetches Wards/Polling Units on demand
 * as the user picks each one. Submissions are saved to a Google Sheet,
 * and uploaded photos are saved to a Google Drive folder.
 *
 * SETUP:
 *  1. Create a new Apps Script project at https://script.google.com
 *  2. Add a file "Data.gs" — paste in the same Data.gs from before
 *     (the one with getPuTree()). You already have this file.
 *  3. Add this file as "Code.gs".
 *  4. Add a file "Index.html" — paste in the matching Index.html.
 *  5. Click Deploy > New deployment > select type "Web app".
 *       - Execute as: Me
 *       - Who has access: "Anyone with Google account" (recommended,
 *         since your agents will sign in anyway) or "Anyone" if you
 *         want fully public access.
 *  6. Click Deploy, authorize the permissions it asks for, then copy
 *     the Web App URL it gives you — that's the link you share with
 *     your agents.
 *  7. Responses appear in a new Google Sheet called
 *     "Katsina PU Agent Registrations" (it's created automatically on
 *     first submission, in your Drive). Photos are saved to a folder
 *     called "Katsina PU Agent Photos".
 *
 * Re-deploying after edits: Deploy > Manage deployments > pick the
 * existing deployment > click the pencil icon > New version > Deploy.
 * (Creating a brand-new deployment instead would change the URL.)
 */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Katsina State PU Agent Registration')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Returns the list of LGA names, in directory order. */
function getLgas() {
  var tree = getPuTree(); // from Data.gs
  return tree.map(function (e) { return e[0]; });
}

/** Returns the Ward names for a given LGA, in directory order. */
function getWards(lgaName) {
  var tree = getPuTree();
  for (var i = 0; i < tree.length; i++) {
    if (tree[i][0] === lgaName) {
      return tree[i][1].map(function (w) { return w[0]; });
    }
  }
  return [];
}

/** Returns [{name, code}, ...] Polling Units for a given LGA + Ward. */
function getPus(lgaName, wardName) {
  var tree = getPuTree();
  for (var i = 0; i < tree.length; i++) {
    if (tree[i][0] === lgaName) {
      var wards = tree[i][1];
      for (var j = 0; j < wards.length; j++) {
        if (wards[j][0] === wardName) {
          return wards[j][1].map(function (p) { return { name: p[0], code: p[1] }; });
        }
      }
    }
  }
  return [];
}

/**
 * Saves one registration. `data` shape:
 * { name, phone, email, gender, voterId, state, lga, ward, pu, puCode,
 *   photoBase64, photoName, photoMime }
 * photoBase64 may include the "data:image/png;base64," prefix — we strip it.
 */
function submitRegistration(data) {
  if (!data || !data.name || !data.phone || !data.email || !data.gender ||
      !data.voterId || !data.lga || !data.ward || !data.pu) {
    return { success: false, error: 'Missing required field(s).' };
  }

  var photoUrl = '';
  try {
    if (data.photoBase64) {
      var raw = data.photoBase64.indexOf(',') > -1
        ? data.photoBase64.split(',').pop()
        : data.photoBase64;
      var bytes = Utilities.base64Decode(raw);
      var mime = data.photoMime || 'image/jpeg';
      var name = data.photoName || (data.name + '_' + data.pu + '.jpg');
      var blob = Utilities.newBlob(bytes, mime, name);
      var folder = getOrCreatePhotoFolder_();
      var file = folder.createFile(blob);
      photoUrl = file.getUrl();
    } else {
      return { success: false, error: 'Photo is required.' };
    }
  } catch (e) {
    return { success: false, error: 'Could not save photo: ' + e.message };
  }

  try {
    var sheet = getOrCreateSheet_();
    sheet.appendRow([
      new Date(),
      data.name,
      data.phone,
      data.email,
      data.gender,
      data.voterId,
      data.state || 'Katsina',
      data.lga,
      data.ward,
      data.pu,
      data.puCode || '',
      photoUrl
    ]);
  } catch (e) {
    return { success: false, error: 'Could not save to sheet: ' + e.message };
  }

  return { success: true };
}

function getOrCreateSheet_() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty('SHEET_ID');
  if (ssId) {
    try {
      return SpreadsheetApp.openById(ssId).getSheets()[0];
    } catch (e) {
      // Fall through and recreate if it was deleted.
    }
  }
  var newSs = SpreadsheetApp.create('Katsina PU Agent Registrations');
  props.setProperty('SHEET_ID', newSs.getId());
  var sheet = newSs.getSheets()[0];
  sheet.appendRow([
    'Timestamp', 'Name', 'Phone', 'Email', 'Gender', "Voter's ID",
    'State', 'LGA', 'Ward', 'Polling Unit', 'PU Code', 'Photo URL'
  ]);
  sheet.setFrozenRows(1);
  return sheet;
}

function getOrCreatePhotoFolder_() {
  var props = PropertiesService.getScriptProperties();
  var folderId = props.getProperty('FOLDER_ID');
  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (e) {
      // Fall through and recreate if it was deleted.
    }
  }
  var folder = DriveApp.createFolder('Katsina PU Agent Photos');
  props.setProperty('FOLDER_ID', folder.getId());
  return folder;
}

/**
 * OPTIONAL helper — run manually from the editor if you want the Sheet
 * and Drive folder links printed to the log without having to submit
 * a test registration first.
 */
function printSetupLinks_() {
  var sheet = getOrCreateSheet_();
  var folder = getOrCreatePhotoFolder_();
  Logger.log('Responses sheet: ' + sheet.getParent().getUrl());
  Logger.log('Photos folder: ' + folder.getUrl());
}