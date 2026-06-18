import React, { useEffect, useRef, useState, Suspense } from "react";
import { ChevronDown, ArrowUp, Lock } from "lucide-react";

const Portal3D = React.lazy(() => import("./Portal3D.jsx"));
const World3D = React.lazy(() => import("./World3D.jsx"));

/* themes (deep bg per chapter) */
const T = {
  pro:  { bg:"#0b1322", bg2:"#060b16", ink:"#cdd6e6", glow:"#f2d78c", soft:"#8a93a8", line:"#3a4860" },
  ch1:  { bg:"#0d1526", bg2:"#070b16", ink:"#ccd5e6", glow:"#f2d78c", soft:"#7e8aa6", line:"#3a4664" },
  ch2:  { bg:"#0a1812", bg2:"#050f0a", ink:"#cde0d6", glow:"#f0c46a", soft:"#7f9a84", line:"#2e4a3c" },
  ch3:  { bg:"#1a0d12", bg2:"#0c0608", ink:"#e6d2cc", glow:"#f0b48a", soft:"#a8807e", line:"#4a2c30" },
  ch4:  { bg:"#16110a", bg2:"#0b0805", ink:"#ded0b0", glow:"#ecd49a", soft:"#9a8a64", line:"#4a3c24" },
  fin:  { bg:"#140f0c", bg2:"#0a0605", ink:"#ecdccc", glow:"#f6c87e", soft:"#a88c76", line:"#4a382c" },
};

const rnd = (a,b)=> a + Math.random()*(b-a);
const STARS = Array.from({length:46},()=>({l:rnd(0,100),t:rnd(0,100),s:rnd(1,2.4),d:rnd(0,4),u:rnd(2.5,6)}));
const LANTERNS = Array.from({length:10},(_,i)=>({l:rnd(4,96),d:rnd(0,8),u:rnd(7,13),s:rnd(2.5,5)}));
const STREAKS = Array.from({length:11},()=>({t:rnd(8,86),d:rnd(0,5),u:rnd(2.4,4.6),w:rnd(40,120),o:rnd(0.4,0.95)}));
const DUST = Array.from({length:16},()=>({l:rnd(0,100),t:rnd(0,100),s:rnd(1.5,3.5),d:rnd(0,6),u:rnd(6,12)}));
const EMBERS = Array.from({length:14},()=>({l:rnd(20,80),d:rnd(0,5),u:rnd(4,9),s:rnd(1.5,3)}));
const FIREFLIES = Array.from({length:18},()=>({l:rnd(2,98),t:rnd(28,92),d:rnd(0,6),u:rnd(5,9),s:rnd(1.5,3)}));
const BEAM_MOTES = Array.from({length:22},()=>({x:rnd(0,100),y:rnd(0,100),d:rnd(0,6),u:rnd(5,11),s:rnd(1,2.6)}));

/* 視差位移：依傾斜量(--tx/--ty)平移，d 越大層次越「近」 */
const PX=(d)=>`translate3d(calc(var(--tx,0) * ${d}px), calc(var(--ty,0) * ${(d*0.66).toFixed(2)}px), 0)`;

/* 過關開門特效：放射粒子 */
const BURST = Array.from({length:30},(_,i)=>({a:(360/30)*i + rnd(-6,6), d:rnd(130,300), u:rnd(0.75,1.25), de:rnd(0,0.12), s:rnd(2,5.5)}));

const REDUCE = typeof window!=="undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 3D 景深浮現：劇情隨捲動自深處浮上，定格閱讀，滑過後輕飄離開 ---------- */
function Reveal({children, delay=0, as="div", style}){
  const ref=useRef(null);
  useEffect(()=>{
    const el=ref.current; if(!el) return;

    if(REDUCE){
      el.style.opacity=0; el.style.transition="opacity .8s ease";
      const o=new IntersectionObserver(([e])=>{ if(e.isIntersecting){ el.style.opacity=1; o.disconnect(); }},{threshold:0.15});
      o.observe(el); return ()=>o.disconnect();
    }

    let raf=0, active=false;
    const apply=()=>{
      const vh=window.innerHeight||1;
      const r=el.getBoundingClientRect();
      const c=r.top + r.height/2;
      const t=(c - vh*0.56)/vh;        // >0：在焦點下方（深處）；<0：已滑過（上方）
      const dead=0.10;                 // 焦點附近的「定格閱讀」死區
      let z=0,y=0,sc=1,op=1,blur=0,rot=0;
      if(t>dead){                      // 自深處浮上
        const k=Math.min(1,(t-dead)/0.5); const e=k*k*(3-2*k);
        z=-300*e; y=70*e; sc=1-0.14*e; op=1-e; blur=3*e; rot=6*e;
      } else if(t<-dead){              // 滑過焦點，輕飄離場
        const k=Math.min(1,(-t-dead)/0.6); const e=k*k*(3-2*k);
        z=70*e; y=-34*e; sc=1+0.04*e; op=1-0.9*Math.max(0,(k-0.4)/0.6); rot=-3*e;
      }
      el.style.transform=`perspective(1000px) translate3d(0,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateX(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      el.style.opacity=Math.max(0,Math.min(1,op)).toFixed(3);
      el.style.filter=blur>0.05?`blur(${blur.toFixed(2)}px)`:"none";
      if(active) raf=requestAnimationFrame(apply);
    };
    const io=new IntersectionObserver(([e])=>{
      if(e.isIntersecting){ if(!active){ active=true; raf=requestAnimationFrame(apply); } }
      else { active=false; cancelAnimationFrame(raf); }
    },{rootMargin:"60% 0px 60% 0px"});
    el.style.willChange="transform,opacity,filter";
    io.observe(el); apply();
    return ()=>{ active=false; cancelAnimationFrame(raf); io.disconnect(); };
  },[]);
  const Tag=as;
  return <Tag ref={ref} style={{...style, opacity:0, transform:"perspective(1000px) translate3d(0,70px,-300px) scale(0.86)"}}>{children}</Tag>;
}

/* ---------- ambient motifs ---------- */
function Stars({op=1, depth=6}){ return (<div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",transform:PX(depth)}}>
  {STARS.map((s,i)=>(<span key={i} style={{position:"absolute",left:s.l+"%",top:s.t+"%",width:s.s,height:s.s,borderRadius:"50%",background:"#f4e9c4",opacity:op,boxShadow:`0 0 ${(s.s*2).toFixed(1)}px #f4e9c4aa`,animation:`tw ${s.u}s ease-in-out ${s.d}s infinite`}}/>))}
</div>); }

function MoonGate({size=300,glow="#f2d78c"}){
  return (
  <svg width={size} height={size} viewBox="0 0 300 300" style={{display:"block"}}>
    <defs><radialGradient id="mg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#1a2b48"/><stop offset="100%" stopColor="#0a1322"/></radialGradient></defs>
    <circle cx="150" cy="150" r="120" fill="none" stroke="#2a3a5c" strokeWidth="1" opacity="0.5"/>
    <circle cx="150" cy="150" r="104" fill="url(#mg)"/>
    <g style={{animation:"spin 60s linear infinite",transformOrigin:"150px 150px"}}>
      <circle cx="150" cy="150" r="96" fill="none" stroke={glow} strokeWidth="1" strokeDasharray="2 12" opacity="0.7"/>
    </g>
    <circle cx="150" cy="150" r="104" fill="none" stroke={glow} strokeWidth="2.5" style={{animation:"pulse 4s ease-in-out infinite"}}/>
    <path d="M150 96 A54 54 0 1 0 150 204 A40 40 0 1 1 150 96 Z" fill="#ecdfb0" style={{animation:"pulse 4s ease-in-out infinite"}}/>
  </svg>);
}

function Forest(){ return (<div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
  <Stars op={0.5} depth={5}/>
  <div style={{position:"absolute",left:"50%",top:"-12%",width:"64%",height:"82%",transform:"translateX(-50%)",background:"radial-gradient(ellipse at top,#f0c46a26,transparent 70%)"}}/>
  <div style={{position:"absolute",inset:0,transform:PX(14)}}>
    {FIREFLIES.map((f,i)=>(<span key={i} style={{position:"absolute",left:f.l+"%",top:f.t+"%",width:f.s,height:f.s,borderRadius:"50%",background:"#c6e892",boxShadow:`0 0 ${(f.s*4).toFixed(1)}px #9ed06a`,animation:`fly ${f.u}s ease-in-out ${f.d}s infinite`}}/>))}
  </div>
  <div style={{position:"absolute",inset:0,transform:PX(9)}}>
    {LANTERNS.map((l,i)=>(<span key={i} style={{position:"absolute",bottom:"-20px",left:l.l+"%",width:l.s,height:l.s,borderRadius:"50%",background:"#f0c46a",boxShadow:`0 0 ${(l.s*4).toFixed(1)}px #f0c46a`,animation:`rise ${l.u}s linear ${l.d}s infinite`}}/>))}
  </div>
  <svg width="100%" height="200" viewBox="0 0 1200 200" preserveAspectRatio="none" style={{position:"absolute",bottom:0,left:0,opacity:0.5,transform:PX(7)}}>
    <path d="M0 200 L0 150 L70 158 L140 122 L210 158 L280 130 L360 160 L440 126 L520 158 L600 122 L680 158 L760 130 L840 160 L920 126 L1010 158 L1100 130 L1200 150 L1200 200 Z" fill="#0a1c11"/>
  </svg>
  <svg width="100%" height="180" viewBox="0 0 1200 180" preserveAspectRatio="none" style={{position:"absolute",bottom:0,left:0,opacity:0.92,transform:PX(18)}}>
    <path d="M0 180 L0 120 L40 130 L90 90 L150 130 L210 96 L280 134 L350 100 L430 134 L500 96 L580 130 L650 100 L730 134 L800 96 L880 130 L950 104 L1030 134 L1100 100 L1160 130 L1200 110 L1200 180 Z" fill="#06120c"/>
  </svg>
</div>); }

function Bridge(){ return (<div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
  <Stars op={0.32} depth={4}/>
  <div style={{position:"absolute",left:0,right:0,top:"38%",height:"24%",background:"radial-gradient(ellipse at center,#f0b48a22,transparent 70%)"}}/>
  <div style={{position:"absolute",inset:0,transform:PX(12)}}>
    {STREAKS.map((s,i)=>(<span key={i} style={{position:"absolute",top:s.t+"%",left:"-220px",width:s.w,height:3,borderRadius:3,background:"linear-gradient(90deg,transparent,#ffd9a0,#f0b48a,transparent)",boxShadow:"0 0 10px #f0b48a99",opacity:s.o,animation:`streak ${s.u}s linear ${s.d}s infinite`}}/>))}
  </div>
  <div style={{position:"absolute",inset:0,transform:PX(7)}}>
    {STREAKS.slice(0,6).map((s,i)=>(<span key={i} style={{position:"absolute",top:(s.t+5)+"%",right:"-220px",width:s.w*0.8,height:2,borderRadius:2,background:"linear-gradient(90deg,transparent,#9ec0ff,transparent)",boxShadow:"0 0 8px #9ec0ff88",opacity:s.o*0.8,animation:`streakR ${(s.u*1.1).toFixed(2)}s linear ${s.d}s infinite`}}/>))}
  </div>
  <svg width="100%" height="200" viewBox="0 0 1200 200" preserveAspectRatio="none" style={{position:"absolute",bottom:0,left:0,opacity:0.8,transform:PX(16)}}>
    <path d="M0 150 Q600 70 1200 150" fill="none" stroke="#6a3e32" strokeWidth="3"/>
    <path d="M0 180 Q600 110 1200 180" fill="none" stroke="#3a201c" strokeWidth="12"/>
  </svg>
</div>); }

function Dust(){ return (<div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
  <Stars op={0.3} depth={4}/>
  <div style={{position:"absolute",top:"-20%",left:"54%",width:"42%",height:"140%",transform:"rotate(13deg)",background:"linear-gradient(180deg,#ecd49a24,transparent 76%)",filter:"blur(6px)"}}/>
  <div style={{position:"absolute",inset:0,transform:PX(12)}}>
    {DUST.map((d,i)=>(<span key={i} style={{position:"absolute",left:d.l+"%",top:d.t+"%",width:d.s,height:d.s,borderRadius:"50%",background:"#ecd49a",opacity:0.6,boxShadow:`0 0 ${(d.s*2).toFixed(1)}px #ecd49a`,animation:`drift ${d.u}s ease-in-out ${d.d}s infinite`}}/>))}
  </div>
</div>); }

function DoorGlow(){ return (<div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
  <div style={{position:"absolute",left:"50%",top:"42%",width:300,height:420,transform:"translate(-50%,-50%)",borderRadius:"50%",background:"radial-gradient(ellipse at center, #f6c87e55 0%, #f6c87e18 40%, transparent 70%)",animation:"breathe 5s ease-in-out infinite"}}/>
  {EMBERS.map((e,i)=>(<span key={i} style={{position:"absolute",bottom:"-10px",left:e.l+"%",width:e.s,height:e.s,borderRadius:"50%",background:"#f6c87e",boxShadow:`0 0 ${e.s*3}px #f6c87e`,animation:`rise ${e.u}s linear ${e.d}s infinite`}}/>))}
</div>); }

/* ---------- paragraph rendering ---------- */
function lines(s){ return s.split("\n").map((l,i)=>(<React.Fragment key={i}>{i>0&&<br/>}{l}</React.Fragment>)); }

function Scene({paras, t}){
  const out=[]; let i=0; let k=0;
  while(i<paras.length){
    const p=paras[i];
    if(["ii","ib","ic"].includes(p.t)){
      const grp=[]; while(i<paras.length && ["ii","ib","ic"].includes(paras[i].t)){ grp.push(paras[i]); i++; }
      out.push(
        <Reveal key={"q"+k} delay={80}>
          <div style={{maxWidth:660,margin:"2.4em auto",padding:"22px 24px",border:`1px solid ${t.line}`,borderRadius:10,background:"rgba(0,0,0,0.28)",backdropFilter:"blur(2px)"}}>
            <div style={{fontSize:12,letterSpacing:"5px",color:t.glow,textAlign:"center",opacity:0.8,marginBottom:14}}>謎 題</div>
            {grp.map((g,j)=>{
              const st=g.t==="ib"
                ? {margin:"0",fontSize:"clamp(15px,2.1vw,17px)",lineHeight:2,color:t.ink,textAlign:"justify",opacity:0.95}
                : {margin:g.t==="ic"?"14px 0 0":(j===0?"0":"8px 0 0"),fontSize:"clamp(16px,2.4vw,19px)",lineHeight:1.6,color:t.glow,textAlign:"center",fontStyle:"italic"};
              return <p key={j} style={st}>{lines(g.x)}</p>;
            })}
          </div>
        </Reveal>); k++;
      continue;
    }
    const big=p.t==="big", glow=p.t==="g", tail=p.t==="tail";
    const st = glow ? {maxWidth:760,margin:"1.5em auto",fontSize:"clamp(22px,4.4vw,32px)",lineHeight:1.5,color:t.glow,textAlign:"center",fontWeight:600,letterSpacing:"1px",fontStyle:"italic",textShadow:`0 0 24px ${t.glow}55`}
      : big ? {maxWidth:760,margin:"0.6em auto 0.3em",fontSize:"clamp(30px,7vw,52px)",lineHeight:1.3,color:t.glow,textAlign:"center",fontWeight:700,letterSpacing:"4px",textShadow:`0 0 30px ${t.glow}66`}
      : tail ? {maxWidth:640,margin:"0.8em auto 0",fontSize:"clamp(14px,2vw,16px)",lineHeight:1.7,color:t.soft,textAlign:"center",letterSpacing:"1px"}
      : {maxWidth:640,margin:"0 auto 1.15em",fontSize:"clamp(16px,2.5vw,19px)",lineHeight:2,color:t.ink,textAlign:"justify"};
    out.push(<Reveal key={"p"+k} delay={glow||big?60:0} style={st} as="p">{lines(p.x)}</Reveal>); k++;
    i++;
  }
  return <>{out}</>;
}

/* ---------- story content ---------- */
const STORY = [
  { id:"pro", num:"序曲", title:"被決定的命運", t:T.pro, motif:"stars", paras:[
    {t:"n",x:"在遙遠的國度，有一個繁榮富庶的王國——新安國。國王共有九位公主，前八位為了父王與國家，紛紛嫁往各國聯姻。"},
    {t:"n",x:"可她們似乎都未能得到真正的幸福：捲入王位鬥爭、遠嫁後終身孤寂、被迫成為政治籌碼。身為唯一還未出嫁的妳——第九位公主，把這一切看在眼裡。"},
    {t:"n",x:"某日，國王召開會議，向九公主宣布：「明日，妳將代表新安國，下嫁南方強國，以換取和平。」她內心如遭雷擊——因為她早已有心愛之人，鄰國基耳國的龍羽王子。"},
    {t:"n",x:"她決定違抗命運。深夜，鐘樓敲響十二下，她備妥馬匹，悄悄離開了王宮，抄了一條近路——傳說中的「黑森林」。然而昏暗的夜色讓她失足跌落，誤觸了那道古老的月門……"},
    {t:"g",x:"「動……木……萬……\n辛……麟……梨……」"},
    {t:"tail",x:"轟隆一聲巨響——周遭，彷彿停止了。"},
  ]},
  { id:"ch1", num:"第一章", title:"迷宮中的舞台", t:T.ch1, motif:"city", paras:[
    {t:"n",x:"「這裡是哪裡…？」九公主跟著人群走出諾大的鐵箱子，四周盡是她從未見過的居民、服飾與街景，映入眼簾的空間彷彿一座迷宮的入口；而方才載著她的鐵箱子，正在身後轟然高速駛離。"},
    {t:"n",x:"人潮不時推擠碰撞，加上全然陌生的環境，使她暈頭轉向、心慌不已。忽然間，不遠處有位和藹的婆婆緩緩朝她走來，從袖口取出一根魔法棒，輕念了一段咒語："},
    {t:"g",x:"「霹靂卡霹靂拉拉，波波莉娜貝貝魯多」"},
    {t:"n",x:"婆婆憑空變出一個小盒子，遞到她手中，柔聲說道：「孩子，你不是這裡的人吧？帶著它，完成你的使命。不過在那之前——你得先回到，你與他的命運第一次交會的地方。"},
    {t:"n",x:"那是一間黑暗的屋子，陌生人並肩而坐，光影在牆上流轉、低聲訴說著別人的故事……而你們兩人的故事，就是從那片光影裡，悄悄開始的。」"},
    {t:"g",x:"「找到答案之後，再到那座舞台來找我吧。」"},
    {t:"n",x:"婆婆化作一縷輕煙消散，只在她掌心留下一個微涼的盒子。盒蓋上是一道三位數的密碼鎖，鎖旁緩緩浮現一行字跡："},
    {t:"ii",x:"先知曉自己身在何處，\n再知曉旅程付出的代價，\n兩者相連，便能開啟命運之門。"},
  ]},
  { id:"ch2", num:"第二章", title:"拒絕入睡的森林", t:T.ch2, motif:"forest", paras:[
    {t:"n",x:"當第一道封印應聲解開，盒蓋輕輕彈起。就在此刻，一個溫柔、卻不屬於任何人的聲音，在妳腦海中響起："},
    {t:"g",x:"「若想躲避命運的追兵，妳必須前往一座會呼吸的森林。」"},
    {t:"n",x:"「那座森林，坐落在高塔的中央——四面被樓宇環抱，卻比任何地方都更接近自然。那裡藏著一個祕密：每年只有一夜，森林會拒絕入睡。」"},
    {t:"n",x:"「那一夜，燈火徹夜不滅，人們湧入林間，起舞、歌唱、發著光，把整座森林點亮成一座不眠的舞台，直到黎明降臨。」"},
    {t:"g",x:"「妳會熟悉那樣的夜晚……因為在妳的世界，那座森林，叫做『黑森林』。」"},
    {t:"n",x:"黑森林——那不正是她墜入月門的地方嗎？原來它們像是同一座森林的兩面：一面通往幽暗的命運，一面卻在某個夜裡，化作最明亮的舞台。妳忽然明白了，婆婆口中的「舞台」，或許就是這座每年甦醒一夜的森林本身。"},
    {t:"n",x:"聲音漸漸淡去，盒蓋內側浮現出三行細小的字跡，像是留給她的謎語："},
    {t:"ii",x:"森林甦醒的那一夜，萬物被點亮——"},
    {t:"ib",x:"其一：那座森林甦醒、化作不眠舞台的那一夜，是這座城紀年裡的哪一年？\n其二：地底的小廣場上，藏著幾位最先睜眼的守望者？\n其三：而真正能走出地底、見到星空的大門，又有幾道？"},
    {t:"ic",x:"將這三個數字依序相連，命運之門便會為妳開啟。"},
  ]},
  { id:"ch3", num:"第三章", title:"兩條命運的交會", t:T.ch3, motif:"bridge", paras:[
    {t:"n",x:"公主循著盒子的指引，一路來到一座大橋邊。人群之中，一個熟悉的身影撞進她眼裡——「龍羽王子？！」她不敢置信地奔了過去，王子也震驚地一把握住她的手："},
    {t:"n",x:"「我為了找妳，一路追到黑森林，卻在月門前一個失足，也跌了進來。醒來後，一位老婆婆對我說：『拿著這個完成你的使命，到那片天空找我吧。』」公主一愣：「我也遇見了同一位婆婆……可她對我說的，是『到那座舞台找我吧』。」"},
    {t:"g",x:"一個指向天空，一個指向舞台——\n同一位婆婆，兩句話，藏著參不透的深意。"},
    {t:"n",x:"於是他們在大橋邊住了下來，一同等待婆婆現身。每到黎明與黃昏，橋上便奔流過一條由千萬鋼鐵獸組成的河——轟鳴著、閃著光，自橋的這頭，一路湧向那頭。兩人日日並肩看著那條鋼鐵之河流過，數日，數月。"},
    {t:"g",x:"原來只要兩個人在一起，連異鄉都能住成家。"},
    {t:"n",x:"直到某天，循著線索尋到婆婆的住所，才赫然驚覺——她竟是傳說中的神仙教母。只因她動了惻隱之心、插手了凡間的一段感情，觸犯天規，被帶回那所古老的學校受罰。公主與王子相視，滿是愧疚。"},
    {t:"g",x:"「她會落得如此，全是因為幫了我們。那麼，就換我們去，把她找回來。」"},
    {t:"ib",x:"其一：若要登上最接近天空的那一層，得先穿過幾道並肩而立的守衛？\n其二：據說這座高塔不僅向天際生長，也向地底扎根。若從最深處開始細數，直到最高處為止，共有多少層階可供旅人駐足？\n其三：橋畔的牆上懸著一幅奇異的繪卷，其上布滿錯綜複雜的路徑，如蛛網般向四方延伸。而在那些路徑之間，散落著一枚枚被紅色方框圈起的印記。公主不知其意，只覺那似乎是旅人停駐與啟程之處。"},
  ]},
  { id:"ch4", num:"第四章", title:"百年學堂的入口", t:T.ch4, motif:"dust", paras:[
    {t:"n",x:"解開橋的封印後，盒子深處「喀」地彈出一格暗層，裡頭靜靜躺著一把生了鏽的小鑰匙。兩人趕回教母的住所翻箱倒櫃，直到公主在最深的櫃子裡，摸到一本蒙著厚厚灰塵的舊書。"},
    {t:"g",x:"封面燙金的字跡早已斑駁，卻仍能勉強辨認：《辛澤蘭莊園》"},
    {t:"n",x:"公主輕輕拂去灰塵，書頁竟無風自動地翻開，浮現一行字：「此乃教母養成之地。一所比這座城市還要古老的學堂，最初沒有校舍，孩子們在神殿裡念書，香火與書聲，一代一代，從未斷絕。」"},
    {t:"g",x:"「莊園之名，藏著它的所在。新生之地，方正之城——拆開它，你便知道該往何處去。」"},
    {t:"n",x:"「想找到她，就到那座學堂的門前來。」公主與王子對望：「想必……教母，就被關在那裡。」書頁的字跡又緩緩浮現新的指引："},
    {t:"ib",x:"其一：學堂從不對凡人敞開正門。在這座地底車站中，唯有一道出口通往它。\n其二：通往學堂的道路上，據說散落著許多被時間遺忘的咒文。它們沉睡在石牆之中，靜靜守望著來訪之人。唯有看見它們全部的人，才能找到真正的入口。"},
  ]},
  { id:"fin", num:"終章", title:"藏在二樓的祕密", t:T.fin, motif:"door", paras:[
    {t:"n",x:"循著《辛澤蘭莊園》的指引，公主與王子來到城中一處不起眼的樓梯。書頁的最後一行字，在此刻緩緩亮起："},
    {t:"g",x:"「它的入口，總是藏在一個『祕密』之後——唯有登上二樓，對著門前說出那句密語，門，才會為你們而開。」"},
    {t:"n",x:"公主握緊手中的盒子，與王子相視一眼。一路走來的迷宮、森林、大橋與學堂，原來都是為了把他們引到這扇門前。他們深吸一口氣，循著階梯緩緩登上二樓，輕聲念出門前的密語。"},
    {t:"n",x:"話音落下，門後忽然透出溫暖的光——門，緩緩為他們開啟。門內並不是什麼陰森的學堂，也沒有受罰的教母。等著她的，是一桌燭光、是熟悉的笑臉，是一個她從未預料、卻等了一整段旅程的——"},
    {t:"big",x:"最後一道測試"},
    {t:"tail",x:"而這道測試的答案，將解開這一切的來龍去脈……"},
  ]},
];

/* ---------- 第一章：藏在背景的「電影院」暗示 ---------- */
function Cinema(){ return (<div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
  {/* 銀幕微光 */}
  <div style={{position:"absolute",left:"50%",top:"26%",width:"58%",maxWidth:540,height:"30%",transform:`translateX(-50%) ${PX(-4)}`,borderRadius:6,background:"linear-gradient(180deg,#acc4e61c,#6f8fb80c)",boxShadow:"0 0 70px #6f8fb826",animation:"flicker 6s steps(14) infinite"}}/>
  {/* 放映光束：自右上角投向銀幕 */}
  <div style={{position:"absolute",top:"5%",right:"7%",width:"72%",height:"48%",background:"linear-gradient(250deg,#f4e9c422,transparent 60%)",clipPath:"polygon(100% 2%,100% 16%,0 84%,0 60%)",animation:"flicker 5s steps(11) infinite"}}/>
  {/* 放映機光點 */}
  <span style={{position:"absolute",top:"5%",right:"6.5%",width:8,height:8,borderRadius:"50%",background:"#fff2c4",boxShadow:"0 0 18px 5px #f4e9c4cc",animation:"flicker 3s steps(9) infinite"}}/>
  {/* 光束中的塵埃 */}
  <div style={{position:"absolute",inset:0,transform:PX(6)}}>
    {BEAM_MOTES.map((m,i)=>(<span key={i} style={{position:"absolute",left:(18+m.x*0.62)+"%",top:(6+m.y*0.42)+"%",width:m.s,height:m.s,borderRadius:"50%",background:"#f4e9c4",opacity:0.5,animation:`drift ${m.u}s ease-in-out ${m.d}s infinite`}}/>))}
  </div>
  {/* 並肩而坐、一同看電影的兩個剪影 */}
  <svg width="100%" height="200" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax meet" style={{position:"absolute",bottom:0,left:0,transform:PX(-3)}}>
    <g fill="#03060c">
      <ellipse cx="525" cy="230" rx="78" ry="120"/>
      <circle cx="525" cy="96" r="34"/>
      <ellipse cx="700" cy="232" rx="80" ry="122"/>
      <circle cx="700" cy="92" r="35"/>
    </g>
  </svg>
</div>); }

function Motif({m}){
  if(m==="forest") return <Forest/>;
  if(m==="bridge") return <Bridge/>;
  if(m==="dust") return <Dust/>;
  if(m==="door") return <DoorGlow/>;
  if(m==="city") return (<div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}><Stars op={0.4} depth={5}/>
    <Cinema/>
    <svg width="100%" height="170" viewBox="0 0 1200 170" preserveAspectRatio="none" style={{position:"absolute",bottom:0,left:0,opacity:0.85,transform:PX(16)}}>
      <path d="M0 170 L0 100 L60 100 L60 70 L120 70 L120 110 L190 110 L190 60 L240 60 L240 110 L320 110 L320 84 L380 84 L380 116 L470 116 L470 70 L520 70 L520 116 L600 116 L600 90 L670 90 L670 116 L760 116 L760 64 L820 64 L820 116 L900 116 L900 92 L970 92 L970 116 L1060 116 L1060 74 L1120 74 L1120 116 L1200 116 L1200 170 Z" fill="#060b16"/>
    </svg>
  </div>);
  return <Stars op={0.6}/>;
}

/* ---------- password gates between chapters ---------- */
/* keyed by STORY index of the chapter the gate guards */
const GATES = { 2:"0725", 3:"2466", 4:"745", 5:"227" };

function CodeInput({ answer, accent, onSolved }){
  const len = answer.length;
  const [vals,setVals] = useState(()=>Array(len).fill(""));
  const [status,setStatus] = useState("");
  const refs = useRef([]);
  const set = (i,raw)=>{
    const v = raw.replace(/[^0-9]/g,"").slice(-1);
    const nv=[...vals]; nv[i]=v; setVals(nv); if(status!=="ok") setStatus("");
    if(v && i<len-1) refs.current[i+1]?.focus();
    if(nv.every(d=>d!=="")){
      if(nv.join("")===answer){ setStatus("ok"); setTimeout(()=>onSolved(),650); }
      else { setStatus("err"); setTimeout(()=>{ setVals(Array(len).fill("")); setStatus(""); refs.current[0]?.focus(); },650); }
    }
  };
  const key=(i,e)=>{ if(e.key==="Backspace" && !vals[i] && i>0) refs.current[i-1]?.focus(); };
  return (
    <div>
      <div style={{display:"flex",gap:10,justifyContent:"center",animation:status==="err"?"shake .4s":"none"}}>
        {vals.map((d,i)=>(
          <input key={i} ref={el=>refs.current[i]=el} value={d} disabled={status==="ok"}
            onChange={e=>set(i,e.target.value)} onKeyDown={e=>key(i,e)}
            inputMode="numeric" maxLength={1} aria-label={`密碼第 ${i+1} 位`}
            style={{width:46,height:58,textAlign:"center",fontSize:26,fontWeight:700,
              color:status==="ok"?accent:"#f4ecd6",background:"rgba(0,0,0,0.35)",
              border:`1.5px solid ${status==="err"?"#d05a4a":status==="ok"?accent:accent+"88"}`,
              borderRadius:8,outline:"none",caretColor:accent,transition:"border-color .2s"}}/>
        ))}
      </div>
      <div style={{height:22,marginTop:13,textAlign:"center",fontSize:13,letterSpacing:"2px"}}>
        {status==="err" && <span style={{color:"#e08a7a"}}>密碼不符，再試一次</span>}
        {status==="ok" && <span style={{color:accent}}>✦ 封印解除 ✦</span>}
      </div>
    </div>
  );
}

/* ---------- 過關：開啟下一道門的全螢幕特效 ---------- */
function UnlockEffect({ accent="#f2d78c", onDone }){
  useEffect(()=>{ const t=setTimeout(onDone, 1500); return ()=>clearTimeout(t); },[onDone]);
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      {/* 中心光爆 */}
      <div style={{position:"absolute",width:60,height:60,borderRadius:"50%",background:`radial-gradient(circle,#fff 0%,${accent} 32%,${accent}00 70%)`,animation:"unlockBloom 1.4s cubic-bezier(.2,.7,.2,1) forwards"}}/>
      {/* 擴散光環 */}
      <div style={{position:"absolute",width:120,height:120,borderRadius:"50%",border:`2px solid ${accent}`,animation:"unlockRing 1.3s ease-out forwards"}}/>
      <div style={{position:"absolute",width:120,height:120,borderRadius:"50%",border:`1px solid ${accent}`,animation:"unlockRing 1.3s ease-out .2s forwards"}}/>
      {/* 放射餘燼 */}
      <div style={{position:"absolute",width:0,height:0}}>
        {BURST.map((b,i)=>(<span key={i} style={{position:"absolute",left:0,top:0,width:b.s,height:b.s,marginLeft:-b.s/2,marginTop:-b.s/2,borderRadius:"50%",background:accent,boxShadow:`0 0 ${(b.s*2.5).toFixed(1)}px ${accent}`,"--a":b.a+"deg","--d":b.d+"px",animation:`radiate ${b.u}s ease-out ${b.de}s forwards`}}/>))}
      </div>
      {/* 文字 */}
      <div style={{position:"absolute",textAlign:"center",animation:"unlockLabel 1.5s ease forwards"}}>
        <div style={{fontSize:11,letterSpacing:"8px",color:accent,opacity:0.8,marginBottom:10,paddingLeft:8}}>✦ 封 印 解 除 ✦</div>
        <div style={{fontSize:"clamp(22px,5.5vw,34px)",color:accent,letterSpacing:"6px",fontWeight:700,textShadow:`0 0 30px ${accent}`}}>命運之門開啟</div>
      </div>
      {/* 金光淹沒（遮住章節切換的瞬間） */}
      <div style={{position:"absolute",inset:0,background:`radial-gradient(circle at 50% 50%,${accent} 0%,${accent} 40%,${accent}cc 100%)`,animation:"unlockFlash 1.5s ease forwards"}}/>
    </div>
  );
}

function Gate({ answer, theme, onSolved }){
  const a=theme.glow;
  return (
    <section style={{position:"relative",minHeight:"92vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"10vh 20px",background:`radial-gradient(120% 80% at 50% 40%, ${theme.bg} 0%, ${theme.bg2} 72%, #06080e 100%)`,overflow:"hidden"}}>
      <Stars op={0.5}/>
      <div style={{position:"relative",textAlign:"center",maxWidth:470,width:"100%"}}>
        <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:64,height:64,borderRadius:"50%",border:`2px solid ${a}`,marginBottom:22,color:a,animation:"pulse 3s ease-in-out infinite"}}>
          <Lock size={26}/>
        </div>
        <div style={{fontSize:13,letterSpacing:"7px",color:theme.soft,marginBottom:10,paddingLeft:7}}>命 運 之 門</div>
        <h3 style={{fontSize:"clamp(22px,5vw,30px)",color:theme.ink,letterSpacing:"3px",margin:"0 0 12px",fontWeight:700}}>輸入密碼，解開封印</h3>
        <p style={{fontSize:14,color:theme.soft,lineHeight:1.85,margin:"0 auto 28px",maxWidth:380}}>解開上一章的謎題，把求得的數字依序填入。門開之後，旅程才會繼續。</p>
        <CodeInput answer={answer} accent={a} onSolved={onSolved}/>
      </div>
    </section>
  );
}

function ChapterSection({ c, idx, next }){
  const bgGrad = `linear-gradient(180deg, ${c.t.bg2} 0%, ${c.t.bg} 22%, ${c.t.bg} 76%, ${next?next.t.bg2:c.t.bg2} 100%)`;
  return (
    <section id={"chap-"+idx} style={{position:"relative",padding:"14vh 20px 16vh",background:bgGrad,overflow:"hidden"}}>
      <Motif m={c.motif}/>
      <div style={{position:"relative",maxWidth:820,margin:"0 auto"}}>
        <Reveal>
          <div style={{textAlign:"center",marginBottom:"9vh"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:12,color:c.t.glow,marginBottom:14}}>
              <span style={{width:42,height:1,background:c.t.glow,opacity:0.5}}/>
              <span style={{fontSize:14,letterSpacing:"8px",paddingLeft:8}}>{c.num}</span>
              <span style={{width:42,height:1,background:c.t.glow,opacity:0.5}}/>
            </div>
            <h2 style={{fontSize:"clamp(30px,6.5vw,52px)",fontWeight:700,color:c.t.ink,letterSpacing:"4px",margin:0,textShadow:`0 0 30px ${c.t.glow}30`}}>{c.title}</h2>
          </div>
        </Reveal>
        <Scene paras={c.paras} t={c.t}/>
      </div>
    </section>
  );
}

export default function App(){
  const [prog,setProg]=useState(0);
  const [solved,setSolved]=useState(()=>new Set());
  const [top,setTop]=useState(false);
  const [unlock,setUnlock]=useState(null);
  const [walk,setWalk]=useState(()=> typeof window!=="undefined" && window.location.hash==="#forest3d");
  const wrap=useRef(null);

  /* 3D 森林：以 #forest3d 進出，不影響故事網頁 */
  useEffect(()=>{
    const on=()=>setWalk(window.location.hash==="#forest3d");
    window.addEventListener("hashchange",on); return ()=>window.removeEventListener("hashchange",on);
  },[]);

  /* 過關 → 開門特效 → 在金光最亮時切換並捲到下一章 */
  const startUnlock=(i)=>{
    const go=()=>{ setSolved(p=>new Set([...p,i])); requestAnimationFrame(()=>document.getElementById("chap-"+i)?.scrollIntoView({block:"start"})); };
    if(REDUCE){ go(); return; }
    setUnlock({accent:STORY[i].t.glow});
    setTimeout(go, 820);
  };
  useEffect(()=>{
    const el=wrap.current; if(!el) return;
    const on=()=>{ const h=el.scrollHeight-el.clientHeight; setProg(h>0?el.scrollTop/h:0); setTop(el.scrollTop>600); };
    el.addEventListener("scroll",on,{passive:true}); on(); return ()=>el.removeEventListener("scroll",on);
  },[walk]);

  /* 傾斜視差：陀螺儀(手機) + 指標(桌機) → 寫入 --tx/--ty 供各背景層平移 */
  useEffect(()=>{
    if(REDUCE) return;
    const el=wrap.current; if(!el) return;
    let raf=0; const cur={x:0,y:0}, tgt={x:0,y:0};
    const orient=(e)=>{ if(e.gamma==null||e.beta==null) return; tgt.x=Math.max(-1,Math.min(1,e.gamma/35)); tgt.y=Math.max(-1,Math.min(1,(e.beta-45)/35)); };
    const point=(e)=>{ tgt.x=(e.clientX/window.innerWidth)*2-1; tgt.y=(e.clientY/window.innerHeight)*2-1; };
    const loop=()=>{ cur.x+=(tgt.x-cur.x)*0.06; cur.y+=(tgt.y-cur.y)*0.06; el.style.setProperty("--tx",cur.x.toFixed(3)); el.style.setProperty("--ty",cur.y.toFixed(3)); raf=requestAnimationFrame(loop); };
    const DOE=window.DeviceOrientationEvent;
    if(DOE && typeof DOE.requestPermission==="function"){ const ask=()=>{ DOE.requestPermission().catch(()=>{}); }; window.addEventListener("touchend",ask,{once:true}); }
    window.addEventListener("deviceorientation",orient,true);
    window.addEventListener("pointermove",point,{passive:true});
    loop();
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener("deviceorientation",orient,true); window.removeEventListener("pointermove",point); };
  },[walk]);

  /* 所有 hooks 宣告完才條件渲染 3D 世界，避免 hooks 順序錯亂 */
  if(walk){
    return (
      <Suspense fallback={<div style={{position:"fixed",inset:0,background:"#040a08",display:"flex",alignItems:"center",justifyContent:"center",color:"#f2d78c",letterSpacing:"4px"}}>世界甦醒中…</div>}>
        <World3D onExit={()=>{ window.location.hash=""; }}/>
      </Suspense>
    );
  }

  return (
    <div ref={wrap} style={{height:"100vh",overflowY:"auto",background:"#06080e",color:"#cdd6e6",fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif',scrollBehavior:"smooth"}}>
      <style>{`
        *{box-sizing:border-box} ::selection{background:#f2d78c44}
        @keyframes tw{0%,100%{opacity:.15}50%{opacity:.9}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:.7}50%{opacity:1}}
        @keyframes rise{0%{transform:translateY(0);opacity:0}12%{opacity:.9}100%{transform:translateY(-78vh);opacity:0}}
        @keyframes streak{0%{transform:translateX(0)}100%{transform:translateX(125vw)}}
        @keyframes streakR{0%{transform:translateX(0)}100%{transform:translateX(-125vw)}}
        @keyframes drift{0%,100%{transform:translate(0,0);opacity:.2}50%{transform:translate(14px,-18px);opacity:.7}}
        @keyframes fly{0%,100%{transform:translate(0,0);opacity:.25}25%{transform:translate(13px,-17px);opacity:.9}50%{transform:translate(-9px,-24px);opacity:.55}75%{transform:translate(11px,-11px);opacity:.95}}
        @keyframes flicker{0%,100%{opacity:1}10%{opacity:.55}13%{opacity:.85}30%{opacity:.42}33%{opacity:.9}58%{opacity:.62}61%{opacity:.95}82%{opacity:.5}85%{opacity:.92}}
        @keyframes breathe{0%,100%{opacity:.55;transform:translate(-50%,-50%) scale(1)}50%{opacity:.95;transform:translate(-50%,-50%) scale(1.08)}}
        @keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
        @keyframes unlockBloom{0%{transform:scale(0);opacity:0}12%{opacity:1}60%{transform:scale(15);opacity:.9}100%{transform:scale(24);opacity:0}}
        @keyframes unlockRing{0%{transform:scale(.2);opacity:0}15%{opacity:1}100%{transform:scale(12);opacity:0}}
        @keyframes radiate{0%{transform:rotate(var(--a)) translateX(0) scale(1);opacity:0}12%{opacity:1}100%{transform:rotate(var(--a)) translateX(var(--d)) scale(.2);opacity:0}}
        @keyframes unlockLabel{0%{opacity:0;transform:translateY(16px) scale(.92)}26%{opacity:1;transform:none}68%{opacity:1}100%{opacity:0;transform:translateY(-10px)}}
        @keyframes unlockFlash{0%{opacity:0}40%{opacity:0}58%{opacity:.85}74%{opacity:.4}100%{opacity:0}}
        @media (prefers-reduced-motion:reduce){*{animation:none!important}}
      `}</style>

      {/* progress */}
      <div style={{position:"fixed",top:0,left:0,height:3,width:`${prog*100}%`,background:"linear-gradient(90deg,#c9a86a,#f2d78c)",zIndex:50,transition:"width .1s"}}/>

      {/* HERO */}
      <section style={{position:"relative",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"0 20px",background:`radial-gradient(120% 80% at 50% 30%, #122036 0%, #0a1322 45%, #060b16 100%)`,overflow:"hidden"}}>
        <Stars/>
        <svg width="100%" height="100%" viewBox="0 0 1200 300" preserveAspectRatio="none" style={{position:"absolute",bottom:0,left:0,height:120,opacity:0.9}}>
          <path d="M0 300 L0 200 L60 210 L120 170 L200 215 L280 175 L380 215 L470 180 L560 215 L650 180 L760 215 L850 185 L960 215 L1060 185 L1140 210 L1200 195 L1200 300 Z" fill="#08120c"/>
        </svg>
        <div style={{position:"relative",width:Math.min(380,window.innerWidth*0.86),height:Math.min(380,window.innerWidth*0.86),animation:"bob 6s ease-in-out infinite"}}>
          <Suspense fallback={<div style={{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%"}}><MoonGate size={Math.min(320,window.innerWidth*0.7)}/></div>}>
            <Portal3D glow="#f2d78c"/>
          </Suspense>
        </div>
        <div style={{position:"relative",marginTop:24}}>
          <div style={{fontSize:13,letterSpacing:"9px",color:"#c9b07a",marginBottom:14,paddingLeft:9}}>城市桌遊尋寶</div>
          <h1 style={{fontSize:"clamp(34px,8vw,62px)",fontWeight:700,color:"#f2e6c2",letterSpacing:"3px",lineHeight:1.25,margin:0,textShadow:"0 0 40px #c9a86a40"}}>第九公主與<br/>黑森林的月門</h1>
          <div style={{marginTop:18,fontSize:14,color:"#8a93a8",letterSpacing:"2px"}}>台北捷運 · 實境解謎 · 2–12 人</div>
          <button onClick={()=>{ window.location.hash="forest3d"; }} style={{marginTop:22,padding:"12px 26px",borderRadius:10,border:"1px solid #c9a86a88",background:"rgba(26,18,12,0.6)",color:"#f4e4c4",fontSize:14,letterSpacing:"3px",cursor:"pointer",backdropFilter:"blur(4px)"}}>進入 3D 黑森林（原型）</button>
        </div>
        <div style={{position:"absolute",bottom:30,display:"flex",flexDirection:"column",alignItems:"center",gap:6,color:"#c9b07a",animation:"bob 2.2s ease-in-out infinite"}}>
          <span style={{fontSize:12,letterSpacing:"3px"}}>向下展開旅程</span><ChevronDown size={20}/>
        </div>
      </section>

      {/* CHAPTERS + GATES (progressive) */}
      {(() => {
        const els=[]; let blocked=false;
        for(let i=0;i<STORY.length;i++){
          if(GATES[i] && !solved.has(i)){
            els.push(
              <Gate key={"gate"+i} answer={GATES[i]} theme={STORY[i].t}
                onSolved={()=>startUnlock(i)}/>
            );
            blocked=true; break;
          }
          els.push(<ChapterSection key={STORY[i].id} c={STORY[i]} idx={i} next={STORY[i+1]}/>);
        }
        if(!blocked){
          els.push(
            <section key="coda" style={{position:"relative",minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"10vh 20px",background:`linear-gradient(180deg, ${T.fin.bg2}, #06080e)`,overflow:"hidden"}}>
              <Stars op={0.5}/>
              <Reveal>
                <div style={{position:"relative"}}>
                  <div style={{fontSize:13,letterSpacing:"8px",color:"#a88c76",marginBottom:16,paddingLeft:8}}>◇ 命運之門 ◇</div>
                  <div style={{fontSize:"clamp(22px,5vw,34px)",color:"#f6c87e",letterSpacing:"3px",fontWeight:600,textShadow:"0 0 30px #f6c87e44"}}>旅程，在此交給你們</div>
                  <button onClick={()=>wrap.current.scrollTo({top:0,behavior:"smooth"})} style={{marginTop:30,padding:"12px 28px",borderRadius:10,border:"1px solid #b0824a",background:"#1a120c",color:"#f4e4c4",fontSize:14,letterSpacing:"3px",cursor:"pointer"}}>從序曲重新開始</button>
                </div>
              </Reveal>
            </section>
          );
        }
        return els;
      })()}

      {top && <button onClick={()=>wrap.current.scrollTo({top:0,behavior:"smooth"})} style={{position:"fixed",right:18,bottom:18,zIndex:50,width:42,height:42,borderRadius:"50%",border:"1px solid #c9a86a55",background:"#0d1422cc",color:"#f2d78c",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",backdropFilter:"blur(4px)"}}><ArrowUp size={18}/></button>}

      {unlock && <UnlockEffect accent={unlock.accent} onDone={()=>setUnlock(null)}/>}
    </div>
  );
}
