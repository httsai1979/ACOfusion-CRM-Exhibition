ACOfusion Lighting CRM 企業旗艦版規格說明書 (v6.0)

1. 系統願景與品牌核心

本系統是專為 ACOfusion Lighting 打造的智慧化管理工具，核心目標是「極大化自動化、零重複作業」。視覺設計以公司 Logo 為中心，採用深藍（#0F172A）與科技藍（#38BDF8）的工業風格，展現燈具工廠的現代感與可靠性。

1. 跨平台架構 (PC First, Mobile Optimized)

電腦端 (Desktop): 提供完整的儀表板視角，適合處理複雜的報價單編寫、財務條款調整與長篇郵件回覆。

手機端 (Mobile): 優化名片掃描功能，提供「大按鈕」操作介面與簡易商機追蹤，適合展會現場即時錄入。

基座: 透過 Google Apps Script (GAS) 將 React 前端與 Google 雲端工具（Sheets, Gmail, Contacts, Drive）緊密黏合。

1. 核心功能模組 (深度解構)

模組 A：名片視覺與聯絡人自動化 (AI OCR & Sync)

AI 辨識: 手機拍下名片後，Gemini 2.0 負責提取：姓名、公司、Email、手機、地址、職稱。

Google Contacts 同步: GAS 透過 People API 在您的公司帳號中自動建立該聯絡人，手機通訊錄會立即更新。

CRM 回填: 同時在試算表 Contacts 分頁建立一筆包含照片連結的新資料。

模組 B：智慧郵件與商機導航 (Gmail AI integration)

發信模式: 以 <james@acofusion.com> 為發信主體，支持 HTML 模板（自動帶入客戶稱呼與產品推薦）。

郵件歸檔與分析:

附件追蹤: 系統自動掃描發出與收到的郵件，將報價單附件自動歸檔至 Google Drive 指定資料夾。

AI 深度分析: Gemini 讀取客戶回信，自動更新 CRM 中的「當前階段」(例如：客戶在問樣品，系統自動將狀態改為 Sample Stage)。

下一動作 (Next Action): AI 提供行動建議，例如：「客戶對 MOQ 有疑慮，建議提供 5% 的折扣或縮短交期」。

模組 C：專業燈具報價引擎 (Pro Quotation Engine)

自動化生成: 點選客戶後自動帶入基本資料；點選產品後自動帶入規格（瓦數、CCT、IP、光束角等）。

商業參數自定義:

財務細節: 支持 USD / EUR / RMB / TWD，並根據實時/固定匯率計算 VAT 稅率。

支付條款: 支援設定訂金（Deposit）、尾款（Balance）、票期（Net Days）。

交貨條件: 點選切換 Incoterms (EXW, FOB, CIF, DDP) 與 Shipping Term。

售後與規則: 自動生成產品保固期與 MOQ 調整警示。

檔案輸出:

格式: 同時產生 Excel (供客戶編輯) 與 PDF (正式封閉格式)。

命名規範: [ACO-QT]-客戶公司-YYYYMMDD-Vn.pdf (例如：[ACO-QT]-Starbucks-20240520-V2.pdf)。

存儲: 自動存入 Google Drive 的 ACOfusion_Quotation 資料夾。

1. 資料庫架構 (Sheet Schema)

1. Contacts (聯絡人)

| 客戶 ID | 來源(展會名稱) | 公司名稱 | 聯絡人 | 職稱 | Email | 電話 | 地址 | Google Contact ID |

1. Products (產品庫 - 依據官網規格)

| 產品編號 | 照片 | 產品名稱 | 瓦數 | CCT | IP | 光束角 | 單價 | MOQ | 保固期 | 備註 |

1. Deals (報價與商機)

| 報價單號 | 客戶 ID | 總金額 | 幣別 | 狀態(詢價/樣品/訂單) | 附件連結 (Drive) | AI 建議 | 下次追蹤日期 |

1. 自動化部署 SOP (非工程師適用)

第一階段：資產準備 (前)

Google 表格: 建立具備上述標題的 Google Sheets。

Google Drive: 建立 ACOfusion_CRM_Assets 總資料夾，下設 Photos 與 Quotations 子資料夾。

API 密鑰: 取得 Gemini 免費 API Key 並安全存放在 GAS Script Properties 中。

第二階段：邏輯串聯 (中)

部署 GAS: 將我提供的「膠水代碼」貼入 GAS 編輯器，這會處理 Gmail 監聽、PDF 生成與 Google Contacts 寫入。

設定觸發器: 設定每分鐘檢查一次 Gmail CRM_Sync 標籤的郵件。

第三階段：介面發布 (後)

Web App 部署: 點選 GAS 的「部署」>「網頁應用程式」，將獲得一個專屬連結。

使用: 電腦用瀏覽器開啟此連結即為完整 CRM；手機將此網頁加入主畫面即成為 App。
