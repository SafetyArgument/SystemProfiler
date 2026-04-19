import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { DeliverableNode, DeliverableLink } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Box, Gavel, ShieldCheck, Maximize, Image as ImageIcon } from 'lucide-react';

interface KnowledgeGraphProps {
  nodes: DeliverableNode[];
  links: DeliverableLink[];
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ nodes, links }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [hoveredNode, setHoveredNode] = useState<DeliverableNode | null>(null);
  const [hoveredLink, setHoveredLink] = useState<DeliverableLink | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const fitView = () => {
    if (!svgRef.current || !zoomRef.current || nodes.length === 0) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select('g');
    const bounds = (g.node() as SVGGElement).getBBox();
    const { width, height } = dimensions;
    
    const fullWidth = bounds.width;
    const fullHeight = bounds.height;
    const midX = bounds.x + fullWidth / 2;
    const midY = bounds.y + fullHeight / 2;
    
    if (fullWidth === 0 || fullHeight === 0) return;
    
    const padding = 40;
    const scale = Math.min(0.9, (width - padding) / fullWidth, (height - padding) / fullHeight);
    
    svg.transition().duration(750).call(
      zoomRef.current.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(scale)
        .translate(-midX, -midY)
    );
  };

  const exportAsPng = () => {
    if (!svgRef.current) return;
    
    const gElement = svgRef.current.querySelector('g');
    if (!gElement) return;
    
    // 1. Get the actual bounds of the entire graph content
    const bbox = gElement.getBBox();
    const padding = 60;
    const multiplier = 4;
    
    // 2. Define export dimensions based on content
    const width = (bbox.width + padding * 2) * multiplier;
    const height = (bbox.height + padding * 2) * multiplier;

    // 3. Create a clone to manipulate for light theme
    const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
    svgClone.setAttribute('width', width.toString());
    svgClone.setAttribute('height', height.toString());
    svgClone.setAttribute('viewBox', `0 0 ${width} ${height}`);
    
    // 4. Reset the transform of the main group to center content
    const gClone = svgClone.querySelector('g');
    if (gClone) {
      // Calculate centering translation
      const tx = (padding - bbox.x) * multiplier;
      const ty = (padding - bbox.y) * multiplier;
      gClone.setAttribute('transform', `translate(${tx}, ${ty}) scale(${multiplier})`);
    }

    // 5. Inject high-contrast light theme styles
    const styles = `
      svg { background: #ffffff; }
      rect { fill: #ffffff !important; stroke: #0f172a !important; stroke-width: 1px !important; }
      text { fill: #0f172a !important; font-family: 'Inter', sans-serif !important; font-weight: 800 !important; font-size: 11px !important; }
      line { stroke: #0f172a !important; stroke-opacity: 0.2 !important; stroke-width: 1px !important; }
    `;
    const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleElement.textContent = styles;
    svgClone.prepend(styleElement);

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL('image/png', 1.0);
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `System_Graph_Overview_${new Date().getTime()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    img.src = url;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    
    zoomRef.current = zoom;

    svg.call(zoom);
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.5));

    const simulation = d3.forceSimulation<any>(nodes)
      .force('link', d3.forceLink<any, any>(links).id(d => d.id).distance(130).strength(1))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide().radius(100))
      .force('x', d3.forceX(0).strength(0.15))
      .force('y', d3.forceY(0).strength(0.15));
    
    // Links
    const link = g.append('g')
      .selectAll<SVGLineElement, DeliverableLink>('line')
      .data(links)
      .join('line')
      .attr('stroke', 'var(--foreground)')
      .attr('stroke-width', 3)
      .attr('stroke-opacity', 0.1)
      .style('cursor', 'help')
      .on('mouseenter', (event, d: DeliverableLink) => setHoveredLink(d))
      .on('mouseleave', () => setHoveredLink(null));

    // Nodes
    const node = g.append('g')
      .selectAll<SVGGElement, DeliverableNode>('.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .call(d3.drag<SVGGElement, DeliverableNode>()
        .on('start', (event) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on('drag', (event) => {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on('end', (event) => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }))
      .on('mouseenter', (event, d: DeliverableNode) => setHoveredNode(d))
      .on('mouseleave', () => setHoveredNode(null));

    // Node shapes
    node.append('rect')
      .attr('width', (d: DeliverableNode) => Math.max(130, d.name.length * 8 + 20))
      .attr('height', 44)
      .attr('x', (d: DeliverableNode) => -Math.max(130, d.name.length * 8 + 20) / 2)
      .attr('y', -22)
      .attr('rx', 10)
      .attr('fill', 'var(--background)')
      .attr('stroke', 'var(--foreground)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', (d: DeliverableNode) => d.type === 'virtual' ? '4,4' : 'none')
      .style('filter', 'none');

    // Node labels
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', 'var(--foreground)')
      .text((d: DeliverableNode) => d.name);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Fit view after a delay to allow simulation to stabilize
    setTimeout(fitView, 2500);

  }, [nodes, links, dimensions]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-transparent overflow-hidden">
      <div className="absolute top-6 left-6 z-40 flex flex-col gap-2">
        <button
          onClick={fitView}
          className="p-2.5 bg-secondary hover:bg-background border border-border rounded-[10px] text-foreground/60 hover:text-foreground transition-all shadow-none"
          title="Fit View"
        >
          <Maximize size={18} strokeWidth={1.5} />
        </button>
        <button
          onClick={exportAsPng}
          className="p-2.5 bg-secondary hover:bg-background border border-border rounded-[10px] text-foreground/60 hover:text-foreground transition-all shadow-none"
          title="Export as PNG"
        >
          <ImageIcon size={18} strokeWidth={1.5} />
        </button>
      </div>
      <svg ref={svgRef} width="100%" height="100%" className="cursor-move" />

      {/* Node Info Overlay */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="absolute bottom-6 left-6 w-96 p-8 bg-background/80 backdrop-blur-md border border-border rounded-[10px] shadow-sm z-20"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-1.5 text-left">
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-primary uppercase tracking-[0.2em]">
                  <Box size={14} strokeWidth={1.5} /> {hoveredNode.type}
                </div>
                <h3 className="font-bold text-foreground tracking-tight text-xl leading-tight">
                  {hoveredNode.name}
                </h3>
              </div>
              <button onClick={() => setHoveredNode(null)} className="text-foreground/30 hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6 text-left">
              <p className="text-foreground/70 text-sm leading-relaxed">
                {hoveredNode.description}
              </p>
              
              <div className="p-5 bg-secondary/50 rounded-[10px] border border-border">
                <div className="text-xs text-foreground/60 leading-relaxed font-mono">
                  <span className="font-bold text-foreground uppercase tracking-widest block mb-2 text-[9px]">Regulatory Basis:</span>
                  {hoveredNode.regulatoryReferences.join(', ')}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Link Info Overlay */}
      <AnimatePresence>
        {hoveredLink && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            className="absolute top-6 right-6 w-96 p-8 bg-background/80 backdrop-blur-md border border-border rounded-[10px] shadow-sm z-30"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-1.5 text-left">
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-primary uppercase tracking-[0.2em]">
                  <ShieldCheck size={16} strokeWidth={1.5} /> Interface Governance
                </div>
                <h3 className="font-bold text-foreground tracking-tight text-xl leading-tight">
                  {hoveredLink.label}
                </h3>
              </div>
              <button onClick={() => setHoveredLink(null)} className="text-foreground/30 hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 bg-secondary/50 rounded-[10px] border border-border text-left">
              <div className="text-xs text-foreground/60 leading-relaxed font-mono">
                <span className="font-bold text-foreground uppercase tracking-widest block mb-2 text-[9px]">Regulatory Basis:</span>
                {hoveredLink.regulatoryBasis}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
