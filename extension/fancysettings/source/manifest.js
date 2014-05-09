// SAMPLE
this.manifest = {
  "name": "Replies and more for Google+",
  "icon": "icon.png",
  "settings": [
    {
      "tab": chrome.i18n.getMessage("options"),
      "group": chrome.i18n.getMessage("options_features"),
      "name": "reply_to_author",
      "type": "checkbox",
      "label": chrome.i18n.getMessage("options_reply_to_author")
    },
    {
      "tab": chrome.i18n.getMessage("options"),
      "group": chrome.i18n.getMessage("options_features"),
      "name": "ctrl_enter_submit",
      "type": "checkbox",
      "label": chrome.i18n.getMessage("options_ctrl_enter_submit")
    },
    {
      "tab": chrome.i18n.getMessage("options"),
      "group": chrome.i18n.getMessage("options_features"),
      "name": "shift_enter_submit",
      "type": "checkbox",
      "label": chrome.i18n.getMessage("options_shift_enter_submit")
    },
    {
      "tab": chrome.i18n.getMessage("options"),
      "group": chrome.i18n.getMessage("options_features"),
      "name": "m_mute",
      "type": "checkbox",
      "label": chrome.i18n.getMessage("options_m_mute")
    },
    {
      "tab": chrome.i18n.getMessage("options"),
      "group": chrome.i18n.getMessage("options_features"),
      "name": "favicon_notify",
      "type": "checkbox",
      "label": chrome.i18n.getMessage("options_favicon_notify")
    },
    {
      "tab": chrome.i18n.getMessage("options"),
      "group": chrome.i18n.getMessage("options_features"),
      "name": "extended_shares",
      "type": "checkbox",
      "label": chrome.i18n.getMessage("options_extended_shares")
    },
    {
      "tab": chrome.i18n.getMessage("options"),
      "group": chrome.i18n.getMessage("options_features"),
      "name": "auto_expand_posts",
      "type": "checkbox",
      "label": chrome.i18n.getMessage("options_auto_expand_posts")
    },
    {
      "tab": chrome.i18n.getMessage("options"),
      "group": chrome.i18n.getMessage("options_features"),
      "name": "auto_expand_comments",
      "type": "checkbox",
      "label": chrome.i18n.getMessage("options_auto_expand_comments")
    },
    {
      "tab": chrome.i18n.getMessage("options"),
      "group": chrome.i18n.getMessage("options_extra_features"),
      "name": "desktop_notify",
      "type": "checkbox",
      "label": chrome.i18n.getMessage("options_desktop_notify")
    },
    {
      "tab": chrome.i18n.getMessage("options"),
      "group": chrome.i18n.getMessage("options_extra_features"),
      "name": "desktop_notify_test",
      "type": "button",
      "label": "",
      "text": chrome.i18n.getMessage("options_desktop_notify_test")
    },
    {
      "tab": chrome.i18n.getMessage("options"),
      "group": chrome.i18n.getMessage("options_extra_features"),
      "name": "chime_notify",
      "type": "checkbox",
      "label": chrome.i18n.getMessage("options_chime_notify")
    },
    {
      "tab": chrome.i18n.getMessage("options"),
      "group": chrome.i18n.getMessage("options_extra_features"),
      "name": "chime_notify_volume",
      "type": "slider",
      "label": chrome.i18n.getMessage("options_chime_notify_volume"),
      "max": 1.0,
      "min": 0.0,
      "step": 0.01,
      "display": true,
      "displayModifier": function (value) {
        return (value * 100).floor() + "%";
      }
    },
    {
      "tab": chrome.i18n.getMessage("options"),
      "group": chrome.i18n.getMessage("options_extra_features"),
      "name": "chime_notify_test",
      "type": "button",
      "label": "",
      "text": chrome.i18n.getMessage("options_chime_notify_test")
    },
    {
      "tab": chrome.i18n.getMessage("options"),
      "group": chrome.i18n.getMessage("options_bugs"),
      "name": "report_bug",
      "type": "button",
      "label": chrome.i18n.getMessage("options_report_bug"),
      "text": chrome.i18n.getMessage("options_report_bug_button")
    },
    {
      "tab": chrome.i18n.getMessage("options"),
      "group": chrome.i18n.getMessage("options_bugs"),
      "name": "extension_page",
      "type": "button",
      "label": chrome.i18n.getMessage("options_extension_page"),
      "text": chrome.i18n.getMessage("options_extension_page_button")
    },
    {
      "tab": chrome.i18n.getMessage("options"),
      "group": chrome.i18n.getMessage("options_author"),
      "name": "developer_page",
      "type": "button",
      "label": chrome.i18n.getMessage("options_developer_page"),
      "text": chrome.i18n.getMessage("options_developer_page_button")
    },
    {
      "tab": chrome.i18n.getMessage("options"),
      "group": chrome.i18n.getMessage("options_author"),
      "name": "extension_plus_page",
      "type": "button",
      "label": chrome.i18n.getMessage("options_extension_plus_page"),
      "text": chrome.i18n.getMessage("options_extension_plus_page_button")
    },
    {
      "tab": chrome.i18n.getMessage("options"),
      "group": chrome.i18n.getMessage("options_author"),
      "name": "donate_page",
      "type": "button",
      "label": chrome.i18n.getMessage("options_donate_page"),
      "text": chrome.i18n.getMessage("options_donate_page_button")
    }
  ],
  "alignment": [
    ["report_bug", "extension_page", "developer_page", "donate_page", "extension_plus_page"]
  ]
};
