var LGDOMAIN;
function ApiHandler(domain) {
  LGDOMAIN = domain;
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

function checkLink(url) {
   if(url.indexOf("http://") == -1 && url.indexOf("https://") == -1)
	   return "http://" + url;	
   else
   	   return url;
}

ApiHandler.prototype.onItemSubmitted = function(response) {					
	var item = jQuery.parseJSON(response.items[0]);
	
	//remove last item from view to make room for the new submission
    jQuery(".ligertail_widget .ligertail_widget_content:eq(7)").hide();
                        
    //add content to widget
     if(window.parameter["width"] == 600){                                                          
          jQuery(".ligertail_widget #ligertail_widget_header").after('<div class="ligertail_widget_content" id="' + item.id + '" style="display:block;"><div class="ligertail_widget_close"><img src=' + LGDOMAIN + '/frontend/images/button_close.png" width="18" height="18" alt="Delete" /></div><div class="ligertail_widget_image"><a target="_blank" href="' + checkLink(item.url) +'"><img src="' + item.thumbnailUrl + '" alt="Image" width="105" height="65" border="0" /></a></div><div class="ligertail_widget_text"><div class="ligertail_widget_top_text"><span class="ligertail_widget_source">' + getDomain(item.url) + '</span><span class="ligertail_widget_title"><a target="_blank" href="' + checkLink(item.url) + '">' + item.title + '</a></span><div class="ligertail_widget_top_text"><p class="ligertail_widget_description">' + item.description + '</p></div></div>');
     }
     else{
          jQuery(".ligertail_widget #ligertail_widget_header").after('<div class="ligertail_widget_content" id="' + item.id + '" style="display:block;"><div class="ligertail_widget_text"><span class="ligertail_widget_source">' + getDomain(item.url) + '</span><span class="ligertail_widget_title"><a target="_blank" href="' + checkLink(item.url) + '">' + item.title + '</a></span></div><div class="close"><img src="' + LGDOMAIN + '/frontend/images/button_close.png" alt="Delete" width="18" height="18" border="0" /></div></div>');
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
		domain = LGDOMAIN;
		domain = domain.replace('http://', 'https://');
	}
	var url = domain + "/payment.html?itemId=" + item.id;
    // TODO : make sure it opens in a new window
	document.location.href = url;
  }
  else{
	//sucks for the advertiser; will include payment url for item in submission email later on...
  }
}

ApiHandler.prototype.onPriceUpdated = function(response) {
	//console.log(response);
}

ApiHandler.prototype.onGetOrderedItems = function(response) {
	var content = "";
	var interactions = [];
	jQuery.each(response.items, function(i, item){
		window.LIGERTAIL_ITEMS_LOADED++; 
		var item_obj = jQuery.parseJSON(item);
		
		if(window.parameter["width"] == 600){
			content += '<div class="ligertail_widget_content" id="' + item_obj.id + '"><div class="ligertail_widget_close" id="' + window.LIGERTAIL_ITEMS_LOADED + '"><img src="' + LGDOMAIN + '/frontend/images/button_close.png" width="18" height="18" alt="Delete" /></div><div class="ligertail_widget_image"><a target="_blank" href="' + checkLink(item_obj.url) +'"><img src="' + item_obj.thumbnailUrl + '" alt="Image" width="105" height="65" border="0" /></a></div><div class="ligertail_widget_text"><div class="ligertail_widget_top_text"><span class="ligertail_widget_source">' + getDomain(item_obj.url) + '</span><span class="ligertail_widget_title"><a target="_blank" href="' + checkLink(item_obj.url) + '">' + item_obj.title + '</a></span></div><p class="ligertail_widget_description">' + item_obj.description + '</p></div></div>';
		}
		else{
			content += '<div class="ligertail_widget_content" id="' + item_obj.id + '"><div class="ligertail_widget_text"><span class="ligertail_widget_source">' + getDomain(item_obj.url) + '</span><span class="ligertail_widget_title"><a target="_blank" href="' + checkLink(item_obj.url) + '">' + item_obj.title + '</a></span></div><div class="ligertail_widget_close" id="' + window.LIGERTAIL_ITEMS_LOADED + '"><img src="' + LGDOMAIN + '/frontend/images/button_close.png" alt="Delete" width="18" height="18" border="0" /></div></div>';
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
				var interaction = [];
				//this is a view
				if(jQuery(this).attr('id') < 0){
					interaction[0] = {itemId: jQuery(this).attr('id'), statType: StatType.VIEWS, spot: jQuery(this).index()};
				}
				else{
					interaction[0] = {itemId: jQuery(this).attr('id'), statType: StatType.VIEWS, spot: jQuery(this).find(".ligertail_widget_close").attr('id')};
				}
				api.submitUserInteraction(window.PUBLISHER_URL, interaction);
		});

		//update db, remove the current content, move stack up, & show more content
		jQuery(".ligertail_widget .ligertail_widget_content .ligertail_widget_close").click(function(){
				//this is a close
				var interaction = [];
				interaction[0] = {itemId: jQuery(this).parent().attr('id'), statType: StatType.CLOSES, spot: jQuery(this).attr('id')};
				api.submitUserInteraction(window.PUBLISHER_URL, interaction);
				jQuery(this).parent().remove();
				jQuery(".ligertail_widget .ligertail_widget_content:hidden").filter(":first").trigger("show");
		});
	
		//update db for click
		jQuery(".ligertail_widget .ligertail_widget_content .ligertail_widget_title").click(function(){ 
				//this is a click
				var interaction = [];
				interaction[0] = {itemId: jQuery(this).parent().parent().attr('id'), statType: StatType.CLICKS, spot: jQuery(this).parent().parent().find(".ligertail_widget_close").attr('id')}; 
				api.submitUserInteraction(window.PUBLISHER_URL, interaction);
		});
	
		//update db for like
		/*jQuery(".ligertail_widget .ligertail_widget_content .ligertail_widget_share").click(function(){ 
				//this is a like
				var interaction = [];
				interaction[0] = {itemId: jQuery(this).parent().attr('id'), statType: StatType.LIKES, spot: jQuery(this).parent().attr('id').find(".ligertail_widget_close").attr('id')};
				api.submitUserInteraction(window.PUBLISHER_URL, interaction);
		
				alert("need to put in fb functionality");
		});*/
	}	
}

ApiHandler.prototype.onGetPaidItems = function(response) {
	var content = "";
	jQuery.each(response.items, function(i, item){ 
		var item_obj = jQuery.parseJSON(item);
				//console.log(item_obj);
		content +=			'<div class="row" id="' + item_obj.id + '">' +
                                '<div class="cell col-link s-control"><div class="data-entry r-indent"><span class="num">' + (i+1) + '</span><div class="text">' + getDomain(item_obj.url) + '/ ' + item_obj.title + '</div><a class="close"></a></div></div>' +
                                '<div class="cell col-price"><div class="data-entry data-price r-indent"><div class="bulb s-input-text-rate"><div class="c">$' + item_obj.price  + '</div><div class="l"></div></div></div></div>' +
                                '<div class="cell col-startDate"><div class="data-entry">' +
									'<div class="interact-hide"></div>' +
									'<div class="interact-show"><span class="note">Please enter the amount you would like to pay for placement and then press Return</span> </div>' +
								'</div></div>' +
								'<div class="cell col-views"><div class="data-entry"></div></div>' +
                                '<div class="cell col-clicks"><div class="data-entry"></div></div>' +
                                '<div class="cell col-closes"><div class="data-entry"></div></div>' +
                                '<div class="cell col-engagement"><div class="data-entry"></div></div>' +
                                '<div class="veneer"></div>' +

                                '<div class="col-holder col-holder-link col-s"><div class="inner"></div></div>' +
                                '<div class="col-holder col-holder-link-strut"><div class="inner"></div></div>' +
                                '<div class="col-holder col-holder-price col-b b-separate"><div class="inner"><div class="inner2"></div></div></div>' +
                                '<div class="col-holder col-holder-price-strut"><div class="inner"></div></div>' +
                                '<div class="col-holder col-holder-startDate col-b"><div class="inner"></div></div>' +
                                '<div class="col-holder col-holder-views col-b"><div class="inner"></div></div>' +
                                '<div class="col-holder col-holder-clicks col-b"><div class="inner"></div></div>' +
                                '<div class="col-holder col-holder-closes col-b"><div class="inner"></div></div>' +
                                '<div class="col-holder col-holder-engagement col-b"><div class="inner"><div class="inner2"></div></div></div>' +
                            '</div>';
		if(i == 0)
				jQuery(".rbody .row:first input").val('$' + (item_obj.price + 1));
		
		api.getItemStats(item_obj.id, 2);
		api.getSpotStats((i+1), window.PUBLISHER_URL);
	});
	
	jQuery(".rbody .row").after(content);
	jQuery(".rbody .row:last").addClass("row-last");
	
	jQuery(".rbody .row:gt(0)").click(function(event){
		if(jQuery(event.target).hasClass('num')){
			jQuery("#paramScope option:[value='spots']").attr('id', jQuery(event.target).html());
			showGraph("spots", jQuery(event.target).html(), jQuery("#paramAnalytics").val(), jQuery("#paramDuration").val());
		}
		else{
			jQuery("#paramScope option:[value='items']").attr('id', jQuery(this).attr('id'));
			showGraph("items", jQuery(this).attr('id'), jQuery("#paramAnalytics").val(), jQuery("#paramDuration").val());			
		}							
	});
	
	
	jQuery(".rbody .row:gt(0)").hover(function(){
			jQuery(this).addClass("row-hover");
		},
		function(){
			jQuery(this).removeClass("row-hover");
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
		
		content =			'<div class="row row-first row-active">' +
                                '<div class="cell col-link s-control"><div class="data-entry r-indent"><span class="num"></span><div class="text">' + getDomain(item_obj.url) + '/ ' + item_obj.title + '</div><a class="close"></a></div></div>' +
                                '<div class="cell col-price"><div class="data-entry data-price r-indent"><div class="bulb s-input-text-rate"><div class="c"><input type="text" value="$1" /></div><div class="l"></div></div></div></div>' +
                                '<div class="cell col-startDate"><div class="data-entry">' +
									'<div class="interact-hide"></div>' +
									'<div class="interact-show"><span class="note">Please enter the amount you would like to pay for placement and then press Return</span> </div>' +
								'</div></div>' +
								'<div class="cell col-views"><div class="data-entry"></div></div>' +
                                '<div class="cell col-clicks"><div class="data-entry"></div></div>' +
                                '<div class="cell col-closes"><div class="data-entry"></div></div>' +
                                '<div class="cell col-engagement"><div class="data-entry"></div></div>' +
                                '<div class="veneer"></div>' +

                                '<div class="col-holder col-holder-link col-s"><div class="inner"></div></div>' +
                                '<div class="col-holder col-holder-link-strut"><div class="inner"></div></div>' +
                                '<div class="col-holder col-holder-price col-b b-separate"><div class="inner"><div class="inner2"></div></div></div>' +
                                '<div class="col-holder col-holder-price-strut"><div class="inner"></div></div>' +
                                '<div class="col-holder col-holder-startDate col-b"><div class="inner"></div></div>' +
                                '<div class="col-holder col-holder-views col-b"><div class="inner"></div></div>' +
                                '<div class="col-holder col-holder-clicks col-b"><div class="inner"></div></div>' +
                                '<div class="col-holder col-holder-closes col-b"><div class="inner"></div></div>' +
                                '<div class="col-holder col-holder-engagement col-b"><div class="inner"><div class="inner2"></div></div></div>' +
                            '</div>';
		
		//console.log(item_obj);
		
		window.publisherUrl = item_obj.publisherUrl;
		window.PUBLISHER_URL = item_obj.publisherUrl;										
	});													
	
	jQuery(".rbody").prepend(content);
	
	window.analytics_data = {sites: [], spots: [], items: []};
	jQuery(".params select").attr("disabled", "");
	
	
	jQuery(".params select").change(function(){
		var id;
		switch (jQuery("#paramScope").val()){
			case 'items':
					id = jQuery("#paramScope option:[value='items']").attr('id') != "" ? jQuery("#paramScope option:[value='items']").attr('id') : jQuery(".rbody .row:eq(1)").attr('id');
					break;
			case 'spots':
					id = jQuery("#paramScope option:[value='spots']").attr('id') != "" ? jQuery("#paramScope option:[value='spots']").attr('id') : jQuery(".rbody .row:eq(1) .num").html();
					break;
			case 'sites':
					id = 0;
					break;
			default:
					break;
		}
											
		showGraph(jQuery("#paramScope").val(), id, jQuery("#paramAnalytics").val(), jQuery("#paramDuration").val());
	});
	
    
	api.getPublisherSiteStats(window.PUBLISHER_URL);
	api.getPaidItems(window.PUBLISHER_URL);
	
	
	
}

ApiHandler.prototype.onGetItemStats = function(response) {
	//console.log(response);

	jQuery.each(response.items, function(i, item){ 
		var item_obj = jQuery.parseJSON(item);
		//console.log(item_obj);
		window.analytics_data['items'][item_obj.id] = ApiHandler.parseStats_(item_obj);
		
		jQuery(".rbody #" + item_obj.id+ " .interact-hide").html(item_obj.updateTime['year'] + '-' + item_obj.updateTime['month'] + '-' + item_obj.updateTime['day']);
		jQuery(".rbody #" + item_obj.id+ " .col-views .data-entry").html(item_obj.totalStats[1]);
		jQuery(".rbody #" + item_obj.id+ " .col-clicks .data-entry").html(item_obj.totalStats[2]);
		jQuery(".rbody #" + item_obj.id+ " .col-closes .data-entry").html(item_obj.totalStats[4]);
		jQuery(".rbody #" + item_obj.id+ " .col-engagement .data-entry").html(((item_obj.totalStats[2] + item_obj.totalStats[4]) * 100 / item_obj.totalStats[1]).toFixed(2) + '%');
	});
	
}

ApiHandler.prototype.onGetSpotStats = function(response) { 
														
	jQuery.each(response.spots, function(i, spot){ 
		var spot_obj = jQuery.parseJSON(spot);
		window.analytics_data['spots'][spot_obj.spot] = ApiHandler.parseStats_(spot_obj);				
	});
}


ApiHandler.prototype.onGetPublisherSiteStats = function(response) {													
	jQuery.each(response.publisherSites, function(i, site){ 
		var site_obj = jQuery.parseJSON(site); 
		window.analytics_data['sites'][0] = ApiHandler.parseStats_(site_obj);		
		showGraph("sites", 0, jQuery("#paramAnalytics").val(), jQuery("#paramDuration").val());				
	});
}

ApiHandler.prototype.onSubmitError = function(response) {
}

ApiHandler.parseStats_ = function(obj) {
	var data = {0:["", "", "", ""], 1:["", "", "", ""], 2:["", "", "", ""], 3:["", "", "", ""], 4:["", "", "", ""]};
	var idMap = [0,1,2,4];
	for(var m = 0; m < 5; m++){
			for(var n = DurationInfo[m].length - 1; n > 0; n--){
				o = obj.timedStats[m][n];
				for (var i = 0; i < idMap.length; i++) {
					data[m][i] += Math.abs(n - DurationInfo[m].length) + ';' + (o[idMap[i]] != null ? o[idMap[i]] : 0) + '\n'; 
				}
			}
	}
	//console.log(data);	
	return data;
}