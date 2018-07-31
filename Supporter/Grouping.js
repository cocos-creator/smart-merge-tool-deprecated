module.exports = {
    Divide2Nodes: function (obj, filesPos) {
        var node = {
            _id: obj.data._id,
            prefab: obj.data._prefab,
            __id__: obj.__id__,
            _properties: obj.data
        };
        filesPos.nodes.push(node);
    },

    Divide2PrefabInfos: function (obj, filesPos) {
        var info = {
            __id__: obj.__id__,
            _properties: obj.data
        }
        filesPos.prefabInfos.push(info);
    },

    Divide2SceneAsset: function (obj, filesPos) {
        filesPos.sceneHeader = obj.data;
    },

    Divide2Components: function (obj, filesPos) {
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
        filesPos.components.push(component);
    }
}