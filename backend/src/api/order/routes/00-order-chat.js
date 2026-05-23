'use strict';

module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/orders/:documentId/chat-messages',
            handler: 'order.appendChatMessage',
            config: { auth: false },
        },
    ],
};
