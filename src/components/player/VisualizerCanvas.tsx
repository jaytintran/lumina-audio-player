import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../../services/audioEngine';
import { usePlayerStore } from '../../stores/playerStore';

interface VisualizerCanvasProps {
  className?: string;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { isPlaying, visualizerMode } = usePlayerStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const binCount = audioEngine.getAnalyserFrequencyBinCount();
    const freqData = new Uint8Array(binCount);
    const waveData = new Uint8Array(binCount);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);

      // Handle high-DPI scaling
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      if (!isPlaying) {
        // Draw idle subtle breathing line
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        return;
      }

      if (visualizerMode === 'bars') {
        audioEngine.getFrequencyData(freqData);
        const barCount = Math.min(64, binCount);
        const gap = 3;
        const totalGap = gap * (barCount - 1);
        const barWidth = Math.max(2, (width - totalGap) / barCount);

        for (let i = 0; i < barCount; i++) {
          const value = freqData[i];
          const percent = value / 255;
          const barHeight = Math.max(4, percent * height * 0.9);
          const x = i * (barWidth + gap);
          const y = height - barHeight;

          // Gradient for bar
          const gradient = ctx.createLinearGradient(0, height, 0, y);
          gradient.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
          gradient.addColorStop(0.6, 'rgba(6, 182, 212, 0.8)');
          gradient.addColorStop(1, 'rgba(168, 85, 247, 0.95)');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
          ctx.fill();

          // Glowing peak dot
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, Math.max(0, y - 2), barWidth, 2);
        }
      } else if (visualizerMode === 'wave') {
        audioEngine.getWaveformData(waveData);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        const sliceWidth = width / binCount;
        let x = 0;

        for (let i = 0; i < binCount; i++) {
          const v = waveData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow
      } else if (visualizerMode === 'circle') {
        audioEngine.getFrequencyData(freqData);
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) * 0.55;
        const barCount = 64;

        ctx.save();
        ctx.translate(centerX, centerY);

        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2;
          const value = freqData[i] || 0;
          const barLength = Math.max(4, (value / 255) * radius * 0.8);

          const x1 = Math.cos(angle) * radius;
          const y1 = Math.sin(angle) * radius;
          const x2 = Math.cos(angle) * (radius + barLength);
          const y2 = Math.sin(angle) * (radius + barLength);

          const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
          gradient.addColorStop(0, '#06b6d4');
          gradient.addColorStop(1, '#a855f7');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        ctx.restore();
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, visualizerMode]);

  return <canvas ref={canvasRef} className={`w-full h-full block ${className}`} />;
};
