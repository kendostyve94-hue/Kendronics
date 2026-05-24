import { Injectable, Logger } from '@nestjs/common';
import { Notification } from './entities/notification.entity';

@Injectable()
export class OneSignalNotificationSender {
  private readonly logger = new Logger(OneSignalNotificationSender.name);

  async send(notification: Notification): Promise<void> {
    const appId = process.env.ONESIGNAL_APP_ID?.trim();
    const apiKey = process.env.ONESIGNAL_REST_API_KEY?.trim();
    if (!appId || !apiKey) {
      if (process.env.ONESIGNAL_REQUIRED === 'true') {
        this.logger.error('ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY are required.');
      }
      return;
    }

    const response = await fetch(`${process.env.ONESIGNAL_API_BASE_URL ?? 'https://api.onesignal.com'}/notifications`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        app_id: appId,
        target_channel: 'push',
        include_aliases: {
          external_id: [notification.userId],
        },
        name: `kendronics-${notification.type}`,
        headings: {
          en: notification.title,
          fr: notification.title,
        },
        contents: {
          en: notification.body || notification.title,
          fr: notification.body || notification.title,
        },
        data: {
          notificationId: notification.id,
          type: notification.type,
        },
        url: `${frontendOrigin()}/profile?view=notifications`,
        chrome_web_icon: `${frontendOrigin()}/images/kendronics-google-favicon.png`,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.warn(`OneSignal push failed with ${response.status}: ${body.slice(0, 500)}`);
    }
  }
}

function frontendOrigin(): string {
  return process.env.FRONTEND_ORIGIN?.split(',')[0]?.trim() || 'https://kendronics.com';
}
