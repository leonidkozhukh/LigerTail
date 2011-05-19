
//function postRequest(domain, command, type, data, callback) {
//	$.ajax({
//		  url:  domain + "/" + command,
//		  type: type,
//		  data: data,
//		  dataType: "jsonp",
//		  jsonpCallback: callback,
//		  contentType: "application/x-www-form-urlencoded"
//	});
//}

var REMOTE = (function(){
    return window.LTDOMAIN;
}());
var easyxdm_remote = null;
function createRemote() {
	if (easyxdm_remote) {
		return easyxdm_remote;
	}
	easyxdm_remote =  new easyXDM.Rpc(/** The channel configuration */{

                /**
                 * Register the url to hash.html, this must be an absolute path
                 * or a path relative to the root.
                 * @field
                 */
                local: "/name.html",
                swf: REMOTE + "/js/easyxdm.swf",
                /**
                 * Register the url to the remote interface
                 * @field
                 */
                remote: REMOTE + "/js/remote.html",
                remoteHelper: REMOTE + "/js/name.html",
                /**
                 * Register the DOMElement that the generated IFrame should be inserted into
                 */
                container: "ligertail_comm_embedded",
                props: {
                    style: {
                        border: "2px dotted red",
                        height: "200px"
                    }
                },
                onReady: function(){
                    /**
                     * Call a method on the other side
                     */
                    //remote.noOp();
                }
            }, /** The interface configuration */ {
                remote: {
                    postRequest: {},
                    openFacebox: {}
                },
                local: {}
            });
	return easyxdm_remote;
}

function postRequest(domain, command, type, data, callback) {
    createRemote().postRequest(domain, command, type, data, function(response){
    	eval(callback)(response); 
    }, function(errorObj){
    	var a = 0;
    	//console.log(errorObj); 
    });   
}

function openFacebox(domain, url) {
	createRemote().openFacebox(domain, url, function(response){
		jQuery.facebox(response);	
	}, 
	function(errorObj){});
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