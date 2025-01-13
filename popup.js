const sizeSlider = document.querySelector('#size');
const sizeText = document.querySelector('label[for="size"]');
const paddingSlider = document.querySelector('#padding');
const paddingText = document.querySelector('label[for="padding"]');

function display() {
    chrome.storage.sync.get(['size', 'padding'], ({ size, padding }) => {
        sizeSlider.value = size;
        sizeText.innerText = `Size: ${size}em`;
        paddingSlider.value = padding;
        paddingText.innerText = `Padding: ${padding * 100}%`;
    });
}

display();

sizeSlider.addEventListener('input', () => {
    chrome.storage.sync.set({ size: sizeSlider.value });
    display();
});

paddingSlider.addEventListener('input', () => {
    chrome.storage.sync.set({ padding: paddingSlider.value });
    display();
});
