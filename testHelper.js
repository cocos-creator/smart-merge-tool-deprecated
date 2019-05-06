const fs = require('fs');
const process = require('child_process');

// 方便用户本地调用, 若是用户没有 sourceTree 类型的工具，或者配置不成功，帮助用户直接通过 vsc 启动合并工具
(function () {
    var launch = fs.readFileSync('.vscode/launch.json',{encoding: 'utf8'});
    var parse = JSON.parse(launch);
    let args = parse.configurations[0].args;
    let fileParse = args[1].match(/([\w-]+)_BASE_([0-9]+)([\.\w]+)/);
    var base = `${args[0]}/${fileParse[1]}_BASE_${fileParse[2]}${fileParse[3]}`;
    var local = `${args[0]}/${fileParse[1]}_LOCAl_${fileParse[2]}${fileParse[3]}`
    var remote = `${args[0]}/${fileParse[1]}_REMOTE_${fileParse[2]}${fileParse[3]}`
    const { cwd } = require('process');
    var child = process.spawn('node', ['bin/index.js', 'start', base, local, remote], {
        cwd: cwd(),
        env: process.env
    });
    child.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`)
    });

    child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    child.on('close', (code) => {
        console.log(`child process exited with code: ${code}`);
    });
})();