//popup-js的生命周期同一个popup页面 弹出-关闭 

var bg = chrome.extension.getBackgroundPage(); //后台js对象
//发送刷新消息通知页面刷新
var intervalKey= "refreshTimer"; //定时器名字
var intervalObj = bg.fn.getTimeInterval(intervalKey);
if(intervalObj != null){
    $('#action-btn').text('打断刷新');
}
$('#action-btn').click(function(){
    intervalObj = bg.fn.getTimeInterval(intervalKey);
    if(intervalObj == null){
        $('#action-btn').text('打断刷新');
        bg.fn.setTimeInterval(intervalKey,function(){
            //如果不需要返回响应 则无需加回调函数  接收端同时也无需加return true
            bg.fn.sendMessageToContentScript({cmd:'refresh',message:'刷新页面'});
        },3000);
    }else{
        bg.fn.clearTimeInterval(intervalKey);
        $('#action-btn').text('开始刷新');
    }
});

//测试消息
$('#action-btn-2').click(function(){
    //如果需要返回响应则加回调函数 接收端必须加return true
    bg.fn.sendMessageToContentScript({cmd:'testMessage',message:'测试发消息'},function(res){
        console.log(res);
    });
});

$('#action-btn-3').click(function(){
    bg.fn.getConfigJsonData((data)=>{
        var text = JSON.stringify(data);
        download('config.json',text);
    });
});

//下载文件
function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
