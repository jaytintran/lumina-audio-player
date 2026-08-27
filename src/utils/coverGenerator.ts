// Generates random abstract art album cover with waves, geometric lines, fluid gradients and noise
export function generateRandomCoverBlob(title = 'Audio Track', artist = 'Artist'): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(new Blob());
      return;
    }

    const palettes = [
      ['#0f172a', '#1e1b4b', '#4338ca', '#38bdf8'],
      ['#022c22', '#064e3b', '#059669', '#34d399'],
      ['#18181b', '#3b0764', '#7e22ce', '#c084fc'],
      ['#1c1917', '#451a03', '#b45309', '#fbbf24'],
      ['#09090b', '#1e293b', '#0ea5e9', '#06b6d4'],
      ['#1a051d', '#581c87', '#db2777', '#f43f5e'],
      ['#0b132b', '#1c2541', '#3a506b', '#5bc0be'],
      ['#10002b', '#240046', '#5a189a', '#9d4edd'],
      ['#03071e', '#370617', '#9d0208', '#dc2f02'],
    ];

    const chosenPalette = palettes[Math.floor(Math.random() * palettes.length)];
    const bg1 = chosenPalette[0];
    const bg2 = chosenPalette[1];
    const accent1 = chosenPalette[2];
    const accent2 = chosenPalette[3];

    // 1. Diagonal Mesh / Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 600, 600);
    bgGrad.addColorStop(0, bg1);
    bgGrad.addColorStop(1, bg2);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 600, 600);

    // 2. Glowing atmospheric orbs
    for (let i = 0; i < 3; i++) {
      const cx = 100 + Math.random() * 400;
      const cy = 100 + Math.random() * 400;
      const radius = 150 + Math.random() * 150;
      const orbGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
      orbGrad.addColorStop(0, i % 2 === 0 ? accent1 + '66' : accent2 + '55');
      orbGrad.addColorStop(0.6, i % 2 === 0 ? accent1 + '22' : accent2 + '11');
      orbGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Abstract generative wave ribbons / sine lines
    const waveCount = 4 + Math.floor(Math.random() * 4);
    for (let w = 0; w < waveCount; w++) {
      ctx.beginPath();
      const waveY = 120 + (w * 400) / waveCount;
      const freq = 0.005 + Math.random() * 0.008;
      const amp = 30 + Math.random() * 50;
      const phase = Math.random() * Math.PI * 2;

      ctx.moveTo(0, waveY + Math.sin(phase) * amp);
      for (let x = 0; x <= 600; x += 10) {
        const y = waveY + Math.sin(x * freq + phase) * amp + Math.cos(x * 0.002) * 20;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = w % 2 === 0 ? accent2 + 'bb' : accent1 + '99';
      ctx.lineWidth = 1.5 + Math.random() * 2.5;
      ctx.stroke();
    }

    // 4. Geometric concentric arcs / techno-accents
    const centerArcX = 150 + Math.random() * 300;
    const centerArcY = 150 + Math.random() * 300;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    for (let r = 50; r < 240; r += 24) {
      ctx.beginPath();
      const startAngle = Math.random() * Math.PI;
      ctx.arc(centerArcX, centerArcY, r, startAngle, startAngle + Math.PI * (0.8 + Math.random() * 0.8));
      ctx.stroke();
    }

    // 5. Minimalist Typography Overlay Badge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 460, 600, 140);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title.length > 28 ? title.slice(0, 26) + '...' : title, 40, 520);

    ctx.fillStyle = accent2;
    ctx.font = '600 15px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(artist.toUpperCase(), 40, 555);

    // Accent line at bottom
    ctx.fillStyle = accent2;
    ctx.fillRect(40, 570, 48, 3);

    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, 'image/jpeg', 0.92);
  });
}
