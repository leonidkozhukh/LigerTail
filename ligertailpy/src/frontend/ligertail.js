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
    if (filetype == "js"){ //if filename is an external JavaScript file
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
    LoadFile("http://ligertail.com/a/js/postrequest.js", "js");
    LoadFile("http://ligertail.com/a/js/json2.js", "js");
    LoadFile("http://ligertail.com/a/js/apiproxy.js", "js");
    LoadFile("http://ligertail.com/a/frontend/apihandler.js", "js");

    LoadFile("http://ligertail.com/a/frontend/facebox/facebox.js", "js");
    LoadFile("http://ligertail.com/a/frontend/facebox/facebox.css", "css");
    LoadFile("http://ligertail.com/a/frontend/css/widget_1.css", "css");
    
    //LOAD PUBLISHER-SET PARAMETERS

function SetupParameters(){
    ///////////////////////////////
    var file_name = "http://www.ligertail.com/a/frontend/ligertail.js";
    ///////////////////////////////
        scripts = document.getElementsByTagName("script"); 
        var i, j, src, parts, basePath, options = {};
        LTnode = document.createElement("div");
        LTnode.setAttribute("class", "ligertail_widget");
        
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
        jQuery.facebox({ ajax: "/submission.html"});
        
        // Call embedly
        jQuery.ajax({
            type: "GET",
            url: "https://pro.embed.ly/1/oembed?callback=?&format=json&key=863cd350298b11e091d0404058088959&url=" + url,
            dataType: "json",
            success: function(data){
                jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_title").val(data.title);    
                jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_description").val(data.description);
                jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_url").val(url);
                jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_thumbnail").val(data.thumbnail_url); 
                
                jQuery("#ligertail_submission_lightbox_right_column #ligertail_widget_small .ligertail_widget_content:first .ligertail_widget_source").html(getDomain(url));
                jQuery("#ligertail_submission_lightbox_right_column #ligertail_widget_small .ligertail_widget_content:first .ligertail_widget_title").html(data.title);
                jQuery("#ligertail_submission_lightbox_right_column #ligertail_widget_small .ligertail_widget_content:first .ligertail_widget_text").after('<div class="ligertail_widget_close"><img src="http://ligertail.com/a/frontend/images/button_close.png" alt="Delete" width="18" height="18" border="0" /></div>');          
            },
            error: function(e){ alert("error: " + e);}        
        });
        
        jQuery(document).bind('reveal.facebox', function(){ 
            //error checking & submission handling            
            
            //form validation
            jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_url").blur(function(){ 
                if(!ValidateURL(jQuery(this).val()))
                    jQuery("#ligertail_submission_lightbox_form tr:first").css("color", "red");
                else{
                    jQuery("#ligertail_submission_lightbox_right_column #ligertail_widget_small .ligertail_widget_content:first .ligertail_widget_source").html(getDomain(jQuery(this).val()));
                    if(jQuery("#ligertail_submission_lightbox_form tr:first").css("color") == "rgb(255, 0, 0)")
                    jQuery("#ligertail_submission_lightbox_form tr:first").css("color", "black");
                }
            });
            
            jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_title").blur(function(){ 
                if(jQuery(this).val().length < 3 || jQuery(this).val().length > 100)
                    jQuery("#ligertail_submission_lightbox_form tr:nth-child(3)").css("color", "red");
                else{
                    jQuery("#ligertail_submission_lightbox_right_column #ligertail_widget_small .ligertail_widget_content:first .ligertail_widget_title").html(jQuery(this).val());
                    if(jQuery("#ligertail_submission_lightbox_form tr:nth-child(3)").css("color") == "rgb(255, 0, 0)")
                        jQuery("#ligertail_submission_lightbox_form tr:nth-child(3)").css("color", "black");
                }
            });

            jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_description").blur(function(){
                if(jQuery(this).val().length > 512 || jQuery(this).val().length == 0)
                    jQuery("#ligertail_submission_lightbox_form tr:nth-child(5)").css("color", "red");
                else if(jQuery("#ligertail_submission_lightbox_form tr:nth-child(5)").css("color") == "rgb(255, 0, 0)")
                    jQuery("#ligertail_submission_lightbox_form tr:nth-child(5)").css("color", "black");
            });
            
            jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_email").blur(function(){
                if(!ValidateEmail(jQuery(this).val()))
                    jQuery("#ligertail_submission_lightbox_form tr:nth-child(7)").css("color", "red");
                else if(jQuery("#ligertail_submission_lightbox_form tr:nth-child(7)").css("color") == "rgb(255, 0, 0)")
                    jQuery("#ligertail_submission_lightbox_form tr:nth-child(7)").css("color", "black");
            });
            
            
            jQuery("#ligertail_submission_lightbox_form").submit(function(){
                event.preventDefault();
                window.submitForFree = true;
                
                var item = {}; 
                item.publisherUrl = window.PUBLISHER_URL;
                item.url = jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_url").val(); 
                item.title = jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_title").val();
                item.description = jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_description").val();
                item.email = jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_email").val();

                //if url same as original, use embedly img
                if(item.url == url)
                    item.thumbnailUrl = jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_thumbnail").val();
                else
                    item.thumbnailUrl = "http://ligertail.com/a/frontend/images/default.png";

                if(ValidateURL(item.url) && 
                    (item.title.length > 3 && item.title.length < 100) && 
                    item.description.length > 0 && item.description.length < 512 &&
                    ValidateEmail(item.email)){
                    
                        api.submitItem(item); 
                        //console.log(item);
                        
                        jQuery(document).trigger('close.facebox');
                        
                        //remove last item from view to make room for the new submission
                        jQuery(".ligertail_widget .ligertail_widget_content:visible:last").hide();
                        
                        //add content to widget
                        if(window.parameter["width"] == 600){                                                          
                            jQuery(".ligertail_widget #ligertail_widget_header").after('<div class="ligertail_widget_content" id="' + item.id + '" style="display:block;"><div class="ligertail_widget_close"><img src="http://ligertail.com/a/frontend/images/button_close.png" width="18" height="18" alt="Delete" /></div><div class="ligertail_widget_image"><a target="_blank" href="' + item.url +'"><img src="' + item.thumbnailUrl + '" alt="Image" width="105" height="65" border="0" /></a></div><div class="ligertail_widget_text"><span class="ligertail_widget_source"><a target="_blank" href="' + item.url + '">' + getDomain(item.url) + '</a></span><span class="ligertail_widget_title"><a target="_blank" href="' + item.url + '">' + item.title + '</a></span><p>' + item.description + '</p></div></div>');
                        }
                        else{
                            jQuery(".ligertail_widget #ligertail_widget_header").after('<div class="ligertail_widget_content" id="' + item.id + '" style="display:block;"><div class="ligertail_widget_text"><span class="ligertail_widget_source">' + getDomain(item.url) + '</span><span class="ligertail_widget_title"><a target="_blank" href="' + item.url + '">' + item.title + '</a></span></div><div class="close"><img src="http://ligertail.com/a/frontend/images/button_close.png" alt="Delete" width="18" height="18" border="0" /></div></div>');
                        }
                        
                        //error here: not removing last item in widget
                        
                        //redirect to submit confirmation later
                }
                else{
                        //console.log(item);
                        jQuery("#ligertail_submission_lightbox_form input").trigger("blur");
                }
            });
            
            jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_button_pay").click(function(){ 
                event.preventDefault();
                window.submitForFree = false;
                
                var item = {}; 
                item.publisherUrl = window.PUBLISHER_URL;
                item.url = jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_url").val(); 
                item.title = jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_title").val();
                item.description = jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_description").val();
                item.email = jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_email").val();
                item.thumbnailUrl = jQuery("#preview .image img").attr("src"); 

                //if url same as original, use embedly img
                if(item.url == url)
                    item.thumbnailUrl = jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_thumbnail").val();
                else
                    item.thumbnailUrl = "http://ligertail.com/a/frontend/images/default.png";

                if(ValidateURL(item.url) && 
                    (item.title.length > 3 && item.title.length < 100) && 
                    item.description.length > 0 && item.description.length < 512 &&
                    ValidateEmail(item.email)){
                    
                        api.submitItem(item);
                }
                else{
                        //console.log(item);
                }                
                
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
  window.api = new LGApi();
  api.init(domain, apiHandler);
  window.publisherUrl = publisherUrl;
}

function initAll(){
    var CONTENT_HEIGHT_SMALL = 25; //header=39 footer=20
    var CONTENT_HEIGHT_LARGE = 90;//header=49 footer=35
    window.PUBLISHER_URL = location.href;
    
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
        var header = '<div id="ligertail_widget_header"><form><input type="text" class="ligertail_widget_form" value="Submit Your Link Here" /><input type="image" src="http://www.ligertail.com/a/frontend/images/button_submit_1.png" value="Submit" /></form></div>';
        var footer = '<div id="ligertail_widget_footer"><img src="http://www.ligertail.com/a/frontend/images/logo_footer.png" width="116" height="35" alt="Logo" /></div>';
        var content = '';
    }
    else{
        var header = '<div id="ligertail_widget_header"><form><img src="http://www.ligertail.com/a/frontend/images/logo_header.png" width="70" height="39" alt="Ligertail" align="left" /><input type="text" class="ligertail_widget_form" value="Submit Your Link Here" /><input type="image" src="http://www.ligertail.com/a/frontend/images/button_submit_2.png" value="Submit" align="left"/></form></div>';
        var footer = '<div id="ligertail_widget_footer"></div>';
        var content = '';
    }
    
    for(var j = 1; j <= window.numItems; j++){
        if(window.parameter["width"] == 600){
            content += '<div class="ligertail_widget_content" id="' + j + '"><div class="ligertail_widget_image"><img src="http://www.ligertail.com/a/frontend/default.png" alt="Image" width="105" height="65" border="0" /></a></div><div class="ligertail_widget_text"><span class="ligertail_widget_source">LigerTail.com</span><span class="ligertail_widget_title">Submit your content in the input box above!</span><p>Display your content here to get recognized!!!</p></div></div>';
        }
        else{
            content += '<div class="ligertail_widget_content" id="' + j + '"><div class="ligertail_widget_text"><span class="ligertail_widget_source">LigerTail.com</span><span class="ligertail_widget_title">submit your link above!</span></div></div>';
        }
    }
    
    $(".ligertail_widget").append(header + content + footer);
    $(".ligertail_widget .ligertail_widget_content").show();
    
    //events...
    //clicking on header logo
    $("#ligertail_widget_header img:first").click(function(){
         window.open("http://ligertail.com");
    });
    
    //input box hover
    $("#ligertail_widget_header input").hover(function(){ 
        if($(this).val() == "Submit Your Link Here")
            $(this).val("http://").select();
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
    $("#ligertail_widget_header form").submit(function(){ 
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

//TODO:
//if api initialization problem persists, use payment.js pattern