(async () => {
    // the cool thing with this is it still doesnt give type hints
    const src = chrome.runtime.getURL('../settings.js');
    const settings = (await import(src)).default;

    const { size, padding } = await chrome.storage.sync.get({
        size: settings.size.default,
        padding: settings.padding.default,
    });

    /**
     * @param {Node} node
     */
    function flagify(node) {
        // years of programming
        // still have to match twice smh
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }
        for (const textNode of textNodes) {
            // todo: user configurable blacklist
            if (['SCRIPT', 'STYLE', 'TITLE'].includes(textNode.parentElement.tagName)) continue;

            const html = textNode.textContent.replaceAll(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g, (match) => {
                const regionCode =
                    'abcdefghijklmnopqrstuvwxyz'[match.charCodeAt(1) - 56806] +
                    'abcdefghijklmnopqrstuvwxyz'[match.charCodeAt(3) - 56806];

                const span = document.createElement('span');
                span.style = `
                    display: inline-flex;
                    height: 1lh;
                    vertical-align: bottom;
                    align-items: center;
                `;
                const img = document.createElement('img');
                img.src = `https://flagcdn.com/${regionCode}.svg`;
                img.alt = match;
                img.style = `
                    box-sizing: border-box;
                    width: ${size}em;
                    height: auto;
                    padding: 0 calc(${size}em * ${padding} / 200);
                `;
                span.appendChild(img);

                return span.outerHTML;
            });

            const wrapper = document.createElement('div');
            wrapper.innerHTML = html;
            textNode.replaceWith(wrapper);
            wrapper.outerHTML = wrapper.innerHTML;
        }
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