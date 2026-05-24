'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/webhooks/order-invoice',
      handler: 'webhook.handleOrderInvoice',
      config: { auth: false },
    },
  ],
};
