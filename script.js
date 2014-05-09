var RESCAN_PERIOD = 1000;
var RESCAN_PERIOD_IDLE = 5000;
var YIELD = 10;
var BATCH_SIZE = 40;

var foundSomeButtons = true;

var cachedShortcutIcon;
var cachedCount = -1;
var settings;

// Forgive me, gods of programming
var COMMENT_CLASSNAME = "rBJ4nd Ln";
var SHARE_CLASSNAME = "c-wa-Da HPvmqf Dd1jcf";
var POST_TEXT_CLASSNAME = "rXnUBd";
var POST_NAME_CLASSNAME = "cs2K7c qk is";
var COMMENT_NAME_CLASSNAME = "cs2K7c qk xs";
var MUTE_CLASSNAME = "t0psmc z9lPad";
var SELECTED_POST_CLASSNAME = "Wbhcze bh";
var ORIGINALLY_SHARED_CLASSNAME = "Yt";
var SAVE_POST_CLASSNAME = "b-a-U"; // for edit
var SHARE_POST_CLASSNAME = "b-a-ga"; // for post, share and comment

// Major DRY violation here...
var COMMENT_SELECTOR = "." + COMMENT_CLASSNAME.replace(/ /g, ".");
var SHARE_SELECTOR = "." + SHARE_CLASSNAME.replace(/ /g, ".");
var SELECTED_POST_SELECTOR = "." + SELECTED_POST_CLASSNAME.replace(/ /g, ".");
var MUTE_SELECTOR = "." + MUTE_CLASSNAME.replace(/ /g, ".");
var PROFILE_NAME_SELECTOR = "." + POST_NAME_CLASSNAME.replace(/ /g, ".") + ", ." + COMMENT_NAME_CLASSNAME.replace(/ /g, ".");
var POST_TEXT_SELECTOR = "." + POST_TEXT_CLASSNAME.replace(/ /g, ".");
var ORIGINALLY_SHARED_SELECTOR = "." + ORIGINALLY_SHARED_CLASSNAME.replace(/ /g, ".");
var SAVE_POST_SELECTOR = "." + SAVE_POST_CLASSNAME.replace(/ /g, ".");
var SHARE_POST_SELECTOR = "." + SHARE_POST_CLASSNAME.replace(/ /g, ".");

/*
 * Based on a glance at the CSS, muted posts have zero padding
 */
function isPostMuted(post) {
    console.log(computeStyle(post, "paddingLeft"));
    return computeStyle(post, "paddingLeft") == '0px' && computeStyle(post, "paddingTop") == '0px';
}


console.log("******** " + window.location);

var isJsPage = !!window.location.href.match(/_\/apps-static\//);

function computeStyle(element, style) {
    return window.getComputedStyle(element)[style];
}

function isVisible(element) {
    while (element != null) {
        if (window.getComputedStyle(element).display == "none")
            return false;
        element = element.parentElement;
    }
    
    return true;
}

function extractProfile(profile) {
    return { profileLink: profile, profileName: profile.getAttribute('oid'), realName: profile.textContent };
}

function addClickListener(profile, action) {
    action.addEventListener("mouseup", function(e) {
        e.stopPropagation();
        reply(profile, action);
    }, false);
}

function determineUrl(element) {
    element = element.parentElement;
    while (element != null) {
        var a = element.querySelector("a[target=_blank][href*=posts]");
        if (a)
            return a.href; // fully qualified href
        element = element.parentElement;
    }
    
    return null;
}

function determineText(element, length) {
    element = element.parentElement;
    while (element != null) {
        var div = element.querySelector(POST_TEXT_SELECTOR);
        if (div) {
            text = div.textContent

            // HACK: Chop off that 'edit' text
            if (text.substring(text.length - 4, text.length) == "Edit")
                text = text.substring(0, text.length - 4);
            if (text.length < length)
               return text;
                
            return text.substring(0, length - 3) + "...";
        }
        element = element.parentElement;
    }
    
    return null;
    
}

function addShareClickListener(dropdown) {
    dropdown.addEventListener("click", function(e) {
        var popup = document.createElement("div");
        popup.style.cssText = "box-shadow: 0 2px 4px rgba(0, 0, 0, .2); border-radius: 2px; background-color: white; border: 1px solid #CCC; padding: 16px; position: absolute; z-index: 1201!important;";
        // don't set top so the box inherits the current Y
        popup.style.left = e.offsetX + "px";
        
        var shareOnTwitter = document.createElement('a');
        shareOnTwitter.textContent = chrome.i18n.getMessage("share_on_twitter");
        shareOnTwitter.addEventListener("click", function() {
            window.open("http://twitter.com/intent/tweet?text=" + encodeURIComponent(determineText(dropdown, 119)) + "&url=" + determineUrl(dropdown), "gplus_share", "width=600,height=300");
        }, false);
        shareOnTwitter.style.display = "block";
        popup.appendChild(shareOnTwitter);
        
        var shareOnFacebook = document.createElement('a');
        shareOnFacebook.textContent = chrome.i18n.getMessage("share_on_facebook");
        shareOnFacebook.addEventListener("click", function() {
            window.open("http://www.facebook.com/sharer.php?u=" + determineUrl(dropdown) + "&t=" + encodeURIComponent(determineText(dropdown, 400)), "gplus_share", "width=600,height=300");
        }, false);
        shareOnFacebook.style.display = "block";
        popup.appendChild(shareOnFacebook);

        var shareByEmail = document.createElement('a');
        shareByEmail.textContent = chrome.i18n.getMessage("share_by_email");
        shareByEmail.addEventListener("click", function() {
            window.open("mailto:?body=" + encodeURIComponent(determineText(dropdown, 400) + "\n\n" + determineUrl(dropdown) + "\n") + "&subject=" + encodeURIComponent("Google+ Share"));
        }, false);
        shareByEmail.style.display = "block";
        popup.appendChild(shareByEmail);
        
        dropdown.parentElement.appendChild(popup);


        function popper() {
            popup.parentElement.removeChild(popup);
            document.removeEventListener("click", popper, true);
        }
        
        document.addEventListener("click", popper, true);
    }, true);
}

function simulateClick(element) {
    var clickEvent;
    clickEvent = document.createEvent("MouseEvents")
    clickEvent.initEvent("mousedown", true, true)
    element.dispatchEvent(clickEvent);
    
    clickEvent = document.createEvent("MouseEvents")
    clickEvent.initEvent("click", true, true)
    element.dispatchEvent(clickEvent);
    
    clickEvent = document.createEvent("MouseEvents")
    clickEvent.initEvent("mouseup", true, true)
    element.dispatchEvent(clickEvent);
}

function reply(profile, action) {
    var parent = action.parentElement;
    var realName = profile.realName;
    var profileName = profile.profileName;

    while (parent != null) {
        var commentLinks = parent.getElementsByTagName("span");
        for ( var i = 0; i < commentLinks.length; i++) {
            var span = commentLinks[i];
            if (span.textContent == "Comment" || span.className == COMMENT_CLASSNAME) {
                simulateClick(span);

                setTimeout(function() {
                    while (parent != null) {
                        var textareas = parent.querySelector("*[contenteditable]");
                        if (textareas) {
                            textareas.focus();    
                            
                            textareas.setAttribute("contenteditable", "true");            
                            // epic hack
                              var placeholder = profileName + " ";
                            document.execCommand('insertHTML', false, "<button tabindex='-1' id='btnplus" + profileName + "' contenteditable='false' style=''>+<span style='display:none'>" + profileName + "</span></button> <span> </span>");
                            var button = document.getElementById('btnplus' + profileName);
                            var style = document.createElement('style');
                            style.textContent = "button#btnplus" + profileName + " { white-space: nowrap; background-image: initial; background-attachment: initial; background-origin: initial; background-clip: initial; background-color: rgb(238, 238, 238); border-top-width: 1px; border-right-width: 1px; border-bottom-width: 1px; border-left-width: 1px; border-top-style: solid; border-right-style: solid; border-bottom-style: solid; border-left-style: solid; border-top-color: rgb(221, 221, 221); border-right-color: rgb(221, 221, 221); border-bottom-color: rgb(221, 221, 221); border-left-color: rgb(221, 221, 221); border-top-left-radius: 2px 2px; border-top-right-radius: 2px 2px; border-bottom-right-radius: 2px 2px; border-bottom-left-radius: 2px 2px; display: inline-block; font: normal normal normal 13px/1.4 Arial, sans-serif; margin-top: 0px; margin-right: 1px; margin-bottom: 0px; margin-left: 1px; padding-top: 0px; padding-right: 1px; padding-bottom: 0px; padding-left: 1px; vertical-align: baseline; color: rgb(51, 102, 204); background-position: initial initial; background-repeat: initial initial; } button#btnplus" + profileName + ':after { content:"' + realName + '" }';
                            button.appendChild(style);
                                                                            
                            textareas.setAttribute("contenteditable", "plaintext-only");

                            return;
                        }
                        
                        parent = parent.parentElement;
                    }
                }, 200);            
                return;
            }
        }

        parent = parent.parentElement;
    }
}

function processFooters(first) {
    try {
        var templateAction = null;

        var buttons = document.body ? document.body.querySelectorAll("button[g\\:entity^=buzz]:not([plus_plus]), button[g\\:entity^=comment]:not([plus_plus])") : [];

//        console.log("Buttons: " + buttons.length);
        if (!buttons || buttons.length == 0) {
            // Less aggressive if idle
            window.setTimeout(processFooters, foundSomeButtons ? RESCAN_PERIOD : RESCAN_PERIOD_IDLE);
            foundSomeButtons = false;
            return;
        }
        
        foundSomeButtons = true;
        
        for (var i = 0; i < buttons.length; i++) {
            var button = buttons[i];
            button.setAttribute("plus_plus", 1);

            // Try to figure out what the author's name is
            var parent = button.parentElement;
            var profile;
            while (parent != null) {
                var profileLink = parent.querySelector(PROFILE_NAME_SELECTOR);
                if (profileLink) {
                    profile = extractProfile(profileLink);
                    break;
                }
                
                parent = parent.parentElement;
            }
            
            if (!profile)
                continue;
             
            if (button.id.match(/#/)) {
                if (settings.reply_to_comment) {
                    // comment
                    var newButton = document.createElement('a');
                    newButton.setAttribute('role', 'button');
                    newButton.textContent = chrome.i18n.getMessage("reply_to_comment");
                    
                    button.parentElement.appendChild(document.createTextNode('\u00a0\u00a0-\u00a0\u00a0'));
                    button.parentElement.appendChild(newButton, null);
                    addClickListener(profile, newButton);
                }
            } else {
                if (settings.reply_to_author) {
                    // top-level item
                    var prototypeElement = button.nextElementSibling;
                    
                    // this item has no comment/share links at all (totally private)
                    if (prototypeElement == null)
                        continue;
                    
                    var newButton = prototypeElement.cloneNode(true);
        
                    newButton.textContent = chrome.i18n.getMessage("reply_to_author");
                    button.parentElement.appendChild(button.nextSibling.cloneNode(true));
                    button.parentElement.appendChild(newButton, null);
        
                    addClickListener(profile, newButton);
                }

                if (settings.extended_shares) {
                    var share = button.parentElement.querySelector(SHARE_SELECTOR);
                    // not shareable
                    if (!share)
                        continue;
                        
                    var dropdown = document.createElement("a");
                    dropdown.textContent = "\u25BE"; // BLACK DOWN-POINTING SMALL TRIANGLE
                    share.parentElement.insertBefore(dropdown, share.nextSibling);
                    share.parentElement.insertBefore(document.createTextNode(" "), share.nextSibling);
                    
                    addShareClickListener(dropdown);
                }
            }
        }

        window.setTimeout(processFooters, RESCAN_PERIOD);
    } catch (e) {
        console.log(e);
    }
}

function onLoad() {
    console.log("Loaded Google+: " + window.location.href);
    if (!settings) {
    	chrome.extension.sendRequest({'name' : 'settings'}, function(theSettings) {
            if (!settings) {
             	settings = theSettings;
             	if (settings.reply_to_author || settings.reply_to_comment || settings.extended_shares)
                    processFooters();
                if (settings.favicon_notify)
                    processNotifications();
                if (settings.ctrl_enter_submit || settings.shift_enter_submit || settings.m_mute)
                    document.addEventListener("keydown", onKeyDown);
            }
    	});
    }
    
    var script = document.createElement('script');
    script.textContent = "if (window.OZ_initData){var __tmp = document.createElement('noscript');__tmp.id='grp__initData_mm';__tmp.textContent=JSON.stringify(OZ_initData);document.body.appendChild(__tmp);}";
    document.body.appendChild(script);
    
    var elem = document.getElementById('grp__initData_mm');
    if (elem) {
        var OZ_initData = JSON.parse(elem.textContent);
    
        elem.parentNode.removeChild(elem);
        if (OZ_initData[4] && OZ_initData[4][0]) {
            var initial = OZ_initData[4][0];
            for (var i = 0; i < initial.length; i++) {
                processPostPayload(initial[i]);
            }
        }
    
        if (OZ_initData[20]) {
            processPostPayload(OZ_initData[20]);
        }
    }
}

function chime() {
    var audio = document.createElement('audio');
    audio.src = chrome.extension.getURL("chime.mp3");
    audio.autoplay = true;
    audio.addEventListener('ended', function() {
        audio.parentElement.removeChild(audio);
    }, true);
    audio.volume = settings.chime_notify_volume;
    document.body.appendChild(audio);
}

function desktopNotify(count) {
    var message;
    if (count == 1) {
        message = chrome.i18n.getMessage("desktop_notify_1");
    } else {
        message = chrome.i18n.getMessage("desktop_notify_n", [count]);
    }
    
    chrome.extension.sendRequest({ name: "desktopnotify", message: message });
}

function processNotifications() {
    var holder = document.getElementById('gbgs1');
    // this must be a page without notifications
    if (holder == null)
        return;
    holder.addEventListener('DOMSubtreeModified', function() {
        var count = notificationCount();
    
        if (count > cachedCount && cachedCount >= 0) {
            chrome.extension.sendRequest({ name: "notify" }, function() {
                console.log("Notify: " + cachedCount + " -> " + count);
                if (settings.chime_notify) {
                    console.log("Chime");
                    chime();
                }
                if (settings.desktop_notify) {
                    console.log("Desktop notify");
                    desktopNotify(count);
                }
            });
        }
    
        if (count != cachedCount) {
            console.log("Found notifications: " + count);
            cachedCount = count;
            notify();
        }
    }, true);
}

function notify() {
    chrome.extension.sendRequest({ name: "favicon", count: cachedCount }, function(dataURL) {
        var shortcut = document.querySelector("link[rel=shortcut\\ icon]");
        if (shortcut == null)
            return;
            
        var shortcut2 = shortcut.cloneNode(true);
        shortcut2.href = dataURL;
        shortcut2.type = 'image/png';

        shortcut.parentElement.replaceChild(shortcut2, shortcut);
    });
}

function notificationCount() {
    var notifications = document.getElementById('gbi1');
    if (notifications != null && notifications.textContent.trim() != "") {
        if (notifications.textContent == "9+")
            return 9;
            
        return +notifications.textContent;
    }
    
    return -1;
}

function onKeyDown(e) {
    if (e.keyCode == 13 && ((settings.ctrl_enter_submit && e.ctrlKey) || (settings.shift_enter_submit && e.shiftKey))) {
        var parent = e.target.parentElement;
        while (parent != null) {
            parent = parent.parentElement;
            var button = parent.querySelector("div" + SAVE_POST_SELECTOR) || parent.querySelector("div" + SHARE_POST_SELECTOR);
            if (button != null) {
                simulateClick(button);
                break;
            }
        }
    }
    
    if (settings.m_mute && String.fromCharCode(e.keyCode) == 'M') {
        console.log(document.activeElement);
        
        var selectedPost;
        
        if (document.activeElement == null || document.activeElement.tagName == "BODY") {
            selectedPost = document.querySelector(SELECTED_POST_SELECTOR);
            if (selectedPost == null)
                return;
        } else {
            selectedPost = document.querySelector(SELECTED_POST_SELECTOR);
            if (selectedPost != document.activeElement) {
                // Don't capture when not clicking on a post
                return;
            }
        }
        
        if (isPostMuted(selectedPost)) {
            var unmute = selectedPost.querySelector("span[role=button]");
            console.log("Unmuting post");   
            simulateClick(unmute);
            return;
        }
                
        console.log("Muting post");   
        
        var menu = selectedPost.querySelector("span[role=button][aria-haspopup=true]");
        if (menu == null) {
            alert("Unable to find menu");
            return;
        }
        simulateClick(menu);
        
        var mute = selectedPost.querySelector(MUTE_SELECTOR);
        if (mute == null) {
            alert("Unable to find mute link");
            return;
        }
        simulateClick(mute);
    }
}


function xpathFind(query) {
    var xpathResult = document.evaluate(query, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return xpathResult.singleNodeValue;
}

if (window.location.href == "https://plus.google.com/114791921155677330282/posts") {
    console.log("Found resync page");
    window.addEventListener('DOMContentLoaded', function() {
        var classnames = {};    
        classnames['COMMENT_CLASSNAME'] = xpathFind("//span[@role='button' and text()='Comment']").className;
        classnames['SHARE_CLASSNAME'] = xpathFind("//span[@role='button' and text()='Share']").className;
        classnames['POST_TEXT_CLASSNAME'] = xpathFind("//*[text()='I do not enjoy this.']").className;
  
        var profileNames = document.evaluate("//a[@oid]", document, null, XPathResult. ORDERED_NODE_SNAPSHOT_TYPE, null)
        for (var i = 0; i < profileNames.snapshotLength; i++) {
            var node = profileNames.snapshotItem(i);
            if (node.textContent != '') {
                if (node.textContent == 'John Gruber')
                    classnames['POST_NAME_CLASSNAME'] = node.className;
                else
                    classnames['COMMENT_NAME_CLASSNAME'] = node.className;
            }
        }
  
        var output = ''
        for (x in classnames) {
            output += 'var ' + x + ' = "' + classnames[x] + '";\n';
        }
        console.log(output);
        classnames = {};

        var menu = xpathFind("//*[@title='Options menu']");
        simulateClick(menu);
        window.setTimeout(function() {
            var mute = xpathFind("//*[text()='Mute this post']").parentElement;
            classnames['MUTE_CLASSNAME'] = mute.className;
            simulateClick(mute);
            window.setTimeout(function() {
                var post = document.getElementById('update-z13hshabgtu2crawu04cdtqgjozwj5e4z4c');
                simulateClick(post);
                window.setTimeout(function() {
                    classnames['SELECTED_POST_CLASSNAME'] = post.className;
                    var output = ''
                    for (x in classnames) {
                        output += 'var ' + x + ' = "' + classnames[x] + '";\n';
                    }
                    console.log(output);
                }, 500);
            }, 500);
        }, 500);
    }, false);
}


function processPostPayload(payload) {
    if (payload[77]) {
        //console.log([payload]);
        var shareLink = payload[77];
        var originalId = payload[8];
        
        console.log(originalId + " -> " + shareLink); 
        
        setTimeout(function() {
            var post = document.getElementById('update-' + originalId);
            if (post) {
                var text = post.querySelector(ORIGINALLY_SHARED_SELECTOR);
                if (text) {
                    var textElement = text.lastChild;
                    while (textElement && textElement.nodeType != 3) {
                        textElement = textElement.previousSibling;
                    }
                    
                    if (textElement) {
                        var a = document.createElement('a');
                        a.textContent = textElement.textContent;
                        a.href = shareLink;
                        a.style.cssText = 'text-decoration: none; color: #999;';
                        textElement.parentNode.replaceChild(a, textElement);
                    }
                } else {
                    console.log("Unable to find share note for post " + originalId);
                }
            } else {
                    console.log("Unable to find post " + originalId);
            }
        }, 2000);
    }
}

function grabXMLHttpRequest() {
    var oldXHR = XMLHttpRequest;
    var open = XMLHttpRequest.prototype.open;
    var messageNode = document.getElementById('__internalGRPEventNode');
    
    console.log("DEBUG: Grabbing XMLHttpRequest in " + window.location);
    XMLHttpRequest.prototype.open = function(a,b,c) { 
        //console.log("OPEN: " + a + " " + b + " " + c);
        try {
            // Some Google+ code passes rich objects in as the URL
            a = "" + a;
            b = "" + b;
            var xhr = this;
            if (b.match(/\/_\/stream\/getactivities/) || b.match(/\/_\/profiles\/get/)) {
                xhr.addEventListener("readystatechange", function() {
                    if (xhr.readyState == 4) {
                        console.log("DEBUG: Received page change data for " + b);
                        var messageNode = window.top.document.createElement('meta');
                        window.top.document.head.insertBefore(messageNode, window.top.document.head.firstChild);
                        messageNode.id = "__internalGRPEventNode";

                        var data = eval(xhr.responseText.substring(4));
                        messageNode.setAttribute("__data", JSON.stringify(eval(data)));
                        var customEvent = window.top.document.createEvent('Event');
                        customEvent.initEvent('__internalGRPEvent', true, true);
                        window.top.dispatchEvent(customEvent);
                    }
                }, true);
            }
        } catch (e) {
            // ignore
            console.log("Error when hooking request: " + e);
        }
        return open.apply(xhr, arguments); 
    }
}

if (isJsPage) {
    chrome.extension.sendRequest({'name' : 'settings'}, function(settings) {
        if (settings.beta_original_share) {
            console.log("DEBUG: Injecting into script page");
            console.log(document.head);
            /*window.addEventListener("load", function() {*/
                console.log("DEBUG: onLoad in script page");
                var script = document.createElement('script');
                script.textContent = grabXMLHttpRequest.toString() + " grabXMLHttpRequest()";
                document.head.insertBefore(script, document.head.firstChild);
            /*}, false);*/
        }
    });
} else {
    window.addEventListener('__internalGRPEvent', function() {
        console.log("DEBUG: Received page change data via message...");
        var messageNode = document.getElementById('__internalGRPEventNode');
        var data = JSON.parse(messageNode.getAttribute("__data"));
        messageNode.removeAttribute("__data");
        console.log(data);
        var packet = data[0][0];
        if (packet[0] == "os.nu") {
            var posts = packet[1][0];
            console.log("Processing " + posts.length + " post(s)");
            for (var i = 0; i < posts.length; i++) {
                processPostPayload(posts[i]);
            }
        }
        if (packet[0] == "op.gp") {
            var posts = packet[1][4][0];
            console.log("Processing " + posts.length + " post(s)");
            for (var i = 0; i < posts.length; i++) {
                processPostPayload(posts[i]);
            }
        }
    }, false);

    document.addEventListener("DOMContentLoaded", onLoad);
    cachedShortcutIcon = new Image();
    cachedShortcutIcon.src = "favicon2.ico";
    chrome.extension.sendRequest({'name' : 'settings'}, function(settings) {
        if (settings.beta_original_share) {
            console.log("DEBUG: Hooking message");
            window.addEventListener('message', function(e) { 
                var sn = e.data.indexOf("*sn:");
                try {
                    if (sn != -1) {
                        var data = JSON.parse(e.data.substring(sn+4));
                        for (var i = 0; i < data[0].length; i++) {
                            var item = data[0][i];
                            if (item.type == "tu") {
                                for (var j = 0; j < item.payload.length; j++) {
                                    var payload = eval(item.payload[j]);
                                    if (payload[0] == "t.rtu") {
                                        processPostPayload(payload[1]);
                                    }
                                }
                            } 
                        }
                    }
                } catch (e) {
                    // ignore
                }
            }, false);
        }
    });
}
