(async () => {
    // the cool thing with this is it still doesnt give type hints
    const src = chrome.runtime.getURL('../settings.js');
    const settings = (await import(src)).default;

    let { size, padding, excluded_tags } = await chrome.storage.sync.get({
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
            if (excluded_tags.includes(textNode.parentElement.tagName)) continue;

            const flagPattern = /(?:\uD83C[\uDDE6-\uDDFF]){2}/;
            const gbPattern = /\ud83c\udff4(?:\uDB40[\uDC61-\uDC7A]){5}\uDB40\uDC7F/;
            const transPattern = /\ud83c\udff3\ufe0f\u200d\u26a7\ufe0f/;

            const combined = new RegExp(`(${flagPattern.source})|(${gbPattern.source})|(${transPattern.source})`, 'g');

            let replaced = false;
            const frag = document.createDocumentFragment();
            let lastIndex = 0;
            let match;

            while ((match = combined.exec(textNode.textContent)) !== null) {
                // Add the text before the emoji
                if (match.index > lastIndex) {
                    frag.appendChild(document.createTextNode(textNode.textContent.substring(lastIndex, match.index)));
                }

                let src = null;
                let emoji = null;

                if (match[1]) {
                    // Flag emoji
                    emoji = match[1];
                    src = '';
                    for (let i = 1; i < emoji.length; i += 2) {
                        src += String.fromCodePoint('a'.codePointAt(0) + emoji.charCodeAt(i) - 0xdde6);
                    }
                } else if (match[2]) {
                    // GB emoji
                    emoji = match[2];
                    src = '';
                    for (let i = 3; i < emoji.length; i += 2) {
                        src += String.fromCodePoint('a'.codePointAt(0) + emoji.charCodeAt(i) - 0xdc61);
                    }
                } else if (match[3]) {
                    // Trans emoji
                    emoji = match[3];
                    src = 'trans';
                }

                const codeMaps = {
                    ac: 'sh',
                    cp: 'fr',
                    dg: 'io',
                    ta: 'sh',
                    ea: 'es',
                    gbeng: 'gb-eng',
                    gbsct: 'gb-sct',
                    gbwls: 'gb-wls',
                };
                src = codeMaps[src] || src;

                const srcMaps = {
                    ic: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Flag_of_the_Canary_Islands_%28simple%29.svg',
                    trans: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Transgender_Pride_flag.svg',
                };

                src = src && (srcMaps[src] || `https://flagcdn.com/${src}.svg`);

                if (emoji) {
                    replaced = true;

                    const span = document.createElement('span');
                    span.className = 'flagmoji';
                    const img = document.createElement('img');
                    img.src = src;
                    img.alt = emoji;
                    img.addEventListener('copy', (e) => {
                        e.preventDefault();
                        e.clipboardData.setData('text/plain', emoji);
                    });
                    span.appendChild(img);
                    frag.appendChild(span);
                }

                lastIndex = combined.lastIndex;
            }

            // Add the remaining text after the last emoji
            if (lastIndex < textNode.textContent.length) {
                frag.appendChild(document.createTextNode(textNode.textContent.substring(lastIndex)));
            }

            if (replaced) {
                textNode.replaceWith(frag);
            }
        }
    }

    const style = document.createElement('style');
    // TODO: maybe use css variables for this
    function setStyle(size, padding) {
        style.textContent = `
            span.flagmoji {
                all: unset;
                display: inline-flex;
                height: 1lh;
                vertical-align: bottom;
                align-items: center;
            }
            span.flagmoji img {
                all: unset;
                box-sizing: border-box;
                width: ${size}em;
                height: auto;
                padding: 0 calc(${size}em * ${padding} / 200);
            }
        `;
    }

    setStyle(size, padding);
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

    chrome.runtime.onMessage.addListener(async (message) => {
        // this is so dumb
        ({ size, padding } = { size, padding, ...message });
        // you can also do this, so pick your poison
        // ({ size = size, padding = padding } = message);

        setStyle(size, padding);
    });
})();
