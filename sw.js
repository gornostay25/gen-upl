const CACHE_Version = '21-07-07-2'
const Static_CACHE = 'static-' + CACHE_Version
const Static_CACHEAssets = [
    '/',
    '/build/bundle.js',
    '/build/bundle.css',
    '/fonts/PTSerif-Regular.b64',
    '/favicon.ico'
];
const DCACHE = 'cache-auto';


self.addEventListener('install', async event => {
    self.skipWaiting();
    const cache = await caches.open(Static_CACHE);
    await cache.addAll(Static_CACHEAssets);
    console.log('Service worker instaliran');
});


// застарілий кеш
self.addEventListener('activate', async event => {
    const cachesKeys = await caches.keys();
    const checkKeys = cachesKeys.map(async key => {
        if (![Static_CACHE].includes(key)) {
        //if (!["bkjbs"].includes(key)) {
            await caches.delete(key);
        }
    });
    await Promise.all(checkKeys);
    console.log('Service worker akteviran (izbrisan je stari keš)');
});


self.addEventListener('fetch', event => {
    if (event.request.method == "GET") {
        event.respondWith(checkCache(event.request));
    }
});

async function checkCache(req) {
    let url = new URL(req.url),
    nreq;
    if (location.hostname == url.hostname && !url.pathname.match(/(?:[^/][\d\w\.]+)$(?<=\.\w{2,})/)) {
        url.pathname="/"
        nreq = new Request(url.toString(),{...req})
    }

    const cacheS = await caches.open(Static_CACHE);
    const StaticCachedResponse = await cacheS.match((nreq) ? nreq : req);

    return StaticCachedResponse || checkOnline((nreq)?nreq:req);
}
function timeout(delay) {
    return new Promise(function (rs) {
        setTimeout(function () {
            rs(new Response('', {
                status: 408,
                statusText: 'Request timed out.'
            }));
        }, delay);
    });
}
async function checkOnline(req) {
    const cache = await caches.open(DCACHE);
    try {
        const resp = await Promise.race([timeout(60000), fetch(req)]);
        if (!navigator.onLine) {
            throw "Offline"
        } else if (resp.status == 408) {
            throw "Timeout"
        }
        await cache.put(req, resp.clone());
        return resp;
    } catch (error) {
        console.log(error)
        const cachedRes = await cache.match(req);
        if (cachedRes) {
            return cachedRes;
        } else {
            return new Response(new Blob(), { "status": 503, "statusText": "You are Offline!" })
        }

    }
}