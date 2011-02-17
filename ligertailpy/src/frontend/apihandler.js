function ApiHandler() {
}

function debug(myObj) {
	var s = "";
	for (myKey in myObj){
		s+= "["+myKey +"] = "+myObj[myKey] + "\n";
	}
	alert(s);
}

function getDomain(url) {
  var clean_domain = url.match(/:\/\/(.[^/]+)/);
  if(clean_domain == null){
  	clean_domain = url.split('/');
  	return clean_domain[0].replace('www.','');
  }
  return clean_domain[1].replace('www.',''); 	
}

ApiHandler.prototype.onItemSubmitted = function(response) {
  // TODO: handle error case
  if (!window.submitForFree) {
	var item = jQuery.parseJSON(response.items[0]);
	window.location = "https://ligertailbackend.appspot.com/frontend/payment.html?itemId=" + item.id;
  }
  else{
	//sucks for the advertiser; will include payment url for item in submission email later on...
  }
}

ApiHandler.prototype.onPriceUpdated = function(response) {
	//debug(response);
	//receipt shown/emailed
	//console.log(repsonse);
}

ApiHandler.prototype.onGetOrderedItems = function(response) {
	//debug(response);
	
	var content = "";
	jQuery.each(response.items, function(i, item){ 
		var item_obj = jQuery.parseJSON(item);
		//console.log(item_obj);
		if(window.parameter["width"] == 600){
			content += '<div class="content" id="' + item_obj.id + '"><div class="close"><img src="images/button_close.png" width="18" height="18" alt="Delete" /></div><div class="image"><a href="' + item_obj.url +'"><img src="' + item_obj.thumbnailUrl + '" alt="Image" width="105" height="65" border="0" /></a></div><div class="text"><span class="source"><a href="' + item_obj.url + '">' + getDomain(item_obj.url) + '</a></span><span class="title"><a href="' + item_obj.url + '">' + item_obj.title + '</a></span><p>' + item_obj.description + '</p></div><!--div class="share"><a href="#"><img src="images/button_share.png" alt="Share" width="23" height="22" border="0" /></a></div---!></div>';
		}
		else{
			content += '<div class="content" id="' + item_obj.id + '"><div class="close"></div><div class="text"><span class="source">' + getDomain(item_obj.url) + '</span><span class="title"><a href="' + item_obj.url + '">' + item_obj.title + '</a></span><p><a href="#"></a></p></div><span class="close"><img src="images/button_close.png" alt="Delete" width="18" height="18" border="0" /></span><!--div class="share"><a href="#"><img src="images/button_share_2.png" alt="Share" width="16" height="16" border="0" /></a></div---!></div>';
		}
	});
	
	
	jQuery(".widget #header").after(content);
	
	//add in spot #
	//for text click: jQuery(this).parent().index();
	
	var interactions = [];
	// add events to content
	jQuery(".widget .content").bind("show", function(){
		jQuery(this).show("fast"); 
		//this is a view
		interactions[0] = {itemId: jQuery(this).attr('id'), statType: StatType.VIEWS};
		lgapi.submitUserInteraction(window.PUBLISHER_URL, interactions);
	});

	//update db, remove the current content, move stack up, & show more content
	jQuery(".widget .content .close").click(function(){
		//this is a close
		interactions[0] = {itemId: jQuery(this).parent().attr('id'), statType: StatType.CLOSES};
		lgapi.submitUserInteraction(window.PUBLISHER_URL, interactions);
		jQuery(this).parent().remove();
		jQuery(".widget .content:hidden").filter(":first").trigger("show");
	});
	
	//update db for click
	jQuery(".widget .content .text").click(function(){ 
		//this is a click
		interactions[0] = {itemId: jQuery(this).parent().attr('id'), statType: StatType.CLICKS};
		lgapi.submitUserInteraction(window.PUBLISHER_URL, interactions);
	});
	
	//update db for like
	jQuery(".widget .content .share").click(function(){ 
		//this is a like
		interactions[0] = {itemId: jQuery(this).parent().attr('id'), statType: StatType.LIKES};
		lgapi.submitUserInteraction(window.PUBLISHER_URL, interactions);
		
		alert("need to put in fb functionality");
	});
	
	// show the right number of content items
	jQuery(".widget .content:visible").hide();
	jQuery(".widget .content:lt(" + window.numItems + ")").trigger("show");
	
}

ApiHandler.prototype.onGetPaidItems = function(response) {
	//debug(response);
	//console.log(response);
      
    var content = "";
	jQuery.each(response.items, function(i, item){ 
		var item_obj = jQuery.parseJSON(item);
		//console.log(item_obj);		
		content += '<div class="entry" id="' + item_obj.id + '"><div class="pricing">$' + item_obj.price + '</div><div class="text"><span class="source">' + getDomain(item_obj.url) + '</span><span class="title">' + item_obj.title + '</span></div></div>';
		
		if(i == 0){
				jQuery("#analytics .entry:first input").val(item_obj.price + 1);
				jQuery("#payment_price .pricing").html("$" + (item_obj.price + 1));
		}
	});
	
	jQuery("#analytics .entry").after(content);
	
	jQuery("#analytics .entry").click(function(){
		lgapi.getItemStats(jQuery(this).attr("id"));
	});
}

ApiHandler.prototype.onUserInteractionSubmitted = function(response) {
	//debug(response);
}

ApiHandler.prototype.onGetFilter = function(response) {
	//debug(response);
}

ApiHandler.prototype.onFilterSubmitted = function(response) {
	//debug(response);
}

ApiHandler.prototype.onGetItemStats = function(response) {
	//debug(response);
	//console.log(response);
	
	jQuery.each(response.items, function(i, item){ 
		var item_obj = jQuery.parseJSON(item);
		//console.log(item_obj);		
	});
}
