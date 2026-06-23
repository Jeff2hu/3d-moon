import React from "react";

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

export default function OrderSuccess(){
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
          <div style={{ fontSize:14, fontWeight:700, color:C.ink, marginBottom:6, paddingBottom:14, borderBottom:`1px solid ${C.border}` }}>
            訂單明細
          </div>
          <Row label="購買人"   value={ORDER.buyer} strong />
          <Row label="商品"     value={ORDER.product} />
          <Row label="版本"     value={ORDER.edition} />
          <Row label="數量"     value={`x ${ORDER.qty}`} />
          <Row label="訂單編號" value={ORDER.orderNo} />
          <Row label="付款方式" value={ORDER.pay} />
          <Row label="購買時間" value={ORDER.date} />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:16, paddingTop:14 }}>
            <span style={{ fontSize:14, color:C.sub }}>實付金額</span>
            <span style={{ fontSize:20, fontWeight:800, color:C.brand }}>{ORDER.price}</span>
          </div>
        </Card>

        {/* 入場憑證 */}
        <Card style={{ marginBottom:18, textAlign:"center" }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.ink, marginBottom:16, textAlign:"left",
            paddingBottom:14, borderBottom:`1px solid ${C.border}` }}>
            入場憑證
          </div>
          <div style={{ display:"inline-block", padding:14, background:"#fff", borderRadius:12, border:`1px solid ${C.border}` }}>
            <img src="/order-qr.png" alt="入場憑證 QR Code" width={180} height={180}
              style={{ display:"block", width:180, height:180, imageRendering:"pixelated" }}/>
          </div>
          <div style={{ fontSize:13, color:C.sub, marginTop:14 }}>
            請於活動現場出示此憑證
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
