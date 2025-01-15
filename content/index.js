(async () => {
    // the cool thing with this is it still doesnt give type hints
    const src = chrome.runtime.getURL('../settings.js');
    const settings = (await import(src)).default;

    const { size, padding, excluded_tags } = await chrome.storage.sync.get({
        size: settings.size.default,
        padding: settings.padding.default,
        excluded_tags: settings.excluded_tags.default,
    });

    /**
     * @param {Node} node
     */
    function flagify(node) {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }
        for (const textNode of textNodes) {
            if (!textNode.parentElement) continue; // how tf does this happen
            if (excluded_tags.includes(textNode.parentElement.tagName)) continue;

            const html = textNode.textContent.replaceAll(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g, (match) => {
                const regionCode =
                    'abcdefghijklmnopqrstuvwxyz'[match.charCodeAt(1) - 56806] +
                    'abcdefghijklmnopqrstuvwxyz'[match.charCodeAt(3) - 56806];

                const span = document.createElement('span');
                span.className = 'flagmoji';
                const img = document.createElement('img');
                img.src = `https://flagcdn.com/${regionCode}.svg`;
                img.alt = match;
                span.appendChild(img);

                return span.outerHTML;
            });

            const wrapper = document.createElement('div');
            wrapper.innerHTML = html;
            textNode.replaceWith(wrapper);
            wrapper.outerHTML = wrapper.innerHTML;
        }
    }

    const style = document.createElement('style');
    style.textContent = `
        span.flagmoji {
            display: inline-flex;
            height: 1lh;
            vertical-align: bottom;
            align-items: center;
        }
        span.flagmoji img {
            box-sizing: border-box;
            width: ${size}em;
            height: auto;
            padding: 0 calc(${size}em * ${padding} / 200);
        }
    `;
    document.head.appendChild(style);
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

    chrome.storage.onChanged.addListener(async (changes) => {
        const { size, padding } = await chrome.storage.sync.get({
            size: settings.size.default,
            padding: settings.padding.default,
        });
        style.textContent = `
            span.flagmoji {
                display: inline-flex;
                height: 1lh;
                vertical-align: bottom;
                align-items: center;
            }
            span.flagmoji img {
                box-sizing: border-box;
                width: ${size}em;
                height: auto;
                padding: 0 calc(${size}em * ${padding} / 200);
            }
        `;
    });
})();
