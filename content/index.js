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

            const frag = document.createDocumentFragment();
            frag.appendChild(document.createTextNode(''));

            for (let i = 0; i < textNode.textContent.length; i++) {
                if (
                    !(
                        textNode.textContent.charCodeAt(i) === 0xd83c &&
                        0xdde6 <= textNode.textContent.charCodeAt(i + 1) &&
                        textNode.textContent.charCodeAt(i + 1) <= 0xddff &&
                        0xd83c <= textNode.textContent.charCodeAt(i + 2) &&
                        0xdde6 <= textNode.textContent.charCodeAt(i + 3) &&
                        textNode.textContent.charCodeAt(i + 3) <= 0xddff
                    )
                ) {
                    frag.lastChild.textContent += textNode.textContent[i];
                    continue;
                }

                const regionCode =
                    'abcdefghijklmnopqrstuvwxyz'[textNode.textContent.charCodeAt(i + 1) - 56806] +
                    'abcdefghijklmnopqrstuvwxyz'[textNode.textContent.charCodeAt(i + 3) - 56806];
                const span = document.createElement('span');
                span.className = 'flagmoji';
                const img = document.createElement('img');
                img.src = `https://flagcdn.com/${regionCode}.svg`;
                img.alt = textNode.textContent.slice(i, i + 4);
                span.appendChild(img);
                frag.appendChild(span);

                i += 3;
                frag.appendChild(document.createTextNode(''));
            }

            textNode.replaceWith(frag);
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
