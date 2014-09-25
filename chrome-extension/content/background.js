chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	if (request.storage) {
		if (typeof request.value != 'undefined') {
			// Set single value
			localStorage[request.storage] = request.value;
			sendResponse({storage: localStorage[request.storage]});
	   } else if (request.storage && typeof request.storage == 'object') {
			// Get multiple values
			var results = {};
			
			for (var i = 0; i < request.storage.length; i++) {
				results[request.storage[i]] = localStorage[request.storage[i]];
			}
			
			sendResponse({storage: results});
		} else {
			// Get single value
			sendResponse({storage: localStorage[request.storage]});
		}
	} else {
		sendResponse({});
	}
});
