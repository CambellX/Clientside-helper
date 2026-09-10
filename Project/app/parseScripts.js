// Given a list of source urls, fetch all of the sources from same-origin, then
// return the raw javascript from those urls
async function getJavascriptFromSource(URLs) {
    console.log(URLs)
    //allSettled doesnt completely fail if one fetch fails
    let promises = await Promise.allSettled(
        URLs.map (url =>
            fetch(url).then(response => {
                if (!response.ok) throw new Error(`Failed request to ${url}`)
                return response.text()
            })
        )
    )

    let scripts = [];

    promises.forEach((result, urlIndex) => {
        if (result.status === "fulfilled") scripts.push(result.value)
        
        else console.error(`Failed request to ${URLs[urlIndex]}`)
    })
    return scripts
}

//turns an array of inline scripts into one whole string
function combineInlineScripts(inlineScriptsArray) {
    return inlineScriptsArray.join("\n")
}

//separates inline scripts and script sources.
async function separateScriptsAndSources(documentObject, tab) {
    //get all scripts
    let scripts = documentObject.scripts

    let sourcesArray = [], inlineScriptsArray = []
    for (let i = 0; i < scripts.length; i++) {
        //if theres no script source, its an inline script.
        if (!scripts[i].src) {
            inlineScriptsArray.push(scripts[i].text)
        }
        else {
            //combine the home url with the relative
            let scriptURL = new URL(scripts[i].src, tab.url)
            sourcesArray.push(scriptURL)
        }
    }
    // get the source code from all the sources
    let javascriptFromSources = await getJavascriptFromSource(sourcesArray)
    
    // combine all the inline scripts
    let inlineScript = combineInlineScripts(inlineScriptsArray)

    //return all of the combined sources together
    let combinedSources = [inlineScript, ...javascriptFromSources]
    return combinedSources
}

export const parseScripts = {
    getJavascriptFromSource,
    separateScriptsAndSources
}
