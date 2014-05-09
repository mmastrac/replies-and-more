gapi.plus.go();

document.getElementById('close').addEventListener('click', function(e) {
	window.parent.postMessage('close_replies_and_more_update_window', '*');
	e.preventDefault();
});

