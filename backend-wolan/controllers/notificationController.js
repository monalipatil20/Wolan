const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const response = require('../utils/response');
const templates = require('../utils/notificationTemplates');

/**
 * Get all notifications with filtering and pagination
 */
exports.getNotifications = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    type,
    category,
    recipient_id,
    related_type,
    related_id,
  } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (recipient_id) filter.recipient_id = recipient_id;
  if (related_type) filter.related_type = related_type;
  if (related_id) filter.related_id = related_id;

  const skip = (page - 1) * limit;

  const notifications = await Notification.find(filter)
    .populate('sent_by', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Notification.countDocuments(filter);

  response.success(res, {
    notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * Get notification by ID
 */
exports.getNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findById(id)
    .populate('sent_by', 'name email')
    .lean();

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  response.success(res, { notification });
});

/**
 * Create and send a notification
 */
exports.createNotification = asyncHandler(async (req, res) => {
  const {
    type,
    category,
    recipient_id,
    recipient_phone,
    recipient_email,
    recipient_fcm_token,
    template_key,
    variables = {},
    priority = 'normal',
    scheduled_at,
    related_type,
    related_id,
  } = req.body;

  // Validate template exists
  if (!templates[type] || !templates[type][template_key]) {
    throw new AppError(`Template '${template_key}' not found for type '${type}'`, 400);
  }

  const template = templates[type][template_key];

  // Build message from template
  let message = template.template;
  let subject = template.subject || '';

  // Replace variables in template
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{${key}}`, 'g');
    message = message.replace(regex, variables[key] || '');
    if (subject) {
      subject = subject.replace(regex, variables[key] || '');
    }
  });

  // Create notification record
  const notification = await Notification.create({
    type,
    category,
    recipient_id,
    recipient_phone,
    recipient_email,
    recipient_fcm_token,
    template_key,
    variables,
    message,
    subject,
    priority,
    scheduled_at,
    related_type,
    related_id,
    sent_by: req.user?.id,
  });

  // Send notification using service
  await notificationService.processNotification(notification);

  response.success(res, {
    notification,
    message: 'Notification sent successfully',
  }, 201);
});

/**
 * Bulk create notifications
 */
exports.bulkCreateNotifications = asyncHandler(async (req, res) => {
  const { notifications } = req.body;

  if (!Array.isArray(notifications) || notifications.length === 0) {
    throw new AppError('Notifications array is required', 400);
  }

  const createdNotifications = [];

  for (const notifData of notifications) {
    const {
      type,
      category,
      recipient_id,
      recipient_phone,
      recipient_email,
      recipient_fcm_token,
      template_key,
      variables = {},
      priority = 'normal',
      scheduled_at,
      related_type,
      related_id,
    } = notifData;

    // Validate template exists
    if (!templates[type] || !templates[type][template_key]) {
      throw new AppError(`Template '${template_key}' not found for type '${type}'`, 400);
    }

    const template = templates[type][template_key];

    // Build message from template
    let message = template.template;
    let subject = template.subject || '';

    // Replace variables in template
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      message = message.replace(regex, variables[key] || '');
      if (subject) {
        subject = subject.replace(regex, variables[key] || '');
      }
    });

    const notification = await Notification.create({
      type,
      category,
      recipient_id,
      recipient_phone,
      recipient_email,
      recipient_fcm_token,
      template_key,
      variables,
      message,
      subject,
      priority,
      scheduled_at,
      related_type,
      related_id,
      sent_by: req.user?.id,
    });

    createdNotifications.push(notification);
  }

  // Send all notifications
  await Promise.all(createdNotifications.map(notif => notificationService.processNotification(notif)));

  response.success(res, {
    notifications: createdNotifications,
    count: createdNotifications.length,
    message: `${createdNotifications.length} notifications sent successfully`,
  }, 201);
});

/**
 * Update notification status
 */
exports.updateNotificationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, failure_reason } = req.body;

  const updateData = { status };
  if (status === 'sent') {
    updateData.sent_at = new Date();
  } else if (status === 'delivered') {
    updateData.delivered_at = new Date();
  } else if (status === 'failed') {
    updateData.failed_at = new Date();
    updateData.failure_reason = failure_reason;
  }

  const notification = await Notification.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('sent_by', 'name email');

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  response.success(res, {
    notification,
    message: `Notification status updated to ${status}`,
  });
});

/**
 * Retry failed notification
 */
exports.retryNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findById(id);
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  if (notification.status !== 'failed') {
    throw new AppError('Only failed notifications can be retried', 400);
  }

  if (notification.attempts >= notification.max_attempts) {
    throw new AppError('Maximum retry attempts exceeded', 400);
  }

  // Reset status and increment attempts
  notification.status = 'pending';
  notification.attempts += 1;
  notification.failure_reason = null;
  await notification.save();

  // Retry sending
  await notificationService.processNotification(notification);

  response.success(res, {
    notification,
    message: 'Notification retry initiated',
  });
});

/**
 * Delete notification
 */
exports.deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findByIdAndDelete(id);

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  response.success(res, {
    message: 'Notification deleted successfully',
  });
});

/**
 * Get notification statistics
 */
exports.getNotificationStats = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  const dateFilter = {};
  if (start_date || end_date) {
    dateFilter.createdAt = {};
    if (start_date) dateFilter.createdAt.$gte = new Date(start_date);
    if (end_date) dateFilter.createdAt.$lte = new Date(end_date);
  }

  const stats = await Notification.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const total = stats.reduce((sum, stat) => sum + stat.count, 0);

  // Get stats by type and category
  const typeStats = await Notification.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: { type: '$type', category: '$category' },
        count: { $sum: 1 },
      },
    },
  ]);

  response.success(res, {
    total,
    by_status: stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {}),
    by_type_category: typeStats,
  });
});

