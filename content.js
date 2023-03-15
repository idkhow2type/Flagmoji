function unicodeToImg(text, size = 1, padding = 0.1) {
    // const { size } = await chrome.storage.sync.get('size');
    return text.replaceAll(
        /[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g,
        (match) => {
            const regionCode = [...match.matchAll(/[\uDDE6-\uDDFF]/g)]
                .map(
                    (m) =>
                        'abcdefghijklmnopqrstuvwxyz'[m[0].charCodeAt(0) - 56806]
                )
                .join('');
            return `<img src="https://flagcdn.com/${regionCode}.svg" alt="${match}" style="width: ${
                size * (1 - padding)
            }em; padding: 0 ${size * (padding / 2)}em">`;
        }
    );
}

function textNodesToFlag(el) {
    async function nodeToFlag(node) {
        if (
            /[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g.test(
                node.textContent
            )
        ) {
            // replace node with html
            // why isn't there an easier way to do this?
            const { size, padding } = await chrome.storage.sync.get(['size', 'padding']);
            const wrapper = document.createElement('div');
            wrapper.innerHTML = unicodeToImg(node.textContent, size, padding);
            node.replaceWith(wrapper);
            wrapper.outerHTML = wrapper.innerHTML;
        }
    }
    if (el.nodeType === Node.TEXT_NODE) {
        nodeToFlag(el);
        return;
    }
    var n,
        a = [],
        walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    while ((n = walk.nextNode())) a.push(n);
    const disable = ['SCRIPT','STYLE','TITLE']
    a.forEach((node) => {
        if (disable.includes(node.parentElement.tagName)) return;
        nodeToFlag(node);
    });
}

try {
    // use var to make it global
    var observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    textNodesToFlag(node);
                });
            }
        });
    });
} catch (e) {}

chrome.storage.sync.get('enabled', ({ enabled }) => {
    if (!enabled) return;
    textNodesToFlag(document.body);
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
});
