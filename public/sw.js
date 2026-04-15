self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Nova Notificação', body: 'Você tem uma nova mensagem!' };
  
  const options = {
    body: data.body || data.message,
    icon: data.icon || 'https://lh3.googleusercontent.com/d/1ZhXnY35i4ewk-duviq6ilIMGmDhzy0Ui',
    badge: 'https://lh3.googleusercontent.com/d/1ZhXnY35i4ewk-duviq6ilIMGmDhzy0Ui',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
