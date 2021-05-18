const esprima = require("esprima");
const options = {tokens:true, tolerant: true, loc: true, range: true };
const fs = require("fs");
const chalk = require('chalk');
const path = require('path');

function main()
{
    // Windows Location
    //let directory_name = "workspace/server-side";
    //directory_name = path.join(__dirname, '..', directory_name)

    // Mac Location
    let directory_name = "/var/lib/jenkins/workspace/checkbox.io/server-side";

    const getAllFiles = function (dirPath, arrayOfFiles) {
        files = fs.readdirSync(dirPath);
        arrayOfFiles = arrayOfFiles || []
        files.forEach(function (file) {
            if (fs.statSync(dirPath + "/" + file).isDirectory()) {
                arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
            } else {
                if (file.includes(".js")) {
                    arrayOfFiles.push(path.join(dirPath, "/", file))
                }
            }
        });
        return arrayOfFiles
    }
    const array_of_outs = getAllFiles(directory_name);

    let final_result = true;
    let statsDict = {};

    for(var i=0; i<array_of_outs.length; i++)
    {   
        try
        {
            if(!(array_of_outs[i].includes("node_modules")))
            {

                var buf = fs.readFileSync(array_of_outs[i], "utf8");
	            var ast = esprima.parse(buf, options);

                let res1 = check_message_chains(ast, array_of_outs[i], statsDict);
                let res2 = check_long_methods(ast, array_of_outs[i], statsDict);
                let res3 = check_if_statement_depth(ast, array_of_outs[i], statsDict);

                if(!(res1 && res2 && res3))
                {
                    final_result = false;
                }
            }
        }
        catch
        {            
        }
    }

    if(final_result == false)
    {   

        console.log("\nStatic Code Analysis:\n");

        for(var key in statsDict)
        {
            file_name = key.split("workspace")[1];
            console.log(`File: ${file_name}`);
            
            if(statsDict[key].messageChain.length != 0)
            {
                console.log("Message Chain Violation:");
                for(var i=0; i<statsDict[key].messageChain.length; i++)
                {
                    console.log(`\t Violation at line ${statsDict[key].messageChain[i][0]} with chain length ${statsDict[key].messageChain[i][1]}`);
                }
            }

            if(statsDict[key].maxNestingDepth.length != 0)
            {
                console.log("Max Nesting Depth Violation:");
                for(var i=0; i<statsDict[key].maxNestingDepth.length; i++)
                {
                    console.log(`\t Violation at line ${statsDict[key].maxNestingDepth[i][0]} with nesting depth ${statsDict[key].maxNestingDepth[i][1]}`);
                }
            }

            if(statsDict[key].longMethod.length != 0)
            {
                console.log("Long Method Violation:");
                for(var i=0; i<statsDict[key].longMethod.length; i++)
                {
                    console.log(`\t Violation at line ${statsDict[key].longMethod[i][0]} for method ${statsDict[key].longMethod[i][1]}`);
                }
            }

            console.log("\n");
        }
        process.abort();
    }
    else
    {
        console.log("No violations found");
    }
}

class Violation_Stats
{
    constructor()
    {
        this.fileName = "";

        this.longMethod = [];
        this.messageChain = [];
        this.maxNestingDepth = []; 
    }
}

function calculate_if_depth(node_array)
{

    if(node_array.length == 0)
    {
        return([]);
    }

    for(var i=0; i<node_array.length; i++)
    {
        node_array[i] = [1, node_array[i].loc.start.line, node_array[i].loc.end.line];
    }

    let stack = [];

    for(var i=0; i<node_array.length; i++)
    {
        if( i==0 )
        {

        }

        else if(!(node_array[i][1]>=stack[stack.length-1][1] && node_array[i][2]<=stack[stack.length-1][2]))
        {
            while(stack.length>1)
            {
                if(stack[stack.length-1][1]>=stack[stack.length-2][1] && stack[stack.length-1][2]<=stack[stack.length-2][2])
                {
                    stack[stack.length-2][0] = Math.max(stack[stack.length-2][0], 1+stack[stack.length-1][0]);
                    stack.pop();
                }
                else
                {
                    break;
                }
            }

            
        }

        stack.push(node_array[i]);
    }

    while(stack.length>1)
    {
        if(stack[stack.length-1][1]>=stack[stack.length-2][1] && stack[stack.length-1][2]<=stack[stack.length-2][2])
        {
            stack[stack.length-2][0] = Math.max(stack[stack.length-2][0], 1+stack[stack.length-1][0]);
            stack.pop();
        }
        else
        {
            break;
        }
    }

    result_array = [];

    for(var i=0; i<stack.length; i++)
    {
        if(stack[i][0]>5)
        {
            result_array.push(stack[i]);
        }
    }

    return(result_array);
}

function check_if_statement_depth(ast, fileName, statsDict)
{

    let node_array = [];
    let flag = 0;
    let result_array = []; 

    traverseWithParents(ast, function (node) 
	{
        if(node.type == "FunctionDeclaration" && flag == 1)
        {
            result_array = result_array.concat(calculate_if_depth(node_array));
            node_array = [];
        }

        else if(node.type == "FunctionDeclaration" && flag == 0)
        {
            flag = 1;
        }

        else if(node.type == "IfStatement" && flag==1)
        {
            node_array.push(node);
        }
    });

    if(flag == 1)
    {
        result_array = result_array.concat(calculate_if_depth(node_array));
        node_array = [];
    }

    //Display result
    if(result_array.length == 0)
    {
        return(true);
    }
    else
    {
        if(!(fileName in statsDict))
        {
            statsDict[fileName] = new Violation_Stats();
            statsDict[fileName].fileName = fileName;
        }
        
        for(var i=0; i<result_array.length; i++)
        {
            statsDict[fileName].maxNestingDepth.push([result_array[i][1], result_array[i][0]])
        }
    }

    return(false);

}

function check_long_methods(ast, fileName, statsDict)
{

    let result_array = [];

    traverseWithParents(ast, function (node) 
	{
        if(node.type == "FunctionDeclaration")
        {
            let function_length = node.loc.end.line - node.loc.start.line;
            if(function_length > 100)
            {
                result_array.push([node.id.name, node.loc.start.line]);
            } 
        }

	});

    if(result_array.length == 0)
    {
        return(true);
    }
    else
    {
        if(!(fileName in statsDict))
        {
            statsDict[fileName] = new Violation_Stats();
            statsDict[fileName].fileName = fileName;
        }
        
        for(var i=0; i<result_array.length; i++)
        {
            statsDict[fileName].longMethod.push([result_array[i][1], result_array[i][0]])
        }
        
    }
    
    return(false);
}

function check_message_chains(ast, fileName, statsDict)
{

    let countChainElements = 0;
    let result_array = [];
    
    let violation_line_number = -1;

    traverseWithParents(ast, function (node) 
	{
	
        if((node.type != "MemberExpression" && node.type != "CallerExpression"))
        {
            if(countChainElements > 10)
            {
                result_array.push([violation_line_number, countChainElements]);
            }

            countChainElements = 0;
            violation_line_number = -1;
        }
		
        else
        {
            if(violation_line_number == -1)
            {
                violation_line_number =  node.loc.start.line;
            }
            countChainElements += 1;
        }

	});

    if(countChainElements > 10)
    {
        result_array.push([violation_line_number, countChainElements]);
    }

    if(result_array.length > 0)
    {
        if(!(fileName in statsDict))
        {
            statsDict[fileName] = new Violation_Stats();
            statsDict[fileName].fileName = fileName;
        }
        
        for(var i=0; i<result_array.length; i++)
        {
            statsDict[fileName].messageChain.push([result_array[i][0], result_array[i][1]])
        }

    }

    else
    {
        return(true);
    }

    return(false);

}

function traverseWithParents(object, visitor)
{
    var key, child;

    visitor.call(null, object);

    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null && key != 'parent') 
            {
            	child.parent = object;
					traverseWithParents(child, visitor);
            }
        }
    }
}

main();