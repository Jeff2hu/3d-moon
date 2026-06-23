import React, { useState } from "react";

/* ---------- 購買成功頁（展示用購買紀錄 · 後台 / 個人頁面風格） ---------- */
/* 透過 hash 路由進入：window.location.hash = "order-success" */

/* 展示用的訂單資料（僅供畫面呈現，非真實交易） */
const ORDER = {
  buyer: "陳宇軒",
  product: "城市桌遊尋寶 · 第九公主與黑森林的月門",
  edition: "標準版 · 2–12 人",
  qty: 1,
  price: "NT$ 680",
  orderNo: "MG-260521-001615",
  date: "2026-05-21 00:16",
  pay: "信用卡（**** 1615）",
  /* 詳細資料（點「顯示詳細資料」展開） */
  email: "yuxuan.chen@example.com",
  phone: "0912-***-615",
  contact: "陳宇軒",
  sessionDate: "2026-06-28（六）",
  sessionTime: "14:00 · 第三場",
  startStation: "捷運中山站 1 號出口",
  players: "4 人（含 1 名兒童）",
  invoice: "電子發票 · 手機條碼 /AB12345",
};

/* 後台 / 個人頁面用的中性配色 */
const C = {
  bg:      "#f1f5f9",   // 頁面底
  card:    "#ffffff",
  border:  "#e2e8f0",
  ink:     "#0f172a",
  sub:     "#64748b",
  muted:   "#94a3b8",
  brand:   "#2563eb",
  ok:      "#16a34a",
  okBg:    "#dcfce7",
  warnBg:  "#fffbeb",
  warnBd:  "#fde68a",
  warnInk: "#92400e",
};

const FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';

function Row({ label, value, strong }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:16, padding:"13px 0", borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontSize:14, color:C.sub, whiteSpace:"nowrap" }}>{label}</span>
      <span style={{ fontSize:strong?16:14, fontWeight:strong?700:500, color:C.ink, textAlign:"right" }}>{value}</span>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`,
      boxShadow:"0 1px 3px rgba(15,23,42,0.06)", padding:"22px 24px", ...style }}>
      {children}
    </div>
  );
}

function CardTitle({ children, right }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6, paddingBottom:14, borderBottom:`1px solid ${C.border}` }}>
      <div style={{ fontSize:14, fontWeight:700, color:C.ink }}>{children}</div>
      {right && <div style={{ marginLeft:"auto" }}>{right}</div>}
    </div>
  );
}

function Notice({ children }) {
  return (
    <li style={{ position:"relative", paddingLeft:20, fontSize:14, lineHeight:1.85, color:C.sub }}>
      <span style={{ position:"absolute", left:2, top:9, width:6, height:6, borderRadius:"50%", background:C.brand }}/>
      {children}
    </li>
  );
}

export default function OrderSuccess(){
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div style={{ position:"fixed", inset:0, overflowY:"auto", background:C.bg, fontFamily:FONT, color:C.ink }}>

      {/* 頂部導覽列（後台感） */}
      <header style={{ position:"sticky", top:0, zIndex:10, background:"#ffffff", borderBottom:`1px solid ${C.border}`,
        height:56, display:"flex", alignItems:"center", padding:"0 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, fontWeight:700, fontSize:15 }}>
          <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:28, height:28,
            borderRadius:8, background:C.brand, color:"#fff", fontSize:14 }}>尋</span>
          城市尋寶 · 會員中心
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10, color:C.sub, fontSize:14 }}>
          <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:30, height:30,
            borderRadius:"50%", background:"#e0e7ff", color:C.brand, fontWeight:700, fontSize:13 }}>陳</span>
          {ORDER.buyer}
        </div>
      </header>

      {/* 主要內容 */}
      <main style={{ maxWidth:760, margin:"0 auto", padding:"28px 20px 60px" }}>

        {/* 麵包屑 */}
        <div style={{ fontSize:13, color:C.muted, marginBottom:16 }}>
          會員中心 <span style={{ margin:"0 6px" }}>/</span> 我的訂單 <span style={{ margin:"0 6px" }}>/</span>
          <span style={{ color:C.sub }}>購買成功</span>
        </div>

        {/* 成功橫幅 */}
        <Card style={{ marginBottom:18, display:"flex", alignItems:"center", gap:16 }}>
          <span style={{ flexShrink:0, display:"inline-flex", alignItems:"center", justifyContent:"center",
            width:48, height:48, borderRadius:"50%", background:C.okBg }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.ok} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 L9 17 L4 12" />
            </svg>
          </span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:3 }}>購買成功</div>
            <div style={{ fontSize:14, color:C.sub }}>訂單已完成付款，感謝您的購買。</div>
          </div>
          <span style={{ flexShrink:0, fontSize:13, fontWeight:600, color:C.ok, background:C.okBg,
            padding:"5px 12px", borderRadius:999 }}>已付款</span>
        </Card>

        {/* 訂單明細 */}
        <Card style={{ marginBottom:18 }}>
          <CardTitle right={
            <button onClick={()=>setShowDetail(v=>!v)}
              style={{ padding:"6px 14px", borderRadius:7, border:`1px solid ${C.border}`, background:"#fff",
                color:C.brand, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                display:"inline-flex", alignItems:"center", gap:6 }}>
              {showDetail ? "收合詳細資料" : "顯示詳細資料"}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: showDetail ? "rotate(180deg)" : "none", transition:"transform .2s" }}>
                <path d="M6 9 L12 15 L18 9" />
              </svg>
            </button>
          }>
            訂單明細
          </CardTitle>

          <Row label="購買人"   value={ORDER.buyer} strong />
          <Row label="商品"     value={ORDER.product} />
          <Row label="版本"     value={ORDER.edition} />
          <Row label="數量"     value={`x ${ORDER.qty}`} />
          <Row label="訂單編號" value={ORDER.orderNo} />
          <Row label="付款方式" value={ORDER.pay} />
          <Row label="購買時間" value={ORDER.date} />

          {/* 展開後才顯示的詳細資料 */}
          {showDetail && (
            <div style={{ marginTop:6, padding:"14px 16px", background:"#f8fafc", border:`1px solid ${C.border}`, borderRadius:10 }}>
              <div style={{ fontSize:12, fontWeight:700, letterSpacing:"1px", color:C.muted, marginBottom:4 }}>場次與聯絡資料</div>
              <Row label="預約場次" value={`${ORDER.sessionDate} ${ORDER.sessionTime}`} />
              <Row label="集合地點" value={ORDER.startStation} />
              <Row label="遊玩人數" value={ORDER.players} />
              <Row label="聯絡人"   value={ORDER.contact} />
              <Row label="聯絡電話" value={ORDER.phone} />
              <Row label="電子信箱" value={ORDER.email} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:16, padding:"13px 0 0" }}>
                <span style={{ fontSize:14, color:C.sub }}>發票資訊</span>
                <span style={{ fontSize:14, fontWeight:500, color:C.ink, textAlign:"right" }}>{ORDER.invoice}</span>
              </div>
            </div>
          )}

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:16, paddingTop:14 }}>
            <span style={{ fontSize:14, color:C.sub }}>實付金額</span>
            <span style={{ fontSize:20, fontWeight:800, color:C.brand }}>{ORDER.price}</span>
          </div>
        </Card>

        {/* 遊玩須知 / 注意事項 */}
        <Card style={{ marginBottom:18 }}>
          <CardTitle>遊玩須知</CardTitle>
          <div style={{ background:C.warnBg, border:`1px solid ${C.warnBd}`, borderRadius:10, padding:"12px 16px",
            fontSize:13.5, color:C.warnInk, lineHeight:1.7, marginBottom:16 }}>
            ⚠️ 開始遊玩前，請務必詳閱以下說明，並確認您的預約場次與集合資訊。
          </div>
          <ul style={{ listStyle:"none", margin:0, padding:0, display:"flex", flexDirection:"column", gap:10 }}>
            <Notice>本遊戲為台北捷運實境解謎，請先預約場次。</Notice>
            <Notice>遊玩前請詳閱遊戲說明書與安全須知，並全程留意周遭交通與行人安全。</Notice>
            <Notice>建議攜帶可上網的智慧型手機並維持電量充足，部分謎題需掃描 QR Code。</Notice>
            <Notice>票券一經售出，恕不退換；如需<strong style={{ color:C.ink }}>更改場次或餐廳訂位詢問</strong>，請於<strong style={{ color:C.ink }}>遊玩日 3 日前</strong>聯繫客服。</Notice>
            <Notice>捷運車資、餐廳等額外費用須由玩家自行負擔，恕不包含於票價內。</Notice>
          </ul>

          {/* 訂位 / 聯絡資訊 */}
          <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${C.border}`,
            display:"flex", flexWrap:"wrap", gap:"10px 28px", fontSize:13.5, color:C.sub }}>
            <span>🕘 服務時間：每日 10:00 – 19:00</span>
          </div>
        </Card>

        {/* 入場憑證 */}
        <Card style={{ marginBottom:18, textAlign:"center" }}>
          <CardTitle>城市尋寶-捷運篇</CardTitle>
          <div style={{ display:"inline-block", padding:14, background:"#fff", borderRadius:12, border:`1px solid ${C.border}`, marginTop:4 }}>
            <img src="/order-qr.png" alt="入場憑證 QR Code" width={180} height={180}
              style={{ display:"block", width:180, height:180, imageRendering:"pixelated" }}/>
          </div>
          <div style={{ fontSize:13, color:C.sub, marginTop:14 }}>
            請掃描此憑證開始遊戲
          </div>
        </Card>

        {/* 動作 */}
        <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
          <button onClick={()=>{ window.location.hash=""; }}
            style={{ padding:"10px 22px", borderRadius:8, border:`1px solid ${C.border}`, background:"#fff",
              color:C.ink, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            返回首頁
          </button>
        </div>

        <div style={{ textAlign:"center", marginTop:28, fontSize:12, color:C.muted }}>
          ※ 本頁面為展示用購買紀錄
        </div>
      </main>
    </div>
  );
}
