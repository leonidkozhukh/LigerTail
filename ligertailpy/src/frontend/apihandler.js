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
	var domain = "";
	if (window.document.location.hostname == "localhost") {
		domain = "http://" + window.document.location.hostname;		
	    if (window.document.location.port) {
		    domain += ":" + window.document.location.port;
		}
	} else {
		domain = "https://ligertailbackend.appspot.com";
	}
    // var url = domain + "/frontend/payment.html?itemId=" + item.id;
	var url = domain + "/payment.html?itemId=" + item.id;
    
    // TODO : make sure it opens in a new window
	document.location.href = url;
	//window.open(domain + "/frontend/payment.html?itemId=" + item.id);
  }
  else{
	//sucks for the advertiser; will include payment url for item in submission email later on...
  }
}

ApiHandler.prototype.onPriceUpdated = function(response) {
	//receipt shown/emailed
	console.log(response);
}

ApiHandler.prototype.onGetOrderedItems = function(response) {
	var content = "";
	jQuery.each(response.items, function(i, item){ 
		var item_obj = jQuery.parseJSON(item);
		
		if(window.parameter["width"] == 600){
			content += '<div class="ligertail_widget_content" id="' + item_obj.id + '"><div class="ligertail_widget_close"><img src="../frontend/images/button_close.png" width="18" height="18" alt="Delete" /></div><div class="ligertail_widget_image"><a target="_blank" href="' + item_obj.url +'"><img src="' + item_obj.thumbnailUrl + '" alt="Image" width="105" height="65" border="0" /></a></div><div class="ligertail_widget_text"><span class="ligertail_widget_source"><a target="_blank" href="' + item_obj.url + '">' + getDomain(item_obj.url) + '</a></span><span class="ligertail_widget_title"><a target="_blank" href="' + item_obj.url + '">' + item_obj.title + '</a></span><p>' + item_obj.description + '</p></div></div>';
		}
		else{
			content += '<div class="ligertail_widget_content" id="' + item_obj.id + '"><div class="ligertail_widget_text"><span class="ligertail_widget_source">' + getDomain(item_obj.url) + '</span><span class="ligertail_widget_title"><a target="_blank" href="' + item_obj.url + '">' + item_obj.title + '</a></span></div><div class="ligertail_widget_close"><img src="../frontend/images/button_close.png" alt="Delete" width="18" height="18" border="0" /></div></div>';
		}
	});
	
	if(content.length > 0){
		jQuery(".ligertail_widget #ligertail_widget_header").after(content);
	
	//add in spot #
	//for text click: jQuery(this).parent().index();
	
	var interactions = [];
	// add events to content
	jQuery(".ligertail_widget .ligertail_widget_content").bind("show", function(){
		jQuery(this).show("fast"); console.log(jQuery(this).attr('id'));
		//this is a view
		interactions[0] = {itemId: jQuery(this).attr('id'), statType: StatType.VIEWS};
		api.submitUserInteraction(window.PUBLISHER_URL, interactions);
	});

	//update db, remove the current content, move stack up, & show more content
	jQuery(".ligertail_widget .ligertail_widget_content .ligertail_widget_close").click(function(){
		//this is a close
		interactions[0] = {itemId: jQuery(this).parent().attr('id'), statType: StatType.CLOSES};
		api.submitUserInteraction(window.PUBLISHER_URL, interactions);
		jQuery(this).parent().remove();
		jQuery(".ligertail_widget .ligertail_widget_content:hidden").filter(":first").trigger("show");
	});
	
	//update db for click
	jQuery(".ligertail_widget .ligertail_widget_content .ligertail_widget_title").click(function(){ 
		//this is a click
		interactions[0] = {itemId: jQuery(this).parent().attr('id'), statType: StatType.CLICKS};
		api.submitUserInteraction(window.PUBLISHER_URL, interactions);
	});
	
	//update db for like
	/*jQuery(".ligertail_widget .ligertail_widget_content .ligertail_widget_share").click(function(){ 
		//this is a like
		interactions[0] = {itemId: jQuery(this).parent().attr('id'), statType: StatType.LIKES};
		api.submitUserInteraction(window.PUBLISHER_URL, interactions);
		
		alert("need to put in fb functionality");
	});*/
	
	// show the right number of content items
	jQuery(".ligertail_widget .ligertail_widget_content:visible").hide();
	jQuery(".ligertail_widget .ligertail_widget_content:lt(" + window.numItems + ")").trigger("show");
	}
	
}

ApiHandler.prototype.onGetPaidItems = function(response) {
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
		api.getItemStats(jQuery(this).attr("id"), 2);
	});
}

ApiHandler.prototype.onUserInteractionSubmitted = function(response) {
	
}

ApiHandler.prototype.onGetFilter = function(response) {
	
}

ApiHandler.prototype.onFilterSubmitted = function(response) {
	
}

ApiHandler.prototype.onGetItemInfo = function(response) {
	var content;
	jQuery.each(response.items, function(i, item){
		var item_obj = jQuery.parseJSON(item);
		content = '<div class="entry"><div class="pricing">$<input size="5" type="text" class="input_form_price" id="input_form_price" value="0" /></div><div class="text"><span class="source">' + getDomain(item_obj.url) + '</span><span class="title">' + item_obj.title + '</span></div><span class="close"><img src="../frontend/images/button_close.png" alt="Delete" width="18" height="18" border="0" /></span></div>';
		console.log(item_obj);
		
		window.publisherUrl = item_obj.publisherUrl;
		window.PUBLISHER_URL = item_obj.publisherUrl;										
	});													
	
	jQuery("#analytics").append(content);
	
	api.getPaidItems(window.PUBLISHER_URL);
	
}

ApiHandler.prototype.onGetItemStats = function(response) {
	//console.log(response);
	//var scope = ["uniques", "eternity"];
	//jQuery("#table-gen tr:first td:contains(" + scope[0] + ")").css("color", "red");
	//jQuery("#table-gen tr:first td:contains(" + scope[1] + ")").css("color", "red");
	
	var data = {0:["", "", "", ""], 1:["", "", "", ""], 2:["", "", "", ""], 3:["", "", "", ""], 4:["", "", "", ""], 5:["", "", "", ""]};
	jQuery.each(response.items, function(i, item){ 
		var item_obj = jQuery.parseJSON(item);
		console.log(item_obj);
		
		//data += '<tr>' + '<td>' + item_obj.totalStats[0] + '</td>' + '<td>' + item_obj.totalStats[1] + '</td>' + '<td>' + item_obj.totalStats[2] + '</td>' + '<td>' + item_obj.totalStats[4] + '</td>' +  '</tr>';
		
		
		for(var m = 0; m < 6; m++){
				for(var n = 0; n < item_obj.durationInfo[reverseDuration[m]].num_deltas; n++){ 
						data[m][0] += item_obj.timedStats[m][n][0] + ';'; 
						data[m][1] += item_obj.timedStats[m][n][1] + ';';
						data[m][2] += item_obj.timedStats[m][n][2] + ';';
						data[m][3] += item_obj.timedStats[m][n][4] + ';';
				}
		}
		
		console.log(data);
	});
	
}
