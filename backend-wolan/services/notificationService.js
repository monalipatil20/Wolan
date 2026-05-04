const Notification = require('../models/Notification');
const templates = require('../utils/notificationTemplates');

/**
 * Notification Service
 * Handles sending notifications through various channels
 */

class NotificationService {
  /**
   * Send a notification
   */
  async send(type, category, recipient, templateKey, variables = {}, options = {}) {
    const {
      priority = 'normal',
      scheduled_at = null,
      related_type = null,
      related_id = null,
      sent_by = null,
    } = options;

    // Validate template exists
    if (!templates[type] || !templates[type][templateKey]) {
      throw new Error(`Template '${templateKey}' not found for type '${type}'`);
    }

    const template = templates[type][templateKey];

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
      recipient_id: recipient.id,
      recipient_phone: recipient.phone,
      recipient_email: recipient.email,
      recipient_fcm_token: recipient.fcm_token,
      template_key: templateKey,
      variables,
      message,
      subject,
      priority,
      scheduled_at,
      related_type,
      related_id,
      sent_by,
    });

    // Send notification asynchronously
    this.processNotification(notification);

    return notification;
  }

  /**
   * Send bulk notifications
   */
  async sendBulk(notifications) {
    const createdNotifications = [];

    for (const notifData of notifications) {
      const {
        type,
        category,
        recipient,
        templateKey,
        variables = {},
        options = {},
      } = notifData;

      const notification = await this.send(type, category, recipient, templateKey, variables, options);
      createdNotifications.push(notification);
    }

    return createdNotifications;
  }

  /**
   * Process and send notification
   */
  async processNotification(notification) {
    try {
      // Update status to queued
      notification.status = 'queued';
      await notification.save();

      // Send based on type
      switch (notification.type) {
        case 'sms':
          await this.sendSMS(notification);
          break;
        case 'whatsapp':
          await this.sendWhatsApp(notification);
          break;
        case 'email':
          await this.sendEmail(notification);
          break;
        case 'push':
          await this.sendPushNotification(notification);
          break;
        default:
          throw new Error(`Unsupported notification type: ${notification.type}`);
      }

      // Mark as sent
      notification.status = 'sent';
      notification.sent_at = new Date();
      await notification.save();

    } catch (error) {
      // Mark as failed
      notification.status = 'failed';
      notification.failed_at = new Date();
      notification.failure_reason = error.message;
      await notification.save();

      console.error('Notification failed:', error);
    }
  }

  /**
   * Send SMS via Africa's Talking
   */
  async sendSMS(notification) {
    if (!process.env.AFRICAS_TALKING_USERNAME || !process.env.AFRICAS_TALKING_API_KEY) {
      console.warn('Africa\'s Talking credentials not configured, simulating SMS send.');
      return;
    }

    // Placeholder - integrate with Africa's Talking API
    console.log('Sending SMS:', {
      to: notification.recipient_phone,
      message: notification.message,
    });

    // Simulate API call for development
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Send WhatsApp message
   */
  async sendWhatsApp(notification) {
    if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.warn('WhatsApp credentials not configured, simulating WhatsApp send.');
      return;
    }

    // Placeholder - integrate with WhatsApp Business API
    console.log('Sending WhatsApp:', {
      to: notification.recipient_phone,
      message: notification.message,
    });

    // Simulate API call for development
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Send email
   */
  async sendEmail(notification) {
    if (!process.env.SENDGRID_API_KEY && !process.env.AWS_SES_ACCESS_KEY) {
      console.warn('Email service credentials not configured, simulating email send.');
      return;
    }

    // Placeholder - integrate with email service (SendGrid, AWS SES, etc.)
    console.log('Sending Email:', {
      to: notification.recipient_email,
      subject: notification.subject,
      message: notification.message,
    });

    // Simulate API call for development
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Send push notification
   */
  async sendPushNotification(notification) {
    if (!process.env.FCM_SERVER_KEY) {
      console.warn('FCM credentials not configured, simulating push send.');
      return;
    }

    // Placeholder - integrate with FCM or similar
    console.log('Sending Push:', {
      to: notification.recipient_fcm_token,
      title: notification.subject,
      body: notification.message,
    });

    // Simulate API call for development
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Send order-related notifications
   */
  async sendOrderNotification(order, event, recipient) {
    const variables = {
      order_id: order.id || order._id,
      rider_name: order.rider?.name || 'Rider',
      rider_phone: order.rider?.phone || '',
      merchant_name: order.merchant?.name || 'Merchant',
      customer_name: order.customer?.name || 'Customer',
      customer_phone: order.customer?.phone || '',
      delivery_address: order.delivery_address || '',
      cod_amount: order.cod_amount || 0,
      eta: order.estimated_delivery_time || '45 mins',
      tracking_url: `${process.env.FRONTEND_URL}/track/${order.id}`,
    };

    const templateMap = {
      assigned: 'order_assigned',
      picked_up: 'order_picked_up',
      out_for_delivery: 'out_for_delivery',
      delivered: 'order_delivered',
      delayed: 'delay_notification',
    };

    const templateKey = templateMap[event];
    if (!templateKey) return;

    return await this.send('sms', 'order_dispatch', recipient, templateKey, variables, {
      related_type: 'order',
      related_id: order._id,
    });
  }

  /**
   * Send rider notifications
   */
  async sendRiderNotification(rider, event, variables = {}) {
    const baseVariables = {
      rider_name: rider.name,
      rider_id: rider.id || rider._id,
      ...variables,
    };

    const templateMap = {
      login: 'rider_login',
      new_route: 'new_route_assigned',
      payout: 'rider_payout',
      daily_report: 'daily_report',
    };

    const templateKey = templateMap[event];
    if (!templateKey) return;

    return await this.send('sms', 'rider', rider, templateKey, baseVariables, {
      related_type: 'rider',
      related_id: rider._id,
    });
  }

  /**
   * Send merchant notifications
   */
  async sendMerchantNotification(merchant, event, variables = {}) {
    const baseVariables = {
      merchant_name: merchant.name,
      merchant_id: merchant.id || merchant._id,
      ...variables,
    };

    const templateMap = {
      order_created: 'order_created',
      order_update: 'order_update',
      cod_collected: 'cod_collected',
    };

    const templateKey = templateMap[event];
    if (!templateKey) return;

    return await this.send('sms', 'merchant', merchant, templateKey, baseVariables, {
      related_type: 'merchant',
      related_id: merchant._id,
    });
  }

  /**
   * Send system alerts
   */
  async sendSystemAlert(recipient, alertType, variables = {}) {
    const templateMap = {
      gps_dark: 'gps_dark_alert',
      cod_overdue: 'cod_overdue_alert',
      low_riders: 'low_rider_count',
      daily_report: 'daily_summary',
    };

    const templateKey = templateMap[alertType];
    if (!templateKey) return;

    return await this.send('sms', 'system', recipient, templateKey, variables, {
      priority: 'high',
    });
  }
}

module.exports = new NotificationService();