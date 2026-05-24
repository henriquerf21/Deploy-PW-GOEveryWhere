"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bo_event_bus_js_1 = require("../utils/bo-event-bus.js");
function getService(strapi) {
    return strapi.service('api::back-office.back-office');
}
async function ensureAdminSession(ctx, strapi) {
    if (ctx.state.user)
        return true;
    const authHeader = ctx.get?.('authorization') ||
        ctx.request?.header?.authorization ||
        ctx.request?.headers?.authorization ||
        '';
    const token = String(authHeader).startsWith('Bearer ')
        ? String(authHeader).slice(7).trim()
        : '';
    if (!token)
        return false;
    try {
        const payload = await strapi.plugin('users-permissions').service('jwt').verify(token);
        if (!payload?.id)
            return false;
        const user = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { id: payload.id },
            select: ['id', 'email', 'username', 'firstName', 'lastName', 'blocked'],
        });
        if (!user || user.blocked)
            return false;
        ctx.state.user = user;
        return true;
    }
    catch {
        return false;
    }
}
exports.default = {
    async bootstrap(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const data = await service.getBootstrapData();
        return ctx.send({ data });
    },
    async login(ctx) {
        const service = getService(strapi);
        const result = await service.loginWithEmail(ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async googleLogin(ctx) {
        const service = getService(strapi);
        const result = await service.loginWithGoogle(ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async listOrders(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const data = await service.listOrders(ctx.query ?? {});
        return ctx.send({ data });
    },
    async getOrder(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const data = await service.getOrder(ctx, ctx.params.id);
        if (!data)
            return ctx.badRequest('Pedido não encontrado');
        return ctx.send({ data });
    },
    async approveOrder(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.approveOrder(ctx, ctx.params.id, ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async rejectOrder(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.rejectOrder(ctx, ctx.params.id, ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async requestOrderInfo(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.requestOrderInfo(ctx, ctx.params.id, ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async appendOrderChat(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.appendOrderChat(ctx, ctx.params.id, ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data, chatHistory: result.chatHistory });
    },
    async assignCourier(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.assignCourier(ctx, ctx.params.id, ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async setPriority(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.setPriority(ctx, ctx.params.id, ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async startTransit(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.startTransit(ctx, ctx.params.id);
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async completeOrder(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.completeOrder(ctx, ctx.params.id);
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async setOrderDeliveryStatus(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.setOrderDeliveryStatus(ctx, ctx.params.id, ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async cancelOrder(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.cancelOrderByAdmin(ctx, ctx.params.id, ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async patchOrder(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.patchOrderAdmin(ctx, ctx.params.id, ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async appNotifications(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        return ctx.send({ data: await service.listAppNotifications(ctx, ctx.query ?? {}) });
    },
    async markAppNotificationRead(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.markAppNotificationRead(ctx, ctx.params.documentId);
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: { ok: true } });
    },
    async listCouriers(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const data = await service.listCouriers();
        return ctx.send({ data });
    },
    async getCourier(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const data = await service.getCourier(ctx.params.id);
        if (!data)
            return ctx.badRequest('Estafeta não encontrado');
        return ctx.send({ data });
    },
    async createCourier(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.createCourier(ctx, ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async updateCourier(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.updateCourier(ctx, ctx.params.id, ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async courierAction(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.courierAction(ctx, ctx.params.id, ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async stores(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        return ctx.send({ data: await service.getContinentStores() });
    },
    async createStore(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.createContinentStore(ctx, ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async updateStore(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.updateContinentStore(ctx, ctx.params.id, ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async deleteStore(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.deleteContinentStore(ctx, ctx.params.id);
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async storeInventory(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.getStoreInventory(ctx.params.id, ctx.query ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async upsertStoreInventory(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.upsertInventoryItem(ctx, ctx.params.id, ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async deleteStoreInventory(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.deleteInventoryItem(ctx, ctx.params.id, ctx.params.itemId);
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async products(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        return ctx.send({ data: await service.getCatalogProducts() });
    },
    async publicProducts(ctx) {
        const service = getService(strapi);
        return ctx.send({ data: await service.getCatalogProducts() });
    },
    async publicMetrics(ctx) {
        const service = getService(strapi);
        return ctx.send({ data: await service.getPublicMetrics() });
    },
    async publicStores(ctx) {
        const service = getService(strapi);
        return ctx.send({ data: await service.getContinentStores() });
    },
    async chatbot(ctx) {
        const service = getService(strapi);
        return ctx.send(await service.chatWithBot(ctx.request.body));
    },
    async upsertProduct(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.upsertCatalogProduct(ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async deleteProduct(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.deleteCatalogProduct(ctx.params.id);
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async operationsMap(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        return ctx.send({ data: await service.getOperationsMap() });
    },
    async dashboard(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        return ctx.send({ data: await service.getDashboard() });
    },
    async reports(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        return ctx.send({ data: await service.getReports() });
    },
    async customers(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        return ctx.send({ data: await service.getCustomers() });
    },
    async createCustomer(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.createCustomer(ctx, ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async updateCustomer(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.updateCustomer(ctx, ctx.params.id, ctx.request.body ?? {});
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    async deleteCustomer(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const service = getService(strapi);
        const result = await service.deleteCustomer(ctx, ctx.params.id);
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({ data: result.data });
    },
    /**
     * Server-Sent Events (SSE) — substitui o polling de 10s do BO.
     * Aceita o JWT via header Authorization OU via query string `?token=...`
     * porque o `EventSource` nativo do browser não permite headers customizados.
     */
    async stream(ctx) {
        const queryToken = ctx.query?.token ? String(ctx.query.token) : '';
        if (queryToken && !ctx.state.user) {
            try {
                const payload = await strapi.plugin('users-permissions').service('jwt').verify(queryToken);
                if (payload?.id) {
                    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
                        where: { id: payload.id },
                        select: ['id', 'email', 'username', 'firstName', 'lastName', 'blocked'],
                    });
                    if (user && !user.blocked)
                        ctx.state.user = user;
                }
            }
            catch {
                /* ignore — falls through to header-based auth */
            }
        }
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const req = ctx.req;
        const res = ctx.res;
        try {
            req.socket?.setTimeout?.(0);
            req.socket?.setNoDelay?.(true);
            req.socket?.setKeepAlive?.(true);
        }
        catch { /* best effort */ }
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        });
        const write = (event, data) => {
            try {
                res.write(`event: ${event}\n`);
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            }
            catch { /* socket likely closed */ }
        };
        write('hello', { at: new Date().toISOString(), userId: ctx.state.user?.id ?? null });
        const onChange = (payload) => write('change', payload);
        bo_event_bus_js_1.BO_BUS.on('change', onChange);
        // Heartbeat para evitar que proxies fechem a ligação por inactividade.
        const hb = setInterval(() => {
            try {
                res.write(': hb\n\n');
            }
            catch { /* ignore */ }
        }, 25000);
        const cleanup = () => {
            bo_event_bus_js_1.BO_BUS.off('change', onChange);
            clearInterval(hb);
            try {
                res.end();
            }
            catch { /* ignore */ }
        };
        req.on('close', cleanup);
        req.on('aborted', cleanup);
        res.on('close', cleanup);
        res.on('error', cleanup);
        ctx.respond = false;
    },
    async downloadOrderInvoice(ctx) {
        if (!(await ensureAdminSession(ctx, strapi)))
            return ctx.unauthorized();
        const { loadOrderForInvoice } = require('../../../utils/order-invoice-service.js');
        const { serveInvoicePdf } = require('../../../utils/serve-invoice-pdf.js');
        const order = await loadOrderForInvoice(strapi, ctx.params.id);
        if (!order)
            return ctx.notFound('Fatura indisponível (pedido não entregue ou inexistente).');
        try {
            await serveInvoicePdf(ctx, order);
        }
        catch (err) {
            return ctx.badRequest(err?.message || 'Não foi possível gerar a fatura.');
        }
    },
};
