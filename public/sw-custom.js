// Custom Service Worker em segundo plano para notificações Push e alertas com app fechado

self.__WB_MANIFEST;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listener de Notificação Push e Alerta Nativo em Segundo Plano
self.addEventListener('push', (event) => {
  let data = { 
    title: '🚨 LOMBROU ALERTA', 
    body: 'ALERTA DE EMERGÊNCIA DISPARADO PELO ADM!',
    image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80',
    icon: 'https://cdn-icons-png.flaticon.com/512/564/564619.png'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  // Padrão de vibração contínua e forte no sistema do celular
  const vibrationPattern = [1000, 300, 1000, 300, 1000, 300, 1000, 300, 1000, 300, 1000];

  const options = {
    body: data.body || data.message || 'ATENÇÃO: VERIFIQUE O APLICATIVO!',
    icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
    image: data.image_url || data.image || 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80', // Imagem expandida na notificação do celular
    vibrate: vibrationPattern,
    tag: 'emergency-alert-v2',
    renotify: true,
    requireInteraction: true, // Mantém o alerta na tela até ser clicado
    silent: false,
    timestamp: Date.now(),
    data: {
      url: self.location.origin
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🚨 LOMBROU ALERTA', options)
  );
});

// Ao clicar na notificação da tela bloqueada, abre o app direto na tela piscante em vermelho
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin);
      }
    })
  );
});
