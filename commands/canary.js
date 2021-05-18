const child = require('child_process');
const chalk = require('chalk');
const path = require('path');
const os = require('os');

const scpSync = require('../lib/scp');
const sshSync = require('../lib/ssh');
const mannwhitneyu = require('../lib/mannwhitneyu');
const { blue } = require('chalk');
const fs = require('fs');


exports.command = 'canary <b1> <b2>';
exports.desc = 'Provision and configure servers for canary analysis';

exports.builder = yargs => {
    yargs
        .positional('b1', {
            describe: 'Branch-1',
            type: 'string'
        })
        .positional('b2', {
            describe: 'Branch-2',
            type: 'string'
        })
};

exports.handler = async argv => {

    const { b1, b2 } = argv;
    (async () => {
        await run(b1, b2);
    })();

};


async function run(b1, b2) {

    let blue_ip = 'vagrant@192.168.44.25';
    let green_ip = 'vagrant@192.168.44.30';
    let proxy_ip = 'vagrant@192.168.44.45';

    console.log(chalk.greenBright('Installing configuration server!'));
    console.log(chalk.blueBright('Provisioning configuration server...'));
    let result = child.spawnSync(`bakerx`, `run`.split(' '), { shell: true, stdio: 'inherit' });
    if (result.error) {
        console.log(result.error);
        process.exit(result.status);
    }



    console.log(chalk.blueBright('Running init script...'));
    res = sshSync("sudo apt-get update", blue_ip);
    res = sshSync("sudo apt-get install dos2unix", blue_ip);
    res = sshSync("dos2unix /bakerx/canary/server-init.sh", blue_ip);
    res = sshSync("chmod 777 /bakerx/canary/server-init.sh", blue_ip);
    result = sshSync('/bakerx/canary/server-init.sh', blue_ip);
    result = sshSync('dos2unix /bakerx/canary/run-ansible.sh', blue_ip);
    result = sshSync('chmod 777 /bakerx/canary/run-ansible.sh', blue_ip);
    result = sshSync(`/bakerx/canary/run-ansible.sh /bakerx/canary/playbook_checkbox_preview.yml /bakerx/canary/inventory.ini ${b1}`, blue_ip);

    console.log(chalk.blueBright('Running init script...'));
    res = sshSync("sudo apt-get update", green_ip);
    res = sshSync("sudo apt-get install dos2unix", green_ip);
    res = sshSync("dos2unix /bakerx/canary/server-init.sh", green_ip);
    res = sshSync("chmod 777 /bakerx/canary/server-init.sh", green_ip);
    result = sshSync('/bakerx/canary/server-init.sh', green_ip);
    result = sshSync('dos2unix /bakerx/canary/run-ansible.sh', green_ip);
    result = sshSync('chmod 777 /bakerx/canary/run-ansible.sh', green_ip);
    result = sshSync(`/bakerx/canary/run-ansible.sh /bakerx/canary/playbook_checkbox_preview.yml /bakerx/canary/inventory.ini ${b2}`, green_ip);
    //Copying agent to green and blue servers
    result = sshSync(`sudo cp /bakerx/canary/agent /home/ -r`, green_ip);
    result = sshSync(`sudo cp /bakerx/canary/agent /home/ -r`, blue_ip);
    result = sshSync("cd /home/agent; sudo npm install", green_ip);
    result = sshSync("cd /home/agent; sudo npm install", blue_ip);

    //Copying dashboard to proxy server (Not required for now)
    result = sshSync(`sudo cp /bakerx/canary/dashboard /home/ -r`, proxy_ip);
    result = sshSync(`cd /home/dashboard/; sudo npm install`, proxy_ip);
    result = sshSync(`sudo git clone https://github.com/chrisparnin/checkbox.io-micro-preview.git /home/checkbox_preview`, proxy_ip);

    //Start all the processes
    result = sshSync(`cd /home/checkbox_preview/; sudo pm2 start index.js`, green_ip);
    result = sshSync(`cd /home/checkbox_preview/; sudo pm2 start index.js`, blue_ip);
    result = sshSync(`sudo pm2 start /home/agent/index.js -- green`, green_ip);
    result = sshSync(`sudo pm2 start /home/agent/index.js -- blue`, blue_ip);
    result = sshSync(`sudo pm2 start /bakerx/proxy.js`, proxy_ip);
    let array_file_path = './array.txt';
    fs.writeFileSync(array_file_path, '', 'utf-8');
    while (1) {
        const fileContent = fs.readFileSync(array_file_path, "utf8");
        let arr = fileContent.split('\n');
        if (arr.length == 9) {
            result = sshSync(`sudo pm2 kill`, green_ip);
            result = sshSync(`sudo pm2 kill`, blue_ip);
            result = sshSync(`sudo pm2 kill`, proxy_ip);
            console.log("----------- Canary Report -----------");
            let alpha = 0.05;
            let blue_cpu = (arr[0].split(':')[1]).replace(/[\[\]']+/g, '').split(',').map((i) => Number(i));
            let green_cpu = (arr[2].split(':')[1]).replace(/[\[\]']+/g, '').split(',').map((i) => Number(i));

            let blue_mem = (arr[1].split(':')[1]).replace(/[\[\]']+/g, '').split(',').map((i) => Number(i));
            let green_mem = (arr[3].split(':')[1]).replace(/[\[\]']+/g, '').split(',').map((i) => Number(i));

            let blue_lat = (arr[4].split(':')[1]).replace(/[\[\]']+/g, '').split(',').map((i) => Number(i));
            let green_lat = (arr[6].split(':')[1]).replace(/[\[\]']+/g, '').split(',').map((i) => Number(i));

            let blue_code = (arr[5].split(':')[1]).replace(/[\[\]']+/g, '').split(',').map((i) => Number(i));
            let green_code = (arr[7].split(':')[1]).replace(/[\[\]']+/g, '').split(',').map((i) => Number(i));
            var total_passed = 0;
            var diff_cpu = mannwhitneyu.test(blue_cpu, green_cpu, alternative = 'two-sided');
            console.log("CPU Metric Statistical test ", diff_cpu);
            if (diff_cpu.p <= alpha) {
                console.log("Canary Failed for CPU Metric");
            }
            else {
                console.log("Canary Passed for CPU Metric");
                total_passed += 1;
            }


            var diff_mem = mannwhitneyu.test(blue_mem, green_mem, alternative = 'two-sided');
            console.log("Memory Metric Statistical test ", diff_mem);
            if (diff_mem.p <= alpha) {
                console.log("Canary Failed for Memory Metric");
            }
            else {
                console.log("Canary Passed for Memory Metric");
                total_passed += 1;
            }

            var diff_lat = mannwhitneyu.test(blue_lat, green_lat, alternative = 'two-sided');
            console.log("Latency Metric Statistical test ", diff_lat);
            if (diff_lat.p <= alpha) {
                console.log("Canary Failed for Latency Metric");
            }
            else {
                console.log("Canary Passed for Latency Metric");
                total_passed += 1;
            }

            var diff_code = mannwhitneyu.test(blue_code, green_code, alternative = 'two-sided');
            console.log("Code Metric Statistical test ", diff_code);
            if (diff_code.p <= alpha) {
                console.log("Canary Failed for HTTP-Code Metric");
            }
            else {
                console.log("Canary Passed for HTTP-Code Metric");
                total_passed += 1;
            }
            if (total_passed >= 2) {
                console.log("Canary Passed");
            }
            else {
                console.log("Canary Failed");
            }
            console.log("-----------------------------------");

            try {
                fs.unlinkSync(array_file_path);
                //file removed
            } catch(err) {
                console.error(err);
            }

            break;
        }
    }


}