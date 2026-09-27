/**
 * IGREK – Google Sheets webhook (robust version)
 *
 * This script receives JSON data posted by the IGREK Node server
 * (http://localhost:8000/api/apply) and appends a row to the target
 * spreadsheet. It also creates a header row on the first run so you get
 * column names, timestamps and the Vocaroo link automatically.
 */

/**
 * Change this if your sheet tab has a different name.
 * (The default new sheet in a fresh spreadsheet is "Sheet1").
 */
const SHEET_NAME = 'Sheet1';

/**
 * Column titles – must match the order of the values we push in `row`.
 * Feel free to rename them, just keep the order identical.
 */
const HEADER_VALUES = [
  'Timestamp',
  'Name',
  'Email',
  'Phone',
  'Vocaroo Link',
  'Experience',
  'Last Position'
];

/**
 * POST entry point – called by the IGREK server.
 */
function doPost(e) {
  try {
    // --------------------------------------------------------------
    // 1️⃣ Get the JSON payload – be tolerant to missing e/postData
    // --------------------------------------------------------------
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter && e.parameter.payload) {
      // fallback if the data was sent as a query string named "payload"
      payload = JSON.parse(e.parameter.payload);
    } else {
      // No data – respond with a clear error so the Node server can log it
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'No POST data received' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --------------------------------------------------------------
    // 2️⃣ Open the spreadsheet and the target sheet
    // --------------------------------------------------------------
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: `Sheet "${SHEET_NAME}" not found` }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --------------------------------------------------------------
    // 3️⃣ Ensure the header row exists (run only once)
    // --------------------------------------------------------------
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADER_VALUES);
    }

    // --------------------------------------------------------------
    // 4️⃣ Build the data row – keep the order identical to HEADER_VALUES
    // --------------------------------------------------------------
    const row = [
      new Date(),                    // Timestamp (column 1)
      payload.name        || '',
      payload.email       || '',
      payload.phone       || '',
      payload.vocaroo     || '',   // <-- the link you’re missing
      payload.experience  || '',
      payload.lastPosition|| ''
    ];

    // --------------------------------------------------------------
    // 5️⃣ Append the row to the bottom of the sheet
    // --------------------------------------------------------------
    sheet.appendRow(row);

    // --------------------------------------------------------------
    // 6️⃣ Return a tiny JSON success payload (Node server only checks HTTP 200)
    // --------------------------------------------------------------
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    // Log the error – you can view it in **View → Executions**
    console.error('doPost error:', err);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Optional GET handler – handy for quick “is the webhook alive?” checks.
 */
function doGet(e) {
  return ContentService
    .createTextOutput('IGREK Google Sheets webhook is active.')
    .setMimeType(ContentService.MimeType.TEXT);
}
