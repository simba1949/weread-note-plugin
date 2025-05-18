console.log("扩展脚本：background.js");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const tabId = request.tabId;

    if (request.action === "fetchBookCatalogAction") {
        chrome.tabs.sendMessage(
            tabId,
            {action: "fetchBookCatalogFunAction"},
            (response) => {
                sendResponse(response);
            });
    } else if (request.action === "fetchBookNoteAction") {
        chrome.tabs.sendMessage(
            tabId,
            {action: "fetchBookNoteFunAction"},
            (response) => {
                sendResponse(response);
            });
    } else if (request.action === "fetchBookNameAction") {
        chrome.tabs.sendMessage(
            tabId,
            {action: "fetchBookNameFunAction"},
            (response) => {
                sendResponse(response);
            });
    }

    return true; // 保持异步通道
});