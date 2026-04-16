/**
 * ACOfusion Enterprise Production CRM Backend (v4.5)
 * Refactored for properties security, email automation, and high-performance search.
 */

// --- 取得環境變數 (Secure Properties) ---
const props = PropertiesService.getScriptProperties();
const API_TOKEN = props.getProperty('API_TOKEN') || 'ACOFUSION_SECRET_TOKEN_2024';
const GEMINI_API_KEY = props.getProperty('GEMINI_API_KEY');
const QUOTATION_FOLDER_ID = props.getProperty('QUOTATION_FOLDER_ID') || '';

const SS = SpreadsheetApp.getActiveSpreadsheet();

/**
 * GET 請求處理
 */
function doGet(e) {
  const action = e.parameter.action;
  try {
    let data;
    switch (action) {
      case 'getProducts': data = getSheetData('Products'); break;
      case 'getContacts': data = getSheetData('Contacts'); break;
      default: return createResponse({ success: false, message: 'Unknown GET action' });
    }
    return createResponse({ success: true, data: data });
  } catch (err) {
    return createResponse({ success: false, message: err.toString() });
  }
}

/**
 * POST 請求處理
 */
function doPost(e) {
  let request;
  try {
    request = JSON.parse(e.postData.contents);
  } catch (err) {
    return createResponse({ success: false, message: 'Invalid JSON' });
  }

  const action = request.action;
  // 安全檢查
  if (request.token !== API_TOKEN) {
    return createResponse({ success: false, message: 'Unauthorized' });
  }

  try {
    let result;
    switch (action) {
      case 'sync_lead': result = syncLead(request.lead); break;
      case 'new_quotation': result = saveQuotation(request.quotation, request.pdfBase64); break;
      case 'scanBusinessCard': result = scanBusinessCard(request.imageBase64); break;
      case 'triggerEmailProcess': result = autoProcessEmails(); break;
      default: result = { success: false, message: 'Unknown POST action' };
    }
    return createResponse(result);
  } catch (err) {
    return createResponse({ success: false, message: err.toString() });
  }
}

// ==========================================
// 核心邏輯 - 同步與搜尋優化
// ==========================================

/**
 * 同步客戶資料 (使用 TextFinder 優化搜尋效率)
 */
function syncLead(lead) {
  const sheet = SS.getSheetByName('Contacts') || initSheet('Contacts');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // 搜尋現有客戶 (以 Email 為準)
  const finder = sheet.createTextFinder(lead.email).matchEntireCell(true);
  const range = finder.findNext();
  
  const leadId = lead.id || `C-${Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd-HHmmss")}`;
  lead.lastUpdated = new Date();
  const rowData = headers.map(h => lead[h] || '');

  if (range) {
    const rowIndex = range.getRow();
    // 確保只在 Email 所在的列及其對應行進行更新 (假設 Email 列不變)
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  return { success: true, id: leadId };
}

// ==========================================
// 電子郵件自動化與 AI 分析
// ==========================================

/**
 * 監控標有「CRM_Sync」標籤的郵件並自動處理
 */
function autoProcessEmails() {
  const label = GmailApp.getUserLabelByName('CRM_Sync');
  if (!label) return { success: false, message: 'Label "CRM_Sync" not found' };

  const threads = label.getThreads();
  const processedCount = threads.length;

  threads.forEach(thread => {
    const messages = thread.getMessages();
    const lastMessage = messages[messages.length - 1];
    const body = lastMessage.getPlainBody();
    const subject = lastMessage.getSubject();
    const sender = lastMessage.getFrom();

    // 1. 使用 Gemini 分析郵件
    const analysis = analyzeEmailWithGemini(body, subject);
    
    if (analysis) {
      // 2. 更新或新增 Lead
      const email = sender.match(/<(.+)>/) ? sender.match(/<(.+)>/)[1] : sender;
      syncLead({
        email: email,
        name: sender.split('<')[0].trim(),
        company: analysis.company || 'Unknown',
        status: analysis.stage || 'Following',
        lastAction: `Email Sync: ${analysis.summary}`
      });

      // 3. 建立日曆提醒 (如果有跟進日期)
      if (analysis.followUpDate) {
        createCalendarReminder(
          `Follow up: ${analysis.company}`,
          `Reminder for ${sender}\nSummary: ${analysis.summary}`,
          analysis.followUpDate
        );
      }
    }

    // 處理完成後移除標籤
    thread.removeLabel(label);
    thread.addLabel(GmailApp.getUserLabelByName('CRM_Processed') || GmailApp.createLabel('CRM_Processed'));
  });

  return { success: true, processed: processedCount };
}

/**
 * 使用 Gemini 分析郵件內容
 */
function analyzeEmailWithGemini(body, subject) {
  if (!GEMINI_API_KEY) return null;

  const prompt = `
    你是一個專業的 CRM 助理。請分析以下郵件內容並轉換為 JSON 格式（無外加標記）：
    {
      "company": "公司名稱",
      "stage": "階段 (New/Following/Quoted/Closed)",
      "summary": "一句話總結需求",
      "followUpDate": "跟進日期 (YYYY-MM-DD，若無則為 null)"
    }
    主旨：${subject}
    內容：${body}
  `;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  
  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    const result = JSON.parse(response.getContentText());
    const text = result.candidates[0].content.parts[0].text;
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error('Gemini Analysis Error:', e);
    return null;
  }
}

/**
 * 建立日曆提醒
 */
function createCalendarReminder(title, description, dateStr) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return;
    
    const calendar = CalendarApp.getDefaultCalendar();
    calendar.createAllDayEvent(title, date, { description: description });
  } catch (e) {
    console.error('Calendar Error:', e);
  }
}

// ==========================================
// 輔助功能
// ==========================================

function getSheetData(sheetName) {
  const sheet = SS.getSheetByName(sheetName) || initSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  if (data.length === 0) return [];
  return data.map(row => {
    const obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
}

function saveQuotation(quotation, pdfBase64) {
  let pdfUrl = '';
  if (pdfBase64) {
    const folder = QUOTATION_FOLDER_ID ? DriveApp.getFolderById(QUOTATION_FOLDER_ID) : DriveApp.getRootFolder();
    const fileName = `Quotation_${quotation.quoteNo || new Date().getTime()}.pdf`;
    const blob = Utilities.newBlob(Utilities.base64Decode(pdfBase64.split(',')[1] || pdfBase64), 'application/pdf', fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    pdfUrl = file.getUrl();
  }

  const sheet = SS.getSheetByName('Deals') || initSheet('Deals');
  sheet.appendRow([
    quotation.quoteNo || `ACO-${Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd")}-${Math.floor(Math.random()*999)}`,
    JSON.stringify(quotation.items),
    quotation.finalTotal,
    pdfUrl,
    new Date(),
    quotation.customerEmail || ''
  ]);
  
  return { success: true, pdfLink: pdfUrl };
}

function scanBusinessCard(base64) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const payload = {
    contents: [{
      parts: [
        { text: "請提取名片資訊為 JSON：{ 'name': '', 'company': '', 'email': '', 'phone': '', 'jobTitle': '' }。" },
        { inline_data: { mime_type: "image/jpeg", data: base64.split(',')[1] || base64 } }
      ]
    }]
  };
  const response = UrlFetchApp.fetch(url, { method: 'POST', contentType: 'application/json', payload: JSON.stringify(payload) });
  const text = JSON.parse(response.getContentText()).candidates[0].content.parts[0].text;
  return { success: true, contact: JSON.parse(text.replace(/```json|```/g, '').trim()) };
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function initSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  let headers = [];
  if (name === 'Products') headers = ['SKU', 'Name', 'Category', 'Specs', 'Price', 'ImageURL'];
  if (name === 'Contacts') headers = ['id', 'company', 'email', 'status', 'syncStatus', 'phone', 'name', 'lastUpdated', 'lastAction'];
  if (name === 'Deals') headers = ['quoteNo', 'items', 'finalTotal', 'pdfLink', 'date', 'customerEmail'];
  if (headers.length > 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}
