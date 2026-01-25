
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { VisualizerType, VisualizerTheme } from '../types';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  color: string;
  type: VisualizerType;
  theme?: VisualizerTheme;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyser, color, type, theme = 'default' }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const getThemeColor = (d: number) => {
    switch (theme) {
      case 'ocean':
        return d3.interpolateBlues(0.3 + (d / 255) * 0.7);
      case 'fire':
        return d3.interpolateYlOrRd(0.4 + (d / 255) * 0.6);
      case 'neon':
        return d3.interpolateMagma(0.5 + (d / 255) * 0.5);
      default:
        return color;
    }
  };

  useEffect(() => {
    if (!svgRef.current || !analyser) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationId: number;

    const renderFrame = () => {
      animationId = requestAnimationFrame(renderFrame);
      analyser.getByteFrequencyData(dataArray);

      if (type === 'bars') {
        const barCount = 48;
        const barWidth = (width / barCount);
        const bars = svg.selectAll('rect').data(Array.from(dataArray.slice(0, barCount)));
        
        bars.enter()
          .append('rect')
          .merge(bars as any)
          .attr('x', (d, i) => i * barWidth)
          .attr('y', d => height - (d / 255) * height)
          .attr('width', barWidth - 4)
          .attr('height', d => (d / 255) * height)
          .attr('fill', d => getThemeColor(d))
          .attr('opacity', d => 0.4 + (d / 255) * 0.6)
          .attr('rx', 4);
        bars.exit().remove();
      } 
      else if (type === 'circle') {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 4;
        const barCount = 64;
        
        const bars = svg.selectAll('rect').data(Array.from(dataArray.slice(0, barCount)));
        
        bars.enter()
          .append('rect')
          .merge(bars as any)
          .attr('transform', (d, i) => {
            const angle = (i / barCount) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            const rotation = (angle * 180) / Math.PI;
            return `translate(${x},${y}) rotate(${rotation})`;
          })
          .attr('width', 3)
          .attr('height', d => (d / 255) * 40)
          .attr('fill', d => getThemeColor(d))
          .attr('opacity', d => 0.5 + (d / 255) * 0.5)
          .attr('rx', 2);
        bars.exit().remove();
      }
      else if (type === 'wave') {
        const points = Array.from(dataArray.slice(0, 100)).map((d, i) => [
          (i / 100) * width,
          height / 2 + (d / 255 - 0.5) * height * 0.8
        ]);

        const line = d3.line().curve(d3.curveBasis);
        
        svg.selectAll('path').remove();
        svg.append('path')
          .attr('d', line(points as any))
          .attr('fill', 'none')
          .attr('stroke', theme === 'default' ? color : getThemeColor(150))
          .attr('stroke-width', 3)
          .attr('opacity', 0.8);
      }
    };

    renderFrame();
    return () => cancelAnimationFrame(animationId);
  }, [analyser, color, type, theme]);

  return (
    <div className="w-full h-32 mt-6 overflow-hidden rounded-2xl bg-white/5 border border-white/5">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default Visualizer;
