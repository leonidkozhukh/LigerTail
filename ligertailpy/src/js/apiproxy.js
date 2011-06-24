var _apiHandler = null;
var _apiProxy = null;

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
	_apiProxy = this;
	if (!postRequest) {
		throw "postrequest not initialized";
	}
	this.inError = false;
	this.currentPublisherUrl = window.document.location.href;
}

LTApi.prototype.init = function(apiHandler, domain) {
	if (!domain || domain.length == 0) {
	  domain = LTApi.getDefaultDomain();
	} else {
	  domain += '/api';
	}
	this.domain = domain;
	_apiHandler = apiHandler;
}

LTApi.prototype.submitItem = function(item, callback) {
	assert(item.publisherUrl && item.url && item.email && item.title && item.description);
	item.price = 0;
	var data = this.serialize(item);
	postRequest(this.domain, 'submit_item', 'POST', data, callback ? callback : 'ApiHandler.prototype.onItemSubmitted');
};

LTApi.prototype.updatePrice = function(ccinfo, callback) {
	var data = this.serialize(ccinfo);
	postRequest(this.domain, 'update_price', 'POST', data, callback ? callback : 'ApiHandler.prototype.onPriceUpdated');
};


LTApi.prototype.getOrderedItems = function(publisherUrl, callback) {
	assert(publisherUrl);
	var data = this.serialize({"publisherUrl": publisherUrl});
	postRequest(this.domain, 'get_ordered_items', 'POST', data, callback ? callback : 'ApiHandler.prototype.onGetOrderedItems');
};

LTApi.prototype.getPaidItems = function(publisherUrl, callback) {
	assert(publisherUrl);
	var data = this.serialize({"publisherUrl": publisherUrl});
	postRequest(this.domain, 'get_paid_items', 'POST', data, callback ? callback : 'ApiHandler.prototype.onGetPaidItems');
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
	postRequest(this.domain, 'submit_user_interaction', 'POST', data, callback ? callback : 'ApiHandler.prototype.onUserInteractionSubmitted');
};


LTApi.prototype.getFilter= function(publisherUrl, callback) {
	assert(publisherUrl);
	var data = this.serialize({"publisherUrl": publisherUrl});
	postRequest(this.domain, 'get_filter', 'POST', data, callback ? callback : 'ApiHandler.prototype.onGetFilter');
};


LTApi.prototype.submitFilter= function(publisherUrl, filter, callback) {
	assert(publisherUrl);
	assert(filter.durationId == Duration.ETERNITY);
	assert(filter.recency > 0 && filter.recency <= 100);
	assert(filter.popularity > 0 && filter.popularity <= 100);
	
	var data = this.serialize({
		"publisherUrl": publisherUrl,
		"filter.durationId": filter.durationId,
		"filter.recency": filter.recency,
		"filter.popularity": filter.popularity} );
	postRequest(this.domain, 'submit_filter', 'POST', data, callback ? callback : 'ApiHandler.prototype.onFilterSubmitted');
};

LTApi.prototype.getItemStats= function(itemId, infoType, callback) {
	assert(itemId > 0);
	var data = this.serialize({"itemId":itemId, "infoType":infoType});
	postRequest(this.domain, 'get_item_stats', 'POST', data, callback ? callback : 'ApiHandler.prototype.onGetItemStats');
};

LTApi.prototype.getSpotStats= function(spot, publisherUrl, callback) {
	assert(publisherUrl);
	assert(spot > 0);
	var data = this.serialize({"spot":spot, "publisherUrl":publisherUrl});
	postRequest(this.domain, 'get_spot_stats', 'POST', data, callback ? callback : 'ApiHandler.prototype.onGetSpotStats');
};


LTApi.prototype.getPublisherSiteStats= function(publisherUrl, callback) {
	assert(publisherUrl);
	var data = this.serialize({"publisherUrl":publisherUrl});
	postRequest(this.domain, 'get_publisher_site_stats', 'POST', data, callback ? callback : 'ApiHandler.prototype.onGetPublisherSiteStats');
};

LTApi.prototype.submitError = function(publisherUrl, trace) {
	if (this.inError) {
		return;
	}
	this.inError = true;
	var data = this.serialize({"publisherUrl":publisherUrl, "stack":trace});
	postRequest(this.domain, 'submit_error', 'POST', data, 'ApiHandler.prototype.onSubmitError');
	this.inError = false;
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
	    	var val = obj[prop];
	    	if (prop == 'publisherUrl' && !this.inError) {
	    	  val = LTApi.normalizePublisherUrl(val);
	    	  this.currentPublisherUrl = val;
	    	}
	    	str += escape(prop) + "=" + escape(val);
	     }
	}
	return str;
	/*
  return JSON.stringify(obj, function (key, value) {
    return value;
  });*/
};

//TODO: cache results
LTApi.normalizePublisherUrl = function(url) {
	var original = url = url.toLowerCase();
	if (url.search('http') != 0) {
	  url = 'http://' + url;
	}
	//var regex ='^((http[s]?):\\/)?\\/?([^:\\/\\s]+)((\\/\\w+)*\\/)([\\w\\-\\.]+[^#?\\s]+)(.*)?(#[\\w\\-]+)?$';
	//var re = new RegExp(regex);
	var re = new RegExp(/^(https?):\/\/((|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))$/);
//	var re = new RegExp(/^(https?):\/\/((|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))$/);
    
	//re.global = true;
	
	var m = re.exec(url);
	var pureDomain = ''
	/*
	if (m == null) {
		if (url.charAt(url.length-1) != '/') {
			url += '/';
		}
		url += 'index.html';
	    m = re.exec(url);
	}*/
	
	if (m == null) {
		if (url.search('http://localhost') != 0) {
		  assert(m);
		}
		return original;
	} else {
	  pureDomain = m[2];//m[3];
	  if (pureDomain.indexOf('?') != -1) {
	    pureDomain = pureDomain.substring(0, pureDomain.indexOf('?'));
	  }
	  var indexPos = pureDomain.lastIndexOf('index.');
	  var lastSlashPos = pureDomain.lastIndexOf('/'); 
	  if (indexPos != -1 && indexPos > lastSlashPos) {
		pureDomain = pureDomain.substring(0, indexPos);
	  }
   	  if (pureDomain.charAt(pureDomain.length-1) != '/') {
   		pureDomain += '/';
	  }
/*	  path = m[4];
	  file = m[6];
	  pureDomain += path;
	  if (file.search('index.') == -1) {
		 pureDomain += file
	  }
	  */
	}
	return pureDomain;
}

Function.prototype.trace = function()
{
    var trace = [];
    var current = this;
    while(current)
    {
        trace.push(current.signature());
        current = current.caller;
    }
    return trace;
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
    var exp = new RegExp(/^function ([^\s(]+).+/);
    if(exp.test(definition))
        return definition.split("\n")[0].replace(exp, "$1") || "anonymous";
    return "anonymous";
    
}

assert = function(cond) {
	if (!cond) {
		var publisherUrl = _apiProxy.currentPublisherUrl;
		var trace = arguments.callee.trace();
		
		_apiProxy.submitError(publisherUrl, trace);
	}
}

LTApi.getDefaultDomain = function() {
  //return "http://ligertailbackend.appspot.com/api"; 
  var hostname = window.document.location.hostname;
  if (hostname == 'ligertail.com' || hostname == 'www.ligertail.com') {
	  hostname = 'ligertailbackend.appspot.com';
  }
  var domain = window.document.location.protocol + "//" + hostname;
  if (window.document.location.port) {
    domain += ":" + window.document.location.port;
  }
  //var domain = "http://5.latest.ligertailbackend.appspot.com";
  domain += "/api";
  return domain;
}

function apiproxy_loaded() {}
