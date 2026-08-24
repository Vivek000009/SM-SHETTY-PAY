const CACHE_NAME = "sm-shetty-pay-v1";

const APP_FILES = [
    "/SM-SHETTY-PAY/",
    "/SM-SHETTY-PAY/index.html",
    "/SM-SHETTY-PAY/style.css",
    "/SM-SHETTY-PAY/app.js",
    "/SM-SHETTY-PAY/manifest.json"
];


self.addEventListener(
    "install",
    event => {

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

        );

    }
);


self.addEventListener(
    "fetch",
    event => {

        event.respondWith(

            caches
                .match(event.request)
                .then(cachedResponse => {

                    return (
                        cachedResponse ||
                        fetch(event.request)
                    );

                })

        );

    }
);