const exportBookCatalogElement = document.getElementById('exportBookCatalogId');
const exportBookNotesElement = document.getElementById('exportBookNotesId');

exportBookCatalogElement.addEventListener('click', async () => {
    try {
        debugger;
        const tab = await chrome.tabs.query({active: true, currentWindow: true});
        if (tab.length < 1) {
            console.log('未获取到标签页');
            return;
        }

        // 获取当前活动标签页的 ID
        const tabId = tab[0].id;
        await chrome.scripting.executeScript({
            target: {tabId},
            function: exportBookCatalogFun
        });
    } catch (error) {
        console.error('读取失败:', error);
    }
});

// 导出书籍目录
function exportBookCatalogFun() {
    debugger;

    // 获取书籍目录
    function fetchBookCatalogFun() {
        // 定义 Catalog 构造函数
        function Catalog(name, level) {
            this.name = name; // 目录名称
            this.level = level; // 目录级别
            this.children = [];
        }

        // 获取书籍目录的父级标签
        const catalogParentElement = document.getElementsByClassName("readerCatalog_list"); // <ul data-body-scroll-lock-ignore="1" class="readerCatalog_list">
        console.log(catalogParentElement);

        // 获取书籍目录的子级标签
        const catalogElements = catalogParentElement[0].children; // <li class="readerCatalog_list_item">

        const notes = [];
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
                notes.push(catalog);
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
        return notes;
    }

    // 构建书籍目录文本
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

    // 导出文本
    function exportTextFun(text) {
        const blob = new Blob([text], {type: 'text/plain'}); // 创建文本 Blob
        const url = URL.createObjectURL(blob); // 定义 url

        const a = document.createElement('a');
        a.href = url;
        a.download = 'book_catalog.md'; // 可以根据需要改文件名
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // 清理内存
    }

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
