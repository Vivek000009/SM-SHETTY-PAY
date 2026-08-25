const CACHE_NAME = "sm-shetty-pay-v3";

const APP_FILES = [
    "/SM-SHETTY-PAY/",
    "/SM-SHETTY-PAY/index.html",
    "/SM-SHETTY-PAY/style.css",
    "/SM-SHETTY-PAY/app.js",
    "/SM-SHETTY-PAY/manifest.json",
    "/SM-SHETTY-PAY/icon-192.png",
    "/SM-SHETTY-PAY/icon-512.png"
];


self.addEventListener("install", event => {

    self.skipWaiting();

    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(cache =>
                cache.addAll(APP_FILES)
            )
    );

});


self.addEventListener("activate", event => {

    event.waitUntil(

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

            })
            .then(() =>
                self.clients.claim()
            )

    );

});


self.addEventListener("fetch", event => {

    // Do not cache POST requests
    if (event.request.method !== "GET") {
        return;
    }


    const requestURL =
        new URL(event.request.url);


    // Only cache our GitHub Pages frontend.
    // Do not cache Render API responses.
    if (
        requestURL.origin !==
        self.location.origin
    ) {
        return;
    }


    event.respondWith(

        fetch(event.request)

            .then(response => {

                const responseCopy =
                    response.clone();

                caches
                    .open(CACHE_NAME)
                    .then(cache => {

                        cache.put(
                            event.request,
                            responseCopy
                        );

                    });

                return response;

            })

            .catch(() => {

                return caches.match(
                    event.request
                );


    );

});