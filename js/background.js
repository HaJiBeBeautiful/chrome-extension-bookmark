/*
后台程序 生命周期随着浏览器打开而开始 浏览器关闭而结束
*/
var fn =  (function(chrome){
    
    /*---------------------------------全局参数START--------------------------------------------*/
    //定时器的句柄Id
    var intervalldArr = [];
    //功能对象
    var fnObject = {};
    //插件配置本地存储key
    var configKey = "storage_config_json_key";
      //配置文件路径
      var configJsonPath = "config/config.json";


    //配置文件字段
    var pageCollectKey = "bookmark"; //书签数据
    var overwriteFeild = "overwrite"; // value have 'false' or 'true'
    var modelFeild = "model"; //读取模式 onece 只读一次  everytime每次浏览器启动就重新读一次
    var modelFeildValue = ["onece","everytime"];
    var bookmarkTypeFeild = "bookmarkType"; //书签类型
    /*---------------------------------全局参数END--------------------------------------------*/

    var isNULL = function(str){
        if( !str || str=="" || str=="null"){
            return true;
        }
        return false;
    }

    //初始化
    function init(){
        fnObject.getSynStorage(configKey,(data)=>{
            if(data.hasOwnProperty(configKey)){
                var configJsonData = data[configKey];
                fnObject.readJsonConfig(configJsonPath,(json)=>{
                    if(json){
                        var model = modelFeildValue[0];
                        if(json.hasOwnProperty(modelFeild) && typeof(json[modelFeild])=="string" && modelFeildValue.indexOf(json[modelFeild])){
                            model = json[modelFeild];
                        }
                        if(model == modelFeildValue[1]){
                            var isOverwrite = false;
                            if(json.hasOwnProperty(overwriteFeild) && typeof(json[overwriteFeild])=="boolean"){
                                isOverwrite = json[overwriteFeild];
                            }else{
                                json[overwriteFeild] = isOverwrite;
                            }
                            if(isOverwrite){
                                for (const key in json) {
                                    configJsonData[key] = json[key];
                                }
                            }else{
                                for (const key in json) {
                                    if (configJsonData.hasOwnProperty(key)) {
                                        if(Array.isArray(json[key])){
                                            const elements = configJsonData[key];
                                            const jsonFileData = json[key];
                                            const storageDataLen = elements.length;
                                            for(var i=0; i<jsonFileData.length; i++){
                                                var hasKey = false;
                                                for(var j=0; j<storageDataLen; j++){
                                                    if(jsonFileData[i].key == elements[j].key){
                                                        elements[j] = jsonFileData[i];
                                                        hasKey = true;
                                                        break;
                                                    }
                                                }
                                                if(!hasKey){
                                                    elements[elements.length] = jsonFileData[i];
                                                }
                                            }
                                            configJsonData[key] = elements;
                                        }else if(typeof(json[key])=="string" || typeof(json[key])=="number"){
                                            configJsonData[key] = json[key];
                                        }else if(typeof(json[key])=="object"){
                                            for (const jKey in json[key]) {
                                                configJsonData[key][jKey] = json[key][jKey];
                                            }
                                        }
                                    }else{
                                        configJsonData[key] = json[key];
                                    }
                                }
                            }
                            fnObject.setSyncStorage(configKey,configJsonData);
                        }
                    }
                });
            }else{
                fnObject.readJsonConfig(configJsonPath,(json)=>{
                    if(json){
                        var isOverwrite = true;
                        if(json.hasOwnProperty(overwriteFeild) && typeof(json[overwriteFeild])=="boolean"){
                            isOverwrite = json[overwriteFeild];
                        }else{
                            json[overwriteFeild] = isOverwrite;
                        }
                        fnObject.setSyncStorage(configKey,json);
                    }
                });
            }
        });
    }

    //每次打开浏览器就重新排序一次
    function sortMarker(){
        fnObject.getConfigJsonData(function(data){
            if (data.hasOwnProperty(pageCollectKey)) {
                var collectPageArr = data[pageCollectKey];
                collectPageArr.sort(function(a,b){
                    return b.sort - a.sort;
                });
                var j=0;
                for(var i=collectPageArr.length -1; i>=0; i--){
                    collectPageArr[i].sort = j;
                    j++;
                }
                fnObject.setSyncStorage(configKey,data);
            }
        });
    };

    //监听来自content-script的消息
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
    {
        //获取书签
        if(request.cmd == "getCollectPageList"){
            fnObject.getConfigJsonData(function(data){
                var bookmarkData = [];
                var bookmarkTypeFeildData = [];
                if (data.hasOwnProperty(pageCollectKey)) {
                    bookmarkData = data[pageCollectKey];
                }
                if (data.hasOwnProperty(bookmarkTypeFeild)) {
                    bookmarkTypeFeildData = data[bookmarkTypeFeild];
                }
                fnObject.sendMessageToContentScript({cmd:"getCollectPageList",message:{data:bookmarkData,type:bookmarkTypeFeildData}});
            });
        }else if(request.cmd == "deleteMarker"){
            //删除书签
            var key = request.message;
            fnObject.getConfigJsonData(function(data){
                if(data.hasOwnProperty(pageCollectKey)){
                    var collectPageArr = data[pageCollectKey];
                    for(var i=0; i<collectPageArr.length; i++){
                        if(collectPageArr[i].key == key){
                            collectPageArr.splice(i,1);
                            fnObject.setSyncStorage(configKey,data);
                            break;
                        }
                    }
                    //fnObject.sendMessageToContentScript({cmd:"getCollectPageList",message:collectPageArr});
                    //fnObject.BasicNotifications('消息通知','您的书签删除成功');
                }
            });
        }else if(request.cmd =="getMarker"){
            //获取书签信息
            var key = request.message;
            fnObject.getConfigJsonData(function(data){
                if(data.hasOwnProperty(pageCollectKey)){
                    var collectPageArr = data[pageCollectKey];
                    var a=-1;
                    for(var i=0; i<collectPageArr.length; i++){
                        if(collectPageArr[i].key == key){
                            a = i;
                            break;
                        }
                    }
                    if(a>=0){
                        if (data.hasOwnProperty(bookmarkTypeFeild)) {
                            var bookmarkTypeFeildData = data[bookmarkTypeFeild];
                            for(var i=0; i<bookmarkTypeFeildData.length; i++){
                                if(collectPageArr[a].typeKey == bookmarkTypeFeildData[i].key){
                                    collectPageArr[a]["typeName"] = bookmarkTypeFeildData[i].name;
                                    break;
                                }
                            }
                        }
                        fnObject.sendMessageToContentScript({cmd:"getMarker",message:collectPageArr[a]});
                    }else{
                        fnObject.sendMessageToContentScript({cmd:"getMarker",message:''});
                    }
                }
            });
        }else if(request.cmd =="upSort"){
            var key = request.message;
            fnObject.getConfigJsonData(function(data){
                if(data.hasOwnProperty(pageCollectKey)){
                    var collectPageArr = data[pageCollectKey];
                    for(var i=0; i<collectPageArr.length; i++){
                        if(collectPageArr[i].key == key){
                            collectPageArr[i].sort = collectPageArr[i].sort +1;
                            fnObject.setSyncStorage(configKey,data);
                            break;
                        }
                    }
                }
            });
        }else if(request.cmd =="saveMarker"){
            var marker = request.message;
            fnObject.getConfigJsonData(function(data){
                if(data.hasOwnProperty(pageCollectKey)){
                    var collectPageArr = data[pageCollectKey];
                    var newTypeKey = "";
                    if (data.hasOwnProperty(bookmarkTypeFeild)) {
                        var bookmarkTypeFeildData = data[bookmarkTypeFeild];
                        for(var i=0; i<bookmarkTypeFeildData.length; i++){
                            if(marker.typeName == bookmarkTypeFeildData[i].name){
                                newTypeKey = bookmarkTypeFeildData[i].key;
                                break;
                            }
                        }
                        if(isNULL(newTypeKey)){
                            marker.typeKey = fnObject.randomString(32);
                            bookmarkTypeFeildData.push({key:marker.typeKey,name:marker.typeName});
                        }else{
                            marker.typeKey = newTypeKey;
                        }
                    }else{
                        marker.typeKey = fnObject.randomString(32);
                        data[bookmarkTypeFeild] = [{key:marker.typeKey,name:marker.typeName}];
                    }
                    if(isNULL(marker.favIconUrl)){
                        marker.favIconUrl = "/img/bookmark.png";
                    }
                    if(isNULL(marker.key)){
                        //添加书签
                        var key = fnObject.randomString(32);
                        collectPageArr.push({title:marker.title,url:marker.url,favIconUrl:marker.favIconUrl,key:key,sort:0,typeKey:marker.typeKey});
                        fnObject.setSyncStorage(configKey,data);
                    }else{
                        for(var i=0; i<collectPageArr.length; i++){
                            if(collectPageArr[i].key == marker.key){
                                collectPageArr[i].title = marker.title;
                                collectPageArr[i].url = marker.url;
                                collectPageArr[i].favIconUrl = marker.favIconUrl;
                                collectPageArr[i].typeKey = marker.typeKey;
                                fnObject.setSyncStorage(configKey,data);
                                break;
                            }
                        }
                    }
                    fnObject.sendMessageToContentScript({cmd:"refresh"});
                }
            });
        }else if(request.cmd == "deleteMarkerType"){
            //删除书签分类
            var key = request.message;
            fnObject.getConfigJsonData(function(data){
                if(data.hasOwnProperty(bookmarkTypeFeild)){
                    var bookmarkTypeFeildData = data[bookmarkTypeFeild];
                    for(var i=0; i<bookmarkTypeFeildData.length; i++){
                        if(bookmarkTypeFeildData[i].key == key){
                            bookmarkTypeFeildData.splice(i,1);
                            if(data.hasOwnProperty(pageCollectKey)){
                                var collectPageArr = data[pageCollectKey];
                                for(var j=collectPageArr.length-1; j>=0; j--){
                                    if(collectPageArr[j].typeKey == key){
                                        collectPageArr.splice(j,1);
                                    }
                                }
                            }
                            fnObject.setSyncStorage(configKey,data);
                            break;
                        }
                    }
                    fnObject.sendMessageToContentScript({cmd:"refresh"});
                }
            });
        }else if(request.cmd =="saveMarkerType"){
            var markerType = request.message;
            fnObject.getConfigJsonData((data)=>{
                if(data.hasOwnProperty(bookmarkTypeFeild)){
                    var bookmarkTypeFeildData = data[bookmarkTypeFeild];
                    if(isNULL(markerType.key)){
                        var typeKey = fnObject.randomString(32);
                        bookmarkTypeFeildData.push({key:typeKey,name:markerType.name});
                    }else{
                        for(var i=0; i<bookmarkTypeFeildData.length; i++){
                            if(bookmarkTypeFeildData[i].key == markerType.key){
                                bookmarkTypeFeildData[i].name = markerType.name;
                                break;
                            }
                        }
                    }
                    fnObject.setSyncStorage(configKey,data);
                    fnObject.sendMessageToContentScript({cmd:"refresh"});
                }
            });
        }
        
    });

    //监控地址栏 改变
    chrome.omnibox.onInputChanged.addListener((text,suggest)=>{
        if(!text) return;
        if(text == '美女') {
            suggest([
                {content: '中国' + text, description: '你要找“中国美女”吗？'},
                {content: '日本' + text, description: '你要找“日本美女”吗？'},
                {content: '泰国' + text, description: '你要找“泰国美女或人妖”吗？'},
                {content: '韩国' + text, description: '你要找“韩国美女”吗？'}
            ]);
        }
        else if(text == '微博') {
            suggest([
                {content: '新浪' + text, description: '新浪' + text},
                {content: '腾讯' + text, description: '腾讯' + text},
                {content: '搜狐' + text, description: '搜索' + text},
            ]);
        }
        else if(text == 'json'){
            suggest([
                {content: 'json格式化',description:'json格式化'}
            ]);
        }
        else if(text == 'maven'){
            suggest([
                {content: 'maven仓库依赖搜索',description:'maven仓库依赖搜索'}
            ]);
        }
        else {
            suggest([
                {content: '百度搜索 ' + text, description: '百度搜索 ' + text},
                {content: '谷歌搜索 ' + text, description: '谷歌搜索 ' + text},
            ]);
        }
    });

    //监控地址栏的选择
    chrome.omnibox.onInputEntered.addListener((text) => {
        if(!text) return;
        var href = '';
        if(text.endsWith('美女')) href = 'http://image.baidu.com/search/index?tn=baiduimage&ie=utf-8&word=' + text;
        else if(text.startsWith('百度搜索')) href = 'https://www.baidu.com/s?ie=UTF-8&wd=' + text.replace('百度搜索 ', '');
        else if(text.startsWith('谷歌搜索')) href = 'https://www.google.com.tw/search?q=' + text.replace('谷歌搜索 ', '');
        else if(text.startsWith('json')) href="https://www.json.cn/";
        else if(text.startsWith('maven')) href="https://mvnrepository.com/";
        else href = 'https://www.baidu.com/s?ie=UTF-8&wd=' + text;
        fnObject.openUrlCurrentTab(href);
    });

    
    //创建右键菜单
    chrome.contextMenus.create({
        title:'收藏网页(插件定义)',
        contexts:['page'],
        onclick:function(params)
        {
            fnObject.getCurrentTab(tab => {
                if(!tab.url.startsWith('chrome://')){
                    fnObject.getConfigJsonData(function(data){
                        var favIconUrl = tab.favIconUrl;
                        if(!favIconUrl){
                            favIconUrl = "/img/bookmark.png";
                        }
                        if(data.hasOwnProperty(pageCollectKey)){
                            var typeKey = "";
                            if(data.hasOwnProperty(bookmarkTypeFeild)){
                                var bookmarkTypeFeildData = data[bookmarkTypeFeild];
                                if(bookmarkTypeFeildData.length>0){
                                    typeKey = bookmarkTypeFeildData[0].key;
                                }else{
                                    typeKey = fnObject.randomString(32);
                                    bookmarkTypeFeildData.push({key:typeKey,name:"常用书签"});
                                }
                            }else{
                                typeKey = fnObject.randomString(32);
                                data[bookmarkTypeFeild] = [{key:typeKey,name:"常用书签"}];
                            }
                            var collectPageArr = data[pageCollectKey];
                            var collected = false;
                            for(var i=0; i<collectPageArr.length; i++){
                                if(collectPageArr[i].url == tab.url){
                                    collected = true;
                                    break;
                                }
                            }
                            if(!collected){
                                var key = fnObject.randomString(32);
                                collectPageArr.push({title:tab.title,url:tab.url,favIconUrl:favIconUrl,key:key,sort:0,typeKey:typeKey});
                                fnObject.setSyncStorage(configKey,data);
                            }
                        }else{
                            var collectPageArr = new Array();
                            var key = fnObject.randomString(32);
                            collectPageArr.push({title:tab.title,url:tab.url,favIconUrl:favIconUrl,key:key,sort:0,typeKey:typeKey});
                            data[pageCollectKey] = collectPageArr;
                            fnObject.setSyncStorage(configKey,data);
                        }
                        //fnObject.print(data);
                        //fnObject.BasicNotifications('消息通知','您的书签收藏成功');
                    });
                }
            })
        }
    });

    //读取本地存储配置JSON数据
    fnObject.getConfigJsonData = function(callback){
        fnObject.getSynStorage(configKey,(data)=>{
            if(typeof(callback) == "function"){
                callback(data[configKey] || {});
            }
        });
    }

    //读取本地json配置
    fnObject.readJsonConfig = function(filePath,callback){
        fetch(chrome.runtime.getURL(filePath))
            .then((response)=>response.json())
            .then((json)=>{
                if(typeof(callback) == "function"){
                    callback(json);
                }
            });
    }

    //随机生成字符串
    fnObject.randomString = function(len){
        len = len || 32;
    　　var $chars = 'ABC>1D*EF$GH2.IJK3L@MNO,QP4!R]ST=U5V%WX[YZ+a&~b6c(def8-ghij7kml)nopq\9re#st0_uv?w/xyz<';
    　　var maxPos = $chars.length;
    　　var pwd = '';
    　　for (i = 0; i < len; i++) {
    　　　　pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    　　}
    　　return pwd;
    }

    //基础桌面通知
    fnObject.BasicNotifications = function(title,message){
        chrome.notifications.create(null, {
            type: 'basic',
            iconUrl: 'img/icon.png',
            title: title,
            message: message
        });
    
    }
    //存储数据
    fnObject.setSyncStorage = function(key,value,callback){
        var obj = {};
        obj[key] = value;
        chrome.storage.sync.set(obj,function(){
            if(typeof(callback) == "function"){
                callback();
            }
        });
    }
    //获取存储数据
    fnObject.getSynStorage = function(keys,callback){
        chrome.storage.sync.get(keys,function(items){
            if(typeof(callback) == "function"){
                callback(items);
            }
        });
    }
    //删除存储数据
    fnObject.removeSynStorage = function(keys,callback){
        chrome.storage.sync.remove(keys, function(){
            if(typeof(callback) == "function"){
                callback();
            }
        });
    }

    //打印信息 content-js
    fnObject.print = function(info){
        fnObject.sendMessageToContentScript({cmd:"print",message:info});
    }
    //弹窗 content-js
    fnObject.alertMsg = function(info){
        fnObject.sendMessageToContentScript({cmd:"alert",message:info});
    }

    // 获取当前选项卡ID
    fnObject.getCurrentTab = function (callback)
    {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
        {
            if(callback) callback(tabs.length ? tabs[0]: null);
        });
    }

    // 当前标签打开某个链接
    fnObject.openUrlCurrentTab = function(url)
    {
        fnObject.getCurrentTab(tab => {
            chrome.tabs.update(tab.id, {url: url});
        })
    }

    //发送短期消息到content-js
    fnObject.sendMessageToContentScript = function(message,callback){
        fnObject.getCurrentTab(tab=>{
            chrome.tabs.sendMessage(tab.id,message,callback);
        });
    }
    //获取定时器
    fnObject.getAllTimeInterval = function(){
        return intervalldArr;
    }
    //获取定时器
    fnObject.getTimeInterval = function(key){
        if(isNULL(key)){
            return null;
        }
        for(var i=0; i<intervalldArr.length; i++){
            if(intervalldArr[i].key == key){
                return intervalldArr[i];
            }
        }
        return null;
    }

    //设置定时器
    fnObject.setTimeInterval = function(key,callback,times){
        if(isNULL(key)){
            return;
        }
        for(var i=0; i<intervalldArr.length; i++){
            if(intervalldArr[i].key == key){
                return;
            }
        }
        var intervalld = setInterval(function(){
            if(typeof(callback) == "function"){
                callback();
            }
        },times);
        intervalldArr.push({key:key,intervalld:intervalld});
    }
    //清除定时器
    fnObject.clearTimeInterval = function(key){
        if(isNULL(key)){
            return;
        }
        var object = fnObject.getTimeInterval(key);
        if(object != null){
            clearInterval(object.intervalld);
            for(var i=intervalldArr.length-1; i>=0; i--){
                if(key == intervalldArr[i].key){
                    intervalldArr.splice(i,1);
                    return;
                }
            }
        }
    }
    //清楚所有定时器
    fnObject.clearAllTimeInterval = function(){
        for(var i=0; i<intervalldArr.length; i++){
            clearInterval(intervalldArr[i].intervalld);
        }
        intervalldArr = [];
    }

    init();
    sortMarker();

    return fnObject;
})(chrome);




