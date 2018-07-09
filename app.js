// @app

var $app ={};

$app.setActions = function(el, m){ 
	var q =el.querySelectorAll("[data-cmd]");
	for(var i=0; i<q.length; i++){
		
		var tg = q[i].tagName.toLowerCase(),
			evFn = m[q[i].getAttribute("data-cmd")];
		
		switch(tg){
			case "input":
				if(q[i].getAttribute("type")=="text"){
					q[i].addEventListener("keyup", evFn, false);
					q[i].addEventListener("paste", evFn, false);
				}
			break;
			default:
				q[i].addEventListener("click", evFn, false);
		}
	}
};

$app.setDocumentActions = function(m){ 
	document.addEventListener("click",function(e){ 
		if(e.target.hasAttribute("data-cmd")){
			var fn = e.target.getAttribute("data-cmd");
			if(fn in m){
				m[fn](e.target);
			}
		}
	}, false);
};

$app.upload = function(url, files, data){ 
	var formData = new FormData();
	formData.append('data', JSON.stringify(data));
	formData.append('count', files.length);
	for (var i = 0; i < files.length; i++) {
		formData.append('file_'+i, files[i]);
	}
	
	return fetch(url, {
		method: 'POST',
		body: formData
	});
};

$app.login = function(){ 
	var uuid = localStorage.getItem("KSdev_LOGIN_UUID"),
		user = localStorage.getItem("KSdev_LOGIN_USER");
	if(uuid && uuid!=""){
		return {
			uuid : uuid,
			name : user
		};
	}
	else{
		window.location.replace("http://alpha60.net/apps/login/#dest="+window.location.href);
	}
	
};

// @dom

var $dom = {};

$dom.importTemplate = function(sourceTpl, data, dest){ 
	
	var tpl = sourceTpl;

	var getKey = function(obj){ 
		var ok=Object.keys(obj);
		var key="";
		for(var i=0; i<ok.length; i++){
			if(ok[i]!="q"){
				return ok[i];
			}
		}
		return key;
	};
	
	for(var i=0; i<data.length; i++){
		var k = getKey(data[i]);
		tpl.content.querySelector(data[i].q)[k] = data[i][k];
	}
	
	var tplClone = document.importNode(tpl.content, true);	
	if(dest){
		dest.appendChild(tplClone);
	}

	return tplClone;
};

$dom.destroy = function(el){ if(el) { var x=el.parentElement.removeChild(el); x=null; } };

// @ui

var $ui = {};

$ui.setMsg = function(el){ 
	var q = el.querySelectorAll("[data-msg]");
	for(var i=0; i<q.length; i++){
		q[i].textContent = $app.msg[q[i].getAttribute("data-msg")];
	}
	q = el.querySelectorAll("[data-placeholder]");
	for(var i=0; i<q.length; i++){
		q[i].setAttribute("placeholder", $app.msg[q[i].getAttribute("data-placeholder")]);
	}
};

$ui.fields = function(method, container, obj){ 
	var q=container.querySelectorAll("[data-field]");

	for(var i=0; i<q.length; i++){
		var f = q[i].getAttribute("data-field"),
			tg = q[i].tagName.toLowerCase();

		switch(tg){
			case "input":
			case "textarea":
				if(method.toLowerCase()=="set"){
					q[i].value = (f in obj) ? obj[f] : "";
				}
				else {
					obj[f] = q[i].value;
				}
			break;
			default:
				if(method.toLowerCase()=="set"){
					q[i].textContent = (f in obj) ? obj[f] : "";
				}
				else{
					obj[f] = q[i].textContent;
				}
		}
	}
};

$ui.makeDraggable = function(cfg){ 

	var	stx = 0, sty = 0,
		elx = 0, ely = 0,
		dragElement = null;
	
	function dragStart(e){

		dragElement = null;
		
		if(e.target.classList.contains("draggable")){
			dragElement = e.target;
			elx = e.pageX;
			ely = e.pageY;
			stx = elx - e.target.offsetLeft;
			sty = ely - e.target.offsetTop;
		}
		return true;
	}
	
	function dragMove(e){
		elx = e.pageX;
		ely = e.pageY;
		
		if(dragElement){
			dragElement.style.left = (elx - stx) + 'px';
			dragElement.style.top = (ely - sty) + 'px';
		}
		return true;
	}
	
	function dragEnd(e){
		if(dragElement){
			cfg.afterDrag(dragElement, e);
		}	
		dragElement = false;
		return true;
	}
	
	document.onmousedown = dragStart;
	document.onmousemove = dragMove;
	document.onmouseup = dragEnd;
		
};

$ui.dropBox = function(cfg){ 
	
	var b = document.body;
	function stopEvent(e){ 
		e.stopPropagation();	
		e.preventDefault();
	};
	
	b.ondragenter = stopEvent;
	b.ondragover = stopEvent;
	b.ondrop = stopEvent;
	
	function dragenter(e) {
		e.stopPropagation();
		e.preventDefault();
		cfg.target.classList.add("acceptDrop");
	}

	function dragover(e) {
		e.stopPropagation();
		e.preventDefault();
	}
	
	function cancelDrop(e){  
		e.stopPropagation();
		e.preventDefault();
		cfg.target.classList.remove("acceptDrop");
	}
	
	function drop(e) {
		e.stopPropagation();
		e.preventDefault();
		var dt = e.dataTransfer;
		var files = dt.files;
		cfg.target.classList.remove("acceptDrop");
		cfg.handleFiles(files, e);
	}
	
	cfg.target.addEventListener("dragenter", dragenter, false);
	cfg.target.addEventListener("dragover", dragover, false);
	cfg.target.addEventListener("drop", drop, false);
	cfg.target.addEventListener("dragleave", cancelDrop, false);

};


$ui.ImageList = function(cfg){ 
	this.cfg = cfg;
	this.loadCount = 0;
	this.images = [];
	return this.load();
};

$ui.ImageList.prototype.load = function(){ 
	var me = this;
	
	return new Promise((resolve, reject)=>{
			
		var basePath = this.cfg.basePath || "";
		
		for(var i=0; i<me.cfg.files.length; i++){
			var img = new Image();
			img.onload=function(){  
				me.loadCount++;
				if(me.loadCount == me.cfg.files.length){
					resolve(me.images);
				}
			};
			img.src = basePath+me.cfg.files[i];
			me.images.push(img);
		}
		
	});
};

$ui.center = function(elToCenter, elContainer){ 
	var rtc = elToCenter.getBoundingClientRect(),
		rco = elContainer.getBoundingClientRect();
	
	var x = (rco.width - rtc.width ) / 2  + rco.left,
		y = (rco.height - rtc.height) / 2 + rco.top;
	
	return {x:x, y:y};
};

$ui.DropDown = function(cfg){ 

	var d = document.createElement("div");
	d.className = "DropDown";
	if("id" in cfg){
		d.id = cfg.id;
	}
	
	var lbl = document.createElement("div");
	lbl.className = "DropDownLabel";
	d.appendChild(lbl);
	
	var arr = document.createElement("div");
	arr.className = "DropDownArrow";
	d.appendChild(arr);
	
	var start = 0;
	for(var i=0; i<cfg.items.length; i++){
		if("start" in cfg.items[i]){
			start = i;
		}
	}
	d.setAttribute("data-value", cfg.items[start].value);	 
	lbl.textContent = cfg.items[start].text;
	
	var makeList = function(cx){ 
		
		if(cx.querySelector(".DropDownList")){
			$dom.destroy(cx.querySelector(".DropDownList"));
			return false;
		}
		
		var f = document.createDocumentFragment();
		
		var ul = document.createElement("ul");
		ul.className = "DropDownList";
	
		for(var i=0; i<cfg.items.length; i++){
			var li = document.createElement("li");
			li.textContent = cfg.items[i].text;
			li.setAttribute("data-value", cfg.items[i].value);
			f.appendChild(li);
		}
		ul.appendChild(f);
		
		cx.appendChild(ul);
		ul.addEventListener("click",function(e){ 
			if(e.target.tagName.toLowerCase()=="li"){
				var tv = e.target.getAttribute("data-value");
				cx.setAttribute("data-value", tv);	 
				cx.querySelector(".DropDownLabel").textContent = e.target.textContent;
				$dom.destroy(cx.querySelector(".DropDownList"));
				cfg.onSelect(e.target.textContent, tv);
			}
		}, false);
	};

	lbl.addEventListener("click", function(){ makeList(d); }, false);
	arr.addEventListener("click", function(){ makeList(d); }, false);
	
	cfg.parent.appendChild(d);
	
};


$ui.CheckBox = function(cfg){ 
	var c = document.createElement("div");
	c.className = "CheckBox";
	c.setAttribute("data-checked", cfg.checked);
	c.textContent = cfg.text;
	c.addEventListener("click",function(e){ 
		let v = (e.target.getAttribute("data-checked") == "true") ? "false" : "true";
		e.target.setAttribute("data-checked", v);
	}, false);
	
	cfg.parent.appendChild(c);
};

$ui.keyboard = function(cfg){
	
	var speed = 40,
	    timers = {},
	    isKeyDown = {};
	
	if("speed" in cfg){
		speed = parseInt(cfg.speed);
	}
	
	var clear = function(k){ 
		clearTimeout(timers[k]);
		isKeyDown[k]=false;
	};
	
	var keyPressed = function(k){ 
		timers[k]=setTimeout(keyPressed, speed, k);
		if(k in cfg.keyEvents){
			cfg.keyEvents[k]();
		}
	};
	
	document.addEventListener("keydown",function(e){ 
		if(!isKeyDown[e.key]){
			isKeyDown[e.key]=true;
			keyPressed(e.key);
			console.info(timers, isKeyDown);
		}
	}, false);
	
	document.addEventListener("keyup",function(e){ 
		if(isKeyDown[e.key]){
			clear(e.key);
		}
	},false);
		
};

// @util

var $util = {};

$util.uuid=function(hyphens,upper){
    var randInt, hex;
    randInt = function(){return Math.floor(0x100000000 * Math.random());}
    return (function(w1, w2, w3, w4, version){
      var uuid, data, hex;
      hex = '0123456789abcdef';
	  if(upper){
		  hex=hex.toUpperCase();
	  }
      uuid = new Array(36);
      data = [
       (w1 & 0xFFFFFFFF),
       (w2 & 0xFFFF0FFF) | ((version || 4) << 12), // version (1-5)
       (w3 & 0x3FFFFFFF) | 0x80000000,    // rfc 4122 variant
       (w4 & 0xFFFFFFFF)
      ];
      for (var i = 0, k = 0; i < 4; i++){
       var rnd = data[i];
       for (var j = 0; j < 8; j++)
       {
        
		if(hyphens){
			if (k == 8 || k == 13 || k == 18 || k == 23) {
				uuid[k++] = '-'; 
			}
		}
        
        var r = (rnd >>> 28) & 0xf;
        rnd = (rnd & 0x0FFFFFFF) << 4;
        uuid[k++] = hex.charAt(r);
       }
      }
      return uuid.join('');
    })(randInt(),randInt(),randInt(),randInt(),4);
};


$util.viewport = function(){ 
	var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	return {width: w, height: h};
};

$util.timestampStr=function(){ 
	var d=new Date();
	return d.getFullYear()+"-"+$util.pad0(d.getMonth()+1)+"-"+$util.pad0(d.getDate())+"-"+$util.pad0(d.getHours())+"-"+$util.pad0(d.getMinutes())+"-"+$util.pad0(d.getSeconds());
};

$util.rand=function(upperbound, lowerbound) {
    return parseInt((upperbound - lowerbound+1) * Math.random( ) + lowerbound);
};

$util.pad0 = function(str = "", maxLength = 2, padChar = "0"){ 
	var xStr = str.toString();
	if(xStr.length < maxLength){
		var padding = new Array(maxLength - xStr.length+1).join(padChar);
		xStr = padding + xStr;
	};
	return xStr;
};

$util.getMousePos = function(el, evt){
    var r = el.getBoundingClientRect();
	return {
	  x: evt.clientX - r.left,
	  y: evt.clientY - r.top
	};
};

$util.dbDate = function(plusOne=0, d=new Date()){ 
	var monthIndex = d.getMonth()+plusOne;
	return d.getFullYear()+"-"+$util.pad0(monthIndex)+"-"+$util.pad0(d.getDate());
};
