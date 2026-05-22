/**
 * Sistema de notificações do browser (Web Notification API) para a PWA do Estafeta
 */

const APP_NAME = 'GoEverywhere Estafeta';
const APP_ICON = '/pwa-192x192.png'; // Assuming standard PWA icon name

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function isNotificationGranted() {
  return 'Notification' in window && Notification.permission === 'granted';
}

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

    setTimeout(() => notification.close(), 8000);

    return notification;
  } catch (err) {
    console.warn('Erro ao enviar notificação:', err);
    return null;
  }
}
