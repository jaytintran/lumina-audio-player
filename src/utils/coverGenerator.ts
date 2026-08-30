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

// ----------------------------------------------------
// 1. ABSTRACT FLOW (Ribbons, Waves, Fluid Orbs, Fields)
// ----------------------------------------------------
function renderAbstractArt(ctx: CanvasRenderingContext2D) {
  const palettes = [
    ['#0b132b', '#1c2541', '#3a506b', '#5bc0be', '#6fffe9'],
    ['#1a051d', '#581c87', '#9333ea', '#ec4899', '#f43f5e'],
    ['#022c22', '#064e3b', '#059669', '#10b981', '#34d399'],
    ['#18181b', '#3b0764', '#7e22ce', '#a855f7', '#c084fc'],
    ['#111827', '#1f2937', '#374151', '#f59e0b', '#fbbf24'],
    ['#08121e', '#0e2a47', '#1a5f7a', '#22c55e', '#a3e635'],
    ['#2b0938', '#5b1069', '#a21caf', '#e879f9', '#fdf4ff'],
  ];
  const pal = palettes[Math.floor(Math.random() * palettes.length)];

  // Background style variation
  const mode = Math.floor(Math.random() * 3);
  if (mode === 0) {
    const bgGrad = ctx.createLinearGradient(0, 0, 600, 600);
    bgGrad.addColorStop(0, pal[0]);
    bgGrad.addColorStop(0.5, pal[1]);
    bgGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGrad;
  } else if (mode === 1) {
    const bgGrad = ctx.createRadialGradient(300, 300, 40, 300, 300, 420);
    bgGrad.addColorStop(0, pal[1]);
    bgGrad.addColorStop(0.7, pal[0]);
    bgGrad.addColorStop(1, '#020305');
    ctx.fillStyle = bgGrad;
  } else {
    const bgGrad = ctx.createLinearGradient(600, 0, 0, 600);
    bgGrad.addColorStop(0, pal[0]);
    bgGrad.addColorStop(0.6, pal[2]);
    bgGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGrad;
  }
  ctx.fillRect(0, 0, 600, 600);

  // Floating atmospheric orbs
  const orbCount = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < orbCount; i++) {
    const cx = 60 + Math.random() * 480;
    const cy = 60 + Math.random() * 480;
    const radius = 140 + Math.random() * 180;
    const orbGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
    const color = pal[(i % (pal.length - 2)) + 2];
    orbGrad.addColorStop(0, color + '77');
    orbGrad.addColorStop(0.6, color + '1a');
    orbGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Generative sine waves or flow curves
  const waveCount = 5 + Math.floor(Math.random() * 5);
  for (let w = 0; w < waveCount; w++) {
    ctx.beginPath();
    const waveY = 60 + (w * 480) / waveCount;
    const freq = 0.003 + Math.random() * 0.008;
    const amp = 35 + Math.random() * 65;
    const phase = Math.random() * Math.PI * 2;

    ctx.moveTo(0, waveY + Math.sin(phase) * amp);
    for (let x = 0; x <= 600; x += 6) {
      const y = waveY + Math.sin(x * freq + phase) * amp + Math.cos(x * 0.003 + phase) * 25;
      ctx.lineTo(x, y);
    }
    const color = pal[(w % (pal.length - 2)) + 2];
    ctx.strokeStyle = color + (w % 2 === 0 ? 'bb' : '88');
    ctx.lineWidth = 1.5 + (w % 3);
    ctx.stroke();
  }

  // Concentric abstract rings
  const arcX = 120 + Math.random() * 360;
  const arcY = 120 + Math.random() * 360;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  for (let r = 40; r < 300; r += 26) {
    ctx.beginPath();
    const startAngle = Math.random() * Math.PI;
    ctx.arc(arcX, arcY, r, startAngle, startAngle + Math.PI * (0.6 + Math.random() * 0.8));
    ctx.stroke();
  }
}

// ----------------------------------------------------
// 2. CYBERPUNK NEON (Megacity Grid, Hologram, Portal, Matrix)
// ----------------------------------------------------
function renderCyberpunkArt(ctx: CanvasRenderingContext2D) {
  const cyberpunkPalettes = [
    { bg1: '#070510', bg2: '#160824', neon1: '#f43f5e', neon2: '#06b6d4', neon3: '#e11d48', accent: '#a855f7' },
    { bg1: '#020d18', bg2: '#06283d', neon1: '#00f5d4', neon2: '#7b2cbf', neon3: '#f72585', accent: '#4cc9f0' },
    { bg1: '#09090b', bg2: '#1a0b2e', neon1: '#22c55e', neon2: '#06b6d4', neon3: '#eab308', accent: '#10b981' },
    { bg1: '#12001e', bg2: '#2a0845', neon1: '#ff007f', neon2: '#00f0ff', neon3: '#ffe600', accent: '#ff0055' },
  ];
  const pal = cyberpunkPalettes[Math.floor(Math.random() * cyberpunkPalettes.length)];

  // Dark futuristic background
  const bgGrad = ctx.createRadialGradient(300, 300, 50, 300, 300, 420);
  bgGrad.addColorStop(0, pal.bg2);
  bgGrad.addColorStop(0.7, pal.bg1);
  bgGrad.addColorStop(1, '#020106');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 600, 600);

  // 3 distinct composition layouts
  const layout = Math.floor(Math.random() * 3);

  if (layout === 0) {
    // Layout A: Horizon Grid Floor & Giant Cyber Orb
    const horizon = 260 + Math.random() * 100;
    ctx.strokeStyle = pal.neon1 + '44';
    ctx.lineWidth = 1;

    for (let y = horizon; y <= 600; y += Math.pow((y - horizon) / (600 - horizon), 2) * 50 + 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(600, y);
      ctx.stroke();
    }
    for (let x = -200; x <= 800; x += 36) {
      ctx.beginPath();
      ctx.moveTo(300, horizon);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }

    const sunGrad = ctx.createRadialGradient(300, horizon - 20, 20, 300, horizon - 20, 130);
    sunGrad.addColorStop(0, pal.neon1);
    sunGrad.addColorStop(0.5, pal.neon3);
    sunGrad.addColorStop(0.8, pal.neon2 + '66');
    sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(300, horizon - 20, 130, 0, Math.PI * 2);
    ctx.fill();
  } else if (layout === 1) {
    // Layout B: Neon Megacity Cyber Shards & Isometric Pillars
    const pillarCount = 12 + Math.floor(Math.random() * 8);
    for (let i = 0; i < pillarCount; i++) {
      const px = 40 + (i * 540) / pillarCount + (Math.random() * 30 - 15);
      const py = 120 + Math.random() * 200;
      const pw = 24 + Math.random() * 32;
      const ph = 600 - py;

      const pGrad = ctx.createLinearGradient(px, py, px + pw, py);
      pGrad.addColorStop(0, pal.bg2);
      pGrad.addColorStop(0.5, i % 2 === 0 ? pal.neon1 + '33' : pal.neon2 + '33');
      pGrad.addColorStop(1, '#05020c');
      ctx.fillStyle = pGrad;
      ctx.fillRect(px, py, pw, ph);

      // Neon rooftop highlight
      ctx.strokeStyle = i % 2 === 0 ? pal.neon1 : pal.neon2;
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, pw, 2);
    }
  } else {
    // Layout C: Cyber Portal Tunnel / Hexagon Vortex
    const cx = 300;
    const cy = 300;
    const sides = Math.random() > 0.5 ? 6 : 8;
    for (let r = 30; r <= 320; r += 28) {
      ctx.beginPath();
      for (let s = 0; s <= sides; s++) {
        const angle = (s * 2 * Math.PI) / sides + (r * 0.005);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = r % 56 === 0 ? pal.neon1 + 'aa' : pal.neon2 + '55';
      ctx.lineWidth = r % 56 === 0 ? 2 : 1;
      ctx.stroke();
    }
  }

  // Cyberpunk HUD Glitch Polygons / Triangles & Crosshairs
  const glitchCount = 4 + Math.floor(Math.random() * 5);
  for (let i = 0; i < glitchCount; i++) {
    const px = 80 + Math.random() * 440;
    const py = 60 + Math.random() * 440;
    const size = 20 + Math.random() * 60;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate((Math.PI / 4) * (i % 4));
    ctx.strokeStyle = i % 2 === 0 ? pal.neon2 + 'aa' : pal.neon1 + 'aa';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-size / 2, -size / 2, size, size);

    // Crosshair ticks
    ctx.beginPath();
    ctx.moveTo(-size / 2 - 6, 0);
    ctx.lineTo(-size / 2 + 6, 0);
    ctx.moveTo(size / 2 - 6, 0);
    ctx.lineTo(size / 2 + 6, 0);
    ctx.stroke();
    ctx.restore();
  }

  // Scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  for (let y = 0; y < 600; y += 4) {
    ctx.fillRect(0, y, 600, 1.5);
  }
}

// ----------------------------------------------------
// 3. NATURE ORGANIC (Forest Ridge, Zen Dunes, Canyon River, Biome)
// ----------------------------------------------------
function renderNatureArt(ctx: CanvasRenderingContext2D) {
  const naturePalettes = [
    // Pine Forest Emerald
    ['#041f14', '#064e3b', '#059669', '#10b981', '#34d399', '#a7f3d0'],
    // Autumn Sunset Earth
    ['#1c1917', '#451a03', '#9a3412', '#ea580c', '#f97316', '#fed7aa'],
    // Ocean Deep & Seafoam
    ['#082f49', '#075985', '#0284c7', '#0ea5e9', '#38bdf8', '#bae6fd'],
    // Nordic Glacial Blue
    ['#0f172a', '#1e293b', '#334155', '#475569', '#94a3b8', '#e2e8f0'],
    // Desert Terracotta Dunes
    ['#27130e', '#532115', '#8a3c26', '#c45a33', '#e08354', '#f6c3a3'],
    // Mystic Rainforest Moss
    ['#0b291a', '#164e33', '#2d6a4f', '#52b788', '#95d5b2', '#d8f3dc'],
  ];
  const pal = naturePalettes[Math.floor(Math.random() * naturePalettes.length)];

  // Sky Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 600);
  bgGrad.addColorStop(0, pal[0]);
  bgGrad.addColorStop(0.5, pal[1]);
  bgGrad.addColorStop(1, pal[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 600, 600);

  // Soft atmospheric moon / sun / mist
  const sunX = 150 + Math.random() * 300;
  const sunY = 120 + Math.random() * 120;
  const sunR = 80 + Math.random() * 90;
  const mist = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunR * 2.2);
  mist.addColorStop(0, pal[5] + '88');
  mist.addColorStop(0.4, pal[4] + '33');
  mist.addColorStop(1, 'transparent');
  ctx.fillStyle = mist;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Natural sun / moon disc
  const sunCore = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
  sunCore.addColorStop(0, pal[5]);
  sunCore.addColorStop(0.8, pal[4]);
  sunCore.addColorStop(1, pal[3] + '00');
  ctx.fillStyle = sunCore;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Varied Landscape Style (Ridge Hills / Dune Waves / Topo Isoclines)
  const terrainType = Math.floor(Math.random() * 3);
  const layers = 5 + Math.floor(Math.random() * 2);

  if (terrainType === 0) {
    // Ridge Hills with variable frequencies
    for (let l = 0; l < layers; l++) {
      const baseHeight = 160 + (l * 400) / layers;
      ctx.beginPath();
      ctx.moveTo(0, 600);
      ctx.lineTo(0, baseHeight);

      const freq = 0.003 + l * 0.0018 + Math.random() * 0.002;
      const amp = 30 + l * 16;
      const phase = l * 1.7 + Math.random() * 0.5;

      for (let x = 0; x <= 600; x += 8) {
        const y = baseHeight + Math.sin(x * freq + phase) * amp + Math.cos(x * 0.002 + phase) * 18;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(600, 600);
      ctx.closePath();

      const layerGrad = ctx.createLinearGradient(0, baseHeight - 40, 0, 600);
      layerGrad.addColorStop(0, pal[l % pal.length]);
      layerGrad.addColorStop(1, pal[0]);
      ctx.fillStyle = layerGrad;
      ctx.fill();

      ctx.strokeStyle = pal[(l + 2) % pal.length] + '55';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  } else if (terrainType === 1) {
    // Flowing Sand Dunes / Wind Streamlines
    for (let l = 0; l < layers; l++) {
      const startY = 120 + l * 75;
      const endY = startY + (l % 2 === 0 ? 80 : -60);
      ctx.beginPath();
      ctx.moveTo(0, 600);
      ctx.lineTo(0, startY);
      ctx.bezierCurveTo(
        200,
        startY + (l % 2 === 0 ? 120 : -90),
        400,
        endY + (l % 2 === 0 ? -90 : 120),
        600,
        endY
      );
      ctx.lineTo(600, 600);
      ctx.closePath();

      const duneGrad = ctx.createLinearGradient(0, startY - 20, 600, 600);
      duneGrad.addColorStop(0, pal[(l + 1) % pal.length]);
      duneGrad.addColorStop(1, pal[0]);
      ctx.fillStyle = duneGrad;
      ctx.fill();
    }
  } else {
    // Topographical Contour Lines (Isomap)
    for (let l = 0; l < layers; l++) {
      const baseHeight = 180 + (l * 380) / layers;
      ctx.beginPath();
      ctx.moveTo(0, 600);
      ctx.lineTo(0, baseHeight);
      for (let x = 0; x <= 600; x += 10) {
        const y = baseHeight + Math.sin(x * 0.006 + l) * 40 + Math.cos(x * 0.012 - l) * 20;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(600, 600);
      ctx.closePath();
      ctx.fillStyle = pal[l % pal.length];
      ctx.fill();
      ctx.strokeStyle = pal[(l + 1) % pal.length] + '88';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

// ----------------------------------------------------
// 4. SYNTHWAVE / RETRO (Neon Sun, Gridwave, Vector Peaks, Torus)
// ----------------------------------------------------
function renderSynthwaveArt(ctx: CanvasRenderingContext2D) {
  const synthPalettes = [
    { sky1: '#0a0017', sky2: '#240046', sky3: '#7209b7', sun1: '#fee440', sun2: '#ff007f', grid: '#4cc9f0' },
    { sky1: '#03071e', sky2: '#370617', sky3: '#9d0208', sun1: '#ffba08', sun2: '#e85d04', grid: '#f48c06' },
    { sky1: '#050c1a', sky2: '#0b2545', sky3: '#134074', sun1: '#8ecae6', sun2: '#219ebc', grid: '#00f5d4' },
    { sky1: '#1b003a', sky2: '#4a0e4e', sky3: '#8c1d40', sun1: '#ff9e00', sun2: '#ff0054', grid: '#9d4edd' },
  ];
  const pal = synthPalettes[Math.floor(Math.random() * synthPalettes.length)];

  // Sky Gradient
  const horizon = 340 + (Math.random() * 60 - 30);
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
  skyGrad.addColorStop(0, pal.sky1);
  skyGrad.addColorStop(0.5, pal.sky2);
  skyGrad.addColorStop(1, pal.sky3);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 600, horizon);

  // Giant Retro Sun with randomized size and offset
  const sunX = 220 + Math.random() * 160;
  const sunY = horizon - 90;
  const sunRadius = 90 + Math.random() * 35;

  const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
  sunGrad.addColorStop(0, pal.sun1);
  sunGrad.addColorStop(0.6, pal.sun2);
  sunGrad.addColorStop(1, pal.sky3);
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fill();

  // Horizontal blind cutouts across the sun
  const cutCount = 5 + Math.floor(Math.random() * 4);
  ctx.fillStyle = pal.sky1;
  for (let i = 0; i < cutCount; i++) {
    const cutY = sunY - 10 + i * (sunRadius / cutCount);
    const cutH = 2 + i * 1.4;
    ctx.fillRect(sunX - sunRadius - 10, cutY, sunRadius * 2 + 20, cutH);
  }

  // Mountain wireframe peaks on horizon
  const hasMountains = Math.random() > 0.3;
  if (hasMountains) {
    ctx.fillStyle = pal.sky2;
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    let curX = 0;
    while (curX < 600) {
      const nextX = curX + 50 + Math.random() * 60;
      const peakY = horizon - (40 + Math.random() * 70);
      ctx.lineTo(curX + (nextX - curX) / 2, peakY);
      ctx.lineTo(nextX, horizon);
      curX = nextX;
    }
    ctx.closePath();
    ctx.fill();
  }

  // Dark Grid Ground
  const groundGrad = ctx.createLinearGradient(0, horizon, 0, 600);
  groundGrad.addColorStop(0, pal.sky1);
  groundGrad.addColorStop(1, '#020108');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, horizon, 600, 600 - horizon);

  // Perspective 3D Grid on ground
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 1.2;
  for (let y = horizon; y <= 600; y += Math.pow((y - horizon) / (600 - horizon), 2) * 55 + 10) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(600, y);
    ctx.stroke();
  }
  const vanishingX = sunX;
  for (let x = -150; x <= 750; x += 40) {
    ctx.beginPath();
    ctx.moveTo(vanishingX, horizon);
    ctx.lineTo(x, 600);
    ctx.stroke();
  }
}

// ----------------------------------------------------
// 5. CELESTIAL COSMOS (Ringed Worlds, Black Holes, Deep Galaxies, Solar Eclipse)
// ----------------------------------------------------
function renderCelestialArt(ctx: CanvasRenderingContext2D) {
  const celestialModes = ['planet_ring', 'eclipse', 'deep_galaxy'];
  const mode = celestialModes[Math.floor(Math.random() * celestialModes.length)];

  // Deep space background
  const spaceGrad = ctx.createRadialGradient(300, 300, 20, 300, 300, 440);
  spaceGrad.addColorStop(0, '#100e26');
  spaceGrad.addColorStop(0.6, '#060510');
  spaceGrad.addColorStop(1, '#010005');
  ctx.fillStyle = spaceGrad;
  ctx.fillRect(0, 0, 600, 600);

  // Multi-color Nebula Dust Clouds
  const nebulaThemes = [
    ['#9333ea', '#3b82f6', '#ec4899', '#06b6d4'],
    ['#e11d48', '#f59e0b', '#7c3aed', '#38bdf8'],
    ['#10b981', '#06b6d4', '#6366f1', '#a855f7'],
  ];
  const nebColors = nebulaThemes[Math.floor(Math.random() * nebulaThemes.length)];

  for (let n = 0; n < 4; n++) {
    const cx = 80 + Math.random() * 440;
    const cy = 80 + Math.random() * 440;
    const rad = 140 + Math.random() * 180;
    const nebGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rad);
    nebGrad.addColorStop(0, nebColors[n] + '44');
    nebGrad.addColorStop(0.5, nebColors[n] + '14');
    nebGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = nebGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Twinkling stars
  ctx.fillStyle = '#ffffff';
  for (let s = 0; s < 90; s++) {
    const sx = Math.random() * 600;
    const sy = Math.random() * 600;
    const size = Math.random() * 2 + 0.4;
    ctx.globalAlpha = Math.random() * 0.8 + 0.2;
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  if (mode === 'planet_ring') {
    // Ringed Giant Planet
    const px = 200 + Math.random() * 200;
    const py = 200 + Math.random() * 200;
    const pr = 70 + Math.random() * 40;

    const planetGrad = ctx.createRadialGradient(px - pr * 0.35, py - pr * 0.35, 10, px, py, pr);
    planetGrad.addColorStop(0, '#f8fafc');
    planetGrad.addColorStop(0.3, '#94a3b8');
    planetGrad.addColorStop(0.7, '#334155');
    planetGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();

    // Planet Rings (Tilted)
    const tilt = -Math.PI / (3 + Math.random() * 4);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(tilt);
    for (let r = pr * 1.3; r <= pr * 2.1; r += 12) {
      ctx.strokeStyle = 'rgba(226, 232, 240, ' + (0.35 - (r - pr * 1.3) * 0.003) + ')';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.24, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  } else if (mode === 'eclipse') {
    // Solar Eclipse Corona
    const ex = 300;
    const ey = 300;
    const er = 100 + Math.random() * 30;

    // Glowing Corona
    const corona = ctx.createRadialGradient(ex, ey, er - 10, ex, ey, er * 2.2);
    corona.addColorStop(0, '#ffffff');
    corona.addColorStop(0.2, '#fde047');
    corona.addColorStop(0.5, '#f97316');
    corona.addColorStop(0.8, '#8b5cf6');
    corona.addColorStop(1, 'transparent');
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(ex, ey, er * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Black Eclipse Moon Center
    ctx.fillStyle = '#05030a';
    ctx.beginPath();
    ctx.arc(ex, ey, er, 0, Math.PI * 2);
    ctx.fill();

    // Diamond Ring flare
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex + er * 0.7, ey - er * 0.7, 12, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Spiral Galaxy Core
    const gx = 300;
    const gy = 300;
    const arms = 2 + Math.floor(Math.random() * 2);
    for (let a = 0; a < arms; a++) {
      const armOffset = (a * 2 * Math.PI) / arms;
      ctx.beginPath();
      for (let theta = 0; theta < 4 * Math.PI; theta += 0.1) {
        const r = 5 * Math.exp(0.3 * theta);
        if (r > 280) break;
        const x = gx + r * Math.cos(theta + armOffset);
        const y = gy + r * Math.sin(theta + armOffset);
        if (theta === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = nebColors[a % nebColors.length] + '77';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    const coreGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, 60);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.4, nebColors[0]);
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(gx, gy, 60, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ----------------------------------------------------
// 6. BAUHAUS / MINIMALIST (Geometric Blocks, Semicircles, Swiss Grid, Mondrian)
// ----------------------------------------------------
function renderMinimalistArt(ctx: CanvasRenderingContext2D) {
  const palettes = [
    ['#f4f1de', '#e07a5f', '#3d405b', '#81b29a', '#f2cc8f'],
    ['#f8f9fa', '#212529', '#e63946', '#457b9d', '#1d3557'],
    ['#fdf0d5', '#003049', '#d62828', '#f77f00', '#fcbf49'],
    ['#ede0d4', '#7f5539', '#9c6644', '#b08968', '#ddb892'],
    ['#e0fbfc', '#3d5a80', '#98c1d9', '#ee6c4d', '#293241'],
    ['#1a1a24', '#ff4365', '#00d9c0', '#ffffff', '#000000'],
  ];
  const pal = palettes[Math.floor(Math.random() * palettes.length)];

  // Clean paper canvas background
  ctx.fillStyle = pal[0];
  ctx.fillRect(0, 0, 600, 600);

  const compType = Math.floor(Math.random() * 4);

  if (compType === 0) {
    // Composition 1: Bauhaus Semicircle & Dynamic Diagonal Slabs
    const cx = 150 + Math.random() * 300;
    const cy = 150 + Math.random() * 300;
    const cr = 120 + Math.random() * 80;

    ctx.fillStyle = pal[1];
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * (Math.random() > 0.5 ? 1 : 2));
    ctx.fill();

    ctx.fillStyle = pal[2];
    ctx.beginPath();
    ctx.arc(600 - cx, 600 - cy, cr * 0.65, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = pal[3];
    ctx.beginPath();
    ctx.moveTo(60, 520);
    ctx.lineTo(240, 520);
    ctx.lineTo(480, 100);
    ctx.lineTo(300, 100);
    ctx.closePath();
    ctx.fill();
  } else if (compType === 1) {
    // Composition 2: Swiss Modular Color Blocks & Negative Space
    const gridCols = 3;
    const gridRows = 3;
    const cellW = 600 / gridCols;
    const cellH = 600 / gridRows;

    for (let gx = 0; gx < gridCols; gx++) {
      for (let gy = 0; gy < gridRows; gy++) {
        if (Math.random() > 0.4) {
          ctx.fillStyle = pal[(gx + gy + 1) % pal.length];
          const shape = Math.floor(Math.random() * 3);
          const px = gx * cellW;
          const py = gy * cellH;

          if (shape === 0) {
            ctx.fillRect(px + 10, py + 10, cellW - 20, cellH - 20);
          } else if (shape === 1) {
            ctx.beginPath();
            ctx.arc(px + cellW / 2, py + cellH / 2, (cellW - 20) / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.moveTo(px + 10, py + cellH - 10);
            ctx.lineTo(px + cellW - 10, py + cellH - 10);
            ctx.lineTo(px + cellW / 2, py + 10);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
    }
  } else if (compType === 2) {
    // Composition 3: Concentric Geometric Arcs & Minimalist Rings
    const ax = 300;
    const ay = 300;
    for (let r = 50; r <= 260; r += 45) {
      ctx.fillStyle = pal[(r / 45) % pal.length];
      ctx.beginPath();
      const start = (r * 0.05) % Math.PI;
      ctx.arc(ax, ay, r, start, start + Math.PI);
      ctx.lineTo(ax, ay);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // Composition 4: Constructivist Geometry with Solid Triangles & Accent Pillars
    ctx.fillStyle = pal[1];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(400, 0);
    ctx.lineTo(0, 400);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = pal[2];
    ctx.beginPath();
    ctx.moveTo(600, 600);
    ctx.lineTo(200, 600);
    ctx.lineTo(600, 200);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = pal[3];
    ctx.beginPath();
    ctx.arc(300, 300, 110, 0, Math.PI * 2);
    ctx.fill();
  }

  // Precision minimalist line accents
  ctx.strokeStyle = pal[4] || '#111';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  const lineY = 100 + Math.random() * 400;
  ctx.moveTo(60, lineY);
  ctx.lineTo(540, lineY);
  ctx.stroke();
}

