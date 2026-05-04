import { useState } from "react";
import Header from "../components/Header";
import {
  TruckIcon,
  PackageIcon,
  AlertTriangleIcon,
  MapPinIcon,
  LayersIcon,
  ZoomInIcon,
  ZoomOutIcon,
  NavigationIcon,
  WifiOffIcon,
  ClockIcon,
  ActivityIcon,
  RadioIcon,
} from "lucide-react";

const riders = [
  { id: `R_045`, name: `Moses K.`, status: `On Delivery`, order: `WL-00234`, dest: `Ntinda`, x: 58, y: 38, late: false, dark: false },
  { id: `R_112`, name: `Grace A.`, status: `Available`, order: `—`, dest: `CBD`, x: 42, y: 55, late: false, dark: false },
  { id: `R_078`, name: `Sarah O.`, status: `On Delivery`, order: `WL-00230`, dest: `Nakawa`, x: 70, y: 44, late: false, dark: false },
  { id: `R_201`, name: `Peter M.`, status: `On Delivery`, order: `WL-00228`, dest: `Ntinda`, x: 55, y: 32, late: true, dark: false },
  { id: `R_033`, name: `John B.`, status: `Offline`, order: `—`, dest: `Kawempe`, x: 28, y: 30, late: false, dark: true },
  { id: `R_067`, name: `Emmanuel W.`, status: `Break`, order: `—`, dest: `Makindye`, x: 38, y: 68, late: false, dark: false },
];

const packages = [
  { id: `PT-098`, order: `WL-00234`, x: 58, y: 37, mismatch: false },
  { id: `PT-118`, order: `WL-00228`, x: 64, y: 33, mismatch: true },
];

const zones = [
  { name: `CBD`, x: 38, y: 50, w: 120, h: 80, color: `rgba(96,165,250,0.08)`, border: `rgba(96,165,250,0.25)` },
  { name: `Ntinda`, x: 50, y: 28, w: 100, h: 80, color: `rgba(249,115,22,0.08)`, border: `rgba(249,115,22,0.25)` },
  { name: `Nakawa`, x: 65, y: 38, w: 100, h: 80, color: `rgba(16,185,129,0.08)`, border: `rgba(16,185,129,0.25)` },
  { name: `Makindye`, x: 32, y: 62, w: 110, h: 75, color: `rgba(139,92,246,0.08)`, border: `rgba(139,92,246,0.25)` },
  { name: `Kawempe`, x: 22, y: 24, w: 100, h: 75, color: `rgba(245,158,11,0.08)`, border: `rgba(245,158,11,0.25)` },
  { name: `Rubaga`, x: 20, y: 48, w: 90, h: 75, color: `rgba(239,68,68,0.08)`, border: `rgba(239,68,68,0.25)` },
];

const alerts = [
  { type: `GPS Dark`, rider: `John B.`, detail: `18 min offline`, level: `error` },
  { type: `Location Mismatch`, rider: `PT-118`, detail: `Package 620m from rider`, level: `error` },
  { type: `Idle Rider`, rider: `Peter M.`, detail: `Stationary 14 min`, level: `warn` },
];

export default function LiveMap() {
  const [zoom, setZoom] = useState(1);
  const [showLayers, setShowLayers] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showRoads, setShowRoads] = useState(true);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleLayersToggle = () => {
    setShowLayers(prev => !prev);
  };

  const handleNavigation = () => {
    setZoom(1);
    // Could also center the map here
  };

  return (
    <div data-cmp="LiveMap" className="flex flex-col h-full">
      <Header title={`Live Map`} subtitle={`Real-time rider & package tracking · Pioneer Mall Hub`} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-border bg-card flex flex-col overflow-y-auto flex-shrink-0">
          {/* Live Status */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <ActivityIcon className="w-4 h-4 text-success" />
              <span className="text-xs font-semibold text-foreground">Live Status</span>
              <div className="w-1.5 h-1.5 rounded-full bg-success status-pulse ml-auto" />
            </div>
            <div className="flex flex-col gap-2">
              {[
                { label: `Active Riders`, value: `5`, color: `text-success` },
                { label: `Packages Out`, value: `12`, color: `text-primary` },
                { label: `Mismatches`, value: `1`, color: `text-destructive` },
                { label: `GPS Dark`, value: `1`, color: `text-destructive` },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{s.label}</span>
                  <span className={`text-xs font-bold ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="p-4 border-b border-border">
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <AlertTriangleIcon className="w-3.5 h-3.5 text-warning" />
              Alerts
            </p>
            <div className="flex flex-col gap-2">
              {alerts.map((a, i) => (
                <div key={i} className={`p-2.5 rounded-lg border text-[10px] ${a.level === `error` ? `bg-destructive/5 border-destructive/20` : `bg-warning/5 border-warning/20`}`}>
                  <p className={`font-semibold mb-0.5 ${a.level === `error` ? `text-destructive` : `text-warning`}`}>{a.type}</p>
                  <p className="text-muted-foreground">{a.rider} · {a.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rider List */}
          <div className="p-4 flex flex-col gap-2">
            <p className="text-xs font-semibold text-foreground mb-1">Riders</p>
            {riders.map((r) => (
              <div key={r.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                <div className="relative flex-shrink-0">
                  <div className="w-7 h-7 gradient-blue rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                    {r.name.split(` `)[0][0]}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-card ${
                    r.dark ? `bg-destructive status-pulse` :
                    r.status === `On Delivery` ? `bg-primary` :
                    r.status === `Available` ? `bg-success` :
                    r.status === `Break` ? `bg-warning` : `bg-muted-foreground`
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{r.order !== `—` ? r.order : r.status}</p>
                </div>
                {r.dark && <WifiOffIcon className="w-3.5 h-3.5 text-destructive flex-shrink-0" />}
                {!r.dark && r.late && <ClockIcon className="w-3.5 h-3.5 text-warning flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* Map Canvas */}
        <div className="flex-1 relative bg-[#0d1626] overflow-hidden">
          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <button 
              onClick={handleZoomIn}
              className="w-9 h-9 bg-card border border-border rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-custom"
            >
              <ZoomInIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={handleZoomOut}
              className="w-9 h-9 bg-card border border-border rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-custom"
            >
              <ZoomOutIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={handleLayersToggle}
              className={`w-9 h-9 bg-card border border-border rounded-lg flex items-center justify-center transition-colors shadow-custom ${
                showLayers ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <LayersIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={handleNavigation}
              className="w-9 h-9 bg-card border border-border rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-custom"
            >
              <NavigationIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-10 bg-card border border-border rounded-xl p-3 shadow-custom">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Legend</p>
            <div className="flex flex-col gap-1.5">
              {[
                { icon: TruckIcon, color: `text-primary`, label: `On Delivery` },
                { icon: TruckIcon, color: `text-success`, label: `Available` },
                { icon: TruckIcon, color: `text-destructive`, label: `GPS Dark` },
                { icon: PackageIcon, color: `text-warning`, label: `Package (mismatch)` },
                { icon: PackageIcon, color: `text-chart-2`, label: `Package (normal)` },
              ].map((l) => {
                const Icon = l.icon;
                return (
                  <div key={l.label} className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${l.color}`} />
                    <span className="text-[10px] text-muted-foreground">{l.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hub marker */}
          <div className="absolute bottom-4 right-4 z-10 bg-card border border-primary/30 rounded-xl p-3 shadow-custom wolan-glow">
            <div className="flex items-center gap-2">
              <RadioIcon className="w-4 h-4 text-primary status-pulse" />
              <div>
                <p className="text-xs font-bold text-primary">HUB_001</p>
                <p className="text-[10px] text-muted-foreground">Pioneer Mall</p>
              </div>
            </div>
          </div>

          {/* Simulated Map SVG */}
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 800 600" 
            className="absolute inset-0"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
          >
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e2d47" strokeWidth="0.5" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Zone overlays */}
            {showLayers && showZones && zones.map((z) => (
              <g key={z.name}>
                <rect
                  x={`${z.x}%`} y={`${z.y}%`}
                  width={z.w} height={z.h}
                  rx={12}
                  fill={z.color}
                  stroke={z.border}
                  strokeWidth={1.5}
                />
                <text
                  x={`${z.x + 2}%`}
                  y={`${z.y + 4}%`}
                  fill={z.border}
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  {z.name}
                </text>
              </g>
            ))}

            {/* Road lines */}
            {showLayers && showRoads && (
              <>
                <line x1="40%" y1="0" x2="42%" y2="100%" stroke="#1e2d47" strokeWidth="2" strokeDasharray="8,4" />
                <line x1="0" y1="50%" x2="100%" y2="52%" stroke="#1e2d47" strokeWidth="2" strokeDasharray="8,4" />
                <line x1="60%" y1="0" x2="62%" y2="100%" stroke="#1e2d47" strokeWidth="1.5" strokeDasharray="6,4" />
                <line x1="0" y1="33%" x2="100%" y2="35%" stroke="#1e2d47" strokeWidth="1" strokeDasharray="5,5" />
              </>
            )}

            {/* Hub at center */}
            <circle cx="47%" cy="50%" r="14" fill="#1e2d47" stroke="#f97316" strokeWidth="2" />
            <text x="47%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#f97316" fontSize="8" fontWeight="bold" fontFamily="sans-serif">HUB</text>

            {/* Package pins */}
            {packages.map((p) => (
              <g key={p.id}>
                <circle
                  cx={`${p.x}%`} cy={`${p.y}%`} r="10"
                  fill={p.mismatch ? `rgba(245,158,11,0.2)` : `rgba(96,165,250,0.2)`}
                  stroke={p.mismatch ? `#f59e0b` : `#60a5fa`}
                  strokeWidth="2"
                />
                <text x={`${p.x}%`} y={`${p.y}%`} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={p.mismatch ? `#f59e0b` : `#60a5fa`} fontFamily="sans-serif">📦</text>
                {p.mismatch && (
                  <circle cx={`${p.x + 1.2}%`} cy={`${p.y - 1.5}%`} r="5" fill="#ef4444" className="animate-ping" />
                )}
              </g>
            ))}

            {/* Rider pins */}
            {riders.map((r) => (
              <g key={r.id}>
                <circle
                  cx={`${r.x}%`} cy={`${r.y}%`} r="12"
                  fill={
                    r.dark ? `rgba(239,68,68,0.25)` :
                    r.late ? `rgba(245,158,11,0.25)` :
                    r.status === `On Delivery` ? `rgba(249,115,22,0.25)` :
                    r.status === `Available` ? `rgba(16,185,129,0.25)` :
                    `rgba(107,127,160,0.2)`
                  }
                  stroke={
                    r.dark ? `#ef4444` :
                    r.late ? `#f59e0b` :
                    r.status === `On Delivery` ? `#f97316` :
                    r.status === `Available` ? `#10b981` :
                    `#6b7fa0`
                  }
                  strokeWidth="2"
                />
                <text x={`${r.x}%`} y={`${r.y - 0.5}%`} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontFamily="sans-serif">🏍️</text>
                <text x={`${r.x}%`} y={`${r.y + 3}%`} textAnchor="middle" fill="#e8edf5" fontSize="8" fontFamily="sans-serif">{r.name.split(` `)[0]}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
