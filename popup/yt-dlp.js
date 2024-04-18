function listenForClicks() {
    document.addEventListener("click", (e) => {
        console.log("id:" + e.target.id);
        browser.runtime.sendMessage({ formatCode: e.target.id });
    });
}

listenForClicks();

// Get list from native app
browser.runtime.sendMessage({ init: true });
