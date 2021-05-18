const child = require('child_process');
const chalk = require('chalk');
const path = require('path');
const os = require('os');
var Promise = require('promise');
var fs = require("fs");
const Random = require('random-js');

parseString = require("xml2js").parseString,
    xml2js = require("xml2js");


const scpSync = require('../lib/scp');
const sshSync = require('../lib/ssh');
const driver = require('../lib/driver');

exports.command = 'useful-tests';
exports.desc = 'Run useful tests';

exports.builder = yargs => {
    yargs
        .options({

            c: {
                alias: 'c',
                describe: 'Number of Runs',
                default: 100,
                type: 'integer'
            }
        })
        .options({

            github_user_name: {
                alias: 'gh-user',
                describe: 'Username for github',
                default: "admin",
                type: 'string'
            }
        })
        .options({
            github_password: {
                alias: 'gh-pass',
                describe: 'Password for github',
                default: "admin",
                type: 'string'
            }
        });

};

exports.handler = async argv => {

    const {c, github_user_name, github_password} = argv;
    (async () => {
        await run(c, github_user_name, github_password);
    })();

};


async function run(c, github_user_name, github_password) {
    let res1 = sshSync('sudo mkdir /bakerx/tmp_dir', 'vagrant@192.168.33.20', sync = 0);
    res1.on('exit', function (code, signal) {
        let res2 = sshSync(`sudo git clone https://${github_password}:x-oauth-basic@github.ncsu.edu/engr-csc326-staff/iTrust2-v8.git /bakerx/tmp_dir`, 'vagrant@192.168.33.20');

        let directory_name = "tmp_dir/iTrust2/src/main";
        directory_name = path.join(__dirname, '..', directory_name)

        const getAllFiles = function (dirPath, arrayOfFiles) {
            files = fs.readdirSync(dirPath);
            arrayOfFiles = arrayOfFiles || []

            files.forEach(function (file) {
                if (fs.statSync(dirPath + "/" + file).isDirectory()) {
                    arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
                } else {
                    if (file.includes(".java")) {
                        arrayOfFiles.push(path.join(dirPath, "/", file))
                    }
                }
            });
            return arrayOfFiles
        }
        const array_of_outs = getAllFiles(directory_name);
        driver.mtfuzz(c, array_of_outs);
    });

}