const child = require('child_process');
const chalk = require('chalk');
const path = require('path');
const os = require('os');
var Promise = require('promise');

const scpSync = require('../lib/scp');
const sshSync = require('../lib/ssh');

exports.command = 'prod <up>';
exports.desc = 'Provision production servers on digital ocean';

exports.builder = yargs => {
    yargs
        .positional('up', {
        describe: 'Create production servers',
        type: 'string'
    })
        
};

exports.handler = async argv => {

    const {up} = argv;
    (async () => {
        await run(up);
    })();

};

async function run(up) {
    if(up == "up"){
    result = sshSync('sudo ansible-playbook --vault-password-file /home/.vault-pass /bakerx/cm/playbook-deploy.yml -i /bakerx/cm/inventory.ini', 'vagrant@192.168.33.20');
        if (result.error) {
            console.log(result.error);
            process.exit(result.status);
        }
    }
    else{
        console.log("Incorrect positional argument ");
    }

}
