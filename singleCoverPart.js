const process = require('process');
const path = require('path');
const cover = require('./coverMerge');

// 手动的执行 json 转换 .fire 文件，因为在使用冲突解决工具时很有可能发生冲突解决失败的问题，导致最后的 merge.json 文件合并不成功
(function () {
    var args = process.argv;
    if (args.length < 3) {
        console.error('Arguments not enough!');
        return;
    }

    var projectPath = path.parse(args[2]);
    var dir = projectPath.dir;
    var merge = path.join(dir, 'merge.json');
    var name = args[3];

    cover.coverFile(merge, dir, name);
})();