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
function getCollectPageList(data){
    //console.log('getCollectPageList');
    //console.log(data);
    if(data){
        data.sort(function(a,b){
            return b.sort - a.sort;
        });
        $('.book-marker').empty();
        for(var i=0; i<data.length; i++){
            $('.book-marker').append('<div class="item" key-data="'+data[i].key+'">\
                                        <img src="'+data[i].favIconUrl+'" style="height:60px;width: 60px;">\
                                        <a title="'+data[i].title+'" href="'+data[i].url+'">'+data[i].title+'</a>\
                                    </div>');
        }
    }
}

//书签信息
function getMarker(data){
    //console.log(data.favIconUrl);
    var title = "";
    if(data){
        title = "书签修改";
        $('#favIconUrl').val(data.favIconUrl);
        $('#title').val(data.title);
        $('#url').val(data.url);
        $('#key').val(data.key);
    }else{
        title = "书签添加";
        $('#favIconUrl').val('');
        $('#title').val('');
        $('#url').val('');
        $('#key').val('');
    }
    layer.open({
        title:title,
        type: 1,
        area: ['420px', '240px'], //宽高
        content: $('#editMarker')
    });
}

$(function(){
    var $item;
    $.contextMenu({
        selector: '.item', 
        callback: function(key, options) {
            $item = $(options.$trigger.context);
            if(key == "delete"){
                layer.confirm('确定删除该书签吗', {
                    btn: ['确定', '取消'] //按钮
                }, function () {
                    chrome.runtime.sendMessage({cmd: 'deleteMarker',message:$item.attr('key-data')});
                    layer.closeAll();
                }, function () {

                });
            }else if(key =="update"){
                chrome.runtime.sendMessage({cmd: 'getMarker',message:$item.attr('key-data')});
            }
        },
        items: {
            "update": {name: "书签修改"},
            "delete": {name: "书签删除"}
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
        chrome.runtime.sendMessage({cmd: 'saveMarker',message:{favIconUrl:favIconUrl,title:title,url:url,key:key}});
        if(key==""){
            window.location.reload();
        }else{
            $item.children('img').attr('src',favIconUrl);
            $item.children('a').attr('title',title).text(title).attr('href',url);
        }
        layer.closeAll();
    });


    $(".book-marker").delegate("div.item>a","click",function(){
        var _this = this;
        var key = $(_this).parent().attr('key-data');
        chrome.runtime.sendMessage({cmd: 'upSort',message:key});
    });

    $('#addNewBookMarkBtn').click(function(){
        chrome.runtime.sendMessage({cmd: 'getMarker',message:''});
    });
})

