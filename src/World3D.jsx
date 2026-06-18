import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

/* =====================================================================
   3D 可行走世界（多場景原型）—— 手機優先、第三人稱
   - 虛擬搖桿（手機）/ WASD・方向鍵（桌機）
   - 第三人稱跟隨鏡頭、會擺手擺腳的走路動畫、樹/欄杆碰撞
   - 走近月門 → 跳出密碼鎖（沿用故事謎題）→ 解開 → 開門 → 切到下一場景
   - 場景以 SCENES 設定驅動，要加場景只要新增一筆
   - 想換成真模型：見檔尾 GLBCharacter 註解
   ===================================================================== */

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 場景設定 ---------- */
const SCENES = {
  pro: {
    name: "序曲 · 被決定的命運",
    bg: "#0a0a18",
    fog: [20, 72],
    ground: "#0d0e1e",
    decor: "hall",
    intro: true, // 進場時翻開書頁
    bounds: { type: "rect", xMin: -6.6, xMax: 6.6, zMin: -21.5, zMax: 12 },
    start: [0, 10],
    gate: { pos: [0, 0, -24], glow: "#f2d78c", kind: "book", label: "命運之書" },
    puzzle: null, // 失足墜入，無密碼
    enterLabel: "「動……木……萬……辛……麟……梨……」\n書頁翻動，月門在光中浮現……",
    enterButton: "踏入月門",
    next: "ch1",
    cards: [
      { pos: [-3.4, 1.7, 3], rot: 0.5, kicker: "序曲 · 被決定的命運", text: "新安國有九位公主，前八位為了父王與國家聯姻遠嫁，卻都未得真正的幸福。身為唯一還未出嫁的第九公主，妳把這一切看在眼裡。某日國王宣布：明日妳將代表新安國下嫁南方強國，以換取和平——可妳早已有心愛之人，鄰國基耳國的龍羽王子。" },
      { pos: [3.4, 1.7, -11], rot: -0.5, text: "妳決定違抗命運。深夜鐘樓敲響十二下，妳備妥馬匹偷偷離宮，為躲避追兵抄近路穿過傳說中的『黑森林』。昏暗夜色讓妳失足跌落，誤觸了那道古老的月門。恍惚中聽見低語：「動……木……萬……辛……麟……梨……」轟隆一聲，周遭彷彿停止了。" },
    ],
  },
  ch1: {
    name: "第一章 · 迷宮中的舞台",
    bg: "#0e1018",
    fog: [20, 62],
    ground: "#10131c",
    decor: "station",
    bounds: { type: "rect", xMin: -6, xMax: 5, zMin: -23.5, zMax: 11 },
    start: [3.5, 6],
    gate: { pos: [0, 0, -26], glow: "#f2d78c", label: "命運第一次交會的地方" },
    npc: { pos: [3, 0, -2], line: "「孩子，你不是這裡的人吧？帶著它，完成你的使命。」" },
    puzzle: { answer: "0725", hint: "先知曉自己身在何處，再知曉旅程付出的代價，兩者相連。" },
    next: "forest",
    cards: [
      { pos: [-3.2, 1.7, 2], rot: 0.5, kicker: "第一章 · 迷宮中的舞台", text: "「這裡是哪裡…？」九公主跟著人群走出諾大的鐵箱子，四周盡是從未見過的居民、服飾與街景，宛如一座迷宮的入口。一位和藹的婆婆走來，取出魔法棒念咒：「霹靂卡霹靂拉拉，波波莉娜貝貝魯多」，憑空變出一個小盒子遞給她。" },
      { pos: [-3, 1.7, -12], rot: 0.5, text: "「孩子，你不是這裡的人吧？帶著它完成你的使命。但在那之前，得先回到你與他命運第一次交會的地方——一間黑暗的屋子，光影在牆上流轉。找到答案，再到那座舞台來找我。」盒蓋上是一道密碼鎖，旁浮現字跡：先知曉自己身在何處，再知曉旅程付出的代價，兩者相連。" },
    ],
  },
  forest: {
    name: "第二章 · 拒絕入睡的森林",
    bg: "#02050a",
    fog: [9, 34],
    ground: "#060d09",
    decor: "forest",
    bounds: { type: "circle", r: 44 },
    start: [0, 16],
    clearing: { pos: [0, 0, -24], r: 11 },
    gate: { pos: [0, 0, -24], glow: "#f2d78c", label: "時空之門" },
    puzzle: { answer: "2466", hint: "其一：森林化作不眠舞台的那一夜，是這座城紀年裡的哪一年？其二：地底小廣場上有幾位最先睜眼的守望者？其三：能走出地底、見到星空的大門有幾道？" },
    next: "bridge",
    cards: [
      { pos: [-3.6, 1.7, 12], rot: 0.5, kicker: "第二章 · 拒絕入睡的森林", text: "第一道封印解開，盒蓋輕輕彈起。一個溫柔卻不屬於任何人的聲音在妳腦海響起：「若想躲避命運的追兵，妳必須前往一座會呼吸的森林。」" },
      { pos: [3.6, 1.7, 2], rot: -0.5, text: "「那座森林坐落在高塔的中央——四面被樓宇環抱，卻比任何地方都更接近自然。每年只有一夜，森林會拒絕入睡。」" },
      { pos: [-3.6, 1.7, -8], rot: 0.5, text: "「那一夜，燈火徹夜不滅，人們湧入林間起舞、歌唱、發著光，把整座森林點亮成一座不眠的舞台，直到黎明。妳會熟悉那樣的夜晚——在妳的世界，它叫『黑森林』。」" },
      { pos: [3.6, 1.7, -18], rot: -0.5, text: "黑森林——正是她墜入月門之處。原來它們像同一座森林的兩面：一面通往幽暗的命運，一面卻在某夜化作最明亮的舞台。" },
    ],
  },
  bridge: {
    name: "第三章 · 兩條命運的交會",
    bg: "#0c0608",
    fog: [18, 78],
    ground: "#140a0c",
    decor: "bridge",
    bounds: { type: "rect", xMin: -6, xMax: 6, zMin: -44, zMax: 18 },
    start: [0, 14],
    groundY: bridgeY, // 角色沿橋面上坡
    gate: { pos: [0, 7, -39], glow: "#f0b48a", label: "天臺盡頭・通往天空的門" },
    puzzle: { answer: "745", hint: "其一：登上最接近天空的那一層，得先穿過幾道並肩而立的守衛？其二：從地面數起，這座高塔共有幾層？其三：橋畔牆上那幅縱橫交錯的圖中，被紅色方框圈住的方形有幾個？" },
    next: "ch4",
    cards: [
      { pos: [-4.2, 2.05, 10], rot: 0.5, kicker: "第三章 · 兩條命運的交會", text: "公主循著盒子的指引來到一座大橋邊。人群中，一個熟悉的身影撞進她眼裡——「龍羽王子？！」她不敢置信地奔了過去。" },
      { pos: [4.2, 4.5, -4], rot: -0.5, text: "王子一把握住她的手：「我為了找妳追到黑森林，也在月門前失足跌了進來。婆婆對我說：『拿著這個完成使命，到那片天空找我吧。』」公主一愣：「她對我說的，卻是『到那座舞台找我』。」" },
      { pos: [-4.2, 6.6, -16], rot: 0.5, text: "同一位婆婆，兩句話：一個指向天空，一個指向舞台。兩人在橋邊住下等待婆婆，每到晨昏便看橋上奔流過一條千萬鋼鐵獸組成的河。原來只要兩個人在一起，連異鄉都能住成家。" },
      { pos: [4.2, 8.7, -28], rot: -0.5, text: "直到尋到婆婆的住所，才驚覺她竟是傳說中的神仙教母——只因動了惻隱之心、插手凡間感情，觸犯天規，被帶回古老學校受罰。「就換我們去，把她找回來。」" },
    ],
  },
  ch4: {
    name: "第四章 · 百年學堂的入口",
    bg: "#0b0805",
    fog: [16, 52],
    ground: "#100b06",
    decor: "temple",
    bounds: { type: "rect", xMin: -6.4, xMax: 6.4, zMin: -24, zMax: 13 },
    start: [0, 11],
    gate: { pos: [0, 0, -28], glow: "#ecd49a", label: "百年學堂的門" },
    puzzle: { answer: "227", hint: "其一：學堂從不對凡人敞開正門，這座地底車站中唯有一道出口通往它。其二：通往學堂的路上散落著許多被時間遺忘的咒文，沉睡在石牆中；唯有看見它們全部的人，才能找到真正的入口。" },
    next: "fin",
    cards: [
      { pos: [-3.2, 1.7, 9], rot: 0.5, kicker: "第四章 · 百年學堂的入口", text: "解開橋的封印後，盒子深處「喀」地彈出一格暗層，裡頭靜靜躺著一把生了鏽的小鑰匙。兩人趕回教母的住所翻箱倒櫃。" },
      { pos: [3.2, 1.7, 1], rot: -0.5, text: "直到公主在最深的櫃子裡，摸到一本蒙著厚厚灰塵的舊書——封面燙金字跡早已斑駁：《辛澤蘭莊園》。" },
      { pos: [-3.2, 1.7, -7], rot: 0.5, text: "書頁竟無風自動翻開：「此乃教母養成之地。一所比這座城市還古老的學堂，最初沒有校舍，孩子們在神殿裡念書，香火與書聲，一代一代從未斷絕。」" },
      { pos: [3.2, 1.7, -15], rot: -0.5, text: "「莊園之名，藏著它的所在。新生之地，方正之城——拆開它，你便知道該往何處去。想找到她，就到那座學堂的門前來。」" },
    ],
  },
  fin: {
    name: "終章 · 藏在二樓的祕密",
    bg: "#0a0605",
    fog: [14, 46],
    ground: "#0e0805",
    decor: "door",
    bounds: { type: "circle", r: 36 },
    start: [0, 14],
    gate: { pos: [0, 0, -26], glow: "#f6c87e", label: "藏在二樓的門" },
    puzzle: null, // 念出密語，推門而入
    enterLabel: "「唯有登上二樓，對著門前說出那句密語，門，才會為你們而開。」",
    enterButton: "念出密語，推開門",
    next: null,
    cards: [
      { pos: [-3.4, 1.7, 10], rot: 0.5, kicker: "終章 · 藏在二樓的祕密", text: "循著《辛澤蘭莊園》的指引，公主與王子來到城中一處不起眼的樓梯。" },
      { pos: [3.4, 1.7, 1], rot: -0.5, text: "書頁最後一行字緩緩亮起：「教母的學堂，從不對凡人開放。它的入口，總是藏在一個『祕密』之後。」" },
      { pos: [-3.4, 1.7, -8], rot: 0.5, text: "「唯有登上二樓，對著門前說出那句密語，門才會為你們而開。」一路走來的迷宮、森林、大橋與學堂，原來都是為了把他們引到這扇門前。" },
      { pos: [3.4, 1.7, -16], rot: -0.5, text: "他們深吸一口氣登上二樓，公主輕聲念出密語。門後透出溫暖的光，緩緩開啟——門內等著的不是陰森學堂，而是一桌燭光、熟悉的笑臉，與最後一道測試。" },
    ],
  },
};

/* ---------- 共用輸入：搖桿 / 鍵盤 ---------- */
function useMoveInput() {
  const input = useRef({ x: 0, z: 0 });
  useEffect(() => {
    const keys = {};
    const sync = () => {
      let x = 0, z = 0;
      if (keys["KeyW"] || keys["ArrowUp"]) z -= 1;
      if (keys["KeyS"] || keys["ArrowDown"]) z += 1;
      if (keys["KeyA"] || keys["ArrowLeft"]) x -= 1;
      if (keys["KeyD"] || keys["ArrowRight"]) x += 1;
      const len = Math.hypot(x, z) || 1;
      input.current.x = x / len; input.current.z = z / len;
    };
    const down = (e) => { if (/Key[WASD]|Arrow/.test(e.code)) e.preventDefault(); keys[e.code] = true; sync(); };
    const up = (e) => { keys[e.code] = false; sync(); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);
  return input;
}

/* ---------- 碰撞與邊界 ---------- */
const PLAYER_R = 0.45;
function resolveCollision(pos, obstacles) {
  for (const o of obstacles) {
    const dx = pos.x - o.x, dz = pos.z - o.z;
    const d = Math.hypot(dx, dz);
    const min = PLAYER_R + o.r;
    if (d < min && d > 1e-4) { const push = min - d; pos.x += (dx / d) * push; pos.z += (dz / d) * push; }
  }
}
function clampBounds(pos, b) {
  if (b.type === "circle") {
    const r = Math.hypot(pos.x, pos.z);
    if (r > b.r) { pos.x *= b.r / r; pos.z *= b.r / r; }
  } else {
    pos.x = Math.min(b.xMax, Math.max(b.xMin, pos.x));
    pos.z = Math.min(b.zMax, Math.max(b.zMin, pos.z));
  }
}

/* ---------- 公主角色（程序化走路動畫 + 碰撞） ---------- */
function Player({ input, scene, obstacles, paused, onNearGate, playerPos }) {
  const group = useRef();
  const armL = useRef(), armR = useRef(), skirt = useRef();
  const { camera } = useThree();
  const facing = useRef(0);
  const phase = useRef(0);
  const swing = useRef(0);
  const camTarget = useRef(new THREE.Vector3());
  const wasNear = useRef(false);
  const gatePos = useMemo(() => new THREE.Vector3(...scene.gate.pos), [scene]);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const g = group.current; if (!g) return;

    const ix = paused.current ? 0 : input.current.x;
    const iz = paused.current ? 0 : input.current.z;
    const moving = Math.hypot(ix, iz) > 0.05;

    if (moving) {
      const speed = 6.2;
      g.position.x += ix * speed * dt;
      g.position.z += iz * speed * dt;
      resolveCollision(g.position, obstacles);
      clampBounds(g.position, scene.bounds);
      const target = Math.atan2(ix, iz);
      let d = target - facing.current;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      facing.current += d * Math.min(1, dt * 12);
      g.rotation.y = facing.current;
    }

    // 地形高度（如大橋上坡）+ 走路擺動：手臂前後、裙襬輕搖、身體微晃
    const baseY = scene.groundY ? scene.groundY(g.position.z) : 0;
    if (!reduceMotion) {
      phase.current += (moving ? dt * 9 : 0);
      swing.current += ((moving ? 1 : 0) - swing.current) * Math.min(1, dt * 8);
      const s = Math.sin(phase.current);
      if (armL.current) armL.current.rotation.x = -s * 0.5 * swing.current;
      if (armR.current) armR.current.rotation.x = s * 0.5 * swing.current;
      if (skirt.current) skirt.current.rotation.z = Math.sin(phase.current * 0.5) * 0.05 * swing.current;
      g.position.y = baseY + Math.abs(s) * 0.05 * swing.current;
    } else {
      g.position.y = baseY;
    }

    // 第三人稱跟隨鏡頭（接近視線高度的過肩角度，較不俯視）
    camTarget.current.set(g.position.x, g.position.y + 2.7, g.position.z + 6.2);
    camera.position.lerp(camTarget.current, Math.min(1, dt * 4));
    camera.lookAt(g.position.x, g.position.y + 1.45, g.position.z);

    if (playerPos) playerPos.current.copy(g.position);

    const near = g.position.distanceTo(gatePos) < 5;
    if (near !== wasNear.current) { wasNear.current = near; onNearGate(near); }
  });

  const gown = "#2a3f70", gown2 = "#3a5aa0", bodice = "#22335c", trim = "#f2d78c", skin = "#ecd2b8", hair = "#2a1d36";
  return (
    <group ref={group} position={[scene.start[0], 0, scene.start[1]]}>
      {/* 蓬裙禮服 */}
      <group ref={skirt}>
        <mesh castShadow position={[0, 0.62, 0]}>
          <coneGeometry args={[0.62, 1.2, 22]} /><meshStandardMaterial color={gown} roughness={0.6} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0.66, 0]}>
          <coneGeometry args={[0.46, 0.92, 22]} /><meshStandardMaterial color={gown2} roughness={0.55} />
        </mesh>
        {/* 裙襬金邊 */}
        <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.63, 28]} /><meshStandardMaterial color={trim} emissive={trim} emissiveIntensity={0.4} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* 束腰 */}
      <mesh position={[0, 1.2, 0]}><torusGeometry args={[0.19, 0.035, 8, 24]} /><meshStandardMaterial color={trim} emissive={trim} emissiveIntensity={0.7} roughness={0.4} /></mesh>
      {/* 上身 */}
      <mesh position={[0, 1.43, 0]} castShadow><cylinderGeometry args={[0.21, 0.16, 0.5, 16]} /><meshStandardMaterial color={bodice} roughness={0.6} /></mesh>
      {/* 手臂 */}
      <group ref={armL} position={[-0.22, 1.6, 0]}>
        <mesh position={[0, -0.27, 0]}><capsuleGeometry args={[0.055, 0.42, 4, 8]} /><meshStandardMaterial color={gown} roughness={0.6} /></mesh>
      </group>
      <group ref={armR} position={[0.22, 1.6, 0]}>
        <mesh position={[0, -0.27, 0]}><capsuleGeometry args={[0.055, 0.42, 4, 8]} /><meshStandardMaterial color={gown} roughness={0.6} /></mesh>
      </group>
      {/* 頸 + 頭 */}
      <mesh position={[0, 1.69, 0]}><cylinderGeometry args={[0.06, 0.07, 0.12, 10]} /><meshStandardMaterial color={skin} roughness={0.85} /></mesh>
      <mesh position={[0, 1.83, 0]} castShadow><sphereGeometry args={[0.18, 24, 24]} /><meshStandardMaterial color={skin} roughness={0.85} /></mesh>
      {/* 頭髮：頂冠 + 背後長髮 */}
      <mesh position={[0, 1.87, -0.02]}><sphereGeometry args={[0.2, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.62]} /><meshStandardMaterial color={hair} roughness={0.95} /></mesh>
      <mesh position={[0, 1.5, -0.14]} rotation={[0.2, 0, 0]}><capsuleGeometry args={[0.13, 0.5, 4, 12]} /><meshStandardMaterial color={hair} roughness={0.95} /></mesh>
      {/* 皇冠 + 寶石 */}
      <mesh position={[0, 1.98, 0.02]} rotation={[0.2, 0, 0]}><torusGeometry args={[0.12, 0.018, 8, 22]} /><meshStandardMaterial color="#ffe6a0" emissive={trim} emissiveIntensity={0.9} metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[0, 2.02, 0.12]}><sphereGeometry args={[0.026, 12, 12]} /><meshStandardMaterial color="#7fd0ff" emissive="#7fd0ff" emissiveIntensity={1.3} /></mesh>
    </group>
  );
}

/* ---------- 樹林（InstancedMesh）+ 回傳碰撞點 ---------- */
function makeTrees(count, b, clear) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const rad = 5 + Math.random() * ((b.r || 44) + 6);
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    if (Math.abs(x) < 4 && z < 18 && z > -34) continue; // 留出走道
    if (clear && Math.hypot(x - clear.pos[0], z - clear.pos[2]) < clear.r) continue; // 留出中央空地
    const s = 0.7 + Math.random() * 1.0;
    arr.push({ x, z, s, rot: Math.random() * Math.PI, r: 0.55 * s });
  }
  return arr;
}
function Trees({ data }) {
  const trunk = useRef(), leaf = useRef();
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    data.forEach((d, i) => {
      o.position.set(d.x, 1.1 * d.s, d.z); o.rotation.set(0, d.rot, 0); o.scale.setScalar(d.s); o.updateMatrix();
      trunk.current.setMatrixAt(i, o.matrix);
      o.position.set(d.x, 3.0 * d.s, d.z); o.scale.set(d.s, d.s * 1.25, d.s); o.updateMatrix();
      leaf.current.setMatrixAt(i, o.matrix);
    });
    trunk.current.instanceMatrix.needsUpdate = true;
    leaf.current.instanceMatrix.needsUpdate = true;
  }, [data]);
  return (
    <>
      <instancedMesh ref={trunk} args={[null, null, data.length]} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 2.2, 6]} /><meshStandardMaterial color="#1d130f" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={leaf} args={[null, null, data.length]} castShadow>
        <coneGeometry args={[1.1, 3.2, 7]} /><meshStandardMaterial color="#0a2417" roughness={1} />
      </instancedMesh>
    </>
  );
}

/* ---------- 螢火蟲 ---------- */
function Fireflies({ count = 60, color = "#c6e892", r = 44 }) {
  const ref = useRef();
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, rad = Math.random() * r;
      pos[i * 3] = Math.cos(a) * rad; pos[i * 3 + 1] = 0.5 + Math.random() * 3.5; pos[i * 3 + 2] = Math.sin(a) * rad;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); return g;
  }, [count, r]);
  useFrame((s) => { if (ref.current && !reduceMotion) { ref.current.rotation.y = s.clock.elapsedTime * 0.02; ref.current.material.opacity = 0.6 + Math.sin(s.clock.elapsedTime * 2) * 0.3; } });
  return <points ref={ref} geometry={geo}><pointsMaterial color={color} size={0.14} sizeAttenuation transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} /></points>;
}

/* ---------- 林間光亮空地（第二章）---------- */
function Clearing({ pos, r }) {
  const beam = useRef();
  useFrame((s) => { if (beam.current && !reduceMotion) beam.current.material.opacity = 0.08 + Math.sin(s.clock.elapsedTime * 1.2) * 0.03; });
  return (
    <group position={pos}>
      {/* 青苔亮地 + 邊緣柔光圈 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow><circleGeometry args={[r, 48]} /><meshStandardMaterial color="#2e5a36" emissive="#3a6a40" emissiveIntensity={0.35} roughness={0.9} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}><ringGeometry args={[r * 0.66, r, 48]} /><meshStandardMaterial color="#9ed06a" emissive="#9ed06a" emissiveIntensity={0.25} transparent opacity={0.3} side={THREE.DoubleSide} /></mesh>
      {/* 自天而降的光束 */}
      <mesh ref={beam} position={[0, 8, 0]}><cylinderGeometry args={[r * 0.85, 1.2, 16, 28, 1, true]} /><meshBasicMaterial color="#d4f0b0" transparent opacity={0.09} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
      {/* 林間灑落的柔光 */}
      <pointLight position={[0, 13, 0]} intensity={5} distance={34} color="#e6ffc8" />
      <pointLight position={[0, 3, 2]} intensity={2.2} distance={18} color="#bfe89a" />
    </group>
  );
}

/* ---------- 空地裡的小動物 ---------- */
function Critter({ x, z, rot, c, sc, seed, hop }) {
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current || reduceMotion) return;
    const t = s.clock.elapsedTime;
    ref.current.position.y = hop ? Math.abs(Math.sin(t * 2 + seed)) * 0.2 * sc : Math.sin(t * 1.5 + seed) * 0.04;
  });
  return (
    <group ref={ref} position={[x, 0, z]} rotation={[0, rot, 0]} scale={sc}>
      <mesh position={[0, 0.18, 0]} castShadow><sphereGeometry args={[0.18, 12, 12]} /><meshStandardMaterial color={c} roughness={0.95} /></mesh>
      <mesh position={[0, 0.33, 0.16]} castShadow><sphereGeometry args={[0.12, 12, 12]} /><meshStandardMaterial color={c} roughness={0.95} /></mesh>
      <mesh position={[-0.05, 0.47, 0.15]}><coneGeometry args={[0.03, 0.16, 6]} /><meshStandardMaterial color={c} /></mesh>
      <mesh position={[0.05, 0.47, 0.15]}><coneGeometry args={[0.03, 0.16, 6]} /><meshStandardMaterial color={c} /></mesh>
      <mesh position={[0, 0.16, -0.18]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color="#f0ece0" /></mesh>
      <mesh position={[-0.04, 0.35, 0.27]}><sphereGeometry args={[0.02, 6, 6]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[0.04, 0.35, 0.27]}><sphereGeometry args={[0.02, 6, 6]} /><meshStandardMaterial color="#111" /></mesh>
    </group>
  );
}
function Animals({ pos, r, count = 9 }) {
  const palette = ["#cfc3a8", "#a88c6a", "#7a6a52", "#d8d0c4", "#5a5048", "#c89a72"];
  const data = useMemo(() => Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2, rad = Math.random() * r * 0.78;
    return { x: Math.cos(a) * rad, z: Math.sin(a) * rad, rot: Math.random() * Math.PI * 2, c: palette[Math.floor(Math.random() * palette.length)], sc: 0.7 + Math.random() * 0.7, seed: Math.random() * 10, hop: Math.random() < 0.5 };
  }), [count, r]);
  return <group position={pos}>{data.map((d, i) => <Critter key={i} {...d} />)}</group>;
}

/* ---------- 大橋：上坡 → 天臺（第三章）---------- */
const BR_TOP = 7, BR_A = 12, BR_B = -28; // 坡頂高度、坡起點 z、坡終點 z
function bridgeY(z) {
  if (z >= BR_A) return 0;
  if (z <= BR_B) return BR_TOP;
  return BR_TOP * (BR_A - z) / (BR_A - BR_B); // 線性上升
}
function makeRailings() {
  const arr = [];
  for (let z = 16; z >= -44; z -= 3) { arr.push({ x: -6, z, r: 0.4 }); arr.push({ x: 6, z, r: 0.4 }); }
  return arr;
}
function Bridge({ rails }) {
  const ref = useRef();
  useFrame((s) => { if (ref.current && !reduceMotion) ref.current.material.opacity = 0.4 + Math.sin(s.clock.elapsedTime * 1.5) * 0.15; });
  const ang = Math.atan2(BR_TOP, BR_A - BR_B);
  const deck = "#2a1a18", rail = "#3a201c", lamp = "#ffd9a0";
  return (
    <group>
      {/* 入口平段 */}
      <mesh position={[0, -0.05, 15]} receiveShadow><boxGeometry args={[12.4, 0.4, 8]} /><meshStandardMaterial color={deck} roughness={0.9} /></mesh>
      {/* 上升的長橋 */}
      <mesh position={[0, BR_TOP / 2 - 0.05, (BR_A + BR_B) / 2]} rotation={[ang, 0, 0]} receiveShadow>
        <boxGeometry args={[12.4, 0.4, Math.hypot(BR_A - BR_B, BR_TOP)]} /><meshStandardMaterial color={deck} roughness={0.9} />
      </mesh>
      {/* 頂端天臺 */}
      <mesh position={[0, BR_TOP - 0.05, -37]} receiveShadow><boxGeometry args={[15, 0.5, 20]} /><meshStandardMaterial color="#241a18" roughness={0.9} /></mesh>
      {/* 天臺女兒牆 */}
      {[[-7.3, -37, 0.4, 20], [7.3, -37, 0.4, 20], [0, -46.7, 15, 0.4]].map(([x, z, w, d], i) => (
        <mesh key={"w" + i} position={[x, BR_TOP + 0.5, z]} castShadow><boxGeometry args={[w, 1.1, d]} /><meshStandardMaterial color={rail} roughness={0.9} /></mesh>
      ))}
      {/* 兩側欄杆（貼著坡度） */}
      {rails.map((p, i) => (
        <mesh key={i} position={[p.x, bridgeY(p.z) + 0.6, p.z]} castShadow><boxGeometry args={[0.3, 1.2, 0.3]} /><meshStandardMaterial color={rail} roughness={0.9} /></mesh>
      ))}
      {/* 橋下高聳支柱 */}
      {[-37, -20, -4, 12].map((z, i) => { const top = bridgeY(z); return (
        <mesh key={"p" + i} position={[0, (top - 16) / 2, z]} castShadow><boxGeometry args={[2.6, top + 16, 2.6]} /><meshStandardMaterial color="#1c1412" roughness={1} /></mesh>
      ); })}
      {/* 遠遠下方的「鋼鐵獸之河」流光 */}
      <mesh ref={ref} position={[0, -15, -14]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[70, 90]} /><meshStandardMaterial color="#f0b48a" emissive="#f0b48a" emissiveIntensity={0.6} transparent opacity={0.5} />
      </mesh>
      {/* 天臺暖燈 */}
      {[[-6, -31], [6, -31], [-6, -43], [6, -43]].map(([x, z], i) => (
        <group key={"l" + i} position={[x, BR_TOP + 1.2, z]}>
          <mesh><sphereGeometry args={[0.16, 10, 10]} /><meshStandardMaterial color={lamp} emissive={lamp} emissiveIntensity={1.3} /></mesh>
          <pointLight intensity={1.4} distance={12} color={lamp} />
        </group>
      ))}
    </group>
  );
}

/* ---------- 橋上往下流動的機車（機車瀑布） ---------- */
function Scooter({ lane, offset, speed, color }) {
  const ref = useRef();
  const ang = Math.atan2(BR_TOP, BR_A - BR_B);
  useFrame((s) => {
    if (!ref.current) return;
    const range = 18 - BR_B; // 由坡頂 -28 往下流到橋頭 18，循環
    const z = BR_B + ((s.clock.elapsedTime * speed + offset) % range);
    ref.current.position.set(lane, bridgeY(z) + 0.02, z);
    ref.current.rotation.x = (z < BR_A && z > BR_B) ? ang : 0;
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.2, 0]} castShadow><boxGeometry args={[0.34, 0.22, 0.9]} /><meshStandardMaterial color={color} roughness={0.5} metalness={0.45} /></mesh>
      <mesh position={[0, 0.36, -0.14]}><boxGeometry args={[0.3, 0.12, 0.42]} /><meshStandardMaterial color="#16161c" roughness={0.8} /></mesh>
      {/* 騎士 + 安全帽 */}
      <mesh position={[0, 0.62, -0.12]}><capsuleGeometry args={[0.12, 0.38, 4, 8]} /><meshStandardMaterial color="#33384a" roughness={0.8} /></mesh>
      <mesh position={[0, 0.93, -0.08]}><sphereGeometry args={[0.12, 12, 12]} /><meshStandardMaterial color="#23242c" roughness={0.5} /></mesh>
      {/* 輪 */}
      <mesh position={[0, 0.12, 0.33]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.13, 0.13, 0.08, 12]} /><meshStandardMaterial color="#0a0a0a" roughness={0.9} /></mesh>
      <mesh position={[0, 0.12, -0.35]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.13, 0.13, 0.08, 12]} /><meshStandardMaterial color="#0a0a0a" roughness={0.9} /></mesh>
      {/* 頭燈 / 尾燈 */}
      <mesh position={[0, 0.32, 0.47]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#fff6d8" emissive="#fff2c4" emissiveIntensity={1.5} /></mesh>
      <mesh position={[0, 0.3, -0.47]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color="#ff5a4a" emissive="#ff3a2a" emissiveIntensity={1.2} /></mesh>
    </group>
  );
}
function Motorcycles({ count = 11 }) {
  const lanes = [-4.4, -2.7, 2.7, 4.4];
  const colors = ["#c0392b", "#2e86c1", "#27ae60", "#d4ac0d", "#e67e22", "#ecf0f1", "#7d3c98"];
  const data = useMemo(() => Array.from({ length: count }, (_, i) => ({
    lane: lanes[i % lanes.length] + (Math.random() * 0.5 - 0.25),
    offset: Math.random() * (18 - BR_B),
    speed: 6 + Math.random() * 3.5,
    color: colors[Math.floor(Math.random() * colors.length)],
  })), [count]);
  return <>{data.map((d, i) => <Scooter key={i} {...d} />)}</>;
}

/* ---------- 天臺：雲海聖光的天堂 ---------- */
function HeavenTerrace({ pos }) {
  const clouds = useMemo(() => Array.from({ length: 16 }, () => {
    const a = Math.random() * Math.PI * 2, rad = 8 + Math.random() * 9;
    return { x: Math.cos(a) * rad, y: -1.2 + Math.random() * 3, z: Math.sin(a) * rad, s: 1.2 + Math.random() * 1.8 };
  }), []);
  const puffs = [[0, 0, 0], [0.7, 0.1, 0.2], [-0.7, 0.05, -0.2], [0.3, 0.25, -0.4], [-0.3, 0.2, 0.4]];
  const beam = useRef();
  useFrame((s) => { if (beam.current && !reduceMotion) beam.current.material.opacity = 0.1 + Math.sin(s.clock.elapsedTime * 1.1) * 0.04; });
  return (
    <group position={pos}>
      {/* 蒼白聖潔地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow><circleGeometry args={[8.5, 48]} /><meshStandardMaterial color="#e2e8f5" emissive="#cdd8f0" emissiveIntensity={0.22} roughness={0.8} /></mesh>
      {/* 雲海 */}
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          {puffs.map((p, j) => (<mesh key={j} position={p}><sphereGeometry args={[0.7, 12, 12]} /><meshStandardMaterial color="#f4f7ff" emissive="#cdd8f0" emissiveIntensity={0.28} roughness={1} /></mesh>))}
        </group>
      ))}
      {/* 門後聖光柱 */}
      <mesh ref={beam} position={[0, 8, -2]}><cylinderGeometry args={[4, 1.6, 16, 24, 1, true]} /><meshBasicMaterial color="#fff2d0" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
      {/* 升起的金白光點 */}
      <Motes color="#fff0c8" r={7} rise count={30} size={0.13} />
      {/* 天堂柔光 */}
      <pointLight position={[0, 6, 0]} intensity={5} distance={30} color="#fff4e0" />
      <pointLight position={[0, 2, -4]} intensity={3} distance={20} color="#ffe8c0" />
    </group>
  );
}

/* ---------- 城市迷宮（InstancedMesh 樓宇）+ 碰撞 ---------- */
function makeCity(count, b) {
  const arr = [];
  const R = b.r || 40;
  for (let i = 0; i < count; i++) {
    const x = (Math.random() * 2 - 1) * R;
    const z = (Math.random() * 2 - 1) * R;
    if (Math.hypot(x, z) > R) continue;
    if (Math.abs(x) < 6 && z < 18 && z > -34) continue; // 留出中央通道（也避免擋住鏡頭）
    const w = 2.4 + Math.random() * 3.4;
    const h = 4 + Math.random() * 13;
    arr.push({ x, z, w, h, r: w * 0.62, lit: Math.random() < 0.5 });
  }
  return arr;
}
function City({ data }) {
  const dark = useRef(), lit = useRef();
  const darkData = useMemo(() => data.filter(d => !d.lit), [data]);
  const litData = useMemo(() => data.filter(d => d.lit), [data]);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const fill = (ref, list) => {
      list.forEach((d, i) => { o.position.set(d.x, d.h / 2, d.z); o.scale.set(d.w, d.h, d.w); o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix); });
      ref.current.instanceMatrix.needsUpdate = true;
    };
    fill(dark, darkData); fill(lit, litData);
  }, [darkData, litData]);
  return (
    <>
      <instancedMesh ref={dark} args={[null, null, darkData.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#0b1322" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={lit} args={[null, null, litData.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#12203a" emissive="#caa86a" emissiveIntensity={0.18} roughness={0.8} />
      </instancedMesh>
      {/* 電影院銀幕微光（呼應第一章暗示） */}
      <mesh position={[7, 3, -6]} rotation={[0, -0.6, 0]}>
        <planeGeometry args={[5, 3]} /><meshStandardMaterial color="#acc4e6" emissive="#acc4e6" emissiveIntensity={0.5} transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

/* ---------- 捷運站月台 + 車廂（第一章）+ 碰撞 ---------- */
function makeStationCols() {
  const arr = [];
  for (let z = 8; z >= -22; z -= 6) { arr.push({ x: -3.6, z, r: 0.55 }); arr.push({ x: 2.4, z, r: 0.55 }); }
  return arr;
}
function Station({ cols }) {
  const tile = "#39414f", floor = "#4c5466", wallc = "#5b6476", ceil = "#2b313f", panel = "#eef4ff", body = "#d9dee7", stripe = "#1f72b8", glass = "#bfe2ff";
  const winZ = Array.from({ length: 9 }, (_, i) => 17 - i * 4.25);
  const panels = Array.from({ length: 6 }, (_, i) => 8 - i * 5.6);
  return (
    <group>
      {/* 月台地板 + 黃色邊緣線 + 軌道凹槽 */}
      <mesh position={[-0.5, 0.02, -8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[12, 48]} /><meshStandardMaterial color={floor} roughness={0.9} /></mesh>
      <mesh position={[4.55, 0.05, -8]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.3, 48]} /><meshStandardMaterial color="#f2c84a" emissive="#f2c84a" emissiveIntensity={0.4} /></mesh>
      <mesh position={[5.6, -0.45, -8]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.6, 48]} /><meshStandardMaterial color="#0b0d13" roughness={1} /></mesh>
      {/* 左側磁磚牆 + 色帶 */}
      <mesh position={[-6.7, 4, -8]} receiveShadow><boxGeometry args={[0.5, 8, 48]} /><meshStandardMaterial color={wallc} roughness={0.8} /></mesh>
      <mesh position={[-6.43, 3, -8]}><boxGeometry args={[0.1, 0.7, 46]} /><meshStandardMaterial color={stripe} emissive={stripe} emissiveIntensity={0.35} /></mesh>
      {/* 天花 + 發光燈帶 */}
      <mesh position={[0, 8, -8]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[16, 48]} /><meshStandardMaterial color={ceil} roughness={1} side={THREE.DoubleSide} /></mesh>
      {panels.map((z, i) => (
        <group key={i}>
          <mesh position={[-1, 7.88, z]}><boxGeometry args={[6.5, 0.12, 1.6]} /><meshStandardMaterial color={panel} emissive={panel} emissiveIntensity={1} /></mesh>
          <pointLight position={[-1, 7.3, z]} intensity={1.3} distance={15} color="#eaf2ff" />
        </group>
      ))}
      {/* 月台立柱 */}
      {cols.map((c, i) => (
        <mesh key={i} position={[c.x, 4, c.z]} castShadow><boxGeometry args={[0.7, 8, 0.7]} /><meshStandardMaterial color={tile} roughness={0.6} metalness={0.25} /></mesh>
      ))}
      {/* 捷運車廂（停靠月台右側） */}
      <group position={[7.3, 0, -6]}>
        <mesh position={[0, 1.7, 0]} castShadow><boxGeometry args={[3.4, 3, 40]} /><meshStandardMaterial color={body} roughness={0.4} metalness={0.5} /></mesh>
        <mesh position={[0, 0.45, 0]}><boxGeometry args={[3.2, 0.7, 40]} /><meshStandardMaterial color="#8c95a4" roughness={0.6} metalness={0.4} /></mesh>
        <mesh position={[0, 3.35, 0]}><boxGeometry args={[3, 0.45, 40]} /><meshStandardMaterial color="#aeb6c2" metalness={0.6} roughness={0.4} /></mesh>
        {/* 月台側色帶 */}
        <mesh position={[-1.72, 2.55, 0]}><boxGeometry args={[0.04, 0.35, 40]} /><meshStandardMaterial color={stripe} emissive={stripe} emissiveIntensity={0.5} /></mesh>
        {/* 發光車窗（朝月台側） */}
        {winZ.map((z, i) => (
          <mesh key={i} position={[-1.73, 2.05, z]}><boxGeometry args={[0.04, 0.85, 2.2]} /><meshStandardMaterial color={glass} emissive={glass} emissiveIntensity={0.55} transparent opacity={0.92} /></mesh>
        ))}
        {/* 開啟的車門（內部透光） */}
        {[8, -2, -12].map((z, i) => (
          <mesh key={"d" + i} position={[-1.71, 1.35, z]}><boxGeometry args={[0.05, 2, 1.5]} /><meshStandardMaterial color="#fff4d8" emissive="#ffe6a0" emissiveIntensity={0.8} /></mesh>
        ))}
      </group>
    </group>
  );
}

/* ---------- 神祕的婆婆 + 她遞出的盒子（第一章 NPC） ---------- */
function OldWoman({ pos, line, playerPos }) {
  const box = useRef(), bubble = useRef(), tip = useRef();
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (!reduceMotion) {
      if (box.current) { box.current.position.y = 1.05 + Math.sin(t * 1.6) * 0.05; box.current.rotation.y = t * 0.6; }
      if (tip.current) tip.current.material.emissiveIntensity = 1.2 + Math.sin(t * 3) * 0.5;
    }
    if (bubble.current && playerPos) {
      const d = Math.hypot(pos[0] - playerPos.current.x, pos[2] - playerPos.current.z);
      const op = Math.max(0, Math.min(1, (7.5 - d) / 3));
      bubble.current.style.opacity = op.toFixed(2);
      bubble.current.style.transform = `translateY(${((1 - op) * 12).toFixed(1)}px)`;
    }
  });
  const cloak = "#3a3550", hood = "#2e2a40", skin = "#d8c0a8", staff = "#5a4a3a", glow = "#bfe0ff";
  return (
    <group position={pos}>
      {/* 斗篷（前傾駝背）+ 兜帽 + 臉 */}
      <group rotation={[0.12, 0, 0]}>
        <mesh castShadow position={[0, 0.6, 0]}><coneGeometry args={[0.46, 1.25, 16]} /><meshStandardMaterial color={cloak} roughness={0.9} /></mesh>
        <mesh position={[0, 1.2, 0.02]}><sphereGeometry args={[0.26, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.7]} /><meshStandardMaterial color={hood} roughness={0.95} /></mesh>
        <mesh position={[0, 1.12, 0.12]}><sphereGeometry args={[0.13, 16, 16]} /><meshStandardMaterial color={skin} roughness={0.85} /></mesh>
      </group>
      {/* 魔法杖 + 發光杖頭 */}
      <mesh position={[0.34, 0.9, 0.18]} rotation={[0.2, 0, -0.25]}><cylinderGeometry args={[0.02, 0.025, 1.2, 6]} /><meshStandardMaterial color={staff} roughness={0.8} /></mesh>
      <mesh ref={tip} position={[0.5, 1.46, 0.3]}><sphereGeometry args={[0.06, 12, 12]} /><meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.3} /></mesh>
      {/* 她遞出的盒子（蓋上有密碼鎖） */}
      <group ref={box} position={[0, 1.05, 0.5]}>
        <mesh castShadow><boxGeometry args={[0.32, 0.26, 0.32]} /><meshStandardMaterial color="#3a2a18" roughness={0.6} metalness={0.2} /></mesh>
        <mesh position={[0, 0, 0.162]}><planeGeometry args={[0.26, 0.16]} /><meshStandardMaterial color="#f2d78c" emissive="#f2d78c" emissiveIntensity={0.6} /></mesh>
        {[-0.07, 0, 0.07].map((x, i) => (<mesh key={i} position={[x, 0, 0.18]}><circleGeometry args={[0.02, 12]} /><meshStandardMaterial color="#2a2014" /></mesh>))}
      </group>
      <pointLight position={[0, 1.2, 0.5]} intensity={1.4} distance={4.5} color="#f2d78c" />
      {/* 走近浮現的對話泡泡 */}
      <Html position={[0, 1.95, 0]} transform distanceFactor={7} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div ref={bubble} style={{ opacity: 0, transition: "opacity .25s, transform .25s", width: 220, padding: "12px 14px", borderRadius: 12, border: "1px solid #f2d78c66", background: "rgba(10,14,22,0.86)", textAlign: "center", fontFamily: '-apple-system,"Noto Sans TC","Microsoft JhengHei",sans-serif' }}>
          <div style={{ fontSize: 11, letterSpacing: "4px", color: "#f2d78c", opacity: 0.85, marginBottom: 8 }}>神祕的婆婆</div>
          <div style={{ fontSize: 14, lineHeight: 1.9, color: "#dde5f2" }}>{line}</div>
        </div>
      </Html>
    </group>
  );
}

/* ---------- 神殿建築內部（第四章）+ 碰撞 ---------- */
function makeColumns() {
  const arr = [];
  for (let z = 12; z >= -30; z -= 6) { arr.push({ x: -5, z, r: 0.7 }); arr.push({ x: 5, z, r: 0.7 }); }
  return arr;
}
function Temple({ cols }) {
  const shaft = useRef(), cap = useRef();
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    cols.forEach((c, i) => { o.position.set(c.x, 3.9, c.z); o.updateMatrix(); shaft.current.setMatrixAt(i, o.matrix); });
    cols.forEach((c, i) => { o.position.set(c.x, 7.95, c.z); o.updateMatrix(); cap.current.setMatrixAt(i, o.matrix); });
    shaft.current.instanceMatrix.needsUpdate = true; cap.current.instanceMatrix.needsUpdate = true;
  }, [cols]);
  const beams = Array.from({ length: 9 }, (_, i) => 12 - i * 6);
  const wall = "#322a1c", stone = "#3a3326", carpet = "#5a2418", gold = "#caa86a", beam = "#241d11";
  return (
    <group>
      {/* 石地板 + 中央地毯 */}
      <mesh position={[0, 0.02, -9]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[15, 52]} /><meshStandardMaterial color={stone} roughness={0.95} /></mesh>
      <mesh position={[0, 0.04, -9]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[2.6, 50]} /><meshStandardMaterial color={carpet} emissive="#3a0f08" emissiveIntensity={0.15} roughness={0.9} /></mesh>
      {/* 側牆 + 後牆 */}
      <mesh position={[-7.3, 4.5, -9]} castShadow receiveShadow><boxGeometry args={[0.6, 9, 52]} /><meshStandardMaterial color={wall} roughness={0.95} /></mesh>
      <mesh position={[7.3, 4.5, -9]} castShadow receiveShadow><boxGeometry args={[0.6, 9, 52]} /><meshStandardMaterial color={wall} roughness={0.95} /></mesh>
      <mesh position={[0, 4.5, -34.6]} castShadow receiveShadow><boxGeometry args={[15.2, 9, 0.6]} /><meshStandardMaterial color={wall} roughness={0.95} /></mesh>
      {/* 開放式樑架屋頂（光從樑縫灑入） */}
      {beams.map((z, i) => (<mesh key={i} position={[0, 8.4, z]} castShadow><boxGeometry args={[15, 0.5, 0.5]} /><meshStandardMaterial color={beam} roughness={0.9} /></mesh>))}
      <mesh position={[-5, 8.75, -9]}><boxGeometry args={[0.5, 0.5, 52]} /><meshStandardMaterial color={beam} roughness={0.9} /></mesh>
      <mesh position={[5, 8.75, -9]}><boxGeometry args={[0.5, 0.5, 52]} /><meshStandardMaterial color={beam} roughness={0.9} /></mesh>
      {/* 列柱（柱身 + 金色柱頭） */}
      <instancedMesh ref={shaft} args={[null, null, cols.length]} castShadow><cylinderGeometry args={[0.55, 0.65, 7.8, 12]} /><meshStandardMaterial color="#4a4332" roughness={0.9} /></instancedMesh>
      <instancedMesh ref={cap} args={[null, null, cols.length]} castShadow><boxGeometry args={[1.4, 0.5, 1.4]} /><meshStandardMaterial color={gold} emissive={gold} emissiveIntensity={0.2} roughness={0.5} metalness={0.3} /></instancedMesh>
      {/* 盡頭祭壇台階 */}
      <mesh position={[0, 0.25, -26.5]} receiveShadow><boxGeometry args={[8, 0.5, 3]} /><meshStandardMaterial color={stone} roughness={0.9} /></mesh>
      <mesh position={[0, 0.7, -27.6]} receiveShadow><boxGeometry args={[6, 0.5, 2]} /><meshStandardMaterial color={stone} roughness={0.9} /></mesh>
      {/* 火盆暖光 x4 */}
      {[[-5.5, 6], [5.5, 6], [-5.5, -12], [5.5, -12]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.6, 0]} castShadow><cylinderGeometry args={[0.18, 0.26, 1.2, 8]} /><meshStandardMaterial color="#2a2014" roughness={0.9} /></mesh>
          <mesh position={[0, 1.32, 0]}><sphereGeometry args={[0.22, 12, 12]} /><meshStandardMaterial color="#ffb24a" emissive="#ff8a2a" emissiveIntensity={1.5} /></mesh>
          <pointLight position={[0, 1.5, 0]} intensity={3} distance={12} color="#ffb060" />
        </group>
      ))}
    </group>
  );
}

/* ---------- 漂浮塵埃 / 上升餘燼（第四章・終章） ---------- */
function Motes({ count = 50, color = "#ecd49a", r = 40, rise = false, size = 0.12 }) {
  const ref = useRef();
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, rad = Math.random() * r;
      pos[i * 3] = Math.cos(a) * rad; pos[i * 3 + 1] = 0.3 + Math.random() * 5; pos[i * 3 + 2] = Math.sin(a) * rad;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); return g;
  }, [count, r]);
  useFrame((s, dt) => {
    if (!ref.current || reduceMotion) return;
    if (rise) {
      const p = ref.current.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) { let y = p.getY(i) + dt * (0.5 + (i % 5) * 0.12); if (y > 6) y = 0; p.setY(i, y); }
      p.needsUpdate = true;
    } else {
      ref.current.rotation.y = s.clock.elapsedTime * 0.015;
      ref.current.material.opacity = 0.4 + Math.sin(s.clock.elapsedTime * 1.5) * 0.2;
    }
  });
  return <points ref={ref} geometry={geo}><pointsMaterial color={color} size={size} sizeAttenuation transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} /></points>;
}

/* ---------- 奇幻殿堂內部（序曲：封閉神殿 + 星空藻井）+ 碰撞 ---------- */
function makeHall() {
  const arr = [];
  for (let z = 10; z >= -22; z -= 5.5) { arr.push({ x: -5.2, z, r: 0.85 }); arr.push({ x: 5.2, z, r: 0.85 }); }
  return arr;
}
function Hall({ cols }) {
  const shaft = useRef(), cap = useRef(), base = useRef(), stars = useRef();
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const fill = (ref, y) => { cols.forEach((c, i) => { o.position.set(c.x, y, c.z); o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix); }); ref.current.instanceMatrix.needsUpdate = true; };
    fill(shaft, 4.5); fill(cap, 9.1); fill(base, 0.35);
  }, [cols]);
  const starGeo = useMemo(() => {
    const n = 180, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() * 2 - 1) * 6.5; pos[i * 3 + 1] = 10.3 + Math.random() * 0.5; pos[i * 3 + 2] = -27 + Math.random() * 39; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); return g;
  }, []);
  useFrame((s) => { if (stars.current && !reduceMotion) stars.current.material.opacity = 0.5 + Math.sin(s.clock.elapsedTime * 0.8) * 0.3; });
  const wall = "#1e2640", floor = "#141a30", runner = "#2a3a6a", gold = "#caa86a", ceil = "#090b1c";
  return (
    <group>
      {/* 地板 + 中央地毯 */}
      <mesh position={[0, 0.02, -8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[15, 46]} /><meshStandardMaterial color={floor} roughness={0.85} metalness={0.15} /></mesh>
      <mesh position={[0, 0.04, -8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[2.6, 44]} /><meshStandardMaterial color={runner} emissive={gold} emissiveIntensity={0.12} roughness={0.7} /></mesh>
      {/* 四面牆（封閉室內） */}
      <mesh position={[-7.4, 5.5, -8]} castShadow receiveShadow><boxGeometry args={[0.6, 11, 46]} /><meshStandardMaterial color={wall} roughness={0.9} /></mesh>
      <mesh position={[7.4, 5.5, -8]} castShadow receiveShadow><boxGeometry args={[0.6, 11, 46]} /><meshStandardMaterial color={wall} roughness={0.9} /></mesh>
      <mesh position={[0, 5.5, -28.8]} castShadow receiveShadow><boxGeometry args={[15.4, 11, 0.6]} /><meshStandardMaterial color={wall} roughness={0.9} /></mesh>
      {/* 牆面金色飾帶 */}
      <mesh position={[-7.05, 7.6, -8]}><boxGeometry args={[0.12, 0.14, 44]} /><meshStandardMaterial color={gold} emissive={gold} emissiveIntensity={0.5} /></mesh>
      <mesh position={[7.05, 7.6, -8]}><boxGeometry args={[0.12, 0.14, 44]} /><meshStandardMaterial color={gold} emissive={gold} emissiveIntensity={0.5} /></mesh>
      {/* 星空藻井天花 */}
      <mesh position={[0, 11, -8]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[15, 46]} /><meshStandardMaterial color={ceil} roughness={1} side={THREE.DoubleSide} /></mesh>
      <points ref={stars} geometry={starGeo}><pointsMaterial color="#f4e9c4" size={0.16} sizeAttenuation transparent opacity={0.7} depthWrite={false} /></points>
      {/* 列柱（柱身 + 金色柱頭 + 基座） */}
      <instancedMesh ref={shaft} args={[null, null, cols.length]} castShadow><cylinderGeometry args={[0.5, 0.62, 9, 14]} /><meshStandardMaterial color="#3b4258" roughness={0.8} metalness={0.15} /></instancedMesh>
      <instancedMesh ref={cap} args={[null, null, cols.length]} castShadow><boxGeometry args={[1.4, 0.6, 1.4]} /><meshStandardMaterial color={gold} emissive={gold} emissiveIntensity={0.25} roughness={0.5} metalness={0.4} /></instancedMesh>
      <instancedMesh ref={base} args={[null, null, cols.length]} receiveShadow><boxGeometry args={[1.4, 0.6, 1.4]} /><meshStandardMaterial color="#2a3150" roughness={0.9} /></instancedMesh>
      {/* 壁燈暖光 x4 */}
      {[[-7, 4], [7, 4], [-7, -12], [7, -12]].map(([x, z], i) => (
        <group key={i} position={[x, 4.6, z]}>
          <mesh><sphereGeometry args={[0.16, 12, 12]} /><meshStandardMaterial color="#ffe6a0" emissive="#f2d78c" emissiveIntensity={1.4} /></mesh>
          <pointLight intensity={1.9} distance={12} color="#f2d78c" />
        </group>
      ))}
    </group>
  );
}

/* ---------- 漂浮的發光巨書（序曲目標） ---------- */
function OpenBook({ pos, glow }) {
  const grp = useRef(), beam = useRef();
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (grp.current && !reduceMotion) grp.current.position.y = 2.1 + Math.sin(t * 0.8) * 0.07;
    if (beam.current && !reduceMotion) beam.current.material.opacity = 0.16 + Math.sin(t * 1.4) * 0.06;
  });
  return (
    <group position={pos}>
      {/* 地面光環 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.9, 3.4, 56]} /><meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={0.5} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* 基座 */}
      <mesh position={[0, 0.6, 0]} castShadow><cylinderGeometry args={[0.95, 1.2, 1.2, 8]} /><meshStandardMaterial color="#241a12" roughness={0.9} /></mesh>
      <mesh position={[0, 1.26, 0]}><cylinderGeometry args={[1.3, 1.3, 0.18, 8]} /><meshStandardMaterial color="#2e2118" roughness={0.85} /></mesh>
      {/* 漂浮的書 */}
      <group ref={grp} position={[0, 2.1, 0]} rotation={[-0.5, 0, 0]}>
        <mesh position={[0, -0.05, 0]}><boxGeometry args={[2.34, 0.06, 1.64]} /><meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={0.45} metalness={0.6} roughness={0.4} /></mesh>
        <mesh position={[0, -0.04, 0]}><boxGeometry args={[2.2, 0.12, 1.5]} /><meshStandardMaterial color="#3a2410" roughness={0.7} /></mesh>
        <mesh position={[-0.56, 0.04, 0]} rotation={[0, 0, 0.1]}><boxGeometry args={[1.04, 0.04, 1.42]} /><meshStandardMaterial color="#e8dcc0" emissive="#caa86a" emissiveIntensity={0.3} roughness={0.9} /></mesh>
        <mesh position={[0.56, 0.04, 0]} rotation={[0, 0, -0.1]}><boxGeometry args={[1.04, 0.04, 1.42]} /><meshStandardMaterial color="#e8dcc0" emissive="#caa86a" emissiveIntensity={0.3} roughness={0.9} /></mesh>
        <mesh position={[0, 0.06, 0]}><boxGeometry args={[0.07, 0.07, 1.44]} /><meshStandardMaterial color="#5a3a18" /></mesh>
      </group>
      {/* 光柱 */}
      <mesh ref={beam} position={[0, 5, 0]}><cylinderGeometry args={[1.5, 0.12, 6, 18, 1, true]} /><meshBasicMaterial color={glow} transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
      {/* 升起的符文塵 */}
      <Motes color={glow} r={2.2} rise count={26} size={0.1} />
      <pointLight position={[0, 3.2, 0.5]} intensity={5} distance={18} color={glow} />
    </group>
  );
}

/* ---------- 月門（目標點） ---------- */
function MoonGate({ pos, glow }) {
  const ring = useRef();
  useFrame((s) => { if (ring.current && !reduceMotion) ring.current.rotation.z = s.clock.elapsedTime * 0.15; });
  return (
    <group position={pos}>
      <mesh ref={ring} position={[0, 3, 0]}><torusGeometry args={[3, 0.18, 20, 80]} /><meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.3} metalness={0.8} roughness={0.3} /></mesh>
      <mesh position={[0, 3, -0.1]}><circleGeometry args={[2.85, 48]} /><meshStandardMaterial color="#0a1322" emissive="#1a2b48" emissiveIntensity={0.5} side={THREE.DoubleSide} /></mesh>
      <pointLight position={[0, 3, 1]} intensity={6} distance={24} color={glow} />
    </group>
  );
}

function Ground({ color, r }) {
  return <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[r, 64]} /><meshStandardMaterial color={color} roughness={1} /></mesh>;
}

/* ---------- 劇情卡片（3D 空間中的發光卡） ---------- */
function StoryCard({ pos, rot = 0, kicker, text, accent, playerPos, reveal }) {
  const ref = useRef();
  const card = useRef();
  const seed = useMemo(() => Math.random() * 10, []);
  useFrame((s) => {
    if (ref.current && !reduceMotion) ref.current.position.y = pos[1] + Math.sin(s.clock.elapsedTime * 1.1 + seed) * 0.12;
    if (card.current && playerPos) {
      let op = 0;
      if (reveal) { // 進到場景後，走近才浮現
        const dx = pos[0] - playerPos.current.x, dz = pos[2] - playerPos.current.z;
        op = Math.max(0, Math.min(1, (20 - Math.hypot(dx, dz)) / 11));
      }
      card.current.style.opacity = op.toFixed(2);
      card.current.style.transform = `translateY(${((1 - op) * 16).toFixed(1)}px)`;
    }
  });
  return (
    <group ref={ref} position={pos} rotation={[0, rot, 0]}>
      <Html transform distanceFactor={8} zIndexRange={[10, 0]} style={{ pointerEvents: "none", userSelect: "none" }}>
        <div ref={card} style={{
          opacity: 0, transition: "opacity .25s linear, transform .25s linear",
          width: 250, padding: "16px 18px", borderRadius: 12,
          border: `1px solid ${accent}66`, background: "rgba(8,12,20,0.78)",
          boxShadow: `0 0 28px ${accent}33, inset 0 0 18px ${accent}14`, backdropFilter: "blur(2px)",
          fontFamily: '-apple-system,"Noto Sans TC","Microsoft JhengHei",sans-serif', textAlign: "center",
        }}>
          {kicker && <div style={{ fontSize: 11, letterSpacing: "4px", color: accent, opacity: 0.85, marginBottom: 10 }}>{kicker}</div>}
          <div style={{ fontSize: 15, lineHeight: 1.95, color: "#dde5f2", textAlign: "justify" }}>{text}</div>
        </div>
      </Html>
    </group>
  );
}

/* ---------- 單一場景的 3D 內容 ---------- */
function SceneContents({ scene, input, paused, onNearGate, reveal }) {
  const trees = useMemo(() => scene.decor === "forest" ? makeTrees(150, scene.bounds, scene.clearing) : [], [scene]);
  const rails = useMemo(() => scene.decor === "bridge" ? makeRailings() : [], [scene]);
  const buildings = useMemo(() => scene.decor === "city" ? makeCity(64, scene.bounds) : [], [scene]);
  const cols = useMemo(() => scene.decor === "temple" ? makeColumns() : [], [scene]);
  const halls = useMemo(() => scene.decor === "hall" ? makeHall() : [], [scene]);
  const stationCols = useMemo(() => scene.decor === "station" ? makeStationCols() : [], [scene]);
  const obstacles = useMemo(() => {
    const list = [...trees, ...rails, ...buildings, ...cols, ...halls, ...stationCols, { x: scene.gate.pos[0], z: scene.gate.pos[2], r: 2.2 }];
    if (scene.npc) list.push({ x: scene.npc.pos[0], z: scene.npc.pos[2], r: 0.7 });
    return list;
  }, [trees, rails, buildings, cols, halls, stationCols, scene]);
  const groundR = (scene.bounds.r || 44) + 14;
  const playerPos = useRef(new THREE.Vector3(scene.start[0], 0, scene.start[1]));

  return (
    <>
      <color attach="background" args={[scene.bg]} />
      <fog attach="fog" args={[scene.bg, scene.fog[0], scene.fog[1]]} />
      <ambientLight intensity={0.35} color="#7fa0c8" />
      <hemisphereLight args={["#23406a", scene.bg, 0.5]} />
      <directionalLight position={[8, 16, 6]} intensity={0.9} color="#aac4ff" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} />
      <Ground color={scene.ground} r={groundR} />
      {scene.decor === "forest" && <><Trees data={trees} /><Fireflies r={scene.bounds.r} />{scene.clearing && <><Clearing pos={scene.clearing.pos} r={scene.clearing.r} /><Animals pos={scene.clearing.pos} r={scene.clearing.r} /></>}</>}
      {scene.decor === "bridge" && <><Bridge rails={rails} /><Motorcycles /><HeavenTerrace pos={[0, BR_TOP, -37]} /></>}
      {scene.decor === "city" && <City data={buildings} />}
      {scene.decor === "station" && <Station cols={stationCols} />}
      {scene.npc && <OldWoman pos={scene.npc.pos} line={scene.npc.line} playerPos={playerPos} />}
      {scene.decor === "temple" && <><Temple cols={cols} /><Motes color="#ecd49a" r={6} count={44} /></>}
      {scene.decor === "door" && <Motes color="#f6c87e" r={scene.bounds.r} rise size={0.14} />}
      {scene.decor === "hall" && <><Hall cols={halls} /><Motes color="#f2d78c" r={6} count={32} /></>}
      {(scene.cards || []).map((c, i) => (
        <StoryCard key={i} pos={c.pos} rot={c.rot} kicker={c.kicker} text={c.text} accent={scene.gate.glow} playerPos={playerPos} reveal={reveal} />
      ))}
      {scene.gate.kind === "book"
        ? <OpenBook pos={scene.gate.pos} glow={scene.gate.glow} />
        : <MoonGate pos={scene.gate.pos} glow={scene.gate.glow} />}
      <Player input={input} scene={scene} obstacles={obstacles} paused={paused} onNearGate={onNearGate} playerPos={playerPos} />
    </>
  );
}

/* ---------- 虛擬搖桿 ---------- */
function Joystick({ input, hidden }) {
  const base = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef(false);
  const R = 52;
  const handle = (cx0, cy0) => {
    const el = base.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = cx0 - cx, dy = cy0 - cy; const len = Math.hypot(dx, dy);
    if (len > R) { dx = dx / len * R; dy = dy / len * R; }
    setKnob({ x: dx, y: dy }); input.current.x = dx / R; input.current.z = dy / R;
  };
  const start = (e) => { active.current = true; const t = e.touches ? e.touches[0] : e; handle(t.clientX, t.clientY); };
  const move = (e) => { if (!active.current) return; const t = e.touches ? e.touches[0] : e; handle(t.clientX, t.clientY); };
  const end = () => { active.current = false; setKnob({ x: 0, y: 0 }); input.current.x = 0; input.current.z = 0; };
  return (
    <div ref={base} onTouchStart={start} onTouchMove={move} onTouchEnd={end} onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
      style={{ position: "fixed", left: 26, bottom: 30, width: 124, height: 124, borderRadius: "50%", border: "2px solid #f2d78c55", background: "rgba(8,14,22,0.35)", backdropFilter: "blur(3px)", zIndex: 20, touchAction: "none", userSelect: "none", opacity: hidden ? 0 : 1, pointerEvents: hidden ? "none" : "auto", transition: "opacity .2s" }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 52, height: 52, borderRadius: "50%", background: "radial-gradient(circle,#f2d78c,#c9a86a)", boxShadow: "0 0 18px #f2d78c88", transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`, transition: active.current ? "none" : "transform .15s ease" }} />
    </div>
  );
}

/* ---------- 密碼鎖（沿用故事謎題） ---------- */
function CodeLock({ answer, accent, onSolved, onCancel, hint }) {
  const len = answer.length;
  const [vals, setVals] = useState(() => Array(len).fill(""));
  const [status, setStatus] = useState("");
  const refs = useRef([]);
  useEffect(() => { refs.current[0]?.focus(); }, []);
  const set = (i, raw) => {
    const v = raw.replace(/[^0-9]/g, "").slice(-1);
    const nv = [...vals]; nv[i] = v; setVals(nv); if (status !== "ok") setStatus("");
    if (v && i < len - 1) refs.current[i + 1]?.focus();
    if (nv.every(d => d !== "")) {
      if (nv.join("") === answer) { setStatus("ok"); setTimeout(onSolved, 650); }
      else { setStatus("err"); setTimeout(() => { setVals(Array(len).fill("")); setStatus(""); refs.current[0]?.focus(); }, 650); }
    }
  };
  const key = (i, e) => { if (e.key === "Backspace" && !vals[i] && i > 0) refs.current[i - 1]?.focus(); };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(2,6,10,0.62)", backdropFilter: "blur(4px)" }}>
      <div style={{ textAlign: "center", maxWidth: 440, width: "90%", padding: "34px 26px", borderRadius: 14, border: `1px solid ${accent}66`, background: "rgba(10,16,26,0.92)" }}>
        <div style={{ fontSize: 12, letterSpacing: "6px", color: accent, opacity: 0.85, marginBottom: 12 }}>✦ 命 運 之 門 ✦</div>
        <h3 style={{ fontSize: 22, color: "#f4ecd6", letterSpacing: "2px", margin: "0 0 8px" }}>輸入密碼，解開封印</h3>
        <p style={{ fontSize: 13, color: "#8a93a8", lineHeight: 1.7, margin: "0 0 22px" }}>{hint}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", animation: status === "err" ? "shake .4s" : "none" }}>
          {vals.map((d, i) => (
            <input key={i} ref={el => refs.current[i] = el} value={d} disabled={status === "ok"} onChange={e => set(i, e.target.value)} onKeyDown={e => key(i, e)} inputMode="numeric" maxLength={1}
              style={{ width: 46, height: 58, textAlign: "center", fontSize: 26, fontWeight: 700, color: status === "ok" ? accent : "#f4ecd6", background: "rgba(0,0,0,0.35)", border: `1.5px solid ${status === "err" ? "#d05a4a" : status === "ok" ? accent : accent + "88"}`, borderRadius: 8, outline: "none", caretColor: accent }} />
          ))}
        </div>
        <div style={{ height: 22, marginTop: 13, fontSize: 13, letterSpacing: "2px" }}>
          {status === "err" && <span style={{ color: "#e08a7a" }}>密碼不符，再試一次</span>}
          {status === "ok" && <span style={{ color: accent }}>✦ 封印解除 ✦</span>}
        </div>
        <button onClick={onCancel} style={{ marginTop: 14, padding: "8px 20px", borderRadius: 8, border: "1px solid #ffffff22", background: "transparent", color: "#8a93a8", fontSize: 13, letterSpacing: "2px", cursor: "pointer" }}>退後幾步</button>
      </div>
    </div>
  );
}

/* ---------- 進場：翻開書頁（序曲） ---------- */
function IntroBook({ onEnter }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 50% 38%, #1a1630 0%, #0a0a18 55%, #05060c 100%)", fontFamily: '-apple-system,"Noto Sans TC","Microsoft JhengHei",sans-serif' }}>
      <div style={{ perspective: 1400 }}>
        <div className="ib-book">
          <div className="ib-page"><div className="ib-glow" /></div>
          <div className="ib-cover">
            <div className="ib-cover-in">
              <div className="ib-cover-moon">☾</div>
              <div className="ib-cover-text">命 運 之 書</div>
            </div>
          </div>
        </div>
      </div>
      <button className="ib-enter" onClick={onEnter}>翻開書頁，踏入序章</button>

      <style>{`
        .ib-book{position:relative;width:300px;height:380px;transform-style:preserve-3d}
        .ib-page{position:absolute;inset:0;border-radius:6px 12px 12px 6px;
          background:linear-gradient(135deg,#efe6cf,#d9cba8);
          box-shadow:inset 0 0 40px #b59f6d55, 0 30px 60px #000a;
          display:flex;align-items:center;justify-content:center;overflow:hidden;
          opacity:0;animation:ibPage .8s ease 1.15s forwards}
        .ib-glow{width:80%;height:80%;border-radius:50%;
          background:radial-gradient(circle,#fff3cf 0%,#f2d78c66 35%,transparent 70%);
          opacity:0;animation:ibGlow 1.6s ease 1.5s forwards}
        .ib-cover{position:absolute;inset:0;border-radius:6px 12px 12px 6px;transform-origin:left center;
          transform:rotateY(0deg);backface-visibility:hidden;
          background:linear-gradient(135deg,#2a1c3e,#140e22);border:1px solid #caa86a55;
          box-shadow:0 30px 60px #000c, inset 0 0 50px #00000066;
          animation:ibOpen 1.5s cubic-bezier(.4,.1,.2,1) .35s forwards}
        .ib-cover-in{position:absolute;inset:14px;border:1px solid #caa86a44;border-radius:4px 10px 10px 4px;
          display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px}
        .ib-cover-moon{font-size:62px;color:#e9d09a;text-shadow:0 0 24px #caa86a88}
        .ib-cover-text{font-size:18px;letter-spacing:8px;color:#d9bd86;padding-left:8px}
        .ib-enter{margin-top:38px;padding:13px 30px;border-radius:10px;border:1px solid #caa86a88;
          background:rgba(26,22,40,.6);color:#f2d78c;font-size:14px;letter-spacing:4px;cursor:pointer;
          opacity:0;animation:ibBtn .8s ease 1.9s forwards}
        .ib-enter:hover{background:rgba(40,34,60,.7)}
        @keyframes ibOpen{to{transform:rotateY(-158deg)}}
        @keyframes ibPage{to{opacity:1}}
        @keyframes ibGlow{0%{opacity:0}60%{opacity:.9}100%{opacity:.6}}
        @keyframes ibBtn{to{opacity:1}}
        @media (prefers-reduced-motion:reduce){.ib-cover{animation:none;transform:rotateY(-158deg)}.ib-page,.ib-glow,.ib-enter{animation:none;opacity:1}}
      `}</style>
    </div>
  );
}

export default function World3D({ onExit }) {
  const input = useMoveInput();
  const paused = useRef(false);
  const [sceneId, setSceneId] = useState("pro");
  const [near, setNear] = useState(false);
  const [puzzle, setPuzzle] = useState(false);
  const [fade, setFade] = useState(false);
  const [done, setDone] = useState(false);
  const [intro, setIntro] = useState(() => !!SCENES[sceneId].intro);
  const scene = SCENES[sceneId];

  // 序曲進場時翻書，期間凍結移動
  useEffect(() => { paused.current = intro; }, [intro]);

  // 走近月門 → 自動開啟密碼鎖並凍結移動
  useEffect(() => {
    if (near && !puzzle && !done) { setPuzzle(true); paused.current = true; input.current.x = 0; input.current.z = 0; }
  }, [near]);

  const closePuzzle = () => { setPuzzle(false); paused.current = false; };
  const solve = () => {
    setFade(true);
    setTimeout(() => {
      setPuzzle(false);
      if (scene.next) { setSceneId(scene.next); setNear(false); paused.current = false; }
      else { setDone(true); paused.current = true; }
      setTimeout(() => setFade(false), 60);
    }, 700);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: scene.bg, overflow: "hidden" }}>
      <Canvas key={sceneId} shadows dpr={[1, 1.6]} gl={{ antialias: true, powerPreference: "high-performance" }} camera={{ position: [0, 2.7, 22], fov: 52 }}>
        <SceneContents scene={scene} input={input} paused={paused} onNearGate={setNear} reveal={!intro} />
      </Canvas>

      <Joystick input={input} hidden={puzzle || done || intro} />

      {intro && <IntroBook onEnter={() => { setIntro(false); paused.current = false; }} />}

      {/* 場景名 + 操作提示 */}
      <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 20, textAlign: "center", color: "#cdd6e6", fontFamily: '-apple-system,"Noto Sans TC","Microsoft JhengHei",sans-serif', textShadow: "0 1px 6px #000", pointerEvents: "none" }}>
        <div style={{ fontSize: 16, letterSpacing: "4px", color: scene.gate.glow, marginBottom: 4 }}>{scene.name}</div>
        <div style={{ fontSize: 12, letterSpacing: "2px", opacity: 0.8 }}>搖桿／WASD 走動 · 走向發光的月門</div>
      </div>

      {/* 接近提示 */}
      {near && !puzzle && !done && (
        <div style={{ position: "fixed", left: "50%", top: "42%", transform: "translateX(-50%)", zIndex: 20, textAlign: "center", color: scene.gate.glow, pointerEvents: "none", fontFamily: '-apple-system,"Noto Sans TC","Microsoft JhengHei",sans-serif' }}>
          <div style={{ fontSize: 12, letterSpacing: "6px", opacity: 0.85, marginBottom: 8 }}>✦ {scene.gate.label} ✦</div>
          <div style={{ fontSize: "clamp(20px,5vw,28px)", letterSpacing: "3px", fontWeight: 700, textShadow: `0 0 24px ${scene.gate.glow}88` }}>命運之門就在眼前</div>
        </div>
      )}

      {puzzle && !done && scene.puzzle && <CodeLock answer={scene.puzzle.answer} accent={scene.gate.glow} hint={scene.puzzle.hint} onSolved={solve} onCancel={closePuzzle} />}

      {/* 無密碼的門（序曲）：直接踏入 */}
      {puzzle && !done && !scene.puzzle && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(2,6,10,0.62)", backdropFilter: "blur(4px)" }}>
          <div style={{ textAlign: "center", maxWidth: 440, width: "90%", padding: "34px 26px", borderRadius: 14, border: `1px solid ${scene.gate.glow}66`, background: "rgba(10,16,26,0.92)", fontFamily: '-apple-system,"Noto Sans TC","Microsoft JhengHei",sans-serif' }}>
            <div style={{ fontSize: 12, letterSpacing: "6px", color: scene.gate.glow, opacity: 0.85, marginBottom: 16 }}>✦ {scene.gate.label} ✦</div>
            {scene.enterLabel.split("\n").map((ln, i) => (
              i === 0 ? (
                <div key={i} style={{ fontSize: "clamp(20px,5.2vw,27px)", letterSpacing: "4px", fontWeight: 700, marginBottom: 10,
                  background: "linear-gradient(90deg,#f2d78c,#ff9a6a,#c89bff,#7fd0ff,#f2d78c)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent",
                  filter: "drop-shadow(0 0 14px #f2d78c55)" }}>{ln}</div>
              ) : (
                <div key={i} style={{ fontSize: "clamp(14px,3.6vw,17px)", color: "#bfc6d6", letterSpacing: "2px", lineHeight: 1.8, fontStyle: "italic" }}>{ln}</div>
              )
            ))}
            <button onClick={solve} style={{ marginTop: 26, padding: "12px 30px", borderRadius: 10, border: `1px solid ${scene.gate.glow}88`, background: "rgba(26,28,40,0.6)", color: scene.gate.glow, fontSize: 15, letterSpacing: "4px", cursor: "pointer" }}>{scene.enterButton || "踏入"}</button>
            <div><button onClick={closePuzzle} style={{ marginTop: 12, padding: "6px 16px", borderRadius: 8, border: "1px solid #ffffff22", background: "transparent", color: "#8a93a8", fontSize: 13, letterSpacing: "2px", cursor: "pointer" }}>退後幾步</button></div>
          </div>
        </div>
      )}

      {/* 完成 */}
      {done && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(4,6,10,0.7)", textAlign: "center", fontFamily: '-apple-system,"Noto Sans TC","Microsoft JhengHei",sans-serif' }}>
          <div style={{ fontSize: 13, letterSpacing: "8px", color: "#f6c87e", marginBottom: 14 }}>◇ 最 後 一 道 測 試 ◇</div>
          <div style={{ fontSize: "clamp(24px,6.5vw,38px)", color: "#f4e4c4", letterSpacing: "3px", fontWeight: 700, textShadow: "0 0 30px #f6c87e55" }}>門，為你們而開</div>
          <div style={{ marginTop: 16, fontSize: "clamp(14px,3vw,16px)", color: "#a88c76", letterSpacing: "2px", lineHeight: 1.8, maxWidth: 380, padding: "0 20px" }}>一路走來的迷宮、森林、大橋與學堂，都是為了引你們到此。<br/>而這道測試的答案，將解開這一切的來龍去脈……</div>
          <button onClick={onExit} style={{ marginTop: 30, padding: "12px 28px", borderRadius: 10, border: "1px solid #c9a86a88", background: "rgba(26,18,12,0.6)", color: "#f4e4c4", fontSize: 14, letterSpacing: "3px", cursor: "pointer" }}>回到故事</button>
        </div>
      )}

      {/* 切換場景的金光淡入淡出 */}
      <div style={{ position: "fixed", inset: 0, zIndex: 30, pointerEvents: "none", background: `radial-gradient(circle at 50% 45%, ${scene.gate.glow}, ${scene.gate.glow}cc)`, opacity: fade ? 1 : 0, transition: "opacity .6s ease" }} />

      <button onClick={onExit} style={{ position: "fixed", right: 18, top: 14, zIndex: 50, padding: "8px 16px", borderRadius: 8, border: "1px solid #c9a86a66", background: "rgba(13,20,34,0.7)", color: "#f2d78c", fontSize: 13, letterSpacing: "2px", cursor: "pointer", backdropFilter: "blur(4px)" }}>← 離開</button>

      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
    </div>
  );
}

/* =====================================================================
   想換成真模型（.glb）取代程序化公主時：
   1) 把模型放到 src/assets/princess.glb（或 public/）
   2) import { useGLTF, useAnimations } from "@react-three/drei";
   3) 寫一個元件取代 Player 內的幾何體：
        function PrincessModel(){
          const { scene, animations } = useGLTF("/princess.glb");
          const { actions } = useAnimations(animations, ref);
          // 移動時 actions.Walk.play()，靜止時 actions.Idle.play()
        }
      其餘移動 / 碰撞 / 鏡頭邏輯不變，只換掉 <group> 內的網格。
   ===================================================================== */
