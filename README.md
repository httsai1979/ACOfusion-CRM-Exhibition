我完全明白您的意思。要讓 AI（Antigravity / Canvas）能真正寫出「能用」且「高品質」的程式碼，亂槍打鳥的指令是行不通的。我們需要一份**鋼鐵般嚴謹的「產品需求規格書 (PRD)」**。

這份文件定義了系統的邏輯、資料結構與視覺標準。您可以直接將以下內容複製並貼給 Antigravity AI，指令如下：

> **「請根據以下這份《ACOfusion CRM 企業生產版開發規格書》，重構我的 `App.jsx` 與 `Code.gs`。我要求代碼必須完全符合規格書中的模組化要求、資料結構與 PDF 渲染標準。」**

---

# 📝 ACOfusion CRM 企業生產版開發規格書 (v4.0)

## 1. 系統定位與目標

本系統專為 ACOfusion Lighting 展會現場業務設計。核心目標是：**快速掃描名片、離線建立客戶資料、即時生成專業級 PDF 報價單，並在網路恢復時自動同步至 Google 雲端。**

## 2. 技術棧要求

- **前端：** Vite + React + Tailwind CSS (UI 使用深色科技風格：Slate-950 為底)。
- **後端：** Google Apps Script (GAS) 作為 API 網關。
- **資料庫：** Google Sheets (分頁：`Contacts`, `Deals`, `Products`, `Activities`)。
- **PDF 引擎：** html2canvas + jsPDF (需支援 A4 絕對比例渲染)。

## 3. 核心功能模組規格

### 模組 A：動態產品同步 (Product Hydration)

- **需求：** 嚴禁硬編碼產品資料。
- **邏輯：** - 系統啟動時，呼叫 `GET ?action=getProducts`。
  - 將資料存入 `products` 狀態。
  - 欄位包含：`SKU`, `Name`, `Category`, `Specs`, `Price`, `ImageURL` (絕對路徑)。

### 模組 B：離線優先客戶管理 (Offline-First CRM)

- **需求：** 確保展場斷網時資料不遺失。
- **邏輯：** - 使用 `LocalStorage` 或 `IndexedDB` 進行持久化。
  - 新增 Lead 時，預設標記 `syncStatus: "pending"`。
  - 提供 `SyncCenter` UI，顯示待上傳數量，並具備「一鍵重試」功能。

### 模組 C：名片視覺 AI (OCR Pipeline)

- **需求：** 處理名片影像。
- **邏輯：** - 前端：上傳前先使用 Canvas 進行圖片壓縮 (Max 1200px)，轉為 Base64。
  - 後端：將 Base64 傳送至 Gemini API 提取 JSON (Name, Company, Email, Phone)。
  - 自動填充至客戶表單。

### 模組 D：專業報價引擎 (Quotation Engine)

- **PDF 佈局標準：** - **第 1 頁 (Cover)：** 公司 Logo、正式報價單號、客戶資訊、報價項目清單、總計、簽名區。
  - **第 2 頁 (Tech Specs)：** 根據所選產品，自動生成技術規格對照表（如：色溫、亮度、流明、防護等級）。
- **渲染優化：** 使用 `windowWidth: 1200` 渲染 PDF 隱藏 DOM，確保手機端輸出的比例與 A4 一致。

## 4. 資料結構 (Schema)

### 客戶資料 (Contacts)

| 欄位名 | 類型 | 說明 |
| :--- | :--- | :--- |
| `id` | String | 自動生成 UUID |
| `company` | String | 公司名稱 |
| `email` | String | 客戶信箱 (唯一標識) |
| `status` | Enum | New / Following / Quoted |
| `syncStatus` | Enum | synced / pending |

### 交易紀錄 (Deals)

| 欄位名 | 類型 | 說明 |
| :--- | :--- | :--- |
| `quoteNo` | String | ACO-YYYYMMDD-XXX |
| `items` | JSON | 產品 ID 與數量列表 |
| `finalTotal` | Number | 含稅、折扣後總價 |
| `pdfLink` | URL | Google Drive 的 PDF 備份連結 |

## 5. UI/UX 視覺規範 (Branding)

- **色彩：** 背景 `#020617` (Slate-950), 主色 `#3b82f6` (Blue-500), 強調色 `#06b6d4` (Cyan-500)。
- **組件：** 玻璃擬態 (Glassmorphism) 卡片、Lucide Icons (1.5px 粗細)。
- **響應式：** 側邊欄在手機端需可摺疊，主要操作按鈕需位於拇指易觸控區域。

## 6. 後端 API (GAS) 安全性

- **授權：** 每個 POST 請求必須在 Header 包含 `X-API-TOKEN`。
- **路由：**
  - `GET ?action=getContacts`
  - `GET ?action=getProducts`
  - `POST ?action=sync_lead`
  - `POST ?action=new_quotation` (含 PDF 存檔至 Drive 邏輯)

---
