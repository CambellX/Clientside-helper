
async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    return tab
}

//https://stackoverflow.com/questions/71242952/i-want-to-get-the-html-of-the-web-page-but-i-am-getting-the-html-of-my-chrome-e
async function obtainPageHTML() {
        let data = await (
            async () => {
                //obtain the currently focused chrome tab
                const tab = await getActiveTab();
                let result;
                //gets the innerHTML of the document
                try {
                    [{result}] = await chrome.scripting.executeScript({
                    target: {tabId: tab.id},
                    func: () => document.documentElement.innerHTML,
                    });
                } catch (e) {
                    document.body.textContent = 'ObtainPageHTML: Cannot access page'
                    return ""
                }
                // render the result & return
                return result
        }
        )();
        return data
}

/*
    When obtainPageHTML is used, a string is returned, not a document object.
    This means that it first needs to be converted into a Document object to be 
    usable.
*/
function convertStringToHTML(HTMLString) {
    const parser = new DOMParser()
    let html = parser.parseFromString(HTMLString, "text/html")

    return html
}

export const captureHTML = {
    obtainPageHTML,
    convertStringToHTML,
    getActiveTab
};