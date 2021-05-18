const child = require('child_process');
const chalk = require('chalk');
const path = require('path');
const os = require('os');
var Promise = require('promise');
var fs = require("fs"),
    parseString = require("xml2js").parseString,
    xml2js = require("xml2js");


const scpSync = require('../lib/scp');
const sshSync = require('../lib/ssh');

exports.command = 'setup';
exports.desc = 'Provision and configure the configuration server';

exports.builder = yargs => {
    yargs
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
        }).options({

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

    const { github_user_name, github_password, user_name, password } = argv;
    (async () => {
        await run(github_user_name, github_password, user_name, password);
    })();

};


async function run(github_user_name, github_password, user_name, password) {

    const promise = new Promise((resolve, reject) => {

        var dict = {
            "scope": ['GLOBAL'],
            "id": ['kenil'],
            "username": [github_user_name],
            "password": [github_password],
            "description": ['My Github Credentials']
        }
        var main_xml = {
            "com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl": dict
        }
        var builder = new xml2js.Builder({ headless: true });
        var xml = builder.buildObject(main_xml);

        fs.writeFile("credential.xml", xml, function (err, data) {
            if (err) console.log(err);
            console.log("Successfully written our update xml to file");
            return resolve();
        });

    });

    promise.then(res => {

        console.log(chalk.greenBright('Installing configuration server!'));
        console.log(chalk.blueBright('Provisioning configuration server...'));
        let result = child.spawnSync(`bakerx`, `run config-srv focal --ip 192.168.33.20 --memory 4096 --sync`.split(' '), { shell: true, stdio: 'inherit' });
        if (result.error) {
            console.log(result.error);
            process.exit(result.status);
        }

        console.log(chalk.blueBright('Running init script...'));

        res = sshSync("sudo apt-get update", 'vagrant@192.168.33.20');
        
        res = sshSync("mkdir -p /home/vagrant/.bakerx", 'vagrant@192.168.33.20');
        res = scpSync(path.join(os.homedir(), '.bakerx', 'insecure_private_key'), 'vagrant@192.168.33.20:/home/vagrant/.bakerx/insecure_private_key');

        res = sshSync("sudo apt-get install dos2unix ", 'vagrant@192.168.33.20');
        res = sshSync("dos2unix /bakerx/cm/server-init.sh", 'vagrant@192.168.33.20');
        res = sshSync("chmod 777 /bakerx/cm/server-init.sh", 'vagrant@192.168.33.20');
        result = sshSync('/bakerx/cm/server-init.sh', 'vagrant@192.168.33.20');
        if (result.error) {
            console.log(result.error);
            process.exit(result.status);
        }

        console.log(chalk.blueBright('Running Jenkins Installation Ansible Script...'));
        res = sshSync("dos2unix /bakerx/cm/run-ansible.sh", 'vagrant@192.168.33.20');
        res = sshSync("chmod 777 /bakerx/cm/run-ansible.sh", 'vagrant@192.168.33.20');
        result = sshSync('/bakerx/cm/run-ansible.sh /bakerx/cm/playbook.yml /bakerx/cm/inventory.ini', 'vagrant@192.168.33.20');
        if (result.error) {
            console.log(result.error);
            process.exit(result.status);
        }

        res = sshSync(`jenkins-jobs -u ${user_name} -p ${password} update /bakerx/test-pipeline.yml`, 'vagrant@192.168.33.20', sync = 0);

        res.on('exit', function (code, signal) {
            console.log('Build job created for checkbox.io')
            res = sshSync(`jenkins-jobs -u ${user_name} -p ${password} update /bakerx/test-pipeline-1.yml`, 'vagrant@192.168.33.20', sync = 0);

            res.on('exit', function (code, signal) {
                console.log('Build job created for iTrust')
            });
        });



    }).catch(err => {
        console.log(err)
    });

}
