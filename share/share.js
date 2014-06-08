var addthis_config = { "data_track_addressbar": false, "data_track_clickback": false, "ui_508_compliant": true };

var createElement = document.createElement;

document.createElement = function(tagName) {
	var elem = createElement.apply(document, arguments);
	console.log(tagName);
	if (tagName == "script" || tagName == "iframe") {
		elem.__defineSetter__('src', function(value) {
			console.log(value);
			if (value.slice(0, 5) == "http:") {
				value = 'https:' + value.slice(6);
			}
			if (value.slice(0, 2) == "//") {
				value = 'https:' + value;
			}
			console.log(value);
			elem.setAttribute('src', value);
		});
	}

	return elem;
}
