// 创建对应的分组并加入同类型对象进入指定分组
module.exports = {
    // 将类型为 node 对象加入 nodes 数组
    Divide2Nodes: function (obj, fireProps) {
        var node = {
            _id: obj.data._id,
            prefab: obj.data._prefab,
            __id__: obj.__id__,
            _properties: obj.data
        };
        fireProps.nodes.push(node);
    },

    // 将类型为 prefab 对象加入 prefabs 数组
    Divide2PrefabInfos: function (obj, fireProps) {
        var info = {
            __id__: obj.__id__,
            _properties: obj.data
        }
        fireProps.prefabInfos.push(info);
    },

    // 记录类型为 sceneHeader 对象
    Divide2SceneAsset: function (obj, fireProps) {
        fireProps.sceneHeader = obj.data;
    },

    // 将类型为 component 对象加入 components 数组
    Divide2Components: function (obj, fireProps) {
        var node = '';
        if (obj.data.node) {
            node = obj.data.node.__id__;
        }
        var component = {
            node: node,
            __id__: obj.__id__,
            // _id is belong to node
            _id: obj._id,
            _properties: obj.data
        };
        fireProps.components.push(component);
    }
}