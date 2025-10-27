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
 * Creates a table cell with text content
 * @param {string} text - Text content for the cell
 * @param {string} id - ID for the cell
 * @returns {HTMLTableCellElement} Created cell
 */
function createTableCell(text, id) {
    const cell = document.createElement("td");
    const cellText = document.createTextNode(text);
    if (id) cell.setAttribute("id", id);
    cell.appendChild(cellText);
    return cell;
}

/*
 * Creates a table row for format information
 * @param {Array} columns - Format data columns
 * @param {string} formatId - ID for the cells
 * @param {Object} options - Additional options
 * @returns {HTMLTableRowElement} Created row
 */
function createFormatRow(columns, formatId, options = {}) {
    const row = document.createElement("tr");
    if (options.highlight) {
        row.style.backgroundColor = "lightblue";
    }

    for (let j = 0; j < columns.length; j++) {
        let text = columns[j];
        let id = formatId;

        if (options.audio && (j === 0 || j === 2)) {
            text = columns[j] + `+${options.audio}`;
            id = columns[0] + `+${options.audio}`;
        }

        row.appendChild(createTableCell(text, id));
    }
    return row;
}

/*
 * Parse format information from yt-dlp output
 * @param {string} output - Raw output from yt-dlp
 * @returns {Array} Array of format strings
 */
function parseFormatList(output) {
    let ignore = true;
    return output.split('\n').filter(line => {
        if (line.startsWith("ID ")) {
            ignore = false;
        }
        if (line.startsWith("-----")) {
            return false;
        }
        return !ignore && line;
    });
}

/*
 * Creates a table with format information
 * @param {Array} formats - Array of format strings
 * @param {boolean} isTver - Whether the URL is from TverJP
 * @returns {HTMLTableElement} Created table
 */
function createFormatTable(formats, isTver) {
    const tbl = document.createElement("table");
    tbl.setAttribute("id", "listTable");
    tbl.setAttribute("border", "2");
    const tblBody = document.createElement("tbody");

    formats.forEach(format => {
        const columns = format.split(/\s+/).slice(0, 12);

        if (isTver && format.includes("video only")) {
            ["wa", "ba"].forEach(audio => {
                tblBody.appendChild(createFormatRow(columns, columns[0], {
                    audio,
                    highlight: audio === "wa"
                }));
            });
        } else if (!isTver && (format.includes("audio only") || format.includes("video only"))) {
            return;
        } else {
            tblBody.appendChild(createFormatRow(columns, columns[0]));
        }
    });

    // Add best quality option
    tblBody.appendChild(createFormatRow(["best"], "best"));
    tbl.appendChild(tblBody);
    return tbl;
}

/*
 * Handles format list response from native app
 * @param {Object} response - Response from native app containing format list
 */
function handleFormatListResponse(response) {
    const formats = parseFormatList(response.res);
    const views = browser.extension.getViews({ type: "popup" });
    const document = views[0].document;
    document.body.appendChild(createFormatTable(formats, response.res.includes("tver.jp")));
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
        handleFormatListResponse(response);
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
                    handleFormatListResponse(response);
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