import * as React from 'react';
import { render } from '@react-email/render';
import { EmailEventType } from '@flor/database';

import { EmailVerificationTemplate } from './emails/email-verification';
import { PasswordResetTemplate } from './emails/password-reset';
import { OrderCreatedTemplate } from './emails/order-created';
import { PaymentApprovedTemplate } from './emails/payment-approved';
import { PaymentRejectedTemplate } from './emails/payment-rejected';
import { OrderShippedTemplate } from './emails/order-shipped';
import { OrderDeliveredTemplate } from './emails/order-delivered';
import { ReviewInvitationTemplate } from './emails/review-invitation';

export async function renderEmailTemplate(
  event: EmailEventType,
  payload: Record<string, unknown>,
): Promise<{ html: string; subject: string }> {
  switch (event) {
    case EmailEventType.EMAIL_VERIFICATION: {
      const p = payload as { name: string; verificationLink: string };
      return {
        subject: 'Confirme seu e-mail — Flor de Menina',
        html: await render(React.createElement(EmailVerificationTemplate, p)),
      };
    }

    case EmailEventType.PASSWORD_RESET: {
      const p = payload as { name: string; resetLink: string };
      return {
        subject: 'Redefinir senha — Flor de Menina',
        html: await render(React.createElement(PasswordResetTemplate, p)),
      };
    }

    case EmailEventType.ORDER_CREATED: {
      const p = payload as unknown as Parameters<
        typeof OrderCreatedTemplate
      >[0];
      return {
        subject: `Pedido ${p.orderNumber} recebido — Flor de Menina`,
        html: await render(React.createElement(OrderCreatedTemplate, p)),
      };
    }

    case EmailEventType.PAYMENT_APPROVED: {
      const p = payload as unknown as Parameters<
        typeof PaymentApprovedTemplate
      >[0];
      return {
        subject: `Pagamento confirmado — Pedido ${p.orderNumber}`,
        html: await render(React.createElement(PaymentApprovedTemplate, p)),
      };
    }

    case EmailEventType.PAYMENT_REJECTED: {
      const p = payload as unknown as Parameters<
        typeof PaymentRejectedTemplate
      >[0];
      return {
        subject: `Problema no pagamento — Pedido ${p.orderNumber}`,
        html: await render(React.createElement(PaymentRejectedTemplate, p)),
      };
    }

    case EmailEventType.ORDER_SHIPPED: {
      const p = payload as unknown as Parameters<
        typeof OrderShippedTemplate
      >[0];
      return {
        subject: `Seu pedido ${p.orderNumber} foi enviado!`,
        html: await render(React.createElement(OrderShippedTemplate, p)),
      };
    }

    case EmailEventType.ORDER_DELIVERED: {
      const p = payload as unknown as Parameters<
        typeof OrderDeliveredTemplate
      >[0];
      return {
        subject: `Entrega confirmada — Pedido ${p.orderNumber}`,
        html: await render(React.createElement(OrderDeliveredTemplate, p)),
      };
    }

    case EmailEventType.REVIEW_INVITATION: {
      const p = payload as unknown as Parameters<
        typeof ReviewInvitationTemplate
      >[0];
      return {
        subject: 'Como foram suas peças? Avalie sua compra — Flor de Menina',
        html: await render(React.createElement(ReviewInvitationTemplate, p)),
      };
    }

    default:
      throw new Error(`Unknown email event type: ${event}`);
  }
}
