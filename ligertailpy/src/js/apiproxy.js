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

var dur  = {
	YY: 0,
	MM: 1,
	DD: 2,
	hh: 3,
	mm: 4
};

var DurationInfo = [{name: "yearly", length: 3}, {name: "monthly", length: 12}, {name: "daily", length: 31}, {name: "hourly", length: 24}, {name: "minutely", length: 60}];

var InfoType = {
	    SHORT : 0,
	    WITH_PRICE:  1,
	    FULL: 2		
};

function LTApi() {
	var i = 1;
}

LTApi.prototype.init = function(apiHandler, domain) {
	if (!domain) {
	  domain = LTApi.getDefaultDomain();
	}
	this.domain = domain;
	_apiHandler = apiHandler;
}

LTApi.prototype.submitItem = function(item, callback) {
	assert(item.publisherUrl && item.url && item.email && item.title && item.description);
	item.price = 0;
	var data = this.serialize(item);
	postRequest(this.domain, 'submit_item', 'POST', data, callback ? callback : '_apiHandler.onItemSubmitted');
};

LTApi.prototype.updatePrice = function(ccinfo, callback) {
	var data = this.serialize(ccinfo);
	postRequest(this.domain, 'update_price', 'POST', data, callback ? callback : '_apiHandler.onPriceUpdated');
};


LTApi.prototype.getOrderedItems = function(publisherUrl, callback) {
	assert(publisherUrl);
	var data = this.serialize({"publisherUrl": publisherUrl});
	postRequest(this.domain, 'get_ordered_items', 'POST', data, callback ? callback : '_apiHandler.onGetOrderedItems');
};

LTApi.prototype.getPaidItems = function(publisherUrl, callback) {
	assert(publisherUrl);
	var data = this.serialize({"publisherUrl": publisherUrl});
	postRequest(this.domain, 'get_paid_items', 'POST', data, callback ? callback : '_apiHandler.onGetPaidItems');
};

LTApi.prototype.submitUserInteraction= function(publisherUrl, interactions, callback) {
	assert(publisherUrl && interactions.length > 0);
	var str;
	var first = true;	
	for (var i = 0; i < interactions.length; i++) {
		assert(Math.abs(interactions[i].itemId) > 0); //itemId < 0 when empty spots are viewed
		assert(interactions[i].statType >= StatType.UNIQUES && interactions[i].statType <= StatType.CLOSES);
		assert(interactions[i].spot > 0);
		if (!first) {
			str += ",";
		} else {
			str = "";
			first = false;
		}
		str += interactions[i].itemId + ":" + interactions[i].statType + ":" + interactions[i].spot;		
	}
	var data = this.serialize({"publisherUrl": publisherUrl, "interactions": str});
	postRequest(this.domain, 'submit_user_interaction', 'POST', data, callback ? callback : '_apiHandler.onUserInteractionSubmitted');
};


LTApi.prototype.getFilter= function(publisherUrl, callback) {
	assert(publisherUrl);
	var data = this.serialize({"publisherUrl": publisherUrl});
	postRequest(this.domain, 'get_filter', 'POST', data, callback ? callback : '_apiHandler.onGetFilter');
};


LTApi.prototype.submitFilter= function(publisherUrl, filter, callback) {
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

LTApi.prototype.getItemStats= function(itemId, infoType, callback) {
	assert(itemId > 0);
	var data = this.serialize({"itemId":itemId, "infoType":infoType});
	postRequest(this.domain, 'get_item_stats', 'POST', data, callback ? callback : '_apiHandler.onGetItemStats');
};

LTApi.prototype.getSpotStats= function(spot, publisherUrl, callback) {
	assert(publisherUrl);
	assert(spot > 0);
	var data = this.serialize({"spot":spot, "publisherUrl":publisherUrl});
	postRequest(this.domain, 'get_spot_stats', 'POST', data, callback ? callback : '_apiHandler.onGetSpotStats');
};


LTApi.prototype.getPublisherSiteStats= function(publisherUrl, callback) {
	assert(publisherUrl);
	var data = this.serialize({"publisherUrl":publisherUrl});
	postRequest(this.domain, 'get_publisher_site_stats', 'POST', data, callback ? callback : '_apiHandler.onGetPublisherSiteStats');
};

LTApi.prototype.serialize = function(obj) {
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
/*
function stacktrace() { 
	  function join(args) {
		 s = ''
		 for (var i =0 ;i < args.length; i++) {
			 s += args[i] + ',';
		 }
		 return s;
	  }
	  function st2(f) {
	    return !f ? [] : 
	        st2(f.caller).concat([f.toString().split('(')[0].substring(9) + '(' + join(f.arguments) + ')']);
	  }
	  return st2(arguments.callee.caller);
	}
*/
Function.prototype.trace = function()
{
    var trace = [];
    var current = this;
    while(current)
    {
        trace.push(current.signature());
        current = current.caller;
    }
    return trace.join('\n');
}
Function.prototype.signature = function()
{
    var signature = {
        name: this.getName(),
        params: [],
        toString: function()
        {
            var params = this.params.length > 0 ?
                "'" + this.params.join("', '") + "'" : "";
            return this.name + "(" + params + ")"
        }
    };
    if(this.arguments)
    {
        for(var x=0; x<this .arguments.length; x++)
            signature.params.push(this.arguments[x]);
    }
    return signature;
}
Function.prototype.getName = function()
{
    if(this.name)
        return this.name;
    var definition = this.toString().split("\n")[0];
    //return definition;
    // TODO: Show args
    var exp = new RegExp('/^function ([^\s(]+).+/|>');
    if(exp.test(definition))
        return definition.split("\n")[0].replace(exp, "$1") || "anonymous";
    return "anonymous";
    
}

assert = function(cond) {
	if (!cond) {
		alert("Invalid condition:\n " + arguments.callee.trace());
		blah/0;
	}
}

LTApi.getDefaultDomain = function() {
  var domain = "http://" + window.document.location.hostname;
  if (window.document.location.port) {
    domain += ":" + window.document.location.port;
  }
  //var domain = "http://5.latest.ligertailbackend.appspot.com";
  domain += "/api";
  return domain;
}
