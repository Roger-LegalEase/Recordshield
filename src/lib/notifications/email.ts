import { env } from "@/lib/env";

export type TransactionalEmail = {
  to: string;
  subject: string;
  body: string;
};

export type TransactionalEmailResult = {
  delivered: boolean;
  skipped?: boolean;
};

export async function sendTransactionalEmail(message: TransactionalEmail): Promise<TransactionalEmailResult> {
  if (!env.NOTIFICATIONS_WEBHOOK_URL) {
    return { delivered: false, skipped: true };
  }

  const response = await fetch(env.NOTIFICATIONS_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(env.EMAIL_PROVIDER_API_KEY ? { authorization: `Bearer ${env.EMAIL_PROVIDER_API_KEY}` } : {})
    },
    body: JSON.stringify({
      to: message.to,
      subject: message.subject,
      body: message.body
    })
  });

  if (!response.ok) {
    throw new Error(`Notification email delivery failed with status ${response.status}.`);
  }

  return { delivered: true };
}
