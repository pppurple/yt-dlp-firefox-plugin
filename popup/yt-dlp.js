/*
function listenForClicks() {
    document.addEventListener("click", (e) => {
        console.log("id:" + e.target.id);
        browser.runtime.sendMessage({ formatCode: e.target.id });
    });
}

listenForClicks();

// Get list from native app
browser.runtime.sendMessage({ init: true });
*/


async function listenForClicks() {
    document.addEventListener("click", async (e) => {
        console.log("id:" + e.target.id);
        await browser.runtime.sendMessage({ formatCode: e.target.id });
    });
}

(async () => {
    await listenForClicks();
    // Get list from native app
    await browser.runtime.sendMessage({ init: true });
})();