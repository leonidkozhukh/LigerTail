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
//
///**
//* Returns an XMLHttp instance to use for asynchronous
//* downloading. This method will never throw an exception, but will
//* return NULL if the browser does not support XmlHttp for any reason.
//* @return {XMLHttpRequest|Null}
//*/
//function createXmlHttpRequest() {
// try {
//   if (typeof ActiveXObject != 'undefined') {
//     return new ActiveXObject('Microsoft.XMLHTTP');
//   } else if (window["XMLHttpRequest"]) {
//     return new XMLHttpRequest();
//   }
// } catch (e) {
//   alert(e);
// }
// return null;
//};
//
//
//
//
///**
//* This functions wraps XMLHttpRequest open/send function.
//* It lets you specify a URL and will call the callback if
//* it gets a status code of 200.
//* @param {String} url The URL to retrieve
//* @param {Function} callback The function to call once retrieved.
//*/
//function postRequest1(domain, command, type, data, callback) {
// var url = domain + "/" + command;
// var status = -1;
// var request = createXmlHttpRequest();
// if (!request) {
//   return false;
// }
//
// request.onreadystatechange = function() {
//   if (request.readyState == 4) {
//     try {
//       status = request.status;
//     } catch (e) {
//       // Usually indicates request timed out in FF.
//     }
//     if (status == 200) {
//       callback(request.responseText);
//       request.onreadystatechange = function() {};
//     }
//   }
// }
// request.open(type, url, true);
// if (type == "POST") {
//	//request.setRequestHeader("Content-type", "application/json");
//  request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
//  //request.setRequestHeader("Content-length", -1);
//  //request.setRequestHeader("Connection", "close");
//  //request.setRequestHeader("Access-Control-Allow-Origin", domain);
//  //request.setRequestHeader("Origin", "*");
// }
//
// try {
//   request.send(data);
// } catch (e) {
//   alert(e);
// }
//};
//
//function downloadScript(url) {
//  var script = document.createElement('script');
//  script.src = url;
//  document.body.appendChild(script);
//}

