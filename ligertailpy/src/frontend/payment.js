(function(window, document, version, callback) {
    var j, d;
    var loaded = false;
    if (!(j = window.jQuery) || version > j.fn.jquery || callback(j, loaded)) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "../js/jquery.min.js"; 
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

LoadFile("../js/jquery.min.js", "js");
LoadFile("../js/postrequest.js", "js");
LoadFile("../js/json2.js", "js");
LoadFile("../js/apiproxy.js", "js");
LoadFile("../frontend/apihandler.js", "js");




    $(document).ready(function(){
       tryToInit(initAll);                  
    });

});

function getUrlParameters() {
    var map = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    map[key] = value;
    });
    return map; 
}

//EMAIL VALIDATION FUNCTION

function ValidateEmail(str) {
    var reg = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    if(reg.test(str) == false) { 
        return false;
    }
    else return str;  
}

function init(publisherUrl) {
  if (initialized) {
    return;
  }
  
  var initialized = true;
  var apiHandler = new ApiHandler();
  window.api = new LTApi();
  api.init(apiHandler);
  window.publisherUrl = publisherUrl;
}

function showGraph(scope, id, analytics, duration){
    if(scope != null && id != null){
        //so.addVariable("additional_chart_settings", "<settings><values><y_left><duration>" + duration + "</duration></y_left></values></settings>");
        so.addVariable("chart_data", window.analytics_data[scope][id][dur[duration]][analytics]); 
        //console.log({'scope': scope, 'id': id, 'analytics': analytics, 'duration': duration});
        //console.log(window.analytics_data[scope][id][dur[duration]][analytics]);
        
        jQuery("#paramScope option:[value='" + scope + "']").attr('selected', 'selected');
        jQuery("#paramAnalytics option:[value='" + analytics + "']").attr('selected', 'selected');
        jQuery("#paramDuration option:[value='" + duration + "']").attr('selected', 'selected');
    }
    else{  console.log({'scope': scope, 'id': id, 'analytics': analytics, 'duration': duration});
         //error message
    }
    so.write("flashcontent");
}

function openPaymentLightbox(){
                               
    jQuery.facebox(function($) {
       $.get('blah.html', function(data) { $.facebox(data) });
    });
    /*jQuery.facebox(function(){     
        
       
        jQuery.facebox({ ajax: "../web/payment_form.html"});
     });  
        //make sure lightbox form loads before embed.ly is called        
        jQuery(document).bind('reveal.facebox', function(event){ 
            url = jQuery.trim(url);
                                                 
            jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_url").val(url);
            
            //error checking & submission handling            
            
            //form validation
            //load credit card validation
    //first
    jQuery("#payment_form #first_name").blur(function(){
        if(jQuery(this).val().length == 0)
            jQuery("#payment_form tr:nth-child(1)").css("color", "red");
        else if(jQuery("#payment_form tr:nth-child(1)").css("color") == "rgb(255, 0, 0)")
            jQuery("#payment_form tr:nth-child(1)").css("color", "black");
    });
            
    //last
    jQuery("#payment_form #last_name").blur(function(){
        if(jQuery(this).val().length == 0)
            jQuery("#payment_form tr:nth-child(3)").css("color", "red");
        else if(jQuery("#payment_form tr:nth-child(3)").css("color") == "rgb(255, 0, 0)")
            jQuery("#payment_form tr:nth-child(3)").css("color", "black");
    });
    
    //email
    jQuery("#payment_form #email").blur(function(){
        if(!ValidateEmail(jQuery(this).val()))
            jQuery("#payment_form tr:nth-child(5)").css("color", "red");
        else if(jQuery("#payment_form tr:nth-child(5)").css("color") == "rgb(255, 0, 0)")
            jQuery("#payment_form tr:nth-child(5)").css("color", "black");
    });
    
    //address
    jQuery("#payment_form #address").blur(function(){
        if(jQuery(this).val().length == 0)
            jQuery("#payment_form tr:nth-child(7)").css("color", "red");
        else if(jQuery("#payment_form tr:nth-child(7)").css("color") == "rgb(255, 0, 0)")
            jQuery("#payment_form tr:nth-child(7)").css("color", "black");
    });
    
    //city
    jQuery("#payment_form #city").blur(function(){
        if(jQuery(this).val().length == 0)
            jQuery("#payment_form tr:nth-child(9)").css("color", "red");
        else if(jQuery("#payment_form tr:nth-child(9)").css("color") == "rgb(255, 0, 0)")
            jQuery("#payment_form tr:nth-child(9)").css("color", "black");
    });
    
    //state
    jQuery("#payment_form #state").blur(function(){
        if(jQuery(this).val().length != 2)
            jQuery("#payment_form tr:nth-child(11) th:nth-child(2)").css("color", "red");
        else if(jQuery("#payment_form tr:nth-child(11) th:nth-child(2)").css("color") == "rgb(255, 0, 0)")
            jQuery("#payment_form tr:nth-child(11) th:nth-child(2)").css("color", "black");
    });
    
    //zip
    jQuery("#payment_form #zip").blur(function(){
        if(jQuery(this).val().length != 5)
            jQuery("#payment_form tr:nth-child(11) th:last").css("color", "red");
        else if(jQuery("#payment_form tr:nth-child(11) th:last").css("color") == "rgb(255, 0, 0)")
            jQuery("#payment_form tr:nth-child(11) th:last").css("color", "black");
    });
    
    //cc #
    jQuery("#payment_form #cc").blur(function(){
        if(jQuery(this).val().length != 16)
            jQuery("#payment_form tr:nth-child(13)").css("color", "red");
        else if(jQuery("#payment_form tr:nth-child(13)").css("color") == "rgb(255, 0, 0)")
            jQuery("#payment_form tr:nth-child(13)").css("color", "black");
    });
    
    //exp
    jQuery("#payment_form #expiration_month").blur(function(){
        if(jQuery(this).val().length == 0)
            jQuery("#payment_form tr:nth-child(15) th:first").css("color", "red");
        else if(jQuery("#payment_form tr:nth-child(15) th:first").css("color") == "rgb(255, 0, 0)")
            jQuery("#payment_form tr:nth-child(15) th:first").css("color", "black");
    });
    
    jQuery("#payment_form #expiration_year").blur(function(){
        if(jQuery(this).val().length != 4)
            jQuery("#payment_form tr:nth-child(15) th:first").css("color", "red");
        else if(jQuery("#payment_form tr:nth-child(15) th:first").css("color") == "rgb(255, 0, 0)")
            jQuery("#payment_form tr:nth-child(15) th:first").css("color", "black");
    });
    
    //cvs
    jQuery("#payment_form #cvs").blur(function(){
        if(jQuery(this).val().length != 3)
            jQuery("#payment_form tr:nth-child(15) th:last").css("color", "red");
        else if(jQuery("#payment_form tr:nth-child(15) th:last").css("color") == "rgb(255, 0, 0)")
            jQuery("#payment_form tr:nth-child(15) th:last").css("color", "black");
    });
    

    //catch submission
    //add error message to form
    //or
    //redirect to receipt page
    jQuery("#payment_form").bind("sub submit", function(){
        event.preventDefault();
        //console.log("submitted");
        
        var price = jQuery("#payment_price .pricing").html().replace("$", "");
        var first_name = jQuery("#payment_form #first_name").val();
        var last_name = jQuery("#payment_form #last_name").val();
        var address = jQuery("#payment_form #address").val();
        var city = jQuery("#payment_form #city").val();
        var state = jQuery("#payment_form #state").val();
        var zip = jQuery("#payment_form #zip").val();
        var cc = jQuery ("#payment_form #cc").val();
        var expiration_month = jQuery("#payment_form #expiration_month").val();
        var expiration_year = jQuery("#payment_form #expiration_year").val();
        var cvs = jQuery("#payment_form #cvs").val();
        
        if(price > 0 && first_name.length > 0 && last_name.length > 0 && 
             address.length > 0 && city.length > 0 && state.length == 2 && 
             zip.length == 5 && cc.length == 16 && expiration_month.length > 0 && 
             expiration_year.length == 4 && cvs. length == 3){
                                                              
             //disable form & show waiting dialog, then submit
             jQuery("#payment_price, #payment_form :input").attr('disabled', true);
          
             var paymentInfo = {
                           "price": price,
                           "first_name": first_name,
                           "last_name": last_name,
                           "itemId": urlParams['itemId'],
                           "address": address,
                           "city": city,
                           "state": state,
                           "zip": zip, 
                           "cc": cc,
                           "expiration": expiration_month + '/' + expiration_year,
                           "cvs": cvs,                      
             };
             console.log(paymentInfo);
             api.updatePrice(paymentInfo);
          
        }
        else{
             //show errors
             jQuery("#payment_form .input_form, .input_form_short").trigger('blur');
        }
    });
            
            
            jQuery("#ligertail_submission_lightbox_form").submit(function(event){
                event.preventDefault();
                
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
                    item.thumbnailUrl = "../frontend/images/default.png";

                if(ValidateURL(item.url) && 
                    (item.title.length > 3 && item.title.length < 100) && 
                    item.description.length > 0 && item.description.length < 512 &&
                    ValidateEmail(item.email)){
                    
                        api.submitItem(item); 
                        //console.log(item);
                        
                        jQuery(document).trigger('close.facebox');
                        
                        
                        
                        //error here: not removing last item in widget
                        
                        //redirect to submit confirmation later
                }
                else{
                        //console.log(item);
                        jQuery("#ligertail_submission_lightbox_form input").trigger("blur");
                }
            });
            
            jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_button_free").click(function(event){
                event.preventDefault();
                window.submitForFree = true;                                                                                                  
                jQuery("#ligertail_submission_lightbox_form").submit(); 
                
            });
            
            jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_button_pay").click(function(event){ 
                event.preventDefault();
                window.submitForFree = false;               
                jQuery("#ligertail_submission_lightbox_form").submit();
            });
            
        });  
        
        jQuery(document).bind('close.facebox', function(){
            jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_title").val("");    
            jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_description").val("");
            jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_url").val("");
            jQuery("#ligertail_submission_lightbox_form #ligertail_submission_lightbox_thumbnail").val("");                                              
            jQuery("#ligertail_submission_lightbox_right_column .ligertail_widget_content:first .ligertail_widget_source").html("ligertail.com");
            jQuery("#ligertail_submission_lightbox_right_column .ligertail_widget_content:first .ligertail_widget_title").html("submit your link above!");
            if(window.parameter["width"] == 600){
                jQuery("#ligertail_submission_lightbox_right_column .ligertail_widget_content:first .ligertail_widget_description").html("Display your content here to get recognized!!!");
                jQuery("#ligertail_submission_lightbox_right_column .ligertail_widget_content:first .ligertail_widget_image img").attr('src', '../frontend/images/default.png');
            }
            
            jQuery("#ligertail_widget_header input").val("Submit Your Link Here");
            
            jQuery(document).unbind('reveal.facebox');     
        });      
    });                           
         */                      
}

function initAll(){
    window.PUBLISHER_URL = "http://www.ligertail.com/payment.html";
    
    //initialize communication with ligertail
    init(window.PUBLISHER_URL);
    var urlParams = getUrlParameters();
    api.getItemStats(urlParams['itemId'], 0, 'ApiHandler.prototype.onGetItemInfo');
    
    jQuery("#payFormSwitch").click(function(){
            openPaymentLightbox();                                
    });
    
    jQuery(".rbody .row-first input").live('keypress', function(event){
        if(event.keyCode == 13)
            openPaymentLightbox();
    });
    
}

function tryToInit() {
    try {
        var test = new ApiHandler();
        var test1 = new LTApi();
    } catch (e) {
        setTimeout("tryToInit()", 100);
        return;
    };
    initAll();
}

