
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
  var apiHandler = new ApiHandler(LTApi.getDefaultDomain());
  window.api = new LTApi();
  api.init(apiHandler);
  window.publisherUrl = publisherUrl;
}

function showGraph(scope, id, analytics, duration){
    if(scope != null && id != null){
        so.addVariable("chart_data", window.analytics_data[scope][id][dur[duration]][analytics]); 
        
        jQuery("#paramScope option:[value='" + scope + "']").attr('selected', 'selected');
        jQuery("#paramAnalytics option:[value='" + analytics + "']").attr('selected', 'selected');
        jQuery("#paramDuration option:[value='" + duration + "']").attr('selected', 'selected');
    }
    else{  //console.log({'scope': scope, 'id': id, 'analytics': analytics, 'duration': duration});
         //error message
    }
    so.write("flashcontent");
}

function openPaymentLightbox(id){                
    jQuery.facebox(function(){             
        jQuery(document).bind('reveal.facebox', function(event){ 
            //fill in $ amount                                                
            jQuery("#pay_amount").val(jQuery(".rbody .row-first input").val().replace('$', ''));                                               
        
            //form validation
            //load credit card validation
            //$ amount
            jQuery("#payForm #pay_amount").blur(function(){
                if(jQuery(this).val() > 0)
                    jQuery("#payForm .row:eq(0) label").css("color", "red");
                else if(jQuery("#payForm .row:eq(0) label").css("color") == "rgb(255, 0, 0)")
                    jQuery("#payForm .row:eq(0) label").css("color", "gray");
            });
    
            //email
            jQuery("#payForm #pay_email").blur(function(){
                if(!ValidateEmail(jQuery(this).val()))
                    jQuery("#payForm .row:eq(1) label").css("color", "red");
                else if(jQuery("#payForm .row:eq(1) label").css("color") == "rgb(255, 0, 0)")
                    jQuery("#payForm .row:eq(1) label").css("color", "gray");
            });
    
            //first
            jQuery("#payForm #pay_first_name").blur(function(){
                if(jQuery(this).val().length == 0)
                    jQuery("#payForm .row:eq(2) label").css("color", "red");
                else if(jQuery("#payForm .row:eq(2) label").css("color") == "rgb(255, 0, 0)")
                    jQuery("#payForm .row:eq(2) label").css("color", "gray");
            });
            
            //last
            jQuery("#payForm #pay_last_name").blur(function(){
                if(jQuery(this).val().length == 0)
                    jQuery("#payForm .row:eq(3) label").css("color", "red");
                else if(jQuery("#payForm .row:eq(3) label").css("color") == "rgb(255, 0, 0)")
                    jQuery("#payForm .row:eq(3) label").css("color", "gray");
            });
    
            //address
            jQuery("#payForm #pay_address").blur(function(){
                if(jQuery(this).val().length == 0)
                    jQuery("#payForm .row:eq(4) label").css("color", "red");
                else if(jQuery("#payForm .row:eq(4) label").css("color") == "rgb(255, 0, 0)")
                    jQuery("#payForm .row:eq(4) label").css("color", "gray");
            });
    
            //city
            jQuery("#payForm #pay_city").blur(function(){
                if(jQuery(this).val().length == 0)
                    jQuery("#payForm .row:eq(5) label").css("color", "red");
                else if(jQuery("#payForm .row:eq(5) label").css("color") == "rgb(255, 0, 0)")
                    jQuery("#payForm .row:eq(5) label").css("color", "gray");
            });
    
            //state
            jQuery("#payForm #pay_state").blur(function(){
                if(jQuery(this).val().length != 2)
                    jQuery("#payForm .row:eq(6) label").css("color", "red");
                else if(jQuery("#payForm .row:eq(6) label").css("color") == "rgb(255, 0, 0)")
                    jQuery("#payForm .row:eq(6) label").css("color", "gray");
            });
    
            //zip
            jQuery("#payForm #pay_zip").blur(function(){
                if(jQuery(this).val() > 100000 || jQuery(this).val().length != 5)
                    jQuery("#payForm .row:eq(7) label").css("color", "red");
                else if(jQuery("#payForm .row:eq(7) label").css("color") == "rgb(255, 0, 0)")
                    jQuery("#payForm .row:eq(7) label").css("color", "gray");
            });
    
            //cc #
            jQuery("#payForm #pay_cc_number").blur(function(){
                if(jQuery(this).val().length != 16)
                    jQuery("#payForm .row:eq(8) label").css("color", "red");
                else if(jQuery("#payForm .row:eq(8) label").css("color") == "rgb(255, 0, 0)")
                    jQuery("#payForm .row:eq(8) label").css("color", "gray");
            });
    
            //exp
            jQuery("#payForm #pay_card_expiration_month").blur(function(){
                if(jQuery(this).val().length == 0)
                    jQuery("#payForm .row:eq(9) label").css("color", "red");
                else if(jQuery("#payForm .row:eq(9) label").css("color") == "rgb(255, 0, 0)")
                    jQuery("#payForm .row:eq(9) label").css("color", "gray");
            });
    
            jQuery("#payForm #pay_card_expiration_year").blur(function(){
                if(jQuery(this).val().length != 4)
                    jQuery("#payForm .row:eq(10) label").css("color", "red");
                else if(jQuery("#payForm .row:eq(10) label").css("color") == "rgb(255, 0, 0)")
                    jQuery("#payForm .row:eq(10) label").css("color", "gray");
            });
    
            //cvs
            jQuery("#payForm #pay_cvs").blur(function(){
                if(jQuery(this).val().length != 3)
                    jQuery("#payForm .row:eq(11) label").css("color", "red");
                else if(jQuery("#payForm .row:eq(11) label").css("color") == "rgb(255, 0, 0)")
                    jQuery("#payForm .row:eq(11) label").css("color", "gray");
            });
    

            //catch submission
            //add error message to form
            jQuery("#payForm").submit(function(event){
                event.preventDefault();
        
                var price = jQuery("#payForm #pay_amount").val();
                var email = jQuery("#payForm #pay_email").val();
                var first_name = jQuery("#payForm #pay_first_name").val();
                var last_name = jQuery("#payForm #pay_last_name").val();
                var address = jQuery("#payForm #pay_address").val();
                var city = jQuery("#payForm #pay_city").val();
                var state = jQuery("#payForm #pay_state").val();
                var zip = jQuery("#payForm #pay_zip").val();
                var cc = jQuery ("#payForm #pay_cc_number").val();
                var expiration_month = jQuery("#payForm #pay_card_expiration_month").val();
                var expiration_year = jQuery("#payForm #pay_card_expiration_year").val();
                var cvs = jQuery("#payForm #pay_cvs").val();
        
                if(price > 0 && ValidateEmail(email) && first_name.length > 0 && last_name.length > 0 && 
                   address.length > 0 && city.length > 0 && state.length == 2 && 
                   zip.length == 5 && cc.length == 16 && expiration_month.length > 0 && 
                   expiration_year.length == 4 && cvs. length == 3){
                                                              
                        //disable form & show waiting dialog, then submit
                        jQuery("#payForm .last-row input").hide();
                        jQuery("#payForm .last-row .message").html('Approving your purchase, please be patient...');
          
                        var paymentInfo = {
                           "price": price,
                           "email": email,
                           "first_name": first_name,
                           "last_name": last_name,
                           "itemId": id,
                           "address": address,
                           "city": city,
                           "state": state,
                           "zip": zip, 
                           "cc": cc,
                           "expiration": expiration_month + '/' + expiration_year,
                           "cvs": cvs,                      
                           };
             
                        api.updatePrice(paymentInfo);    
                    }
                   else{
                        //show errors
                        jQuery("#payForm input, select").trigger('blur');
                    }
            });
        });
        
        jQuery.facebox({ ajax: "payment_form.html"});              
    });                                                    
}
$(document).ready(function(){

	window.PUBLISHER_URL = window.document.location.href;

	//initialize communication with ligertail
	init(window.PUBLISHER_URL);
	var urlParams = getUrlParameters();
	if(urlParams['itemId'])
	    api.getItemStats(urlParams['itemId'], 0, 'ApiHandler.prototype.onGetItemInfo');
	else{
	    // so.amError('flashcontent', 'No itemId set!');
	    // so.write('flashcontent');
	}
	    
	    //so.addVariable("additional_chart_settings", "");

	jQuery("#payFormSwitch").click(function(){
	        openPaymentLightbox(urlParams['itemId']);                                
	});

	jQuery(".rbody .row-first input").live('keypress', function(event){
	    if(event.keyCode == 13)
	        openPaymentLightbox(urlParams['itemId']);
	});
	    
});
