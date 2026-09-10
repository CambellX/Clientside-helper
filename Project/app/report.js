const reportEl = document.querySelector("#report")

function render() {
    const rawReport = localStorage.getItem("report")
    if (rawReport === null) {
        reportEl.textContent = "No report found"
        throw new Error("No report found!")
    }

    const report = JSON.parse(rawReport)
    reportEl.textContent = `${report.url}\n\n${report.code}`
}

render()
