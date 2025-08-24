'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SimpleCodeEditor from '@/components/simple-code-editor';

const initialCode = `// Mini coding space (demo)
function greet(name) {
  return \`Welcome to White Rabbit, \${name}!\`;
}

console.log(greet('Developer'));`;

export default function LandingPage() {
  const [code, setCode] = useState(initialCode);

  // Rabbits + Code Rain (no user drawing)
  function RabbitsCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const codeRainRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const isRabbitRef = useRef(true);
    const requestIdRef = useRef<number | null>(null);
    const pathIndexRef = useRef(0);
    const rabbitOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const rabbitColorRef = useRef('#ffffff');
    const rabbitsRef = useRef<Array<{ offset: { x: number; y: number }, color: string, idx: number }>>([]);
    const rabbitSpeedRef = useRef(3);
    const persistentRef = useRef(true);

    const rabbitPath = useRef<Array<{ x: number; y: number; type: 'start' | 'line' }>>([
      { x: 0, y: 0, type: 'start' },
      { x: 10, y: -20, type: 'line' },
      { x: 50, y: -20, type: 'line' },
      { x: 60, y: 0, type: 'line' },
      { x: 50, y: 20, type: 'line' },
      { x: 10, y: 20, type: 'line' },
      { x: 0, y: 0, type: 'line' },
      { x: 15, y: -20, type: 'start' },
      { x: 20, y: -40, type: 'line' },
      { x: 30, y: -30, type: 'line' },
      { x: 25, y: -15, type: 'line' },
      { x: 35, y: -20, type: 'start' },
      { x: 40, y: -40, type: 'line' },
      { x: 50, y: -30, type: 'line' },
      { x: 45, y: -15, type: 'line' },
      { x: 55, y: 5, type: 'start' },
      { x: 60, y: 0, type: 'line' },
      { x: 55, y: -5, type: 'line' },
    ]).current;

    const getCtx = (which: 'fg' | 'bg' = 'fg') => {
      const canvas = which === 'fg' ? canvasRef.current : codeRainRef.current;
      if (!canvas) return null as CanvasRenderingContext2D | null;
      return canvas.getContext('2d');
    };

    const resizeCanvas = useCallback(() => {
      const fg = canvasRef.current;
      const bg = codeRainRef.current;
      const container = containerRef.current;
      const fgCtx = getCtx('fg');
      const bgCtx = getCtx('bg');
      if (!fg || !bg || !container || !fgCtx || !bgCtx) return;

      const { width, height } = container.getBoundingClientRect();
      const W = Math.max(320, Math.floor(width));
      const H = Math.max(240, Math.floor(height));
      fg.width = W; fg.height = H;
      bg.width = W; bg.height = H;
    }, []);

    // Code rain setup
    const symbols = ['const','let','function','return','=>','{','}','(',')',';','if','else','await','async','import','from','class','new','try','catch','<div>','</div>','useState','useEffect'];
    const columnsRef = useRef<number[]>([]);
    const fontSizeRef = useRef(14);
    const codeRainStep = useCallback(() => {
      const ctx = getCtx('bg');
      const canvas = codeRainRef.current;
      if (!ctx || !canvas) return;
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, W, H);
      ctx.font = `${fontSizeRef.current}px monospace`;
      for (let i = 0; i < columnsRef.current.length; i++) {
        const txt = symbols[Math.floor(Math.random() * symbols.length)];
        const x = i * fontSizeRef.current;
        const y = columnsRef.current[i] * fontSizeRef.current;
        const hue = (i * 12 + y / 5) % 360;
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.fillText(txt, x, y);
        if (y > H && Math.random() > 0.975) columnsRef.current[i] = 0;
        columnsRef.current[i]++;
      }
    }, [symbols]);

    const drawRabbitLoop = useCallback(() => {
      if (!isRabbitRef.current) return;
      const ctx = getCtx('fg');
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;
      ctx.strokeStyle = rabbitColorRef.current;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Clear slightly for motion trails
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const speed = Math.max(1, Math.min(10, rabbitSpeedRef.current));
      for (let i = 0; i < speed; i++) {
        if (pathIndexRef.current >= rabbitPath.length) {
          pathIndexRef.current = 0;
          // next spawn
          rabbitOffsetRef.current = {
            x: Math.random() * (canvas.width - 120) + 60,
            y: Math.random() * (canvas.height - 120) + 60,
          };
          rabbitColorRef.current = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
          break;
        }
        const p = rabbitPath[pathIndexRef.current];
        if (p.type === 'start') {
          ctx.beginPath();
          ctx.moveTo(rabbitOffsetRef.current.x + p.x, rabbitOffsetRef.current.y + p.y);
        } else {
          ctx.lineTo(rabbitOffsetRef.current.x + p.x, rabbitOffsetRef.current.y + p.y);
          ctx.stroke();
        }
        pathIndexRef.current++;
      }
      requestIdRef.current = requestAnimationFrame(() => {
        codeRainStep();
        drawRabbitLoop();
      });
    }, []);
    // adjust deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const _deps = [rabbitPath];

    useEffect(() => {
      resizeCanvas();
      const onResize = () => resizeCanvas();
      window.addEventListener('resize', onResize);
      return () => {
        window.removeEventListener('resize', onResize);
      };
    }, [resizeCanvas]);

    useEffect(() => {
      // no user drawing listeners – autonomous show
    }, []);

    const startRabbit = () => {
      // Always (re)start the loop
      if (requestIdRef.current) cancelAnimationFrame(requestIdRef.current);
      isRabbitRef.current = true;
      pathIndexRef.current = 0;
      const canvas = canvasRef.current!;
      rabbitOffsetRef.current = {
        x: Math.random() * (canvas.width - 120) + 60,
        y: Math.random() * (canvas.height - 120) + 60,
      };
      rabbitColorRef.current = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      requestIdRef.current = requestAnimationFrame(() => {
        codeRainStep();
        drawRabbitLoop();
      });
    };

    const clearCanvas = () => {
      isRabbitRef.current = false;
      if (requestIdRef.current) cancelAnimationFrame(requestIdRef.current);
      const fg = getCtx('fg');
      const bg = getCtx('bg');
      const fgc = canvasRef.current;
      const bgc = codeRainRef.current;
      if (fg && fgc) fg.clearRect(0, 0, fgc.width, fgc.height);
      if (bg && bgc) bg.clearRect(0, 0, bgc.width, bgc.height);
    };

    const saveImage = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = 'my-painting.png';
      link.click();
    };

    useEffect(() => {
      // ensure canvases sized first
      resizeCanvas();
      const bgc = codeRainRef.current;
      fontSizeRef.current = 14;
      const columns = Math.max(20, Math.floor((bgc?.width || 600) / fontSizeRef.current));
      columnsRef.current = Array.from({ length: columns }, () => Math.floor(Math.random() * 50));
      codeRainStep();
      startRabbit();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div className="relative space-y-3">
        <div ref={containerRef} className="relative rounded-xl border border-neutral-800 bg-black overflow-hidden" style={{ height: 420 }}>
          {/* Code rain (background) */}
          <canvas ref={codeRainRef} className="absolute inset-0 block w-full h-full" />
          {/* Rabbit strokes (foreground) */}
          <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={startRabbit} className="rounded-md bg-gradient-to-r from-purple-600 to-cyan-400 px-4 py-2 text-xs font-semibold text-white shadow hover:shadow-lg transition">Restart Rabbits</button>
          <button onClick={clearCanvas} className="rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-100 hover:bg-neutral-700 transition">Clear</button>
          <button onClick={saveImage} className="rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-100 hover:bg-neutral-700 transition">Save</button>
        </div>
      </div>
    );
  }

  // 3D Rabbit Forest with rain and thunder (Three.js + Tone.js via CDN)
  function RabbitsForest3D() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const sceneRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const rendererRef = useRef<any>(null);
    const rabbitsRef = useRef<any[]>([]);
    const treesRef = useRef<any[]>([]);
    const rainRef = useRef<any>(null);
    const rainParticlesRef = useRef<Float32Array | null>(null);
    const rainSpeedRef = useRef<number[]>([]);
    const rainAreaRef = useRef<number>(200);
    const lightningLightRef = useRef<any>(null);
    const thunderSynthRef = useRef<any>(null);
    const animIdRef = useRef<number | null>(null);
    const lastLightningTimeRef = useRef<number>(0);
    const mouseStateRef = useRef({ down: false, prevX: 0, prevY: 0 });
    const developerRef = useRef<any>(null);
    const bigComputersRef = useRef<any[]>([]);
    const errorsRef = useRef<any[]>([]);
    const nextLightningAtRef = useRef<number | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const worldSize = 300;
    const numRabbits = 5;
    const numTrees = 50;
    const numBigComputers = 3;
    const maxErrors = 10;
    const lightningMinInterval = 5000;
    const lightningMaxInterval = 20000;

    const loadScript = (src: string) => {
      return new Promise<void>((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        document.body.appendChild(s);
      });
    };

    const init = useCallback(() => {
      const THREE: any = (window as any).THREE;
      if (!THREE || !canvasRef.current || !containerRef.current) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1e2a24);
      sceneRef.current = scene;

      const ratio = 16 / 9;
      const width = containerRef.current.clientWidth;
      const height = Math.max(200, Math.floor(width / ratio));

      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 50, 150);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
      renderer.setSize(width, height);
      rendererRef.current = renderer;

      const ambientLight = new THREE.AmbientLight(0xaaaaaa, 0.3);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xb5b5c7, 0.6);
      directionalLight.position.set(50, 200, 100);
      scene.add(directionalLight);

      const lightningLight = new THREE.PointLight(0xffffff, 0, 500, 2);
      scene.add(lightningLight);
      lightningLightRef.current = lightningLight;

      const groundGeometry = new THREE.PlaneGeometry(worldSize, worldSize);
      const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x243624 });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      scene.add(ground);

      // Clear arrays
      rabbitsRef.current = [];
      treesRef.current = [];
      bigComputersRef.current = [];
      errorsRef.current = [];
      developerRef.current = null;

      const createTree = () => {
        const g = new THREE.Group();
        const trunkGeometry = new THREE.CylinderGeometry(1.5, 2.5, 15, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x583a3a });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 7.5;
        g.add(trunk);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x263a26 });
        for (let i = 0; i < 3; i++) {
          const leavesGeometry = new THREE.ConeGeometry(8, 20, 16);
          const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
          leaves.position.y = 15 + i * 5;
          leaves.scale.set(1 - i * 0.2, 1 - i * 0.2, 1 - i * 0.2);
          g.add(leaves);
        }
        return g;
      };

      const createRabbit = () => {
        const g = new THREE.Group();
        const headGeometry = new THREE.BoxGeometry(2, 2, 2);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(1.5, 1.5, 0);
        g.add(head);
        const bodyGeometry = new THREE.CylinderGeometry(1.5, 2, 4, 16);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.z = Math.PI / 2;
        body.position.set(-1, 0.5, 0);
        g.add(body);
        const earGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
        const earMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
        const ear1 = new THREE.Mesh(earGeometry, earMaterial);
        ear1.rotation.x = Math.PI / 3; ear1.position.set(1.5, 3.5, 0.8); g.add(ear1);
        const ear2 = new THREE.Mesh(earGeometry, earMaterial);
        ear2.rotation.x = -Math.PI / 3; ear2.position.set(1.5, 3.5, -0.8); g.add(ear2);
        const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        eye.position.set(2.3, 1.8, 0.8); g.add(eye);
        return { mesh: g, speed: Math.random() * 0.05 + 0.02, wobble: Math.random() * 0.005 + 0.002, angle: Math.random() * Math.PI * 2, hopTimer: 0 };
      };

      const createDeveloper = () => {
        const g = new THREE.Group();
        const bodyGeometry = new THREE.BoxGeometry(4, 6, 2);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 3;
        g.add(body);
        const headGeometry = new THREE.SphereGeometry(2, 16, 16);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xedc9af });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 7.5;
        g.add(head);
        const legGeometry = new THREE.CylinderGeometry(1, 1, 3, 8);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-1, 1.5, 0);
        g.add(leftLeg);
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(1, 1.5, 0);
        g.add(rightLeg);
        const laptopGeometry = new THREE.PlaneGeometry(3, 2);
        const laptopMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const laptop = new THREE.Mesh(laptopGeometry, laptopMaterial);
        laptop.position.set(0, 5, 2);
        laptop.rotation.x = -Math.PI / 4;
        g.add(laptop);
        return { mesh: g, speed: 0.05, angle: Math.random() * Math.PI * 2 };
      };

      const createBigComputer = () => {
        const g = new THREE.Group();
        const bodyGeometry = new THREE.BoxGeometry(10, 8, 4);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 4;
        g.add(body);
        const screenGeometry = new THREE.PlaneGeometry(8, 6);
        const screenMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(0, 4, 2.1);
        g.add(screen);
        const legGeometry = new THREE.CylinderGeometry(1.5, 1.5, 5, 8);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-3, 2.5, 0);
        g.add(leftLeg);
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(3, 2.5, 0);
        g.add(rightLeg);
        return { mesh: g, speed: 0.03, angle: Math.random() * Math.PI * 2 };
      };

      const createError = (x: number, y: number, z: number) => {
        const errorGeometry = new THREE.TorusGeometry(0.5, 0.1, 8, 16);
        const errorMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000 });
        const error = new THREE.Mesh(errorGeometry, errorMaterial);
        error.position.set(x, y, z);
        return error;
      };

      for (let i = 0; i < numTrees; i++) {
        const t = createTree();
        t.position.x = (Math.random() - 0.5) * worldSize * 0.9;
        t.position.z = (Math.random() - 0.5) * worldSize * 0.9;
        scene.add(t);
        treesRef.current.push(t);
      }
      for (let i = 0; i < numRabbits; i++) {
        const r = createRabbit();
        r.mesh.position.x = (Math.random() - 0.5) * worldSize * 0.5;
        r.mesh.position.z = (Math.random() - 0.5) * worldSize * 0.5;
        rabbitsRef.current.push(r);
        scene.add(r.mesh);
      }

      // Developer
      const dev = createDeveloper();
      dev.mesh.position.x = (Math.random() - 0.5) * worldSize * 0.5;
      dev.mesh.position.z = (Math.random() - 0.5) * worldSize * 0.5;
      developerRef.current = dev;
      scene.add(dev.mesh);

      // Big computers
      for (let i = 0; i < numBigComputers; i++) {
        const comp = createBigComputer();
        comp.mesh.position.x = (Math.random() - 0.5) * worldSize * 0.5;
        comp.mesh.position.z = (Math.random() - 0.5) * worldSize * 0.5;
        bigComputersRef.current.push(comp);
        scene.add(comp.mesh);
      }

      // Rain
      const numDrops = 12000;
      const dropGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(numDrops * 3);
      rainSpeedRef.current = [];
      for (let i = 0; i < numDrops; i++) {
        positions[i * 3] = (Math.random() - 0.5) * rainAreaRef.current;
        positions[i * 3 + 1] = Math.random() * rainAreaRef.current;
        positions[i * 3 + 2] = (Math.random() - 0.5) * rainAreaRef.current;
        rainSpeedRef.current[i] = Math.random() * 2 + 1;
      }
      dropGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const dropMaterial = new THREE.PointsMaterial({ color: 0x87a1a1, size: 0.5, transparent: true, opacity: 0.6 });
      const rain = new THREE.Points(dropGeometry, dropMaterial);
      scene.add(rain);
      rainRef.current = rain;
      rainParticlesRef.current = dropGeometry.attributes.position.array as Float32Array;

      const onResize = () => {
        if (!rendererRef.current || !cameraRef.current || !containerRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = Math.max(200, Math.floor(w / ratio));
        rendererRef.current.setSize(w, h);
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
      };
      window.addEventListener('resize', onResize);

      const onMouseDown = (e: MouseEvent) => { mouseStateRef.current.down = true; mouseStateRef.current.prevX = e.clientX; mouseStateRef.current.prevY = e.clientY; };
      const onMouseUp = () => { mouseStateRef.current.down = false; };
      const onMouseMove = (e: MouseEvent) => {
        if (!mouseStateRef.current.down) return;
        const dx = e.clientX - mouseStateRef.current.prevX;
        const dy = e.clientY - mouseStateRef.current.prevY;
        camera.rotation.y -= dx * 0.005;
        camera.rotation.x -= dy * 0.005;
        mouseStateRef.current.prevX = e.clientX; mouseStateRef.current.prevY = e.clientY;
      };
      canvasRef.current.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('mousemove', onMouseMove);

      const updateRain = () => {
        const arr = rainParticlesRef.current; if (!arr) return;
        for (let i = 0; i < arr.length / 3; i++) {
          arr[i * 3 + 1] -= rainSpeedRef.current[i];
          if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = rainAreaRef.current;
        }
        (rainRef.current as any).geometry.attributes.position.needsUpdate = true;
      };

      const triggerLightning = () => {
        const Tone: any = (window as any).Tone;
        if (!Tone || !thunderSynthRef.current) return;
        const light = lightningLightRef.current;
        light.color.setHSL(Math.random(), 0.5, 0.8);
        light.intensity = Math.random() * 1.5 + 1.0;
        light.position.x = (Math.random() - 0.5) * worldSize;
        light.position.z = (Math.random() - 0.5) * worldSize;
        const dist = light.position.distanceTo(camera.position);
        const delay = dist / 343; // seconds
        thunderSynthRef.current.triggerAttackRelease('1', Tone.now() + delay);
        setTimeout(() => { light.intensity = 0; }, 200);
      };

      const randInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const animate = (time: number) => {
        animIdRef.current = requestAnimationFrame(animate);
        if (nextLightningAtRef.current == null) {
          nextLightningAtRef.current = performance.now() + randInRange(lightningMinInterval, lightningMaxInterval);
        } else if (performance.now() >= nextLightningAtRef.current) {
          lastLightningTimeRef.current = time;
          triggerLightning();
          nextLightningAtRef.current = performance.now() + randInRange(lightningMinInterval, lightningMaxInterval);
        }
        rabbitsRef.current.forEach((r) => {
          r.angle += (Math.random() - 0.5) * r.wobble;
          r.mesh.position.x += Math.cos(r.angle) * r.speed;
          r.mesh.position.z += Math.sin(r.angle) * r.speed;
          r.hopTimer += r.speed;
          r.mesh.position.y = 0.5 + Math.sin(r.hopTimer * 5) * 0.5;
          if (Math.abs(r.mesh.position.x) > worldSize / 2 || Math.abs(r.mesh.position.z) > worldSize / 2) r.angle += Math.PI;
          r.mesh.rotation.y = -r.angle + Math.PI / 2;
        });

        // Update developer
        if (developerRef.current) {
          const d = developerRef.current;
          d.angle += (Math.random() - 0.5) * 0.01;
          d.mesh.position.x += Math.cos(d.angle) * d.speed;
          d.mesh.position.z += Math.sin(d.angle) * d.speed;
          if (Math.abs(d.mesh.position.x) > worldSize / 2 || Math.abs(d.mesh.position.z) > worldSize / 2) d.angle += Math.PI;
          d.mesh.rotation.y = -d.angle + Math.PI / 2;
        }

        // Update big computers
        bigComputersRef.current.forEach((c) => {
          c.angle += (Math.random() - 0.5) * 0.01;
          c.mesh.position.x += Math.cos(c.angle) * c.speed;
          c.mesh.position.z += Math.sin(c.angle) * c.speed;
          if (Math.abs(c.mesh.position.x) > worldSize / 2 || Math.abs(c.mesh.position.z) > worldSize / 2) c.angle += Math.PI;
          c.mesh.rotation.y = -c.angle + Math.PI / 2;
        });

        // Spawn transient error rings near developer
        if (developerRef.current && errorsRef.current.length < maxErrors && Math.random() < 0.005) {
          const dx = (Math.random() - 0.5) * 5;
          const dz = (Math.random() - 0.5) * 5;
          const dy = 5 + Math.random() * 2;
          const ex = developerRef.current.mesh.position.x + dx;
          const ez = developerRef.current.mesh.position.z + dz;
          const ey = developerRef.current.mesh.position.y + dy;
          const e = createError(ex, ey, ez);
          scene.add(e);
          errorsRef.current.push(e);
          setTimeout(() => {
            scene.remove(e);
            const idx = errorsRef.current.indexOf(e);
            if (idx > -1) errorsRef.current.splice(idx, 1);
          }, 3000);
        }

        updateRain();
        renderer.render(scene, camera);
      };
      animate(0);

      return () => {
        if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('mousemove', onMouseMove);
        if (canvasRef.current) canvasRef.current.removeEventListener('mousedown', onMouseDown);
        renderer.dispose?.();
      };
    }, []);

    const handleRestart = async () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      setMessage('3D Simulation Restarted!');
      setTimeout(() => setMessage(null), 3000);
      init();
    };

    useEffect(() => {
      let canceled = false;
      (async () => {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js');
        const Tone: any = (window as any).Tone;
        try {
          // Create synth but don't start transport/audio until user gesture
          thunderSynthRef.current = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.05, decay: 0.2, sustain: 0, release: 0.1 } }).toDestination();
        } catch {}
        if (!canceled) init();
      })();
      return () => { canceled = true; if (animIdRef.current) cancelAnimationFrame(animIdRef.current); };
    }, [init]);

    const enableAudio = async () => {
      const Tone: any = (window as any).Tone;
      try { await Tone.start(); Tone.Transport.start(); } catch {}
    };

    return (
      <div className="relative space-y-3">
        <div ref={containerRef} className="relative rounded-xl border border-neutral-800 bg-[#2b3a32] overflow-hidden" style={{ height: 420 }}>
          <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
          {message && (
            <div className="pointer-events-none fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black/80 px-5 py-3 text-center text-white shadow-lg">
              {message}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-neutral-400">Use your mouse to look around.</p>
          <div className="flex items-center gap-2">
            <button onClick={enableAudio} className="rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-100 hover:bg-neutral-700 transition">Enable Audio</button>
            <button onClick={handleRestart} className="rounded-md bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-green-700 transition">Restart Simulation</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="w-full border-b border-neutral-800/60 bg-neutral-950/60 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/40">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative" style={{ width: 160, height: 40 }}>
              <Image
                src="/whitebunnylogo.png"
                alt="White Rabbit"
                fill
                sizes="160px"
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/visual-tools" className="text-sm text-neutral-300 hover:text-white">
              Visual Tools
            </Link>
            <Link
              href="/enter"
              className="inline-flex items-center rounded-md bg-gradient-to-r from-purple-600 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-lg transition"
            >
              Enter White Rabbit
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Build faster with a focused, AI‑powered code space</h1>
            <p className="text-neutral-300 leading-relaxed">
              A minimal, fast web code editor with AI, visual tools, and a polished UX.
              Click below to explore the full editor, or try the mini coding space.
            </p>
            <div className="flex gap-3">
              <Link
                href="/enter"
                className="inline-flex items-center rounded-md bg-gradient-to-r from-purple-600 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-white shadow hover:shadow-lg transition"
              >
                Enter White Rabbit
              </Link>
              <Link
                href="/visual-tools"
                className="inline-flex items-center rounded-md border border-neutral-700 bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-neutral-100 hover:bg-neutral-800 transition"
              >
                Explore Visual Tools
              </Link>
            </div>
            <ul className="text-sm text-neutral-400 space-y-1">
              <li>— AI-assisted coding streamed into Monaco</li>
              <li>— Visual Tools hub (Git History, Code Flow, Smart File Tree)</li>
              <li>— Breathing caret + Focus Field ripple line highlight</li>
              <li>— Unified progress bar for long tasks</li>
            </ul>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
            <SimpleCodeEditor value={code} onChange={setCode} language="javascript" theme="vs-dark" height="420px" />
            <div className="flex items-center justify-between p-3">
              <span className="text-xs text-neutral-400">Mini coding space (demo)</span>
              <button onClick={() => setCode(initialCode)} className="text-xs text-neutral-300 hover:text-white">
                Reset
              </button>
            </div>
          </div>
        </div>
        <div className="mt-14">
          <h2 className="text-2xl font-semibold mb-4">Rabbits</h2>
          <RabbitsCanvas />
        </div>
        <div className="mt-14">
          <h2 className="text-2xl font-semibold mb-4">3D Rabbit Forest in the Rain</h2>
          <RabbitsForest3D />
        </div>
      </section>

      <footer className="border-t border-neutral-800/60">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-neutral-400">© {new Date().getFullYear()} White Rabbit. All rights reserved.</div>
      </footer>
    </main>
  );
}


