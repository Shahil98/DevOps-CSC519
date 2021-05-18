const redis = require('redis');
const util = require('util');
const os = require('os');
const si = require('systeminformation');

// Calculate metrics.
// TASK 1:
class Agent {
    memoryLoad() {
        return (os.totalmem() - os.freemem()) / os.totalmem();
    }
    async cpu() {
        let load = await si.currentLoad();
        return load.currentload;
    }
}

(async () => {
    // Get agent name from command line.
    let args = process.argv.slice(2);
    main(args[0]);

})();

/*
async function main(name) {
    let agent = new Agent();

    let connection = redis.createClient(6379, '192.168.44.45', {})
    connection.on('error', function (e) {
        console.log(e);
        process.exit(1);
    });
    let client = {};
    client.publish = util.promisify(connection.publish).bind(connection);

    // Push update ever 1 second
    setInterval(async function () {
        let payload = {
            memoryLoad: agent.memoryLoad(),
            cpu: await agent.cpu()
        };
        let msg = JSON.stringify(payload);
        await client.publish(name, msg);
        console.log(`${name} ${msg}`);
    }, 1000);

}
*/

async function main(name) {
    let agent = new Agent();

    let connection = redis.createClient(6379, '192.168.44.45', {})
    connection.on('error', function (e) {
        console.log(e);
        process.exit(1);
    });
    //let client = {};
    //client.publish = util.promisify(connection.publish).bind(connection);
    let time = 0;
    // Push update ever 1 second
    var interval = setInterval(async function () {
        time += 1;
        if (time == 80) {
            clearInterval(interval);
        }
        let cpu_usage = await agent.cpu();
        console.log("cpu", cpu_usage);
        let payload = {
            memoryLoad: agent.memoryLoad(),
            cpu: cpu_usage
        };
        let msg = JSON.stringify(payload);
        //await client.publish(name, msg);
        //console.log(name);
        await connection.lpush(name, msg);
        await connection.ltrim(name, 0, 60);
        console.log(`${name} ${msg}`);
    }, 1000);

}


