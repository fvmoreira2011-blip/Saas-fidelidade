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
    icon: data.icon || 'https://lh3.googleusercontent.com/d/1zZIjvIWtsLVet5ltkAK4dbxYuIX1GnBa',
    badge: 'https://lh3.googleusercontent.com/d/1zZIjvIWtsLVet5ltkAK4dbxYuIX1GnBa',
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
