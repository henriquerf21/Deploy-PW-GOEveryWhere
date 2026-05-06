export default {
  routes: [
    {
      method: 'POST',
      path: '/courier-estafetas/auth/login',
      handler: 'courier-estafeta.login',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/courier-estafetas/deliveries/:id',
      handler: 'courier-estafeta.courierUpdateDelivery',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/courier-estafetas/orders/:id',
      handler: 'courier-estafeta.courierUpdateOrder',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/courier-estafetas/me',
      handler: 'courier-estafeta.courierUpdateSelf',
      config: { auth: false },
    },
  ],
};
