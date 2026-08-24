const CACHE_NAME = "sm-shetty-pay-v2";

const APP_FILES = [
    "/SM-SHETTY-PAY/",
    "/SM-SHETTY-PAY/index.html",
    "/SM-SHETTY-PAY/style.css",
    "/SM-SHETTY-PAY/app.js",
    "/SM-SHETTY-PAY/manifest.json",
    "/SM-SHETTY-PAY/icon-192.png",
    "/SM-SHETTY-PAY/icon-512.png"
];


self.addEventListener(
    "install",
    event => {

        self.skipWaiting();

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(cache => {
                    return cache.addAll(APP_FILES);
                })

        );

    }
);


self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            Promise.all([

                caches
                    .keys()
                    .then(keys => {

                        return Promise.all(

                            keys
                                .filter(
                                    key =>
                                        key !== CACHE_NAME
                                )
                                .map(
                                    key =>
                                        caches.delete(key)
                                )

                        );

                    }),

                self.clients.claim()

            ])

        );

    }
);


self.addEventListener(
    "fetch",
    event => {

        event.respondWith(

            fetch(event.request)
                .then(response => {

                    const copy =
                        response.clone();

                    caches
                        .open(CACHE_NAME)
                        .then(cache => {
                            cache.put(
                                event.request,
                                copy
                            );
                        });

                    return response;

                })
                .catch(() => {

                    return caches.match(
                        event.request
                    );

                })

        );

    }
);