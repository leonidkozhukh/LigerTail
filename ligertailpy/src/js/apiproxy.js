var _apiHandler = null;

var StatType = {
	UNIQUES : 0, 
	VIEWS : 1,
	CLICKS : 2,
    LIKES : 3,
    CLOSES : 4
};

var Duration  = {
	ETERNITY : 0,
	MONTHLY : 1,
	WEEKLY: 2,
	DAILY : 3,
	HOURLY: 4,
	MINUTELY: 5
};

var reverseDuration = ["yearly", "monthly", "daily", "hourly", "minutely"];

var InfoType = {
	    SHORT : 0,
	    WITH_PRICE:  1,
	    FULL: 2		
};

function LGApi() {
	var i = 1;
}

LGApi.prototype.init = function(apiHandler, domain) {
	if (!domain) {
	  domain = LGApi.getDefaultDomain();
	}
	this.domain = domain;
	_apiHandler = apiHandler;
}

LGApi.prototype.submitItem = function(item, callback) {
	assert(item.publisherUrl && item.url && item.email && item.title && item.description);
	item.price = 0;
	var data = this.serialize(item);
	postRequest(this.domain, 'submit_item', 'POST', data, callback ? callback : '_apiHandler.onItemSubmitted');
};

LGApi.prototype.updatePrice = function(ccinfo, callback) {
	var data = this.serialize(ccinfo);
	postRequest(this.domain, 'update_price', 'POST', data, callback ? callback : '_apiHandler.onPriceUpdated');
};


LGApi.prototype.getOrderedItems = function(publisherUrl, callback) {
	assert(publisherUrl);
	var data = this.serialize({"publisherUrl": publisherUrl});
	postRequest(this.domain, 'get_ordered_items', 'POST', data, callback ? callback : '_apiHandler.onGetOrderedItems');
};

LGApi.prototype.getPaidItems = function(publisherUrl, callback) {
	assert(publisherUrl);
	var data = this.serialize({"publisherUrl": publisherUrl});
	postRequest(this.domain, 'get_paid_items', 'POST', data, callback ? callback : '_apiHandler.onGetPaidItems');
};

LGApi.prototype.submitUserInteraction= function(publisherUrl, interactions, callback) {
	assert(publisherUrl && interactions.length > 0);
	var str;
	var first = true;	
	for (var i = 0; i < interactions.length; i++) {
		assert(interactions[i].itemId > 0);
		assert(interactions[i].statType >= StatType.UNIQUES && interactions[i].statType <= StatType.CLOSES);
		assert(interactions[i].spot > 0);
		if (!first) {
			str += ",";
		} else {
			str = "";
		}
		str += interactions[i].itemId + ":" + interactions[i].statType + ":" + interactions[i].spot;		
	}
	var data = this.serialize({"publisherUrl": publisherUrl, "interactions": str});
	postRequest(this.domain, 'submit_user_interaction', 'POST', data, callback ? callback : '_apiHandler.onUserInteractionSubmitted');
};


LGApi.prototype.getFilter= function(publisherUrl, callback) {
	assert(publisherUrl);
	var data = this.serialize({"publisherUrl": publisherUrl});
	postRequest(this.domain, 'get_filter', 'POST', data, callback ? callback : '_apiHandler.onGetFilter');
};


LGApi.prototype.submitFilter= function(publisherUrl, filter, callback) {
	assert(publisherUrl);
	assert(filter.duration == Duration.ETERNITY);
	assert(filter.recency > 0 && filter.recency <= 100);
	assert(filter.popularity > 0 && filter.popularity <= 100);
	
	var data = this.serialize({
		"publisherUrl": publisherUrl,
		"filter.duration": filter.duration,
		"filter.recency": filter.recency,
		"filter.popularity": filter.popularity} );
	postRequest(this.domain, 'submit_filter', 'POST', data, callback ? callback : '_apiHandler.onFilterSubmitted');
};

LGApi.prototype.getItemStats= function(itemId, infoType, callback) {
	assert(itemId > 0);
	var data = this.serialize({"itemId":itemId, "infoType":infoType});
	postRequest(this.domain, 'get_item_stats', 'POST', data, callback ? callback : '_apiHandler.onGetItemStats');
};

LGApi.prototype.getSpotStats= function(spot, callback) {
	assert(spot > 0);
	var data = this.serialize({"spot":spot, "publisherUrl":publisherUrl});
	postRequest(this.domain, 'get_spot_stats', 'POST', data, callback ? callback : '_apiHandler.onGetSpotStats');
};


LGApi.prototype.serialize = function(obj) {
	var first = true;
	var str = "";
	for(var prop in obj) {
	    if(obj.hasOwnProperty(prop)) {
	    	if (! first) {
		    	  str += "&"
		    } else {
		          first = false;
		    }
	    	str += escape(prop) + "=" + escape(obj[prop]);
	     }
	}
	return str;
	/*
  return JSON.stringify(obj, function (key, value) {
    return value;
  });*/
};

assert = function(cond) {
	if (!cond) {
		alert("Invalid condition ");
		blah/0;
	}
}

LGApi.getDefaultDomain = function() {
  var domain = "http://" + window.document.location.hostname;
  if (window.document.location.port) {
    domain += ":" + window.document.location.port;
  }
  //var domain = "http://5.latest.ligertailbackend.appspot.com";
  domain += "/api";
  return domain;
}
