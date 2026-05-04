import { useState } from "react";
import Header from "../components/Header";
import {
  BuildingIcon,
  TruckIcon,
  BellIcon,
  UsersIcon,
  ShieldIcon,
  PaletteIcon,
  GlobeIcon,
  CreditCardIcon,
  SaveIcon,
  CheckCircleIcon,
} from "lucide-react";

const sections = [
  { key: `business`, label: `Business`, icon: BuildingIcon },
  { key: `dispatch`, label: `Dispatch`, icon: TruckIcon },
  { key: `notifications`, label: `Notifications`, icon: BellIcon },
  { key: `team`, label: `Team & Users`, icon: UsersIcon },
  { key: `security`, label: `Security`, icon: ShieldIcon },
  { key: `branding`, label: `Branding`, icon: PaletteIcon },
  { key: `integrations`, label: `Integrations`, icon: GlobeIcon },
  { key: `billing`, label: `Billing`, icon: CreditCardIcon },
];

type Toggle = { label: string; desc: string; on: boolean };

const initialNotifications: Toggle[] = [
  { label: `New Order Alert`, desc: `Notify dispatchers when a new order is placed`, on: true },
  { label: `Failed Delivery SMS`, desc: `Send SMS to customer when delivery fails`, on: true },
  { label: `GPS Dark Alert`, desc: `Alert when rider GPS goes offline`, on: true },
  { label: `COD Overdue Alert`, desc: `Alert when COD not remitted after 24 hours`, on: true },
  { label: `Rider Check-In`, desc: `Notify hub manager when rider checks in`, on: false },
  { label: `Daily Report Email`, desc: `Send daily summary report to manager email`, on: true },
  { label: `Low Rider Count`, desc: `Alert when available riders drop below threshold`, on: false },
];

const team = [
  { name: `Admin Wolan`, email: `admin@wolan.ug`, role: `Super Admin`, active: true },
  { name: `James Okello`, email: `james@wolan.ug`, role: `Hub Manager`, active: true },
  { name: `Patricia Nambatya`, email: `patricia@wolan.ug`, role: `Dispatcher`, active: true },
  { name: `Brian Ssekandi`, email: `brian@wolan.ug`, role: `Dispatcher`, active: false },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState(`business`);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleNotification = (idx: number) => {
    setNotifications((prev) => prev.map((n, i) => (i === idx ? { ...n, on: !n.on } : n)));
  };

  return (
    <div data-cmp="Settings" className="flex flex-col h-full">
      <Header title={`Settings`} subtitle={`System configuration, team management, and integrations`} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar nav */}
        <div className="w-52 border-r border-border bg-card flex-shrink-0 p-3 flex flex-col gap-1">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left w-full ${
                  activeSection === s.key
                    ? `bg-primary/10 text-primary border border-primary/20`
                    : `text-muted-foreground hover:text-foreground hover:bg-muted`
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Business Settings */}
          <div className={activeSection === `business` ? `flex flex-col gap-5` : `hidden`}>
            <div className="bg-card rounded-xl border border-border p-5 shadow-custom flex flex-col gap-4">
              <p className="text-sm font-bold text-foreground border-b border-border pb-3">Business Information</p>
              <div className="flex flex-wrap gap-4">
                {[
                  { label: `Company Name`, value: `Wolan Logistics SMC Ltd` },
                  { label: `Trading Name`, value: `Wolan Logistics` },
                  { label: `TIN / Tax ID`, value: `1008765432` },
                  { label: `Country`, value: `Uganda` },
                  { label: `City`, value: `Kampala` },
                  { label: `Main Hub Address`, value: `Pioneer Mall, Ntinda` },
                  { label: `Support Phone`, value: `+256 800 000 000` },
                  { label: `Support Email`, value: `support@wolan.ug` },
                ].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5 w-64">
                    <label className="text-xs text-muted-foreground">{f.label}</label>
                    <input defaultValue={f.value} className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 shadow-custom flex flex-col gap-4">
              <p className="text-sm font-bold text-foreground border-b border-border pb-3">Operating Hours</p>
              <div className="flex flex-wrap gap-4">
                {[`Monday – Friday`, `Saturday`, `Sunday`].map((d) => (
                  <div key={d} className="flex flex-col gap-1.5 w-48">
                    <label className="text-xs text-muted-foreground">{d}</label>
                    <input defaultValue={d === `Sunday` ? `Closed` : `07:00 – 21:00`} className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dispatch Settings */}
          <div className={activeSection === `dispatch` ? `flex flex-col gap-5` : `hidden`}>
            <div className="bg-card rounded-xl border border-border p-5 shadow-custom flex flex-col gap-4">
              <p className="text-sm font-bold text-foreground border-b border-border pb-3">Dispatch Configuration</p>
              <div className="flex flex-wrap gap-4">
                {[
                  { label: `Max Orders per Rider`, value: `8` },
                  { label: `Delivery ETA Default (min)`, value: `45` },
                  { label: `Stage Assignment Zone Radius (km)`, value: `3` },
                  { label: `Idle Alert Threshold (min)`, value: `15` },
                  { label: `GPS Dark Alert Threshold (min)`, value: `10` },
                  { label: `COD Remit Deadline (hrs)`, value: `24` },
                ].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5 w-64">
                    <label className="text-xs text-muted-foreground">{f.label}</label>
                    <input defaultValue={f.value} type="number" className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 shadow-custom flex flex-col gap-4">
              <p className="text-sm font-bold text-foreground border-b border-border pb-3">Auto-Dispatch Rules</p>
              {[
                { label: `Auto-assign nearest available rider`, on: true },
                { label: `Prioritize Elite merchant orders`, on: true },
                { label: `Block offline riders from new assignments`, on: true },
                { label: `Allow rider self-assignment via app`, on: false },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between">
                  <p className="text-xs text-foreground">{r.label}</p>
                  <div className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${r.on ? `bg-primary` : `bg-muted`}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${r.on ? `left-4` : `left-0.5`}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className={activeSection === `notifications` ? `flex flex-col gap-5` : `hidden`}>
            <div className="bg-card rounded-xl border border-border p-5 shadow-custom flex flex-col gap-4">
              <p className="text-sm font-bold text-foreground border-b border-border pb-3">Notification Preferences</p>
              {notifications.map((n, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-xs font-medium text-foreground">{n.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{n.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleNotification(i)}
                    className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ml-6 ${n.on ? `bg-primary` : `bg-muted`}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${n.on ? `left-4` : `left-0.5`}`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-card rounded-xl border border-border p-5 shadow-custom flex flex-col gap-4">
              <p className="text-sm font-bold text-foreground border-b border-border pb-3">Alert Channels</p>
              {[`SMS (Africa's Talking)`, `WhatsApp Notifications`, `Email Reports`, `In-App Push`].map((c) => (
                <div key={c} className="flex items-center justify-between">
                  <p className="text-xs text-foreground">{c}</p>
                  <div className={`w-9 h-5 rounded-full relative cursor-pointer bg-primary`}>
                    <div className="absolute top-0.5 left-4 w-4 h-4 bg-white rounded-full shadow" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div className={activeSection === `team` ? `flex flex-col gap-5` : `hidden`}>
            <div className="bg-card rounded-xl border border-border shadow-custom overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Team Members</p>
                <button className="flex items-center gap-1.5 gradient-orange text-white text-xs font-semibold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity">
                  <UsersIcon className="w-3.5 h-3.5" />
                  Invite User
                </button>
              </div>
              <div className="flex flex-col divide-y divide-border">
                {team.map((u) => (
                  <div key={u.email} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                    <div className="w-8 h-8 gradient-blue rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {u.name.split(` `).map((n) => n[0]).join(``)}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground">{u.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{u.role}</span>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${u.active ? `text-success bg-success/10 border-success/20` : `text-muted-foreground bg-muted border-border`}`}>
                      {u.active ? `Active` : `Inactive`}
                    </span>
                    <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Edit</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 shadow-custom flex flex-col gap-4">
              <p className="text-sm font-bold text-foreground border-b border-border pb-3">Role Permissions</p>
              {[
                { role: `Super Admin`, perms: `Full access to all features, hubs, and settings` },
                { role: `Hub Manager`, perms: `Manage riders, orders, and reports for assigned hub` },
                { role: `Dispatcher`, perms: `Assign and track orders, view riders, view map` },
                { role: `Finance`, perms: `View and export reports, COD reconciliation only` },
              ].map((r) => (
                <div key={r.role} className="flex items-start gap-3">
                  <div className="w-6 h-6 gradient-orange rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShieldIcon className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{r.role}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.perms}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className={activeSection === `security` ? `flex flex-col gap-5` : `hidden`}>
            <div className="bg-card rounded-xl border border-border p-5 shadow-custom flex flex-col gap-4">
              <p className="text-sm font-bold text-foreground border-b border-border pb-3">Security & Access</p>
              {[
                { label: `Two-Factor Authentication`, desc: `Require 2FA for all admin logins`, on: false },
                { label: `Session Timeout (30 min)`, desc: `Auto-logout after inactivity`, on: true },
                { label: `Login IP Whitelist`, desc: `Only allow logins from approved IPs`, on: false },
                { label: `Audit Log`, desc: `Track all admin actions and changes`, on: true },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-foreground">{r.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</p>
                  </div>
                  <div className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${r.on ? `bg-primary` : `bg-muted`}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${r.on ? `left-4` : `left-0.5`}`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-card rounded-xl border border-border p-5 shadow-custom flex flex-col gap-3">
              <p className="text-sm font-bold text-foreground border-b border-border pb-3">Rider Security Protocols</p>
              {[
                { label: `Security Bond Amount (UGX)`, value: `250000` },
                { label: `Max COD per Rider (UGX)`, value: `1000000` },
                { label: `Package Limit per Run`, value: `10` },
                { label: `Check-in Required (Daily)`, value: `Yes` },
              ].map((f) => (
                <div key={f.label} className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <input defaultValue={f.value} className="bg-input rounded-lg px-3 py-1.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors w-32 text-right" />
                </div>
              ))}
            </div>
          </div>

          {/* Branding */}
          <div className={activeSection === `branding` ? `flex flex-col gap-5` : `hidden`}>
            <div className="bg-card rounded-xl border border-border p-5 shadow-custom flex flex-col gap-5">
              <p className="text-sm font-bold text-foreground border-b border-border pb-3">Brand Customization</p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 gradient-orange rounded-2xl flex items-center justify-center text-white text-2xl font-black">W</div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Wolan Logistics</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Current logo</p>
                  <button className="mt-2 text-xs text-primary hover:underline">Upload new logo</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { label: `Primary Color`, value: `#f97316` },
                  { label: `Brand Background`, value: `#0b1120` },
                  { label: `Card Color`, value: `#111827` },
                ].map((c) => (
                  <div key={c.label} className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">{c.label}</label>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg border border-border flex-shrink-0" style={{ background: c.value }} />
                      <input defaultValue={c.value} className="bg-input rounded-lg px-3 py-2 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Integrations */}
          <div className={activeSection === `integrations` ? `flex flex-col gap-5` : `hidden`}>
            <div className="bg-card rounded-xl border border-border p-5 shadow-custom flex flex-col gap-4">
              <p className="text-sm font-bold text-foreground border-b border-border pb-3">Third-Party Integrations</p>
              {[
                { name: `Africa's Talking SMS`, status: `Connected`, key: `AT-****-****-8899`, color: `text-success` },
                { name: `Flutterwave Payments`, status: `Connected`, key: `FW-****-****-1234`, color: `text-success` },
                { name: `Google Maps API`, status: `Connected`, key: `AIza****`, color: `text-success` },
                { name: `Traccar GPS`, status: `Connected`, key: `http://gps.wolan.ug:8082`, color: `text-success` },
                { name: `Mictrack Device API`, status: `Connected`, key: `MT-****`, color: `text-success` },
                { name: `AWS S3 Storage`, status: `Configured`, key: `s3://wolan-bucket`, color: `text-chart-2` },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.key}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${s.color}`}>{s.status}</span>
                    <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Configure</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Billing */}
          <div className={activeSection === `billing` ? `flex flex-col gap-5` : `hidden`}>
            <div className="bg-card rounded-xl border border-border p-5 shadow-custom flex flex-col gap-4">
              <p className="text-sm font-bold text-foreground border-b border-border pb-3">Subscription & Billing</p>
              <div className="gradient-orange rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white text-xs font-bold">Enterprise Plan</p>
                  <p className="text-white/70 text-[10px] mt-0.5">Unlimited hubs · Priority support</p>
                </div>
                <div className="text-right">
                  <p className="text-white text-lg font-black">Active</p>
                  <p className="text-white/70 text-[10px]">Renews Feb 2026</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: `SMS Credits Remaining`, value: `12,400 credits` },
                  { label: `API Calls This Month`, value: `84,291 / 500,000` },
                  { label: `Storage Used`, value: `2.4 GB / 50 GB` },
                ].map((b) => (
                  <div key={b.label} className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{b.label}</p>
                    <p className="text-xs font-medium text-foreground">{b.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-custom ${
                saved ? `bg-success text-white` : `gradient-orange text-white hover:opacity-90`
              }`}
            >
              {saved ? <CheckCircleIcon className="w-4 h-4" /> : <SaveIcon className="w-4 h-4" />}
              {saved ? `Saved!` : `Save Changes`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
