const process = require('process');
const path = require('path');
const cover = require('./coverMerge');

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