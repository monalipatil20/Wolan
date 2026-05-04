import Header from "../components/Header";
import StatCard from "../components/StatCard";
import {
  PackageIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  StarIcon,
  AlertTriangleIcon,
  ZapIcon,
  MapPinIcon,
  ArrowRightIcon,
  ActivityIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

const deliveryData = [
  { day: `Mon`, completed: 88, failed: 6 },
  { day: `Tue`, completed: 102, failed: 8 },
  { day: `Wed`, completed: 95, failed: 4 },
  { day: `Thu`, completed: 118, failed: 7 },
  { day: `Fri`, completed: 134, failed: 9 },
  { day: `Sat`, completed: 127, failed: 5 },
  { day: `Sun`, completed: 92, failed: 3 },
];

const areaData = [
  { time: `6am`, orders: 4 },
  { time: `8am`, orders: 18 },
  { time: `10am`, orders: 35 },
  { time: `12pm`, orders: 52 },
  { time: `2pm`, orders: 46 },
  { time: `4pm`, orders: 61 },
  { time: `6pm`, orders: 78 },
  { time: `8pm`, orders: 44 },
  { time: `10pm`, orders: 12 },
];

const recentOrders = [
  { id: `WL-00234`, merchant: `Zara Boutique`, zone: `Ntinda`, status: `Out for Delivery`, rider: `Moses K.`, time: `14 min ago` },
  { id: `WL-00233`, merchant: `TechHub Store`, zone: `CBD`, status: `Delivered`, rider: `Grace A.`, time: `28 min ago` },
  { id: `WL-00232`, merchant: `FreshMart`, zone: `Makindye`, status: `At Hub`, rider: `—`, time: `42 min ago` },
  { id: `WL-00231`, merchant: `Kampala Bakes`, zone: `Kawempe`, status: `Failed`, rider: `John B.`, time: `1 hr ago` },
  { id: `WL-00230`, merchant: `Elite Electronics`, zone: `Nakawa`, status: `Delivered`, rider: `Sarah O.`, time: `1 hr ago` },
];

const stagingData = [
  { label: `Incoming`, count: 8, color: `bg-primary` },
  { label: `Inspection`, count: 3, color: `bg-warning` },
  { label: `Zone Sort`, count: 12, color: `bg-chart-2` },
  { label: `Ready for Rider`, count: 7, color: `bg-success` },
  { label: `Out`, count: 22, color: `bg-purple-500` },
];

const statusColor: Record<string, string> = {
  "Out for Delivery": `text-primary bg-primary/10`,
  "Delivered": `text-success bg-success/10`,
  "At Hub": `text-warning bg-warning/10`,
  "Failed": `text-destructive bg-destructive/10`,
  "Pending": `text-muted-foreground bg-muted`,
};

export default function Dashboard() {
  const goalTotal = 150;
  const goalDone = 92;
  const goalPercent = Math.round((goalDone / goalTotal) * 100);

  return (
    <div data-cmp="Dashboard" className="flex flex-col h-full">
      <Header title={`Dashboard`} subtitle={`Pioneer Mall Hub · Live Overview`} />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
        {/* KPI Row */}
        <div className="flex gap-4">
          <div className="flex-1">
            <StatCard
              title={`Completed Today`}
              value={`92`}
              sub={`+12% vs yesterday`}
              icon={CheckCircleIcon}
              gradient={`gradient-green`}
              trend={`↑ 12 more than yesterday`}
              trendUp={true}
            />
          </div>
          <div className="flex-1">
            <StatCard
              title={`Pending Orders`}
              value={`23`}
              sub={`Awaiting dispatch`}
              icon={ClockIcon}
              gradient={`gradient-orange`}
              trend={`3 approaching SLA breach`}
              trendUp={false}
            />
          </div>
          <div className="flex-1">
            <StatCard
              title={`Failed Deliveries`}
              value={`7`}
              sub={`4.6% failure rate`}
              icon={XCircleIcon}
              gradient={`gradient-red`}
              trend={`↓ 2 fewer than yesterday`}
              trendUp={true}
            />
          </div>
          <div className="flex-1">
            <StatCard
              title={`Online Riders`}
              value={`18`}
              sub={`5 on delivery · 2 idle`}
              icon={TruckIcon}
              gradient={`gradient-blue`}
              trend={`3 riders gone dark`}
              trendUp={false}
            />
          </div>
          <div className="flex-1">
            <StatCard
              title={`On-Time Rate`}
              value={`87%`}
              sub={`Target: 90%`}
              icon={ZapIcon}
              gradient={`gradient-purple`}
              trend={`↑ 3% improvement this week`}
              trendUp={true}
            />
          </div>
          <div className="flex-1">
            <StatCard
              title={`Avg. Rating`}
              value={`4.6`}
              sub={`Order · Driver: 4.4`}
              icon={StarIcon}
              gradient={`gradient-orange`}
              trend={`Based on 218 reviews`}
              trendUp={true}
            />
          </div>
        </div>

        {/* Daily Target + Charts */}
        <div className="flex gap-4">
          {/* Daily Target */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-custom w-64 flex flex-col gap-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Daily Target</span>
              <span className="text-xs text-muted-foreground">Today</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              {/* Circle progress */}
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1e2d47" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - goalPercent / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">{goalDone}</span>
                  <span className="text-xs text-muted-foreground">of {goalTotal}</span>
                </div>
              </div>
              <div className="flex items-center justify-between w-full text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-bold text-primary">{goalPercent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="gradient-orange h-2 rounded-full transition-all duration-700" style={{ width: `${goalPercent}%` }} />
              </div>
              <p className="text-xs text-muted-foreground text-center">{goalTotal - goalDone} more to hit today's goal</p>
            </div>
          </div>

          {/* Area chart */}
          <div className="flex-1 bg-card rounded-xl border border-border p-5 shadow-custom flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Order Volume — Today</span>
              <div className="flex items-center gap-1.5 text-xs text-success">
                <ActivityIcon className="w-3.5 h-3.5" />
                <span>Live</span>
                <div className="w-1.5 h-1.5 rounded-full bg-success status-pulse" />
              </div>
            </div>
            <div className="flex-1 min-h-0" style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fill: `#6b7fa0`, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: `#6b7fa0`, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: `#1a2235`, border: `1px solid #1e2d47`, borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: `#a8b8d0` }}
                    itemStyle={{ color: `#f97316` }}
                  />
                  <Area type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={2} fill="url(#colorOrders)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar chart */}
          <div className="w-72 bg-card rounded-xl border border-border p-5 shadow-custom flex flex-col gap-3 flex-shrink-0">
            <span className="text-sm font-semibold text-foreground">Weekly Deliveries</span>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deliveryData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: `#6b7fa0`, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: `#6b7fa0`, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: `#1a2235`, border: `1px solid #1e2d47`, borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: `#a8b8d0` }}
                  />
                  <Bar dataKey="completed" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="failed" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Package Staging + Alerts + Recent Orders */}
        <div className="flex gap-4">
          {/* Package Staging */}
          <div className="w-64 bg-card rounded-xl border border-border p-5 shadow-custom flex-shrink-0 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <PackageIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Staging Shelf</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {stagingData.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{s.count}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">Total in hub: <span className="font-bold text-foreground">52</span></p>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="w-72 bg-card rounded-xl border border-border p-5 shadow-custom flex-shrink-0 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="w-4 h-4 text-warning" />
                <span className="text-sm font-semibold text-foreground">Active Alerts</span>
              </div>
              <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-medium">4</span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { type: `GPS Dark`, desc: `Moses K. · 18 min offline`, level: `destructive` },
                { type: `Location Mismatch`, desc: `WL-00218 · 620m gap`, level: `destructive` },
                { type: `COD Limit`, desc: `Grace A. · 920,000 UGX`, level: `warning` },
                { type: `Idle Rider`, desc: `John B. · Stationary 14min`, level: `warning` },
              ].map((alert, i) => (
                <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${
                  alert.level === `destructive` ? `bg-destructive/5 border-destructive/20` : `bg-warning/5 border-warning/20`
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 status-pulse ${
                    alert.level === `destructive` ? `bg-destructive` : `bg-warning`
                  }`} />
                  <div>
                    <p className={`text-xs font-semibold ${alert.level === `destructive` ? `text-destructive` : `text-warning`}`}>{alert.type}</p>
                    <p className="text-xs text-muted-foreground">{alert.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="flex-1 bg-card rounded-xl border border-border shadow-custom flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <PackageIcon className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Recent Orders</span>
              </div>
              <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                View All <ArrowRightIcon className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="w-20 flex-shrink-0">
                    <p className="text-xs font-bold text-primary">{order.id}</p>
                    <p className="text-[10px] text-muted-foreground">{order.time}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{order.merchant}</p>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPinIcon className="w-3 h-3" />
                      <span className="text-[10px]">{order.zone}</span>
                    </div>
                  </div>
                  <div className="w-24 flex-shrink-0">
                    <p className="text-xs text-muted-foreground">{order.rider}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${statusColor[order.status] ?? `text-muted-foreground bg-muted`}`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Avg Times Row */}
        <div className="flex gap-4">
          {[
            { label: `Avg Pickup-to-Delivery`, value: `34 min`, target: `< 45 min`, ok: true },
            { label: `Avg Placement-to-Delivery`, value: `52 min`, target: `< 60 min`, ok: true },
            { label: `Avg Driver Response`, value: `4.2 min`, target: `< 7 min`, ok: true },
            { label: `Failed Delivery Rate`, value: `4.6%`, target: `< 5%`, ok: true },
            { label: `COD in Field`, value: `3,240,000 UGX`, target: `Max 5M UGX`, ok: true },
          ].map((m) => (
            <div key={m.label} className="flex-1 bg-card rounded-xl border border-border p-4 shadow-custom">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
              <p className="text-lg font-bold text-foreground">{m.value}</p>
              <p className={`text-[10px] mt-1 ${m.ok ? `text-success` : `text-destructive`}`}>{m.target} ✓</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
