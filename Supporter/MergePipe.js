var pipe = {
    base: [],
    local: [],
    remote: [],
}

function replaceData (type, dataName, branch) {
    var mainData = choiceMainBranch(branch);

    if (type === 'Node') {
        partOfNode(mainData, dataName);
    }
    else {
        partOfDefault(mainData, dataName, type);
    } 
}
/**
 * only replace the data. 
 * @param {Array} tempData - currect target to  be replaced  by the data
 * @param {Object} mainData - as the replacement data
 * @param {Object} mainData.content - the whole data content about the data
 * @param {String} mainData.__id__ - the uniquely identifies
 * @param {Number} index - locate the same position target
 * @param {String} dataName - prototype 
 */
function replaceContent (tempData, mainData, index, dataName) {
    if (checkContentReplaceable(tempData[index], mainData, dataName)) {
        tempData[index].content[dataName] = mainData.content[dataName];
    }
}

function replaceId (tempData, mainData, index) {
    if (checkIdReplaceable(tempData[index], mainData)) {
        tempData[index].__id__ = mainData.__id__;
    }
}

function partOfNode (mainData, dataName) {
    mainData[0].forEach(function (data, index) {
        if (!data.content[dataName]) {
            if (dataName === '__id__') {
                mainData[1] && replaceId(mainData[1], data, index);
                mainData[2] && replaceId(mainData[2], data, index);
            }
            return;
        }
        mainData[1] && replaceContent(mainData[1], data, index, dataName);
        mainData[2] && replaceContent(mainData[2], data, index, dataName);
    });
}
// this part contain component, prefabInfo, clickEvent, custome
function partOfDefault (mainData, dataName, type) {
    mainData[0].forEach(function (data, index1) {
        if (!data[type]) {
            return;
        }
        data[type].forEach(function (obj, index2) {
            var data1 = mainData[1][index1];
            var data2 = mainData[2][index1];
            if (!obj.content[dataName]) {               
                if (dataName === '__id__') {
                    data1 && replaceId(data1[type], obj, index2);
                    data2 && replaceId(data2[type], obj, index2);
                }
                return;
            }
                data1 && replaceContent(data1[type], obj, index2, dataName);
                data2 && replaceContent(data2[type], obj, index2, dataName);
        });
    });
}

// return a array and the main branch will set at the first.
function choiceMainBranch (branch) {
    var dataArray = [];
    switch (branch) {
        case "Base":
            dataArray.push(pipe.base);
            dataArray.push(pipe.local);
            dataArray.push(pipe.remote);
            break; 
        case "Local":
            dataArray.push(pipe.local);
            dataArray.push(pipe.base);
            dataArray.push(pipe.remote); 
            break;
        case "Remote":
            dataArray.push(pipe.remote);
            dataArray.push(pipe.base);
            dataArray.push(pipe.local);
            break;
        default:
            throw "Branch choice error.";
    }
    
    return dataArray;
}

function checkContentReplaceable (tempData, mainData, dataName) {
    if (!tempData) {
        return false;
    }
    // check the tempData if the tempData is the same as the mainData
    if (tempData.__id__ === mainData.__id__) {
        return true;
    }
    else if (tempData.content.__type__ === mainData.content.__type__) {
        if (tempData.content._name === mainData.content._name) {
            // did not have the prototype
            if (!tempData.content[dataName]) {
                return false;
            }
            return true;
        }
    }

    return false;
}

function checkIdReplaceable (tempData, mainData) {
    if (!tempData) {
        return false;
    }   
    if (tempData.content.__type__ !== mainData.content.__type__) {
        return false;
    }
    // only use to change the _id part
    if (tempData.content._name !== mainData.content._name) {
        return false;
    }

    return true;
}

/**
 * @param {Array} branchData - It is currect branch model data.
 * @param {Object} config - It is the config that you want to replace branch.
 * @param {String} config.dataType - It is the data type that can help you find the target exactly.
 * @param {String} config.dataName - It is the prototype name that you want to replace. 
 * @param {String} config.branch - It is the branch that you choice as the main branch to replace others branch data. 
 * @param {Boolean} config.isReplace - If you want to replace the data.
 */
pipe.preReplaceData = function preReplaceTheDataToCutDownTheMergeConflict (baseData, localData, remoteData, config) {
    var result = [];
    this.base = baseData;
    this.local = localData;
    this.remote = remoteData;

    if (config.isReplace) {
        config.dataName.forEach(function (name, index) {
            var type = config.dataType[index];
            var branch = config.branch[index];
            switch(type) {
                case "Node":
                    replaceData('Node', name, branch);
                    break;
                case "Component":
                    replaceData('_components', name, branch);
                    break;
                case "PrefabInfos":
                    replaceData('_prefabInfos', name, branch);
                    break;
                case "ClickEvent":
                    replaceData('_clickEvent', name, branch);
                    break;
            };
        });
    }
    result.push(this.base);
    result.push(this.local);
    result.push(this.remote);

    return result.map( x => x = JSON.stringify(x, null, '\t'));
}

module.exports = pipe;