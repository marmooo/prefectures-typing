const CACHE_NAME="2024-05-10 00:30",urlsToCache=["/prefectures-typing/","/prefectures-typing/index.js","/prefectures-typing/problems.csv","/prefectures-typing/mp3/bgm.mp3","/prefectures-typing/mp3/cat.mp3","/prefectures-typing/mp3/correct.mp3","/prefectures-typing/mp3/end.mp3","/prefectures-typing/mp3/keyboard.mp3","/prefectures-typing/favicon/favicon.svg","https://marmooo.github.io/fonts/textar-light.woff2"];self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(e=>e.addAll(urlsToCache)))}),self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(t=>t||fetch(e.request)))}),self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(e=>Promise.all(e.filter(e=>e!==CACHE_NAME).map(e=>caches.delete(e)))))})