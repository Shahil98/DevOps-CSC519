const child = require('child_process');
const chalk = require('chalk');
const path = require('path');
const os = require('os');
const scpSync = require('../lib/scp');
const sshSync = require('../lib/ssh');
var fs = require('fs');
var ini = require('ini');
var jenkins = require('jenkins')({ baseUrl: `http://admin:admin@192.168.33.20:9000`, crumbIssuer: true, promisify: true });;
const yaml = require('js-yaml');
const { pipeline } = require('stream');
exports.command = 'build <build_name>';
exports.desc = 'Build Checkbox.io in Config environment';
exports.builder = yargs => {
    yargs
        .positional('build_name', {
            describe: 'Application name to be built',
            type: 'string'
        })
        .options({

            user_name: {
                alias: 'u',
                describe: 'Username for jenkins',
                default: "admin",
                type: 'string'
            }
        })
        .options({
            password: {
                alias: 'p',
                describe: 'Password for jenkins',
                default: "admin",
                type: 'string'
            }
        });

};


exports.handler = async argv => {
    const { build_name, user_name, password } = argv;

    (async () => {
        await build_code(build_name, user_name, password);

    })();

};

async function getBuildStatus(job, id) {
    return new Promise(async function (resolve, reject) {
        console.log(`Fetching ${job}: ${id}`);
        let result = await jenkins.build.get(job, id);
        resolve(result);
    });
}

async function waitOnQueue(id) {
    return new Promise(function (resolve, reject) {
        jenkins.queue.item(id, function (err, item) {
            if (err) throw err;
            // console.log('queue', item);
            if (item.executable) {
                console.log('number:', item.executable.number);
                resolve(item.executable.number);
            } else if (item.cancelled) {
                console.log('cancelled');
                reject('canceled');
            } else {
                setTimeout(async function () {
                    resolve(await waitOnQueue(id));
                }, 5000);
            }
        });
    });
}


async function triggerBuild(job) {
    let queueId = await jenkins.job.build(job);
    let buildId = await waitOnQueue(queueId);
    return buildId;
}

async function launch_build(build_name) {
    let buildId = await triggerBuild(build_name).catch(e => console.log(e));

    console.log(`Received ${buildId}`);
    let build = await getBuildStatus(build_name, buildId);
    console.log(`Build result: ${build.result}`);

    console.log(`Build output`);
    var log = jenkins.build.logStream(build_name, buildId);

    log.on('data', function (text) {
        process.stdout.write(text);
    });

    log.on('error', function (err) {
        console.log('error', err);
    });
}


async function build_code(build_name, user_name, password) {

    let pipeline_file = "";
    if (build_name=='iTrust')
    {
       pipeline_file = "test-pipeline-1.yml";
    }
    else
    {
        pipeline_file = "test-pipeline.yml";
    }

    console.log();
    
    console.log('Triggering build.')
    launch_build(build_name);
}

