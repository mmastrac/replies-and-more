var settings = new Store("settings", {
    "reply_to_author": true,
    "ctrl_enter_submit": true,
    "shift_enter_submit": true,
    "m_mute": true,
    "favicon_notify": true,
    "desktop_notify": false,
    "chime_notify": false,
    "chime_notify_volume": 0.5,
    "auto_expand_posts": true,
    "auto_expand_comments": true,
    "extended_shares": true
});

var multipleNotify = false;
var CURRENT_UPDATES_VALUE = 2;

var cachedShortcutIcon = new Image();
cachedShortcutIcon.src = "favicon2.ico";

function onRequest(request, sender, callback) {
    if (request.name == 'settings')
        callback(settings.toObject());
    if (request.name == 'notify') {
        // simple test to ensure notifications don't fire twice in a 5s period
        if (!multipleNotify) {
            multipleNotify = true;
            setTimeout(function() { multipleNotify = false; }, 5000);
            callback();
        }
    }
    if (request.name == 'desktopnotify') {
        var notification = webkitNotifications.createNotification(
          'icon32.png',
          'Google+',
          request.message
        );
        
        notification.show();
        notification.ondisplay = function() {
            setTimeout(function() { notification.cancel(); }, 5000);
        };
    }
    if (request.name == 'favicon') {
        var canvas = document.createElement('canvas');
        var dp = window.devicePixelRatio;
        canvas.width = 16 * dp;
        canvas.height = 16 * dp;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(cachedShortcutIcon, 0, 0, 16 * dp, 16 * dp);
        if (request.count > 0) {
            ctx.fillStyle = "#000";//"#e33";
            ctx.fillRect(8 * dp, 8 * dp, 8 * dp, 8 * dp);
            ctx.font = (8 * dp) + "px Arial";
            ctx.fillStyle = "#fff";
            ctx.fillText(request.count, 9.5 * dp, 14.5 * dp);
            ctx.fillStyle = "#eee";
            ctx.fillText(request.count, 10 * dp, 15 * dp);
        }  
        
        callback(canvas.toDataURL());
    }
    if (request.name == 'clear_updates') {
        localStorage['update_shown'] = CURRENT_UPDATES_VALUE;
    }
    if (request.name == 'show_updates') {
        // var updates = +localStorage['update_shown'];
        // if (isNaN(updates) || updates < CURRENT_UPDATES_VALUE)
        //     callback()
    }
    if (request.name == 'chime') {
        var audio = document.createElement('audio');
        audio.src = chrome.extension.getURL("chime.mp3");
        audio.autoplay = true;
        audio.addEventListener('ended', function() {
            audio.parentElement.removeChild(audio);
        }, true);
        audio.volume = +settings.toObject().chime_notify_volume;
        document.body.appendChild(audio);
    }
};

// Wire up the listener.
chrome.extension.onRequest.addListener(onRequest);