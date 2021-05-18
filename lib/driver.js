const fs = require('fs');
const fs_copy = require('fs-extra');
const path = require('path');
const Random = require('random-js');
const chalk = require('chalk');
const sshSync = require('./ssh');
const mutateStr = require('./mutate').mutateString;
var parser = new xml2js.Parser();
var Bluebird = require('bluebird')
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');

function readMavenXmlResults(result) {
    var tests = [];
    for (var i = 0; i < result.testsuite['$'].tests; i++) {
        var testcase = result.testsuite.testcase[i];
        tests.push({
            name: testcase['$'].name,
            time: testcase['$'].time,
            status: testcase.hasOwnProperty('error') || testcase.hasOwnProperty('failure') ? "failed" : "passed"
        });
    }
    return tests;
}


function getTestReport(iteration_no) {

    let testReportBase = path.join(__dirname, '..', `.mutations/iteration-${iteration_no}/iTrust2/target/surefire-reports/`);
    var files = fs.readdirSync(testReportBase);

    const filename = files.filter(w => w.includes('.xml'));
    for (var i = 0; i < filename.length; i++)
        filename[i] = testReportBase + filename[i]
    return filename;
}

async function getTestResults(testReport) {
    var contents = fs.readFileSync(testReport)
    let xml2json = await Bluebird.fromCallback(cb => parser.parseString(contents, cb));
    let tests = readMavenXmlResults(xml2json);
    return tests;
}


class mutater {
    static random() {
        return mutater._random || fuzzer.seed(0)
    }

    static seed(kernel) {
        mutater._random = new Random.Random(Random.MersenneTwister19937.seed(kernel));
        return mutater._random;
    }

    static str(str) {
        return mutateStr(this, str);
    }

};

function calculateTestPriority(testsuite_dir, iteration_no) {
    try {

        return new Promise(function (resolved, rejected) {
            let mvn = sshSync(`sudo cp -f -r ${testsuite_dir} /home/iteration-${iteration_no}`, 'vagrant@192.168.33.20');
            mvn = sshSync(`sudo cp /home/application.yml /home/iteration-${iteration_no}/iTrust2/src/main/resources/application.yml`, 'vagrant@192.168.33.20');
            mvn = sshSync(`"cd /home/iteration-${iteration_no}/iTrust2 && sudo mvn clean test && cp -f -r /home/iteration-${iteration_no}/iTrust2/ /bakerx/.mutations/iteration-${iteration_no}/"`, 'vagrant@192.168.33.20', sync = 0);
            mvn.once('exit', async (exitCode) => {
                resolved();
            });
        });
    } catch (e) {
        console.log(chalk.red(`Error: Calculating priority of tests:\n`) + chalk.grey(e.stack));
    }
}

async function count_fails(dic) {
    const mySet1 = new Set()
    for (var i = 0; i < dic.length; i++) {
        for (var j = 0; j < dic[i][1]['failed'].length; j++) {
            mySet1.add(dic[i][1]['failed'][j])
        }
    }
    return mySet1.size
}
async function generate_report(iterations) {
    var dic = {}

    for (var w = 0; w < iterations; w++) {
        let files = getTestReport(w);
        for (var k = 0; k < files.length; k++) {

            let tests = await getTestResults(files[k]);
            for (var z = 0; z < tests.length; z++) {
                let key_name = files[k].split('surefire-reports')[1].concat(".".concat(tests[z].name));
                if (w == 0) {

                    if (tests[z].status != 'passed') {
                        dic[key_name] = {
                            'failed': ['.mutations'.concat(files[k].split('.mutations')[1]).split('target')[0]],
                            'no_of_failed': 1, 'time': parseFloat(tests[z].time)
                        }
                    } else {
                        dic[key_name] = {
                            'failed': [],
                            'no_of_failed': 0, 'time': parseFloat(tests[z].time)
                        }
                    }

                } else {
                    dic[key_name]['time'] = dic[key_name]['time'] + parseFloat(tests[z].time);

                    if (tests[z].status != 'passed') {
                        dic[key_name]['no_of_failed'] = dic[key_name]['no_of_failed'] + 1;
                        dic[key_name]['failed'].push('.mutations'.concat(files[k].split('.mutations')[1]).split('target')[0]);
                    }
                    if (w == iterations - 1) {
                        dic[key_name]['time'] = dic[key_name]['time'] / iterations;
                    }
                }
            }
        }
    }
    var keyValues = [];
    for (var key in dic) {
        keyValues.push([key, dic[key]])
    }

    keyValues.sort(function (a, b) {
        return b[1].no_of_failed - a[1].no_of_failed
    });
    return keyValues;
}

function mtfuzz(iterations, seeds) {

    mutater.seed(0);

    console.log(chalk.green(`Fuzzing with ${iterations} randomly generated-inputs.`))
    var processItem = async function (iterations, curr_iter) {
        if (curr_iter < iterations) {

            let idx = Math.floor(Math.random() * seeds.length)
            let filename = seeds[idx];
            fs.readFile(filename, 'utf8', function (err, data) {
                if (err) throw err;
                if (!fs.existsSync('.mutations/')) {
                    fs.mkdirSync(`.mutations/`);

                }
                if (!fs.existsSync(`.mutations/iteration-${curr_iter}`)) {
                    fs.mkdirSync(`.mutations/iteration-${curr_iter}`);
                }
                copy_dir = path.join(__dirname, '..', "tmp_dir/iTrust2/");
                dest_dir = path.join(__dirname, '..', `.mutations/iteration-${curr_iter}/iTrust2`);
                let mutuatedString = mutater.str(data);

                if (mutuatedString[0] == 0) {
                    processItem(iterations, curr_iter);
                } else {
                    fs_copy.copy(copy_dir, dest_dir)
                        .then(() => {
                            dest_dir = path.join(".mutations", `iteration-${curr_iter}`);
                            dest_dir = path.join(__dirname, '..', dest_dir, filename.split("tmp_dir")[1]);

                            fs.writeFileSync(dest_dir, mutuatedString[1]);
                            calculateTestPriority(`/bakerx/.mutations/iteration-${curr_iter}/iTrust2`, curr_iter).then(() => {

                                if (!fs.existsSync(path.join(__dirname, '..', `.mutations/iteration-${curr_iter}/iTrust2/target/surefire-reports`))) {

                                    processItem(iterations, curr_iter);
                                } else {
                                    processItem(iterations, curr_iter + 1);
                                }
                            });

                        })
                        .catch(err => console.error(err));
                }
            });
        } else {
            let dic = await generate_report(iterations);
            let failed_build = await count_fails(dic);
            console.log("Overall mutation coverage: ", + failed_build + "/" + iterations + " (" + failed_build / iterations + "%) mutations caught by the" +
                " test suite.")
            console.log("Useful Tests");
            console.log("==============");

            for (var tmp = 0; tmp < dic.length; tmp++) {
                console.log(dic[tmp][1].no_of_failed + "/" + iterations + " " + dic[tmp][0].split("TEST-")[1]);
                for (var q = 0; q < dic[tmp][1].failed.length; q++) {
                    console.log("\t", "-", dic[tmp][1].failed[q]);
                }
            }
        }
    };

    processItem(iterations, 0);


}

exports.mtfuzz = mtfuzz;

if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}
