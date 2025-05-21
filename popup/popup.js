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
        const bookName = await chrome.runtime.sendMessage(
            {
                action: "fetchBookNameAction",
                tabId: tab.id
            });

        console.log("获取到的书籍名称：", bookName)

        if (null != bookName) {
            alert(bookName);
        }
    } catch (error) {
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
        if (null == bookName) {
            return;
        }

        // 获取书籍目录集合（通过 background.js 触 发content.js 函数）
        console.log("开始读取目录")
        const catalogs = await chrome.runtime.sendMessage({
            action: "fetchBookCatalogAction",
            tabId: tab.id
        });
        console.log("读取目录结束，读取到的结果：", catalogs)

        exportBookCatalogsFun("《" + bookName + "》目录", catalogs);
    } catch (error) {
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
        if (null == bookName) {
            return;
        }

        // 获取书籍目录集合（通过 background.js 触发 content.js 函数）
        console.log("开始读取目录")
        const catalogs = await chrome.runtime.sendMessage({
            action: "fetchBookCatalogAction",
            tabId: tab.id
        });
        console.log("读取目录结束，读取到的结果：", catalogs)
        if (null == catalogs || catalogs.length < 1) {
            return;
        }

        // 获取书籍笔记集合（通过 background.js 触发 content.js 函数）
        console.log("开始读取笔记")
        const notes = await chrome.runtime.sendMessage({
            action: "fetchBookNoteAction",
            tabId: tab.id
        });
        console.log("读取笔记结束，读取到的结果：", notes)
        if (null == notes || notes.length < 1) {
            return;
        }

        // 获取导出笔记格式
        const exportNoteType = document.getElementById("exportFormatSelect").value;
        if (null == exportNoteType) {
            return;
        }

        // 导出
        exportNotesFun("《" + bookName + "》书摘", catalogs, notes, exportNoteType);
    } catch (error) {
    }
})

/**
 * 导出书籍目录
 * @param bookName 书籍名称
 * @param catalogs 书籍目录集合
 */
function exportBookCatalogsFun(bookName, catalogs) {
    console.log("构建目录开始")
    const text = buildBookCatalogTextFun(catalogs);
    console.log(text);
    console.log("构建目录结束")

    console.log("导出开始");
    exportTextFun(bookName, text);
    console.log("导出结束")
}

/**
 * 导出书籍目录和笔记
 * @param exportNoteName 导出笔记的名称
 * @param catalogs 书籍目录集合
 * @param notes 书籍笔记集合
 * @param exportNoteType 导出笔记的格式
 */
function exportNotesFun(exportNoteName, catalogs, notes, exportNoteType) {
    console.log("构建目录和笔记开始")
    const text = buildBookNotesTextFun(catalogs, notes, exportNoteType);
    console.log(text);
    console.log("构建目录和笔记结束")

    console.log("导出开始");
    exportTextFun(exportNoteName, text);
    console.log("导出结束")
}

/**
 * 构建书籍目录文本
 * @param catalogs
 * @returns {string}
 */
function buildBookCatalogTextFun(catalogs) {
    if (null == catalogs || catalogs.length < 1) {
        return "";
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
 * @param catalogs 书籍目录
 * @param notes 书籍笔记
 * @param exportNoteType 导出笔记的格式
 * @returns {string} 文本
 */
function buildBookNotesTextFun(catalogs, notes, exportNoteType) {
    if (null == catalogs || catalogs.length < 1 || null == notes || notes.length < 1) {
        return "";
    }

    // 笔记目录名称和笔记内容映射
    let catalogNameMapNote = new Map;
    notes.forEach(note => catalogNameMapNote.set(note.catalogName, note));

    let result = "";
    for (const catalog of catalogs) {
        result = buildMDTitle(result, catalog);

        // 查找笔记
        const note = catalogNameMapNote.get(catalog.name);
        let highBlockCnt = 0;

        if (null != note && null != note.contents && note.contents.length > 0) {
            const contents = note.contents;
            const contentLength = contents.length;
            for (let index = 0; index < contentLength; index++) {
                const content = contents[index];
                const finalContent = buildContent(exportNoteType, highBlockCnt, content)
                result += finalContent
                ++highBlockCnt;
            }
        }

        // 递归处理子级目录
        if (null != catalog.children && catalog.children.length > 0) {
            result += buildBookNotesTextFun(catalog.children, notes, exportNoteType);
        }
    }
    return result;
}

/**
 * 构建MD标题和名称
 * @param result 文本结果
 * @param catalog 目录
 * @returns {string} 文本结果
 */
function buildMDTitle(result, catalog) {
    let levelStr = "";

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
    return result;
}

/**
 * 构建 markdown 内容
 * @param exportNoteType 导出类型
 * @param highBlockCnt 高亮块计数器
 * @param content 内容
 * @returns {*}
 */
function buildContent(exportNoteType, highBlockCnt, content) {
    let finalContent = "";
    if ("yuque".toLowerCase() === exportNoteType.toLowerCase()) {
        const highBlockIndexMapName = fetchYueQueHighBlockFun();
        // 高亮块名称
        const highBlockName = highBlockIndexMapName.get(highBlockCnt % 2);
        finalContent = ":::" + highBlockName + "\n" + content + "\n:::\n";
    } else if ("markdownQuote".toLowerCase() === exportNoteType.toLowerCase()) {
        finalContent = "> " + content + "\n\n";
    } else if ("markdownSequence".toLowerCase() === exportNoteType.toLowerCase()) {
        finalContent = "* " + content + "\n\n";
    } else {
        finalContent = content + "\n\n";
    }

    return specialSequenceSymbolReplaceAll(finalContent);
}

/**
 * 特殊序列符号替换
 * @param content 文本
 * @returns {*}
 */
function specialSequenceSymbolReplaceAll(content) {
    // 特殊序列符号
    const specialSequenceSymbols = ["●", "● "]
    for (let specialSequenceSymbol of specialSequenceSymbols) {
        if (content.indexOf(specialSequenceSymbol) > -1) {
            content = content.replaceAll(specialSequenceSymbol, "\n* ")
        }
    }
    return content;
}

/**
 * 获取语雀高亮块名称集合
 * @returns {Map<any, any>}
 */
function fetchYueQueHighBlockFun() {
    // 定义高亮块，支持 info、tips、warning、danger、success
    let highBlockIndexMapName = new Map;
    highBlockIndexMapName.set(0, "info");
    highBlockIndexMapName.set(1, "tips");
    return highBlockIndexMapName;
}

/**
 * 导出文本
 * @param exportNoteName 导出笔记名称
 * @param text 文本
 */
function exportTextFun(exportNoteName, text) {
    const blob = new Blob([text], {type: 'text/plain'}); // 创建文本 Blob
    const url = URL.createObjectURL(blob); // 定义 url

    const a = document.createElement('a');
    a.href = url;
    a.download = exportNoteName + '.md'; // 可以根据需要改文件名
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // 清理内存
}