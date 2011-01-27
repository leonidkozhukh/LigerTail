
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

//LoadFile("../js/jquery-1.4.4", "js");
LoadFile("../js/postrequest.js", "js");
LoadFile("../js/json2.js", "js");
LoadFile("../js/apiproxy.js", "js");
LoadFile("../js/apihandler.js", "js");
//LoadFile("http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js", "js");
LoadFile("css/payment.css", "css");

function init(publisherUrl) {
  if (initialized) {
    return;
  }
  
  var initialized = true;
  var apiHandler = new ApiHandler();
  var domain = "https://ligertailbackend.appspot.com";
  window.api = new Api();
  api.init(domain, apiHandler);
  window.publisherUrl = publisherUrl;
}

function initAll(){
    window.PUBLISHER_URL = "www.nytimes4.com"; //location.href;
    
    //initialize communication with ligertail
    init(window.PUBLISHER_URL);
    
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
    
    //address
    jQuery("#payment_form #address").blur(function(){
        if(jQuery(this).val().length == 0)
            jQuery("#payment_form tr:nth-child(5)").css("color", "red");
        else if(jQuery("#payment_form tr:nth-child(5)").css("color") == "rgb(255, 0, 0)")
            jQuery("#payment_form tr:nth-child(5)").css("color", "black");
    });
    
    //city
    jQuery("#payment_form #city").blur(function(){
        if(jQuery(this).val().length == 0)
            jQuery("#payment_form tr:nth-child(7)").css("color", "red");
        else if(jQuery("#payment_form tr:nth-child(7)").css("color") == "rgb(255, 0, 0)")
            jQuery("#payment_form tr:nth-child(7)").css("color", "black");
    });
    
    //state
    jQuery("#payment_form #state").blur(function(){
        if(jQuery(this).val().length == 0)
            jQuery("#payment_form tr:nth-child(9) th:nth-child(2)").css("color", "red");
        else if(jQuery("#payment_form tr:nth-child(9) th:nth-child(2)").css("color") == "rgb(255, 0, 0)")
            jQuery("#payment_form tr:nth-child(9) th:nth-child(2)").css("color", "black");
    });
    
    //zip
    jQuery("#payment_form #zip").blur(function(){
        if(jQuery(this).val().length == 0)
            jQuery("#payment_form tr:nth-child(9) th:last").css("color", "red");
        else if(jQuery("#payment_form tr:nth-child(9) th:last").css("color") == "rgb(255, 0, 0)")
            jQuery("#payment_form tr:nth-child(9) th:last").css("color", "black");
    });
    
    //cc #
    jQuery("#payment_form #cc").blur(function(){
        if(jQuery(this).val().length == 0)
            jQuery("#payment_form tr:nth-child(11)").css("color", "red");
        else if(jQuery("#payment_form tr:nth-child(11)").css("color") == "rgb(255, 0, 0)")
            jQuery("#payment_form tr:nth-child(11)").css("color", "black");
    });
    
    //exp
    //need month/year selection
    
    //cvs
    /*jQuery("#payment_form #cvs").blur(function(){
        if(jQuery(this).val().length == 0)
            jQuery("#payment_form tr:nth-child(11)").css("color", "red");
        else if(jQuery("#payment_form tr:nth-child(11)").css("color") == "rgb(255, 0, 0)")
            jQuery("#payment_form tr:nth-child(11)").css("color", "black");
    });*/
    

    //catch submission
    //add error message to form
    //or
    //redirect to receipt page
    jQuery("#payment_form").bind("sub submit", function(){
    	$('#itemId').val(getUrlParameters()['itemId']);
        $('#price').val($('#input_form_price').val());
    	//event.preventDefault();
        console.log("submitted");
    });
    
    jQuery("#payment_price input").click(function(){
        jQuery("#payment_form").trigger("sub");
    });
    
    //change price
    jQuery("#analytics .entry:first input").change(function(){
        jQuery("#payment_price .pricing").html("$" + jQuery(this).val());
    });
    
    //load paid content
    api.getPaidItems(window.PUBLISHER_URL);
    
    //load statistics for content item
    //this is done in apihandler
    
    
    
}

function tryToInit() {
    try {
        var test = new ApiHandler();
        initAll();
    } catch (e) {
        setTimeout("tryToInit()", 100);
    }
}

///////////////////////////////////////////////////////////////////////////////
jQuery(document).ready(function($){
  tryToInit();
});

function getUrlParameters() {
	var map = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
	map[key] = value;
	});
	return map; 
	}