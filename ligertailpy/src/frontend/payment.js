// TEST Stripe.setPublishableKey('pk_HnDpFzcf4dcUzd5V5g9cOJLIgSG6X');
Stripe.setPublishableKey('pk_aIec5diplKCBrBpQ5vMAXSt3LEVnL');
function stripeResponseHandler(status, response) {
    if (response.error) {
       // re-enable the submit button
       $('.input-submit').removeAttr("disabled");
       // show the errors on the form
       $("#payFormMessage").html(response.error.message);
    } else {
       var form$ = $("#payment-form");
       // token contains id, last4, and card type
       var token = response['id'];
       var price = jQuery("#payForm #pay_amount").val();
       var email = jQuery("#payForm #pay_email").val();
       var itemId = getUrlParameters()['itemId'];
       var paymentInfo = {
               "price": price,
               "email": email,
               "token": token,
               "itemId": itemId
               };

       // insert the token into the form so it gets submitted to the server
       // form$.append("<input type='hidden' name='stripeToken' value='" + token + "' />");
       // and submit
       api.updatePrice2(paymentInfo);

       // this should be UpdatePrice2 API call
       //form$.get(0).submit();
    }
}

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
  var apiHandler = new ApiHandler(LTApi.getDefaultDomain(), jQuery);
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
};



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
                // disable the submit button to prevent repeated clicks
	            $('.input-submit').attr("disabled", "disabled");
	            // createToken returns immediately - the supplied callback submits the form if there are no errors
	            var cc = jQuery ("#payForm #pay_cc_number").val();
                var expiration_month = jQuery("#payForm #pay_card_expiration_month").val();
                var expiration_year = jQuery("#payForm #pay_card_expiration_year").val();
                var cvs = jQuery("#payForm #pay_cvs").val();

		      	Stripe.createToken({
		      	      number: cc,
		      	      cvc: cvs,
		      	      exp_month: expiration_month,
		      	      exp_year: expiration_year
		      	}, stripeResponseHandler);
		      	return false; // submit from callback
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
	    api.getItemStats(urlParams['itemId'], InfoType.FULL, 'ApiHandler.prototype.onGetItemInfo');
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

