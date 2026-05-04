import { useState } from "react";
import Header from "../components/Header";
import { toast } from "sonner";
import {
  PlusIcon,
  MapPinIcon,
  TruckIcon,
  PackageIcon,
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseCircleIcon,
  TrendingUpIcon,
  ChevronRightIcon,
  RadioIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const hubs = [
  { id: `HUB_001`, name: `Pioneer Mall`, city: `Kampala`, zone: `Central`, status: `Active`, riders: 18, orders: 142, revenue: 8400000, onTime: 92, cod: 3200000, alerts: 2, x: 47, y: 50 },
  { id: `HUB_002`, name: `Ntinda Hub`, city: `Kampala`, zone: `East`, status: `Active`, riders: 12, orders: 98, revenue: 5600000, onTime: 88, cod: 2100000, alerts: 1, x: 62, y: 35 },
  { id: `HUB_003`, name: `Makindye Hub`, city: `Kampala`, zone: `South`, status: `Active`, riders: 9, orders: 74, revenue: 4200000, onTime: 85, cod: 1800000, alerts: 0, x: 38, y: 68 },
  { id: `HUB_004`, name: `Kawempe Hub`, city: `Kampala`, zone: `North`, status: `Active`, riders: 8, orders: 61, revenue: 3400000, onTime: 83, cod: 1400000, alerts: 3, x: 28, y: 28 },
  { id: `HUB_005`, name: `Entebbe Road`, city: `Entebbe`, zone: `South-West`, status: `Active`, riders: 6, orders: 43, revenue: 2400000, onTime: 90, cod: 980000, alerts: 0, x: 22, y: 75 },
  { id: `HUB_006`, name: `Jinja City Hub`, city: `Jinja`, zone: `East UG`, status: `Pending`, riders: 0, orders: 0, revenue: 0, onTime: 0, cod: 0, alerts: 0, x: 82, y: 42 },
  { id: `HUB_007`, name: `Mbarara Hub`, city: `Mbarara`, zone: `West UG`, status: `Pending`, riders: 0, orders: 0, revenue: 0, onTime: 0, cod: 0, alerts: 0, x: 25, y: 85 },
  { id: `HUB_008`, name: `Gulu Hub`, city: `Gulu`, zone: `North UG`, status: `Planned`, riders: 0, orders: 0, revenue: 0, onTime: 0, cod: 0, alerts: 0, x: 50, y: 12 },
];

const statusIcon: Record<string, React.ReactNode> = {
  "Active": <CheckCircleIcon className="w-3.5 h-3.5 text-success" />,
  "Pending": <PauseCircleIcon className="w-3.5 h-3.5 text-warning" />,
  "Suspended": <XCircleIcon className="w-3.5 h-3.5 text-destructive" />,
  "Planned": <RadioIcon className="w-3.5 h-3.5 text-muted-foreground" />,
};

const statusClass: Record<string, string> = {
  "Active": `text-success bg-success/10 border-success/20`,
  "Pending": `text-warning bg-warning/10 border-warning/20`,
  "Suspended": `text-destructive bg-destructive/10 border-destructive/20`,
  "Planned": `text-muted-foreground bg-muted border-border`,
};

type HubForm = {
  name: string;
  city: string;
  zone: string;
  manager: string;
  phone: string;
  address: string;
  status: "Active" | "Pending" | "Suspended" | "Planned";
};

const initialHubForm = (): HubForm => ({
  name: ``,
  city: ``,
  zone: ``,
  manager: ``,
  phone: ``,
  address: ``,
  status: `Planned`,
});

const createHubId = (count: number) => `HUB_${String(count + 1).padStart(3, `0`)}`;
const getNewHubCoordinates = (index: number) => ({
  x: 15 + (index * 12) % 70,
  y: 15 + (index * 17) % 70,
});

const comparisonData = hubs.filter((h) => h.status === `Active`).map((h) => ({
  name: h.name.replace(` Hub`, ``).replace(`Pioneer Mall`, `Pioneer`).replace(`Entebbe Road`, `Entebbe`),
  orders: h.orders,
  riders: h.riders,
  revenue: Math.round(h.revenue / 1000),
}));

export default function HQMaster() {
  const [hubList, setHubList] = useState(hubs);
  const [selected, setSelected] = useState<typeof hubs[0] | null>(hubs[0] ?? null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [hubForm, setHubForm] = useState<HubForm>(initialHubForm());
  const [editForm, setEditForm] = useState<HubForm>(initialHubForm());

  const activeHubs = hubList.filter((h) => h.status === `Active`);

  const toggleHubStatus = (hubId: string) => {
    setHubList((current) =>
      current.map((hub) => {
        if (hub.id !== hubId) return hub;
        const nextStatus = hub.status === `Suspended` ? `Active` : `Suspended`;
        return { ...hub, status: nextStatus };
      })
    );

    if (selected?.id === hubId) {
      setSelected((current) =>
        current ? { ...current, status: current.status === `Suspended` ? `Active` : `Suspended` } : current
      );
    }
  };

  const openEditForm = (hub: typeof hubs[0]) => {
    setEditForm({
      name: hub.name,
      city: hub.city,
      zone: hub.zone,
      manager: `Hub manager`,
      phone: ``,
      address: ``,
      status: hub.status as HubForm["status"],
    });
    setShowEdit(true);
  };

  const saveHubEdit = () => {
    if (!selected) return;

    setHubList((current) =>
      current.map((hub) =>
        hub.id === selected.id
          ? { ...hub, name: editForm.name, city: editForm.city, zone: editForm.zone, status: editForm.status }
          : hub
      )
    );

    setSelected((current) =>
      current
        ? { ...current, name: editForm.name, city: editForm.city, zone: editForm.zone, status: editForm.status }
        : current
    );

    setShowEdit(false);
    toast.success(`Hub updated successfully`);
  };

  const createHub = () => {
    if (!hubForm.name || !hubForm.city || !hubForm.zone) {
      toast.error(`Hub name, city, and zone are required`);
      return;
    }

    const nextId = createHubId(hubList.length);
    const coords = getNewHubCoordinates(hubList.length);
    const newHub = {
      id: nextId,
      name: hubForm.name,
      city: hubForm.city,
      zone: hubForm.zone,
      status: hubForm.status,
      riders: 0,
      orders: 0,
      revenue: 0,
      onTime: 0,
      cod: 0,
      alerts: 0,
      x: coords.x,
      y: coords.y,
    };

    setHubList((current) => [newHub, ...current]);
    setSelected(newHub);
    setShowAdd(false);
    setHubForm(initialHubForm());
    toast.success(`Hub created successfully`);
  };

  return (
    <div data-cmp="HQMaster" className="flex flex-col h-full">
      <Header title={`HQ Master Dashboard`} subtitle={`Multi-hub network overview · ${activeHubs.length} active hubs`} />

      <div className="flex flex-1 overflow-hidden">
        {/* Hub list sidebar */}
        <div className="w-72 border-r border-border bg-card flex flex-col flex-shrink-0 overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">All Hubs ({hubList.length})</p>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1 gradient-orange text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              <PlusIcon className="w-3 h-3" />
              Add Hub
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {hubList.map((h) => (
              <div
                key={h.id}
                onClick={() => setSelected(h)}
                className={`p-3 rounded-xl border cursor-pointer hover:border-primary/30 transition-all ${
                  selected?.id === h.id ? `border-primary/50 bg-primary/5 wolan-glow` : `border-border bg-muted/30`
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-foreground">{h.name}</p>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${statusClass[h.status]}`}>{h.status}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1"><MapPinIcon className="w-3 h-3" />{h.city}</div>
                  <div className="flex items-center gap-1"><TruckIcon className="w-3 h-3" />{h.riders}</div>
                  <div className="flex items-center gap-1"><PackageIcon className="w-3 h-3" />{h.orders}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* City-wide stats */}
          <div className="flex gap-3 px-6 py-4 border-b border-border">
            {[
              { label: `Active Hubs`, value: activeHubs.length.toString(), color: `text-success` },
              { label: `Total Riders`, value: hubList.reduce((a, h) => a + h.riders, 0).toString(), color: `text-primary` },
              { label: `Orders Today`, value: hubList.reduce((a, h) => a + h.orders, 0).toString(), color: `text-chart-2` },
              { label: `COD in Field`, value: `9.48M UGX`, color: `text-warning` },
              { label: `Network Alerts`, value: hubList.reduce((a, h) => a + h.alerts, 0).toString(), color: `text-destructive` },
              { label: `Cities Covered`, value: `5`, color: `text-foreground` },
            ].map((s) => (
              <div key={s.label} className="flex-1 bg-card rounded-xl border border-border px-3 py-3 shadow-custom">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Map */}
            <div className="flex-1 relative bg-[#0d1626] overflow-hidden">
              <svg width="100%" height="100%" viewBox="0 0 700 500" className="absolute inset-0">
                <defs>
                  <pattern id="hqgrid" width="35" height="35" patternUnits="userSpaceOnUse">
                    <path d="M 35 0 L 0 0 0 35" fill="none" stroke="#1e2d47" strokeWidth="0.5" opacity="0.4" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hqgrid)" />

                {/* Road lines */}
                <line x1="45%" y1="0" x2="47%" y2="100%" stroke="#1e2d47" strokeWidth="2" strokeDasharray="8,4" />
                <line x1="0" y1="48%" x2="100%" y2="50%" stroke="#1e2d47" strokeWidth="2" strokeDasharray="8,4" />

                {/* Hub pings */}
                {hubList.map((h) => (
                  <g key={h.id}>
                    {h.status === `Active` && (
                      <circle cx={`${h.x}%`} cy={`${h.y}%`} r="18" fill={`rgba(249,115,22,0.05)`} stroke="#f97316" strokeWidth="1" strokeDasharray="4,3" />
                    )}
                    <circle
                      cx={`${h.x}%`} cy={`${h.y}%`} r="10"
                      fill={
                        h.status === `Active` ? `rgba(249,115,22,0.2)` :
                        h.status === `Pending` ? `rgba(245,158,11,0.15)` :
                        `rgba(107,127,160,0.1)`
                      }
                      stroke={
                        h.status === `Active` ? `#f97316` :
                        h.status === `Pending` ? `#f59e0b` :
                        `#6b7fa0`
                      }
                      strokeWidth="2"
                      className={selected?.id === h.id ? `opacity-100` : ``}
                      onClick={() => setSelected(h)}
                      style={{ cursor: `pointer` }}
                    />
                    <text x={`${h.x}%`} y={`${h.y + 0.5}%`} textAnchor="middle" dominantBaseline="middle" fill={h.status === `Active` ? `#f97316` : `#6b7fa0`} fontSize="9" fontWeight="bold" fontFamily="sans-serif">H</text>
                    <text x={`${h.x}%`} y={`${h.y + 3.5}%`} textAnchor="middle" fill="#e8edf5" fontSize="8" fontFamily="sans-serif">{h.city}</text>
                    {h.alerts > 0 && (
                      <circle cx={`${h.x + 1.5}%`} cy={`${h.y - 1.5}%`} r="5" fill="#ef4444" />
                    )}
                  </g>
                ))}
              </svg>

              {/* Map legend */}
              <div className="absolute bottom-4 left-4 bg-card border border-border rounded-xl p-3 shadow-custom">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Hub Status</p>
                {[
                  { label: `Active`, color: `bg-primary` },
                  { label: `Pending`, color: `bg-warning` },
                  { label: `Planned`, color: `bg-muted-foreground` },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${l.color}`} />
                    <span className="text-[10px] text-muted-foreground">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right panel */}
            <div className="w-80 border-l border-border flex flex-col overflow-hidden">
              {/* Hub detail */}
              <div className={`flex flex-col flex-shrink-0 border-b border-border p-4 transition-opacity ${selected ? `opacity-100` : `opacity-40`}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{selected?.name ?? `Select a hub`}</p>
                    <p className="text-xs text-muted-foreground">{selected?.id ?? `—`} · {selected?.city ?? `—`}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${statusClass[selected?.status ?? `Active`]}`}>{selected?.status ?? `—`}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: `Riders`, value: selected?.riders ?? 0, color: `text-primary` },
                    { label: `Orders`, value: selected?.orders ?? 0, color: `text-chart-2` },
                    { label: `On-Time`, value: selected?.onTime ? `${selected.onTime}%` : `—`, color: `text-success` },
                    { label: `Alerts`, value: selected?.alerts ?? 0, color: selected?.alerts ? `text-destructive` : `text-muted-foreground` },
                  ].map((s) => (
                    <div key={s.label} className="flex-1 min-w-16 bg-muted rounded-lg p-2 text-center">
                      <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 mt-3">
                  <button
                    onClick={() => selected ? toast.success(`Drilling into ${selected.name}`) : toast.error(`Select a hub first`)}
                    className="w-full gradient-orange text-white text-[11px] font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                  >
                    <ActivityIcon className="w-3.5 h-3.5" />
                    Drill Into Hub
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => selected && toggleHubStatus(selected.id)}
                      className="flex-1 bg-muted text-foreground text-[11px] font-medium py-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      Suspend
                    </button>
                    <button
                      onClick={() => selected && openEditForm(selected)}
                      className="flex-1 bg-muted text-foreground text-[11px] font-medium py-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      Edit Info
                    </button>
                  </div>
                </div>
              </div>

              {/* Alerts list */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <AlertTriangleIcon className="w-3.5 h-3.5 text-warning" />
                  Network Alerts
                </p>
                {hubList.filter((h) => h.alerts > 0).map((h) => (
                  <div key={h.id} className="bg-destructive/5 border border-destructive/20 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-foreground">{h.name}</p>
                      <span className="text-[10px] font-bold text-destructive">{h.alerts} alert{h.alerts > 1 ? `s` : ``}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{h.city} · {h.zone}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comparison chart */}
          <div className="border-t border-border bg-card p-5 flex-shrink-0">
            <p className="text-sm font-semibold text-foreground mb-3">Hub Performance Comparison (Active)</p>
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: `#6b7fa0`, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: `#6b7fa0`, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: `#1a2235`, border: `1px solid #1e2d47`, borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="orders" fill="#f97316" radius={[3, 3, 0, 0]} name="Orders" />
                  <Bar dataKey="riders" fill="#60a5fa" radius={[3, 3, 0, 0]} name="Riders" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Add Hub Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${showAdd ? `opacity-100 pointer-events-auto` : `opacity-0 pointer-events-none`}`}>
        <div className="bg-card border border-border rounded-2xl p-6 w-[440px] shadow-custom flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">Add New Hub</h2>
            </div>
            <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none">✕</button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Hub Name</label>
              <input
                value={hubForm.name}
                onChange={(event) => setHubForm((current) => ({ ...current, name: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
                placeholder="Enter hub name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">City</label>
              <input
                value={hubForm.city}
                onChange={(event) => setHubForm((current) => ({ ...current, city: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
                placeholder="Enter city"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Zone / Area</label>
              <input
                value={hubForm.zone}
                onChange={(event) => setHubForm((current) => ({ ...current, zone: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
                placeholder="Enter zone or area"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Hub Manager Name</label>
              <input
                value={hubForm.manager}
                onChange={(event) => setHubForm((current) => ({ ...current, manager: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
                placeholder="Enter manager name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Hub Manager Phone</label>
              <input
                value={hubForm.phone}
                onChange={(event) => setHubForm((current) => ({ ...current, phone: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
                placeholder="Enter manager phone"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Physical Address</label>
              <input
                value={hubForm.address}
                onChange={(event) => setHubForm((current) => ({ ...current, address: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
                placeholder="Enter address"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Initial Status</label>
              <select
                value={hubForm.status}
                onChange={(event) => setHubForm((current) => ({ ...current, status: event.target.value as HubForm["status"] }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
              >
                <option value="Planned">Planned</option>
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAdd(false)} className="flex-1 bg-muted text-foreground text-xs font-medium py-2.5 rounded-lg hover:bg-accent transition-colors">Cancel</button>
            <button onClick={createHub} className="flex-1 gradient-orange text-white text-xs font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity">Create Hub</button>
          </div>
        </div>
      </div>

      {/* Edit Hub Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${showEdit ? `opacity-100 pointer-events-auto` : `opacity-0 pointer-events-none`}`}>
        <div className="bg-card border border-border rounded-2xl p-6 w-[440px] shadow-custom flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TruckIcon className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">Edit Hub Details</h2>
            </div>
            <button onClick={() => setShowEdit(false)} className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none">✕</button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Hub Name</label>
              <input
                value={editForm.name}
                onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">City</label>
              <input
                value={editForm.city}
                onChange={(event) => setEditForm((current) => ({ ...current, city: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Zone / Area</label>
              <input
                value={editForm.zone}
                onChange={(event) => setEditForm((current) => ({ ...current, zone: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Status</label>
              <select
                value={editForm.status}
                onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value as HubForm["status"] }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
              >
                <option value="Planned">Planned</option>
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowEdit(false)} className="flex-1 bg-muted text-foreground text-xs font-medium py-2.5 rounded-lg hover:bg-accent transition-colors">Cancel</button>
            <button onClick={saveHubEdit} className="flex-1 gradient-orange text-white text-xs font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}
