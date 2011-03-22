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
	var item = jQuery.parseJSON(response.items[0]);
	
	//remove last item from view to make room for the new submission
    jQuery(".ligertail_widget .ligertail_widget_content:eq(7)").hide();
                        
    //add content to widget
     if(window.parameter["width"] == 600){                                                          
          jQuery(".ligertail_widget #ligertail_widget_header").after('<div class="ligertail_widget_content" id="' + item.id + '" style="display:block;"><div class="ligertail_widget_close"><img src="../frontend/images/button_close.png" width="18" height="18" alt="Delete" /></div><div class="ligertail_widget_image"><a target="_blank" href="' + item.url +'"><img src="' + item.thumbnailUrl + '" alt="Image" width="105" height="65" border="0" /></a></div><div class="ligertail_widget_text"><div class="ligertail_widget_top_text"><span class="ligertail_widget_source"><a target="_blank" href="' + item.url + '">' + getDomain(item.url) + '</a></span><span class="ligertail_widget_title"><a target="_blank" href="' + item.url + '">' + item.title + '</a></span><div class="ligertail_widget_top_text"><p class="ligertail_widget_description">' + item.description + '</p></div></div>');
     }
     else{
          jQuery(".ligertail_widget #ligertail_widget_header").after('<div class="ligertail_widget_content" id="' + item.id + '" style="display:block;"><div class="ligertail_widget_text"><span class="ligertail_widget_source">' + getDomain(item.url) + '</span><span class="ligertail_widget_title"><a target="_blank" href="' + item.url + '">' + item.title + '</a></span></div><div class="close"><img src="../frontend/images/button_close.png" alt="Delete" width="18" height="18" border="0" /></div></div>');
     }													
														
														
  // TODO: handle error case
  if (!window.submitForFree) {
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
	//var url = domain + "/payment.html?itemId=" + item.id;
    
    // TODO : make sure it opens in a new window
	//document.location.href = url;
	alert(domain + "/payment.html?itemId=" + item.id);
	window.open(domain + "/payment.html?itemId=" + item.id);
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
	var interactions = [];
	jQuery.each(response.items, function(i, item){
		window.LIGERTAIL_ITEMS_LOADED++; 
		var item_obj = jQuery.parseJSON(item);
		
		if(window.parameter["width"] == 600){
			content += '<div class="ligertail_widget_content" id="' + item_obj.id + '"><div class="ligertail_widget_close" id="' + window.LIGERTAIL_ITEMS_LOADED + '"><img src="../frontend/images/button_close.png" width="18" height="18" alt="Delete" /></div><div class="ligertail_widget_image"><a target="_blank" href="' + item_obj.url +'"><img src="' + item_obj.thumbnailUrl + '" alt="Image" width="105" height="65" border="0" /></a></div><div class="ligertail_widget_text"><div class="ligertail_widget_top_text"><span class="ligertail_widget_source"><a target="_blank" href="' + item_obj.url + '">' + getDomain(item_obj.url) + '</a></span><span class="ligertail_widget_title"><a target="_blank" href="' + item_obj.url + '">' + item_obj.title + '</a></span></div><p class="ligertail_widget_description">' + item_obj.description + '</p></div></div>';
		}
		else{
			content += '<div class="ligertail_widget_content" id="' + item_obj.id + '"><div class="ligertail_widget_text"><span class="ligertail_widget_source">' + getDomain(item_obj.url) + '</span><span class="ligertail_widget_title"><a target="_blank" href="' + item_obj.url + '">' + item_obj.title + '</a></span></div><div class="ligertail_widget_close" id="' + window.LIGERTAIL_ITEMS_LOADED + '"><img src="../frontend/images/button_close.png" alt="Delete" width="18" height="18" border="0" /></div></div>';
		}
		
		interactions[i] = {itemId: item_obj.id, statType: StatType.VIEWS, spot: window.LIGERTAIL_ITEMS_LOADED};
	});
	
	if(content.length > 0){
		jQuery(".ligertail_widget .ligertail_widget_content:visible").hide();
		jQuery(".ligertail_widget #ligertail_widget_header").after(content);
		jQuery(".ligertail_widget .ligertail_widget_content:lt(" + window.numItems + ")").show();

		api.submitUserInteraction(window.PUBLISHER_URL, interactions);
		
		// add events to content
		jQuery(".ligertail_widget .ligertail_widget_content").bind("show", function(){
				jQuery(this).show("fast");
				//this is a view
				if(jQuery(this).attr('id') < 0){
					interactions[0] = {itemId: jQuery(this).attr('id'), statType: StatType.VIEWS, spot: jQuery(this).index()};
				}
				else{
					interactions[0] = {itemId: jQuery(this).attr('id'), statType: StatType.VIEWS, spot: jQuery(this).find(".ligertail_widget_close").attr('id')};
				}
				api.submitUserInteraction(window.PUBLISHER_URL, interactions);
		});

		//update db, remove the current content, move stack up, & show more content
		jQuery(".ligertail_widget .ligertail_widget_content .ligertail_widget_close").click(function(){
				//this is a close
				interactions[0] = {itemId: jQuery(this).parent().attr('id'), statType: StatType.CLOSES, spot: jQuery(this).attr('id')};
				api.submitUserInteraction(window.PUBLISHER_URL, interactions);
				jQuery(this).parent().remove();
				jQuery(".ligertail_widget .ligertail_widget_content:hidden").filter(":first").trigger("show");
		});
	
		//update db for click
		jQuery(".ligertail_widget .ligertail_widget_content .ligertail_widget_title").click(function(){ 
				//this is a click
				interactions[0] = {itemId: jQuery(this).parent().parent().attr('id'), statType: StatType.CLICKS, spot: jQuery(this).parent().parent().find(".ligertail_widget_close").attr('id')}; 
				api.submitUserInteraction(window.PUBLISHER_URL, interactions);
		});
	
		//update db for like
		/*jQuery(".ligertail_widget .ligertail_widget_content .ligertail_widget_share").click(function(){ 
				//this is a like
				interactions[0] = {itemId: jQuery(this).parent().attr('id'), statType: StatType.LIKES, spot: jQuery(this).parent().attr('id').find(".ligertail_widget_close").attr('id')};
				api.submitUserInteraction(window.PUBLISHER_URL, interactions);
		
				alert("need to put in fb functionality");
		});*/
	}	
}

ApiHandler.prototype.onGetPaidItems = function(response) {
	var content = "";
	jQuery.each(response.items, function(i, item){ 
		var item_obj = jQuery.parseJSON(item);
		//console.log(item_obj);		
		content += '<div class="entry" id="' + item_obj.id + '"><div class="pricing">$' + item_obj.price + '</div><div class="text"><span class="source">' + getDomain(item_obj.url) + '</span><span class="title">' + item_obj.title + '</span></div></div>';
		
		if(i == 0){
				jQuery("#analytics .your_entry:first input").val(item_obj.price + 1);
				jQuery("#payment_price .pricing").html("$" + (item_obj.price + 1));
		}
	});
	
	jQuery("#analytics .your_entry").after(content);
	jQuery("#graphs #type option:last").attr('disabled', "");
	
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
		content = '<div class="your_entry"><div class="pricing">$<input size="5" type="text" class="input_form_price" id="input_form_price" value="0" /></div><div class="text"><span class="source">' + getDomain(item_obj.url) + '</span><span class="title">' + item_obj.title + '</span></div><span class="close"><img src="../frontend/images/button_close.png" alt="Delete" width="18" height="18" border="0" /></span></div>';
		//console.log(item_obj);
		
		window.publisherUrl = item_obj.publisherUrl;
		window.PUBLISHER_URL = item_obj.publisherUrl;										
	});													
	
	jQuery("#analytics").append(content);
	
	//change price
    jQuery("#analytics .your_entry:first input").change(function(){ 
        jQuery("#payment_price .pricing").html("$" + jQuery(this).val());
    });
	
	api.getPaidItems(window.PUBLISHER_URL);
	api.getPublisherSiteStats(window.PUBLISHER_URL);
	api.getSpotStats(1, window.PUBLISHER_URL);
}

ApiHandler.prototype.onGetItemStats = function(response) {
	//console.log(response);

	jQuery("#graphs h3").after('item: <select id="item_metric"><option value="1">views</option><option value="2">clicks</option><option value="3">closes</option><option value="0">uniques</option></select><select id="item_duration"><option value="mm">minutely</option><option value="hh">hourly</option><option value="DD">daily</option><option value="MM">monthly</option><option value="YY">yearly</option></select>');
	jQuery.each(response.items, function(i, item){ 
		var item_obj = jQuery.parseJSON(item);
		console.log(item_obj);
		var data = ApiHandler.parseStats_(item_obj);
		
		jQuery("#graphs #item_metric").change(function(){
			so.addVariable("additional_chart_settings", "<settings><values><y_left><duration>" + jQuery("#graphs #item_duration").val() + "</duration></y_left></values></settings>");
			so.addVariable("chart_data", data[dur[jQuery("#graphs #item_duration").val()]][jQuery(this).val()]);                                       // you can pass chart data as a string directly from this file
			so.write("flashcontent");
		});
		
		jQuery("#graphs #item_duration").change(function(){
			so.addVariable("additional_chart_settings", "<settings><values><y_left><duration>" + jQuery(this).val() + "</duration></y_left></values></settings>");
			so.addVariable("chart_data", data[dur[jQuery(this).val()]][jQuery("#graphs #item_metric").val()]);                                       // you can pass chart data as a string directly from this file
			so.write("flashcontent");
		});
	});
	
}

ApiHandler.prototype.onGetSpotStats = function(response) { 
	jQuery("#graphs h3").after('spot: <select id="spot_metric"><option value="1">views</option><option value="2">clicks</option><option value="3">closes</option><option value="0">uniques</option></select><select id="spot_duration"><option value="mm">minutely</option><option value="hh">hourly</option><option value="DD">daily</option><option value="MM">monthly</option><option value="YY">yearly</option></select>');													
	jQuery.each(response.spots, function(i, spot){ 
		var spot_obj = jQuery.parseJSON(spot);
		var data = ApiHandler.parseStats_(spot_obj);
		
		jQuery("#graphs #spot_metric").change(function(){
			so.addVariable("additional_chart_settings", "<settings><values><y_left><duration>" + jQuery("#graphs #spot_duration").val() + "</duration></y_left></values></settings>");
			so.addVariable("chart_data", data[dur[jQuery("#graphs #spot_duration").val()]][jQuery(this).val()]);                                       // you can pass chart data as a string directly from this file
			so.write("flashcontent");
		});
		
		jQuery("#graphs #spot_duration").change(function(){
			so.addVariable("additional_chart_settings", "<settings><values><y_left><duration>" + jQuery(this).val() + "</duration></y_left></values></settings>");
			so.addVariable("chart_data", data[dur[jQuery(this).val()]][jQuery("#graphs #spot_metric").val()]);                                       // you can pass chart data as a string directly from this file
			so.write("flashcontent");
		});							
	});
}


ApiHandler.prototype.onGetPublisherSiteStats = function(response) {
	jQuery("#graphs h3").after('publisherUrl: <select id="site_metric"><option value="1">views</option><option value="2">clicks</option><option value="3">closes</option><option value="0">uniques</option></select><select id="site_duration"><option value="mm">minutely</option><option value="hh">hourly</option><option value="DD">daily</option><option value="MM">monthly</option><option value="YY">yearly</option></select>');													
	jQuery.each(response.publisherSites, function(i, site){ 
		var site_obj = jQuery.parseJSON(site); console.log(site_obj);
		var data = ApiHandler.parseStats_(site_obj);
		
		jQuery("#graphs #site_metric").change(function(){
			so.addVariable("additional_chart_settings", "<settings><values><y_left><duration>" + jQuery("#graphs #site_duration").val() + "</duration></y_left></values></settings>");
			so.addVariable("chart_data", data[dur[jQuery("#graphs #site_duration").val()]][jQuery(this).val()]);                                       // you can pass chart data as a string directly from this file
			so.write("flashcontent");
		});
		
		jQuery("#graphs #site_duration").change(function(){
			so.addVariable("additional_chart_settings", "<settings><values><y_left><duration>" + jQuery(this).val() + "</duration></y_left></values></settings>");
			so.addVariable("chart_data", data[dur[jQuery(this).val()]][jQuery("#graphs #site_metric").val()]);                                       // you can pass chart data as a string directly from this file
			so.write("flashcontent");
		});							
	});
}

ApiHandler.parseStats_ = function(obj) {	
	var data = {0:["", "", "", ""], 1:["", "", "", ""], 2:["", "", "", ""], 3:["", "", "", ""], 4:["", "", "", ""]};
	var idMap = [0,1,2,4];
	for(var m = 0; m < 5; m++){ 
			for(var n = 1; n <= DurationInfo[m].length; n++){
				o = obj.timedStats[m][n];
				for (var i = 0; i < idMap.length; i++) {
					data[m][i] += n + ';' + (o[idMap[n]] != null ? o[idMap[n]] : 0) + '\n'; 
				}
			}
	}
	console.log(data);	
	return data;
}