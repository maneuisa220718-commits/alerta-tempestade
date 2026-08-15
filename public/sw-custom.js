// Custom Service Worker em segundo plano para notificações Push e alertas com app fechado

// Manifest de Precache do Workbox
self.__WB_MANIFEST;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listener de Notificação Push em Segundo Plano (Mesmo com App Fechado)
self.addEventListener('push', (event) => {
  let data = { title: '🚨 ALERTA DO ADMINISTRADOR', body: 'Novo alerta recebido no celular!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || data.message || 'Alerta de emergência ativado!',
    icon: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
    vibrate: [1000, 500, 1000, 500, 1000],
    tag: 'emergency-alert',
    renotify: true,
    requireInteraction: true, // Mantém a notificação na tela até o usuário interagir
    data: {
      url: self.location.origin
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🚨 LOMBROU ALERTA', options)
  );
});

// Ao clicar na notificação com o app fechado, abre o aplicativo
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
