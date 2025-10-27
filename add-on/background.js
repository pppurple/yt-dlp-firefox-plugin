/*
 * On startup, connect to the "yt-dlp-executor" app.
 */
// connectNative(application). 'application' name must match /^\w+(\.\w+)*$/).
let mainPort = browser.runtime.connectNative("yt_dlp_executor");

/*
 * Creates a new port connection to the native application.
 * Used for communicating with the yt-dlp executor.
 * @returns {runtime.Port} New port connection to native app
 */
function createNewPort() {
    return browser.runtime.connectNative("yt_dlp_executor");
}

/*
 * Main message listener for native app responses.
 * Handles format list display and download completion.
 * @param {Object} response - Response from native app
 * @param {string} response.type - Type of response ('list' or 'download')
 * @param {string} response.res - Response content for list type
 * @param {string} response.url - URL for download type
 */
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

/*
 * Handles popup initialization and download requests.
 * Creates separate ports for listing formats and downloading.
 * @param {Object} message - Message from popup
 * @param {boolean} message.init - True if initializing popup
 * @param {string} message.formatCode - Format code for download
 * @param {Object} sender - Message sender information
 * @param {function} sendResponse - Callback function
 */
async function listenForPopup(message, sender, sendResponse) {
    if (message.init) {
        console.log("init");
        browser.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            let url = tabs[0].url;
            console.log("url: " + url);
            if (typeof url === "undefined") {
                return;
            }
            // Create new port for format listing
            const listPort = createNewPort();
            listPort.onMessage.addListener((response) => {
                if (response.type === "list") {
                    // Parse format list from yt-dlp output
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
                // Close port after use
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

            // Create new port for download operation
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

// Initialize main port listener for native app communication
mainPort.onMessage.addListener(listenFromNativeApp);
// Listen for messages from popup
browser.runtime.onMessage.addListener(listenForPopup);