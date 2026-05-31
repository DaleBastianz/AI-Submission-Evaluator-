'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { BRANCH_STYLES, type MindMapColor, type MindMapData } from '../lib/mindMap';

export interface MindMapChartProps {
  data: MindMapData;
}

const VIEW_W = 900;
const VIEW_H = 600;
const CENTER_X = VIEW_W / 2;
const CENTER_Y = VIEW_H / 2;
const BRANCH_RADIUS_X = 220;
const BRANCH_RADIUS_Y = 180;

function estimateTextWidth(text: string, fontSize: number) {
  return Math.max(fontSize * 0.55 * text.length, fontSize * 3);
}

function cubicPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const c1x = x1 + dx * 0.45;
  const c1y = y1 + dy * 0.12;
  const c2x = x2 - dx * 0.25;
  const c2y = y2 - dy * 0.35;
  return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
}

type LayoutBranch = {
  id: string;
  label: string;
  color: MindMapColor;
  x: number;
  y: number;
  w: number;
  h: number;
  subtopics: Array<{ id: string; label: string; x: number; y: number; w: number; h: number }>;
};

export default function MindMapChart({ data }: MindMapChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null);

  const layout = useMemo(() => {
    const count = data.branches.length;
    const rootLabel = data.root;
    const rootW = Math.min(estimateTextWidth(rootLabel, 16) + 48, 220);
    const rootH = 52;

    const branches: LayoutBranch[] = data.branches.map((branch, index) => {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
      const bx = CENTER_X + Math.cos(angle) * BRANCH_RADIUS_X;
      const by = CENTER_Y + Math.sin(angle) * BRANCH_RADIUS_Y;
      const bw = Math.min(estimateTextWidth(branch.label, 13) + 36, 168);
      const bh = 40;

      const subtopics = branch.subtopics.map((sub, subIndex) => {
        const along = 58 + subIndex * 52;
        const sx = bx + Math.cos(angle) * along;
        const sy = by + Math.sin(angle) * along;
        const sw = Math.min(estimateTextWidth(sub.label, 11) + 28, 150);
        const sh = 30;
        return { id: sub.id, label: sub.label, x: sx - sw / 2, y: sy - sh / 2, w: sw, h: sh };
      });

      return {
        id: branch.id,
        label: branch.label,
        color: branch.color,
        x: bx - bw / 2,
        y: by - bh / 2,
        w: bw,
        h: bh,
        subtopics
      };
    });

    return {
      root: { label: rootLabel, x: CENTER_X - rootW / 2, y: CENTER_Y - rootH / 2, w: rootW, h: rootH },
      branches
    };
  }, [data]);

  const downloadPng = useCallback(async () => {
    const svg = svgRef.current;
    if (!svg) return;

    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', '#000000');
    clone.insertBefore(bg, clone.firstChild);

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(clone);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = VIEW_W * 2;
      canvas.height = VIEW_H * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const link = document.createElement('a');
      link.download = `eduai-mindmap-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  }, []);

  return (
    <div className="relative w-full">
      <div className="absolute right-2 top-2 z-10 flex gap-2">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
          className="rounded-lg border border-white/20 bg-black/80 px-3 py-1.5 text-sm text-white hover:border-cyan-500/50"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
          className="rounded-lg border border-white/20 bg-black/80 px-3 py-1.5 text-sm text-white hover:border-cyan-500/50"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-transparent">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width="100%"
          className="block min-h-[360px] w-full"
          role="img"
          aria-label={`Mind map for ${data.root}`}
        >
          <g transform={`translate(${CENTER_X},${CENTER_Y}) scale(${zoom}) translate(${-CENTER_X},${-CENTER_Y})`}>
            {layout.branches.map((branch) => {
              const style = BRANCH_STYLES[branch.color];
              const rootCx = layout.root.x + layout.root.w / 2;
              const rootCy = layout.root.y + layout.root.h / 2;
              const branchCx = branch.x + branch.w / 2;
              const branchCy = branch.y + branch.h / 2;

              return (
                <g key={branch.id}>
                  <path
                    d={cubicPath(rootCx, rootCy, branchCx, branchCy)}
                    fill="none"
                    stroke={style.line}
                    strokeOpacity={0.4}
                    strokeWidth={2.5}
                  />

                  {branch.subtopics.map((sub) => {
                    const subCx = sub.x + sub.w / 2;
                    const subCy = sub.y + sub.h / 2;
                    return (
                      <line
                        key={sub.id}
                        x1={branchCx}
                        y1={branchCy}
                        x2={subCx}
                        y2={subCy}
                        stroke={style.line}
                        strokeOpacity={0.4}
                        strokeWidth={1.5}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Root node */}
            <g>
              <rect
                x={layout.root.x}
                y={layout.root.y}
                width={layout.root.w}
                height={layout.root.h}
                rx={layout.root.h / 2}
                fill="#0d3d32"
                stroke="#00e5c0"
                strokeWidth={2}
              />
              <text
                x={layout.root.x + layout.root.w / 2}
                y={layout.root.y + layout.root.h / 2 + 5}
                textAnchor="middle"
                fill="#00e5c0"
                fontSize={16}
                fontWeight={700}
              >
                {layout.root.label}
              </text>
            </g>

            {layout.branches.map((branch) => {
              const style = BRANCH_STYLES[branch.color];
              const isHovered = hoveredBranch === branch.id;
              const scale = isHovered ? 1.05 : 1;
              const cx = branch.x + branch.w / 2;
              const cy = branch.y + branch.h / 2;

              return (
                <g key={`branch-${branch.id}`}>
                  <g
                    transform={`translate(${cx},${cy}) scale(${scale}) translate(${-cx},${-cy})`}
                    onMouseEnter={() => setHoveredBranch(branch.id)}
                    onMouseLeave={() => setHoveredBranch(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={branch.x}
                      y={branch.y}
                      width={branch.w}
                      height={branch.h}
                      rx={12}
                      fill={style.fill}
                      stroke={style.border}
                      strokeWidth={2}
                    />
                    <text
                      x={cx}
                      y={cy + 4}
                      textAnchor="middle"
                      fill={style.text}
                      fontSize={13}
                      fontWeight={600}
                    >
                      {branch.label}
                    </text>
                  </g>

                  {branch.subtopics.map((sub) => (
                    <g key={sub.id}>
                      <rect
                        x={sub.x}
                        y={sub.y}
                        width={sub.w}
                        height={sub.h}
                        rx={8}
                        fill="#0a0f14"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth={1}
                      />
                      <text
                        x={sub.x + sub.w / 2}
                        y={sub.y + sub.h / 2 + 4}
                        textAnchor="middle"
                        fill="#f1f5f9"
                        fontSize={11}
                      >
                        {sub.label}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <button
        type="button"
        onClick={() => void downloadPng()}
        className="mt-4 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
      >
        Download as PNG
      </button>
    </div>
  );
}
