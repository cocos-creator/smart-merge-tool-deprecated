const process = require('process');
const path = require('path');
const fs = require('fs');
const del = require('del');
const { execFileSync } = require('child_process');
const cover = require('./CoverMerge');
const type = require('./Supporter/enums');
const pipe = require('./Supporter/MergePipe');
const Convert = require('./Supporter/IdConverter');

var config = JSON.parse(fs.readFileSync(`${process.cwd()}/mergeConfig.json`, {encoding: 'utf8'}));
var files = {
    base: {},
    local: {},
    remote: {}
};

merge = {
    /**
     * 1. 获取传入的三个临时 fire 文件
     * 2. 解析 fire 文件数据
     * 3. 在 indexToMark 转换 __id__ 数据为唯一标识
     * 4. 根据数据类型分组
     * 5. 节点排序
     * 6. 填充数据到三个对应的 json 文件，判断是否需要替换指定数据操作
     * 7. 开启冲突解决工具
     */
    start: function (base, local, remote) {
        var projectPath = path.parse(base);
        var dir = projectPath.dir;
        var compareFiles = [];
        var merge = path.join(dir, 'merge.json');
        if (projectPath.ext === '.fire' || projectPath.ext === '.prefab') {
            files.base = dumpSortFireFiles(base); // base
            files.local = dumpSortFireFiles(local); // local
            files.remote = dumpSortFireFiles(remote); // remote
            // design the path that can be read
            if (!fs.existsSync(dir)) {
                console.error('Destination path is not available.')
                return;
            }
            // create the compare files, the files ext is the json
            compareFiles= outputFiles(dir);   
            compareForMerge(config.smartMerge.dependMergeTool, compareFiles, merge);

            var name = getFileName(files.base.name);
            cover.coverFile(merge, dir, name, projectPath.ext);
        }
        else {
            compareFiles.push(base);
            compareFiles.push(local);
            compareFiles.push(remote);

            compareForMerge(config.smartMerge.dependMergeTool, compareFiles, merge);
            cover.coverFile(merge, dir, name, projectPath.ext);
        }
        return;
    }
}

/**
 * 遍历指定的 .fire / .prefab 文件内容，将需求的多种数据信息进行解析，分组，排序。
 * 在 1.x 版本 node 对象还包含一个 _id 属性作为唯一标识，__id__ 记录对象索引信息
 * */
function dumpSortFireFiles (originFile) {   
    var origin = fs.readFileSync(originFile, {
        encoding: 'utf8',
    });
    var rawData = JSON.parse(origin);
    var tempData = [];
    var fileProp = path.parse(originFile);
    var fireProps = {
        name: fileProp.name,
        sceneHeader: [],
        nodes: [],
        components: [],
        prefabInfos: []
    }
    var con = new Convert(tempData);   
    resolveData(rawData, tempData);
    con.indexToMark();
    groupingData(tempData, fireProps);

    fireProps.nodes.sort(compareByName);

    return fireProps;  
}

// 配合 IdConverter 类型使用，为指定的对象类型创建唯一标识 ID，用于后续的排序和对象识别检索
function resolveData (rawData, tempData) {
    let handler = require('./Supporter/CreateMark');
    for (let i = 0; i < rawData.length; i++) {
        switch (rawData[i].__type__) {
            case type.prefab:
            case type.sceneAsset:
                handler.createHeaderId(rawData[i].__type__);
                break;
            case type.scene:
                handler.createSceneId(rawData[i].__type__, rawData[i]._id);
                break;
            case type.privateNode:
            case type.node:
                handler.createNodeId(rawData[i].__type__, rawData[i]._id, rawData[i]._name);
                break;
            case type.prefabInfo:
                handler.createPrefabInfo(rawData[i].__type__, rawData[i].fileId);
                break;
            case type.clickEvent:
                handler.createClickEvent(rawData[i].__type__);
                break;
            default: 
                handler.createDefault(rawData[i], rawData);
                break;
        }

        var branch = {
            index: i,
            name: rawData[i]._name,
            type: rawData[i].__type__,
            __id__: handler.result.__id__,
            _id: handler.result._id,
            data: rawData[i]
        };
        tempData.push(branch);
    }
}

// 类型分组
function groupingData (tempData, fireProps) {
    let handler = require('./Supporter/Grouping');
    tempData.forEach(function (obj) {
        switch (obj.type) {
            case type.scene:
            case type.privateNode:
            case type.node:
                handler.Divide2Nodes(obj, fireProps);
                break;
            case type.prefabInfo:
                handler.Divide2PrefabInfos(obj, fireProps);
                break;
            case type.sceneAsset:
                handler.Divide2SceneAsset(obj, fireProps);
                break;
            default :
                handler.Divide2Components(obj, fireProps);
                break;
        }
    });
}

// 输出三个数据内容生成临时的 json 文件，方便后续的数据获取和调整
function outputFiles (destinationPath) {
    var name = files.base.name;

    var modelBase, modelLocal, modelRemote;
    var result = pipe.preReplaceData(
                        createModel(files.base), 
                        createModel(files.local), 
                        createModel(files.remote), 
                        config.replaceData
                    );
    if (result) {
        modelBase = result[0];
        modelLocal = result[1];
        modelRemote = result[2];
    }

    var compareFold = path.join(destinationPath, '/MergeCache');
    // add the clear the destination fold.
    if (fs.existsSync(compareFold))
        del.sync(compareFold + '/**', {force: true});

    fs.mkdirSync(compareFold);
    fs.writeFileSync(compareFold + `/${name}Base.json`, modelBase, {
        encoding: 'utf8',
        flag: 'w'
    });
    fs.writeFileSync(compareFold + `/${name}Local.json`, modelLocal, {
        encoding: 'utf8',
        flag: 'w'
    });
    fs.writeFileSync(compareFold + `/${name}Remote.json`, modelRemote, {
        encoding: 'utf8',
        flag: 'w'
    });
    var paths = fs.readdirSync(compareFold, {encoding: 'utf8'}).map(x => path.join(compareFold, x));

    return paths;
} 

// 填充 json 模板，按照指定顺序将其他数据填充到 json 模板中
function createModel (fireProps) {
    var model = [];
    // header
    var header = {
        __id__: fireProps.sceneHeader.__type__,
        content: fireProps.sceneHeader
    };
    model.push(header);
    // node
    fireProps.nodes.forEach(function (obj) {
        obj._properties._components = [];
        obj._properties._prefab = undefined;
        var node = {
            __id__: `${obj.__id__}`,
            content: obj._properties,
            _components: [],
            _prefabInfos: [],
            _clickEvent: []
        };
        componentModel(node, obj, fireProps);
        prefabInfoModel(node, obj, fireProps);
        model.push(node);
    });
    
    return model;
}

// 调用第三方工具执行
function compareForMerge (toolPath, compareFiles, merge) {
    var base = compareFiles[0];
    var local = compareFiles[1];
    var remote = compareFiles[2];

    execFileSync(toolPath, [base, local, remote, '-o', merge]);
}

// 填充 component 数据到 json 中
function componentModel (node, obj, fireProps) {
    for (let i = 0; i < fireProps.components.length; i++) {
        var comp = fireProps.components[i];
        if (comp._id == obj._id) {
            if (comp._properties.__type__ === type.clickEvent) {
                node._clickEvent.push({
                    __id__: comp.__id__,
                    content: comp._properties
                });
            } 
            else {
                comp._properties.node = undefined;
                node._components.push({
                    __id__: comp.__id__,
                    content: comp._properties
                });
            }
        }
    };
}

// 填充 prefab 数据到 json 中
function prefabInfoModel (node, obj, fireProps) {
    if (!obj.prefab) return;

    for (let i = 0; i < fireProps.prefabInfos.length; i++) {
        var info = fireProps.prefabInfos[i];
        if (obj.prefab.__id__ === info.__id__) {
            info._properties.root = undefined;
            node._prefabInfos.push({
                __id__: info.__id__,
                content: info._properties
            });
            break;
        }
    }
}

// 通过 Base 临时文件，获取 fire 场景名称
function getFileName (tempName) {
    var spell = tempName.split('_');
    var words = [];
    for (let i = 0; i < spell.length; i++) {
        if (spell[i] === 'BASE') {
            var name = words.join('_');
            return name;
        }
        words.push(spell[i]);
    }
}

function compareByName (a, b) {
    return a.__id__.localeCompare(b.__id__);
}

module.exports = merge;