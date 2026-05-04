import { useState, useEffect } from "react";
import Header from "../components/Header";
import { toast } from "sonner";
import {
  BellIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  MessageSquareIcon,
  MailIcon,
  SmartphoneIcon,
  SendIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  TrashIcon,
  EyeIcon,
} from "lucide-react";
import { notificationApi } from "../lib/api";

interface Notification {
  _id: string;
  type: 'sms' | 'whatsapp' | 'email' | 'push';
  category: string;
  recipient_phone?: string;
  recipient_email?: string;
  template_key: string;
  message: string;
  subject?: string;
  status: 'pending' | 'queued' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  priority: 'high' | 'normal' | 'low';
  createdAt: string;
  sent_at?: string;
  failed_at?: string;
  failure_reason?: string;
  sent_by?: {
    name: string;
    email: string;
  };
}

const statusConfig = {
  pending: { icon: ClockIcon, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Pending' },
  queued: { icon: ClockIcon, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Queued' },
  sent: { icon: CheckCircleIcon, color: 'text-green-500', bg: 'bg-green-50', label: 'Sent' },
  delivered: { icon: CheckCircleIcon, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Delivered' },
  failed: { icon: XCircleIcon, color: 'text-red-500', bg: 'bg-red-50', label: 'Failed' },
  cancelled: { icon: XCircleIcon, color: 'text-gray-500', bg: 'bg-gray-50', label: 'Cancelled' },
};

const typeConfig = {
  sms: { icon: MessageSquareIcon, color: 'text-blue-500', label: 'SMS' },
  whatsapp: { icon: MessageSquareIcon, color: 'text-green-500', label: 'WhatsApp' },
  email: { icon: MailIcon, color: 'text-purple-500', label: 'Email' },
  push: { icon: SmartphoneIcon, color: 'text-orange-500', label: 'Push' },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Form state for creating notifications
  const [formData, setFormData] = useState<{
    type: 'sms' | 'whatsapp' | 'email' | 'push';
    category: string;
    recipient_id: string;
    recipient_phone?: string;
    recipient_email?: string;
    template_key: string;
    variables: Record<string, any>;
    priority: 'high' | 'normal' | 'low';
  }>({
    type: 'sms',
    category: '',
    recipient_id: '',
    recipient_phone: '',
    recipient_email: '',
    template_key: '',
    variables: {},
    priority: 'normal',
  });

  useEffect(() => {
    loadNotifications();
  }, [statusFilter, typeFilter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      const response = await notificationApi.getNotifications(params);
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotification = async () => {
    try {
      await notificationApi.createNotification(formData);
      toast.success('Notification sent successfully');
      setShowCreateModal(false);
      setFormData({
        type: 'sms',
        category: '',
        recipient_id: '',
        recipient_phone: '',
        recipient_email: '',
        template_key: '',
        variables: {},
        priority: 'normal',
      });
      loadNotifications();
    } catch (error) {
      console.error('Failed to create notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const handleRetryNotification = async (id: string) => {
    try {
      await notificationApi.retryNotification(id);
      toast.success('Notification retry initiated');
      loadNotifications();
    } catch (error) {
      console.error('Failed to retry notification:', error);
      toast.error('Failed to retry notification');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      await notificationApi.deleteNotification(id);
      toast.success('Notification deleted');
      loadNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = !searchTerm ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.recipient_phone?.includes(searchTerm) ||
      notification.recipient_email?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <div data-cmp="Notifications" className="flex flex-col h-full">
      <Header title="Notifications" subtitle="Manage and monitor notification delivery" />

      <div className="flex flex-1 overflow-hidden">
        {/* Filters Sidebar */}
        <div className="w-64 border-r border-border bg-card flex flex-col overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <BellIcon className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Filters</span>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-input rounded-lg border border-border focus:border-primary transition-colors"
              />
            </div>

            {/* Status Filter */}
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-2 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-input rounded-lg border border-border focus:border-primary"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="queued">Queued</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-2 block">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-input rounded-lg border border-border focus:border-primary"
              >
                <option value="">All Types</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="push">Push</option>
              </select>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center gap-2 gradient-orange text-white text-xs font-semibold px-3 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              <PlusIcon className="w-4 h-4" />
              Send Notification
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-lg font-bold text-foreground">All Notifications</h2>
              <p className="text-sm text-muted-foreground">
                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={loadNotifications}
              className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground text-sm rounded-lg hover:bg-accent transition-colors"
            >
              <RefreshCwIcon className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <BellIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notifications found</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {filteredNotifications.map((notification) => {
                  const StatusIcon = statusConfig[notification.status].icon;
                  const TypeIcon = typeConfig[notification.type].icon;

                  return (
                    <div
                      key={notification._id}
                      className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedNotification(notification)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${statusConfig[notification.status].bg}`}>
                            <StatusIcon className={`w-4 h-4 ${statusConfig[notification.status].color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <TypeIcon className={`w-3 h-3 ${typeConfig[notification.type].color}`} />
                              <span className="text-xs font-medium text-foreground capitalize">
                                {notification.category.replace('_', ' ')}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[notification.status].bg} ${statusConfig[notification.status].color}`}>
                                {statusConfig[notification.status].label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {notification.recipient_phone || notification.recipient_email || 'Unknown recipient'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {notification.status === 'failed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRetryNotification(notification._id);
                              }}
                              className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title="Retry"
                            >
                              <RefreshCwIcon className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification._id);
                            }}
                            className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="mb-2">
                        <p className="text-sm text-foreground line-clamp-2">
                          {notification.subject && <span className="font-medium">{notification.subject}: </span>}
                          {notification.message}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(notification.createdAt).toLocaleString()}</span>
                        {notification.sent_by && (
                          <span>Sent by {notification.sent_by.name}</span>
                        )}
                      </div>

                      {notification.failure_reason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          <strong>Failed:</strong> {notification.failure_reason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-[500px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <SendIcon className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Send Notification</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2.5 text-xs bg-input rounded-lg border border-border focus:border-primary"
                  >
                    <option value="sms">SMS</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="push">Push Notification</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2.5 text-xs bg-input rounded-lg border border-border focus:border-primary"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., order_dispatch, otp, system"
                  className="w-full px-3 py-2.5 text-xs bg-input rounded-lg border border-border focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Recipient ID</label>
                <input
                  type="text"
                  value={formData.recipient_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipient_id: e.target.value }))}
                  placeholder="User/Merchant/Rider ID"
                  className="w-full px-3 py-2.5 text-xs bg-input rounded-lg border border-border focus:border-primary"
                />
              </div>

              {(formData.type === 'sms' || formData.type === 'whatsapp') && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.recipient_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipient_phone: e.target.value }))}
                    placeholder="+256 XXX XXX XXX"
                    className="w-full px-3 py-2.5 text-xs bg-input rounded-lg border border-border focus:border-primary"
                  />
                </div>
              )}

              {(formData.type as string) === 'email' && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Email Address</label>
                  <input
                    type="email"
                    value={formData.recipient_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipient_email: e.target.value }))}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2.5 text-xs bg-input rounded-lg border border-border focus:border-primary"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Template Key</label>
                <input
                  type="text"
                  value={formData.template_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_key: e.target.value }))}
                  placeholder="e.g., order_assigned, otp_sent"
                  className="w-full px-3 py-2.5 text-xs bg-input rounded-lg border border-border focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Variables (JSON)</label>
                <textarea
                  value={JSON.stringify(formData.variables, null, 2)}
                  onChange={(e) => {
                    try {
                      const variables = JSON.parse(e.target.value);
                      setFormData(prev => ({ ...prev, variables }));
                    } catch (error) {
                      // Invalid JSON, keep current value
                    }
                  }}
                  placeholder='{"order_id": "123", "rider_name": "John"}'
                  rows={3}
                  className="w-full px-3 py-2.5 text-xs bg-input rounded-lg border border-border focus:border-primary font-mono"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-muted text-foreground text-sm font-medium py-2.5 rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNotification}
                className="flex-1 gradient-orange text-white text-sm font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <EyeIcon className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Notification Details</h2>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="text-muted-foreground hover:text-foreground text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Type</label>
                  <p className="text-sm font-medium text-foreground capitalize">{selectedNotification.type}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusConfig[selectedNotification.status].bg} ${statusConfig[selectedNotification.status].color}`}>
                      {statusConfig[selectedNotification.status].label}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Category</label>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {selectedNotification.category.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Priority</label>
                  <p className="text-sm font-medium text-foreground capitalize">{selectedNotification.priority}</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Recipient</label>
                <p className="text-sm text-foreground">
                  {selectedNotification.recipient_phone || selectedNotification.recipient_email || 'Unknown'}
                </p>
              </div>

              {selectedNotification.subject && (
                <div>
                  <label className="text-xs text-muted-foreground">Subject</label>
                  <p className="text-sm font-medium text-foreground">{selectedNotification.subject}</p>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground">Message</label>
                <div className="bg-input rounded-lg p-3 mt-1">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{selectedNotification.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Created</label>
                  <p className="text-sm text-foreground">
                    {new Date(selectedNotification.createdAt).toLocaleString()}
                  </p>
                </div>
                {selectedNotification.sent_at && (
                  <div>
                    <label className="text-xs text-muted-foreground">Sent</label>
                    <p className="text-sm text-foreground">
                      {new Date(selectedNotification.sent_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedNotification.sent_by && (
                <div>
                  <label className="text-xs text-muted-foreground">Sent By</label>
                  <p className="text-sm text-foreground">{selectedNotification.sent_by.name}</p>
                </div>
              )}

              {selectedNotification.failure_reason && (
                <div>
                  <label className="text-xs text-muted-foreground">Failure Reason</label>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-1">
                    <p className="text-sm text-red-700">{selectedNotification.failure_reason}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              {selectedNotification.status === 'failed' && (
                <button
                  onClick={() => {
                    handleRetryNotification(selectedNotification._id);
                    setSelectedNotification(null);
                  }}
                  className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry Notification
                </button>
              )}
              <button
                onClick={() => setSelectedNotification(null)}
                className="flex-1 bg-muted text-foreground text-sm font-medium py-2.5 rounded-lg hover:bg-accent transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}