/**
 * ACOfusion Enterprise Production CRM Backend (v4.0)
 * Google Apps Script Boilerplate
 */

const API_TOKEN = 'ACOFUSION_SECRET_TOKEN_2024'; // 建議更換
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE'; 
const QUOTATION_FOLDER_ID = ''; // 若留空則儲存在根目錄

const SS = SpreadsheetApp.getActiveSpreadsheet();

/**
 * GET 請求處理
 * 支援: ?action=getContacts, ?action=getProducts
 */
function doGet(e) {
  const action = e.parameter.action;
  
  // 安全檢查 (可選：參數傳遞 token)
  // if (e.parameter.token !== API_TOKEN) return createResponse({ success: false, message: 'Unauthorized' });

  try {
    let data;
    switch (action) {
      case 'getProducts':
        data = getSheetData('Products');
        break;
      case 'getContacts':
        data = getSheetData('Contacts');
        break;
      default:
        return createResponse({ success: false, message: 'Unknown GET action' });
    }
    return createResponse({ success: true, data: data });
  } catch (err) {
    return createResponse({ success: false, message: err.toString() });
  }
}

/**
 * POST 請求處理
 * 支援: sync_lead, new_quotation, scanBusinessCard
 */
function doPost(e) {
  let request;
  try {
    request = JSON.parse(e.postData.contents);
  } catch (err) {
    return createResponse({ success: false, message: 'Invalid JSON' });
  }

  const action = request.action;
  
  // 安全檢查 (對應規格書：Header 包含 X-API-TOKEN，但在 GAS 中需從 Body 或 Params 取得)
  if (request.token !== API_TOKEN) {
    return createResponse({ success: false, message: 'Unauthorized (Invalid Token)' });
  }

  try {
    let result;
    switch (action) {
      case 'sync_lead':
        result = syncLead(request.lead);
        break;
      case 'new_quotation':
        result = saveQuotation(request.quotation, request.pdfBase64);
        break;
      case 'scanBusinessCard':
        result = scanBusinessCard(request.imageBase64);
        break;
      case 'getProducts': // 相容性
        result = { success: true, data: getSheetData('Products') };
        break;
      case 'getContacts': // 相容性
        result = { success: true, data: getSheetData('Contacts') };
        break;
      default:
        result = { success: false, message: 'Unknown POST action: ' + action };
    }
    return createResponse(result);
  } catch (err) {
    return createResponse({ success: false, message: err.toString() });
  }
}

// ==========================================
// 核心邏輯 (Core Logic)
// ==========================================

/**
 * 取得工作表資料並轉為 JSON 物件陣列
 */
function getSheetData(sheetName) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) {
    // 若工作表不存在，自動建立並初始化標題
    return initSheet(sheetName);
  }
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  return data.map(row => {
    const obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
}

/**
 * 同步客戶資料 (Offline-First 支援)
 */
function syncLead(lead) {
  const sheet = SS.getSheetByName('Contacts') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Contacts');
  const data = sheet.getDataRange().getValues();
  const headers = data[0] || ['id', 'company', 'email', 'status', 'syncStatus', 'phone', 'name', 'lastUpdated'];
  
  if (data.length === 1 && data[0][0] === '') {
    sheet.appendRow(headers);
  }

  let rowIndex = -1;
  const emailCol = headers.indexOf('email');
  
  // 查找現有客戶 (以 Email 為準)
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailCol] === lead.email) {
      rowIndex = i + 1;
      break;
    }
  }

  lead.lastUpdated = new Date();
  lead.syncStatus = 'synced';
  
  const rowData = headers.map(h => lead[h] || '');
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    if (!lead.id) lead.id = 'C-' + Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd-HHmmss");
    sheet.appendRow(headers.map(h => lead[h] || ''));
  }
  
  return { success: true, id: lead.id };
}

/**
 * 儲存報價單並存檔 PDF 至 Drive
 */
function saveQuotation(quotation, pdfBase64) {
  // 1. 存檔 PDF 至 Google Drive
  let pdfUrl = '';
  try {
    if (pdfBase64) {
      const folder = QUOTATION_FOLDER_ID ? DriveApp.getFolderById(QUOTATION_FOLDER_ID) : DriveApp.getRootFolder();
      const fileName = `Quotation_${quotation.quoteNo || new Date().getTime()}.pdf`;
      const blob = Utilities.newBlob(Utilities.base64Decode(pdfBase64.split(',')[1] || pdfBase64), 'application/pdf', fileName);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      pdfUrl = file.getUrl();
    }
  } catch (e) {
    console.error('PDF Save Error:', e);
  }

  // 2. 寫入 Deals 工作表
  const sheet = SS.getSheetByName('Deals') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Deals');
  const headers = ['quoteNo', 'items', 'finalTotal', 'pdfLink', 'date', 'customerEmail'];
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  const rowData = [
    quotation.quoteNo || `ACO-${Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd")}-${Math.floor(Math.random()*999)}`,
    JSON.stringify(quotation.items),
    quotation.finalTotal,
    pdfUrl,
    new Date(),
    quotation.customerEmail || ''
  ];
  
  sheet.appendRow(rowData);
  
  return { success: true, pdfLink: pdfUrl, quoteNo: rowData[0] };
}

/**
 * 名片識別 AI (Gemini 整合)
 */
function scanBusinessCard(base64) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    return { success: false, message: 'Gemini API Key not configured' };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    contents: [{
      parts: [
        { text: "你是一個專業的名片識別 AI。請從這張圖片中提取以下資訊，並僅以 JSON 格式回傳，不要有任何 markdown 標記：{ 'name': '', 'company': '', 'email': '', 'phone': '', 'jobTitle': '' }。" },
        { inline_data: { mime_type: "image/jpeg", data: base64.split(',')[1] || base64 } }
      ]
    }]
  };

  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    const text = json.candidates[0].content.parts[0].text;
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return { success: true, contact: JSON.parse(cleanJson) };
  } catch (e) {
    return { success: false, message: 'AI Parsing Error: ' + e.toString() };
  }
}

// ==========================================
// 輔助函式 (Helpers)
// ==========================================

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function initSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  
  let headers = [];
  if (name === 'Products') headers = ['SKU', 'Name', 'Category', 'Specs', 'Price', 'ImageURL'];
  if (name === 'Contacts') headers = ['id', 'company', 'email', 'status', 'syncStatus', 'phone', 'name', 'lastUpdated'];
  if (name === 'Deals') headers = ['quoteNo', 'items', 'finalTotal', 'pdfLink', 'date', 'customerEmail'];
  if (name === 'Activities') headers = ['id', 'date', 'email', 'type', 'subject', 'content', 'category', 'status'];
  
  if (headers.length > 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return [];
}
