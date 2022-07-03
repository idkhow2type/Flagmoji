const enableBtn = document.querySelector('#switch');
const enableTxt = document.querySelector('label[for="switch"]');
const sizeSlider = document.querySelector('#size');
const sizeText = document.querySelector('label[for="size"]');
const paddingSlider = document.querySelector('#padding');
const paddingText = document.querySelector('label[for="padding"]');
const resetBtn = document.querySelector('#reset');
const note = document.querySelector('#note');

function display() {
    chrome.storage.sync.get(
        ['enabled', 'size', 'padding'],
        ({ enabled, size, padding }) => {
            enableBtn.style.filter = enabled ? 'grayscale(0)' : 'grayscale(1)';
            enableTxt.innerText = enabled ? 'Enabled' : 'Disabled';
            sizeSlider.value = size;
            sizeText.innerText = `Size: ${size}em`;
            paddingSlider.value = padding;
            paddingText.innerText = `Padding: ${padding * 100}%`;
        }
    );
}

display();

enableBtn.addEventListener('click', () => {
    chrome.storage.sync.get('enabled', ({ enabled }) => {
        chrome.storage.sync.set({ enabled: !enabled });
    });
    display();
    note.style.display = 'block';
});

sizeSlider.addEventListener('input', () => {
    chrome.storage.sync.set({ size: sizeSlider.value });
    display();
    note.style.display = 'block';
});

paddingSlider.addEventListener('input', () => {
    chrome.storage.sync.set({ padding: paddingSlider.value });
    display();
    note.style.display = 'block';
});

resetBtn.addEventListener('click', () => {
    chrome.storage.sync.set({ size: 1, padding: 0.1 });
    display();
    note.style.display = 'block';
});