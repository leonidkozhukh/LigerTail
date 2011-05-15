
function postRequest(domain, command, type, data, callback) {
	$.ajax({
		  url:  domain + "/" + command,
		  type: type,
		  data: data,
		  dataType: "jsonp",
		  jsonpCallback: callback,
		  contentType: "application/x-www-form-urlencoded"
	});
}


function parseResponse(serialized) {
	  var response = JSON.parse(serialized, function (key, value) {
	    var type;
	    if (value && typeof value === 'object') {
	        type = value.type;
	        if (typeof type === 'string' && typeof window[type] === 'function') {
	            return new (window[type])(value);
	        }
	    }
	    return value;
	  });
	  return response;
	}


function postrequest_loaded() {}