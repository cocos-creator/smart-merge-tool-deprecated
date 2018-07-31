const type = require('./enums');

var convert = function (tempData) {
    this.tempData = tempData;
}

var proto = convert.prototype;

proto.indexToMark = function () {
    for (let i = 0; i < this.tempData.length; i++) {
        var obj = this.tempData[i];
        obj.data = this.locationId(obj);
    }
}

proto.locationId = function (obj) {
    var str = JSON.stringify(obj.data, null, '\t');
    str = str.replace(/"__id__": ([0-9]+)/g, (match, index) => {
        var __id__ = this.replaceMarkFun(index, obj);
        return `"__id__": "${__id__}"`;
    });
    obj.data = JSON.parse(str);

    return obj.data;
}

proto.markToIndex = function () {
    var data = [];
    for (let i = 0; i < this.tempData.length; i++) {
        var obj = this.tempData[i];
        obj = this.locationIndex(obj.content);
        data.push(obj);
    }

    return data;
}

proto.replaceMarkFun = function (index, obj) {
    var __id__ = ''; 
    var target = this.tempData[index];
    var _id = obj._id;
    var _name = obj.name;
    if (target.data.__type__ === type.clickEvent) {    
        __id__ = `${type.clickEvent}: ${target.data.handler}, Comp ${_name}(${_id})`;
        target.__id__ = __id__;
        target._id = _id;
    }
    else if (target.__id__ && target.__id__.includes(type.custom)) {
        __id__ = this.getMark(this.tempData, parseInt(index));
        target._id = _id;
    }
    else {
        __id__ = this.getMark(this.tempData, parseInt(index));
    }
    return __id__;
}

proto.locationIndex = function (objData) {
    // must the node sort first, or will lost the __id__
    var str = JSON.stringify(objData, null, '\t');
    str = str.replace(/"__id__": "([\S ]+)"/g, (match, __id__) => {
        var index = this.replaceIndexFun(__id__);
        return `"__id__": ${index}`;
    });
    objData = JSON.parse(str);

    return objData;    
}

proto.replaceIndexFun = function (__id__) {
    var index = this.tempData.findIndex(function (ele) {
        if (`"${__id__}"` === JSON.stringify(ele.__id__)) {
            return ele;
        }
    });
    return index;
}

proto.getMark = function (array, index) {
    var obj = array.find(function (ele) {
        if (ele.index === index) {
            return ele;
        }
    });

    return obj.__id__;    
}



module.exports = convert;