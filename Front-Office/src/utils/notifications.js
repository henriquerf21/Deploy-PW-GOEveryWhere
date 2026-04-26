/**
 * RF13 — Sistema de notificações do browser (Web Notification API)
 * Envia notificações nativas do sistema operativo em cada mudança de estado.
 */

const APP_NAME = 'GoEverywhere';
const APP_ICON = '/favicon.ico';

/**
 * Pede permissão ao utilizador para enviar notificações.
 * Deve ser chamado após uma interação do utilizador (ex.: login, primeiro pedido).
 * @returns {Promise<boolean>} true se a permissão foi concedida
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Este browser não suporta notificações.');
    return false;
  }

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Verifica se as notificações estão permitidas.
 */
export function isNotificationGranted() {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Envia uma notificação nativa do browser.
 * @param {string} title - Título da notificação
 * @param {object} options - Opções adicionais
 * @param {string} [options.body] - Corpo da mensagem
 * @param {string} [options.icon] - Ícone
 * @param {string} [options.tag] - Tag para agrupar/substituir notificações
 * @param {Function} [options.onClick] - Callback ao clicar na notificação
 */
export function sendNotification(title, { body = '', icon = APP_ICON, tag = '', onClick = null } = {}) {
  if (!isNotificationGranted()) return null;

  try {
    const notification = new Notification(title, {
      body,
      icon,
      tag,
      badge: icon,
      silent: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (onClick) onClick();
    };

    // Auto-fechar após 8 segundos
    setTimeout(() => notification.close(), 8000);

    return notification;
  } catch (err) {
    console.warn('Erro ao enviar notificação:', err);
    return null;
  }
}

/**
 * Envia uma notificação de mudança de estado de encomenda.
 * @param {string} orderId - ID da encomenda
 * @param {string} stateCode - Código do estado (ex.: 'S-09')
 * @param {object} stateData - Dados do estado (label, icon)
 */
export function notifyOrderStateChange(orderId, stateCode, stateData) {
  if (!stateData) return;

  const messages = {
    'S-02': 'O teu pedido está a ser analisado pela equipa.',
    'S-03': 'Precisamos de informação adicional sobre o teu pedido.',
    'S-04': 'O teu pedido foi rejeitado. Consulta os detalhes.',
    'S-05': 'O teu pedido foi aprovado! A atribuir estafeta...',
    'S-06': 'A aguardar que um estafeta aceite o teu pedido.',
    'S-07': 'Um estafeta aceitou o teu pedido! Acompanha no mapa.',
    'S-08': 'O estafeta está no Continente a recolher os teus produtos.',
    'S-09': 'A tua encomenda está a caminho! 🚀',
    'S-10': 'O estafeta chegou ao teu destino!',
    'S-11': 'Entrega concluída! Não te esqueças de avaliar.',
    'S-12': 'Não foi possível entregar. A equipa vai contactar-te.',
    'S-14': 'O teu pedido foi cancelado pelo administrador.',
  };

  const body = messages[stateCode] || `Estado atualizado: ${stateData.label}`;

  sendNotification(`${APP_NAME} — Encomenda #${orderId}`, {
    body: `${stateData.icon} ${body}`,
    tag: `order-${orderId}`,
  });
}
