//页面添加监听事件 加载完成
document.addEventListener('DOMContentLoaded', function()
{
    injectCustomJs();
});

//向页面注入js
function injectCustomJs(jsPath){
    jsPath = jsPath || "js/inject.js";  //必须在配置文件中申明
    var temp = document.createElement('script');
    temp.setAttribute('type','text/javascript');
    temp.src = chrome.extension.getURL(jsPath);
    temp.onload = function(){
        this.parentNode.removeChild(this);
    }
    document.head.appendChild(temp);
}

chrome.runtime.sendMessage({cmd: 'getCollectPageList'});
//监听来自己background-js的请求
chrome.runtime.onMessage.addListener(function(request,sender,sendResponseParam){
    var responseStatus = { bCalled: false };
    function sendResponse(obj){
        try {
            sendResponseParam(obj);
        } catch (error) {
            //
        }
        responseStatus.bCalled= true;
    }
    if(request.cmd == "refresh"){
        document.location.reload();
    }else{
        if(request.cmd == "testMessage"){
            console.log("testMessage newtab");
            handleTestMessage(sendResponse);
        }else if(request.cmd =="print"){
            print(request.message);
        }else if(request.cmd == "alert"){
            alertMessage(request.message);
        }else if(request.cmd =="getCollectPageList"){
            getCollectPageList(request.message);
        }else if(request.cmd =="getMarker"){
            getMarker(request.message);
        }

        if(responseStatus.bCalled){
            return true;
        }    
    }
});
function handleTestMessage(resp){
    resp("测试发消息233");
}
//打印信息
function print(obj){
    console.log(obj);
}
//弹窗提示
function alertMessage(msg){
    alert(msg);
}
//书签
var showMenuKey = "";
function getCollectPageList(data){
    console.log('getCollectPageList');
    //console.log(data);
    var type = data.type;
    var data = data.data;
    data.sort(function(a,b){
        return b.sort - a.sort;
    });
    if(type && type.length>0){
        for (let index = 0; index <data.length ; index++) {
            var hasParent = false;
            for(let j=0; j<type.length; j++){
                if(data[index].typeKey == type[j].key){
                    if(!type[j].children){
                        type[j].children = [];
                    }
                    type[j].children.push(data[index]);
                    hasParent = true;
                    break;
                }
            }
        }
        if(type.length == 0){
            type.push({"key":1,name:"常用书签"});
            chrome.runtime.sendMessage({cmd: 'saveMarkerType',message:{"key":'',name:"默认书签"}});
        }
    }else{
        type = [{"key":1,name:"常用书签"}];
        chrome.runtime.sendMessage({cmd: 'saveMarkerType',message:{"key":'',name:"默认书签"}});
    }
    console.log(type);
    $('.mark-content').empty();
    $('.mark-menu').empty();
    for(let j=0; j<type.length; j++){
        if(j == 0){
            showMenuKey = type[j].key;
        }
        $('.mark-menu').append('<div class="menu-item '+(j==0?'active':'')+'" data-key="'+type[j].key+'" data-name="'+type[j].name+'">\
                            <label id="'+type[j].key+'">'+type[j].name+'</label>\
                        </div>');
        var listKey = 'list-'+type[j].key;
        var $content = $('<div id="'+listKey+'" class="content" style="display:'+(j==0?'block':'none')+'"></div>');
        $('.mark-content').append($content);
        for(var i=0; i<data.length; i++){
            if(data[i].typeKey == type[j].key){
                $content.append('<div class="item" key-data="'+data[i].key+'" type-name="'+type[j].name+'">\
                                            <img src="'+data[i].favIconUrl+'" style="height:60px;width: 60px;">\
                                            <a title="'+data[i].title+'" href="'+data[i].url+'">'+data[i].title+'</a>\
                                        </div>');
            }
        }
        $content.append('<div class="item new-mark" key-data="" type-name="'+type[j].name+'">\
                                            <img src="/img/add.png" style="height:60px;width: 60px;">\
                                            <a title="添加新标签" >添加新标签</a>\
                                        </div>');
    }
}

//书签信息
function getMarker(data){
    //console.log(data.favIconUrl);
    var title = "";
    if(data && data.key !=""){
        title = "书签修改";
        $('#favIconUrl').val(data.favIconUrl);
        $('#title').val(data.title);
        $('#url').val(data.url);
        $('#key').val(data.key);
        $('#typeKey').val(data.typeKey);
        $('#typeName').val(data.typeName);
    }else{
        title = "书签添加";
        $('#favIconUrl').val('');
        $('#title').val('');
        $('#url').val('');
        $('#key').val('');
        $('#typeKey').val('');
        $('#typeName').val('');
    }
    layer.open({
        title:title,
        type: 1,
        area: ['420px', '320px'], //宽高
        content: $('#editMarker')
    });
}

$(function(){
    var $item;
    $.contextMenu({
        selector: '.item', 
        callback: function(key, options) {
            $item = $(options.$trigger.context);
            var keyData = $item.attr('key-data');
            if(!keyData){
                layer.alert('不可操作');
                return;
            }
            if(key == "delete"){
                layer.confirm('确定删除该书签吗', {
                    btn: ['确定', '取消'] //按钮
                }, function () {
                    chrome.runtime.sendMessage({cmd: 'deleteMarker',message:keyData});
                    $item.hide();
                    layer.closeAll();
                }, function () {

                });
            }else if(key =="update"){
                chrome.runtime.sendMessage({cmd: 'getMarker',message:keyData});
            }
        },
        items: {
            "update": {name: "书签修改"},
            "delete": {name: "书签删除"}
        }
    });

    $.contextMenu({
        selector: '.menu-item', 
        callback: function(key, options) {
            $item = $(options.$trigger.context);
            if(key == "delete"){
                layer.confirm('确定删除该分类吗', {
                    btn: ['确定', '取消'] //按钮
                }, function () {
                    chrome.runtime.sendMessage({cmd: 'deleteMarkerType',message:$item.attr('data-key')});
                    $item.hide();
                    layer.closeAll();
                }, function () {

                });
            }else if(key =="update"){
                $('#typeKey2').val($item.attr('data-key'));
                $('#typeName2').val($item.attr('data-name'));
                layer.open({
                    title:'书签分类修改',
                    type: 1,
                    area: ['420px', '180px'], //宽高
                    content: $('#editMarkerType')
                });
            }else if(key == "add"){
                $('#typeKey2').val('');
                $('#typeName2').val('');
                layer.open({
                    title:'书签分类添加',
                    type: 1,
                    area: ['420px', '180px'], //宽高
                    content: $('#editMarkerType')
                });
            }
        },
        items: {
            "update": {name: "分类修改"},
            "add": {name: "分类添加"},
            "delete": {name: "分类删除"}
        }
    });

    $("body").delegate("button#btnCancel","click",function(){
        layer.closeAll();
    });
    $("body").delegate("button#btnConfirm","click",function(){
        //保存书签修改
        var favIconUrl = $('#favIconUrl').val();
        var title = $('#title').val();
        var url = $('#url').val();
        var key = $('#key').val();
        var typeKey = $('#typeKey').val();
        var typeName = $('#typeName').val();
        if(typeName == ""){
            layer.alert('分类不能为空');
            return;
        }
        if(title == ""){
            layer.alert('标题不能为空');
            return;
        }
        if(url == ""){
            layer.alert('地址不能为空');
            return;
        }
        chrome.runtime.sendMessage({cmd: 'saveMarker',message:{favIconUrl:favIconUrl,title:title,url:url,key:key,typeKey:typeKey,typeName:typeName}});
        if(key==""){
            window.location.reload();
        }else{
            $item.children('img').attr('src',favIconUrl);
            $item.children('a').attr('title',title).text(title).attr('href',url);
        }
        layer.closeAll();
    });
    $("body").delegate("button#btnConfirmType","click",function(){
        //保存书签修改
        var typeKey = $('#typeKey2').val();
        var typeName = $('#typeName2').val();
        if(typeName == ""){
            layer.alert('分类不能为空');
            return;
        }
        chrome.runtime.sendMessage({cmd: 'saveMarkerType',message:{key:typeKey,name:typeName}});
        layer.closeAll();
    });


    $(".book-marker").delegate("div.item>a","click",function(){
        var _this = this;
        var key = $(_this).parent().attr('key-data');
        chrome.runtime.sendMessage({cmd: 'upSort',message:key});
    });

    //书签目录切换
    $('.mark-menu').delegate('div.menu-item',"click",function(){
        var _this = this;
        $(_this).addClass('active').siblings().removeClass('active');
        showMenuKey = $(_this).attr('data-key');
        var key = "list-"+showMenuKey;
        $('.mark-content').children().each(function(){
            var _child = this;
            var id = $(_child).attr('id');
            if(key == id){
                document.getElementById(id).style="display:block;";
            }else{
                document.getElementById(id).style="display:none;";
            }
        });
    });
    $('.mark-content').delegate('div.new-mark',"click",function(){
        var _this = this;
        var typeKey = $(_this).parent().attr('id').split('list-')[1];
        var typeName = $(_this).attr('type-name');
        $('#favIconUrl').val('');
        $('#title').val('');
        $('#url').val('');
        $('#key').val('');
        $('#typeKey').val(typeKey);
        $('#typeName').val(typeName);
        layer.open({
            title:'书签添加',
            type: 1,
            area: ['420px', '320px'], //宽高
            content: $('#editMarker')
        });
    });
})

