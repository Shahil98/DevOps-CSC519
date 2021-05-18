const child = require('child_process');
const chalk = require('chalk');
const path = require('path');
const os = require('os');
var Promise = require('promise');

const scpSync = require('../lib/scp');
const sshSync = require('../lib/ssh');

exports.command = 'deploy <app>';
exports.desc = 'Provision production servers on digital ocean';

exports.builder = yargs => {
    yargs
        .positional('app', {
            describe: 'Create production servers',
            type: 'string'
        })
        .options({

            inventory: {
                alias: 'i',
                describe: 'Inventory file',
                default: "inventory.ini",
                type: 'string'
            }
        })

};

exports.handler = async argv => {

    const { app, inventory } = argv;
    (async () => {
        await deploy_application(app, inventory);
    })();

};

async function deploy_application(app, inventory) {
    res = sshSync("chmod 600 /home/vagrant/.bakerx/insecure_private_key", 'vagrant@192.168.33.20');
    res = sshSync("dos2unix /bakerx/cm/run-ansible.sh", 'vagrant@192.168.33.20');
    res = sshSync("chmod 777 /bakerx/cm/run-ansible.sh", 'vagrant@192.168.33.20');
    if (app == "checkbox.io") {
        result = sshSync(`ansible-playbook /bakerx/deploy/playbook_checkbox.yml -i /bakerx/${inventory}`, "vagrant@192.168.33.20");
        if (result.error) {
            console.log(result.error);
            process.exit(result.status);
        }
    } else if (app == "iTrust") {
        result = sshSync(`ansible-playbook /bakerx/deploy/playbook_iTrust.yml -i /bakerx/${inventory}`, "vagrant@192.168.33.20");
        if (result.error) {
            console.log(result.error);
            process.exit(result.status);
        }

    }
    console.log(app, inventory);
}
