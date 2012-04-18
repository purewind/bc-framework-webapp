/**
 * 附件上传
 * 
 * @author rongjihuang@gmail.com
 * @date 2011-06-01
 * @depend attach.css
 */
bc.file={
	uploadUrl: bc.root + "/uploadfile/?a=1",
	clearFileSelect:function($file){
		//清空file控件:file.outerHTML=file.outerHTML; 
		if($file.size())
			$file[0].outerHTML=$file[0].outerHTML;
	},
	/** 在线打开附件 */
	inline: function(attachEl,callback){
		//在新窗口中打开文件
		var url = bc.root + "/bc/file/inline?f=" + $(attachEl).attr("data-id");
		var to = $(attachEl).attr("data-to");
		if(to && to.length > 0)
			url += "&to=" + to;
		window.open(url, "_blank");
	},
	/** 下载附件 */
	download: function(attachEl,callback){
		window.open(bc.root + "/bc/attach/download?id=" + $(attachEl).attr("data-id"), "blank");
	},
	
    /**将字节单位的数值转换为较好看的文字*/
	getSizeInfo: function(size){
		if (size < 1024)
			return bc.formatNumber(size,"#.#") + "Bytes";
		else if (size < 1024 * 1024)
			return bc.formatNumber(size/1024,"#.#") + "KB";
		else
			return bc.formatNumber(size/1024/1024,"#.#") + "MB";
		
    },
    
	/**
	 * 基于html5的文件上传处理
	 * <p>函数上下文为附件控件的容器dom</p>
	 * @param {Array} files 要上传的文件列表
	 * @param {Object} option 配置参数
	 */
    upload: function(files,option){
		var $file = $(this);
	    //html5上传文件(不要批量异步上传，实测会乱，如Chrome后台合并为一个文件等，需逐个上传)
		//用户选择的文件(name、fileName、type、size、fileSize、lastModifiedDate)
	    var url = option.url || bc.file.uploadUrl;
	    if(option.subdir) url+="&subdir=" + option.subdir;
	    
	    //检测文件数量的限制
	    var maxCount = option.maxCount;
	    var curCount = parseInt(option.curCount);
	    if(isNaN(curCount)) curCount = 0;
	    logger.info("maxCount=" + maxCount + ",curCount=" + curCount);
	    if(!isNaN(maxCount) && files.length + curCount > maxCount){
	    	alert("上传附件总数已限制为最多" + maxCount + "个，已超出上限了！");
	    	bc.file.clearFileSelect($file);
	    	return;
	    }
	    
	    //检测文件大小的限制
	    var maxSize = parseInt(option.maxSize);
	    var curSize = parseInt(option.curSize);
	    if(isNaN(curSize)) curSize = 0;
	    logger.info("maxSize=" + maxSize + ",curSize=" + curSize);
	    if(!isNaN(maxSize)){
	    	var nowSize = curSize;
	    	for(var i=0;i<files.length;i++){
	    		nowSize += files[i].fileSize;
	    	}
    		if(nowSize > maxSize){
	    		alert("上传附件总容量已限制为最大" + bc.file.getSizeInfo(maxSize) + "，已超出上限了！");
		    	bc.file.clearFileSelect($file);
	    		return;
    		}
	    }
	    
	    //检测文件类型的限制
	    var _extensions = option.extensions;//用逗号连接的扩展名列表
	    var fileName;
	    if(_extensions && _extensions.length > 0){
	    	for(var i=0;i<files.length;i++){
	    		fileName = files[i].fileName || files[i].name;
	    		if(_extensions.indexOf(fileName.substr(fileName.lastIndexOf(".") + 1).toLowerCase()) == -1){
		    		alert("只能上传扩展名为\"" + _extensions.replace(/,/g,"、") + "\"的文件！");
			    	bc.file.clearFileSelect($file);
		    		return;
	    		}
	    	}
	    }
	    
	    //显示所有要上传的文件
	    var f;
	    var batchNo = "k" + new Date().getTime() + "-";//批号
	    for(var i=0;i<files.length;i++){
	    	f=files[i];
	    	var key = batchNo + i;
			//上传进度显示
			var fileName = f.fileName || f.name;
			bc.msg.slide("正在上传文件：" + fileName);
			
//			var extend = fileName.substr(fileName.lastIndexOf(".")+1).toLowerCase();
//			var attach = bc.attach.tabelTpl.format(f.fileSize,bc.attach.getSizeInfo(f.fileSize),extend,fileName);
//			$(attach).attr("data-xhr",key).insertAfter($file.find(".header")).find(".progressbar").progressbar();
	    }

	    //开始上传
	    var $newAttachs = $file.find(".attach[data-xhr]");//含有data-xhr属性的代表还没上传
	    var i = 0;
	    setTimeout(function(){
	    	uploadNext();
	    },500);//延时小许时间再上传，避免太快看不到效果
		
	    //逐一上传文件
		function uploadNext(){
	    	if(i >= files.length){
		    	bc.file.clearFileSelect($file);
		    	bc.msg.slide("文件上传完毕！");
	    		return;//全部上传完毕
	    	}
	    	
	    	var key = batchNo + i;
			logger.info("uploading:i=" + i);
			//继续上传下一个附件
			uploadOneFile(key,files[i],url,uploadNext);
		}
	   
		bc.file.xhrs=[];
		//上传一个文件
	    function uploadOneFile(key,f,url,callback){
	    	var xhr = new XMLHttpRequest();
	    	bc.file.xhrs[key] = xhr;
			if($.browser.safari){//Chrome12、Safari5
				xhr.upload.onprogress=function(e){
					if(option.infoField){
						var progressbarValue = Math.round((e.loaded / e.total) * 100);
						logger.info(i + ":upload.onprogress:" + progressbarValue + "%");
						$file.closest(".bc-page").find(option.infoField).val("(" + (i+1) + "/" + files.length + ") " + progressbarValue + "%");
					}
				};
			}else if($.browser.mozilla){//Firefox4
				xhr.onuploadprogress=function(e){
					if(option.infoField){
						var progressbarValue = Math.round((e.loaded / e.total) * 100);
						logger.info(i + ":upload.onprogress:" + progressbarValue + "%");
						option.infoField.val("(" + (i+1) + "/" + files.length + ") " + progressbarValue + "%");
					}
				};
			}
			
			//上传完毕的处理
			xhr.onreadystatechange=function(){
				if(xhr.readyState===4){
					bc.file.xhrs[key] = null;
					//累计上传的文件数
					i++;
					logger.info(i + ":" + xhr.responseText);
					var json = eval("(" + xhr.responseText + ")");
					
					//附件总数加一
					option.totalCount += 1;
					
					//附件总大小添加该附件的部分
					option.totalSize = (option.totalSize || 0) + f.fileSize;
					
					//删除进度条、显示附件操作按钮（延时1秒后执行）
					setTimeout(function(){
//						var tds = $progressbar.parent();
//						var $operations = tds.next();
//						tds.remove();
//						$operations.empty().append(bc.file.operationsTpl);
//						
//						$attach.attr("data-id",json.msg.id)
//							.attr("data-name",json.msg.localfile)
//							.attr("data-url",json.msg.url)
//							.removeAttr("data-xhr");
					},1000);
					
					//调用回调函数
					if(typeof option.callback == "string")
						option.callback = bc.getNested(option.callback);
					if(typeof option.callback == "function")
						option.callback.call($file,json);
				}
			};
			
			xhr.onabort=function(){
				logger.info("onabort:i=" + i);
			}
//			xhr.upload.onabort=function(){
//				logger.info("upload.onabort:i=" + i);
//			}

			xhr.open("POST", url);
			xhr.setRequestHeader('Content-Type', 'application/octet-stream');
			//对文件名进行URI编码避免后台中文乱码（后台需URI解码）
			xhr.setRequestHeader('Content-Disposition', 'attachment; name="filedata"; filename="'+encodeURIComponent(f.fileName || f.name)+'"');
			if($.browser == "mozilla" && $.browser.version < 5)//Firefox4
				xhr.sendAsBinary(f.getAsBinary());
			else //Chrome12+,Firefox5+
				xhr.send(f);
	    }
	}
};

(function($){

//初始化文件控件的选择事件;Chrome12、Safari5、Firefox4、Opera
if($.browser.safari || $.browser.mozilla || $.browser.opera){
	$(":file.auto.uploadFile").live("change",function(e){
		logger.info("localfile=" + this.value);
		bc.file.upload.call(this,e.target.files,$(this).data("cfg"));
	});
}

})(jQuery);