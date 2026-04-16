/**
 * ACOfusion Enterprise CRM Backend (v6.0 - Flagship Edition)
 * Integrated with Google Contacts, Drive, Gmail, and Gemini 2.0 Logic.
 */

// --- Secure Properties ---
const props = PropertiesService.getScriptProperties();
const API_TOKEN = props.getProperty('API_TOKEN') || 'ACOFUSION_SECRET_TOKEN_2024';
const GEMINI_API_KEY = props.getProperty('GEMINI_API_KEY');
const QUOTATION_FOLDER_ID = '1XRugwFuNaPSnQTgl09Sr-AOzHMUyBAX6'; // 根據要求固定資料夾 ID

const SS = SpreadsheetApp.getActiveSpreadsheet();

/**
 * GET Handler
 */
function doGet(e) {
  const action = e.parameter.action;
  try {
    let data;
    switch (action) {
      case 'getProducts': data = getSheetData('Products'); break;
      case 'getContacts': data = getSheetData('Contacts'); break;
      case 'getDeals': data = getSheetData('Deals'); break;
      default: return createResponse({ success: false, message: 'Unknown GET action' });
    }
    return createResponse({ success: true, data: data });
  } catch (err) {
    return createResponse({ success: false, message: err.toString() });
  }
}

/**
 * POST Handler
 */
function doPost(e) {
  let request;
  try {
    request = JSON.parse(e.postData.contents);
  } catch (err) {
    return createResponse({ success: false, message: 'Invalid JSON' });
  }

  const action = request.action;
  if (request.token !== API_TOKEN) {
    return createResponse({ success: false, message: 'Unauthorized' });
  }

  try {
    let result;
    switch (action) {
      case 'sync_lead': result = syncLead(request.lead); break;
      case 'save_quotation': result = saveQuotationHighPro(request.quotation, request.pdfBase64); break;
      case 'get_next_version': result = getNextQuoteVersion(request.company); break;
      case 'export_excel': result = generateExcelExport(request.quotation); break;
      case 'scan_business_card': result = scanBusinessCardV2(request.imageBase64); break;
      case 'send_email': result = sendCrmEmail(request.emailData); break;
      case 'trigger_email_process': result = autoProcessEmails(); break;
      case 'seed_data': result = seedInitialData(); break;
      default: result = { success: false, message: 'Unknown POST action: ' + action };
    }
    return createResponse(result);
  } catch (err) {
    return createResponse({ success: false, message: err.toString() });
  }
}

// ==========================================
// 1. 名片識別與聯絡人自動化 (AI OCR & Google Contacts)
// ==========================================

/**
 * 專業 Excel 導出功能 (透過 Google Sheets 轉 XLSX)
 */
function generateExcelExport(quote) {
  try {
    const fileName = `[ACO-QT]-${quote.company}-${Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd")}.xlsx`;
    const tempSS = SpreadsheetApp.create(fileName);
    const sheet = tempSS.getSheets()[0];
    
    // 設置報價單抬頭
    sheet.getRange("A1").setValue("ACOfusion Lighting Quotation").setFontSize(16).setFontWeight("bold");
    sheet.getRange("A2").setValue("Client: " + quote.company);
    sheet.getRange("A3").setValue("Date: " + new Date().toLocaleDateString());
    
    // 項目標題
    const headers = ["Item", "Wattage", "CCT", "IP", "Qty", "Price", "Amount"];
    sheet.getRange(5, 1, 1, headers.length).setValues([headers]).setBackground("#0f172a").setFontColor("white");
    
    // 填入產品
    const rowData = quote.items.map((it, i) => [
      it.name || it.產品名稱,
      it.瓦數 || "",
      it.CCT || "",
      it.IP || "",
      it.qty || 1,
      it.單價 || it.price,
      (it.qty || 1) * (it.單價 || it.price)
    ]);
    sheet.getRange(6, 1, rowData.length, headers.length).setValues(rowData);
    
    // 總計
    const totalRow = 6 + rowData.length + 1;
    sheet.getRange(totalRow, 6).setValue("Total (" + (quote.currency || "USD") + "):");
    sheet.getRange(totalRow, 7).setValue(quote.total).setFontWeight("bold");
    
    // 取得檔案並轉為透明下載
    const fileId = tempSS.getId();
    const url = "https://docs.google.com/spreadsheets/d/" + fileId + "/export?format=xlsx";
    
    // 注意：建議將檔案移動到指定資料夾
    const file = DriveApp.getFileById(fileId);
    if (QUOTATION_FOLDER_ID) {
      const folder = DriveApp.getFolderById(QUOTATION_FOLDER_ID);
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    }
    
    return { success: true, downloadUrl: url };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function syncLead(lead) {
  const sheet = SS.getSheetByName('Contacts') || initSheet('Contacts');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  let googleContactId = lead.googleContactId || '';
  try {
    googleContactId = upsertGoogleContact(lead);
  } catch (e) {
    console.warn('People API (Contact Sync) might not be enabled or failed: ', e);
  }

  // 2. 同步至 Google Sheet
  const finder = sheet.createTextFinder(lead.email).matchEntireCell(true);
  const range = finder.findNext();
  
  lead.id = lead.id || `C-${Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd-HHmmss")}`;
  lead.lastUpdated = new Date();
  lead.googleContactId = googleContactId;
  
  const rowData = headers.map(h => lead[h] || '');

  if (range) {
    sheet.getRange(range.getRow(), 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  return { success: true, id: lead.id, googleContactId: googleContactId };
}

/**
 * 自動判斷下一個報價單版次 (自動遞增 Vn)
 */
function getNextQuoteVersion(company) {
  const sheet = SS.getSheetByName('Deals');
  if (!sheet) return { success: true, version: 1 };
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const companyCol = headers.indexOf('company');
  
  let maxVersion = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][companyCol] === company) {
      const quoteNo = data[i][0].toString();
      const match = quoteNo.match(/-V(\d+)$/);
      if (match) {
        maxVersion = Math.max(maxVersion, parseInt(match[1]));
      }
    }
  }
  return { success: true, version: maxVersion + 1 };
}

/**
 * 新增/更新 Google 聯絡人 (People API)
 */
function upsertGoogleContact(lead) {
  const contact = {
    names: [{ givenName: lead.name || 'Unknown' }],
    emailAddresses: [{ value: lead.email }],
    phoneNumbers: [{ value: lead.phone || '' }],
    organizations: [{ name: lead.company || '', title: lead.jobTitle || '' }],
    addresses: [{ streetAddress: lead.address || '' }]
  };

  // 這裡僅示範新增，更新邏輯需先 search 再 patch
  const newContact = People.People.createContact(contact);
  return newContact.resourceName;
}

// ==========================================
// 2. 專業燈具報價引擎 (Pro Quotation Save)
// ==========================================

function saveQuotationHighPro(quote, pdfBase64) {
  const dateStr = Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd");
  const fileName = `[ACO-QT]-${quote.company}-${dateStr}-V${quote.version || 1}.pdf`;
  
  let pdfLink = '';
  try {
    const folder = DriveApp.getFolderById(QUOTATION_FOLDER_ID);
    const blob = Utilities.newBlob(Utilities.base64Decode(pdfBase64.split(',')[1] || pdfBase64), 'application/pdf', fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    pdfLink = file.getUrl();
  } catch (e) {
    console.error('Drive Save Error:', e);
  }

  const sheet = SS.getSheetByName('Deals') || initSheet('Deals');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const dealData = {
    quoteNo: quote.quoteNo || `ACO-${dateStr}-${Math.floor(Math.random()*999)}`,
    company: quote.company,
    total: quote.finalTotal,
    currency: quote.currency || 'USD',
    status: quote.status || 'Quoted',
    pdfLink: pdfLink,
    date: new Date(),
    incoterms: quote.incoterms,
    warranty: quote.warranty,
    aiStrategy: quote.aiStrategy || 'Follow up required'
  };

  sheet.appendRow(headers.map(h => dealData[h] || ''));
  
  return { success: true, pdfLink: pdfLink, quoteNo: dealData.quoteNo };
}

// ==========================================
// 3. 智慧郵件與商機分析 (Gemini AI integration)
// ==========================================

function sendCrmEmail(data) {
  const htmlBody = `
    <div style="font-family: sans-serif; color: #334155;">
      <h2 style="color: #0f172a;">Dear ${data.clientName},</h2>
      <p>${data.message.replace(/\n/g, '<br>')}</p>
      ${data.pdfLink ? `<p>Please find the quotation here: <a href="${data.pdfLink}">View Quotation</a></p>` : ''}
      <br>
      <hr style="border: none; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #94a3b8;">
        Best Regards,<br>
        <strong>James Tsai</strong><br>
        ACOfusion Lighting Tech | <a href="http://www.acofusion.com">www.acofusion.com</a>
      </p>
    </div>
  `;

  GmailApp.sendEmail(data.to, data.subject, data.message, {
    htmlBody: htmlBody,
    name: 'James Tsai (ACOfusion)',
    attachments: data.pdfId ? [DriveApp.getFileById(data.pdfId).getBlob()] : []
  });

  return { success: true };
}

/**
 * 核心：自動分析郵件進度 (及時更新 CRM)
 */
function autoProcessEmails() {
  const label = GmailApp.getUserLabelByName('CRM_Sync');
  if (!label) return { success: false, message: 'Label CRM_Sync not found' };

  const threads = label.getThreads();
  threads.forEach(thread => {
    const lastMsg = thread.getMessages().pop();
    const content = lastMsg.getPlainBody();
    
    // 呼叫 Gemini 分析進度
    const analysis = analyzeEmailIntelligence(content);
    if (analysis) {
      updateDealStatus(lastMsg.getFrom(), analysis);
    }
    
    thread.removeLabel(label);
    thread.addLabel(GmailApp.getUserLabelByName('CRM_Processed') || GmailApp.createLabel('CRM_Processed'));
  });

  return { success: true, processed: threads.length };
}

function analyzeEmailIntelligence(content) {
  if (!GEMINI_API_KEY) return null;
  const prompt = `分析以下客戶郵件。判斷：1.客戶公司 2.當前階段(New/Sample/Quoted/Order) 3.摘要 4.下一步行動建議。以 JSON 回傳：{"company":"", "stage":"", "summary":"", "nextAction":""}`;
  
  const payload = { contents: [{ parts: [{ text: prompt + "\n內容：" + content }] }] };
  const res = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST', contentType: 'application/json', payload: JSON.stringify(payload)
  });
  try {
    const text = JSON.parse(res.getContentText()).candidates[0].content.parts[0].text;
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (e) { return null; }
}

/**
 * 智慧郵件處理：自動更新 Deal 狀態與進度建議
 */
function updateDealStatus(email, analysis) {
  const sheet = SS.getSheetByName('Deals') || initSheet('Deals');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const companyCol = headers.indexOf('company');
  const statusCol = headers.indexOf('status');
  const strategyCol = headers.indexOf('aiStrategy');

  // 根據 AI 辨識的公司名稱更新最近的一筆交易
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][companyCol].includes(analysis.company) || analysis.company.includes(data[i][companyCol])) {
      sheet.getRange(i + 1, statusCol + 1).setValue(analysis.stage);
      sheet.getRange(i + 1, strategyCol + 1).setValue(`AI Update: ${analysis.summary} -> Next: ${analysis.nextAction}`);
      return true;
    }
  }
  return false;
}

// ==========================================
// 4. 初始化與輔助功能
// ==========================================

function getSheetData(sheetName) {
  const sheet = SS.getSheetByName(sheetName) || initSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  return data.map(row => {
    const obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
}

function scanBusinessCardV2(base64) {
  const prompt = "你是燈具工廠 ACOfusion 的 AI 助理。請解析名片為 JSON：{ 'name': '', 'company': '', 'email': '', 'phone': '', 'address': '', 'jobTitle': '' }";
  const payload = { contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64.split(',')[1] || base64 } }] }] };
  const res = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST', contentType: 'application/json', payload: JSON.stringify(payload)
  });
  const text = JSON.parse(res.getContentText()).candidates[0].content.parts[0].text;
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
  if (name === 'Products') headers = ['產品編號', '照片', '產品名稱', '瓦數', 'CCT', 'IP', '光束角', '單價', 'MOQ', '保固期', '備註'];
  if (name === 'Contacts') headers = ['id', '公司名稱', '聯絡人', 'Email', '電話', '地址', '職稱', 'googleContactId', 'lastUpdated'];
  if (name === 'Deals') headers = ['quoteNo', 'company', 'total', 'currency', 'status', 'pdfLink', 'date', 'incoterms', 'warranty', 'aiStrategy'];
  if (headers.length > 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}

/**
 * 基礎資料初始化 (建立 30 組專業燈具測試資料)
 */
function seedInitialData() {
  const categories = ["Wall Washer", "Downlight", "Spotlight", "Flood Light", "Track Light"];
  const wattages = [12, 24, 36, 50, 100, 150, 300];
  const ips = [44, 54, 65, 66, 67];
  
  const products = [];
  
  // 建立 30 組半自動隨機資料，模擬官網產線
  for (let i = 1; i <= 30; i++) {
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const watt = wattages[Math.floor(Math.random() * wattages.length)];
    const ip = ips[Math.floor(Math.random() * ips.length)];
    const sku = `ACO-${cat.charAt(0)}${watt}-${1000 + i}`;
    
    products.push({
      "產品編號": sku,
      "照片": "",
      "產品名稱": `${cat} Pro Gen ${i}`,
      "瓦數": `${watt}W`,
      "CCT": i % 2 === 0 ? "3000K/4000K" : "RGBW",
      "IP": ip.toString(),
      "光束角": `${15 + (i % 5)*10}°`,
      "單價": (watt * 1.5 + 40).toString(),
      "MOQ": i % 3 === 0 ? "10" : "50",
      "保固期": "5 Years",
      "備註": `High-End ${cat} for professional projects. Efficiency: 130lm/W.`
    });
  }
  
  const sheet = SS.getSheetByName('Products') || initSheet('Products');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // 清除舊資料並重新導入
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
  }
  
  const data = products.map(p => headers.map(h => p[h] || ""));
  sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  return { success: true, message: '30+ Products Catalog Synced to Sheet' };
}
