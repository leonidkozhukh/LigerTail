function ApiHandler() {
}

function debug(myObj) {
	var s = "";
	for (myKey in myObj){
		s+= "["+myKey +"] = "+myObj[myKey] + "\n";
	}
	alert(s);
}

ApiHandler.prototype.onItemSubmitted = function(response) {
  debug(response);
}

ApiHandler.prototype.onPriceUpdated = function(response) {
	debug(response);
}

ApiHandler.prototype.onGetOrderedItems = function(response) {
	//debug(response);
	
	var content = "";
	jQuery.each(response.items, function(i, item){ 
		var item_obj = jQuery.parseJSON(item);
		console.log(item_obj);
		content += '<div class="content" id="' + item_obj.id + '"><div class="close"><img src="images/button_close.png" width="18" height="18" alt="Delete" /></div><div class="image"><a href="' + item_obj.url +'"><img src="' + item_obj.thumbnailURL + '" alt="Image" width="105" height="65" border="0" /></a></div><div class="text"><span class="source"><a href="' + item_obj.url + '">' + "domain" + '</a></span><span class="title"><a href="' + item_obj.url + '">' + item_obj.title + '</a></span><p>' + item_obj.description + '</p></div><div class="share"><a href="#"><img src="images/button_share.png" alt="Share" width="23" height="22" border="0" /></a></div></div>';
	});
	
	jQuery(".widget #header").after(content);
	
	var interactions = [];
	// add events to content
	jQuery(".widget .content").bind("show", function(){
		jQuery(this).show("fast"); 
		//this is a view
		interactions[0] = {itemId: jQuery(this).attr('id'), statType: StatType.VIEWS};
		api.submitUserInteraction(window.PUBLISHER_URL, interactions);
	});

	//update db, remove the current content, move stack up, & show more content
	jQuery(".widget .content .close").click(function(){
		//this is a close
		interactions[0] = {itemId: jQuery(this).parent().attr('id'), statType: StatType.CLOSES};
		api.submitUserInteraction(window.PUBLISHER_URL, interactions);
		jQuery(this).parent().remove();
		jQuery(".widget .content:hidden").filter(":first").trigger("show");
	});
	
	//update db for click
	jQuery(".widget .content .text").click(function(){ 
		//this is a click
		interactions[0] = {itemId: jQuery(this).parent().attr('id'), statType: StatType.CLICKS};
		api.submitUserInteraction(window.PUBLISHER_URL, interactions);
	});
	
	//update db for like
	jQuery(".widget .content .share").click(function(){ 
		//this is a like
		interactions[0] = {itemId: jQuery(this).parent().attr('id'), statType: StatType.LIKES};
		api.submitUserInteraction(window.PUBLISHER_URL, interactions);
		
		alert("need to put in fb functionality");
	});
	
	// show the right number of content items
	jQuery(".widget .content:lt(" + window.numItems + ")").trigger("show");
	
}

ApiHandler.prototype.onGetPaidItems = function(response) {
	debug(response);
	
	 //load items statistics on selection
                    api.getItemStats(window.PUBLISHER_URL, "");
}

ApiHandler.prototype.onUserInteractionSubmitted = function(response) {
	debug(response);
}

ApiHandler.prototype.onGetFilter = function(response) {
	debug(response);
}

ApiHandler.prototype.onFilterSubmitted = function(response) {
	debug(response);
}

ApiHandler.prototype.onGetItemStats = function(response) {
	debug(response);
}
