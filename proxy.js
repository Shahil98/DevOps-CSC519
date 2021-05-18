const chalk = require('chalk');
const path = require('path');
const os = require('os');
const fs = require('fs');

const got = require('got');
const http = require('http');
const httpProxy = require('http-proxy');
const redis = require('redis');

const BLUE = 'http://192.168.44.25:3000/preview';
const GREEN = 'http://192.168.44.30:3000/preview';

class Production {
    constructor() {
        this.TARGET = BLUE;
        this.compute_cpu_memory(this.compute_latency);
    }

    async compute_cpu_memory(callback) {
        let client = redis.createClient(6379, '127.0.0.1', {});
        let timesRun = 0;
        let rawdata = fs.readFileSync('/home/checkbox_preview/test/resources/survey.json');
        let survey = JSON.parse(rawdata);
        var interval = setInterval(function () {
            timesRun += 1;
            if (timesRun === 6000) {
                console.log("Done on Blue");
                client.lrange("blue", 0, -1, (error, items) => {
                    if (error) {
                        console.log(error);
                    }
                    console.log("values assinged correctly");
                    let temp_arr_blue_cpu = [];
                    let temp_arr_blue_mem = [];
                    items.forEach((i) => temp_arr_blue_cpu.push(JSON.parse(i).cpu))
                    items.forEach((i) => temp_arr_blue_mem.push(JSON.parse(i).memoryLoad))
                    fs.appendFileSync('/bakerx/array.txt', "BLUE CPU: " + JSON.stringify(temp_arr_blue_cpu) + "\n");
                    fs.appendFileSync('/bakerx/array.txt', "BLUE MEM: " + JSON.stringify(temp_arr_blue_mem) + "\n");
                });

                clearInterval(interval);
            }
            const response = got.post(BLUE, {
                json: survey,
                responseType: 'json',
                throwHttpErrors: false
            })
        }.bind(this), 10);
        let timesRun1 = 0;
        var interval1 = setInterval(function () {
            timesRun1 += 1;
            if (timesRun1 === 6000) {
                console.log("Done on Green");
                client.lrange("green", 0, -1, (error, items) => {
                    if (error) {
                        console.log(error);
                    }
                    console.log("values assinged correctly");
                    console.log(items)
                    let temp_arr_green_cpu = [];
                    let temp_arr_green_mem = [];
                    items.forEach((i) => temp_arr_green_cpu.push(JSON.parse(i).cpu))
                    items.forEach((i) => temp_arr_green_mem.push(JSON.parse(i).memoryLoad))
                    fs.appendFileSync('/bakerx/array.txt', "GREEN CPU: " + JSON.stringify(temp_arr_green_cpu) + "\n");
                    fs.appendFileSync('/bakerx/array.txt', "GREEN MEM: " + JSON.stringify(temp_arr_green_mem) + "\n");
                    clearInterval(interval1);
                    callback();
                });
            }
            const response = got.post(GREEN, {
                json: survey,
                responseType: 'json',
                throwHttpErrors: false
            })
        }.bind(this), 10);

    }

    /*constructor() {
        this.TARGET = GREEN;
        setInterval(this.healthCheck.bind(this), 5000);
    }*/
    async compute_latency() {

        console.log("Called Properly");
        let rawdata = fs.readFileSync('/home/checkbox_preview/test/resources/survey.json');
        let survey = JSON.parse(rawdata);
        let times_cnt = 0;
        let tmp_arr_lat_blue = [];
        let tmp_arr_code_blue = [];
        let tmp_arr_lat_green = [];
        let tmp_arr_code_green = [];
        var latency_blue = setInterval(function () {
            //console.log(this)
            let now = Date.now();
            times_cnt += 1;
            if (times_cnt >= 30) {
                fs.appendFileSync('/bakerx/array.txt', "BLUE LATENCY: " + JSON.stringify(tmp_arr_lat_blue) + "\n");
                fs.appendFileSync('/bakerx/array.txt', "BLUE CODE: " + JSON.stringify(tmp_arr_code_blue) + "\n");
                clearInterval(latency_blue);
            }
            let response = got.post(BLUE, {
                json: survey,
                responseType: 'json',
                throwHttpErrors: false
            }).then(function (res) {
                tmp_arr_lat_blue.push(Date.now() - now)
                tmp_arr_code_blue.push(res.statusCode);
            }).catch(e => {
                tmp_arr_code_blue.push(res.statusCode);
                tmp_arr_lat_blue.push(50000000);
            });
        }, 500);
        let times_cnt1 = 0;
        var latency_green = setInterval(function () {
            let now = Date.now();
            times_cnt1 += 1;
            if (times_cnt1 >= 30) {
                fs.appendFileSync('/bakerx/array.txt', "GREEN LATENCY: " + JSON.stringify(tmp_arr_lat_green) + "\n");
                fs.appendFileSync('/bakerx/array.txt', "GREEN CODE: " + JSON.stringify(tmp_arr_code_green) + "\n");
                clearInterval(latency_green);
            }
            // Make request to server we are monitoring.
            let response = got.post(GREEN, {
                json: survey,
                responseType: 'json',
                throwHttpErrors: false
            }).then(function (res) {
                tmp_arr_lat_green.push(Date.now() - now)
                tmp_arr_code_green.push(res.statusCode);
            }).catch(e => {
                tmp_arr_code_green.push(res.statusCode);
                tmp_arr_lat_green.push(50000000);
            });
        }, 500);
    }


    // TASK 1:
    proxy() {
        let options = {};
        let proxy = httpProxy.createProxyServer(options);
        let self = this;
        // Redirect requests to the active TARGET (BLUE or GREEN)
        let server = http.createServer(function (req, res) {
            // callback for redirecting requests.
            proxy.web(req, res, { target: self.TARGET });
        });
        server.listen(3090);
    }

    failover() {
        this.TARGET = BLUE;
    }

    async healthCheck() {
        try {
            const response = await got(this.TARGET, { throwHttpErrors: false });
            let status = response.statusCode == 200 ? chalk.green(response.statusCode) : chalk.red(response.statusCode);
            console.log(chalk`{grey Health check on ${this.TARGET}}: ${status}`);
            if (response.statusCode != 200) {
                await this.failover();
            }
            else {
                this.TARGET = GREEN;
            }
        }
        catch (error) {
            this.TARGET = BLUE;
            console.log(error);
        }
    }

}
(async () => {
    try {
        console.log(chalk.keyword('pink')('Starting proxy on localhost:3090'));
        let prod = new Production();
    } catch (e) {
        console.log(e);
    }
})();
