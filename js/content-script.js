//注意Content-js的生命周期同一个页面的生命周期

//页面添加监听事件 加载完成
document.addEventListener('DOMContentLoaded', function()
{
    injectCustomJs();
    clearAdvert();
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

function readJsonConfig(filePath,callback){
    fetch(chrome.runtime.getURL(filePath))
        .then((response)=>response.json())
        .then((json)=>{
            if(typeof(callback) == "function"){
                callback(json);
            }
        });
}

function clearAdvert(){
    var currentURL = window.location.href;
    
}

/**
 * 如果需要返回响应 则必须加 return true
 */
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
            console.log("testMessage content-js");
            handleTestMessage(sendResponse);
        }else if(request.cmd =="print"){
            print(request.message);
        }else if(request.cmd == "alert"){
            alertMessage(request.message);
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

 
