const path = require('path');
const fs = require('fs');
const del = require('del');
const Convert = require('./Supporter/IdConverter');

module.exports = {
    coverFile: function (tempFile, savePath, name, fileType) {
        var merge = fs.readFileSync(tempFile, {encoding: 'utf8'});
        var data = JSON.parse(merge);  
        var result = this.trans2Normal(data);
    
        console.log('``````````````finished!````````````````');
        
        fs.writeFileSync(`${savePath}/${name}${fileType}`, JSON.stringify(result, null, '\t'), {
            encoding: 'utf8',
            force: true
        });
        del.sync(tempFile, {force: true});
        del.sync(path.join(savePath, 'Mergecache'), {force: true});
    },

    trans2Normal: function (mergeData) {
        var tempData = [];
        mergeData = this.sortForTree(mergeData);
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

    sortForTree: function (mergeData) {
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