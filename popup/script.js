import settings from '../settings.js';

const main = document.querySelector('main');

for (const setting in settings) {
    const wrap = document.querySelector('#range-template').content.cloneNode(true);
    const label = wrap.querySelector('label');
    const input = wrap.querySelector('input');
    const reset = wrap.querySelector('button');

    input.min = settings[setting].min;
    input.max = settings[setting].max;
    input.step = settings[setting].step;

    // state management is so real
    const value = (await chrome.storage.sync.get({ [setting]: settings[setting].default }))[setting];

    label.innerText = `${setting[0].toUpperCase()}${setting.slice(1)}: ${value}${settings[setting].unit}`;
    input.name = setting;
    input.value = value;

    input.addEventListener('input', async () => {
        label.innerText = `${setting[0].toUpperCase()}${setting.slice(1)}: ${input.value}${settings[setting].unit}`;
        chrome.storage.sync.set({ [setting]: input.value });
        for (const tab of await chrome.tabs.query({ discarded: false })) {
            chrome.tabs.sendMessage(tab.id, 'update');
        }
    });

    reset.addEventListener('click', async () => {
        input.value = settings[setting].default;
        label.innerText = `${setting[0].toUpperCase()}${setting.slice(1)}: ${input.value}${settings[setting].unit}`;
        chrome.storage.sync.set({ [setting]: input.value });
        for (const tab of await chrome.tabs.query({ discarded: false })) {
            chrome.tabs.sendMessage(tab.id, 'update');
        }
    });

    main.appendChild(wrap);
    main.appendChild(document.createElement('hr'));
}

main.lastElementChild.remove();
