function BaseApiHandler() {
}

function debug(myObj) {
	var s = "";
	for (myKey in myObj){
		s+= "["+myKey +"] = "+myObj[myKey] + "\n";
	}
	alert(s);
}


BaseApiHandler.prototype.onItemSubmitted = function(response) {
   debug(response);
}

BaseApiHandler.prototype.onPriceUpdated = function(response) {
	debug(response);
}

BaseApiHandler.prototype.onGetOrderedItems = function(response) {
	debug(response);
}

BaseApiHandler.prototype.onGetPaidItems = function(response) {
  debug(response);
}

BaseApiHandler.prototype.onUserInteractionSubmitted = function(response) {
	debug(response);
}

BaseApiHandler.prototype.onGetFilter = function(response) {
	debug(response);
}

BaseApiHandler.prototype.onFilterSubmitted = function(response) {
	debug(response);
}

BaseApiHandler.prototype.onGetItemStats = function(response) {
	debug(response);
}

BaseApiHandler.prototype.onGetSpotStats = function(response) {
	debug(response);
}

BaseApiHandler.prototype.onGetPublisherSiteStats = function(response) {
	debug(response);
}
