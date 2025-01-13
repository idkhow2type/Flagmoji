(async () => {
    // the cool thing with this is it still doesnt give type hints
    const src = chrome.runtime.getURL('../settings.js');
    const settings = (await import(src)).default;

    const { size, padding } = await chrome.storage.sync.get({
        size: settings.size.default,
        padding: settings.padding.default,
    });

    /**
     * @param {HTMLElement} element
     */
    function flagify(element) {
        // years of programming
        // still have to match twice smh
        element.innerHTML = element.innerHTML.replaceAll(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g, (match) => {
            const regionCode = [...match.matchAll(/[\uDDE6-\uDDFF]/g)]
                .map((m) => 'abcdefghijklmnopqrstuvwxyz'[m[0].charCodeAt(0) - 56806])
                .join('');

            return `<img src="https://flagcdn.com/${regionCode}.svg" alt="${match}" style="width: ${
                size * (1 - padding)
            }em; padding: 0 ${size * (padding / 2)}em">`;
        });
    }

    flagify(document.body);
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type !== 'childList') continue;
            for (const node of mutation.addedNodes) {
                flagify(node);
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
