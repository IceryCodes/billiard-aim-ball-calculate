# 資安 + 法遵精簡檢查:billiard-aim-ball-calculate(2026-11-01)

專案狀態:**已停止維護**,目標是「用最小成本活著、不要再吵」。
依 `Pochi/SECURITY_LEGAL_CHECKLIST_2026-11-01.md` 只做精簡版:A2 / A14 / A20 / A21 / A22 / A23 / A24 / A25,法遵只看 B1 / B2 / B35。

圖例:✅ 已有(附證據) / 🔧 這次修 / ⏭ 不適用 / 🙋 要 Icery 決定或手動做

部署分支:`release/v2.0`(= GitHub 預設分支 = Dependabot 掃的分支 = Vercel production)。

## A. 資安

| # | 項目 | 狀態 | 說明 / 證據 |
|---|---|---|---|
| A2 | 金鑰沒進前端 | 🔧 | 原本 `next.config.mjs` 把 `GOOGLE_API_MAP_KEY` 注入成 `NEXT_PUBLIC_GOOGLE_API_MAP_KEY` 進前端 bundle(這把就是被盜用、已撤銷的那把,外流管道最可能就是這裡)。已移除,連同 `GOOGLE_MAP_ID_LIGHT/DARK`。build 後掃 `.next/static`:`AIza…` 0 個、MongoDB URI 0、`service_role` 0、私鑰 0、`sk-` 只有 1 個 CSS 誤判(`--xy-minimap-mask-background`)。剩下的 `NEXT_PUBLIC_*` 都是網址 / 資料夾名 / GA ID / Supabase URL + anon key;anon key 本來就設計成公開,這裡只用在 Realtime broadcast 頻道,不讀寫資料表。 |
| A14 | 安全標頭 | 🔧 | `src/middleware.ts` 原本在 Vercel 上 **CSP 完全空白、HSTS 也空白**(只有本機非 Vercel 才有)。完整 CSP 要逐頁驗證,對停止維護的專案不划算 → Vercel 上加不會擋到任何功能的 `frame-ancestors 'none'; object-src 'none'; base-uri 'self'`,HSTS 改成 `max-age=31536000; includeSubDomains`(不加 preload)。原本就有:`X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy: camera=(), microphone=(), geolocation=()`。 |
| A20 | production 除錯關掉 | 🔧 | ①30 支 API 的錯誤回應原本是 `` `Server error: ${error}` ``,把 Mongo / 內部錯誤原文直接回給瀏覽器 → 改成「伺服器發生錯誤，請稍後再試。」,原文仍在 `console.error` 進 Vercel log。②`/api/system/stats`(記憶體 / 連線統計)原本只要 `ENABLE_SYSTEM_MONITORING=true` 就在 production 開放 → 改成只有本機開發可用。③`productionBrowserSourceMaps` 沒開(預設關),source map 不公開 ✅。 |
| A21 | 有漏洞的套件 | 🔧 / ⏳上游 | `npm audit` 37 個(1 critical / 13 high / 23 moderate)→ 升依賴後 19 個(全 moderate,eslint 8 工具鏈)→ 換 **ESLint 9 + flat config**(`eslint.config.mjs`;eslint 9.39、typescript-eslint 8、eslint-config-prettier 10、eslint-plugin-prettier 5.5、eslint-plugin-react 7.37,eslint-config-next 15.5 透過 FlatCompat)後 **17 個 moderate,全部來自同一個公告**。**`npm audit --omit=dev` = 0**(production 依賴全清)。<br>**清不掉的:`minimatch` [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)**(globparts 放大造成 DoS,moderate)。公告 2026-10-30 才發,只有 `minimatch 11.0.1+` 有修,**3.x / 9.x / 10.x 沒有 backport**。而整條 ESLint 生態目前最新版都還在舊版:eslint 9.39.5 用 `^3.1.5`(eslint 10.14 也只到 `^10.2.6`)、@eslint/eslintrc `^3.1.5`、typescript-eslint 8.72 `^10.2.2`、eslint-plugin-react 7.37.5 / eslint-plugin-import 2.32.0 / eslint-plugin-jsx-a11y 6.10.2 都是 `^3.1.2`。<br>試過的路:用 overrides 把 minimatch 全部壓到 11 **不行** —— 11 的 CommonJS 只有具名匯出(`exports.minimatch`、沒有 `default`、`__esModule: true`),eslint-plugin-import(我們用的 `import/order` 每個 import 都會呼叫)、jsx-a11y、react 是用 `_interopRequireDefault(require('minimatch')).default(...)` / 直接 `minimatch(...)` 呼叫,會變成 `undefined is not a function`,lint 直接壞掉。<br>風險評估:只影響本機 / build 時跑的 lint,輸入是我們自己的 glob 設定,不是使用者輸入,不進 production bundle。<br>**等上游**:上面這幾個套件發新版改用 minimatch 11 後,`npm update` 即可清零(repo 有開 Dependabot security updates 的話,它會在上游有修時自動開 PR)。 |
| A22 | 移除沒用的套件 | 🔧 | 移除 20 個沒 import 的套件:地圖三個(`@react-google-maps/api`、`@vis.gl/react-google-maps`、`@types/google.maps`),以及 `vite`、`@vitejs/plugin-react-swc`、`esbuild`、`less`(沒有 vite 設定、沒有 .less 檔)、`@testing-library/*` ×3、`@types/jest`(沒有測試)、`@tailwindcss/typography`(tailwind `plugins: []` 根本沒註冊)、`react-konva-utils`、`@eslint/compat`、`@eslint/js`、`@types/eslint`(當時沒有 flat config;後來 A21 改 ESLint 9 flat config 時 `@eslint/js` 依需要裝回)、`@types/bun`、`@babel/runtime`、`brace-expansion`、`cross-spawn`(這三個只是當初為了壓版本放進 dependencies,overrides 保留)。另刪掉停在 2025-07、跟 package-lock 不一致的 `bun.lockb`。 |
| A23 | 外露檔案 | ✅ / 🔧 | `public/` 只有 6 張圖 + `sitemap.xsl`,沒有 .env / 備份 / 內部文件。git 歷史從來沒有 commit 過 .env / .pem / key 檔(`git log --all --diff-filter=A` 查過)。🔧 `.gitignore` 原本只擋 `.env*.local`,補上 `.env`、`.env.*`(保留 `!.env.example`)。 |
| A24 | git 歷史金鑰 | ✅ | 用腳本掃 `git log --all -p`(Google key、OpenAI key、Mongo 帶密碼 URI、JWT、私鑰、AWS、GitHub token、寫死的 password/secret/token 指派),不印值。唯一命中:`68228d33`(2025-06-08)`src/global-components/inputs/Input.tsx` 的 `AutoCompleteType.Password / CurrentPassword` 列舉值(瀏覽器 autocomplete 名稱),**誤判**。Google Maps 那把沒有出現在 git 歷史,外流管道是 A2 的前端 bundle;**已撤銷**。 |
| A25 | 要換的金鑰 | 🙋 | 見文末「Icery 要手動做的事」第 3 點。git 歷史沒有其他外洩,不需要換其他金鑰。 |

## B. 法遵

| # | 項目 | 狀態 | 說明 |
|---|---|---|---|
| B1 | 隱私權政策 | 🙋 | **沒有這個頁面**。網站還開放註冊,收 email、姓名、性別、密碼(bcrypt 雜湊),並載入 Google Analytics + Vercel Analytics。建議二選一:①加一頁精簡隱私權政策(收什麼、用途、第三方 = MongoDB Atlas / Vercel / Supabase / Gmail SMTP / OpenAI / GA、聯絡信箱);②既然停止維護,直接關閉註冊。條款屬對外法律文件,沒有自己起草上線,等你決定。 |
| B2 | 服務條款 | 🙋 | **沒有這個頁面**。同 B1,跟 B1 一起決定。 |
| B35 | 商業聯絡資訊 | 🙋 | **全站沒有聯絡信箱**(`/api/send-feedback` 有後端但前端沒有任何地方用)。要放的話只放信箱,不放創創工作室 / 住址。 |

## Icery 要手動做的事

1. **GitHub Dependabot:不靜音,讓它照常運作**(用修掉的方式處理,不用關通知 / 關 Dependabot;之前加的 `open-pull-requests-limit: 0` 已刪掉)。
   - 推上去後,Dependabot 重掃預設分支 `release/v2.0`,除了 A21 的 minimatch(等上游)以外的警告會自動關閉。
   - 關掉舊 PR 並刪分支 `dependabot/npm_and_yarn/lodash-4.18.1`:lodash 已經不在依賴樹裡(移除地圖 / 沒用的套件後沒有人用它),PR 沒有意義了。
2. **Vercel 專案 billiard-aim-ball-calculate**:
   - Settings → Functions → **Fluid Compute 打開**。
   - Settings → Build → Ignored Build Step 設「Only build production」、Build Machine 選 Elastic(全域規則,若還沒設)。
   - Settings → Environment Variables:刪掉 `GOOGLE_API_MAP_KEY`、`GOOGLE_API_PLACE_KEY`、`GOOGLE_MAP_ID_LIGHT`、`GOOGLE_MAP_ID_DARK`(程式已不再讀);`ENABLE_SYSTEM_MONITORING` 若有也可刪。
3. **Google Cloud**:確認那個專案底下 Maps 用的 key 跟 Places 用的 key(若是兩把)**都已撤銷**;不再使用的話可以把 Maps / Places / Geocoding API 停用,避免之後有人誤建新 key。
4. **決定 B1 / B2 / B35**:加精簡隱私權政策 + 服務條款 + 聯絡信箱,或直接關閉註冊。
5. **推上線**:`git push origin HEAD:release/v2.0`(部署分支是 `release/v2.0`,不是 main)。推完到 Vercel Observability → Functions 看 `/api/get-google-infos` 應該幾乎沒有 invocation、`/courts/[courtCustomLink]` 與 `/api/get-court` 大部分被快取接走。

## 已知取捨

- 新增撞球場地需要地址轉座標(Google Geocoding)→ 金鑰撤銷後**無法新增球場**,表單會提示「地址自動定位已停用，目前無法新增撞球場地。」。編輯既有球場不受影響。
- 球場頁與 `/api/get-court` 快取 1 天:管理者改了球場資料最多 1 天後才看得到。
- 地圖、Google 評分 / 評論 / 照片都拿掉了;地址仍可點開 Google 地圖(一般連結,不需金鑰)。
