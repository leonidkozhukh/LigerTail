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
	postRequest(this.domain, 'submit_item', 'POST', data, onItemSubmitted);
};

Api.prototype.submitPaidItem = function(item) {
	assert(item.publisherUrl && item.url && item.email && item.title && item.description);
	assert(item.price > 0);
	var data = this.serialize(item);
	postRequest(this.domain, 'submit_paid_item', 'POST', data, onPaidItemSubmitted);
};

Api.prototype.getOrderedItems = function(publisherUrl) {
	assert(publisherUrl);
	var data = this.serialize({"publisherUrl": publisherUrl});
	postRequest(this.domain, 'get_ordered_items', 'POST', data, onGetOrderedItems);
};

Api.prototype.getPaidItems = function(publisherUrl) {
	assert(publisherUrl);
	var data = this.serialize({"publisherUrl": publisherUrl});
	postRequest(this.domain, 'get_paid_items', 'POST', data, onGetPaidItems);
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
			str = false;
		}
		str += interactions[i].itemId + ":" + interactions[i].statType;		
	}
	var data = this.serialize({"publisherUrl": publisherUrl, "interactions": str});
	postRequest(this.domain, 'submit_user_interacton', 'POST', data, onUserInteractionSubmitted);
};


Api.prototype.getFilter= function(publisherUrl) {
	assert(publisherUrl);
	var data = this.serialize({"publisherUrl": publisherUrl});
	postRequest(this.domain, 'get_filter', 'POST', data, onGetFilter);
};


Api.prototype.submitFilter= function(publisherUrl, filter) {
	assert(publisherUrl);
	assert(filter.duration == Duration.ETERNITY);
	assert(filter.recency > 0 && filter.recency <= 100);
	assert(filter.popularity > 0 && filter.popularity <= 100);
	
	var data = this.serialize({
		"publisherUrl": publisherUrl,
		"filter.duration": filter.duration,
		"filter.recency": filter.recency,
		"filter.popularity": filter.popularity} );
	postRequest(this.domain, 'submit_filter', 'POST', data, onFilterSubmitted);
};

Api.prototype.getItemStats= function(publisherUrl, itemId) {
	assert(publisherUrl && itemId > 0);
	var data = this.serialize({"publisherUrl": publisherUrl, "itemId":itemId});
	postRequest(this.domain, 'get_item_stats', 'POST', data, onGetItemStats);
};


Api.prototype.serialize = function(obj) {
	var first = true;
	var str = "";
	for(var prop in obj) {
	    if(obj.hasOwnProperty(prop))
	    	str += encodeURI(prop) + "=" + encodeURI(obj[prop]);
	    if (! first) {
	    	str += "&"
	    } else {
	      first = false;
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

onItemSubmitted = function(response) {
	_apiHandler.onItemSubmitted(response);
};


onPaidItemSubmitted = function(response) {
	_apiHandler.onPaidItemSubmitted(response);
};

onGetOrderedItems = function(response) {
	_apiHandler.onGetOrderedItems(response);
};

onGetPaidItems = function(response) {
	_apiHandler.onGetPaidItems(response);
};

onUserInteractonSubmitted = function(response) {
	_apiHandler.onUserInteractonSubmitted(response);	
}

onGetFilter = function(response) {
	_apiHandler.onGetFilter(response);
}

onFilterSubmitted = function(response) {
	_apiHandler.onFilterSubmitted(response);
}

onGetItemStats = function(response) {
	_apiHandler.onGetItemStats(response);
}
