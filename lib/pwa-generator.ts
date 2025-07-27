export interface PWAManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: "standalone" | "fullscreen" | "minimal-ui" | "browser";
  background_color: string;
  theme_color: string;
  orientation: "any" | "natural" | "landscape" | "portrait";
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose?: string;
  }>;
  screenshots?: Array<{
    src: string;
    sizes: string;
    type: string;
    form_factor?: "wide" | "narrow";
  }>;
}

export interface PWASettings {
  name: string;
  description: string;
  author: string;
  appUrl: string;
  accentColor: string;
  icon: string;
  backgroundColor: string;
  themeColor: string;
}

export function generateManifest(settings: PWASettings): PWAManifest {
  return {
    name: settings.name || "My PWA",
    short_name: settings.name || "PWA",
    description: settings.description || "A Progressive Web App",
    start_url: "/",
    display: "standalone",
    background_color: settings.backgroundColor || settings.accentColor || "#ffffff",
    theme_color: settings.themeColor || settings.accentColor || "#000000",
    orientation: "any",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icon-512.png", 
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  };
}

export function generateServiceWorker(): string {
  return `
const CACHE_NAME = 'pwa-cache-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
`;
}

export function generateHTMLTemplate(settings: PWASettings): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${settings.name}</title>
    <meta name="description" content="${settings.description}">
    <meta name="theme-color" content="${settings.accentColor}">
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" href="/icon-192.png">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background-color: #f5f5f5;
            color: #333;
        }
        
        .app-header {
            background-color: ${settings.accentColor};
            color: white;
            padding: 1rem;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .app-content {
            padding: 1rem;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .employee-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .employee-card {
            background: white;
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .employee-avatar {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: ${settings.accentColor};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            margin-bottom: 0.5rem;
        }
        
        .install-button {
            background-color: ${settings.accentColor};
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 1rem;
            display: none;
        }
        
        @media (max-width: 768px) {
            .employee-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="app-header">
        <h1>${settings.name}</h1>
        <p>${settings.description}</p>
    </div>
    
    <div class="app-content">
        <button id="installButton" class="install-button">Install App</button>
        
        <div class="employee-grid">
            <div class="employee-card">
                <div class="employee-avatar">${settings.icon}</div>
                <h3>Michael Scott</h3>
                <p>Regional Manager</p>
            </div>
            <div class="employee-card">
                <div class="employee-avatar">${settings.icon}</div>
                <h3>Dwight K. Schrute</h3>
                <p>Assistant to the Regional Manager</p>
            </div>
            <div class="employee-card">
                <div class="employee-avatar">${settings.icon}</div>
                <h3>Pam Beesly</h3>
                <p>Receptionist</p>
            </div>
            <div class="employee-card">
                <div class="employee-avatar">${settings.icon}</div>
                <h3>Jim Halpert</h3>
                <p>Assistant Regional Manager</p>
            </div>
        </div>
    </div>

    <script>
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                        console.log('SW registered: ', registration);
                    }, function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }

        // PWA Install functionality
        let deferredPrompt;
        const installButton = document.getElementById('installButton');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installButton.style.display = 'block';
        });

        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(\`User response to the install prompt: \${outcome}\`);
                deferredPrompt = null;
                installButton.style.display = 'none';
            }
        });
    </script>
</body>
</html>`;
}

export function generateIconSVG(emoji: string, color: string): string {
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="${color}" rx="100"/>
    <text x="256" y="330" font-family="Arial, sans-serif" font-size="200" text-anchor="middle" fill="white">${emoji}</text>
  </svg>`;
}
