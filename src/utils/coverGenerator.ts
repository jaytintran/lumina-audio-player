// Generates procedural art album covers across distinct artistic themes (100% text-free)

export type CoverArtStyle = 'abstract' | 'cyberpunk' | 'nature' | 'synthwave' | 'celestial' | 'minimalist';

export interface CoverStyleOption {
  id: CoverArtStyle;
  label: string;
  emoji: string;
  description: string;
}

export const COVER_STYLE_OPTIONS: CoverStyleOption[] = [
  { id: 'abstract', label: 'Abstract Flow', emoji: '🌀', description: 'Fluid ribbons, ambient glowing orbs & sine waves' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', emoji: '⚡', description: 'Neon gridlines, HUD geometric polygons & scanlines' },
  { id: 'nature', label: 'Nature Organic', emoji: '🌿', description: 'Topographical contours, organic gradients & soft wave vectors' },
  { id: 'synthwave', label: 'Synthwave / Anime', emoji: '🌆', description: 'Sunset gradient horizons, sunburst rings & retro grids' },
  { id: 'celestial', label: 'Celestial Cosmos', emoji: '✨', description: 'Nebula particle clouds, deep space orbs & starfields' },
  { id: 'minimalist', label: 'Bauhaus Minimal', emoji: '📐', description: 'Bold geometric primitives & color-block compositions' },
];

export function generateArtCoverBlob(style: CoverArtStyle = 'abstract'): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(new Blob());
      return;
    }

    switch (style) {
      case 'cyberpunk':
        renderCyberpunkArt(ctx);
        break;
      case 'nature':
        renderNatureArt(ctx);
        break;
      case 'synthwave':
        renderSynthwaveArt(ctx);
        break;
      case 'celestial':
        renderCelestialArt(ctx);
        break;
      case 'minimalist':
        renderMinimalistArt(ctx);
        break;
      case 'abstract':
      default:
        renderAbstractArt(ctx);
        break;
    }

    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, 'image/jpeg', 0.94);
  });
}

export function generateRandomCoverBlob(): Promise<Blob> {
  const styles: CoverArtStyle[] = ['abstract', 'cyberpunk', 'nature', 'synthwave', 'celestial', 'minimalist'];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  return generateArtCoverBlob(randomStyle);
}

// 1. ABSTRACT FLOW
function renderAbstractArt(ctx: CanvasRenderingContext2D) {
  const palettes = [
    ['#0b132b', '#1c2541', '#3a506b', '#5bc0be', '#6fffe9'],
    ['#1a051d', '#581c87', '#9333ea', '#ec4899', '#f43f5e'],
    ['#022c22', '#064e3b', '#059669', '#10b981', '#34d399'],
    ['#18181b', '#3b0764', '#7e22ce', '#a855f7', '#c084fc'],
    ['#111827', '#1f2937', '#374151', '#f59e0b', '#fbbf24'],
  ];
  const pal = palettes[Math.floor(Math.random() * palettes.length)];

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 600, 600);
  bgGrad.addColorStop(0, pal[0]);
  bgGrad.addColorStop(0.5, pal[1]);
  bgGrad.addColorStop(1, '#05070a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 600, 600);

  // Radial glow orbs
  for (let i = 0; i < 4; i++) {
    const cx = 80 + Math.random() * 440;
    const cy = 80 + Math.random() * 440;
    const radius = 160 + Math.random() * 160;
    const orbGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
    orbGrad.addColorStop(0, pal[(i % 3) + 2] + '66');
    orbGrad.addColorStop(0.6, pal[(i % 3) + 2] + '18');
    orbGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Generative sine waves ribbons
  const waveCount = 8;
  for (let w = 0; w < waveCount; w++) {
    ctx.beginPath();
    const waveY = 80 + (w * 440) / waveCount;
    const freq = 0.004 + Math.random() * 0.007;
    const amp = 40 + Math.random() * 60;
    const phase = Math.random() * Math.PI * 2;

    ctx.moveTo(0, waveY + Math.sin(phase) * amp);
    for (let x = 0; x <= 600; x += 8) {
      const y = waveY + Math.sin(x * freq + phase) * amp + Math.cos(x * 0.003) * 25;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = pal[(w % 3) + 2] + (w % 2 === 0 ? 'bb' : '88');
    ctx.lineWidth = 2 + (w % 3);
    ctx.stroke();
  }

  // Concentric abstract arcs
  const arcX = 150 + Math.random() * 300;
  const arcY = 150 + Math.random() * 300;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  for (let r = 40; r < 280; r += 28) {
    ctx.beginPath();
    const startAngle = Math.random() * Math.PI;
    ctx.arc(arcX, arcY, r, startAngle, startAngle + Math.PI * (0.6 + Math.random() * 0.8));
    ctx.stroke();
  }
}

// 2. CYBERPUNK NEON
function renderCyberpunkArt(ctx: CanvasRenderingContext2D) {
  // Dark futuristic background
  const bgGrad = ctx.createRadialGradient(300, 300, 50, 300, 300, 420);
  bgGrad.addColorStop(0, '#100c24');
  bgGrad.addColorStop(0.7, '#070510');
  bgGrad.addColorStop(1, '#020106');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 600, 600);

  // Perspective 3D Neon Grid Floor
  const horizon = 320;
  ctx.strokeStyle = 'rgba(236, 72, 153, 0.25)';
  ctx.lineWidth = 1;

  // Horizontal vanishing lines
  for (let y = horizon; y <= 600; y += Math.pow((y - horizon) / 280, 2) * 50 + 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(600, y);
    ctx.stroke();
  }

  // Vertical perspective rays
  for (let x = -200; x <= 800; x += 40) {
    ctx.beginPath();
    ctx.moveTo(300, horizon);
    ctx.lineTo(x, 600);
    ctx.stroke();
  }

  // Glowing Cyber Sun / Orb at horizon
  const sunGrad = ctx.createRadialGradient(300, horizon - 20, 20, 300, horizon - 20, 140);
  sunGrad.addColorStop(0, '#f43f5e');
  sunGrad.addColorStop(0.4, '#d946ef');
  sunGrad.addColorStop(0.8, 'rgba(6, 182, 212, 0.4)');
  sunGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(300, horizon - 20, 140, 0, Math.PI * 2);
  ctx.fill();

  // Cyberpunk HUD Glitch Polygons / Triangles
  for (let i = 0; i < 6; i++) {
    const px = 100 + Math.random() * 400;
    const py = 60 + Math.random() * 260;
    const size = 30 + Math.random() * 70;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate((Math.PI / 4) * (i % 4));
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(6, 182, 212, 0.7)' : 'rgba(244, 63, 94, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-size / 2, -size / 2, size, size);
    ctx.restore();
  }

  // Horizontal scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  for (let y = 0; y < 600; y += 4) {
    ctx.fillRect(0, y, 600, 1.5);
  }
}

// 3. NATURE ORGANIC
function renderNatureArt(ctx: CanvasRenderingContext2D) {
  const naturePalettes = [
    ['#062c1b', '#0c4a2e', '#1b7a4b', '#48bb78', '#9ae6b4', '#fefcbf'],
    ['#081c15', '#1b4332', '#2d6a4f', '#52b788', '#74c69d', '#b7e4c7'],
    ['#1c2826', '#2b4141', '#476a6f', '#7798ab', '#c3d6df', '#f0f5f9'],
    ['#2d2327', '#463738', '#5b594b', '#808269', '#a0a083', '#d9dbbc'],
  ];
  const pal = naturePalettes[Math.floor(Math.random() * naturePalettes.length)];

  // Sky / Deep gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 600);
  bgGrad.addColorStop(0, pal[0]);
  bgGrad.addColorStop(0.5, pal[1]);
  bgGrad.addColorStop(1, pal[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 600, 600);

  // Soft glowing atmospheric mist
  const mist = ctx.createRadialGradient(300, 200, 40, 300, 200, 250);
  mist.addColorStop(0, pal[5] + '55');
  mist.addColorStop(0.7, pal[4] + '22');
  mist.addColorStop(1, 'transparent');
  ctx.fillStyle = mist;
  ctx.beginPath();
  ctx.arc(300, 200, 250, 0, Math.PI * 2);
  ctx.fill();

  // Layered mountain / topographic organic wave contours
  const layers = 5;
  for (let l = 0; l < layers; l++) {
    const baseHeight = 220 + l * 75;
    ctx.beginPath();
    ctx.moveTo(0, 600);
    ctx.lineTo(0, baseHeight);

    const freq = 0.005 + l * 0.002;
    const amp = 35 + l * 15;
    const phase = l * 1.5;

    for (let x = 0; x <= 600; x += 10) {
      const y = baseHeight + Math.sin(x * freq + phase) * amp + Math.cos(x * 0.003) * 15;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(600, 600);
    ctx.closePath();

    const layerGrad = ctx.createLinearGradient(0, baseHeight - 40, 0, 600);
    layerGrad.addColorStop(0, pal[l % pal.length]);
    layerGrad.addColorStop(1, pal[0]);
    ctx.fillStyle = layerGrad;
    ctx.fill();

    // Subtle edge highlight
    ctx.strokeStyle = pal[(l + 2) % pal.length] + '66';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// 4. SYNTHWAVE / RETRO HORIZON
function renderSynthwaveArt(ctx: CanvasRenderingContext2D) {
  // Deep purple/magenta sunset sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 380);
  skyGrad.addColorStop(0, '#0a0017');
  skyGrad.addColorStop(0.4, '#240046');
  skyGrad.addColorStop(0.7, '#7209b7');
  skyGrad.addColorStop(1, '#f72585');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 600, 380);

  // Giant Retro Sun
  const sunGrad = ctx.createLinearGradient(0, 160, 0, 380);
  sunGrad.addColorStop(0, '#fee440');
  sunGrad.addColorStop(0.5, '#ff007f');
  sunGrad.addColorStop(1, '#7209b7');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(300, 270, 110, 0, Math.PI * 2);
  ctx.fill();

  // Horizontal blind cutouts in sun
  ctx.fillStyle = '#10002b';
  for (let i = 0; i < 7; i++) {
    const cutY = 270 + i * 14;
    const cutH = 2 + i * 1.5;
    ctx.fillRect(180, cutY, 240, cutH);
  }

  // Dark Grid Ground
  const groundGrad = ctx.createLinearGradient(0, 380, 0, 600);
  groundGrad.addColorStop(0, '#10002b');
  groundGrad.addColorStop(1, '#03071e');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, 380, 600, 220);

  // Neon Grid on ground
  ctx.strokeStyle = '#4cc9f0';
  ctx.lineWidth = 1.2;
  for (let y = 380; y <= 600; y += Math.pow((y - 380) / 220, 2) * 45 + 10) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(600, y);
    ctx.stroke();
  }
  for (let x = -100; x <= 700; x += 45) {
    ctx.beginPath();
    ctx.moveTo(300, 380);
    ctx.lineTo(x, 600);
    ctx.stroke();
  }

  // Distant Mountain Silhouettes on Horizon
  ctx.fillStyle = '#15002a';
  ctx.beginPath();
  ctx.moveTo(0, 380);
  ctx.lineTo(70, 330);
  ctx.lineTo(150, 370);
  ctx.lineTo(240, 320);
  ctx.lineTo(300, 350);
  ctx.lineTo(370, 310);
  ctx.lineTo(460, 360);
  ctx.lineTo(540, 325);
  ctx.lineTo(600, 380);
  ctx.closePath();
  ctx.fill();
}

// 5. CELESTIAL COSMOS
function renderCelestialArt(ctx: CanvasRenderingContext2D) {
  // Deep space background
  const spaceGrad = ctx.createRadialGradient(300, 300, 30, 300, 300, 420);
  spaceGrad.addColorStop(0, '#13112c');
  spaceGrad.addColorStop(0.5, '#090814');
  spaceGrad.addColorStop(1, '#020108');
  ctx.fillStyle = spaceGrad;
  ctx.fillRect(0, 0, 600, 600);

  // Colorful Nebula Dust Clouds
  const nebulaColors = ['#9333ea', '#3b82f6', '#ec4899', '#06b6d4'];
  for (let n = 0; n < 4; n++) {
    const cx = 120 + Math.random() * 360;
    const cy = 120 + Math.random() * 360;
    const rad = 160 + Math.random() * 160;
    const nebGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rad);
    nebGrad.addColorStop(0, nebulaColors[n] + '40');
    nebGrad.addColorStop(0.5, nebulaColors[n] + '15');
    nebGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = nebGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glowing Celestial Planet
  const px = 300;
  const py = 300;
  const pr = 90;
  const planetGrad = ctx.createRadialGradient(px - 30, py - 30, 10, px, py, pr);
  planetGrad.addColorStop(0, '#f1f5f9');
  planetGrad.addColorStop(0.3, '#cbd5e1');
  planetGrad.addColorStop(0.7, '#475569');
  planetGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = planetGrad;
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.fill();

  // Planet Ring
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(-Math.PI / 6);
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 160, 35, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Distant stars / sparkles
  ctx.fillStyle = '#ffffff';
  for (let s = 0; s < 70; s++) {
    const sx = Math.random() * 600;
    const sy = Math.random() * 600;
    const size = Math.random() * 2 + 0.5;
    ctx.globalAlpha = Math.random() * 0.8 + 0.2;
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
}

// 6. BAUHAUS / MINIMALIST GEOMETRIC
function renderMinimalistArt(ctx: CanvasRenderingContext2D) {
  const palettes = [
    ['#f4f1de', '#e07a5f', '#3d405b', '#81b29a', '#f2cc8f'],
    ['#e9ecef', '#212529', '#e63946', '#457b9d', '#1d3557'],
    ['#fdf0d5', '#003049', '#d62828', '#f77f00', '#fcbf49'],
  ];
  const pal = palettes[Math.floor(Math.random() * palettes.length)];

  // Clean paper canvas background
  ctx.fillStyle = pal[0];
  ctx.fillRect(0, 0, 600, 600);

  // Big geometric semicircle / circle
  ctx.fillStyle = pal[1];
  ctx.beginPath();
  ctx.arc(300, 300, 170, 0, Math.PI);
  ctx.fill();

  // Complementary full circle
  ctx.fillStyle = pal[2];
  ctx.beginPath();
  ctx.arc(300, 230, 90, 0, Math.PI * 2);
  ctx.fill();

  // Dynamic diagonal slab
  ctx.fillStyle = pal[3];
  ctx.beginPath();
  ctx.moveTo(80, 500);
  ctx.lineTo(240, 500);
  ctx.lineTo(440, 160);
  ctx.lineTo(280, 160);
  ctx.closePath();
  ctx.fill();

  // Minimalist black accent lines
  ctx.strokeStyle = pal[4] || '#111';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(300, 300, 210, Math.PI * 0.2, Math.PI * 1.1);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(80, 540);
  ctx.lineTo(520, 540);
  ctx.stroke();
}
