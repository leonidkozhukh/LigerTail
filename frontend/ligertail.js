
// !!! NOTE: switch the domain for development!
//var LTDOMAIN = 'http://ligertaildevelopmentbackend.appspot.com';
var LTDOMAIN = 'http://ligertailpayment.appspot.com';
var LTVISIBLEDOMAIN = 'http://www.ligertail.com';

var jqversion;

(function(window, document, version, callback) {
    var j, d;
    var loaded = false;
    if (!window.ligertail) {
    	window.ligertail = {};
    }
    if (window.ligertail.domain) {
    	LTDOMAIN = window.ligertail.domain;
    	LTVISIBLEDOMAIN = window.ligertail.visibleDomain ? window.ligertail.visibleDomain : window.ligertail.domain;
    } else {
    	window.ligertail.domain = LTDOMAIN;
    	window.ligertail.visibleDomain = LTVISIBLEDOMAIN;
    }
    
    if (!(j = window.jQuery) || version > j.fn.jquery || callback(j, loaded)) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "//ajax.googleapis.com/ajax/libs/jquery/1.5/jquery.min.js"; //LTDOMAIN + "/js/jquery.min.js";
        script.onload = script.onreadystatechange = function() {
            if (!loaded && (!(d = this.readyState) || d == "loaded" || d == "complete")) {
                callback((j = window.jQuery).noConflict(1), loaded = true);
                j(script).remove();
            }
        };
        document.documentElement.childNodes[0].appendChild(script)
    }
})(window, document, "1.5", function(jq15, jquery_loaded) {

jqversion = jq15;

function loadScripts(scripts, scriptFunctions) {
	numScripts = scripts.length;
	for (var i = 0, script; script = scripts[i]; i++) {
		loadScript(script, function() {
			numScripts -= 1;
			if (numScripts == 0) {
				tryToInit(scriptFunctions);
			}
		});
	}
}	

function loadScript(sScriptSrc, oCallback) {
    var children = document.documentElement.childNodes;
    for (var i = 0; i < children.length; i++) {
       if (children[i].tagName == 'HEAD') {
          var oHead =children[i];
          var oScript = document.createElement('script');
          oScript.type = 'text/javascript';
          oScript.src = sScriptSrc;
          // most browsers
         oScript.onload = oCallback;
         // IE 6 & 7
         oScript.onreadystatechange = function() {
            if (this.readyState == 'complete' || this.readyState == 'loaded') {
               oCallback();
            }
         }
         oHead.appendChild(oScript);
         return;
      }
   }
}   	

		
	
var initialized = false;

loadScripts(["//ajax.googleapis.com/ajax/libs/jquery/1.5/jquery.min.js", //LTDOMAIN + "/js/jquery.min.js",
			 LTDOMAIN + "/js/easyxdm.min.js",
             LTDOMAIN + "/js/json2.js",
			 LTDOMAIN + "/js/postrequest.js", 
             LTDOMAIN + "/js/apiproxy.js",
             LTDOMAIN + "/frontend/apihandler.js"],
			["postrequest_loaded",
			 "json2_loaded",
			 "easyxdm_loaded",
			 "apiproxy_loaded",
			 "apihandler_loaded"]);

loadStaticFile(LTDOMAIN + "/frontend/css/widget_1.css", "css");

//    $(document).ready(function(){
//        tryToInit();                  
//     });

 });    
    //LOAD PUBLISHER-SET PARAMETERS


function loadStaticFile(filename, filetype){
    if (filetype == "css"){ //if filename is an external CSS file
        var fileref = document.createElement("link");
         fileref.setAttribute("rel", "stylesheet");
         fileref.setAttribute("type", "text/css");
         fileref.setAttribute("href", filename);
    }

    if (typeof fileref != "undefined")
         document.getElementsByTagName("head")[0].appendChild(fileref);
}


function SetupParameters(){
    ///////////////////////////////
    var file_name = "ligertail.js";
    ///////////////////////////////
        scripts = document.getElementsByTagName("script"); 
        var i, j, src, parts, basePath, options = {};
        LTnode = document.createElement("div");
        LTnode.setAttribute("class", "ligertail_widget");
        LTnode.setAttribute("style","float:none!important");
        
    for (i = 0; i < scripts.length; i++) { 
          src = scripts[i].src;
         if (src.indexOf(file_name) != -1) {
               //create ligertail container <div>               
               scripts[i].parentNode.insertBefore(LTnode,scripts[i]);
               
               //parse parameters                             
               parts = src.split('?'); 
                basePath = parts[0].replace(file_name, '');
                if (parts[1]) {
                      var opt = parts[1].split('&');
                      for (j = opt.length-1; j >= 0; --j) {
                        var pair = opt[j].split('=');
                        options[pair[0]] = pair[1];
                      }
                }
               return options;
          }
    }
}

//URL VALIDATION FUNCTION

function ValidateURL(str){
	var re = new RegExp(/^((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))$/);
    if(re.test(str)){ 
        return str; 
    }else{ 
        return false; 
    }
}


//EMAIL VALIDATION FUNCTION

function ValidateEmail(str) {
    var reg = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    if(reg.test(str) == false) {
        return false;
    }
    else return str;  
}

// REPLACE HTML ENCODED TO CHARS
function dehtml(str) { 
	  return str.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">");
}

///////////////////////////////////////////////////// 
//LOAD SUBMISSION LIGHTBOX

function Submission(url){

		if(ValidateURL(url)){	
				var item = {}; 
                item.publisherUrl = window.PUBLISHER_URL;
                item.url = url;                 
                item.email = 'imgur@ligertail.com';

				jqversion.ajax({
                       type: "GET",
                       url: "https://pro.embed.ly/1/oembed?callback=?&format=json&key=863cd350298b11e091d0404058088959&url=" + url,
                       dataType: "json",
                       timeout: 5000,
                       success: function(data){
                                item.title = dehtml(data.title).substr(0,128);
               					if(data.description)
               						item.description = dehtml(data.description).substr(0,512);
               					else
               						item.description = "none found.";
               					api.submitItem(item);            
                       },
                       error: function(e){ 
                       		   item.title = "freshest link";
               				   item.description = "defaulting here.";
                       		   api.submitItem(item); 
                       		  }        
                  });
                
                 jqversion("#ligertail_widget_header input").val("Got a link to add here?");
                               
         }
         else
         	jqversion("#ligertail_widget_header input").val("Invalid URL. Please, try again...");
	
}

//////////////////////////////////////////////////////////

function init(publisherUrl) {
  if (initialized) {
    return;
  }
  
  var initialized = true;
  var apiHandler = new ApiHandler(LTDOMAIN, jqversion);
  window.api = new LTApi();
  api.init(apiHandler, LTDOMAIN);
  window.publisherUrl = publisherUrl;
}

function initAll(){
    var CONTENT_HEIGHT_SMALL = 23; //header=39 footer=20
    var CONTENT_HEIGHT_LARGE = 91;//header=49 footer=35
    
    window.PUBLISHER_URL = window.location.href;
    	
    window.LIGERTAIL_ITEMS_LOADED = 0; //helps keep track of spot #s, can be used later for loading additional items
    
    //initialize widget parameters
    window.parameter = SetupParameters();
    //console.log(window.parameter);
    
    //adjust size
        //width
    if(window.parameter["width"]){
        if(window.parameter["width"] <= 300){ 
        	jqversion(".ligertail_widget").attr("id", "ligertail_widget_small");
            window.parameter["width"] = 300;     
        }
        else if(window.parameter["width"] > 300 && window.parameter["width"] < 600){ 
        	jqversion(".ligertail_widget").attr("id", "ligertail_widget_large");                                                                        
            window.parameter["width"] = 600; 
        }
        else if(window.parameter["width"] >= 600){ 
        	jqversion(".ligertail_widget").attr("id", "ligertail_widget_large");
            window.parameter["width"] = 600; 
        }
        else{ 
        	jqversion(".ligertail_widget").attr("id", "ligertail_widget_small");
            window.parameter["width"] = 300; 
        }
    }
    else{ 
    	jqversion(".ligertail_widget").attr("id", "ligertail_widget_small");
        window.parameter["width"] = 300; 
    }
        
        //height
    if(window.parameter["height"]){
        if(window.parameter["width"] == 300 && window.parameter["height"] > 0){
            window.parameter["height"] = window.parameter["height"] - ((window.parameter["height"] - 58) % CONTENT_HEIGHT_SMALL);
            window.numItems = Math.floor((window.parameter["height"] - 58) / CONTENT_HEIGHT_SMALL);
        }
        else if(window.parameter["width"] == 600 && window.parameter["height"] > 0){
            window.parameter["height"] = window.parameter["height"] - ((window.parameter["height"] - 84) % CONTENT_HEIGHT_LARGE);
            window.numItems = Math.floor((window.parameter["height"] - 84) / CONTENT_HEIGHT_LARGE);
        }
    }
    else{
         if(window.parameter["width"] == 300){
            window.parameter["height"] = 250;
            window.numItems = Math.floor((window.parameter["height"] - 58) / CONTENT_HEIGHT_SMALL);
        }
        else if(window.parameter["width"] == 600){
            window.parameter["height"] = 539;
            window.numItems = Math.floor((window.parameter["height"] - 84)/ CONTENT_HEIGHT_LARGE);
        }
    }

    //initialize communication with ligertail
    init(window.PUBLISHER_URL);
    
    //load header, footer, and default content then bind events
    //this should be a switch statement
    if(window.parameter["width"] == 600){
        var header = '<div id="ligertail_widget_header"><form><input type="text" class="ligertail_widget_form" value="Got a link to add here?" /><input type="image" src="' + LTDOMAIN + '/frontend/images/button_submit_1.png" value="Submit" /></form></div>';
        var footer = '<div id="ligertail_widget_footer"><img src="' + LTDOMAIN + '/frontend/images/logo_footer.png" width="116" height="35" alt="Logo" /></div>';
        var content = '';
    }
    else{
        var header = '<div id="ligertail_widget_header"><form><img src="' + LTDOMAIN + '/frontend/images/logo_header.png" width="70" height="39" alt="Ligertail" align="left" title="Visit LigerTail.com"/><input type="text" class="ligertail_widget_form" value="Got a link to add here?" /><input type="image" src="' + LTDOMAIN + '/frontend/images/button_submit_4.png" value="Submit" align="left"/></form></div>';
        var footer = '<div id="ligertail_widget_footer"></div>';
        var content = '';
    }
    
    for(var j = 1; j <= window.numItems; j++){
        if(window.parameter["width"] == 600){
            content += '<div class="ligertail_widget_content" id="-' + j + '"><div class="ligertail_widget_blank"></div><div class="ligertail_widget_image"><img src="' + LTDOMAIN + '/frontend/images/default.png" alt="Image" width="105" height="65" border="0" /></a></div><div class="ligertail_widget_text"><div class="ligertail_widget_top_text"><span class="ligertail_widget_source">LigerTail</span><span class="ligertail_widget_title">Submit your content in the input box above!</span></div><p class="ligertail_widget_description">Display your content here to get recognized!!!</p></div></div>';
        }
        else{
        	content += '<div class="ligertail_widget_content" id="-' + j + '"><div class="ligertail_widget_text"><span class="ligertail_widget_source">LigerTail</span><span class="ligertail_widget_title">Your link could be here. Enter it above.</span></div></div>';
        }
    }
  
  var wrapper = "";
    if(window.parameter["width"] == 600){
        wrapper = '<div style="position:absolute!important;background:none!important;border:none!important;margin:0!important;padding:0!important;line-height:1em!important;font-size:100%!important;width:600px!important;">';
    }
    else{
        wrapper = '<div style="position:absolute!important;background:none!important;border:none!important;margin:0!important;padding:0!important;line-height:1em!important;font-size:100%!important;width:300px!important;">';
    }
    
    jqversion(".ligertail_widget").append(wrapper + header + content + footer + '</div>');
    jqversion(".ligertail_widget .ligertail_widget_content").show();
   
    //events...
    //clicking on header logo
    if(window.parameter["width"] == 600)
    	jqversion("#ligertail_widget_footer img:first").click(function(){ window.open(LTVISIBLEDOMAIN); });                                
    else
    	jqversion("#ligertail_widget_header img:first").click(function(){ window.open(LTVISIBLEDOMAIN); });
    
    //input box hover
    jqversion("#ligertail_widget_header input").hover(function(){ 
        if(jqversion(this).val() == "Got a link to add here?")
        	jqversion(this).val("").select();
        else
        	jqversion(this).select();
    }, 
    function(){
        if(jqversion(this).val() == "")
        	jqversion(this).val("Got a link to add here?").blur();
        else
        	jqversion(this).blur();
    });
    
    //submit in lightbox
    jqversion("#ligertail_widget_header form").submit(function(event){ 
        event.preventDefault();
        var url = jqversion(this).find("input:first").val();
        Submission(url);
    });
    
    //load content and bind events
    api.getOrderedItems(window.PUBLISHER_URL);                
                   
                   
}

var LT_MAX_NUM_TRIES = 10;
function tryToInit(scriptFunctions, numtries) {
	if (numtries == undefined) {
		numtries = 0;
	}
	if (numtries == LT_MAX_NUM_TRIES) {
		return; // FAILED
	}
	for (var i = 0, f; f = scriptFunctions[i]; i++) {
		if (!(typeof(eval(f)) === 'function')) {
			setTimeout(function () {
				tryToInit(scriptFunctions, numtries + 1);
				}, 50 * numtries);
			return;
		} 
	}
    initAll();
}

