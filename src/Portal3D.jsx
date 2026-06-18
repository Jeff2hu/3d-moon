import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* =====================================================================
   3D 月門（夜色奇幻）—— 手機優先
   - 真 3D：發光金環 + 深藍漩渦門 + 月牙（shader）+ 漂浮餘燼
   - 隨手機陀螺儀 / 手指傾斜做視差
   - 離開畫面時暫停渲染、尊重 prefers-reduced-motion、限制 dpr
   ===================================================================== */

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 傾斜輸入：陀螺儀（手機）+ 指標（桌機） ---------- */
function useTilt() {
  const tilt = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (reduceMotion) return;
    let raf = 0;
    const target = { x: 0, y: 0 };
    const onOrient = (e) => {
      // gamma: 左右(-90..90)  beta: 前後(-180..180)
      if (e.gamma == null || e.beta == null) return;
      target.x = Math.max(-1, Math.min(1, e.gamma / 35));
      target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 35));
    };
    const onPointer = (e) => {
      const w = window.innerWidth, h = window.innerHeight;
      target.x = (e.clientX / w) * 2 - 1;
      target.y = (e.clientY / h) * 2 - 1;
    };
    const loop = () => {
      tilt.current.x += (target.x - tilt.current.x) * 0.06;
      tilt.current.y += (target.y - tilt.current.y) * 0.06;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("deviceorientation", onOrient, true);
    window.addEventListener("pointermove", onPointer, { passive: true });
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("deviceorientation", onOrient, true);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);
  return tilt;
}

/* ---------- 漩渦門 + 月牙（單一 shader plane，省效能） ---------- */
const portalFrag = `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uGlow;
  uniform vec3 uDeep1;
  uniform vec3 uDeep2;
  uniform vec3 uMoon;

  float circle(vec2 p, vec2 c, float r){ return length(p-c)-r; }

  void main(){
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    float disc = smoothstep(0.94, 0.90, r);
    if (disc <= 0.001) discard;

    vec3 col = mix(uDeep1, uDeep2, smoothstep(0.0, 0.95, r));

    float ang = atan(p.y, p.x);
    float swirl = 0.5 + 0.5 * sin(ang * 3.0 + r * 11.0 - uTime * 0.6);
    col += uGlow * 0.05 * swirl * (1.0 - r);

    // 月牙：大圓減去偏移的圓
    float c1 = circle(p, vec2(0.0, 0.0), 0.52);
    float c2 = circle(p, vec2(0.26, 0.06), 0.46);
    float moon = smoothstep(0.012, -0.02, c1) * smoothstep(-0.02, 0.012, c2);
    float halo = smoothstep(0.34, 0.0, abs(c1)) * (1.0 - moon) * 0.25;
    col += uMoon * halo;
    col = mix(col, uMoon, moon);

    // 內緣金光
    float rim = smoothstep(0.80, 0.91, r) * smoothstep(0.94, 0.90, r);
    col += uGlow * rim * 1.1;

    gl_FragColor = vec4(col, disc);
  }
`;

const portalVert = `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFrag = `
  precision mediump float;
  varying vec2 vUv;
  uniform vec3 uGlow;
  void main(){
    float d = length(vUv - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.0, d);
    a = pow(a, 2.2) * 0.55;
    gl_FragColor = vec4(uGlow, a);
  }
`;

function hexVec(h){ const c = new THREE.Color(h); return new THREE.Vector3(c.r, c.g, c.b); }

function Gate({ tilt, glow = "#f2d78c" }) {
  const group = useRef();
  const ring = useRef();
  const ring2 = useRef();
  const portalMat = useRef();
  const embers = useRef();

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uGlow: { value: hexVec(glow) },
    uDeep1: { value: hexVec("#1a2b48") },
    uDeep2: { value: hexVec("#0a1322") },
    uMoon: { value: hexVec("#ecdfb0") },
  }), [glow]);

  const glowUniforms = useMemo(() => ({ uGlow: { value: hexVec(glow) } }), [glow]);

  // 漂浮餘燼
  const emberGeo = useMemo(() => {
    const n = 46;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const rad = 0.7 + Math.random() * 1.5;
      pos[i * 3] = Math.cos(a) * rad;
      pos[i * 3 + 1] = -1.4 + Math.random() * 2.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
      seed[i] = Math.random() * 10;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (portalMat.current) portalMat.current.uniforms.uTime.value = t;
    if (!reduceMotion) {
      if (ring.current) ring.current.rotation.z += dt * 0.12;
      if (ring2.current) ring2.current.rotation.z -= dt * 0.22;
      if (embers.current) {
        embers.current.rotation.y += dt * 0.04;
        const pos = embers.current.geometry.attributes.position;
        const seed = embers.current.geometry.attributes.aSeed;
        for (let i = 0; i < pos.count; i++) {
          let y = pos.getY(i) + dt * (0.12 + (seed.getX(i) % 1) * 0.15);
          if (y > 1.5) y = -1.5;
          pos.setY(i, y);
        }
        pos.needsUpdate = true;
      }
    }
    if (group.current) {
      const tx = tilt.current.x, ty = tilt.current.y;
      const breathe = reduceMotion ? 0 : Math.sin(t * 0.6) * 0.04;
      group.current.rotation.y += ((tx * 0.35) - group.current.rotation.y) * 0.08;
      group.current.rotation.x += ((ty * 0.28 + breathe) - group.current.rotation.x) * 0.08;
      group.current.position.x += ((tx * 0.12) - group.current.position.x) * 0.08;
      group.current.position.y += ((-ty * 0.10) - group.current.position.y) * 0.08;
    }
  });

  return (
    <group ref={group}>
      {/* 背後柔光暈 */}
      <mesh position={[0, 0, -0.25]} scale={3.1}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          vertexShader={portalVert}
          fragmentShader={glowFrag}
          uniforms={glowUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 漩渦門 + 月牙 */}
      <mesh>
        <planeGeometry args={[1.86, 1.86]} />
        <shaderMaterial
          ref={portalMat}
          vertexShader={portalVert}
          fragmentShader={portalFrag}
          uniforms={uniforms}
          transparent
        />
      </mesh>

      {/* 主金環（真 3D，吃光） */}
      <mesh ref={ring} position={[0, 0, 0.04]}>
        <torusGeometry args={[1.0, 0.045, 24, 120]} />
        <meshStandardMaterial
          color={glow}
          emissive={glow}
          emissiveIntensity={0.9}
          metalness={0.85}
          roughness={0.3}
        />
      </mesh>

      {/* 內側細環 */}
      <mesh ref={ring2} position={[0, 0, 0.06]}>
        <torusGeometry args={[0.88, 0.012, 12, 100]} />
        <meshStandardMaterial
          color={glow}
          emissive={glow}
          emissiveIntensity={1.2}
          metalness={0.6}
          roughness={0.4}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* 餘燼 */}
      <points ref={embers} geometry={emberGeo} position={[0, 0, 0.2]}>
        <pointsMaterial
          color={glow}
          size={0.045}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/* ---------- 離開畫面時暫停渲染 ---------- */
function VisibilityFrameloop({ visible }) {
  const { invalidate } = useThree();
  useEffect(() => { if (visible) invalidate(); }, [visible, invalidate]);
  return null;
}

export default function Portal3D({ glow = "#f2d78c", style }) {
  const tilt = useTilt();
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(true);

  // 觀察可見性 → 暫停 / 恢復
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // iOS 13+ 需使用者手勢才能取得陀螺儀
  useEffect(() => {
    const DOE = window.DeviceOrientationEvent;
    if (!DOE || typeof DOE.requestPermission !== "function") return;
    const ask = () => {
      DOE.requestPermission().catch(() => {});
      window.removeEventListener("touchend", ask);
    };
    window.addEventListener("touchend", ask, { once: true });
    return () => window.removeEventListener("touchend", ask);
  }, []);

  return (
    <div ref={wrapRef} style={{ width: "100%", height: "100%", ...style }}>
      <Canvas
        dpr={[1, 1.6]}
        frameloop={reduceMotion ? "demand" : visible ? "always" : "never"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 3.3], fov: 46 }}
        style={{ background: "transparent" }}
      >
        <VisibilityFrameloop visible={visible} />
        <ambientLight intensity={0.6} />
        <pointLight position={[2.5, 2, 3]} intensity={2.2} color={glow} />
        <pointLight position={[-3, -1.5, 2]} intensity={0.8} color="#5a78b0" />
        <Gate tilt={tilt} glow={glow} />
      </Canvas>
    </div>
  );
}
