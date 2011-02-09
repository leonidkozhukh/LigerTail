//http://stackoverflow.com/questions/2170439/how-to-embed-javascript-widget-that-depends-on-jquery-into-an-unknown-environment
(function(window, document, version, callback) {
    var j, d;
    var loaded = false;
    if (!(j = window.jQuery) || version > j.fn.jquery || callback(j, loaded)) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "http://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js";
        script.onload = script.onreadystatechange = function() {
            if (!loaded && (!(d = this.readyState) || d == "loaded" || d == "complete")) {
                callback((j = window.jQuery).noConflict(1), loaded = true);
                j(script).remove();
            }
        };
        document.documentElement.childNodes[0].appendChild(script)
    }
})(window, document, "1.4", function($, jquery_loaded) {
                                                        
    var initialized = false;

function LoadFile(filename, filetype){
    if (filetype == "js"){ //if filename is a external JavaScript file
          var fileref = document.createElement('script');
          fileref.setAttribute("type", "text/javascript");
          fileref.setAttribute("src", filename);
     }
     else if (filetype == "css"){ //if filename is an external CSS file
         var fileref = document.createElement("link");
          fileref.setAttribute("rel", "stylesheet");
          fileref.setAttribute("type", "text/css");
          fileref.setAttribute("href", filename);
     }

     if (typeof fileref != "undefined")
          document.getElementsByTagName("head")[0].appendChild(fileref);
}
    LoadFile("http://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js", "js");
    LoadFile("../js/postrequest.js", "js");
    LoadFile("../js/json2.js", "js");
    LoadFile("../js/apiproxy.js", "js");
    LoadFile("../js/apihandler.js", "js");

    LoadFile("facebox/facebox.js", "js");
    LoadFile("facebox/facebox.css", "css");
    LoadFile("css/widget_1.css", "css");
    
    //LOAD PUBLISHER-SET PARAMETERS

function SetupParameters(){
    ///////////////////////////////
    var file_name = 'ligertail.js';
    ///////////////////////////////
        scripts = document.getElementsByTagName("script"); 
        var i, j, src, parts, basePath, options = {};
        LTnode = document.createElement("div");
        LTnode.setAttribute("class", "widget");
        
    for (i = 0; i < scripts.length; i++) {
          src = scripts[i].src;
         if (src.indexOf(file_name) != -1) {
               //create ligertail container <div>               
               scripts[i].parentNode.appendChild(LTnode);
               
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
    var RegExp = /^(([\w]+:)?\/\/)?(([\d\w]|%[a-fA-f\d]{2,2})+(:([\d\w]|%[a-fA-f\d]{2,2})+)?@)?([\d\w][-\d\w]{0,253}[\d\w]\.)+[\w]{2,4}(:[\d]+)?(\/([-+_~.\d\w]|%[a-fA-f\d]{2,2})*)*(\?(&?([-+_~.\d\w]|%[a-fA-f\d]{2,2})=?)*)?(#([-+_~.\d\w]|%[a-fA-f\d]{2,2})*)?$/;
    if(RegExp.test(str)){ 
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
///////////////////////////////////////////////////// 
//LOAD SUBMISSION LIGHTBOX

function OpenLightboxSubmission(url){
    jQuery.facebox(function(){     
        jQuery.facebox({ ajax: "submission.html"});
        
        // Call embedly
        jQuery.ajax({
            type: "GET",
            url: "https://pro.embed.ly/1/oembed?callback=?&format=json&key=863cd350298b11e091d0404058088959&url=" + url,
            dataType: "json",
            success: function(data){ console.log(data);
                jQuery("#form_submission #title").val(data.title);    
                jQuery("#form_submission #description").val(data.description);
                jQuery("#form_submission #url").val(url);
                
                //populate preview with data
                jQuery("#preview .image img").attr("src", data.thumbnail_url);
                
            },
            error: function(e){ alert("error: " + e);}        
        });
        
        jQuery(document).bind('reveal.facebox', function(){ 
            //error checking & submission handling            
            
            //form validation
            jQuery("#form_submission #url").blur(function(){ 
                if(!ValidateURL(jQuery(this).val()))
                    jQuery("#form_submission tr:first").css("color", "red");
                else if(jQuery("#form_submission tr:first").css("color") == "rgb(255, 0, 0)")
                    jQuery("#form_submission tr:first").css("color", "black");
            });
            
            jQuery("#form_submission #title").blur(function(){ 
                if(jQuery(this).val().length < 3 || jQuery(this).val().length > 100)
                    jQuery("#form_submission tr:nth-child(3)").css("color", "red");
                else{
                    jQuery("#preview .source").html(jQuery(this).val());
                    if(jQuery("#form_submission tr:nth-child(3)").css("color") == "rgb(255, 0, 0)")
                        jQuery("#form_submission tr:nth-child(3)").css("color", "black");
                }
            });

            jQuery("#form_submission #description").blur(function(){
                if(jQuery(this).val().length > 512 || jQuery(this).val().length == 0)
                    jQuery("#form_submission tr:nth-child(5)").css("color", "red");
                else if(jQuery("#form_submission tr:nth-child(5)").css("color") == "rgb(255, 0, 0)")
                    jQuery("#form_submission tr:nth-child(5)").css("color", "black");
            });
            
            jQuery("#form_submission #email").blur(function(){
                if(!ValidateEmail(jQuery(this).val()))
                    jQuery("#form_submission tr:nth-child(7)").css("color", "red");
                else if(jQuery("#form_submission tr:nth-child(7)").css("color") == "rgb(255, 0, 0)")
                    jQuery("#form_submission tr:nth-child(7)").css("color", "black");
            });
            
            
            jQuery("#form_submission").submit(function(){
                window.submitForFree = true;
                event.preventDefault();
                
                var item = {}; 
                item.publisherUrl = window.PUBLISHER_URL;
                item.url = jQuery("#form_submission #url").val(); 
                item.title = jQuery("#form_submission #title").val();
                item.description = jQuery("#form_submission #description").val();
                item.email = jQuery("#form_submission #email").val();
                item.thumbnailUrl = jQuery("#preview .image img").attr("src"); console.log(item.thumbnailUrl);

                //if url same as original, use embedly img
                var img_src = "";
                if(item.url == url)
                    img_src = ""; //jQuery("#submission .thumb").attr("src");
                else
                    img_src = "default.png";

                if(ValidateURL(item.url) && 
                    (item.title.length > 3 && item.title.length < 100) && 
                    item.description.length > 0 && item.description.length < 512 &&
                    ValidateEmail(item.email)){
                    
                        api.submitItem(item);
                }
                else{
                        console.log(item);
                }
            });
            
            jQuery("#form_submission #button_pay").click(function(){ 
                window.submitForFree = false;
                event.preventDefault();
                
                var item = {}; 
                item.publisherUrl = window.PUBLISHER_URL;
                item.url = jQuery("#form_submission #url").val(); 
                item.title = jQuery("#form_submission #title").val();
                item.description = jQuery("#form_submission #description").val();
                item.email = jQuery("#form_submission #email").val();
                item.thumbnailUrl = jQuery("#preview .image img").attr("src"); console.log(item.thumbnailUrl);

                //if url same as original, use embedly img
                var img_src = "";
                if(item.url == url)
                    img_src = ""; //jQuery("#submission .thumb").attr("src");
                else
                    img_src = "default.png";

                if(ValidateURL(item.url) && 
                    (item.title.length > 3 && item.title.length < 100) && 
                    item.description.length > 0 && item.description.length < 512 &&
                    ValidateEmail(item.email)){
                    
                        api.submitItem(item);
                }
                else{
                        console.log(item);
                }
                /*
                //ultimately will open a new window with ligertail.com/payments.html loaded
                jQuery("#facebox .content").empty().load("payment.html");
                jQuery("#facebox").css({
                       top:    jQuery(window).height() / 10,
                    left:    150 
                  }).show();
                */
                
                
            });
            
        });        
    });
}

//////////////////////////////////////////////////////////

function init(publisherUrl) {
  if (initialized) {
    return;
  }
  
  var initialized = true;
  var apiHandler = new ApiHandler();
  var domain = "http://5.latest.ligertailbackend.appspot.com";
  window.api = new Api();
  api.init(domain, apiHandler);
  window.publisherUrl = publisherUrl;
}

function initAll(){
    var CONTENT_HEIGHT_SMALL = 45;
    var CONTENT_HEIGHT_LARGE = 100;
    window.PUBLISHER_URL = "www.nytimes4.com"; //location.href;
    
    //initialize widget parameters
    window.parameter = SetupParameters();
    console.log(window.parameter);
    
    //adjust size
        //width
    if(window.parameter["width"]){
        if(window.parameter["width"] <= 300){ 
            jQuery(".widget").attr("id", "widget_2");
            window.parameter["width"] = 300;     
        }
        else if(window.parameter["width"] > 300 && window.parameter["width"] < 600){ 
            jQuery(".widget").attr("id", "widget_1");                                                                        
            window.parameter["width"] = 600; 
        }
        else if(window.parameter["width"] >= 600){ 
            jQuery(".widget").attr("id", "widget_1");
            window.parameter["width"] = 600; 
        }
        else{ 
             jQuery(".widget").attr("id", "widget_2");
             window.parameter["width"] = 300; 
        }
    }
    else{ 
         jQuery(".widget").attr("id", "widget_2");
         window.parameter["width"] = 300; 
    }
        
        //height
    if(window.parameter["height"]){
        if(window.parameter["width"] == 300 && window.parameter["height"] > 0){
            window.parameter["height"] = window.parameter["height"] - ((window.parameter["height"] - 59) % CONTENT_HEIGHT_SMALL);
            window.numItems = Math.floor((window.parameter["height"] - 59) / CONTENT_HEIGHT_SMALL);
        }
        else if(window.parameter["width"] == 600 && window.parameter["height"] > 0){
            window.parameter["height"] = window.parameter["height"] - ((window.parameter["height"] - 94) % CONTENT_HEIGHT_LARGE);
            window.numItems = Math.floor((window.parameter["height"] - 94) / CONTENT_HEIGHT_LARGE);
        }
    }
    else{
         if(window.parameter["width"] == 300){
            window.parameter["height"] = 250;
            window.numItems = Math.floor((window.parameter["height"] - 59) / CONTENT_HEIGHT_SMALL);
        }
        else if(window.parameter["width"] == 600){
            window.parameter["height"] = 450;
            window.numItems = Math.floor((window.parameter["height"] - 94)/ CONTENT_HEIGHT_LARGE);
        }
    }
    
    //initialize communication with ligertail
    init(window.PUBLISHER_URL);
    
    //load header, footer, and default content then bind events
    //this should be a switch statement
    if(window.parameter["width"] == 600){
        var header = '<div id="header"><form><input name="textfield2" type="text" class="form" id="textfield2" value="Submit Link" /><input type="image" src="images/button_submit_1.png" name="button2" id="button2" value="Submit" /></form></div>';
        var footer = '<div id="footer"><img src="images/logo_footer.png" width="116" height="35" alt="Logo" /></div>';
        var content = '';
    }
    else{
        var header = '<div id="header"><form><img src="images/logo_header.png" width="70" height="39" alt="Ligertail" align="left" /><input name="textfield" type="text" class="form_2" id="textfield" value="Submit Link" /><input type="image" src="images/button_submit_2.png" name="button" id="button" value="Submit" /></form></div>';
        var footer = '<div id="footer"></div>';
        var content = '';
    }
    
    $(".widget").append(header + content + footer);
    
    //events...
    //input box hover
    $("#header input").hover(function(){ 
        if($(this).val() == "Submit Link")
            $(this).val("http://").select();
        else
            $(this).select();
    }, 
    function(){
        if($(this).val() == "")
            $(this).val("Submit Link").blur();
        else
            $(this).blur();
    });
    
    //submit in lightbox
    $("#header form").submit(function(){ 
        event.preventDefault();
        var url = $(this).find("input:first").val();
        OpenLightboxSubmission(url);
    });
    
    //load content and bind events
    api.getOrderedItems(window.PUBLISHER_URL);                
                   
                   
}
    
    
    $(document).ready(function(){
          initAll();                   
    });

});

