import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import { useAuth } from "../contexts/AuthContext";
import api from "../lib/api";
import { toast } from "sonner";
import {
  AlertTriangleIcon,
  Building2Icon,
  CameraIcon,
  CheckCircle2Icon,
  Clock3Icon,
  CreditCardIcon,
  LoaderCircleIcon,
  LocateFixedIcon,
  MapPinnedIcon,
  MicIcon,
  NavigationIcon,
  PhoneCallIcon,
  RefreshCwIcon,
  ScanLineIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  TagIcon,
  TimerResetIcon,
  TruckIcon,
  UserCheckIcon,
  UsersIcon,
  WifiOffIcon,
  CircleAlertIcon,
} from "lucide-react";

type RiderStatus = "available" | "on_delivery" | "break" | "offline";
type OrderStatus = "pending" | "picked_up" | "at_hub" | "out_for_delivery" | "delivered" | "failed" | "returned";

type RiderRecord = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  bike_plate: string;
  current_status: RiderStatus;
  gps_location?: { type?: string; coordinates?: [number, number] };
  current_cod?: number;
  performance_score?: number;
  total_deliveries?: number;
  successful_deliveries?: number;
  failed_deliveries?: number;
  returned_orders?: number;
  earnings?: number;
  pending_payout?: number;
  hub_id?: string;
  bond_status?: string;
  rating?: number;
  total_ratings?: number;
  is_active?: boolean;
  last_location_update?: string;
};

type OrderRecord = {
  id: string;
  order_id: string;
  package_tracking_id: string;
  rider_tracking_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  item_description: string;
  declared_value: number;
  order_status: OrderStatus;
  delivery_zone: string;
  delivery_fee: number;
  cod_amount: number;
  delivery_attempts?: number;
  failed_reason?: string | null;
  return_reason?: string | null;
  assigned_at?: string | null;
  picked_up_at?: string | null;
  at_hub_at?: string | null;
  out_for_delivery_at?: string | null;
  delivered_at?: string | null;
  failed_at?: string | null;
  returned_at?: string | null;
};

type EarningsSummary = {
  period?: { from?: string; to?: string };
  deliveries?: number;
  successful_deliveries?: number;
  failed_deliveries?: number;
  returned_orders?: number;
  gross_earnings?: number;
  total_fines?: number;
  net_earnings?: number;
  pending_payout?: number;
  total_earnings?: number;
};

type DailySummary = {
  date?: string;
  deliveries?: number;
  successful_deliveries?: number;
  failed_deliveries?: number;
  returned_orders?: number;
  earnings?: number;
  cod_collected?: number;
  fines?: number;
  bonus?: number;
  net_earnings?: number;
};

type IncidentRecord = {
  type: string;
  description: string;
  location?: string | null;
  status?: string;
  resolution?: string | null;
  reported_at?: string;
  resolved_at?: string | null;
};

const driverStatuses: { label: string; value: RiderStatus }[] = [
  { label: "Available", value: "available" },
  { label: "On Delivery", value: "on_delivery" },
  { label: "Break", value: "break" },
  { label: "Offline", value: "offline" },
];

const incidentTypes = [
  { label: "Accident", value: "accident" },
  { label: "Theft", value: "theft" },
  { label: "Mechanical failure", value: "damage" },
  { label: "Police stop", value: "complaint" },
  { label: "Other", value: "other" },
];

const orderSteps = [
  "Receive notification",
  "Accept within timer",
  "Scan hub QR",
  "Pick tracker tag",
  "Navigate to customer",
  "Call customer if needed",
  "Confirm OTP delivery",
];

const activeStatuses: OrderStatus[] = ["pending", "picked_up", "at_hub", "out_for_delivery"];

const formatCurrency = (value: number | undefined | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return `${new Intl.NumberFormat("en-US").format(Math.round(value))} UGX`;
};

const formatCompactCurrency = (value: number | undefined | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  if (Math.abs(value) >= 1000000) {
    return `${Math.round(value / 100000) / 10}M UGX`;
  }

  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 1000)}K UGX`;
  }

  return `${Math.round(value)} UGX`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatCountdown = (assignedAt?: string | null) => {
  if (!assignedAt) {
    return "07:00";
  }

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(assignedAt).getTime()) / 1000));
  const remainingSeconds = Math.max(0, 7 * 60 - elapsedSeconds);
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
};

const hasGpsFix = (rider?: RiderRecord | null) => Boolean(rider?.gps_location?.coordinates?.some((coordinate) => coordinate !== 0));

const extractApiData = <T,>(response: { data?: { data?: T } } | null) => response?.data?.data;

export default function Drivers() {
  const { user } = useAuth();
  const isRiderAccount = user?.role === "rider";
  const canSwitchRiders = Boolean(user && !isRiderAccount);

  const [riders, setRiders] = useState<RiderRecord[]>([]);
  const [selectedRider, setSelectedRider] = useState<RiderRecord | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [incidentType, setIncidentType] = useState(incidentTypes[0].value);
  const [incidentDescription, setIncidentDescription] = useState("");
  const [gpsTrackingEnabled, setGpsTrackingEnabled] = useState(true);
  const [otpValue, setOtpValue] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const loadRoster = async () => {
      setPageLoading(true);
      setErrorMessage(null);

      try {
        if (isRiderAccount) {
          const riderResponse = await api.get('/auth/riders/me');
          const rider = extractApiData<{ rider?: RiderRecord }>(riderResponse)?.rider ?? null;

          if (!cancelled) {
            setRiders(rider ? [rider] : []);
            setSelectedRider(rider);
          }
          return;
        }

        const riderResponse = await api.get('/auth/riders', {
          params: {
            limit: 25,
            is_active: true,
            ...(user.hub_id ? { hub_id: user.hub_id } : {}),
          },
        });

        const roster = extractApiData<{ riders?: RiderRecord[] }>(riderResponse)?.riders ?? [];

        if (!cancelled) {
          setRiders(roster);
          setSelectedRider(roster[0] ?? null);
        }
      } catch (error: any) {
        if (!cancelled) {
          setErrorMessage(error.response?.data?.message || 'Failed to load rider workspace');
        }
      } finally {
        if (!cancelled) {
          setPageLoading(false);
        }
      }
    };

    loadRoster();

    return () => {
      cancelled = true;
    };
  }, [isRiderAccount, user]);

  useEffect(() => {
    if (!selectedRider || !user) {
      return;
    }

    let cancelled = false;

    const loadSelectedRiderData = async () => {
      setDetailLoading(true);
      setErrorMessage(null);

      try {
        const riderQueryId = getRiderQueryId();
        const [ordersResponse, earningsResponse, dailySummaryResponse, incidentsResponse] = await Promise.all([
          api.get('/auth/orders', {
            params: {
              limit: 50,
              rider_id: riderQueryId,
            },
          }),
          api.get(isRiderAccount ? '/auth/riders/me/earnings' : `/auth/riders/${selectedRider.id}/earnings`),
          isRiderAccount ? api.get('/auth/riders/me/daily-summary') : Promise.resolve(null),
          isRiderAccount ? api.get('/auth/riders/me/incidents') : Promise.resolve(null),
        ]);

        const orderItems = extractApiData<{ orders?: OrderRecord[] }>(ordersResponse)?.orders ?? [];
        const nextEarnings = extractApiData<{ summary?: EarningsSummary }>(earningsResponse)?.summary ?? null;
        const nextDailySummary = dailySummaryResponse
          ? extractApiData<{ summary?: DailySummary }>(dailySummaryResponse)?.summary ?? null
          : null;
        const nextIncidents = incidentsResponse
          ? extractApiData<{ incidents?: IncidentRecord[] }>(incidentsResponse)?.incidents ?? []
          : [];

        if (!cancelled) {
          setOrders(orderItems);
          setEarningsSummary(nextEarnings);
          setDailySummary(nextDailySummary);
          setIncidents(nextIncidents);
          setSelectedOrderId((currentOrderId) => {
            if (currentOrderId && orderItems.some((order) => order.id === currentOrderId)) {
              return currentOrderId;
            }

            return (orderItems.find((order) => activeStatuses.includes(order.order_status)) ?? orderItems[0] ?? null)?.id ?? null;
          });
        }
      } catch (error: any) {
        if (!cancelled) {
          setErrorMessage(error.response?.data?.message || 'Failed to load rider details');
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    };

    loadSelectedRiderData();

    return () => {
      cancelled = true;
    };
  }, [isRiderAccount, selectedRider, user]);

  useEffect(() => {
    if (selectedRider && !gpsTrackingEnabled) {
      setGpsTrackingEnabled(hasGpsFix(selectedRider));
    }
  }, [selectedRider, gpsTrackingEnabled]);

  const activeOrders = useMemo(() => orders.filter((order) => activeStatuses.includes(order.order_status)), [orders]);
  const selectedOrder = useMemo(
    () => selectedOrderId ? orders.find((order) => order.id === selectedOrderId) ?? null : activeOrders[0] ?? orders[0] ?? null,
    [activeOrders, orders, selectedOrderId]
  );
  const selectedOrderStatus = selectedOrder?.order_status;
  const canAcceptOrder = selectedOrderStatus === 'pending';
  const canMarkAtHub = selectedOrderStatus === 'picked_up';
  const canStartDelivery = selectedOrderStatus === 'picked_up' || selectedOrderStatus === 'at_hub';
  const canMarkDelivered = selectedOrderStatus === 'out_for_delivery';
  const canRejectOrder = selectedOrder ? activeStatuses.includes(selectedOrder.order_status) : false;

  const status = selectedRider?.current_status ?? 'offline';
  const statusLabel = driverStatuses.find((item) => item.value === status)?.label ?? 'Offline';
  const orderCountdown = formatCountdown(selectedOrder?.assigned_at);
  const gpsWarning = !gpsTrackingEnabled || status === 'offline';
  const todayEarnings = dailySummary?.net_earnings ?? earningsSummary?.net_earnings ?? selectedRider?.earnings ?? 0;
  const openIncidents = incidents.filter((incident) => !incident.status || incident.status === 'open' || incident.status === 'investigating');
  const codCarried = selectedRider?.current_cod ?? 0;
  const trackerAlerts = activeOrders.filter((order) => !order.package_tracking_id).length;
  const statusTone = useMemo(() => {
    switch (status) {
      case 'available':
        return 'bg-success/10 text-success border-success/20';
      case 'on_delivery':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'break':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  }, [status]);

  const dashboardStats = [
    { label: 'Active deliveries', value: String(activeOrders.length).padStart(2, '0'), tone: 'text-primary' },
    { label: 'Tracker alerts', value: String(trackerAlerts).padStart(2, '0'), tone: 'text-destructive' },
    { label: 'COD carried', value: formatCompactCurrency(codCarried), tone: 'text-warning' },
    { label: 'Today earned', value: formatCompactCurrency(todayEarnings), tone: 'text-success' },
  ];

  const earningsBreakdown = [
    { label: 'Gross earnings', value: formatCurrency(earningsSummary?.gross_earnings ?? dailySummary?.earnings ?? selectedRider?.earnings ?? 0) },
    { label: 'Pending payout', value: formatCurrency(earningsSummary?.pending_payout ?? selectedRider?.pending_payout ?? 0) },
    { label: 'Fines / deductions', value: formatCurrency(earningsSummary?.total_fines ?? dailySummary?.fines ?? 0) },
    { label: 'Net earnings', value: formatCurrency(earningsSummary?.net_earnings ?? dailySummary?.net_earnings ?? selectedRider?.earnings ?? 0) },
  ];

  const riderDetailsLine = selectedRider
    ? `${selectedRider.full_name} - ${selectedRider.phone} - ${selectedRider.bike_plate}`
    : 'No rider selected';

  const workspaceSubtitle = pageLoading
    ? 'Loading rider state from backend'
    : selectedRider
      ? `${selectedRider.full_name} | ${selectedRider.phone} | ${selectedRider.current_status}`
      : canSwitchRiders
        ? 'No active riders found for this hub'
        : 'No rider profile found for this account';

  const getRiderQueryId = () => (isRiderAccount ? undefined : selectedRider?.user_id || selectedRider?.id);

  const refreshSelectedRider = async () => {
    if (!selectedRider) {
      return;
    }

    const shouldShowIncidents = isRiderAccount;
    const riderQueryId = getRiderQueryId();

    try {
      setDetailLoading(true);
      const [ordersResponse, earningsResponse, dailySummaryResponse, incidentsResponse] = await Promise.all([
        api.get('/auth/orders', {
          params: {
            limit: 50,
            rider_id: riderQueryId,
          },
        }),
        api.get(isRiderAccount ? '/auth/riders/me/earnings' : `/auth/riders/${selectedRider.id}/earnings`),
        shouldShowIncidents ? api.get('/auth/riders/me/daily-summary') : Promise.resolve(null),
        shouldShowIncidents ? api.get('/auth/riders/me/incidents') : Promise.resolve(null),
      ]);

      const orderItems = extractApiData<{ orders?: OrderRecord[] }>(ordersResponse)?.orders ?? [];
      const nextEarnings = extractApiData<{ summary?: EarningsSummary }>(earningsResponse)?.summary ?? null;
      const nextDailySummary = dailySummaryResponse
        ? extractApiData<{ summary?: DailySummary }>(dailySummaryResponse)?.summary ?? null
        : null;
      const nextIncidents = incidentsResponse
        ? extractApiData<{ incidents?: IncidentRecord[] }>(incidentsResponse)?.incidents ?? []
        : [];

      setOrders(orderItems);
      setEarningsSummary(nextEarnings);
      setDailySummary(nextDailySummary);
      setIncidents(nextIncidents);
      setSelectedOrderId((currentOrderId) => {
        if (currentOrderId && orderItems.some((order) => order.id === currentOrderId)) {
          return currentOrderId;
        }

        return (orderItems.find((order) => activeStatuses.includes(order.order_status)) ?? orderItems[0] ?? null)?.id ?? null;
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to refresh rider data');
    } finally {
      setDetailLoading(false);
    }
  };

  const updateRiderStatus = async (nextStatus: RiderStatus) => {
    if (!selectedRider) {
      return;
    }

    const endpoint = isRiderAccount ? '/auth/riders/me/status' : `/auth/riders/${selectedRider.id}/status`;

    setActionLoading('status');
    try {
      const response = isRiderAccount
        ? await api.post(endpoint, { current_status: nextStatus })
        : await api.patch(endpoint, { current_status: nextStatus });
      const updatedRider = extractApiData<{ rider?: RiderRecord }>(response)?.rider ?? null;

      if (updatedRider) {
        setSelectedRider(updatedRider);
        setRiders((current) => current.map((rider) => (rider.id === updatedRider.id ? updatedRider : rider)));
      }

      toast.success('Rider status updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to update rider status');
    } finally {
      setActionLoading(null);
    }
  };

  const syncGpsLocation = async () => {
    if (!isRiderAccount) {
      toast.info('GPS updates are only writable from the rider account');
      return;
    }

    if (!navigator.geolocation) {
      toast.error('Browser geolocation is not available');
      return;
    }

    setActionLoading('gps');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await api.post('/auth/riders/me/location', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });

          const nextRider = extractApiData<{ gps_location?: RiderRecord['gps_location']; last_location_update?: string }>(response);

          setSelectedRider((current) => current
            ? {
              ...current,
              gps_location: nextRider?.gps_location ?? current.gps_location,
              last_location_update: nextRider?.last_location_update ?? new Date().toISOString(),
            }
            : current);
          setGpsTrackingEnabled(true);
          toast.success('GPS location synced');
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Unable to update GPS location');
        } finally {
          setActionLoading(null);
        }
      },
      () => {
        toast.error('Unable to read current location');
        setActionLoading(null);
      }
    );
  };

  const updateOrderStatus = async (nextStatus: Exclude<OrderStatus, 'delivered'> | 'delivered') => {
    if (!selectedOrder) {
      return;
    }

    const endpoint = nextStatus === 'delivered'
      ? `/auth/orders/${selectedOrder.id}/verify-otp`
      : `/auth/orders/${selectedOrder.id}/status`;

    setActionLoading(`order-${nextStatus}`);

    try {
      if (nextStatus === 'delivered') {
        if (!otpValue.trim()) {
          toast.error('Enter the 4-digit delivery OTP first');
          return;
        }

        if (!/^\d{4}$/.test(otpValue.trim())) {
          toast.error('OTP must be exactly 4 digits');
          return;
        }

        await api.post(endpoint, { otp_code: otpValue.trim() });
      } else {
        await api.patch(endpoint, { order_status: nextStatus, note: `Driver moved order to ${nextStatus}` });
      }

      toast.success('Order updated');
      setOtpValue('');
      await refreshSelectedRider();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to update order');
    } finally {
      setActionLoading(null);
    }
  };

  const markOrderFailed = async () => {
    if (!selectedOrder) {
      return;
    }

    setActionLoading('order-failed');

    try {
      await api.post(`/auth/orders/${selectedOrder.id}/failed`, {
        reason: incidentDescription.trim() || 'Customer unavailable during delivery',
      });

      toast.success('Order marked as failed');
      await refreshSelectedRider();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to mark order failed');
    } finally {
      setActionLoading(null);
    }
  };

  const submitIncident = async () => {
    if (!isRiderAccount) {
      toast.info('Incident reporting is writable from the rider account');
      return;
    }

    if (!incidentDescription.trim()) {
      toast.error('Write a short incident description first');
      return;
    }

    setActionLoading('incident');

    try {
      await api.post('/auth/riders/me/incident', {
        type: incidentType,
        description: incidentDescription.trim(),
        location: selectedOrder?.delivery_address ?? selectedRider?.full_name ?? null,
      });

      toast.success('Incident reported');
      setIncidentDescription('');
      await refreshSelectedRider();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to report incident');
    } finally {
      setActionLoading(null);
    }
  };

  const riderRoomTitle = canSwitchRiders ? 'Hub driver workspace' : 'Rider workspace';

  return (
    <div data-cmp="Drivers" className="flex flex-col h-full">
      <Header
        title={riderRoomTitle}
        subtitle={workspaceSubtitle}
      />

      <div className="flex-1 overflow-y-auto bg-linear-to-br from-background via-card/30 to-primary/5">
        <div className="px-6 py-6 space-y-6">
          {errorMessage ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          {!pageLoading && !selectedRider ? (
            <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-custom">
              The backend did not return a rider profile for this account. Log in with a rider account or create rider records in the backend to populate this workspace.
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-4">
            {dashboardStats.map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 shadow-custom">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</p>
                <p className={`mt-2 text-2xl font-bold ${stat.tone}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {canSwitchRiders && riders.length > 0 ? (
            <div className="bg-card border border-border rounded-3xl p-4 shadow-custom">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Driver roster</p>
                  <h2 className="mt-1 text-lg font-bold text-foreground">Select the rider to inspect</h2>
                </div>
                <span className="text-xs text-muted-foreground inline-flex items-center gap-2">
                  <UsersIcon className="h-4 w-4" />
                  {riders.length} active riders
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {riders.map((rider) => (
                  <button
                    key={rider.id}
                    onClick={() => setSelectedRider(rider)}
                    className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                      selectedRider?.id === rider.id
                        ? 'border-primary bg-primary text-white'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {rider.full_name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="space-y-6">
              <div className="bg-card border border-border rounded-3xl p-5 shadow-custom">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Rider account and status</p>
                    <h2 className="mt-2 text-xl font-bold text-foreground">Live backend rider state</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Phone, PIN, status, GPS, and order actions are now backed by the Wolan rider and order APIs.</p>
                  </div>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusTone}`}>
                    <UserCheckIcon className="h-3.5 w-3.5" />
                    {statusLabel}
                  </span>
                </div>

                {canSwitchRiders && selectedRider ? (
                  <div className="mt-4 rounded-2xl border border-border bg-background/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Selected rider</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{riderDetailsLine}</p>
                      </div>
                      <span className="rounded-full border border-border px-3 py-1 text-[10px] text-muted-foreground">
                        Rider ID {selectedRider.id}
                      </span>
                    </div>
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-background/70 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <SmartphoneIcon className="h-4 w-4 text-primary" />
                      Authenticated rider
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-border bg-card p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone number</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{selectedRider?.phone ?? '—'}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-card p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Bike plate</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{selectedRider?.bike_plate ?? '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-xs text-success">
                      <ShieldCheckIcon className="h-4 w-4" />
                      Rider profile loaded from backend state.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-background/70 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <LocateFixedIcon className="h-4 w-4 text-primary" />
                      Status and GPS
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {driverStatuses.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => updateRiderStatus(item.value)}
                          className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                            status === item.value ? 'border-primary bg-primary text-white' : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={syncGpsLocation}
                      className={`w-full rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors ${
                        gpsTrackingEnabled ? 'border-success/20 bg-success/10 text-success' : 'border-destructive/20 bg-destructive/10 text-destructive'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2">
                          {gpsTrackingEnabled ? <ShieldCheckIcon className="h-4 w-4" /> : <WifiOffIcon className="h-4 w-4" />}
                          {gpsTrackingEnabled ? 'GPS tracker active' : 'GPS tracker inactive'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs">
                          {actionLoading === 'gps' ? <LoaderCircleIcon className="h-3.5 w-3.5 animate-spin" /> : <RefreshCwIcon className="h-3.5 w-3.5" />}
                          {gpsTrackingEnabled ? 'Tracking live' : 'Sync location'}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {gpsWarning ? (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <CircleAlertIcon className="h-4 w-4" />
                    GPS is inactive or the rider is offline, so the alert banner stays on.
                  </div>
                ) : null}
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="bg-card border border-border rounded-3xl p-5 shadow-custom">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Order flow</p>
                      <h3 className="mt-2 text-lg font-bold text-foreground">Accept, navigate, confirm</h3>
                    </div>
                    <span className="rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
                      Accept in {orderCountdown}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {orderSteps.map((step, index) => (
                      <div key={step} className="flex items-start gap-3 rounded-2xl border border-border bg-background/70 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{step}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {index === 1
                              ? 'Accept or reject the assigned order before the timer expires.'
                              : index === 2
                                ? 'Scan the hub QR to confirm custody transfer.'
                                : index === 3
                                  ? 'Attach the physical tracker to the active delivery.'
                                  : index === 5
                                    ? 'Use the customer call button from the order tools.'
                                    : index === 6
                                      ? 'Verify the customer OTP to finish the delivery.'
                                      : ''}
                          </p>
                        </div>
                        <CheckCircle2Icon className="h-4 w-4 text-success" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-5 shadow-custom">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Package tracker scan</p>
                      <h3 className="mt-2 text-lg font-bold text-foreground">Hub QR + tracker tag</h3>
                    </div>
                    <ScanLineIcon className="h-5 w-5 text-primary" />
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-border bg-background/70 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Building2Icon className="h-4 w-4 text-primary" />
                        Hub custody scan
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {selectedOrder
                          ? 'This order is now linked to the backend tracker fields and status history.'
                          : 'Select an order to inspect tracker fields and delivery state.'}
                      </p>
                      <div className="mt-3 flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-xs text-success">
                        <TagIcon className="h-4 w-4" />
                        Tracker linked: {selectedOrder?.package_tracking_id ?? '—'}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-background/70 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <MapPinnedIcon className="h-4 w-4 text-primary" />
                        Divergence alert
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Backend tracker IDs are loaded. GPS divergence still needs the live tracker stream, but the order and rider IDs now come from the real API.
                      </p>
                      <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        Rider tracker: {selectedOrder?.rider_tracking_id ?? '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="bg-card border border-border rounded-3xl p-5 shadow-custom">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CreditCardIcon className="h-4 w-4 text-primary" />
                    Earnings and payments
                  </div>
                  <div className="mt-4 space-y-3">
                    {earningsBreakdown.map((row) => (
                      <div key={row.label} className="flex items-center justify-between rounded-2xl border border-border bg-background/70 px-4 py-3">
                        <span className="text-sm text-muted-foreground">{row.label}</span>
                        <span className="text-sm font-semibold text-foreground">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
                    COD carried warning should show once the driver approaches 1M UGX.
                  </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-5 shadow-custom">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Clock3Icon className="h-4 w-4 text-primary" />
                    Active orders
                  </div>
                  <div className="mt-4 space-y-3">
                    {detailLoading ? (
                      <div className="rounded-2xl border border-border bg-background/70 p-5 text-sm text-muted-foreground inline-flex items-center gap-2">
                        <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                        Loading orders and rider data...
                      </div>
                    ) : null}
                    {activeOrders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                          selectedOrder?.id === order.id ? 'border-primary bg-primary/5' : 'border-border bg-background/70 hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{order.order_id}</p>
                            <p className="text-xs text-muted-foreground">{order.customer_name} - {order.delivery_address}</p>
                          </div>
                          <span className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground">
                            {order.delivery_zone}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3 text-xs">
                          <div className="rounded-xl bg-muted px-3 py-2">
                            <p className="text-muted-foreground">Value</p>
                            <p className="font-semibold text-foreground">{formatCurrency(order.declared_value)}</p>
                          </div>
                          <div className="rounded-xl bg-muted px-3 py-2">
                            <p className="text-muted-foreground">COD</p>
                            <p className="font-semibold text-foreground">{formatCurrency(order.cod_amount)}</p>
                          </div>
                          <div className="rounded-xl bg-muted px-3 py-2">
                            <p className="text-muted-foreground">Tracker</p>
                            <p className="font-semibold text-foreground">{order.package_tracking_id || '—'}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="bg-card border border-border rounded-3xl p-5 shadow-custom">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Order actions</p>
                    <h3 className="mt-2 text-lg font-bold text-foreground">Customer proof and delivery tools</h3>
                  </div>
                  <PhoneCallIcon className="h-5 w-5 text-primary" />
                </div>

                <div className="mt-4 rounded-2xl border border-border bg-background/70 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{selectedOrder?.customer_name ?? 'No order selected'}</p>
                      <p className="text-xs text-muted-foreground">{selectedOrder?.customer_phone ?? '—'}</p>
                    </div>
                    {selectedOrder?.customer_phone ? (
                      <a
                        href={`tel:${selectedOrder.customer_phone}`}
                        className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        Call customer
                      </a>
                    ) : (
                      <button className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary" disabled>
                        Call customer
                      </button>
                    )}
                  </div>

                  <div className="grid gap-2 text-xs sm:grid-cols-2">
                    <div className="rounded-xl bg-muted px-3 py-2">
                      <p className="text-muted-foreground">Package value</p>
                      <p className="font-semibold text-foreground">{formatCurrency(selectedOrder?.declared_value)}</p>
                    </div>
                    <div className="rounded-xl bg-muted px-3 py-2">
                      <p className="text-muted-foreground">Tracker</p>
                      <p className="font-semibold text-foreground">{selectedOrder?.package_tracking_id ?? '—'}</p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      onClick={() => updateOrderStatus('picked_up')}
                      className="rounded-xl bg-success px-3 py-3 text-xs font-semibold text-white disabled:opacity-50"
                      disabled={!selectedOrder || !canAcceptOrder || actionLoading === 'order-picked_up'}
                    >
                      {actionLoading === 'order-picked_up' ? 'Updating...' : 'Accept'}
                    </button>
                    <button
                      onClick={markOrderFailed}
                      className="rounded-xl bg-destructive px-3 py-3 text-xs font-semibold text-white disabled:opacity-50"
                      disabled={!selectedOrder || !canRejectOrder || actionLoading === 'order-failed'}
                    >
                      {actionLoading === 'order-failed' ? 'Updating...' : 'Reject'}
                    </button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      onClick={() => updateOrderStatus('at_hub')}
                      className="rounded-xl border border-border bg-card px-3 py-3 text-xs font-semibold text-foreground disabled:opacity-50"
                      disabled={!selectedOrder || !canMarkAtHub || actionLoading === 'order-at_hub'}
                    >
                      {actionLoading === 'order-at_hub' ? 'Updating...' : 'Confirm Hub Scan'}
                    </button>
                    <button
                      onClick={() => updateOrderStatus('out_for_delivery')}
                      className="rounded-xl border border-border bg-card px-3 py-3 text-xs font-semibold text-foreground disabled:opacity-50"
                      disabled={!selectedOrder || !canStartDelivery || actionLoading === 'order-out_for_delivery'}
                    >
                      {actionLoading === 'order-out_for_delivery' ? 'Updating...' : 'Start Delivery'}
                    </button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <a
                      href={selectedOrder?.delivery_address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.delivery_address)}` : '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-border bg-card px-3 py-3 text-xs font-semibold text-foreground text-center"
                    >
                      Open map
                    </a>
                    <button
                      onClick={() => updateOrderStatus('delivered')}
                      className="rounded-xl border border-border bg-card px-3 py-3 text-xs font-semibold text-foreground disabled:opacity-50"
                      disabled={!selectedOrder || !canMarkDelivered || actionLoading === 'order-delivered'}
                    >
                      {actionLoading === 'order-delivered' ? 'Verifying...' : 'Mark via OTP'}
                    </button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      value={otpValue}
                      onChange={(event) => setOtpValue(event.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="4-digit OTP"
                      inputMode="numeric"
                      maxLength={4}
                      className="rounded-xl border border-border bg-background/80 px-3 py-3 text-xs text-foreground outline-none"
                    />
                    <button
                      onClick={() => updateOrderStatus('delivered')}
                      className="rounded-xl bg-primary px-3 py-3 text-xs font-semibold text-white disabled:opacity-50"
                      disabled={!selectedOrder || !canMarkDelivered || actionLoading === 'order-delivered'}
                    >
                      {actionLoading === 'order-delivered' ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>

                  <div className="rounded-xl border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning">
                    If the customer is unavailable, use reject or failed delivery and attach an incident note below.
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-3xl p-5 shadow-custom">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CameraIcon className="h-4 w-4 text-primary" />
                  Incident reporting
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Report accident, theft, mechanical failure, or police stop. Rider sessions can push this directly to the backend.</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {incidentTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setIncidentType(type.value)}
                      className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                        incidentType === type.value ? 'border-destructive bg-destructive text-white' : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  <textarea
                    value={incidentDescription}
                    onChange={(event) => setIncidentDescription(event.target.value)}
                    rows={4}
                    placeholder="Describe what happened, where it happened, and what support is needed."
                    className="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none resize-none"
                  />

                  <button
                    onClick={submitIncident}
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm font-medium text-foreground disabled:opacity-50"
                    disabled={actionLoading === 'incident'}
                  >
                    <span className="inline-flex items-center gap-2">
                      <AlertTriangleIcon className="h-4 w-4 text-warning" />
                      {actionLoading === 'incident' ? 'Reporting...' : 'Report incident'}
                    </span>
                    <TimerResetIcon className="h-4 w-4 text-muted-foreground" />
                  </button>

                  <button className="flex w-full items-center justify-between rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm font-medium text-foreground" disabled>
                    <span className="inline-flex items-center gap-2"><MicIcon className="h-4 w-4 text-primary" /> Voice note to ops</span>
                    <ShieldAlertIcon className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button className="flex w-full items-center justify-between rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm font-medium text-foreground" disabled>
                    <span className="inline-flex items-center gap-2"><CameraIcon className="h-4 w-4 text-primary" /> Upload photo proof</span>
                    <CheckCircle2Icon className="h-4 w-4 text-success" />
                  </button>
                </div>
              </div>

              <div className="bg-card border border-border rounded-3xl p-5 shadow-custom">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <TruckIcon className="h-4 w-4 text-primary" />
                  Live rider snapshot
                </div>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" /> Status updates are now sent to <span className="font-medium text-foreground">/auth/riders</span></li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" /> Order actions use <span className="font-medium text-foreground">/auth/orders</span> and backend OTP verification</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" /> Active orders are filtered from the real assigned order list</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" /> Earnings cards use the backend summary payload</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" /> Incidents are persisted when the rider account is active</li>
                </ul>

                {isRiderAccount && incidents.length > 0 ? (
                  <div className="mt-4 rounded-2xl border border-border bg-background/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">Recent incidents</p>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{openIncidents.length} open</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {incidents.slice(0, 3).map((incident, index) => (
                        <div key={`${incident.type}-${index}`} className="rounded-xl border border-border bg-card px-3 py-2">
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="font-semibold text-foreground uppercase">{incident.type}</span>
                            <span className="text-muted-foreground">{incident.status ?? 'open'}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{incident.description}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">{formatDateTime(incident.reported_at)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
