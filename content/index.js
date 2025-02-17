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
     * @param {string} str
     * @param {number} start
     * @returns {[string, number] | null}
     */
    function parseCode(str, start) {
        str = str.slice(start);
        let src = null;
        let emoji = null;

        // this is really ugly and confusing
        // but im here to make it work, not make it good
        if ((emoji = str.match(/^(?:\uD83C[\uDDE6-\uDDFF]){2}/)?.[0])) {
            str = str.slice(0, 4);
            src = '';
            for (let i = 1; i < str.length; i += 2) {
                src += String.fromCodePoint('a'.codePointAt(0) + str.charCodeAt(i) - 0xdde6);
            }
        } else if ((emoji = str.match(/^\ud83c\udff4(?:\uDB40[\uDC61-\uDC7A]){5}\uDB40\uDC7F/)?.[0])) {
            str = str.slice(0, 12);
            src = '';
            for (let i = 3; i < str.length; i += 2) {
                src += String.fromCodePoint('a'.codePointAt(0) + str.charCodeAt(i) - 0xdc61);
            }
        } else if ((emoji = str.match(/^\ud83c\udff3\ufe0f\u200d\u26a7\ufe0f/)?.[0])){
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
        // funky retain null
        src = src && (srcMaps[src] || `https://flagcdn.com/${src}.svg`);

        return { emoji, src };
    }

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

            const frag = document.createDocumentFragment();
            frag.appendChild(document.createTextNode(''));

            let replaced = false;
            for (let i = 0; i < textNode.textContent.length; i++) {
                const { emoji, src } = parseCode(textNode.textContent, i);
                if (!emoji) {
                    frag.lastChild.textContent += textNode.textContent[i];
                    continue;
                }
                replaced = true;

                // kinda tempted to write this as a string so its easier to read
                // this is easier to use though
                const span = document.createElement('span');
                span.className = 'flagmoji';
                const img = document.createElement('img');
                img.src = src;
                img.alt = emoji;
                span.appendChild(img);
                frag.appendChild(span);

                i += emoji.length - 1;
                frag.appendChild(document.createTextNode(''));
            }

            // actually a dumb hack cuz some frameworks want to
            // treat the original text node as one node
            // dont really know why this avoids that, it probably doesnt
            if (replaced) textNode.replaceWith(frag);
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

    chrome.runtime.onMessage.addListener(async (message) => {
        // this is so dumb
        ({ size, padding } = { size, padding, ...message });
        // you can also do this, so pick your poison
        // ({ size = size, padding = padding } = message);

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
