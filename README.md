# 第九公主與黑森林的月門 · 互動故事網頁

沉浸式捲動敘事 + 章節密碼解謎（Vite + React）。

## 本機開發
```bash
npm install
npm run dev      # 開啟 http://localhost:5173
```

## 建置
```bash
npm run build    # 產出靜態檔到 dist/
npm run preview  # 本機預覽 build 結果
```

## 部署到 Vercel

**方式 A：GitHub + Vercel（推薦）**
1. 把這個資料夾推上 GitHub。
2. 到 https://vercel.com → New Project → Import 這個 repo。
3. Framework Preset 會自動偵測為 **Vite**（Build: `npm run build`，Output: `dist`），直接 Deploy。

**方式 B：Vercel CLI**
```bash
npm i -g vercel
vercel          # 第一次會引導設定
vercel --prod   # 部署正式版
```

## 章節密碼
- 第一章 → 第二章：`0725`
- 第二章 → 第三章：`2466`
- 第三章 → 第四章：`745`
- 第四章 → 終章：`227`

> 密碼寫在 `src/App.jsx` 最上方的 `GATES` 物件，可自行修改。
