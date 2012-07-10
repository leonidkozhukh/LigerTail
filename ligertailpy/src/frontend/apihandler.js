var LTDOMAIN;
var jqversion;
function ApiHandler(domain, jq15) {
  LTDOMAIN = domain;
  jqversion = jq15;
}

function ltdebug(myObj) {
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
	var item = jqversion.parseJSON(response.items[0]);
	
	//remove last item from view to make room for the new submission
    jqversion(".ligertail_widget .ligertail_widget_content:eq(" + (window.numItems - 1) + ")").hide();
                        
    //add content to widget
    if(window.parameter["width"] == 600){                                                          
          jqversion(".ligertail_widget #ligertail_widget_header").after('<div style="display:block;" class="ligertail_widget_content" id="' + item.id + '" style="display:block;"><div class="ligertail_widget_close"><img src="' + LTDOMAIN + '/frontend/images/button_close.png" width="12" height="12" alt="Delete" /></div><div class="ligertail_widget_image"><a target="_blank" href="' + checkLink(item.url) +'"><img src="' + item.thumbnailUrl + '" alt="Image" width="105" height="65" border="0" /></a></div><div class="ligertail_widget_text"><div class="ligertail_widget_top_text"><span class="ligertail_widget_source">' + getDomain(item.url) + '</span><span class="ligertail_widget_title"><a target="_blank" href="' + checkLink(item.url) + '">' + item.title + '</a></span><div class="ligertail_widget_top_text"><p class="ligertail_widget_description">' + item.description + '</p></div></div>');
    }
    else{
          jqversion(".ligertail_widget #ligertail_widget_header").after('<div style="display:block;" class="ligertail_widget_content" id="' + item.id + '"><div class="ligertail_widget_text"><span class="ligertail_widget_source">' + getDomain(item.url) + '</span><span class="ligertail_widget_title"><a target="_blank" href="' + checkLink(item.url) + '">' + item.title + '</a></span></div><div class="ligertail_widget_close"><img src="' + LTDOMAIN + '/frontend/images/button_close.png" alt="Delete" width="12" height="12" border="0" /></div></div>');
    }													
														
													
  // TODO: handle error case
  if (!window.submitForFree && !isInIFrame) {
	var domain = "";
	if (window.document.location.hostname == "localhost") {
		domain = "http://" + window.document.location.hostname;		
	    if (window.document.location.port) {
		    domain += ":" + window.document.location.port;
		}
	} else {
		domain = LTDOMAIN;
		domain = domain.replace('http://', 'https://');
	}
	var url = domain + "/payment.html?itemId=" + item.id;
	//window.open(url, 'mywindow');
    // TODO : make sure it opens in a new window
	document.location.href = url;
  }
  else{
	//sucks for the advertiser; will include payment url for item in submission email later on...
  }
}

ApiHandler.prototype.onPriceUpdated = function(response) {
	//console.log(response);
	
	if(response.error.length > 0){
		jqversion("#payForm .last-row input").show();
        jqversion("#payForm .last-row .message").html(jqversion.trim(response.error));
	}
	else{
        jqversion("#payForm .last-row .message").html('Thanks for your purchase! Please check your email.');
	}
	
}

ApiHandler.prototype.onGetOrderedItems = function(response) {
	var content = "";
	var interactions = [];
	jqversion.each(response.items, function(i, item){
		window.LIGERTAIL_ITEMS_LOADED++;
		var item_obj = jqversion.parseJSON(item);
		
		if(window.parameter["width"] == 600){
			content += '<div class="ligertail_widget_content" id="' + item_obj.id + '"><div class="ligertail_widget_close" id="' + window.LIGERTAIL_ITEMS_LOADED + '"><img src="' + LTDOMAIN + '/frontend/images/button_close.png" width="12" height="12" alt="Delete" /></div><div class="ligertail_widget_image"><a target="_blank" href="' + checkLink(item_obj.url) +'"><img src="' + item_obj.thumbnailUrl + '" alt="Image" width="105" height="65" border="0" /></a></div><div class="ligertail_widget_text"><div class="ligertail_widget_top_text"><span class="ligertail_widget_source">' + getDomain(item_obj.url) + '</span><span class="ligertail_widget_title"><a target="_blank" href="' + checkLink(item_obj.url) + '">' + item_obj.title + '</a></span></div><p class="ligertail_widget_description">' + item_obj.description + '</p></div></div>';
		}
		else{
			content += '<div class="ligertail_widget_content" id="' + item_obj.id + '"><div class="ligertail_widget_text"><span class="ligertail_widget_source">' + getDomain(item_obj.url) + '</span><span class="ligertail_widget_title"><a target="_blank" href="' + checkLink(item_obj.url) + '">' + item_obj.title + '</a></span></div><div class="ligertail_widget_close" id="' + window.LIGERTAIL_ITEMS_LOADED + '"><img src="' + LTDOMAIN + '/frontend/images/button_close.png" alt="Delete" width="12" height="12" border="0" /></div></div>';
		}
		if (i < window.numItems) {
		  interactions[i] = {itemId: item_obj.id, statType: StatType.VIEWS, spot: window.LIGERTAIL_ITEMS_LOADED};
		}
	});
	if (interactions.length) {
		api.submitUserInteraction(window.PUBLISHER_URL, interactions);
	}
	// populate default links
	var defaultItemIds = {};
	var defaultItemInteractions = [];
	if (!window.parameter["block_default_links"]) {
		jqversion.each(response.defaultItems, function(i, item){
			window.LIGERTAIL_ITEMS_LOADED++;
			var item_obj = jqversion.parseJSON(item);
			defaultItemIds[item_obj.id] = true;
			if(window.parameter["width"] == 600){
				content += '<div class="ligertail_widget_content" id="' + item_obj.id + '"><div class="ligertail_widget_close" id="' + window.LIGERTAIL_ITEMS_LOADED + '"><img src="' + LTDOMAIN + '/frontend/images/button_close.png" width="12" height="12" alt="Delete" /></div><div class="ligertail_widget_image"><a target="_blank" href="' + checkLink(item_obj.url) +'"><img src="' + item_obj.thumbnailUrl + '" alt="Image" width="105" height="65" border="0" /></a></div><div class="ligertail_widget_text"><div class="ligertail_widget_top_text"><span class="ligertail_widget_source">' + getDomain(item_obj.url) + '</span><span class="ligertail_widget_title"><a target="_blank" href="' + checkLink(item_obj.url) + '">' + item_obj.title + '</a></span></div><p class="ligertail_widget_description">' + item_obj.description + '</p></div></div>';
			}
			else{
				content += '<div class="ligertail_widget_content" id="' + item_obj.id + '"><div class="ligertail_widget_text"><span class="ligertail_widget_source">' + getDomain(item_obj.url) + '</span><span class="ligertail_widget_title"><a target="_blank" href="' + checkLink(item_obj.url) + '">' + item_obj.title + '</a></span></div><div class="ligertail_widget_close" id="' + window.LIGERTAIL_ITEMS_LOADED + '"><img src="' + LTDOMAIN + '/frontend/images/button_close.png" alt="Delete" width="12" height="12" border="0" /></div></div>';
			}
			if (i < window.numItems - interactions.length) {
				defaultItemInteractions[i] = {itemId: item_obj.id, statType: StatType.VIEWS, spot: window.LIGERTAIL_ITEMS_LOADED};
			}
		});
	}	
	if (defaultItemInteractions.length) {
		api.submitUserInteraction("default", defaultItemInteractions);
	}
	
	if(content != ""){
		jqversion(".ligertail_widget .ligertail_widget_content:visible").hide();
		jqversion(".ligertail_widget #ligertail_widget_header").after(content);
		jqversion(".ligertail_widget .ligertail_widget_content:lt(" + window.numItems + ")").show();
		
		// add events to content
		jqversion(".ligertail_widget .ligertail_widget_content").bind("show", function(){
				jqversion(this).show("fast");
				var interaction = [];
				//this is a view
				if(jqversion(this).attr('id') < 0){
					interaction[0] = {itemId: jqversion(this).attr('id'), statType: StatType.VIEWS, spot: jqversion(this).index()};
				}
				else{
					interaction[0] = {itemId: jqversion(this).attr('id'), statType: StatType.VIEWS, spot: jqversion(this).find(".ligertail_widget_close").attr('id')};
				}
  			    api.submitUserInteraction(
			      defaultItemIds[interaction[0].itemId] ? "default" : window.PUBLISHER_URL, 
			      interaction);
		});

		//update db, remove the current content, move stack up, & show more content
		jqversion(".ligertail_widget .ligertail_widget_content .ligertail_widget_close").click(function(){
				//this is a close
				var interaction = [];
				interaction[0] = {itemId: jqversion(this).parent().attr('id'), statType: StatType.CLOSES, spot: jqversion(this).attr('id')};
  			    api.submitUserInteraction(
  				      defaultItemIds[interaction[0].itemId] ? "default" : window.PUBLISHER_URL, 
  				      interaction);
				jqversion(this).parent().remove();
				jqversion(".ligertail_widget .ligertail_widget_content:hidden").filter(":first").trigger("show");
		});
	
		//update db for click
		jqversion(".ligertail_widget .ligertail_widget_content .ligertail_widget_title").click(function(){ 
				//this is a click
				var interaction = [];
				interaction[0] = {itemId: jqversion(this).parent().parent().attr('id'), statType: StatType.CLICKS, spot: jqversion(this).parent().parent().find(".ligertail_widget_close").attr('id')}; 
  			    api.submitUserInteraction(
  				      defaultItemIds[interaction[0].itemId] ? "default" : window.PUBLISHER_URL, 
  				      interaction);
				jqversion(this).parent().parent().remove();
				jqversion(".ligertail_widget .ligertail_widget_content:hidden").filter(":first").trigger("show");
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
	else{ jqversion(".ligertail_widget .ligertail_widget_content").show(); }	
}

ApiHandler.prototype.onGetPaidItems = function(response) {
	var content = "";
	jqversion.each(response.items, function(i, item){ 
		var item_obj = jqversion.parseJSON(item);
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
				jqversion(".rbody .row:first input").val('$' + (item_obj.price + 1));
		
		api.getItemStats(item_obj.id, 2);
		api.getSpotStats((i+1), window.PUBLISHER_URL);
	});
	
	jqversion(".rbody .row").after(content);
	jqversion(".rbody .row:last").addClass("row-last");
	
	jqversion(".rbody .row:gt(0)").click(function(event){
		if(jqversion(event.target).hasClass('num')){
			jqversion("#paramScope option:[value='spots']").attr('id', jqversion(event.target).html());
			showGraph("spots", jqversion(event.target).html(), jqversion("#paramAnalytics").val(), jqversion("#paramDuration").val());
		}
		else{
			jqversion("#paramScope option:[value='items']").attr('id', jqversion(this).attr('id'));
			showGraph("items", jqversion(this).attr('id'), jqversion("#paramAnalytics").val(), jqversion("#paramDuration").val());			
		}							
	});
	
	
	jqversion(".rbody .row:gt(0)").hover(function(){
			jqversion(this).addClass("row-hover");
		},
		function(){
			jqversion(this).removeClass("row-hover");
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
	jqversion.each(response.items, function(i, item){
		var item_obj = jqversion.parseJSON(item);
		
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
	
	jqversion(".rbody").prepend(content);
	
	window.analytics_data = {sites: [], spots: [], items: []};
	jqversion(".params select").attr("disabled", "");
	
	
	jqversion(".params select").change(function(){
		var id;
		switch (jqversion("#paramScope").val()){
			case 'items':
					id = jqversion("#paramScope option:[value='items']").attr('id') != "" ? jqversion("#paramScope option:[value='items']").attr('id') : jqversion(".rbody .row:eq(1)").attr('id');
					break;
			case 'spots':
					id = jqversion("#paramScope option:[value='spots']").attr('id') != "" ? jqversion("#paramScope option:[value='spots']").attr('id') : jqversion(".rbody .row:eq(1) .num").html();
					break;
			case 'sites':
					id = 0;
					break;
			default:
					break;
		}
											
		showGraph(jqversion("#paramScope").val(), id, jqversion("#paramAnalytics").val(), jqversion("#paramDuration").val());
	});
	
    
	api.getPublisherSiteStats(window.PUBLISHER_URL);
	api.getPaidItems(window.PUBLISHER_URL);
	
	
	
}

ApiHandler.prototype.onGetItemStats = function(response) {
	//console.log(response);

	jqversion.each(response.items, function(i, item){ 
		var item_obj = jqversion.parseJSON(item);
		//console.log(item_obj);
		window.analytics_data['items'][item_obj.id] = ApiHandler.parseStats_(item_obj);
		
		jqversion(".rbody #" + item_obj.id+ " .interact-hide").html(item_obj.updateTime['year'] + '-' + item_obj.updateTime['month'] + '-' + item_obj.updateTime['day']);
		jqversion(".rbody #" + item_obj.id+ " .col-views .data-entry").html(item_obj.totalStats[1]);
		jqversion(".rbody #" + item_obj.id+ " .col-clicks .data-entry").html(item_obj.totalStats[2]);
		jqversion(".rbody #" + item_obj.id+ " .col-closes .data-entry").html(item_obj.totalStats[4]);
		jqversion(".rbody #" + item_obj.id+ " .col-engagement .data-entry").html(((item_obj.totalStats[2] + item_obj.totalStats[4]) * 100 / item_obj.totalStats[1]).toFixed(2) + '%');
	});
	
}

ApiHandler.prototype.onGetSpotStats = function(response) { 
														
	jqversion.each(response.spots, function(i, spot){ 
		var spot_obj = jqversion.parseJSON(spot);
		window.analytics_data['spots'][spot_obj.spot] = ApiHandler.parseStats_(spot_obj);				
	});
}


ApiHandler.prototype.onGetPublisherSiteStats = function(response) {													
	jqversion.each(response.publisherSites, function(i, site){ 
		var site_obj = jqversion.parseJSON(site); 
		window.analytics_data['sites'][0] = ApiHandler.parseStats_(site_obj);		
		showGraph("sites", 0, jqversion("#paramAnalytics").val(), jqversion("#paramDuration").val());				
	});
}

ApiHandler.prototype.onSubmitError = function(response) {
}

ApiHandler.parseStats_ = function(obj) {
	var data = {0:["", "", "", ""], 1:["", "", "", ""], 2:["", "", "", ""], 3:["", "", "", ""], 4:["", "", "", ""]};
	var idMap = [0,1,2,4];
	var lastDate = new Date(obj.updateTime.year, obj.updateTime.month, obj.updateTime.day, obj.updateTime.hour, obj.updateTime.minute);
	var labelOffsets = [0 + obj.updateTime.year,
	                    0 + obj.updateTime.month,
	                    0 + obj.updateTime.day,
	                    0 + obj.updateTime.hour,
	                    0 + obj.updateTime.minute]
	for(var m = 0; m < 5; m++){
			for(var n = DurationInfo[m].length - 1; n >= 0; n--){
				o = obj.timedStats[m][n];
				for (var i = 0; i < idMap.length; i++) {
					data[m][i] += (labelOffsets[m] + DurationInfo[m].length -1 - n )%DurationInfo[m].length + ';' + (o[idMap[i]] != null ? o[idMap[i]] : 0) + '\n'; 
				}
			}
	}
	//console.log(data);	
	return data;
}

function apihandler_loaded() {}
