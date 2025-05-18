const fetchBookNameElement = document.getElementById('fetchBookNameId');
const exportBookCatalogElement = document.getElementById('exportBookCatalogId');
const exportBookNotesElement = document.getElementById('exportBookNotesId');

//  获取书籍名称
fetchBookNameElement.addEventListener('click', async () => {
    try {
        // 获取当前激活 Tab
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        if (tab.length < 1) {
            console.log('未获取到标签页');
            return;
        }

        // 先注入内容脚本
        await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            files: ['scripts/context.js']
        });

        // 获取书籍名称（通过 background.js 触 发content.js 函数）
        const bookName = await chrome.runtime.sendMessage({
            action: "fetchBookNameAction",
            tabId: tab.id
        });
        console.log("获取到的书籍名称：", bookName)

        // 弹出书名
        alert(bookName);
    } catch (error) {
        console.error('读取失败:', error);
    }
});


// 导出书籍目录
exportBookCatalogElement.addEventListener('click', async () => {
    try {
        // 获取当前激活 Tab
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        if (tab.length < 1) {
            console.log('未获取到标签页');
            return;
        }

        // 先注入内容脚本
        await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            files: ['scripts/context.js']
        });

        // 获取书籍名称（通过 background.js 触 发content.js 函数）
        const bookName = await chrome.runtime.sendMessage({
            action: "fetchBookNameAction",
            tabId: tab.id
        });
        console.log("获取到的书籍名称：", bookName)

        // 获取书籍目录集合（通过 background.js 触 发content.js 函数）
        console.log("开始读取目录")
        const catalogs = await chrome.runtime.sendMessage({
            action: "fetchBookCatalogAction",
            tabId: tab.id
        });
        console.log("读取目录结束，读取到的结果：", catalogs)

        exportBookCatalogsFun("《" + bookName + "》目录", catalogs);
    } catch (error) {
        console.error('读取失败:', error);
    }
});

// 导出书籍目录和笔记
exportBookNotesElement.addEventListener("click", async () => {
    try {
        // 获取标签页
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        if (tab.length < 1) {
            console.log('未获取到标签页');
            return;
        }

        // 先注入内容脚本
        await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            files: ['scripts/context.js']
        });

        // 获取书籍名称（通过 background.js 触 发content.js 函数）
        const bookName = await chrome.runtime.sendMessage({
            action: "fetchBookNameAction",
            tabId: tab.id
        });
        console.log("获取到的书籍名称：", bookName)

        // 获取书籍目录集合（通过 background.js 触 发content.js 函数）
        console.log("开始读取目录")
        const catalogs = await chrome.runtime.sendMessage({
            action: "fetchBookCatalogAction",
            tabId: tab.id
        });
        console.log("读取目录结束，读取到的结果：", catalogs)

        console.log("开始读取笔记")
        const notes = await chrome.runtime.sendMessage({
            action: "fetchBookNoteAction",
            tabId: tab.id
        });
        console.log("读取笔记结束，读取到的结果：", notes)

        exportNotesFun("《" + bookName + "》书摘", catalogs, notes);
    } catch (error) {
        console.error('读取失败:', error);
    }
})

// 导出书籍目录
function exportBookCatalogsFun(bookName, catalogs) {
    console.log("构建目录开始")
    const text = buildBookCatalogTextFun(catalogs);
    console.log(text);
    console.log("构建目录结束")

    console.log("导出开始");
    exportTextFun(bookName, text);
    console.log("导出结束")
}

// 导出书籍目录和笔记
function exportNotesFun(noteName, catalogs, notes) {
    console.log("构建目录和笔记开始")
    const text = buildBookNotesTextFun(catalogs, notes);
    console.log(text);
    console.log("构建目录和笔记结束")

    console.log("导出开始");
    exportTextFun(noteName, text);
    console.log("导出结束")
}


/**
 * 构建书籍目录文本
 * @param catalogs
 * @returns {string}
 */
function buildBookCatalogTextFun(catalogs) {
    if (null == catalogs || catalogs.length < 1) {
        return;
    }

    let result = "";
    let levelStr = "";
    for (let catalog of catalogs) {
        if ("1" === catalog.level) {
            levelStr = "#";
        } else if ("2" === catalog.level) {
            levelStr = "##";
        } else if ("3" === catalog.level) {
            levelStr = "###";
        } else if ("4" === catalog.level) {
            levelStr = "####";
        } else if ("5" === catalog.level) {
            levelStr = "#####";
        }
        result += levelStr + " " + catalog.name + "\n";
        // 递归处理子级目录
        if (null != catalog.children && catalog.children.length > 0) {
            result += buildBookCatalogTextFun(catalog.children);
        }
    }
    return result;
}

/**
 * 构建书籍目录和笔记文本
 * @param catalogs
 * @param notes
 * @returns {string}
 */
function buildBookNotesTextFun(catalogs, notes) {
    if (null == catalogs || catalogs.length < 1 || null == notes || notes.length < 1) {
        return;
    }

    let catalogNameMapNote = new Map;
    notes.forEach(note => catalogNameMapNote.set(note.catalogName, note));

    let result = "";
    let levelStr = "";
    for (const catalog of catalogs) {
        if ("1" === catalog.level) {
            levelStr = "#";
        } else if ("2" === catalog.level) {
            levelStr = "##";
        } else if ("3" === catalog.level) {
            levelStr = "###";
        } else if ("4" === catalog.level) {
            levelStr = "####";
        } else if ("5" === catalog.level) {
            levelStr = "#####";
        }
        result += levelStr + " " + catalog.name + "\n";

        // 查找笔记
        const note = catalogNameMapNote.get(catalog.name);
        if (null != note && null != note.contents && note.contents.length > 0) {
            const contents = note.contents;
            const contentLength = contents.length;
            for (let index = 0; index < contentLength; index++) {
                const content = contents[index];
                if (index !== (contentLength - 1)) {
                    result += content + "\n\n\n";
                } else {
                    result += content + "\n";
                }
            }
        }

        // 递归处理子级目录
        if (null != catalog.children && catalog.children.length > 0) {
            result += buildBookNotesTextFun(catalog.children, notes);
        }
    }
    return result;
}

/**
 * 导出文本
 * @param noteName
 * @param text
 */
function exportTextFun(noteName, text) {
    const blob = new Blob([text], {type: 'text/plain'}); // 创建文本 Blob
    const url = URL.createObjectURL(blob); // 定义 url

    const a = document.createElement('a');
    a.href = url;
    a.download = noteName + '.md'; // 可以根据需要改文件名
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // 清理内存
}