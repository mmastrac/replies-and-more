window.addEvent("domready", function () {
    new FancySettings.initWithManifest(function (settings) {
        settings.manifest.report_bug.addEvent("action", function () {
            window.open("https://github.com/mmastrac/replies-and-more/issues");
        });
        settings.manifest.extension_page.addEvent("action", function () {
            window.open("https://chrome.google.com/webstore/detail/fgmhgfecnmeljhchgcjlfldjiepcfpea");
        });
        settings.manifest.extension_plus_page.addEvent("action", function () {
            window.open("https://plus.google.com/109811866821988569434");
        });
        settings.manifest.developer_page.addEvent("action", function () {
            window.open("https://plus.google.com/115459243651688775505/posts");
        });
        settings.manifest.donate_page.addEvent("action", function () {
            window.open("https://www.paypal.com/cgi-bin/webscr?hosted_button_id=8S4WFMJPNAWZ8&cmd=_s-xclick");
        });
        settings.manifest.desktop_notify_test.addEvent("action", function () {
            chrome.extension.sendRequest({ name: "desktopnotify", message: "Testing desktop notifications" });
        });
        settings.manifest.chime_notify_test.addEvent("action", function () {
            chrome.extension.sendRequest({ name: "chime" });
        });
    });
});
