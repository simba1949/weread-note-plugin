console.log("内容脚本：context.js");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchBookCatalogFunAction") {
        const result = fetchBookCatalogFun();
        sendResponse(result); // 确保 response 数据被正确返回
    } else if (request.action === "fetchBookNoteFunAction") {
        const result = fetchBookNoteFun();
        sendResponse(result); // 确保 response 数据被正确返回
    } else if (request.action === "fetchBookNameFunAction") {
        const result = fetchBookNameFun();
        sendResponse(result); // 确保 response 数据被正确返回
    }

    return true; // 保持异步响应
});

/**
 * 获取书籍名称
 * @returns 书籍名称
 */
window.fetchBookNameFun = function fetchBookNameFun() {
    let bookName = "";
    const titleA = document.getElementsByClassName("wr_reader_note_panel_header_cell_info_title"); // <div data-v-31681d46 class="wr_reader_note_panel_header_cell_info_title">
    if (null != titleA && titleA.length > 0) {
        bookName = titleA[0].textContent;
    }
    if (null == bookName || bookName.trim().length === 0) {
        const titleB = document.getElementsByClassName("readerCatalog_bookInfo_title_txt");
        if (null != titleB && titleB.length > 0) {
            bookName = titleB[0].textContent;
        }
    }
    return bookName;
}

/**
 * 获取书籍目录
 * @returns 返回集合 [{'name':'','level':'','children':['']}]
 */
window.fetchBookCatalogFun = function fetchBookCatalogFun() {
    // 定义 Catalog 构造函数
    function Catalog(name, level) {
        this.name = name; // 目录名称
        this.level = level; // 目录级别
        this.children = [];
    }

    // 获取书籍目录的父级标签
    const catalogParentElement = document.getElementsByClassName("readerCatalog_list"); // <ul data-body-scroll-lock-ignore="1" class="readerCatalog_list">
    if (!catalogParentElement || catalogParentElement.length === 0) {
        console.error("未找到目录父级元素");
        return [];
    }

    // 【集合】获取书籍目录的子级标签集合
    const catalogElements = catalogParentElement[0].children; // <li class="readerCatalog_list_item">

    const catalogs = [];
    let lastLevel1Catalog = null;
    let lastLevel2Catalog = null;
    let lastLevel3Catalog = null;
    let lastLevel4Catalog = null;
    let lastLevel5Catalog = null;

    for (let catalogElement of catalogElements) {
        // 目录第一层
        const element1F = catalogElement.children[0]; // <div class="readerCatalog_list_item_inner readerCatalog_list_item_level_1">
        if (null == element1F) {
            continue;
        }

        const element1FClassName = element1F.className; // readerCatalog_list_item_inner readerCatalog_list_item_level_1
        if (null == element1FClassName) {
            continue;
        }

        const element1FClassNameArray = element1FClassName.split(" ");
        const lastClassName = element1FClassNameArray[element1FClassNameArray.length - 1]; // readerCatalog_list_item_level_1
        const lastClassNameSplitArray = lastClassName.split("_");
        if (null == lastClassNameSplitArray) {
            continue;
        }

        // 获取书籍目录级别
        const catalogLevel = lastClassNameSplitArray[lastClassNameSplitArray.length - 1]; // "1"
        // 目录第二层
        const element2F = element1F.children; // <div class="readerCatalog_list_item_info">
        if (null == element2F) {
            continue;
        }

        // 目录第三层
        const element3F = element2F[0].children; // <div class="readerCatalog_list_item_title">
        if (null == element3F) {
            continue;
        }

        // 目录第四层
        const element4F = element3F[0].children; // <div class="readerCatalog_list_item_title_text">
        if (null == element4F) {
            continue;
        }
        const catalogName = element4F[0].textContent;

        const catalog = new Catalog(catalogName, catalogLevel);

        if ("1" === catalogLevel) {
            lastLevel1Catalog = catalog;
            catalogs.push(catalog);
        } else if ("2" === catalogLevel) {
            lastLevel1Catalog.children.push(catalog);
            lastLevel2Catalog = catalog;
        } else if ("3" === catalogLevel) {
            lastLevel2Catalog.children.push(catalog);
            lastLevel3Catalog = catalog;
        } else if ("4" === catalogLevel) {
            lastLevel3Catalog.children.push(catalog);
            lastLevel4Catalog = catalog;
        } else if ("5" === catalogLevel) {
            lastLevel4Catalog.children.push(catalog);
            lastLevel5Catalog = catalog;
        }
    }
    return catalogs;
}

/**
 * 获取书籍笔记
 * @returns 返回集合 [{'catalogName':'', 'contents':['']}]
 */
window.fetchBookNoteFun = function fetchBookNoteFun() {
    // 定义 Note 构造函数
    function Note() {
        this.catalogName = ""; // 目录名称
        this.contents = []; // 笔记内容
    }

    // 结果容器
    const notes = [];

    // 获取笔记的父级标签
    const noteParentElement = document.getElementsByClassName("readerNoteList"); // <div class="readerNoteList">
    // 【集合】获取笔记的子级标签集合
    const noteElements = noteParentElement[0].children;
    for (let noteElement of noteElements) {  // <div data-v-beebaeca class="wr_reader_note_panel_chapter_wrapper">
        const catalogAndNotes = noteElement.children;

        let noteObj = new Note();
        for (let catalogAndNoteElement of catalogAndNotes) {
            const className = catalogAndNoteElement.className;
            if ("wr_reader_note_panel_chapter_title" === className) {
                noteObj.catalogName = catalogAndNoteElement.textContent;  // 目录名称
            } else {
                const notePanelItems = catalogAndNoteElement.children; // <div data-v-451b641e data-v-beebaeca class="wr_reader_note_panel_item_cell_wrapper clickable">
                for (let notePanelItem of notePanelItems) {
                    const className = notePanelItem.className;
                    if ("wr_reader_note_panel_item_cell_content" === className) { // <div data-v-451b641e class="wr_reader_note_panel_item_cell_content">
                        const cellContents = notePanelItem.children;
                        for (let cellContent of cellContents) {
                            const className = cellContent.className;
                            if ("wr_reader_note_panel_item_cell_content_text" === className) { // <div data-v-451b641e class="wr_reader_note_panel_item_cell_content_text">
                                let realContent = cellContent.textContent;
                                realContent = realContent.replaceAll("[插图]\n", "").replaceAll("[插图]", "");
                                if (null != realContent && "" !== realContent) {
                                    noteObj.contents.push(realContent); // 笔记内容
                                }

                            }
                        }
                    }
                }
            }
        }
        notes.push(noteObj);
    }
    return notes;
}