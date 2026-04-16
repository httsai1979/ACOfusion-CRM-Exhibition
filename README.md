ACOfusion Lighting CRM 企業旗艦版規格說明書 (v9.0)

1. 系統核心與品牌視覺

本系統為 ACOfusion Lighting 量身打造，旨在實現從「名片錄入」到「專業報價」的全自動化。

品牌視覺： 採用深色工業風格 (#0F172A)，搭配 ACOfusion 標誌與天空藍 (#38BDF8) 重點色。

核心架構： 以 Google Sheets 為資料庫，GAS 為後端，Gemini 2.0 為 AI 大腦。

1. 標準化資料結構 (Standardized Schema)

為確保 AI 辨識與程式運算不產生誤差，所有底層分頁欄位統一為英文（前端介面顯示中文）：

A. Contacts (聯絡人庫)

欄位 ID

說明

id

系統唯一編號 (C-YYYYMMDD-ID)

company

客戶公司名稱

name

聯絡人全名

email

電子郵件 (主要識別 ID)

phone

電話/手機

address

公司地址

jobTitle

職稱

googleContactId

已同步至 Google Contacts 的資源 ID

lastUpdated

最後更新時間

B. Products (燈具庫)

規格屬性： SKU、瓦數 (Wattage)、色溫 (CCT)、IP等級、光束角 (Beam Angle)、單價、MOQ、保固期 (Warranty)。

C. Deals (報價與商機)

商務條款： 報價單號、總額、幣別 (USD/EUR/RMB/TWD)、Incoterms (EXW/FOB/CIF/DDP)、付款條件 (Deposit/Balance/Net Days)、PDF 連結、當前階段 (AI 判斷)。

1. 核心功能規格

模組 A：AI 名片與聯絡人同步

名片掃描： 使用 Gemini 2.0 Flash 提取資訊，並自動檢查 Email 是否已存在。

手機連動： 成功解析後，即時透過 People API 在 <james@acofusion.com> 的帳號中建立聯絡人，實現手機端同步。

批量導入： 針對現有 contacts.csv 進行深度映射，將 First Name 與 Last Name 合併。

模組 B：專業燈具報價引擎

自動帶入： 從 Contacts 選擇客戶，自動填入抬頭；從 Products 選擇燈具，帶入全規格。

靈活調整： 支援手動修改數量、單價及「規格備註」。

稅率與幣別：

USD/EUR： 0% VAT。

TWD： 自動加 5% VAT。

RMB： 自動加 13% VAT。

輸出規範： - Excel： 具備公式的開放格式。

PDF： 正式 A4 比例，帶公司 Logo 與技術規格。

檔名： [ACO-QT]-客戶公司-YYYYMMDD-V版次.pdf。

模組 C：智慧郵件與商機偵測

發信： 從 App 直接點擊發信，預設 <james@acofusion.com>，可附帶報價單連結。

附件歸檔： 所有生成的報價單附件，必須強制存入 ACOfusion Quotation Folder。

AI 分析回信： Gemini 讀取郵件內文，自動更新 Deals 表格中的「當前階段」與「建議行動」。

1. 部署環境

後端： Google Apps Script (Web App 模式)。

權限： 執行身份為「Me (<james@acofusion.com>)」，存取對象為「Anyone with Google Account」。

外部 API： 啟用 People API, Gmail API, Drive API。
