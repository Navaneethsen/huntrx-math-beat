import React, { useEffect, useRef, useState } from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import { Language } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';

interface StageVolume3DProps {
  cols: number; // X dimension (length/width)
  rows: number; // Z dimension (depth)
  height3d: number; // Y dimension (height)
  lang: Language;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface ProjectedFace {
  key: string;
  points: string;
  innerPoints: string;
  depth: number;
  fill: string;
  innerFill: string;
  stroke: string;
}

const LAYER_PALETTES = [
  {
    top: '#f472b6', // pink-400
    topInner: '#fbcfe8',
    left: '#db2777', // pink-600
    leftInner: '#f472b6',
    right: '#9d174d', // pink-800
    rightInner: '#be185d',
    bottom: '#831843',
  },
  {
    top: '#38bdf8', // sky-400
    topInner: '#bae6fd',
    left: '#0284c7', // sky-600
    leftInner: '#38bdf8',
    right: '#075985', // sky-800
    rightInner: '#0369a1',
    bottom: '#0c4a6e',
  },
  {
    top: '#fbbf24', // amber-400
    topInner: '#fde68a',
    left: '#d97706', // amber-600
    leftInner: '#fbbf24',
    right: '#92400e', // amber-800
    rightInner: '#b45309',
    bottom: '#78350f',
  },
  {
    top: '#a78bfa', // violet-400
    topInner: '#ddd6fe',
    left: '#7c3aed', // violet-600
    leftInner: '#a78bfa',
    right: '#5b21b6', // violet-800
    rightInner: '#6d28d9',
    bottom: '#4c1d95',
  },
  {
    top: '#34d399', // emerald-400
    topInner: '#a7f3d0',
    left: '#059669', // emerald-600
    leftInner: '#34d399',
    right: '#065f46', // emerald-800
    rightInner: '#047857',
    bottom: '#064e3b',
  },
];

function rotatePoint(p: Vec3, yawDeg: number, pitchDeg: number): Vec3 {
  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;

  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  // Rotate around Y axis (yaw)
  const x1 = p.x * cosY + p.z * sinY;
  const y1 = p.y;
  const z1 = -p.x * sinY + p.z * cosY;

  // Rotate around X axis (pitch)
  const x2 = x1;
  const y2 = y1 * cosP - z1 * sinP;
  const z2 = y1 * sinP + z1 * cosP;

  return { x: x2, y: y2, z: z2 };
}

export const StageVolume3D: React.FC<StageVolume3DProps> = ({
  cols,
  rows,
  height3d,
  lang,
}) => {
  // Default isometric-like angle where all 3 faces (Top, Front, Side) are clearly visible
  const [yaw, setYaw] = useState<number>(-36);
  const [pitch, setPitch] = useState<number>(26);
  const [explodeLayers, setExplodeLayers] = useState<boolean>(false);
  const [autoSpin, setAutoSpin] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startYaw: number;
    startPitch: number;
  } | null>(null);

  // Reset explosion when dimensions change (new question)
  useEffect(() => {
    setExplodeLayers(false);
  }, [cols, rows, height3d]);

  // Optional gentle auto-spin
  useEffect(() => {
    if (!autoSpin || isDragging) return;
    const id = window.setInterval(() => {
      setYaw((prev) => (prev + 1.2) % 360);
    }, 30);
    return () => window.clearInterval(id);
  }, [autoSpin, isDragging]);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startYaw: yaw,
      startPitch: pitch,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    const nextYaw = (dragStartRef.current.startYaw + dx * 0.65) % 360;
    const nextPitch = Math.max(
      -75,
      Math.min(82, dragStartRef.current.startPitch + dy * 0.55)
    );
    setYaw(nextYaw);
    setPitch(nextPitch);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const layerGap = explodeLayers ? 0.36 : 0;
  const totalHeightSpan = height3d + (height3d - 1) * layerGap;

  // Tight, responsive scale so the 3D cuboid fills the 420x210 viewport snugly
  const effectiveSpan = Math.max(
    totalHeightSpan * 0.85 + (cols + rows) * 0.28,
    (cols + rows) * 0.55,
    3
  );
  const scale = Math.min(42, 162 / effectiveSpan);
  const cx = 210;
  const cy = 104;
  const floorY = Math.min(192, cy + (totalHeightSpan / 2) * scale * 0.82 + 18);
  const floorRx = Math.max(85, Math.min(175, (cols + rows) * scale * 0.56));
  const floorRy = Math.max(18, Math.min(34, floorRx * 0.22));

  const projectToScreen = (v: Vec3): { sx: number; sy: number; depth: number } => {
    const r = rotatePoint(v, yaw, pitch);
    return {
      sx: cx + r.x * scale,
      sy: cy - r.y * scale,
      depth: r.z,
    };
  };

  // Build visible faces for all unit cubes
  const faces: ProjectedFace[] = [];

  const xOffset = -cols / 2;
  const yOffset = -totalHeightSpan / 2;
  const zOffset = -rows / 2;

  // Check which of the 6 normals face the camera
  const dirNormals: Record<
    'top' | 'bottom' | 'front' | 'back' | 'right' | 'left',
    Vec3
  > = {
    top: rotatePoint({ x: 0, y: 1, z: 0 }, yaw, pitch),
    bottom: rotatePoint({ x: 0, y: -1, z: 0 }, yaw, pitch),
    front: rotatePoint({ x: 0, y: 0, z: 1 }, yaw, pitch),
    back: rotatePoint({ x: 0, y: 0, z: -1 }, yaw, pitch),
    right: rotatePoint({ x: 1, y: 0, z: 0 }, yaw, pitch),
    left: rotatePoint({ x: -1, y: 0, z: 0 }, yaw, pitch),
  };

  const makeQuadPoints = (corners: Vec3[], inset = 0): { pts: string; depth: number } => {
    const center: Vec3 = {
      x: (corners[0].x + corners[1].x + corners[2].x + corners[3].x) / 4,
      y: (corners[0].y + corners[1].y + corners[2].y + corners[3].y) / 4,
      z: (corners[0].z + corners[1].z + corners[2].z + corners[3].z) / 4,
    };

    const projected = corners.map((c) => {
      const adjusted: Vec3 =
        inset > 0
          ? {
              x: c.x + (center.x - c.x) * inset,
              y: c.y + (center.y - c.y) * inset,
              z: c.z + (center.z - c.z) * inset,
            }
          : c;
      return projectToScreen(adjusted);
    });

    const pts = projected
      .map((p) => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`)
      .join(' ');
    const depth =
      (projected[0].depth +
        projected[1].depth +
        projected[2].depth +
        projected[3].depth) /
      4;
    return { pts, depth };
  };

  const yIndices = Array.from({ length: height3d }, (_, i) =>
    dirNormals.top.z >= 0 ? i : height3d - 1 - i
  );
  const xIndices = Array.from({ length: cols }, (_, i) =>
    dirNormals.right.z >= 0 ? i : cols - 1 - i
  );
  const zIndices = Array.from({ length: rows }, (_, i) =>
    dirNormals.front.z >= 0 ? i : rows - 1 - i
  );

  for (const iy of yIndices) {
    const palette = LAYER_PALETTES[iy % LAYER_PALETTES.length];
    const y0 = yOffset + iy * (1 + layerGap);
    const y1 = y0 + 1;

    for (const ix of xIndices) {
      const x0 = xOffset + ix;
      const x1 = x0 + 1;

      for (const iz of zIndices) {
        const z0 = zOffset + iz;
        const z1 = z0 + 1;

        // Top face (+Y): exposed if top layer OR if layers are exploded
        if ((iy === height3d - 1 || explodeLayers) && dirNormals.top.z > 0.01) {
          const corners: Vec3[] = [
            { x: x0, y: y1, z: z0 },
            { x: x1, y: y1, z: z0 },
            { x: x1, y: y1, z: z1 },
            { x: x0, y: y1, z: z1 },
          ];
          const outer = makeQuadPoints(corners, 0);
          const inner = makeQuadPoints(corners, 0.16);
          faces.push({
            key: `t-${ix}-${iy}-${iz}`,
            points: outer.pts,
            innerPoints: inner.pts,
            depth: outer.depth,
            fill: palette.top,
            innerFill: palette.topInner,
            stroke: '#1e1b4b',
          });
        }

        // Bottom face (-Y): exposed if bottom layer OR if layers are exploded
        if ((iy === 0 || explodeLayers) && dirNormals.bottom.z > 0.01) {
          const corners: Vec3[] = [
            { x: x0, y: y0, z: z0 },
            { x: x0, y: y0, z: z1 },
            { x: x1, y: y0, z: z1 },
            { x: x1, y: y0, z: z0 },
          ];
          const outer = makeQuadPoints(corners, 0);
          const inner = makeQuadPoints(corners, 0.16);
          faces.push({
            key: `b-${ix}-${iy}-${iz}`,
            points: outer.pts,
            innerPoints: inner.pts,
            depth: outer.depth,
            fill: palette.bottom,
            innerFill: palette.right,
            stroke: '#1e1b4b',
          });
        }

        // Front face (+Z)
        if (iz === rows - 1 && dirNormals.front.z > 0.01) {
          const corners: Vec3[] = [
            { x: x0, y: y0, z: z1 },
            { x: x1, y: y0, z: z1 },
            { x: x1, y: y1, z: z1 },
            { x: x0, y: y1, z: z1 },
          ];
          const outer = makeQuadPoints(corners, 0);
          const inner = makeQuadPoints(corners, 0.16);
          faces.push({
            key: `f-${ix}-${iy}-${iz}`,
            points: outer.pts,
            innerPoints: inner.pts,
            depth: outer.depth,
            fill: palette.left,
            innerFill: palette.leftInner,
            stroke: '#1e1b4b',
          });
        }

        // Back face (-Z)
        if (iz === 0 && dirNormals.back.z > 0.01) {
          const corners: Vec3[] = [
            { x: x1, y: y0, z: z0 },
            { x: x0, y: y0, z: z0 },
            { x: x0, y: y1, z: z0 },
            { x: x1, y: y1, z: z0 },
          ];
          const outer = makeQuadPoints(corners, 0);
          const inner = makeQuadPoints(corners, 0.16);
          faces.push({
            key: `k-${ix}-${iy}-${iz}`,
            points: outer.pts,
            innerPoints: inner.pts,
            depth: outer.depth,
            fill: palette.left,
            innerFill: palette.leftInner,
            stroke: '#1e1b4b',
          });
        }

        // Right face (+X)
        if (ix === cols - 1 && dirNormals.right.z > 0.01) {
          const corners: Vec3[] = [
            { x: x1, y: y0, z: z1 },
            { x: x1, y: y0, z: z0 },
            { x: x1, y: y1, z: z0 },
            { x: x1, y: y1, z: z1 },
          ];
          const outer = makeQuadPoints(corners, 0);
          const inner = makeQuadPoints(corners, 0.16);
          faces.push({
            key: `r-${ix}-${iy}-${iz}`,
            points: outer.pts,
            innerPoints: inner.pts,
            depth: outer.depth,
            fill: palette.right,
            innerFill: palette.rightInner,
            stroke: '#1e1b4b',
          });
        }

        // Left face (-X)
        if (ix === 0 && dirNormals.left.z > 0.01) {
          const corners: Vec3[] = [
            { x: x0, y: y0, z: z0 },
            { x: x0, y: y0, z: z1 },
            { x: x0, y: y1, z: z1 },
            { x: x0, y: y1, z: z0 },
          ];
          const outer = makeQuadPoints(corners, 0);
          const inner = makeQuadPoints(corners, 0.16);
          faces.push({
            key: `l-${ix}-${iy}-${iz}`,
            points: outer.pts,
            innerPoints: inner.pts,
            depth: outer.depth,
            fill: palette.right,
            innerFill: palette.rightInner,
            stroke: '#1e1b4b',
          });
        }
      }
    }
  }

  // Project 3D anchor points for the 3 dimension callouts (Width, Depth, Height) snugly around the prism
  const widthLabelPos = projectToScreen({
    x: 0,
    y: yOffset - 0.55,
    z: zOffset + rows + 0.55,
  });
  const depthLabelPos = projectToScreen({
    x: xOffset + cols + 0.75,
    y: yOffset - 0.3,
    z: 0,
  });
  const heightLabelPos = projectToScreen({
    x: xOffset - 0.85,
    y: 0,
    z: zOffset + rows + 0.35,
  });

  const baseBlocks = cols * rows;

  return (
    <div
      data-testid="tang-stagegrid-3d-viewer"
      className="my-1.5 p-3 sm:p-3.5 rounded-3xl bg-slate-950/95 border-2 border-cyan-400/60 shadow-[0_0_30px_rgba(34,211,238,0.25)] flex flex-col items-center gap-2.5 w-full max-w-xl"
    >
      {/* Top 3D Dimensions & Drag Hint Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 w-full px-1">
        <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm font-display font-black">
          <span className="px-2.5 py-1 rounded-xl bg-pink-500/20 border border-pink-400/50 text-pink-200">
            ↔ {cols}m
          </span>
          <span className="text-purple-300">×</span>
          <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200">
            ↗ {rows}m
          </span>
          <span className="text-purple-300">×</span>
          <span className="px-2.5 py-1 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-200">
            ↕ {height3d}m
          </span>
        </div>

        <div className="px-3 py-1 rounded-full bg-purple-900/70 border border-purple-500/50 text-[11px] sm:text-xs font-bold text-purple-200">
          🖐️ {lang === 'nl' ? 'Sleep om 3D te draaien!' : 'Drag to rotate in 3D!'}
        </div>
      </div>

      {/* Interactive 3D SVG Stage (Full width of container, snug fit) */}
      <div className="relative w-full flex flex-col items-center">
        <svg
          data-testid="stage-volume-3d-svg"
          data-yaw={Math.round(yaw)}
          data-pitch={Math.round(pitch)}
          data-exploded={explodeLayers ? 'true' : 'false'}
          viewBox="0 0 420 210"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`w-full h-[210px] sm:h-[240px] select-none touch-none rounded-2xl bg-gradient-to-b from-[#16072e] via-[#0d041c] to-[#06020e] border border-purple-700/50 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Subtle glowing stage floor ellipse */}
          <ellipse
            cx={cx}
            cy={floorY}
            rx={floorRx}
            ry={floorRy}
            fill="rgba(34, 211, 238, 0.08)"
            stroke="rgba(34, 211, 238, 0.25)"
            strokeDasharray="5 5"
          />

          {/* Render sorted 3D cube faces */}
          {faces.map((f) => (
            <g key={f.key}>
              <polygon
                points={f.points}
                fill={f.fill}
                stroke={f.stroke}
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <polygon
                points={f.innerPoints}
                fill={f.innerFill}
                fillOpacity="0.45"
                stroke="none"
              />
            </g>
          ))}

          {/* 3D Floating Dimension Pills */}
          <g
            transform={`translate(${Math.max(36, Math.min(384, widthLabelPos.sx))}, ${Math.max(18, Math.min(192, widthLabelPos.sy))})`}
          >
            <rect
              x="-28"
              y="-12"
              width="56"
              height="24"
              rx="8"
              fill="#0f172a"
              stroke="#f472b6"
              strokeWidth="1.8"
            />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              fill="#fbcfe8"
              fontSize="12"
              fontWeight="900"
              fontFamily="Fredoka, sans-serif"
            >
              ↔ {cols}m
            </text>
          </g>

          <g
            transform={`translate(${Math.max(36, Math.min(384, depthLabelPos.sx))}, ${Math.max(18, Math.min(192, depthLabelPos.sy))})`}
          >
            <rect
              x="-28"
              y="-12"
              width="56"
              height="24"
              rx="8"
              fill="#0f172a"
              stroke="#fbbf24"
              strokeWidth="1.8"
            />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              fill="#fde68a"
              fontSize="12"
              fontWeight="900"
              fontFamily="Fredoka, sans-serif"
            >
              ↗ {rows}m
            </text>
          </g>

          <g
            transform={`translate(${Math.max(36, Math.min(384, heightLabelPos.sx))}, ${Math.max(18, Math.min(192, heightLabelPos.sy))})`}
          >
            <rect
              x="-28"
              y="-12"
              width="56"
              height="24"
              rx="8"
              fill="#0f172a"
              stroke="#22d3ee"
              strokeWidth="1.8"
            />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              fill="#a5f3fc"
              fontSize="12"
              fontWeight="900"
              fontFamily="Fredoka, sans-serif"
            >
              ↕ {height3d}m
            </text>
          </g>
        </svg>

        {/* Visual Layer Insight Pill when Split Layers is active */}
        {explodeLayers && (
          <div
            data-testid="stage-volume-layer-breakdown"
            className="mt-2 px-4 py-1.5 rounded-2xl bg-cyan-500/20 border border-cyan-300/60 text-cyan-100 font-display font-black text-xs sm:text-sm animate-fadeIn"
          >
            🥞 {height3d} {lang === 'nl' ? 'lagen van' : 'layers of'} ({cols} × {rows} = {baseBlocks}){' '}
            {lang === 'nl' ? 'blokjes' : 'cubes'}!
          </div>
        )}
      </div>

      {/* Only Split Layers & Spin Controls (Drag handles all 3D rotation) */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 w-full pt-0.5">
        <button
          type="button"
          data-testid="volume-explode-layers-btn"
          onClick={() => {
            soundEngine.playSelect();
            setExplodeLayers((prev) => !prev);
          }}
          className={`px-4 py-1.5 rounded-xl font-display font-black text-xs sm:text-sm flex items-center gap-1.5 border cursor-pointer transition-all ${
            explodeLayers
              ? 'bg-gradient-to-r from-cyan-400 to-pink-500 text-slate-950 border-white shadow-md'
              : 'bg-purple-900/80 hover:bg-purple-800 border-cyan-400/60 text-cyan-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{lang === 'nl' ? '🥞 Splits Lagen' : '🥞 Split Layers'}</span>
        </button>

        <button
          type="button"
          data-testid="volume-autospin-btn"
          onClick={() => {
            soundEngine.playTap();
            setAutoSpin((prev) => !prev);
          }}
          className={`px-4 py-1.5 rounded-xl font-display font-black text-xs sm:text-sm flex items-center gap-1.5 border cursor-pointer transition-all ${
            autoSpin
              ? 'bg-amber-400 text-slate-950 border-white shadow-md'
              : 'bg-purple-900/80 hover:bg-purple-800 border-amber-400/50 text-amber-200'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${autoSpin ? 'animate-spin' : ''}`} />
          <span>{lang === 'nl' ? 'Spin' : 'Spin'}</span>
        </button>
      </div>
    </div>
  );
};
