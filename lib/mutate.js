function removeComments(string) {
    return string.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').trim();//Strip comments
}

function mutateString(mutator, val) {

    val = removeComments(val)
    var array = val.split('\n');

    acceptable_changes = Math.random()/10;
    mutation_count = 0
    total = array.length
    var regex = /\<(.*?)\>/;
    var matched;

    for (var i = 0; i < array.length; i++) {
        // Swap "==" with "!="
        modified_string = array[i].replace(/==/g, "!=")
        // Swap 0 with 1
        modified_string = modified_string.replace(/0/g, "1")
        // Swap < with >
        matched = regex.exec(modified_string);
        // Swap true with false
        if (modified_string.includes("true") || modified_string.includes("True")) {
            modified_string = modified_string.replace(/true/g, "false")
            modified_string = modified_string.replace(/True/g, "false")

        } else {
            modified_string = modified_string.replace(/False/g, "true")
            modified_string = modified_string.replace(/false/g, "true")
        }

        // Swap AND  with OR
        modified_string = modified_string.replace(/AND/g, "OR")
        modified_string = modified_string.replace(/and/g, "OR")

        if (!matched) {
            modified_string = modified_string.replace(/</g, ">")
        }
        if (mutator.random().bool(0.25)) {
            modified_string = modified_string.replace(/"\w+"/g, `"`+Math.random().toString(36).substring(7)+`"`)
        }

        if (modified_string != array[i]) {
            mutation_count += 1
        }
        array[i] = modified_string
        if (mutation_count / total > acceptable_changes) {
            break;
        }

    }
    console.log(mutation_count, total, acceptable_changes)

    return [mutation_count, array.join('\n')]
}

exports.mutateString = mutateString;