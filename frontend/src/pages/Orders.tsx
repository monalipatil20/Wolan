import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import api from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import {
  PlusIcon,
  SearchIcon,
  FilterIcon,
  MapPinIcon,
  PackageIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  QrCodeIcon,
  PrinterIcon,
  RefreshCwIcon,
  ScanBarcodeIcon,
  UserIcon,
  LoaderCircleIcon,
} from "lucide-react";

type OrderStatus = "pending" | "picked_up" | "at_hub" | "out_for_delivery" | "delivered" | "failed" | "returned";

type MerchantRef = {
  id?: string;
  _id?: string;
  merchant_name?: string;
  shop_name?: string;
  phone?: string;
};

type RiderRef = {
  id?: string;
  _id?: string;
  full_name?: string;
  phone?: string;
};

type OrderRecord = {
  id: string;
  order_id: string;
  merchant_id: string | MerchantRef;
  rider_id: string | RiderRef | null;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  item_description: string;
  declared_value: number;
  order_status: OrderStatus;
  package_tracking_id: string;
  rider_tracking_id: string;
  delivery_zone: string;
  delivery_fee: number;
  cod_amount: number;
  assigned_at?: string;
  createdAt?: string;
  qr_code?: string;
};

type MerchantRecord = {
  id: string;
  merchant_name: string;
  shop_name: string;
  phone: string;
  email: string;
};

type RiderRecord = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  current_status: string;
  hub_id?: string;
};

type CreateOrderForm = {
  merchant_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_zone: string;
  item_description: string;
  declared_value: string;
  delivery_fee: string;
  cod_amount: string;
};

const statusFilters: { label: string; value: "all" | OrderStatus }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Picked Up", value: "picked_up" },
  { label: "At Hub", value: "at_hub" },
  { label: "Out for Delivery", value: "out_for_delivery" },
  { label: "Delivered", value: "delivered" },
  { label: "Failed", value: "failed" },
  { label: "Returned", value: "returned" },
];

const statusConfig: Record<OrderStatus, { label: string; classes: string; icon: React.ElementType }> = {
  pending: { label: "Pending", classes: "text-muted-foreground bg-muted border-border", icon: ClockIcon },
  picked_up: { label: "Picked Up", classes: "text-chart-2 bg-chart-2/10 border-chart-2/20", icon: PackageIcon },
  at_hub: { label: "At Hub", classes: "text-warning bg-warning/10 border-warning/20", icon: PackageIcon },
  out_for_delivery: { label: "Out for Delivery", classes: "text-primary bg-primary/10 border-primary/20", icon: TruckIcon },
  delivered: { label: "Delivered", classes: "text-success bg-success/10 border-success/20", icon: CheckCircleIcon },
  failed: { label: "Failed", classes: "text-destructive bg-destructive/10 border-destructive/20", icon: XCircleIcon },
  returned: { label: "Returned", classes: "text-destructive bg-destructive/10 border-destructive/20", icon: XCircleIcon },
};

const zones = ["All Zones", "CBD", "Kawempe", "Ntinda", "Makindye", "Nakawa", "Rubaga"];

const emptyForm = (): CreateOrderForm => ({
  merchant_id: "",
  customer_name: "",
  customer_phone: "",
  delivery_address: "",
  delivery_zone: "",
  item_description: "",
  declared_value: "0",
  delivery_fee: "0",
  cod_amount: "0",
});

const formatUGX = (value: number | undefined | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US").format(Math.round(value));
};

const readId = (value: string | { id?: string; _id?: string } | null | undefined) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id || value._id || null;
};

const readMerchantName = (merchant: OrderRecord["merchant_id"]) => {
  if (!merchant) return "Unassigned";
  if (typeof merchant === "string") return merchant;
  return merchant.shop_name || merchant.merchant_name || "Merchant";
};

const readRiderName = (rider: OrderRecord["rider_id"]) => {
  if (!rider) return "Unassigned";
  if (typeof rider === "string") return rider;
  return rider.full_name || "Rider";
};

const readRiderPhone = (rider: OrderRecord["rider_id"]) => {
  if (!rider || typeof rider === "string") return "—";
  return rider.phone || "—";
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [merchants, setMerchants] = useState<MerchantRecord[]>([]);
  const [riders, setRiders] = useState<RiderRecord[]>([]);
  const [selectedZone, setSelectedZone] = useState("All Zones");
  const [selectedStatus, setSelectedStatus] = useState<(typeof statusFilters)[number]["value"]>("all");
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateOrderForm>(emptyForm());
  const [manualRiderId, setManualRiderId] = useState("");

  const selectedOrder = useMemo(
    () => (selectedOrderId ? orders.find((order) => order.id === selectedOrderId) ?? null : orders[0] ?? null),
    [orders, selectedOrderId]
  );

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const zoneMatch = selectedZone === "All Zones" || order.delivery_zone === selectedZone;
      const statusMatch = selectedStatus === "all" || order.order_status === selectedStatus;
      const searchText = search.trim().toLowerCase();
      const searchMatch =
        !searchText ||
        order.order_id.toLowerCase().includes(searchText) ||
        order.customer_name.toLowerCase().includes(searchText) ||
        readMerchantName(order.merchant_id).toLowerCase().includes(searchText) ||
        order.delivery_address.toLowerCase().includes(searchText);

      return zoneMatch && statusMatch && searchMatch;
    });
  }, [orders, search, selectedStatus, selectedZone]);

  const fetchOrders = async () => {
    const { data } = await api.get("/auth/orders", {
      params: {
        limit: 100,
        ...(selectedStatus !== "all" ? { status: selectedStatus } : {}),
      },
    });

    const orderItems = (data?.data?.orders || []) as OrderRecord[];
    setOrders(orderItems);
    setSelectedOrderId((currentId) => {
      if (currentId && orderItems.some((order) => order.id === currentId)) {
        return currentId;
      }

      return orderItems[0]?.id ?? null;
    });
  };

  const fetchMerchants = async () => {
    const { data } = await api.get("/auth/merchants", { params: { limit: 100 } });
    const merchantItems = (data?.data?.merchants || []) as MerchantRecord[];
    setMerchants(merchantItems);
  };

  const fetchRiders = async () => {
    const { data } = await api.get("/auth/riders", { params: { limit: 100, is_active: true } });
    const riderItems = (data?.data?.riders || []) as RiderRecord[];
    setRiders(riderItems);
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchOrders(), fetchMerchants(), fetchRiders()]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load order dispatch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const updateOrderStatus = async (orderId: string, status: OrderStatus, note?: string) => {
    setActionLoading(`status-${orderId}-${status}`);
    try {
      await api.patch(`/auth/orders/${orderId}/status`, { order_status: status, note });
      toast.success(`Order moved to ${statusConfig[status].label}`);
      await fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Status update failed");
    } finally {
      setActionLoading(null);
    }
  };

  const autoAssignRider = async (orderId: string) => {
    setActionLoading(`assign-auto-${orderId}`);
    try {
      await api.patch(`/auth/orders/${orderId}/assign-rider`, { auto_assign: true });
      toast.success("Rider auto-assigned using dispatch logic");
      await fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Auto-assign failed");
    } finally {
      setActionLoading(null);
    }
  };

  const manualAssignRider = async (orderId: string) => {
    if (!manualRiderId) {
      toast.error("Select a rider first");
      return;
    }

    setActionLoading(`assign-manual-${orderId}`);
    try {
      await api.patch(`/auth/orders/${orderId}/assign-rider`, { rider_id: manualRiderId });
      toast.success("Rider assignment updated");
      setManualRiderId("");
      await fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Manual assignment failed");
    } finally {
      setActionLoading(null);
    }
  };

  const createOrder = async () => {
    if (!createForm.merchant_id) {
      toast.error("Merchant is required");
      return;
    }

    setActionLoading("create-order");

    try {
      await api.post("/auth/orders", {
        merchant_id: createForm.merchant_id,
        customer_name: createForm.customer_name,
        customer_phone: createForm.customer_phone,
        delivery_address: createForm.delivery_address,
        item_description: createForm.item_description,
        declared_value: Number(createForm.declared_value || 0),
        delivery_zone: createForm.delivery_zone,
        delivery_fee: Number(createForm.delivery_fee || 0),
        cod_amount: Number(createForm.cod_amount || 0),
        hub_id: user?.hub_id || undefined,
        auto_assign: true,
      });

      toast.success("Order created with auto-dispatch");
      setShowNewOrder(false);
      setCreateForm(emptyForm());
      await fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Order creation failed");
    } finally {
      setActionLoading(null);
    }
  };

  const markFailed = async (orderId: string) => {
    setActionLoading(`failed-${orderId}`);
    try {
      await api.post(`/auth/orders/${orderId}/failed`, { reason: "Customer unavailable" });
      toast.success("Order marked failed");
      await fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to mark order failed");
    } finally {
      setActionLoading(null);
    }
  };

  const onRefreshClick = async () => {
    setActionLoading("refresh");
    await refreshAll();
    setActionLoading(null);
  };

  return (
    <div data-cmp="Orders" className="flex flex-col h-full">
      <Header title="Orders & Dispatch" subtitle="Create, assign, stage, and track orders in real time" />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card/50">
            <button
              onClick={() => setShowNewOrder(true)}
              className="flex items-center gap-2 gradient-orange text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity shadow-custom"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              New Order
            </button>
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 flex-1 max-w-xs">
              <SearchIcon className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                className="bg-transparent text-xs text-foreground placeholder-muted-foreground outline-none w-full"
                placeholder="Search by ID, merchant, customer"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {zones.map((zone) => (
                <button
                  key={zone}
                  onClick={() => setSelectedZone(zone)}
                  className={`text-[10px] font-medium px-2.5 py-1.5 rounded-full border transition-colors ${
                    selectedZone === zone ? "bg-primary/10 text-primary border-primary/30" : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
            <button className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <FilterIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRefreshClick}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {actionLoading === "refresh" ? <LoaderCircleIcon className="w-3.5 h-3.5 animate-spin" /> : <RefreshCwIcon className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-1 px-6 py-3 border-b border-border overflow-x-auto">
            {statusFilters.map((statusItem) => (
              <button
                key={statusItem.value}
                onClick={() => setSelectedStatus(statusItem.value)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  selectedStatus === statusItem.value ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {statusItem.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="bg-card rounded-xl border border-border shadow-custom overflow-hidden">
              <div
                className="grid text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border px-4 py-3"
                style={{ gridTemplateColumns: "1fr 1.2fr 1fr 0.8fr 0.8fr 0.9fr 0.7fr 0.6fr" }}
              >
                <span>Order ID</span>
                <span>Merchant → Customer</span>
                <span>Address</span>
                <span>Zone</span>
                <span>Rider</span>
                <span>Status</span>
                <span>Value</span>
                <span>Actions</span>
              </div>

              {loading ? (
                <div className="px-4 py-6 text-sm text-muted-foreground inline-flex items-center gap-2">
                  <LoaderCircleIcon className="w-4 h-4 animate-spin" />
                  Loading orders...
                </div>
              ) : null}

              {!loading && filtered.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">No orders match current filters.</div>
              ) : null}

              {filtered.map((order) => {
                const currentStatus = statusConfig[order.order_status];
                const StatusIcon = currentStatus.icon;

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="grid items-center px-4 py-3.5 border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    style={{ gridTemplateColumns: "1fr 1.2fr 1fr 0.8fr 0.8fr 0.9fr 0.7fr 0.6fr" }}
                  >
                    <div>
                      <p className="text-xs font-bold text-primary">{order.order_id}</p>
                      <p className="text-[10px] text-muted-foreground">{order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground truncate">{readMerchantName(order.merchant_id)}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{order.customer_name}</p>
                    </div>
                    <div className="flex items-start gap-1">
                      <MapPinIcon className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] text-muted-foreground truncate">{order.delivery_address}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{order.delivery_zone}</span>
                    <p className="text-xs text-foreground">{readRiderName(order.rider_id)}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border w-fit ${currentStatus.classes}`}>
                      <StatusIcon className="w-3 h-3" />
                      {currentStatus.label}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-foreground">UGX {formatUGX(order.declared_value)}</p>
                      <p className={`text-[10px] ${order.cod_amount > 0 ? "text-warning" : "text-muted-foreground"}`}>
                        {order.cod_amount > 0 ? `COD ${formatUGX(order.cod_amount)}` : "Prepaid"}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button className="p-1.5 rounded bg-muted hover:bg-accent transition-colors" title="Track">
                        <MapPinIcon className="w-3 h-3 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 rounded bg-muted hover:bg-accent transition-colors" title="QR">
                        <QrCodeIcon className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`w-80 border-l border-border bg-card flex flex-col flex-shrink-0 overflow-y-auto transition-all duration-300 ${selectedOrder ? "opacity-100" : "opacity-40"}`}>
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-primary">{selectedOrder?.order_id ?? "Select an order"}</p>
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${selectedOrder ? statusConfig[selectedOrder.order_status].classes : statusConfig.pending.classes}`}>
                {selectedOrder ? statusConfig[selectedOrder.order_status].label : "—"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{selectedOrder?.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : "—"}</p>
          </div>

          <div className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Merchant</p>
              <p className="text-xs font-semibold text-foreground">{selectedOrder ? readMerchantName(selectedOrder.merchant_id) : "—"}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Customer</p>
              <p className="text-xs font-semibold text-foreground">{selectedOrder?.customer_name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{selectedOrder?.customer_phone ?? "—"}</p>
              <div className="flex items-start gap-1.5">
                <MapPinIcon className="w-3 h-3 text-muted-foreground mt-0.5" />
                <p className="text-xs text-muted-foreground">{selectedOrder?.delivery_address ?? "—"}</p>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-3 flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Tracking IDs</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TruckIcon className="w-3.5 h-3.5 text-chart-2" />
                  <span className="text-[10px] text-muted-foreground">Rider Tracking</span>
                </div>
                <span className="text-xs font-bold text-chart-2">{selectedOrder?.rider_tracking_id ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ScanBarcodeIcon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] text-muted-foreground">Package Tracking</span>
                </div>
                <span className="text-xs font-bold text-primary">{selectedOrder?.package_tracking_id ?? "—"}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Assigned Rider</p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 gradient-blue rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{readRiderName(selectedOrder?.rider_id ?? null)}</p>
                  <p className="text-[10px] text-muted-foreground">{readRiderPhone(selectedOrder?.rider_id ?? null)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Order Value</span>
              <span className="text-xs font-bold text-foreground">UGX {formatUGX(selectedOrder?.declared_value)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Payment Type</span>
              <span className={`text-xs font-semibold ${selectedOrder?.cod_amount ? "text-warning" : "text-success"}`}>
                {selectedOrder?.cod_amount ? "COD" : "Prepaid"}
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <button
                onClick={() => selectedOrder && autoAssignRider(selectedOrder.id)}
                disabled={!selectedOrder || actionLoading === `assign-auto-${selectedOrder.id}`}
                className="w-full gradient-orange text-white text-xs font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {selectedOrder && actionLoading === `assign-auto-${selectedOrder.id}` ? "Assigning..." : "Auto-Assign Rider"}
              </button>

              <select
                value={manualRiderId}
                onChange={(event) => setManualRiderId(event.target.value)}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary"
              >
                <option value="">Manual Rider Override</option>
                {riders.map((rider) => (
                  <option key={rider.user_id} value={rider.user_id}>{rider.full_name} ({rider.current_status})</option>
                ))}
              </select>

              <button
                onClick={() => selectedOrder && manualAssignRider(selectedOrder.id)}
                disabled={!selectedOrder || !manualRiderId || actionLoading === `assign-manual-${selectedOrder.id}`}
                className="w-full bg-muted text-foreground text-xs font-medium py-2.5 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              >
                {selectedOrder && actionLoading === `assign-manual-${selectedOrder.id}` ? "Updating..." : "Apply Manual Assignment"}
              </button>

              <button
                onClick={() => selectedOrder && updateOrderStatus(selectedOrder.id, "out_for_delivery", "Dispatched from admin panel")}
                disabled={!selectedOrder || selectedOrder.order_status !== "at_hub" || actionLoading === `status-${selectedOrder.id}-out_for_delivery`}
                className="w-full bg-muted text-foreground text-xs font-medium py-2.5 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              >
                Dispatch Out For Delivery
              </button>

              <button
                onClick={() => selectedOrder && markFailed(selectedOrder.id)}
                disabled={!selectedOrder || !["pending", "picked_up", "at_hub", "out_for_delivery"].includes(selectedOrder.order_status) || actionLoading === `failed-${selectedOrder.id}`}
                className="w-full bg-muted text-foreground text-xs font-medium py-2.5 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              >
                Mark Failed
              </button>

              <button className="w-full bg-muted text-foreground text-xs font-medium py-2.5 rounded-lg hover:bg-accent transition-colors flex items-center justify-center gap-2">
                <PrinterIcon className="w-3.5 h-3.5" />
                Print Waybill
              </button>
              <button className="w-full bg-muted text-foreground text-xs font-medium py-2.5 rounded-lg hover:bg-accent transition-colors flex items-center justify-center gap-2">
                <QrCodeIcon className="w-3.5 h-3.5" />
                View QR Code
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${showNewOrder ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="bg-card border border-border rounded-2xl p-6 w-[560px] shadow-custom flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">Create New Order</h2>
            </div>
            <button onClick={() => setShowNewOrder(false)} className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none">✕</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Merchant</label>
              <select
                value={createForm.merchant_id}
                onChange={(event) => setCreateForm((current) => ({ ...current, merchant_id: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary"
              >
                <option value="">Select merchant</option>
                {merchants.map((merchant) => (
                  <option key={merchant.id} value={merchant.id}>{merchant.shop_name || merchant.merchant_name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Customer Name</label>
              <input
                value={createForm.customer_name}
                onChange={(event) => setCreateForm((current) => ({ ...current, customer_name: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Customer Phone</label>
              <input
                value={createForm.customer_phone}
                onChange={(event) => setCreateForm((current) => ({ ...current, customer_phone: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary"
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Delivery Address</label>
              <input
                value={createForm.delivery_address}
                onChange={(event) => setCreateForm((current) => ({ ...current, delivery_address: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Zone</label>
              <input
                value={createForm.delivery_zone}
                onChange={(event) => setCreateForm((current) => ({ ...current, delivery_zone: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Item Description</label>
              <input
                value={createForm.item_description}
                onChange={(event) => setCreateForm((current) => ({ ...current, item_description: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Declared Value (UGX)</label>
              <input
                type="number"
                value={createForm.declared_value}
                onChange={(event) => setCreateForm((current) => ({ ...current, declared_value: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Delivery Fee (UGX)</label>
              <input
                type="number"
                value={createForm.delivery_fee}
                onChange={(event) => setCreateForm((current) => ({ ...current, delivery_fee: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">COD Amount (UGX)</label>
              <input
                type="number"
                value={createForm.cod_amount}
                onChange={(event) => setCreateForm((current) => ({ ...current, cod_amount: event.target.value }))}
                className="bg-input rounded-lg px-3 py-2.5 text-xs text-foreground outline-none border border-border focus:border-primary"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowNewOrder(false)} className="flex-1 bg-muted text-foreground text-xs font-medium py-2.5 rounded-lg hover:bg-accent transition-colors">Cancel</button>
            <button
              onClick={createOrder}
              className="flex-1 gradient-orange text-white text-xs font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={actionLoading === "create-order"}
            >
              {actionLoading === "create-order" ? "Creating..." : "Create & Auto-Assign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
