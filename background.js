chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ enabled: true, size: 1, padding: 0.1 });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['./content.js'],
        });
    }
});
