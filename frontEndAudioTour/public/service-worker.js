const MEDIA_CACHE = "audio-tour-media";
const SHELL_CACHE = "audio-tour-shell";
const API_CACHE = "audio-tour-api";

const MEDIA_FILE_TYPES = [
  ".mp3",
  ".wav",
  ".mp4",
  ".webm",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".svg",
];

const SHELL_FILE_TYPES = [".js", ".css", ".html"];

self.addEventListener("fetch", (event) => {
  const url = event.request.url.toLowerCase();
  const requestOrigin = new URL(event.request.url).origin;
  const selfOrigin = self.location.origin;

  // Cache API responses (stale-while-revalidate)
  if (
    url.includes("/wp-json/wp/v2/audio_tour") ||
    url.includes("/wp-json/wp/v2/media")
  ) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request)
          .then((response) => {
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Cache media files
  if (MEDIA_FILE_TYPES.some((ext) => url.includes(ext))) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) {
          // Validate cached response
          const contentType = cached.headers.get("Content-Type") || "";
          if (contentType.startsWith("audio/")) return cached;
          // If not valid, delete and fetch fresh
          await cache.delete(event.request);
        }
        const response = await fetch(event.request);
        cache.put(event.request, response.clone());
        return response;
      })
    );
    return;
  }

  // Cache app shell files
  if (
    SHELL_FILE_TYPES.some((ext) => url.includes(ext)) &&
    requestOrigin === selfOrigin
  ) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        cache.put(event.request, response.clone());
        return response;
      })
    );
    return;
  }
});
