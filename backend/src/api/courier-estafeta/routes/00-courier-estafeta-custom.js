"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'POST',
            path: '/courier-estafetas/auth/login',
            handler: 'courier-estafeta.login',
            config: { auth: false },
        },
        {
            method: 'GET',
            path: '/courier-estafetas/my-deliveries',
            handler: 'courier-estafeta.myDeliveries',
            config: { auth: false },
        },
        {
            method: 'GET',
            path: '/courier-estafetas/my-completed-deliveries',
            handler: 'courier-estafeta.myCompletedDeliveries',
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
