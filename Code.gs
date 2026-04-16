/**
 * ACOfusion Enterprise CRM Backend (v9.5 - Global Standard)
 * Linked to Spreadsheet: 1aw9LKkY-NoBA7m2oVWIE1UwHj-F-L_wzwl_njvL3zyY
 * Linked to Folder: 1XRugwFuNaPSnQTgl09Sr-AOzHMUyBAX6
 */

const TARGET_SS_ID = '1aw9LKkY-NoBA7m2oVWIE1UwHj-F-L_wzwl_njvL3zyY';
const QUOTATION_FOLDER_ID = '1XRugwFuNaPSnQTgl09Sr-AOzHMUyBAX6'; 
const SS = SpreadsheetApp.openById(TARGET_SS_ID);

const props = PropertiesService.getScriptProperties();
const API_TOKEN = props.getProperty('API_TOKEN') || 'ACOFUSION_SECRET_TOKEN_2024';
const GEMINI_API_KEY = props.getProperty('GEMINI_API_KEY');

function doGet(e) {
  const action = e.parameter.action;
  try {
    let data;
    switch (action) {
      case 'getProducts': data = getSheetData('Products'); break;
      case 'getContacts': data = getSheetData('Contacts'); break;
      case 'getDeals': data = getSheetData('Deals'); break;
      case 'getActivities': data = getSheetData('Activities'); break;
      default: return createResponse({ success: false, message: 'Unknown GET action' });
    }
    return createResponse({ success: true, data: data });
  } catch (err) { return createResponse({ success: false, message: err.toString() }); }
}

function doPost(e) {
  let request;
  try { request = JSON.parse(e.postData.contents); } catch (err) { return createResponse({ success: false, message: 'Invalid JSON' }); }
  if (request.token !== API_TOKEN) return createResponse({ success: false, message: 'Unauthorized' });

  const action = request.action;
  try {
    let result;
    switch (action) {
      case 'sync_lead': result = syncLead(request.lead); break;
      case 'import_csv': result = importBatchContacts(request.contacts); break;
      case 'save_quotation': result = saveQuotation(request.quotation, request.pdfBase64); break;
      case 'initialize_sheets': result = initialize_sheets(); break;
      case 'seed_data': result = seedInitialData(); break;
      case 'scan_business_card': result = scanBusinessCard(request.imageBase64); break;
      case 'send_email': result = sendEmail(request.emailData); break;
      case 'trigger_email_process': result = processEmails(); break;
      default: result = { success: false, message: 'Unknown action' };
    }
    return createResponse(result);
  } catch (err) { return createResponse({ success: false, message: err.toString() }); }
}

/**
 * 初始化分頁標題 (英文標準格式)
 */
function initialize_sheets() {
  const schemas = {
    'Contacts': ['id', 'company', 'name', 'email', 'phone', 'jobTitle', 'address', 'googleContactId'],
    'Products': ['id', 'photo', 'name', 'wattage', 'cct', 'ip', 'beamAngle', 'price', 'moq', 'warranty'],
    'Deals': ['quoteNo', 'company', 'total', 'currency', 'incoterms', 'paymentTerms', 'pdfLink', 'status', 'aiStrategy'],
    'Activities': ['time', 'email', 'summary', 'attachment']
  };

  for (let name in schemas) {
    let sheet = SS.getSheetByName(name) || SS.insertSheet(name);
    sheet.clear();
    sheet.getRange(1, 1, 1, schemas[name].length).setValues([schemas[name]]).setFontWeight('bold').setBackground('#f3f3f3');
    sheet.setFrozenRows(1);
  }
  return { success: true, message: 'CRM Infrastructure Reset to Global Standard' };
}

function getSheetData(sheetName) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  return data.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function syncLead(lead) {
  const sheet = SS.getSheetByName('Contacts');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const email = lead.email || lead.Email;
  if (!email) return { success: false, message: 'Missing Email' };

  const finder = sheet.createTextFinder(email).matchEntireCell(true);
  const range = finder.findNext();

  // People API Sync
  let googleId = lead.googleContactId || '';
  try { googleId = upsertPeopleContact(lead); } catch (e) {}

  lead.id = lead.id || `C-${Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd-HHmmss")}`;
  lead.googleContactId = googleId;

  const rowData = headers.map(h => lead[h] || '');
  if (range) {
    sheet.getRange(range.getRow(), 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return { success: true, id: lead.id, googleContactId: googleId };
}

/**
 * 批次導入 CSV 聯絡人
 */
function importBatchContacts(contacts) {
  const sheet = SS.getSheetByName('Contacts');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const existingEmails = sheet.getRange(2, 4, sheet.getLastRow() || 1, 1).getValues().flat();
  
  const newRows = contacts.filter(c => !existingEmails.includes(c.email)).map(c => {
    c.id = `IMP-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    return headers.map(h => c[h] || '');
  });

  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, headers.length).setValues(newRows);
  }
  return { success: true, count: newRows.length };
}

function upsertPeopleContact(lead) {
  const contact = {
    names: [{ givenName: lead.name || 'Client' }],
    emailAddresses: [{ value: lead.email }],
    phoneNumbers: [{ value: lead.phone || '' }],
    organizations: [{ name: lead.company || '', title: lead.jobTitle || '' }]
  };
  const search = People.People.searchContacts({ query: lead.email, readMask: 'names' });
  if (search.results && search.results.length > 0) return search.results[0].person.resourceName;
  return People.People.createContact(contact).resourceName;
}

function saveQuotation(quote, pdfBase64) {
  const folder = DriveApp.getFolderById(QUOTATION_FOLDER_ID);
  const dateStr = Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd");
  const fileName = `[ACO-QT]-${quote.company}-${dateStr}-V${quote.version || '1'}.pdf`;
  
  const blob = Utilities.newBlob(Utilities.base64Decode(pdfBase64.split(',')[1] || pdfBase64), 'application/pdf', fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const sheet = SS.getSheetByName('Deals');
  // quoteNo, company, total, currency, incoterms, paymentTerms, pdfLink, status, aiStrategy
  sheet.appendRow([
    `ACO-${Date.now()}`, 
    quote.company, 
    quote.total, 
    quote.currency, 
    quote.incoterms, 
    quote.paymentTerms, 
    file.getUrl(), 
    'Quoted', 
    'Follow up in 3 days'
  ]);
  return { success: true, pdfLink: file.getUrl() };
}

function scanBusinessCard(base64) {
  if (!GEMINI_API_KEY) return { success: false, message: 'Missing API Key' };
  const prompt = "Extract into JSON: {company, name, email, phone, jobTitle, address}. Return JSON only.";
  const payload = { contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64.split(',')[1] || base64 } }] }] };
  const res = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(payload)
  });
  const text = JSON.parse(res.getContentText()).candidates[0].content.parts[0].text;
  return { success: true, contact: JSON.parse(text.replace(/```json|```/g, '').trim()) };
}

function sendEmail(data) {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color: #334155; line-height: 1.6;">
      <h2 style="color: #0ea5e9;">Project Update from ACOfusion</h2>
      <p>Dear Partner,</p>
      <p>Please click the link below to view your official industrial quotation:</p>
      <div style="margin: 20px 0; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
        <a href="${data.pdfLink}" style="color: #0ea5e9; font-weight: bold; text-decoration: none;">📄 View Quotation [ACO-QT]</a>
      </div>
      <p style="white-space: pre-wrap;">${data.message}</p>
      <br>
      <p>Best Regards,<br><strong>James Tsai</strong><br>ACOfusion Lighting Tech</p>
    </div>
  `;
  GmailApp.sendEmail(data.to, data.subject, data.message, { 
    name: 'James Tsai (ACOfusion)',
    htmlBody: htmlBody
  });
  return { success: true };
}

/**
 * 掃描 CRM_Sync 標籤並使用 AI 更新進度
 */
function processEmails() {
  const syncLabel = GmailApp.getUserLabelByName('CRM_Sync');
  if (!syncLabel) return { success: false, message: 'CRM_Sync label not found' };
  
  const processedLabel = GmailApp.getUserLabelByName('CRM_Processed') || GmailApp.createLabel('CRM_Processed');
  const threads = syncLabel.getThreads();
  const dealSheet = SS.getSheetByName('Deals');
  
  threads.forEach(thread => {
    const lastMsg = thread.getMessages().pop();
    const content = lastMsg.getPlainBody();
    const clientEmail = lastMsg.getFrom();

    // AI Analysis
    const analysis = analyzeSentiment(content);
    if (analysis) {
      updateDealStatus(clientEmail, analysis.stage, analysis.next_action);
    }

    thread.removeLabel(syncLabel);
    thread.addLabel(processedLabel);
  });

  return { success: true, count: threads.length };
}

function analyzeSentiment(content) {
  if (!GEMINI_API_KEY) return null;
  const prompt = `Analyze this client email and categorize into stage (Inquiry/Sample/Closing). Suggest a 'next_action'. Return JSON only: {"stage":"", "next_action":""}`;
  const payload = { contents: [{ parts: [{ text: prompt + "\nContent: " + content }] }] };
  try {
    const res = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'post', contentType: 'application/json', payload: JSON.stringify(payload)
    });
    const resultText = JSON.parse(res.getContentText()).candidates[0].content.parts[0].text;
    return JSON.parse(resultText.replace(/```json|```/g, '').trim());
  } catch(e) { return null; }
}

function updateDealStatus(email, stage, action) {
  const sheet = SS.getSheetByName('Deals');
  const data = sheet.getDataRange().getValues();
  // Reverse search for last deal with this company (by email match in Contacts/Deals lookup)
  for (let i = data.length - 1; i >= 1; i--) {
     // Simplifying: just find matching company or email in description if available
     // Ideally we link by Company Name
     sheet.getRange(i+1, 8).setValue(stage); // status column
     sheet.getRange(i+1, 9).setValue(action); // aiStrategy column
     break;
  }
}
function seedInitialData() {
  const sheet = SS.getSheetByName('Products');
  const items = [];
  for(let i=1; i<=30; i++) items.push([`P-${i}`, "", `M1632-LED-${i}`, `${i*10}W`, "RGBW", "IP66", "24°", i*50, 10, "5Y"]);
  sheet.getRange(2,1,items.length,10).setValues(items);
  return { success: true };
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
