const path = require('path');
const os = require('os');

const child = require('child_process');

let identifyFile = path.join(os.homedir(), '.bakerx', 'insecure_private_key');

module.exports = function (cmd, host, sync = 1, inherit = 1) {
    let sshArgs = [];
    sshArgs.push(`-i`);
    sshArgs.push(`"${identifyFile}"`);
    sshArgs.push(`-o`);
    sshArgs.push(`StrictHostKeyChecking=no`);
    sshArgs.push(`-o`);
    sshArgs.push(`UserKnownHostsFile=/dev/null`);
    sshArgs.push(host);
    sshArgs.push(cmd);
    if (sync)
        return child.spawnSync(`ssh`, sshArgs, { stdio: 'inherit', shell: true });
    else {
        return child.spawn(`ssh`, sshArgs, { stdio: 'inherit', shell: true });
    }
}
