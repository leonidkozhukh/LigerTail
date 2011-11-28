
// !!! NOTE: switch the domain for development!
//var LTDOMAIN = 'http://ligertaildevelopmentbackend.appspot.com';
var LTDOMAIN = 'http://ligertailbackend.appspot.com';
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
             LTDOMAIN + "/frontend/apihandler.js",
             LTDOMAIN + "/frontend/facebox/facebox.js"],
			["postrequest_loaded",
			 "json2_loaded",
			 "easyxdm_loaded",
			 "apiproxy_loaded",
			 "apihandler_loaded"]);

loadStaticFile(LTDOMAIN + "/frontend/facebox/facebox.css", "css");
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
        LTnode.setAttribute("style","width:300px!important;height:250px!important;float:none!important");
        
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

function OpenLightboxSubmission(url){
    jqversion(document).bind('init.facebox', function(){
        if(window.parameter["width"] == 600)                                            
             loadStaticFile(LTDOMAIN + "/frontend/css/submission_large.css", "css");  
        else
             loadStaticFile(LTDOMAIN + "/frontend/css/submission.css", "css");
    });
        
    jqversion.facebox(function(){     
        
        if(window.parameter["width"] == 600)
            openFacebox(LTDOMAIN, "submission_large.html");
        else
            openFacebox(LTDOMAIN, "submission.html");
        
        //make sure lightbox form loads before embed.ly is called        
        jqversion(document).bind('reveal.facebox', function(event){
             //correct the domain                                               
            jqversion("#ligertail_submission_lightbox_form ligertail_submission_lightbox_button_pay").attr("src", LTDOMAIN + "/frontend/images/button_pay.png");
            jqversion("#ligertail_submission_lightbox_form ligertail_submission_lightbox_button_free").attr("src", LTDOMAIN + "/frontend/images/button_free.png");
            if(window.parameter["width"] == 600){                                             
                 jqversion("#ligertail_submission_lightbox_right_column #ligertail_widget_footer img").attr("src", LTDOMAIN + "/frontend/images/logo_footer.png");
                 jqversion("#ligertail_submission_lightbox_right_column #ligertail_widget_header input:last").attr("src", LTDOMAIN + "/frontend/images/button_submit_1.png");
            }
            else{
                 jqversion("#ligertail_submission_lightbox_right_column #ligertail_widget_header img").attr("src", LTDOMAIN + "/frontend/images/logo_header.png");
                 jqversion("#ligertail_submission_lightbox_right_column #ligertail_widget_header input:last").attr("src", LTDOMAIN + "/frontend/images/button_submit_2.png");
            }
        
            //form validation
            jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_url").blur(function(){ 
                jqversion(this).val(jqversion.trim(jqversion(this).val()));                                                                                           
                if(!ValidateURL(jqversion(this).val()))
                    jqversion("#ligertail_submission_lightbox_form tr:first").css("color", "red").find("th:last").html("URL invalid.");
                else{
                    jqversion("#ligertail_submission_lightbox_right_column .ligertail_widget_content:first .ligertail_widget_source").html(getDomain(jQuery(this).val()));
                    if(jqversion("#ligertail_submission_lightbox_form tr:first").css("color") == "rgb(255, 0, 0)")
                    jqversion("#ligertail_submission_lightbox_form tr:first").css("color", "black").find("th:last").html("URL");
                }
            });
            
            jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_title").blur(function(){
                jqversion(this).val(jqversion.trim(jqversion(this).val()));          
                if(jqversion(this).val().length < 3 || jqversion(this).val().length > 128)
                    jqversion("#ligertail_submission_lightbox_form tr:nth-child(3)").css("color", "red").find("th:last").html("Title needs to be btwn 3 & 128 chars.");
                else{
                    jqversion("#ligertail_submission_lightbox_right_column .ligertail_widget_content:first .ligertail_widget_title").html(jqversion(this).val());
                    if(jqversion("#ligertail_submission_lightbox_form tr:nth-child(3)").css("color") == "rgb(255, 0, 0)")
                        jqversion("#ligertail_submission_lightbox_form tr:nth-child(3)").css("color", "black").find("th:last").html("Title");
                }
            });

            jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_description").blur(function(){
                jqversion(this).val(jqversion.trim(jqversion(this).val()));                                                                                                               
                if(jqversion(this).val().length > 512 || jqversion(this).val().length < 3)
                    jqversion("#ligertail_submission_lightbox_form tr:nth-child(5)").css("color", "red").find("th:last").html("Description needs to be btwn 3 & 512 chars.");
                else{
                    jqversion("#ligertail_submission_lightbox_right_column .ligertail_widget_content:first .ligertail_widget_description").html(jqversion(this).val()); 
                    if(jqversion("#ligertail_submission_lightbox_form tr:nth-child(5)").css("color") == "rgb(255, 0, 0)")
                        jqversion("#ligertail_submission_lightbox_form tr:nth-child(5)").css("color", "black").find("th:last").html("Description");
                }
            });
            
            jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_email").blur(function(){
                jqversion(this).val(jqversion.trim(jqversion(this).val()));                                                                                                         
                if(!ValidateEmail(jqversion(this).val()))
                    jqversion("#ligertail_submission_lightbox_form tr:nth-child(7)").css("color", "red").find("th:last").html("Email invalid.");
                else if(jqversion("#ligertail_submission_lightbox_form tr:nth-child(7)").css("color") == "rgb(255, 0, 0)")
                    jqversion("#ligertail_submission_lightbox_form tr:nth-child(7)").css("color", "black").find("th:last").html("Email");
            });
                                                                 
            url = jqversion.trim(url);
            if(ValidateURL(url)){
                // disable form & call embedly
               jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_url").val(url);
               jqversion("#ligertail_submission_lightbox_form input").attr("disabled", "disabled");
                
                jqversion.ajax({
                       type: "GET",
                       url: "https://pro.embed.ly/1/oembed?callback=?&format=json&key=863cd350298b11e091d0404058088959&url=" + url,
                       dataType: "json",
                       timeout: 2000,
                       success: function(data){
                                    //enable form input
                                    jqversion("#ligertail_submission_lightbox_form input").removeAttr("disabled"); 
                                              
                                    jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_title").val(data.title);    
                                    jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_description").val(data.description);
                                    jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_thumbnail").val(data.thumbnail_url); 
                
                                    jqversion("#ligertail_submission_lightbox_right_column .ligertail_widget_content:first .ligertail_widget_source").html(getDomain(url));
                                    jqversion("#ligertail_submission_lightbox_right_column .ligertail_widget_content:first .ligertail_widget_title").html(data.title);
                                    if(window.parameter["width"] == 600){
                                            jqversion("#ligertail_submission_lightbox_right_column .ligertail_widget_content:first .ligertail_widget_description").html(data.description);
                                            jqversion("#ligertail_submission_lightbox_right_column .ligertail_widget_content:first .ligertail_widget_image img").attr('src', data.thumbnail_url);
                                    }  
                                    
                                    jqversion("#ligertail_submission_lightbox_form input").trigger("blur");       
                       },
                       error: function(e){ jqversion("#ligertail_submission_lightbox_form input").removeAttr("disabled"); }        
                });
            }
            else{ jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_url").val("http://"); }                                               
            
            //submission handling     
            jqversion("#ligertail_submission_lightbox_form").submit(function(event){
                event.preventDefault();
                
                var item = {}; 
                item.publisherUrl = window.PUBLISHER_URL;
                item.url = jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_url").val(); 
                item.title = dehtml(jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_title").val());
                item.description = dehtml(jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_description").val());
                item.email = jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_email").val();

                //if url same as original, use embedly img
                if(item.url == url && jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_thumbnail").val() != "")
                    item.thumbnailUrl = jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_thumbnail").val();
                else
                    item.thumbnailUrl = LTDOMAIN + "/frontend/images/default.png";

                if(ValidateURL(item.url) && 
                    (item.title.length > 3 && item.title.length <= 128) && 
                    item.description.length >= 3 && item.description.length < 512 &&
                    ValidateEmail(item.email)){                   
                        api.submitItem(item);                        
                        jqversion(document).trigger('close.facebox');                     
                }
                else{
                        jqversion("#ligertail_submission_lightbox_form input").trigger("blur");
                }
            });
            
            jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_button_free").click(function(event){
                event.preventDefault();
                window.submitForFree = true;                                                                                                  
                jqversion("#ligertail_submission_lightbox_form").submit(); 
                
            });
            
            jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_button_pay").click(function(event){ 
                event.preventDefault();
                window.submitForFree = false;               
                jqversion("#ligertail_submission_lightbox_form").submit();
            });
            
        });  
        
        jqversion(document).bind('close.facebox', function(){
            jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_title").val("");    
            jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_description").val("");
            jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_url").val("");
            jqversion("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_thumbnail").val("");                                              
            jqversion("#ligertail_submission_lightbox_right_column .ligertail_widget_content:first .ligertail_widget_source").html("ligertail.com");
            jqversion("#ligertail_submission_lightbox_right_column .ligertail_widget_content:first .ligertail_widget_title").html("submit your link above!");
            if(window.parameter["width"] == 600){
                jqversion("#ligertail_submission_lightbox_right_column .ligertail_widget_content:first .ligertail_widget_description").html("Display your content here to get recognized!!!");
                jqversion("#ligertail_submission_lightbox_right_column .ligertail_widget_content:first .ligertail_widget_image img").attr('src', LTDOMAIN + '/frontend/images/default.png');
            }
            jqversion("#ligertail_submission_lightbox_form tr").css("color", "black");
            jqversion("#ligertail_widget_header input").val("Submit Your Link Here");
            
            jqversion(document).unbind('reveal.facebox');
        });      
    });
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
    window.PUBLISHER_URL = location.href;
    window.LIGERTAIL_ITEMS_LOADED = 0; //helps keep track of spot #s, can be used later for loading additional items
    
    //initialize widget parameters
    window.parameter = SetupParameters();
    //console.log(window.parameter);
    
    //adjust size
        //width
    if(window.parameter["width"]){
        if(window.parameter["width"] <= 300){ 
            $(".ligertail_widget").attr("id", "ligertail_widget_small");
            window.parameter["width"] = 300;     
        }
        else if(window.parameter["width"] > 300 && window.parameter["width"] < 600){ 
            $(".ligertail_widget").attr("id", "ligertail_widget_large");                                                                        
            window.parameter["width"] = 600; 
        }
        else if(window.parameter["width"] >= 600){ 
            $(".ligertail_widget").attr("id", "ligertail_widget_large");
            window.parameter["width"] = 600; 
        }
        else{ 
             $(".ligertail_widget").attr("id", "ligertail_widget_small");
             window.parameter["width"] = 300; 
        }
    }
    else{ 
         $(".ligertail_widget").attr("id", "ligertail_widget_small");
         window.parameter["width"] = 300; 
    }
        
        //height
    if(window.parameter["height"]){
        if(window.parameter["width"] == 300 && window.parameter["height"] > 0){
            window.parameter["height"] = window.parameter["height"] - ((window.parameter["height"] - 59) % CONTENT_HEIGHT_SMALL);
            window.numItems = Math.floor((window.parameter["height"] - 59) / CONTENT_HEIGHT_SMALL);
        }
        else if(window.parameter["width"] == 600 && window.parameter["height"] > 0){
            window.parameter["height"] = window.parameter["height"] - ((window.parameter["height"] - 84) % CONTENT_HEIGHT_LARGE);
            window.numItems = Math.floor((window.parameter["height"] - 84) / CONTENT_HEIGHT_LARGE);
        }
    }
    else{
         if(window.parameter["width"] == 300){
            window.parameter["height"] = 250;
            window.numItems = Math.floor((window.parameter["height"] - 59) / CONTENT_HEIGHT_SMALL);
        }
        else if(window.parameter["width"] == 600){
            window.parameter["height"] = 450;
            window.numItems = Math.floor((window.parameter["height"] - 84)/ CONTENT_HEIGHT_LARGE);
        }
    }

    //initialize communication with ligertail
    init(window.PUBLISHER_URL);
    
    //load header, footer, and default content then bind events
    //this should be a switch statement
    if(window.parameter["width"] == 600){
        var header = '<div id="ligertail_widget_header"><form><input type="text" class="ligertail_widget_form" value="Submit Your Link Here" /><input type="image" src="' + LTDOMAIN + '/frontend/images/button_submit_1.png" value="Submit" /></form></div>';
        var footer = '<div id="ligertail_widget_footer"><img src="' + LTDOMAIN + '/frontend/images/logo_footer.png" width="116" height="35" alt="Logo" /></div>';
        var content = '';
    }
    else{
        var header = '<div id="ligertail_widget_header"><form><img src="' + LTDOMAIN + '/frontend/images/logo_header.png" width="70" height="39" alt="Ligertail" align="left" title="Visit ligertail.com"/><input type="text" class="ligertail_widget_form" value="Submit Your Link Here" /><input type="image" src="' + LTDOMAIN + '/frontend/images/button_submit_2.png" value="Submit" align="left"/></form></div>';
        var footer = '<div id="ligertail_widget_footer"></div>';
        var content = '';
    }
    
    for(var j = 1; j <= window.numItems; j++){
        if(window.parameter["width"] == 600){
            content += '<div class="ligertail_widget_content" id="-' + j + '"><div class="ligertail_widget_blank"></div><div class="ligertail_widget_image"><img src="' + LTDOMAIN + '/frontend/images/default.png" alt="Image" width="105" height="65" border="0" /></a></div><div class="ligertail_widget_text"><div class="ligertail_widget_top_text"><span class="ligertail_widget_source">LigerTail.com</span><span class="ligertail_widget_title">Submit your content in the input box above!</span></div><p class="ligertail_widget_description">Display your content here to get recognized!!!</p></div></div>';
        }
        else{
            content += '<div class="ligertail_widget_content" id="-' + j + '"><div class="ligertail_widget_text"><span class="ligertail_widget_source">LigerTail.com</span><span class="ligertail_widget_title">submit your link above!</span></div></div>';
        }
    }
  
  var wrapper = '<div style="position:absolute!important;background:none!important;border:none!important;margin:0!important;padding:0!important;line-height:1em!important;font-size:100%!important;width:300px!important;height:250px!important;">';
    
    $(".ligertail_widget").append(wrapper + header + content + footer + '</div>');
    $(".ligertail_widget .ligertail_widget_content").show();
   
    //events...
    //clicking on header logo
    if(window.parameter["width"] == 600)
         $("#ligertail_widget_footer img:first").click(function(){ window.open(LTVISIBLEDOMAIN); });                                
    else
         $("#ligertail_widget_header img:first").click(function(){ window.open(LTVISIBLEDOMAIN); });
    
    //input box hover
    $("#ligertail_widget_header input").hover(function(){ 
        if($(this).val() == "Submit Your Link Here")
            $(this).val("").select();
        else
            $(this).select();
    }, 
    function(){
        if($(this).val() == "")
            $(this).val("Submit Your Link Here").blur();
        else
            $(this).blur();
    });
    
    //submit in lightbox
    $("#ligertail_widget_header form").submit(function(event){ 
        event.preventDefault();
        var url = $(this).find("input:first").val();
        OpenLightboxSubmission(url);
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

