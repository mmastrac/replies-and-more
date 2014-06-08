var addthis_config = { "data_track_addressbar": false, "data_track_clickback": false, "ui_508_compliant": true };

if (!window.addthis) {
    setTimeout(function() { populatePopup(id) }, 100);
    return;
}

var loading = document.querySelectorAll('.addthis_loading');
for (var i = 0; i < loading.length; i++) {
    loading[i].style.display = 'none';
}
