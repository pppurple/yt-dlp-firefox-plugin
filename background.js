/*
On startup, connect to the "yt-dlp-executor" app.
*/
// connectNative(application). 'application' name must match /^\w+(\.\w+)*$/).
let port = browser.runtime.connectNative("yt_dlp_executor");

/*
Listen for messages from a native app.
*/
port.onMessage.addListener((response) => {
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
        var views = browser.extension.getViews({
            type: "popup"
        });
        const document = views[0].document
        var tbl = document.getElementById("listTable");
        if (tbl) tbl.parentNode.removeChild(tbl);
        var div = document.createElement("div");
        div.innerHTML = "Complete!!!";
        document.body.appendChild(div);
    }
});

/*
Lister for popup js
*/
browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    // Get list from native app. (when icon clicked)
    if (message.init) {
        console.log("init");
        browser.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            let url = tabs[0].url;
            console.log("url: " + url);
            if (typeof url === "undefined") {
                return;
            }
            port.postMessage({ type: "list", url: url });
            console.log("Sent:  url");
        });
    }
    // Download contents. (when any id clicked)
    if (message.formatCode) {
        browser.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            let url = tabs[0].url;
            console.log("url: " + url);
            console.log("message.formatCode: " + message.formatCode);
            port.postMessage({ type: "download", url: url, formatCode: message.formatCode });
        });
    }
});