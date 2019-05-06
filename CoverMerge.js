const path = require('path');
const fs = require('fs');
const del = require('del');
const Convert = require('./Supporter/IdConverter');

module.exports = {
    /**
     * 将 json 文件转换为 .fire 文件
     * 1. 获取 merge.json 数据
     * 2. 按照节点树形式遍历 merge.json 中 node 对象，相关的 prefab，component clickEvent 数据将在这个过程中按照顺序遍历。
     * 3. 上述遍历过程中，将遍历数据填充进入 result 对象
     * 3. 填充数据过程中 __id__ 数据转换为 index 类型，生成 fire 文件
     */
    coverFile: function (tempFile, savePath, name, fileType) {
        var merge = fs.readFileSync(tempFile, {encoding: 'utf8'});
        var data = JSON.parse(merge);  
        // result is filled by fire data
        var result = this.trans2Normal(data);
    
        console.log('``````````````finished!````````````````');
        
        fs.writeFileSync(`${savePath}/${name}${fileType}`, JSON.stringify(result, null, '\t'), {
            encoding: 'utf8',
            force: true
        });
        del.sync(tempFile, {force: true});
        del.sync(path.join(savePath, 'Mergecache'), {force: true});
    },

    // 遍历 merge.json 数据
    trans2Normal: function (mergeData) {
        var tempData = [];
        mergeData = this.sortByNodeTree(mergeData);
        for (let i = 0; i < mergeData.length; i++) {
            let obj = mergeData[i];
            tempData.push({
                __id__: obj.__id__,
                content: obj.content
            });

            this.transComponents(obj, tempData);
            this.transPrefabInfos(obj, tempData);
            this.transClickEvent(obj, tempData);
        }
        var con = new Convert(tempData);
        var result = con.markToIndex();

        return result;
    },

    // 按照节点树的方式遍历数据
    sortByNodeTree: function (mergeData) {
        var tempData = [];
        tempData.push(mergeData[0]);

        var firstNode = mergeData.find(function (ele) {
            if (ele.content.__type__ === 'cc.Scene')
                return ele;
        });
        // consider about the prefab
        if (!firstNode) {
            firstNode = mergeData.find(function (ele) {
                if (ele.content.__type__ === 'cc.Node') {
                    return ele;
                }
            });
        }
        this.recurseChild(firstNode, mergeData).forEach(function (obj) {
            tempData.push(obj);
        });
        
        return tempData;
    },

    // 递归子节点
    recurseChild: function (node, mergeData) {
        var _self = this;
        var record, result = [];
        result.push(node);

        if (!node.content._children || node.content._children.length < 0) {
            return result;
        }
        node.content._children.forEach(function (child) {
            for (let i = 0; i < mergeData.length; i++) {
                if (mergeData[i].__id__ === child.__id__) {
                    record = _self.recurseChild(mergeData[i], mergeData);
                    for (let j = 0; j < record.length; j++){
                        result.push(record[j]);
                    }
                    break;
                }
            }
        });    

        return result;
    },

    // 转换组件信息数据
    transComponents: function (obj, tempData) {
        if (!obj._components) {
            return;
        }

        for (let i = 0; i < obj._components.length; i++) {
            obj._components[i].content.node = {
                __id__: obj.__id__
            };
            tempData.push({
                __id__: obj._components[i].__id__,
                content: obj._components[i].content
            });
            obj.content._components.push({
                __id__: obj._components[i].__id__
            });
        }
    },

    // 转换 Prefab 信息数据
    transPrefabInfos: function (obj, tempData) {
        if (!obj._prefabInfos) {
            return;
        }

        if (obj._prefabInfos.length > 0) {
            obj._prefabInfos[0].content.root = {
                __id__: obj.__id__
            };;
            tempData.push({
                __id__: obj._prefabInfos[0].__id__,
                content: obj._prefabInfos[0].content
            });
            obj.content._prefab = {
                __id__: obj._prefabInfos[0].__id__
            };
        }
    },

    // 转换点击事件数据，Click 事件场景内数据比较特殊，因此在遍历和转换过程中都单独列出保留
    transClickEvent: function (obj, tempData) {
        if (!obj._clickEvent) {
            return;
        }

        for (let k = 0; k < obj._clickEvent.length; k++) {
            tempData.push({
                __id__: obj._clickEvent[k].__id__,
                content: obj._clickEvent[k].content
            });
        }
    },
}