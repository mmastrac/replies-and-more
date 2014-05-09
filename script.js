var RESCAN_PERIOD = 1000;
var RESCAN_PERIOD_IDLE = 5000;
var YIELD = 10;
var BATCH_SIZE = 40;

var foundSomeButtons = true;

var cachedCount = -1;
var settings;

// This is a copy of what Google+ uses for reply buttons
var REPLY_CSS = "white-space: nowrap; background-image: initial; background-attachment: initial; background-origin: initial; background-clip: initial; background-color: rgb(238, 238, 238); border-top-width: 1px; border-right-width: 1px; border-bottom-width: 1px; border-left-width: 1px; border-top-style: solid; border-right-style: solid; border-bottom-style: solid; border-left-style: solid; border-top-color: rgb(221, 221, 221); border-right-color: rgb(221, 221, 221); border-bottom-color: rgb(221, 221, 221); border-left-color: rgb(221, 221, 221); border-image: initial; border-top-left-radius: 2px; border-top-right-radius: 2px; border-bottom-right-radius: 2px; border-bottom-left-radius: 2px; display: inline-block; font-family: Arial, sans-serif; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; line-height: 1.4; margin-top: 0px; margin-right: 1px; margin-bottom: 0px; margin-left: 1px; padding-top: 0px; padding-right: 1px; padding-bottom: 0px; padding-left: 1px; vertical-align: baseline; color: rgb(51, 102, 204); background-position: initial initial; background-repeat: initial initial;"

var SHARE_DROPDOWN_CSS = "margin-left: -9px; margin-top:4px; width: 1.8ex; text-align: center; color: #999; border-radius-top-left: 1; border-radius-top-right: 1; text-decoration: none; cursor: pointer; position: absolute; border: 1px solid #d9d9d9; background-color: white;";

var PROCESSED_MARKER_CLASS = "plus_plus";

// ******************************************************************************
//  Google+ page classes
// ******************************************************************************

// The only approach that's worked so far is hard-coding selectors here, so we'll stick to it.
var CLASSES = {
    // Comment box
    COMMENT: classNameToSelector("Dt wu"),
    // Share button
    SHARE: classNameToSelector("Dg Ut"),
    // A post has been muted
    POST_MUTED: classNameToSelector("rj"),
    POST_TEXT: classNameToSelector("Bt Pm"),
    // A selector that matches both profile and comment names
    PROFILE_NAME: classNameToSelector("ob tv Ub"),
    // "Mute this post" menu item
    MUTE: classNameToSelector("ot nl"),
    SELECTED_POST: classNameToSelector("sb"),
    SAVE_POST: classNameToSelector("b-c-U"), // for edit
    SHARE_POST: classNameToSelector("b-c-Ba"), // for post, share and comment
    // For our share pseudo-dropdown
    BUTTON: classNameToSelector("sr"),
    // Read more (on posts)
    READ_MORE: classNameToSelector("syxni JBNexc"),
    SHOW_LESS: classNameToSelector("Ydiz JBNexc"),
    // Expanded comment section
    EXPANDED_COMMENTS: classNameToSelector("Fx3Tkd"),
    // A comment that is collapsed
    COLLAPSED_COMMENT: classNameToSelector("Gm"),
    // A comment that is collapsed
    COLLAPSED_COMMENT_READ_MORE: classNameToSelector("unQkyd"),
}

/*
 * Converts a class name to a selector we can query the document with.
 */
function classNameToSelector(className) {
    return { 
        selector: '.' + className.replace(/ /g, "."),
        className: className,
        matches: function(element) {
            return element.className.split(/\s+/).indexOf(this.className) != -1;
        },
        query: function(parent) {
            return parent.querySelector(this.selector);
        },
        queryAll: function(parent) {
            return parent.querySelectorAll(this.selector);
        },
        queryParents: function(start) {
            var parent = start;
            var element;
            while (parent) {
                if (element = this.query(parent))
                    return element;
                parent = parent.parentElement;
            }
            
            return null;
        }
    }
}

// ******************************************************************************
//  Generic DOM automation functions
// ******************************************************************************

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

function xpathFind(query) {
    var xpathResult = document.evaluate(query, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return xpathResult.singleNodeValue;
}


// ******************************************************************************
//  Google+ element manipulation
// ******************************************************************************

/*
 * Based on a glance at the CSS, muted posts have zero padding
 */
function isPostMuted(post) {
    return CLASSES.POST_MUTED.matches(post);
}

function extractProfile(profile) {
    return { profileLink: profile, profileName: profile.getAttribute('oid'), realName: profile.textContent };
}

function addClickListener(profile, action) {
    action.addEventListener("mouseup", function(e) {
        e.stopPropagation();
        e.preventDefault();
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
        var div = CLASSES.POST_TEXT.query(element);
        if (div) {
            text = div.textContent.trim();

            if (text.length < length)
               return text;
                
            return text.substring(0, length - 3) + "\u2026";
        }
        element = element.parentElement;
    }
    
    return null;
}

// ******************************************************************************
//  Google+ element manipulation
// ******************************************************************************


function addShareClickListener(dropdown) {
    dropdown.addEventListener("click", function(e) {
        e.stopPropagation();

        var popup = document.createElement("div");
        popup.style.cssText = "box-shadow: 0 2px 4px rgba(0, 0, 0, .2); border-radius: 2px; background-color: white; border: 1px solid #CCC; padding: 16px; position: absolute; z-index: 10000 !important;";
        // don't set top so the box inherits the current Y
        popup.style.left = document.body.scrollLeft + dropdown.getBoundingClientRect().left + "px";
        popup.style.top = document.body.scrollTop + dropdown.getBoundingClientRect().top + "px";

        var shareOnTwitter = document.createElement('a');
        shareOnTwitter.textContent = chrome.i18n.getMessage("share_on_twitter");
        shareOnTwitter.addEventListener("click", function() {
            window.open("http://twitter.com/intent/tweet?text=" + encodeURIComponent(determineText(dropdown, 118)) + "&url=" + determineUrl(dropdown), "gplus_share", "width=600,height=300");
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
        
        document.body.appendChild(popup);

        function popper() {
            popup.parentElement.removeChild(popup);
            document.removeEventListener("click", popper, true);
        }
        
        document.addEventListener("click", popper, true);
    }, true);
}


function reply(profile, action) {
    var parent = action.parentElement;
    var realName = profile.realName;
    var profileName = profile.profileName;

    while (parent != null) {
        var commentBox = CLASSES.COMMENT.query(parent);
        if (commentBox) {
            simulateClick(commentBox);

            var retry = 0;
            var fn = function() {
                // How far we'll walk up the parent chain to find the edit box
                var maxWalk = 3;

                if (retry == 50) {
                    console.log("Never found edit box");
                    return;
                }

                var editParent = parent;

                while (editParent != null) {
                    var textareas = editParent.querySelector("*[contenteditable]");
                    if (textareas) {
                        textareas.focus();    
                        
                        var sel = window.getSelection();
                        var range = sel.getRangeAt(0);
                        
                        var button = document.createElement('button');
                        button.className = 'btnplus' + profileName;
                        button.setAttribute('contenteditable', 'false');
                        button.setAttribute('tabindex', -1);                        
                        button.setAttribute('oid', profileName);
                        button.setAttribute('data-token-entity', '@' + profileName);
                        button.style.cssText = REPLY_CSS;
                        button.innerHTML = "<span style='display:none'>+" + profileName + "</span>";
                        var space = document.createTextNode('\u00a0');
                        range.insertNode(space);
                        range.insertNode(button);
                        range.setStartAfter(button);
                        range.collapse(false);
                        sel.removeAllRanges();
                        sel.addRange(range);

                        var style = document.createElement('style');
                        style.textContent = "button.btnplus" + profileName + " span { display: none; } button.btnplus" + profileName + ':after { content:"+' + realName + '" }';
                        button.appendChild(style);
             
                        return;
                    }
                    
                    editParent = editParent.parentElement;
                    maxWalk--;

                    if (maxWalk === 0) {
                        break;
                    }
                }

                console.log("Reply box not found, retrying..., parent was", parent);
                setTimeout(fn, 200);
            };

            fn();
            return;
        }

        parent = parent.parentElement;
    }
}

function processFooters(first) {
    var templateAction = null;

    if (settings.auto_expand_posts) {
        var readMoreLinks = CLASSES.READ_MORE.queryAll(document.body);
        for (var i = 0; i < readMoreLinks.length; i++) {
            if (readMoreLinks[i].style.display != 'none') {
                simulateClick(readMoreLinks[i]); 
                readMoreLinks[i].style.display = 'none';
            }
        }

        var showLessLinks = CLASSES.SHOW_LESS.queryAll(document.body);
        for (var i = 0; i < showLessLinks.length; i++) {
            if (showLessLinks[i].style.display != 'none') {
                showLessLinks[i].style.display = 'none';
            }
        }
    }

    var buttons = document.body 
        ? document.body.querySelectorAll("div[g\\:entity^=buzz]:not([" + PROCESSED_MARKER_CLASS + "]), button[g\\:entity^=comment]:not([" + PROCESSED_MARKER_CLASS + "])") 
        : [];

//    console.log("Buttons: " + buttons.length);
    if (!buttons || buttons.length == 0) {
        // Less aggressive if idle
        window.setTimeout(processFooters, foundSomeButtons ? RESCAN_PERIOD : RESCAN_PERIOD_IDLE);
        foundSomeButtons = false;
        return;
    }
    
    foundSomeButtons = true;
    
    for (var i = 0; i < buttons.length; i++) {
        var button = buttons[i];
        button.setAttribute(PROCESSED_MARKER_CLASS, 1);

        // Try to figure out what the author's name is
        var parent = button.parentElement;
        var profile;
        while (parent != null) {
            var profileLink = CLASSES.PROFILE_NAME.query(parent);
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
                var commentBox = CLASSES.COMMENT.queryParents(button);

                if (!commentBox || commentBox.__replies_and_more_processed)
                    continue;
                    
                commentBox.__replies_and_more_processed = true;
                
                var spacer = document.createElement('span');
                spacer.style.cssText = 'float: right; padding: 0px 7px; margin: 1px 0 8px 0; color: #999';
                spacer.textContent = ' - ';
//                commentBox.parentElement.insertBefore(spacer, commentBox);
                var replyToAuthor = document.createElement('a');
                replyToAuthor.style.cssText = 'float: right; color: #999';
                replyToAuthor.textContent = chrome.i18n.getMessage("reply_to_author");
                commentBox.appendChild(replyToAuthor);
    
                addClickListener(profile, replyToAuthor);
            }

            if (settings.extended_shares) {
                var share = CLASSES.SHARE.query(button.parentElement);
                // not shareable
                if (!share)
                    continue;
                    
                var dropdown = document.createElement("span");
                dropdown.textContent = "\u25BE"; // BLACK DOWN-POINTING SMALL TRIANGLE
                share.parentElement.insertBefore(dropdown, share.nextSibling);
                share.parentElement.insertBefore(document.createTextNode(" "), share.nextSibling);
                dropdown.style.cssText = SHARE_DROPDOWN_CSS;
                dropdown.className = CLASSES.BUTTON.className;
                
                addShareClickListener(dropdown);
            }
        }
    }

    window.setTimeout(processFooters, RESCAN_PERIOD);
}

function onLoad() {
    if (!window.location.href.match(/_\/notifications\//)) {
        chrome.extension.sendRequest({'name' : 'show_updates'}, function(theSettings) {
            var iframe = document.createElement('iframe');
            iframe.src = chrome.extension.getURL("updates.html");
            iframe.style.cssText = "position: fixed; border-width: 0px; left:15%; width: 70%; top:15%; height: 70%; z-index: +9999999; min-width: 400px; min-height: 400px";
            document.body.appendChild(iframe);
            window.addEventListener('message', function (e) {
                if (e.data == "close_replies_and_more_update_window") {
                    iframe.parentElement.removeChild(iframe);
                    chrome.extension.sendRequest({'name': 'clear_updates'});
                }
            });
        });
    }

    console.log("Loaded Google+: " + window.location.href);
    if (!settings) {
    	chrome.extension.sendRequest({'name' : 'settings'}, function(theSettings) {
            if (!settings) {
             	settings = theSettings;
             	if (settings.reply_to_author || settings.reply_to_comment || settings.extended_shares || settings.auto_expand_posts)
                    processFooters();
                if (settings.favicon_notify || settings.chime_notify || settings.desktop_notify)
                    processNotifications();
                if (settings.ctrl_enter_submit || settings.shift_enter_submit || settings.m_mute)
                    document.addEventListener("keydown", onKeyDown);
                if (settings.auto_expand_comments) {
                    var style = document.createElement('style');
                    style.innerText += CLASSES.EXPANDED_COMMENTS.selector + " "  + CLASSES.COLLAPSED_COMMENT.selector + " { max-height: inherit !important; } ";
                    style.innerText += CLASSES.EXPANDED_COMMENTS.selector + " "  + CLASSES.COLLAPSED_COMMENT_READ_MORE.selector + " { display: none; } ";

                    document.body.appendChild(style);
                }
            }
    	});
    }
}

function chime() {
    chrome.extension.sendRequest({name: 'chime'});
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

    // When the DOM event fires, check for new notifications
    holder.addEventListener('DOMSubtreeModified', checkNotifications, true);
}

function checkNotifications() {
    var count = notificationCount();

    if (count > cachedCount && cachedCount >= 0) {
        chrome.extension.sendRequest({ name: "notify" }, function() {
            console.log("Notify: " + cachedCount + " -> " + count);
            console.log(settings);
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
        if (settings.favicon_notify)
            notify();
    }   
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
            var button = CLASSES.SAVE_POST.query(parent) || CLASSES.SHARE_POST.query(parent);
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
            selectedPost = CLASSES.SELECTED_POST.query(document);
            if (selectedPost == null)
                return;
        } else {
            selectedPost = CLASSES.SELECTED_POST.query(document);
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
        
        var mute = CLASSES.MUTE.query(selectedPost);
        if (mute == null) {
            alert("Unable to find mute link");
            return;
        }
        simulateClick(mute);
    }
}


// ******************************************************************************
//  Boot code
// ******************************************************************************

var isJsPage = !!window.location.href.match(/_\/apps-static\//);
var isHangoutPage = !!window.location.href.match(/hangouts\/_/);
var isBlankPage = !!window.location.href.match(/_\/blank/);

function inject() {
    var listeners = [];
    var lastScroll = [0, 0];
    var stashedAddEventListener = document.addEventListener;
    document.addEventListener = function(a, b, c) {
        if (a == "scroll") {
            console.log("Ate scroll listener (Replies and More)");
            listeners.push(b);
            return;
        }
            
        stashedAddEventListener.apply(document, arguments);
    }
    
    setInterval(function() {
        if (!document.body)
            return;
        var scrollPos = [document.body.scrollTop, document.body.scrollLeft];
        if (scrollPos[0] == lastScroll[0] && scrollPos[1] == lastScroll[1])
            return;
        lastScroll = scrollPos;
        for (var i = 0; i < listeners.length; i++) {
            listeners[i]();
        }
    }, 500);
}

if (!isJsPage && !isHangoutPage && !isBlankPage) {
    console.log("**** Replies and More loaded for: " + window.location);
    document.addEventListener("DOMContentLoaded", onLoad);

/*    var script = document.createElement('script');
    script.innerHTML = inject.toString() + "\ninject();";
    document.documentElement.insertBefore(script, null);
    document.documentElement.removeChild(script);*/
    
}
