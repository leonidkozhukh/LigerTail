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

function Api() {
}

Api.prototype.init = function(domain, apiHandler) {
	this.domain = domain;
	_apiHandler = apiHandler;
}

Api.prototype.submitItem = function(item) {
	assert(item.publisherUrl && item.url && item.email && item.title && item.description);
	item.price = 0;
	var data = this.serialize(item);
	postRequest(this.domain, 'submit_item', 'POST', data, '_apiHandler.onItemSubmitted');
};

Api.prototype.updatePrice = function(publisherUrl, itemId, price) {
	assert(publisherUrl && itemId && price > 0);
	var data = this.serialize({"publisherUrl":publisherUrl, "itemId":itemId, "price":price});
	postRequest(this.domain, 'update_price', 'POST', data, '_apiHandler.onPriceUpdated');
};

Api.prototype.getOrderedItems = function(publisherUrl) {
	assert(publisherUrl);
	var data = this.serialize({"publisherUrl": publisherUrl});
	postRequest(this.domain, 'get_ordered_items', 'POST', data, '_apiHandler.onGetOrderedItems');
};

Api.prototype.getPaidItems = function(publisherUrl) {
	assert(publisherUrl);
	var data = this.serialize({"publisherUrl": publisherUrl});
	postRequest(this.domain, 'get_paid_items', 'POST', data, '_apiHandler.onGetPaidItems');
};

Api.prototype.submitUserInteraction= function(publisherUrl, interactions) {
	assert(publisherUrl && interactions.length > 0);
	var str;
	var first = true;	
	for (var i = 0; i < interactions.length; i++) {
		assert(interactions[i].itemId > 0);
		assert(interactions[i].statType >= StatType.UNIQUES && interactions[i].statType <= StatType.CLOSES);
		if (!first) {
			str += ",";
		} else {
			str = "";
		}
		str += interactions[i].itemId + ":" + interactions[i].statType;		
	}
	var data = this.serialize({"publisherUrl": publisherUrl, "interactions": str});
	postRequest(this.domain, 'submit_user_interaction', 'POST', data, '_apiHandler.onUserInteractionSubmitted');
};


Api.prototype.getFilter= function(publisherUrl) {
	assert(publisherUrl);
	var data = this.serialize({"publisherUrl": publisherUrl});
	postRequest(this.domain, 'get_filter', 'POST', data, '_apiHandler.onGetFilter');
};


Api.prototype.submitFilter= function(publisherUrl, filter) {
	assert(publisherUrl);
	assert(filter.durationId >= Duration.ETERNITY && filter.durationId <= Duration.MINUTELY);
	assert(filter.recency > 0 && filter.recency <= 100);
	assert(filter.popularity > 0 && filter.popularity <= 100);
	
	var data = this.serialize({
		"publisherUrl": publisherUrl,
		"filter.durationId": filter.durationId,
		"filter.recency": filter.recency,
		"filter.popularity": filter.popularity} );
	postRequest(this.domain, 'submit_filter', 'POST', data, '_apiHandler.onFilterSubmitted');
};

Api.prototype.getItemStats= function(publisherUrl, itemId) {
	assert(publisherUrl && itemId > 0);
	var data = this.serialize({"publisherUrl": publisherUrl, "itemId":itemId});
	postRequest(this.domain, 'get_item_stats', 'POST', data, '_apiHandler.onGetItemStats');
};


Api.prototype.serialize = function(obj) {
	var first = true;
	var str = "";
	for(var prop in obj) {
	    if(obj.hasOwnProperty(prop)) {
	    	if (! first) {
		    	  str += "&"
		    } else {
		          first = false;
		    }
	    	str += encodeURI(prop) + "=" + encodeURI(obj[prop]);
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
