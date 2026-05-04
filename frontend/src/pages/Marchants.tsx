import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import api from "../lib/api";
import { toast } from "sonner";
import {
  PlusIcon,
  SearchIcon,
  QrCodeIcon,
  StarIcon,
  TrendingUpIcon,
  PackageIcon,
  PhoneIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UsersIcon,
  ChevronRightIcon,
  AwardIcon,
  UserIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
  DollarSignIcon,
  CreditCardIcon,
  WalletIcon,
} from "lucide-react";

type MerchantRecord = {
  id: string;
  merchant_name: string;
  shop_name: string;
  building_name: string;
  phone: string;
  email: string;
  address: string;
  referral_code: string;
  referred_by?: string;
  tier_level: "Starter" | "Active" | "Priority" | "Elite";
  total_deliveries: number;
  cod_balance: number;
  earnings: number;
  qr_code?: string;
  hub_id?: string;
  status: "pending" | "active" | "suspended";
  last_login?: string;
  createdAt?: string;
};

type MerchantDashboard = {
  merchant: MerchantRecord;
  dashboard: {
    referralCount: number;
    tier_level: string;
    total_deliveries: number;
    cod_balance: number;
    earnings: number;
    referrals: { totalAmount: number; totalCount: number };
    cod: { totalAmount: number; totalCount: number };
    payouts: { totalAmount: number; totalCount: number };
    earnings_breakdown: { totalAmount: number; totalCount: number };
    recentTransactions: any[];
  };
};

type CreateMerchantForm = {
  merchant_name: string;
  shop_name: string;
  building_name: string;
  phone: string;
  email: string;
  address: string;
  password: string;
  referred_by: string;
  tier_level: "Starter" | "Active" | "Priority" | "Elite";
  hub_id: string;
};

const levelConfig: Record<string, { label: string; classes: string; min: number }> = {
  Starter: { label: "Starter", classes: "text-muted-foreground bg-muted border-border", min: 0 },
  Active: { label: "Active", classes: "text-chart-2 bg-chart-2/10 border-chart-2/20", min: 10 },
  Priority: { label: "Priority", classes: "text-primary bg-primary/10 border-primary/20", min: 50 },
  Elite: { label: "Elite", classes: "text-warning bg-warning/10 border-warning/20", min: 200 },
};

const formatUGX = (value: number | undefined | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US").format(Math.round(value));
};

const levelProgress = (level: string, orders: number) => {
  const levels = Object.values(levelConfig);
  const idx = levels.findIndex((l) => l.label === level);
  const next = levels[idx + 1];
  if (!next) return 100;
  const current = levels[idx].min;
  return Math.min(100, Math.round(((orders - current) / (next.min - current)) * 100));
};

const emptyForm = (): CreateMerchantForm => ({
  merchant_name: "",
  shop_name: "",
  building_name: "",
  phone: "",
  email: "",
  address: "",
  password: "",
  referred_by: "",
  tier_level: "Starter",
  hub_id: "",
});

export default function Merchants() {
  const [merchants, setMerchants] = useState<MerchantRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selected, setSelected] = useState<MerchantRecord | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateMerchantForm>(emptyForm());
  const [dashboard, setDashboard] = useState<MerchantDashboard | null>(null);

  const filtered = useMemo(() => {
    return merchants.filter((m) => {
      const matchSearch =
        m.merchant_name.toLowerCase().includes(search.toLowerCase()) ||
        m.shop_name.toLowerCase().includes(search.toLowerCase()) ||
        m.phone.includes(search) ||
        m.email.toLowerCase().includes(search.toLowerCase());
      const matchLevel = selectedLevel === "All" || m.tier_level === selectedLevel;
      return matchSearch && matchLevel;
    });
  }, [merchants, search, selectedLevel]);

  const fetchMerchants = async () => {
    const { data } = await api.get("/auth/merchants", { params: { limit: 100 } });
    const merchantItems = (data?.data?.merchants || []) as MerchantRecord[];
    setMerchants(merchantItems);
  };

  const fetchMerchantDashboard = async (merchantId: string) => {
    const { data } = await api.get(`/auth/merchants/${merchantId}/dashboard`);
    const dashboardData = data?.data as MerchantDashboard;
    setDashboard(dashboardData);
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      await fetchMerchants();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load merchants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (selected) {
      fetchMerchantDashboard(selected.id);
    } else {
      setDashboard(null);
    }
  }, [selected]);

  const createMerchant = async () => {
    if (
      !createForm.merchant_name ||
      !createForm.shop_name ||
      !createForm.building_name ||
      !createForm.phone ||
      !createForm.email ||
      !createForm.address ||
      !createForm.password
    ) {
      toast.error("Please fill in all required merchant fields");
      return;
    }

    if (createForm.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setActionLoading("create-merchant");

    try {
      await api.post("/auth/merchants", {
        merchant_name: createForm.merchant_name,
        shop_name: createForm.shop_name,
        building_name: createForm.building_name,
        phone: createForm.phone,
        email: createForm.email,
        address: createForm.address,
        password: createForm.password,
        referred_by: createForm.referred_by || undefined,
        tier_level: createForm.tier_level || "Starter",
      });

      toast.success("Merchant created successfully");
      setShowAdd(false);
      setCreateForm(emptyForm());
      await fetchMerchants();
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      const backendErrors = error.response?.data?.errors;
      const errorMessages = Array.isArray(backendErrors)
        ? backendErrors
        : typeof backendErrors === 'string'
          ? [backendErrors]
          : [];

      if (errorMessages.length > 0) {
        toast.error(errorMessages.join(', '));
      } else {
        toast.error(backendMessage || "Merchant creation failed");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const updateMerchant = async (merchantId: string, updates: Partial<MerchantRecord>) => {
    setActionLoading(`update-${merchantId}`);
    try {
      await api.patch(`/auth/merchants/${merchantId}`, updates);
      toast.success("Merchant updated");
      await fetchMerchants();
      if (selected?.id === merchantId) {
        await fetchMerchantDashboard(merchantId);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setActionLoading(null);
    }
  };

  const viewQrCode = async (merchantId: string) => {
    setActionLoading(`qr-${merchantId}`);
    try {
      const { data } = await api.get(`/auth/merchants/${merchantId}/qr-code`);
      const qrData = data?.data;
      if (qrData?.qr_code) {
        window.open(qrData.qr_code, "_blank");
      } else {
        toast.error("QR code not available");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "QR code fetch failed");
    } finally {
      setActionLoading(null);
    }
  };

  const onRefreshClick = async () => {
    setActionLoading("refresh");
    await refreshAll();
    setActionLoading(null);
  };

  const summaryStats = useMemo(() => {
    const totalMerchants = merchants.length;
    const eliteCount = merchants.filter((m) => m.tier_level === "Elite").length;
    const priorityCount = merchants.filter((m) => m.tier_level === "Priority").length;
    const totalCodPending = merchants.reduce((sum, m) => sum + (m.cod_balance || 0), 0);
    const totalReferrals = merchants.reduce((sum, m) => sum + (dashboard?.dashboard?.referralCount || 0), 0);

    return [
      { label: "Total Merchants", value: totalMerchants.toString(), color: "text-foreground" },
      { label: "Elite Tier", value: eliteCount.toString(), color: "text-warning" },
      { label: "Priority Tier", value: priorityCount.toString(), color: "text-primary" },
      { label: "Total COD Pending", value: `${formatUGX(totalCodPending)} UGX`, color: "text-destructive" },
      { label: "M2M Referrals", value: totalReferrals.toString(), color: "text-success" },
    ];
  }, [merchants, dashboard]);

  return (
    <div data-cmp="Merchants" className="flex flex-col h-full">
      <Header title="Merchants" subtitle={`${merchants.length} registered merchants · M2M referral system active`} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card/50">
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 gradient-orange text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity shadow-custom"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Add Merchant
            </button>
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 flex-1 max-w-xs">
              <SearchIcon className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                className="bg-transparent text-xs text-foreground placeholder-muted-foreground outline-none w-full"
                placeholder="Search merchants..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            {["All", "Starter", "Active", "Priority", "Elite"].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  selectedLevel === level ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {level}
              </button>
            ))}
            <button
              onClick={onRefreshClick}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {actionLoading === "refresh" ? <LoaderCircleIcon className="w-3.5 h-3.5 animate-spin" /> : <RefreshCwIcon className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex gap-3 px-6 py-4">
            {summaryStats.map((stat) => (
              <div key={stat.label} className="flex-1 bg-card rounded-xl border border-border px-4 py-3 shadow-custom">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="flex flex-wrap gap-4">
              {loading ? (
                <div className="w-full px-4 py-6 text-sm text-muted-foreground inline-flex items-center gap-2">
                  <LoaderCircleIcon className="w-4 h-4 animate-spin" />
                  Loading merchants...
                </div>
              ) : null}

              {!loading && filtered.length === 0 ? (
                <div className="w-full px-4 py-6 text-sm text-muted-foreground">No merchants match current filters.</div>
              ) : null}

              {filtered.map((m) => {
                const lc = levelConfig[m.tier_level];
                const progress = levelProgress(m.tier_level, m.total_deliveries);
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className={`w-80 bg-card rounded-xl border shadow-custom cursor-pointer hover:border-primary/30 transition-all p-4 flex flex-col gap-3 ${
                      selected?.id === m.id ? "border-primary/50 wolan-glow" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 gradient-orange rounded-xl flex items-center justify-center text-white text-sm font-bold">
                          {m.shop_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{m.shop_name}</p>
                          <p className="text-[10px] text-muted-foreground">{m.merchant_name}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border flex-shrink-0 ${lc.classes}`}>
                        {m.tier_level}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1 bg-muted rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-foreground">{m.total_deliveries}</p>
                        <p className="text-[10px] text-muted-foreground">All Time</p>
                      </div>
                      <div className="flex-1 bg-muted rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-primary">{dashboard?.dashboard?.referralCount || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Referrals</p>
                      </div>
                      <div className="flex-1 bg-muted rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-success">{dashboard?.dashboard?.cod?.totalCount || 0}</p>
                        <p className="text-[10px] text-muted-foreground">COD Orders</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-muted-foreground">Level Progress</span>
                        <span className="text-[10px] font-bold text-foreground">{progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-700 ${
                            m.tier_level === "Elite" ? "gradient-orange" : m.tier_level === "Priority" ? "gradient-blue" : "gradient-green"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Wallet Balance</p>
                        <p className="text-xs font-bold text-success">{formatUGX(m.earnings)} UGX</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Pending COD</p>
                        <p className={`text-xs font-bold ${m.cod_balance > 0 ? "text-warning" : "text-muted-foreground"}`}>
                          {formatUGX(m.cod_balance)} UGX
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border">
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="w-3 h-3" />
                        {m.address}
                      </div>
                      <div className="flex items-center gap-1">
                        <PhoneIcon className="w-3 h-3" />
                        {m.phone}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`w-72 border-l border-border bg-card flex flex-col flex-shrink-0 overflow-y-auto transition-opacity duration-300 ${selected ? "opacity-100" : "opacity-40"}`}>
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 gradient-orange rounded-xl flex items-center justify-center text-white font-bold">
                {selected?.shop_name.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "—"}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{selected?.shop_name ?? "Select a merchant"}</p>
                <p className="text-xs text-muted-foreground">{selected?.id ?? "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${levelConfig[selected?.tier_level ?? "Starter"]?.classes}`}>
                {selected?.tier_level ?? "—"}
              </span>
              <span className="text-[10px] text-muted-foreground">Joined {selected?.createdAt ? new Date(selected.createdAt).toLocaleDateString() : "—"}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-5">
            {[
              { icon: UserIcon, label: "Owner", value: selected?.merchant_name },
              { icon: PhoneIcon, label: "Phone", value: selected?.phone },
              { icon: MapPinIcon, label: "Address", value: selected?.address },
              { icon: PackageIcon, label: "Total Deliveries", value: String(selected?.total_deliveries ?? "—") },
              { icon: UsersIcon, label: "M2M Referrals", value: String(dashboard?.dashboard?.referralCount ?? "—") },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    <p className="text-xs font-medium text-foreground">{item.value ?? "—"}</p>
                  </div>
                </div>
              );
            })}

            <div className="bg-muted rounded-xl p-3 flex flex-col gap-2 mt-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Financial Overview</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Wallet Balance</span>
                <span className="text-xs font-bold text-success">{formatUGX(selected?.earnings)} UGX</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Pending COD</span>
                <span className={`text-xs font-bold ${selected?.cod_balance ? "text-warning" : "text-muted-foreground"}`}>
                  {formatUGX(selected?.cod_balance)} UGX
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">COD Status</span>
                <span className={`text-xs font-semibold ${selected?.cod_balance ? "text-primary" : "text-muted-foreground"}`}>
                  {selected?.cod_balance ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <button
                onClick={() => selected && viewQrCode(selected.id)}
                disabled={!selected || actionLoading === `qr-${selected.id}`}
                className="w-full gradient-orange text-white text-xs font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {selected && actionLoading === `qr-${selected.id}` ? "Loading..." : "View QR Code"}
              </button>
              <button
                onClick={() => selected && updateMerchant(selected.id, { tier_level: selected.tier_level === "Elite" ? "Priority" : "Elite" })}
                disabled={!selected || actionLoading === `update-${selected.id}`}
                className="w-full bg-muted text-foreground text-xs font-medium py-2.5 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              >
                Upgrade Level
              </button>
              <button
                onClick={() => selected && updateMerchant(selected.id, { status: selected.status === "active" ? "suspended" : "active" })}
                disabled={!selected || actionLoading === `update-${selected.id}`}
                className="w-full bg-muted text-foreground text-xs font-medium py-2.5 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              >
                {selected?.status === "active" ? "Suspend Account" : "Activate Account"}
              </button>
              <button className="w-full bg-muted text-foreground text-xs font-medium py-2.5 rounded-lg hover:bg-accent transition-colors flex items-center justify-center gap-2">
                <ChevronRightIcon className="w-3.5 h-3.5" />
                View Orders
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${showAdd ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="bg-card border border-border rounded-2xl p-6 w-[480px] shadow-custom flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">Add New Merchant</h2>
            </div>
            <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none">✕</button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Business Name</label>
              <input
                value={createForm.merchant_name}
                onChange={(event) => setCreateForm((current) => ({ ...current, merchant_name: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Shop Name</label>
              <input
                value={createForm.shop_name}
                onChange={(event) => setCreateForm((current) => ({ ...current, shop_name: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Building Name</label>
              <input
                value={createForm.building_name}
                onChange={(event) => setCreateForm((current) => ({ ...current, building_name: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Phone Number</label>
              <input
                value={createForm.phone}
                onChange={(event) => setCreateForm((current) => ({ ...current, phone: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Email</label>
              <input
                type="email"
                value={createForm.email}
                onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Address</label>
              <input
                value={createForm.address}
                onChange={(event) => setCreateForm((current) => ({ ...current, address: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Password</label>
              <input
                type="password"
                value={createForm.password}
                onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Referral Code (Optional)</label>
              <input
                value={createForm.referred_by}
                onChange={(event) => setCreateForm((current) => ({ ...current, referred_by: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Starting Level</label>
              <select
                value={createForm.tier_level}
                onChange={(event) => setCreateForm((current) => ({ ...current, tier_level: event.target.value as CreateMerchantForm['tier_level'] }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary transition-colors"
              >
                <option value="Starter">Starter</option>
                <option value="Active">Active</option>
                <option value="Priority">Priority</option>
                <option value="Elite">Elite</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAdd(false)} className="flex-1 bg-muted text-foreground text-xs font-medium py-2.5 rounded-lg hover:bg-accent transition-colors">Cancel</button>
            <button
              onClick={createMerchant}
              className="flex-1 gradient-orange text-white text-xs font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={actionLoading === "create-merchant"}
            >
              {actionLoading === "create-merchant" ? "Creating..." : "Register Merchant"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
