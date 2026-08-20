/**
 * Chhavi's Creations - Google Sheets backend
 *
 * IMPORTANT: Create this from INSIDE your sheet
 * Extensions > Apps Script (not a standalone script.google.com project)
 *
 * Then Deploy > New deployment > Web app
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Copy the /exec URL into script.js as GOOGLE_SCRIPT_URL
 */

 SPREADSHEET_LINK : https://docs.google.com/spreadsheets/d/1ma9WiOpXRzkGtKaJrDcq0Mr316f94XzDcVbKV1QKtw0/edit?gid=0#gid=0

const SPREADSHEET_ID = "1ma9WiOpXRzkGtKaJrDcq0Mr316f94XzDcVbKV1QKtw0";

const HEADERS = {
  Contacts: ["Timestamp", "Name", "Phone", "Email", "Inquiry Type", "Message"],
  Orders: ["Timestamp", "Name", "Phone", "Product", "Product Code", "Size", "Quantity", "Status", "Notes"]
};

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ success: false, message: "No data received." });
    }

    const payload = JSON.parse(e.postData.contents);
    const sheetName = payload.type === "order" ? "Orders" : "Contacts";
    const sheet = getSheet_(sheetName);
    const row = payload.type === "order" ? buildOrderRow_(payload) : buildContactRow_(payload);
    sheet.appendRow(row);

    return jsonResponse_({ success: true, message: "Saved successfully." });
  } catch (error) {
    return jsonResponse_({ success: false, message: String(error) });
  }
}

function doGet() {
  try {
    const ss = getSpreadsheet_();
    return jsonResponse_({
      success: true,
      message: "Chhavi's Creations API is running.",
      sheet: ss.getName(),
      tabs: ss.getSheets().map(function (s) { return s.getName(); })
    });
  } catch (error) {
    return jsonResponse_({ success: false, message: String(error) });
  }
}

/**
 * Prefer the spreadsheet this script is bound to.
 * Falls back to openById only if needed.
 */
function getSpreadsheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet_(name) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS[name]);
    sheet.getRange(1, 1, 1, HEADERS[name].length).setFontWeight("bold");
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS[name]);
    sheet.getRange(1, 1, 1, HEADERS[name].length).setFontWeight("bold");
  }

  return sheet;
}

function buildContactRow_(data) {
  return [
    new Date(),
    sanitize_(data.name),
    sanitize_(data.phone),
    sanitize_(data.email || ""),
    sanitize_(data.inquiryType || "General"),
    sanitize_(data.message)
  ];
}

function buildOrderRow_(data) {
  return [
    new Date(),
    sanitize_(data.name),
    sanitize_(data.phone),
    sanitize_(data.product),
    sanitize_(data.productCode),
    sanitize_(data.size),
    sanitize_(data.quantity),
    "Pending",
    sanitize_(data.notes || "")
  ];
}

function sanitize_(value) {
  return String(value || "").trim().slice(0, 500);
}

function jsonResponse_(object) {
  return ContentService
    .createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}
