'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/orders/:documentId/invoice',
      handler: 'order.downloadInvoice',
      config: { auth: false },
    },
  ],
};
