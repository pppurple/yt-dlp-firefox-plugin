/*
On startup, connect to the "yt-dlp-executor" app.
*/
let mainPort = browser.runtime.connectNative("yt_dlp_executor");

function createNewPort() {
    return browser.runtime.connectNative("yt_dlp_executor");
}

async function listenFromNativeApp(response) {
    console.log("Received: " + response.type);
    if (response.type == "list") {
        var ignore = true;
        var lines = response.res.split('\n');
        var formats = lines.filter(function (line) {
            if (line.startsWith("ID ")) {
                ignore = false;
            }
            if (line.startsWith("-----")) {
                return;
            }
            if (!ignore) {
                return line;
            }
        });

        var views = browser.extension.getViews({
            type: "popup"
        });
        const document = views[0].document
        const tbl = document.createElement("table");

        tbl.setAttribute("id", "listTable");
        const tblBody = document.createElement("tbody");

        // Create table.
        if (response.res.includes("tver.jp")) {
            for (const format of formats) {
                if (format.includes("video only")) {
                    for (const audio of ["wa", "ba"]) {
                        const row = document.createElement("tr");

                        if (audio === "wa") {
                            row.style.backgroundColor = "lightblue";
                        }

                        const columns = format.split(/\s+/).slice(0, 12);

                        for (let j = 0; j < columns.length; j++) {
                            const cell = document.createElement("td");
                            let cellText;
                            if (j == 0 || j == 2) {
                                cellText = document.createTextNode(columns[j] + `+${audio}`);
                            } else {
                                cellText = document.createTextNode(columns[j]);
                            }
                            cell.setAttribute("id", columns[0] + `+${audio}`);
                            cell.appendChild(cellText);
                            row.appendChild(cell);
                        }
                        tblBody.appendChild(row);
                    }
                } else {
                    const row = document.createElement("tr");
                    const columns = format.split(/\s+/).slice(0, 12);

                    for (let j = 0; j < columns.length; j++) {
                        const cell = document.createElement("td");
                        const cellText = document.createTextNode(columns[j]);
                        cell.setAttribute("id", columns[0]);
                        cell.appendChild(cellText);
                        row.appendChild(cell);
                    }

                    tblBody.appendChild(row);
                }
            }
        } else {
            for (const format of formats) {
                const row = document.createElement("tr");
                if (format.includes("audio only") || format.includes("video only")) {
                    continue;
                }
                const columns = format.split(/\s+/).slice(0, 12);

                for (let j = 0; j < columns.length; j++) {
                    const cell = document.createElement("td");
                    const cellText = document.createTextNode(columns[j]);
                    cell.setAttribute("id", columns[0]);
                    cell.appendChild(cellText);
                    row.appendChild(cell);
                }

                tblBody.appendChild(row);
            }
        }

        // Add no id column (best) into the bottom
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        const cellText = document.createTextNode("best");
        cell.setAttribute("id", "best");
        cell.appendChild(cellText);
        row.appendChild(cell);
        tblBody.appendChild(row);


        // Add <tbody> into <table>.
        tbl.appendChild(tblBody);
        // Add <table> into <body>.
        document.body.appendChild(tbl);
        tbl.setAttribute("border", "2");
    }

    if (response.type == "download") {
        console.log("Download complete for:", response.url);
    }
};

async function listenForPopup(message, sender, sendResponse) {
    if (message.init) {
        console.log("init");
        browser.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            let url = tabs[0].url;
            console.log("url: " + url);
            if (typeof url === "undefined") {
                return;
            }
            // リスト取得用に新しいポートを作成
            const listPort = createNewPort();
            listPort.onMessage.addListener((response) => {
                if (response.type === "list") {
                    // リスト表示の既存コードをここで実行
                    var ignore = true;
                    var lines = response.res.split('\n');
                    var formats = lines.filter(function (line) {
                        if (line.startsWith("ID ")) {
                            ignore = false;
                        }
                        if (line.startsWith("-----")) {
                            return;
                        }
                        if (!ignore) {
                            return line;
                        }
                    });

                    var views = browser.extension.getViews({
                        type: "popup"
                    });
                    const document = views[0].document
                    const tbl = document.createElement("table");

                    tbl.setAttribute("id", "listTable");
                    const tblBody = document.createElement("tbody");

                    // Create table.
                    if (response.res.includes("tver.jp")) {
                        for (const format of formats) {
                            if (format.includes("video only")) {
                                for (const audio of ["wa", "ba"]) {
                                    const row = document.createElement("tr");

                                    if (audio === "wa") {
                                        row.style.backgroundColor = "lightblue";
                                    }

                                    const columns = format.split(/\s+/).slice(0, 12);

                                    for (let j = 0; j < columns.length; j++) {
                                        const cell = document.createElement("td");
                                        let cellText;
                                        if (j == 0 || j == 2) {
                                            cellText = document.createTextNode(columns[j] + `+${audio}`);
                                        } else {
                                            cellText = document.createTextNode(columns[j]);
                                        }
                                        cell.setAttribute("id", columns[0] + `+${audio}`);
                                        cell.appendChild(cellText);
                                        row.appendChild(cell);
                                    }
                                    tblBody.appendChild(row);
                                }
                            } else {
                                const row = document.createElement("tr");
                                const columns = format.split(/\s+/).slice(0, 12);

                                for (let j = 0; j < columns.length; j++) {
                                    const cell = document.createElement("td");
                                    const cellText = document.createTextNode(columns[j]);
                                    cell.setAttribute("id", columns[0]);
                                    cell.appendChild(cellText);
                                    row.appendChild(cell);
                                }

                                tblBody.appendChild(row);
                            }
                        }
                    } else {
                        for (const format of formats) {
                            const row = document.createElement("tr");
                            if (format.includes("audio only") || format.includes("video only")) {
                                continue;
                            }
                            const columns = format.split(/\s+/).slice(0, 12);

                            for (let j = 0; j < columns.length; j++) {
                                const cell = document.createElement("td");
                                const cellText = document.createTextNode(columns[j]);
                                cell.setAttribute("id", columns[0]);
                                cell.appendChild(cellText);
                                row.appendChild(cell);
                            }

                            tblBody.appendChild(row);
                        }
                    }

                    // Add no id column (best) into the bottom
                    const row = document.createElement("tr");
                    const cell = document.createElement("td");
                    const cellText = document.createTextNode("best");
                    cell.setAttribute("id", "best");
                    cell.appendChild(cellText);
                    row.appendChild(cell);
                    tblBody.appendChild(row);


                    // Add <tbody> into <table>.
                    tbl.appendChild(tblBody);
                    // Add <table> into <body>.
                    document.body.appendChild(tbl);
                    tbl.setAttribute("border", "2");
                }
                // 使用後にポートを閉じる
                listPort.disconnect();
            });
            listPort.postMessage({ type: "list", url: url });
            console.log("Sent: url");
        });
    }

    if (message.formatCode) {
        browser.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            let url = tabs[0].url;
            console.log("url: " + url);
            console.log("message.formatCode: " + message.formatCode);

            // ダウンロード用に新しいポートを作成
            const downloadPort = createNewPort();
            downloadPort.onMessage.addListener((response) => {
                if (response.type === "download") {
                    console.log("Download complete:", response.url);
                    downloadPort.disconnect();
                }
            });

            downloadPort.postMessage({
                type: "download",
                url: url,
                formatCode: message.formatCode,
            });
        });
    }
};

// メインのポートリスナー（初期化用）
mainPort.onMessage.addListener(listenFromNativeApp);
browser.runtime.onMessage.addListener(listenForPopup);