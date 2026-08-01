import settings from './settings.js';
import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';

(async () => {
    for (const setting in settings) {
        const value = (await chrome.storage.sync.get({ [setting]: settings[setting].default }))[setting];
        chrome.storage.sync.set({ [setting]: value });
    }

    /**
     * @type {IDBDatabase}
     */
    const db = await new Promise((resolve, reject) => {
        const req = indexedDB.open('files', 1);

        req.onupgradeneeded = () => {
            req.result.createObjectStore('files');
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

    function saveFile(path, data) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('files', 'readwrite');
            tx.objectStore('files').put(data, path);
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    }
    function getFile(path) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('files', 'readonly');
            const request = tx.objectStore('files').get(path);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    const clientVersion = (await chrome.storage.sync.get('flagVersion')).flagVersion;
    const cdnMeta = await (await fetch('https://api.github.com/repos/idkhow2type/flagmoji/releases/latest')).json();
    
    if (clientVersion !== cdnMeta.tag_name) {
        const url = cdnMeta.assets[0].browser_download_url;
        const data = await (await fetch(url)).arrayBuffer();
        const zip = new JSZip();
        await zip.loadAsync(data);

        for (const key in zip.files) {
            const file = zip.files[key];
            if (file.dir) {
                continue;
            }
            saveFile(file.name.split('/').at(-1), await file.async('blob'));
        }

        chrome.storage.sync.set({ flagVersion: cdnMeta.tag_name });
    }

    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        const res = {
            data: [...new Uint8Array(await (await getFile(message + '.svg')).arrayBuffer())],
            type: 'image/svg+xml',
        };
        sendResponse(res);
    });
})();
