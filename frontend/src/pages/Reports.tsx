import { useState } from "react";
import Header from "../components/Header";
import {
  BarChart2Icon,
  TrendingUpIcon,
  DownloadIcon,
  CalendarIcon,
  PackageIcon,
  TruckIcon,
  StarIcon,
  AlertTriangleIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const monthlyData = [
  { month: `Jan`, orders: 820, revenue: 4100000, failed: 42, cod: 2800000 },
  { month: `Feb`, orders: 940, revenue: 4700000, failed: 38, cod: 3100000 },
  { month: `Mar`, orders: 1050, revenue: 5250000, failed: 55, cod: 3400000 },
  { month: `Apr`, orders: 1200, revenue: 6000000, failed: 48, cod: 3900000 },
  { month: `May`, orders: 1340, revenue: 6700000, failed: 51, cod: 4200000 },
  { month: `Jun`, orders: 1180, revenue: 5900000, failed: 44, cod: 3700000 },
  { month: `Jul`, orders: 1420, revenue: 7100000, failed: 60, cod: 4600000 },
];

const driverPerf = [
  { name: `Moses K.`, deliveries: 284, onTime: 94, rating: 4.7, cod: 820000 },
  { name: `Grace A.`, deliveries: 312, onTime: 88, rating: 4.5, cod: 640000 },
  { name: `Sarah O.`, deliveries: 198, onTime: 91, rating: 4.8, cod: 980000 },
  { name: `Peter M.`, deliveries: 145, onTime: 82, rating: 4.2, cod: 0 },
  { name: `John B.`, deliveries: 98, onTime: 75, rating: 3.9, cod: 0 },
  { name: `Emmanuel W.`, deliveries: 256, onTime: 90, rating: 4.6, cod: 1040000 },
];

const zoneData = [
  { name: `CBD`, value: 28, color: `#60a5fa` },
  { name: `Ntinda`, value: 22, color: `#f97316` },
  { name: `Nakawa`, value: 18, color: `#10b981` },
  { name: `Makindye`, value: 15, color: `#8b5cf6` },
  { name: `Kawempe`, value: 10, color: `#f59e0b` },
  { name: `Rubaga`, value: 7, color: `#ef4444` },
];

const codData = [
  { month: `Apr`, collected: 3900000, remitted: 3650000 },
  { month: `May`, collected: 4200000, remitted: 4050000 },
  { month: `Jun`, collected: 3700000, remitted: 3580000 },
  { month: `Jul`, collected: 4600000, remitted: 4200000 },
];

const tabs = [`Overview`, `Driver Performance`, `COD Reconciliation`, `Zone Heatmap`, `Customer Reports`];

export default function Reports() {
  const [activeTab, setActiveTab] = useState(`Overview`);

  return (
    <div data-cmp="Reports" className="flex flex-col h-full">
      <Header title={`Reports & Analytics`} subtitle={`Business intelligence, performance metrics, and COD reconciliation`} />

      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`text-xs font-medium px-4 py-2 rounded-lg transition-colors ${
                activeTab === t ? `bg-primary text-white` : `text-muted-foreground hover:text-foreground hover:bg-muted`
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 bg-muted text-muted-foreground text-xs px-3 py-2 rounded-lg hover:text-foreground transition-colors">
            <CalendarIcon className="w-3.5 h-3.5" />
            This Month
          </button>
          <button className="flex items-center gap-1.5 gradient-orange text-white text-xs font-semibold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity">
            <DownloadIcon className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Overview Tab */}
        <div className={activeTab === `Overview` ? `flex flex-col gap-5` : `hidden`}>
          {/* KPIs */}
          <div className="flex gap-4">
            {[
              { label: `Total Orders`, value: `7,950`, sub: `All time`, icon: PackageIcon, color: `text-primary` },
              { label: `Revenue`, value: `39.8M UGX`, sub: `7 months`, icon: TrendingUpIcon, color: `text-success` },
              { label: `Avg Delivery Time`, value: `34 min`, sub: `Target < 45 min`, icon: TruckIcon, color: `text-chart-2` },
              { label: `Avg Rating`, value: `4.5 ★`, sub: `218 reviews`, icon: StarIcon, color: `text-warning` },
              { label: `Total Failed`, value: `338`, sub: `4.25% rate`, icon: AlertTriangleIcon, color: `text-destructive` },
            ].map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="flex-1 bg-card rounded-xl border border-border p-4 shadow-custom">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${k.color}`} />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{k.label}</p>
                  </div>
                  <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{k.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Monthly trend */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-custom">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart2Icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Monthly Order Volume & Revenue</span>
              </div>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ord" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: `#6b7fa0`, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: `#6b7fa0`, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: `#6b7fa0`, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: `#1a2235`, border: `1px solid #1e2d47`, borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: `#a8b8d0` }} />
                  <Area yAxisId="left" type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={2} fill="url(#ord)" name="Orders" />
                  <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#rev)" name="Revenue (UGX)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Zone + Failed */}
          <div className="flex gap-4">
            <div className="flex-1 bg-card rounded-xl border border-border p-5 shadow-custom">
              <p className="text-sm font-semibold text-foreground mb-4">Deliveries by Zone</p>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={zoneData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" nameKey="name">
                      {zoneData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: `#1a2235`, border: `1px solid #1e2d47`, borderRadius: 8, fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: `#a8b8d0` }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex-1 bg-card rounded-xl border border-border p-5 shadow-custom">
              <p className="text-sm font-semibold text-foreground mb-4">Failed Deliveries per Month</p>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: `#6b7fa0`, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: `#6b7fa0`, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: `#1a2235`, border: `1px solid #1e2d47`, borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="failed" fill="#ef4444" radius={[3, 3, 0, 0]} name="Failed Deliveries" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Driver Performance Tab */}
        <div className={activeTab === `Driver Performance` ? `flex flex-col gap-5` : `hidden`}>
          <div className="bg-card rounded-xl border border-border shadow-custom overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <TruckIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Driver Leaderboard</span>
            </div>
            <div className="flex flex-col divide-y divide-border">
              <div className="grid text-[10px] uppercase tracking-wider text-muted-foreground px-5 py-2.5"
                style={{ gridTemplateColumns: `2rem 1.5fr 1fr 1fr 1fr 1fr` }}>
                <span>#</span>
                <span>Driver</span>
                <span>Deliveries</span>
                <span>On-Time %</span>
                <span>Rating</span>
                <span>COD Held</span>
              </div>
              {driverPerf.sort((a, b) => b.deliveries - a.deliveries).map((d, i) => (
                <div key={d.name} className="grid items-center px-5 py-3.5 hover:bg-muted/30 transition-colors"
                  style={{ gridTemplateColumns: `2rem 1.5fr 1fr 1fr 1fr 1fr` }}>
                  <span className={`text-sm font-bold ${i === 0 ? `text-warning` : i === 1 ? `text-muted-foreground` : i === 2 ? `text-chart-2` : `text-muted-foreground/50`}`}>{i + 1}</span>
                  <p className="text-xs font-semibold text-foreground">{d.name}</p>
                  <p className="text-xs text-foreground">{d.deliveries}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-1.5 max-w-16">
                      <div className={`h-1.5 rounded-full ${d.onTime >= 90 ? `bg-success` : d.onTime >= 80 ? `bg-warning` : `bg-destructive`}`} style={{ width: `${d.onTime}%` }} />
                    </div>
                    <span className="text-xs text-foreground">{d.onTime}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-3 h-3 text-warning" />
                    <span className="text-xs text-foreground">{d.rating}</span>
                  </div>
                  <span className={`text-xs font-medium ${d.cod > 0 ? `text-warning` : `text-muted-foreground`}`}>
                    {d.cod > 0 ? `${(d.cod / 1000).toFixed(0)}K UGX` : `—`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5 shadow-custom">
            <p className="text-sm font-semibold text-foreground mb-4">Driver Performance Comparison</p>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={driverPerf} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: `#6b7fa0`, fontSize: 9 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fill: `#6b7fa0`, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: `#1a2235`, border: `1px solid #1e2d47`, borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: `#a8b8d0` }} />
                  <Bar dataKey="deliveries" fill="#f97316" radius={[3, 3, 0, 0]} name="Deliveries" />
                  <Bar dataKey="onTime" fill="#10b981" radius={[3, 3, 0, 0]} name="On-Time %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* COD Reconciliation Tab */}
        <div className={activeTab === `COD Reconciliation` ? `flex flex-col gap-5` : `hidden`}>
          <div className="flex gap-4">
            {[
              { label: `Total COD Collected`, value: `16.4M UGX`, color: `text-success` },
              { label: `Remitted to Merchants`, value: `15.48M UGX`, color: `text-chart-2` },
              { label: `Currently in Field`, value: `1.18M UGX`, color: `text-warning` },
              { label: `Overdue (>24hr)`, value: `320K UGX`, color: `text-destructive` },
            ].map((c) => (
              <div key={c.label} className="flex-1 bg-card rounded-xl border border-border p-4 shadow-custom">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{c.label}</p>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl border border-border p-5 shadow-custom">
            <p className="text-sm font-semibold text-foreground mb-4">COD Collected vs Remitted</p>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={codData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: `#6b7fa0`, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: `#6b7fa0`, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: `#1a2235`, border: `1px solid #1e2d47`, borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: `#a8b8d0` }} />
                  <Bar dataKey="collected" fill="#f97316" radius={[3, 3, 0, 0]} name="Collected (UGX)" />
                  <Bar dataKey="remitted" fill="#10b981" radius={[3, 3, 0, 0]} name="Remitted (UGX)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Zone Heatmap Tab */}
        <div className={activeTab === `Zone Heatmap` ? `flex flex-col gap-5` : `hidden`}>
          <div className="flex gap-4">
            {zoneData.map((z) => (
              <div key={z.name} className="flex-1 bg-card rounded-xl border border-border p-4 shadow-custom">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: z.color }} />
                  <p className="text-xs font-semibold text-foreground">{z.name}</p>
                </div>
                <p className="text-xl font-bold text-foreground">{z.value}%</p>
                <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                  <div className="h-1.5 rounded-full" style={{ width: `${z.value * 3.5}%`, background: z.color }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">of all deliveries</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl border border-border p-5 shadow-custom">
            <p className="text-sm font-semibold text-foreground mb-4">Zone Delivery Trend</p>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: `#6b7fa0`, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: `#6b7fa0`, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: `#1a2235`, border: `1px solid #1e2d47`, borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={2} dot={false} name="Orders" />
                  <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} dot={false} name="Failed" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Customer Reports Tab */}
        <div className={activeTab === `Customer Reports` ? `flex flex-col gap-5` : `hidden`}>
          <div className="flex gap-4">
            {[
              { label: `Total Customers`, value: `1,234`, color: `text-foreground` },
              { label: `Repeat Customers`, value: `68%`, color: `text-success` },
              { label: `Avg Orders/Customer`, value: `6.4`, color: `text-primary` },
              { label: `Customer Complaints`, value: `23`, color: `text-destructive` },
            ].map((c) => (
              <div key={c.label} className="flex-1 bg-card rounded-xl border border-border p-4 shadow-custom">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{c.label}</p>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl border border-border p-5 shadow-custom flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">Customer Growth</p>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: `#6b7fa0`, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: `#6b7fa0`, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: `#1a2235`, border: `1px solid #1e2d47`, borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="orders" stroke="#8b5cf6" strokeWidth={2} fill="url(#custGrad)" name="Orders" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
