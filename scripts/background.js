console.log("扩展脚本：background.js");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const tabId = request.tabId;

    if (request.action === "fetchBookCatalogAction") {
        chrome.tabs.sendMessage(
            tabId,
            { action: "fetchBookCatalogFunAction" },
            (response) => {
                sendResponse(response);
            });
    } else if (request.action === "fetchBookNoteAction") {
        chrome.tabs.sendMessage(
            tabId,
            { action: "fetchBookNoteFunAction" },
            (response) => {
                sendResponse(response);
            });
    }
    
    return true; // 保持异步通道
});


/**
 * 导出书籍目录
 */
function exportBookCatalogFun() {
    console.log("获取目录开始")
    const catalogs = fetchBookCatalogFun();
    console.log(catalogs);
    console.log("获取目录结束")

    console.log("构建目录开始")
    const text = buildBookCatalogTextFun(catalogs);
    console.log(text);
    console.log("构建目录结束")

    console.log("导出开始");
    exportTextFun(text);
    console.log("导出结束")
}