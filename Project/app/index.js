//https://astexplorer.net/
import { captureHTML } from './captureHTML.js'
import { parseScripts } from './parseScripts.js'
import { parseGraph } from './parseGraph.js'

const captureButton = document.querySelector("#capture-btn")

const clearButton = document.querySelector("#clear-btn")
clearButton.disabled = true

const viewDataButton = document.querySelector("#viewData-btn")
viewDataButton.disabled = true

const resultEl = document.querySelector("#results-el")

const nameInput = document.querySelector('#name-input')

async function getPageHTML() {
    // obtain the HTML of the current tab as a String
    const HTMLString = await captureHTML.obtainPageHTML()

    // convert that string into a document
    let documentObject = captureHTML.convertStringToHTML(HTMLString)
    return documentObject
}

function findAllVariableInstances(sourceCode, varName) {
    //contains an array of all the lines of code that relate to the inputted variable
    const references = parseGraph.getReferences(sourceCode, varName)
    return parseGraph.printReport(references, varName)
}

captureButton.addEventListener("click", async () => {
    const name = nameInput.value.trim()

    // check if no variable name was inputted
    if (!name) {
        resultEl.textContent = "Enter a variable name"
        return
    }

    // get url of current tab so fetching scripts works
    const tab = await captureHTML.getActiveTab()
    
    // get the page's html content
    const documentObject = await getPageHTML()

    // then obtain all the script sources
    const sources = await parseScripts.separateScriptsAndSources(documentObject, tab)

    // console.log(inlineScript.split("\n").slice(33, 38).join("\n"))
    // console.log("inline: " + inlineScript)
    // console.log("Sources: " + sourceScripts)

    let report = findAllVariableInstances(sources, name)
    resultEl.innerText = report
    console.log(report)
    
    localStorage.setItem("report", JSON.stringify(
        {
            url: tab.url,
            code: report
        }
    ))
    // Create a window object: https://developer.chrom  e.com/docs/extensions/reference/api/windows
    let popup = await chrome.windows.create({
        url: "/app/templates/popup.html",
        type: "popup"
    });
})
