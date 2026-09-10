import * as acorn from "./vendor/acorn.mjs";
import * as walk from "./vendor/walk.mjs";
import beautify from "./vendor/beautify.mjs"

//https://www.npmjs.com/package/acorn
function buildAST(source) {
    const options = { ecmaVersion: "latest", locations: true }
    try {
        return acorn.parse(source, { ...options, sourceType: "script" })
    } 
    // acorn parse throws when the source type doesnt match, so try both
    catch (error) {
        try {
            return acorn.parse(source, { ...options, sourceType: "module" })
        } catch {
            throw error
        }
    }
}

// BlockStatement are anything in curly brackets
/*
enclosingStatements obtains the full code around where a certain identifier 
is used. It traverses the output ancestors until it reaches the end of a variable's
scope.

Returns an ancestor Node which contains start and end as properties.
E.X:
"type": "Identifier",
            "start": 183,
            "end": 184,
            "name": "x"

Walk.fullAncestor will return ancestors in a certain order.
let x = 5;
this would parse into something like
[Program, VariableDeclaration, VariableDeclarator, Literal]
So that means traversing the tree backwards needs to happen
to determine the whole line of code.

Same with if the code is in something like a for loop:
[Program, BlockStatement, VariableDeclaration, VariableDeclarator, Literal]

Need to separate variables that are in block statements vs outside of them because
block statements are temporary variables.
*/
const STATEMENTS = ["Program", "BlockStatement"]
function enclosingStatement(ancestors) {
    for (let i = ancestors.length - 1; i > 0; i--) {
        // Check if the code was in a block statement.
        if (STATEMENTS.includes(ancestors[i - 1].type)) {
            return ancestors[i]
        }
    }
    return ancestors[0]
}

//Gets all references to the name of a node. Ignores scope.
function getReferences(sources, name) {
    // contains all the lines of code containing the variable
    const found = []
    // make sure lines arent repeated. (x = x + 1; prints twice because there are 2 x's)
    const seen = new Set()
    const definitions = mapDefinitions(sources)
    sources.forEach( (source, fileIndex) => {
        let ast = buildAST(source)
        walk.fullAncestor(ast, (node, _state, ancestors) => {
        //if the current node doesnt have the same name, then its the wrong one.
        if (node.type !== "Identifier" || node.name !== name) return
        
        //statement will return the starting ancestor node
        const statement = enclosingStatement(ancestors)

        const key = `${fileIndex}:${statement.start}`
        if (seen.has(key)) return
        seen.add(key)

        found.push({
            line: node.loc.start.line,
            code: source.slice(statement.start, statement.end),
            start: statement.start,
            calls: callsFunction(statement, source, definitions)
        })
    })
    })
    // sort based on which lines start first
    return found.sort((a, b) => a.start - b.start) 
}

/*
    Expression statements are in a format like this when calling a function:
    
    ExpressionStatement {
        type: "ExpressionStatement"
        expression: CallExpression {
        ...
        }
        callee: (Identifier/literal) {
            name: (name of the function)
        }
        arguments: [
        (Identifier/literal)
        ] 
    }

    Need to extract the callee name for the callsFunction through this.
*/
function getCalleeName(callee) {
    if (callee.type === "Identifier") return callee.name
    // MemberExpression refers to properties of objects. Like x.value is a memberExpression.
    if (callee.type === "MemberExpression" && callee.property.type === "Identifier") return callee.property.name
}

/*
    Obtains all calls to a function in a statement node. Then searches a source code input
    and finds the start and end of that function. Refer to the doc if confused about statementNode.
*/
function callsFunction(statementNode, source, functionDefinitions) {
    let calls = []
    walk.simple(statementNode, {
        CallExpression(currentNode) {
            const calleeName = getCalleeName(currentNode.callee)
            if (!calleeName) return
            let foundCall = {
                calleeName,
                // obtain the start to end of where the function appears in the source
                code: source.slice(currentNode.start, currentNode.end),
                // obtain the start to end of where the arguments appear in the sourcecode
                args: currentNode.arguments.map(arg => source.slice(arg.start, arg.end)),

                functionDefinition: functionDefinitions.get(calleeName) ?? ""
            }
            calls.push(foundCall)
        }
    })
    return calls
}

// Parses through all the source scripts and creates a map of ID: Function Definition
function mapDefinitions(sources) {
    // Map stores: Function name : Code
    const definitions = new Map()

    // Walk the tree, look for all function definitions, then obtain the code inside of that function I need us returned holy shit FreeScape as it's loading me up right now. It's too much too much food yo why does Aaron have like a green background? What is that you're dude? I cannot you're like incomprehensible let's do it I'm excited. Yeah, let's do it. Make sure to streamline this into our process immediately. Thank you, Cope, thank you, Cope thank you, Cope thank you, Cope this guy's like trying to leave so you can like full focus in the game somehow, but he like it never works out he lost another one that's actually over to you it's actually so over for a indeed oh my god his twenty he's twenty K he's like he dropped down that is low dude like two one more loss or two more loss no two more losses he's gonna be relegation that's actually tragic doing bad in this game honestly but like he's like he's like breaking even no it's like it's like even in all most of his games like
    // declaration.
    sources.forEach( (source) => {
        walk.simple(buildAST(source), {
            FunctionDeclaration(node) {
                if (node.id) {
                    definitions.set(node.id.name, source.slice(node.start, node.end))
                }
            }
        })
    })
    return definitions 
}

// formats all the variable calls into a neat string
function printReport(references, name) {
    if (references.length === 0) return `Could not find "${name}".`

    return references.map(reference => {
        const definitions = reference.calls
            .map(call => call.functionDefinition)
            .filter(Boolean)
            .join("\n\n")

        let block = `Line ${reference.line}\n${beautify.js(reference.code)}`
        if (definitions) block += `\n\nDefinition:\n${beautify.js(definitions)}`
        return block
    }).join("\n\n")
}

export const parseGraph = {
    enclosingStatement,
    buildAST,
    getReferences,
    getCalleeName,
    callsFunction,
    printReport
}
