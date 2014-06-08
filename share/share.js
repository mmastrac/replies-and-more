var addthis_config = { "data_track_addressbar": false, "data_track_clickback": false, "ui_508_compliant": true };

var shareData = JSON.parse(decodeURIComponent(location.search.slice(1)));

document.querySelector('.addthis_toolbox').setAttribute('addthis:url', shareData.url);
document.querySelector('.addthis_toolbox').setAttribute('addthis:title', shareData.shortDesc);
document.querySelector('.addthis_toolbox').setAttribute('addthis:description', shareData.longDesc);

function populatePopup() {
	if (!window.addthis) {
	    setTimeout(function() { populatePopup() }, 100);
	    return;
	}

	var loading = document.querySelectorAll('.addthis_loading');
	for (var i = 0; i < loading.length; i++) {
	    loading[i].style.display = 'none';
	}
}

populatePopup();