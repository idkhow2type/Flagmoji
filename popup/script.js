import settings from '../settings.js';
import { debounce } from '../utils.js';

const setSettings = debounce((obj) => chrome.storage.sync.set(obj), 500);

const main = document.querySelector('main');

/**
 * @param {Object} setting
 * @returns {Promise<DocumentFragment>}
 */
async function numberComponent(setting) {
    const wrap = document.querySelector('#range-template').content.cloneNode(true);
    /**
     * @type {HTMLLabelElement}
     */
    const label = wrap.querySelector('label');
    /**
     * @type {HTMLInputElement}
     */
    const input = wrap.querySelector('input');
    /**
     * @type {HTMLButtonElement}
     */
    const reset = wrap.querySelector('button');

    input.min = settings[setting].min;
    input.max = settings[setting].max;
    input.step = settings[setting].step;

    const labelText = (setting[0].toUpperCase() + setting.slice(1)).replace('_', ' ');

    /**
     * @type {number}
     */
    const value = (await chrome.storage.sync.get({ [setting]: settings[setting].default }))[setting];

    label.innerText = `${labelText}: ${value}${settings[setting].unit}`;
    input.name = setting;
    input.value = value;

    input.addEventListener('input', async () => {
        label.innerText = `${labelText}: ${input.value}${settings[setting].unit}`;
        setSettings({ [setting]: input.value });
        for (const tab of await chrome.tabs.query({ discarded: false, status: 'complete' })) {
            chrome.tabs.sendMessage(tab.id, { [setting]: input.value});
        }
    });

    reset.addEventListener('click', async () => {
        input.value = settings[setting].default;
        label.innerText = `${labelText}: ${input.value}${settings[setting].unit}`;
        setSettings({ [setting]: input.value });
        for (const tab of await chrome.tabs.query({ discarded: false, status: 'complete' })) {
            chrome.tabs.sendMessage(tab.id, { [setting]: input.value});
        }
    });

    return wrap;
}

/**
 * @param {Object} setting
 * @returns {Promise<DocumentFragment>}
 */
async function listComponent(setting) {
    const wrap = document.querySelector('#textarea-template').content.cloneNode(true);
    /**
     * @type {HTMLLabelElement}
     */
    const label = wrap.querySelector('label');
    /**
     * @type {HTMLTextAreaElement}
     */
    const textarea = wrap.querySelector('textarea');
    /**
     * @type {HTMLButtonElement}
     */
    const reset = wrap.querySelector('button');

    /**
     * @type {string[]}
     */
    const value = (await chrome.storage.sync.get({ [setting]: settings[setting].default }))[setting];

    label.innerText = (setting[0].toUpperCase() + setting.slice(1)).replace('_', ' ');
    textarea.name = setting;
    textarea.value = value.join('\n').toLowerCase();

    textarea.addEventListener('input', async () => {
        const list = textarea.value.toUpperCase().split('\n');
        setSettings({ [setting]: list });
    });

    reset.addEventListener('click', async () => {
        textarea.value = settings[setting].default.join('\n').toLowerCase();
        setSettings({ [setting]: settings[setting].default });
    });

    return wrap;
}

for (const setting in settings) {
    const components = {
        number: numberComponent,
        list: listComponent,
    };

    main.appendChild(await components[settings[setting].type](setting));
    main.appendChild(document.createElement('hr'));
}

main.lastElementChild.remove();
