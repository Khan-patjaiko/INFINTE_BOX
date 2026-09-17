(function(FS) {
  var session = FS.getCurrentSession(), sessionUrl = FS.getCurrentSessionURL();
  function retryWithBackoff(condition, callback, maxWait, failureMsg, timeoutCallback) {
    var totalTimeExpired = 0;
    var wait = 64;
    var resultFn = function() {
      if (condition()) {
        callback();
        return;
      }
      wait = Math.min(wait * 2, 1024);
      if (totalTimeExpired > maxWait) {
        FS.log('warn', failureMsg);
        !!timeoutCallback && timeoutCallback(failureMsg);
        return;
      }
      totalTimeExpired += wait
      setTimeout(resultFn, wait);
    };
    return resultFn;
  }
  function loadSession(key) {
	var lastSession = window['localStorage'].getItem(key);
    if (!lastSession) {
      lastSession = FS._cookies()[key];
    }
    return lastSession
  }
  function saveSession(key, session) {
    window['localStorage'].setItem(key, session);
  }

	window['_dlo_appender'] = 'fullstory';
	window['_dlo_telemetryExporter'] = (function() {
		var fsNs = (document.currentScript && document.currentScript.getAttribute('data-fs-namespace')) || window['_fs_namespace'] || 'FS';
		const eventNameMap = {
			dlo_init_span: 'INIT_DURATION',
			dlo_rule_registration_span: 'RULE_REGISTRATION_DURATION',
			dlo_handle_event_span: 'HANDLE_EVENT_DURATION',
			dlo_client_error: 'CLIENT_ERROR_COUNT',
		};

		function sendEvent(evt, value) {
			const metricName = eventNameMap[evt.name];
			if (!metricName) {
				return;
			}
			var fs = window[fsNs];
			if (typeof fs !== 'function') {
				return;
			}
			var cfg = fs('getConfig');
			var orgId = (cfg && cfg.env && cfg.env.orgId) || window['_fs_org'];
			const eventStatus = evt.name === 'dlo_client_error' ? 'FAILURE' : 'SUCCESS';
			const metadata = evt.attributes || {};
			metadata.name = metricName;
			metadata.value = value;
			fs('stat', {
				eventType: 'INTEGRATION_METRIC',
				payload: {
					provider_id: 'dlo',
					org_id: orgId,
					event_status: eventStatus,
					metadata: metadata,
				},
			});
		}

		return {
			sendSpan: function(spanEvent) {
				sendEvent(spanEvent, spanEvent.duration.toString());
			},
			sendCount: function(countEvent) {
				sendEvent(countEvent, countEvent.value.toString());
			},
		};
	}());
	window['_dlo_logLevel'] = 0;
	window['_dlo_beforeDestination'] = [{ name: 'convert', enumerate: true, index: -1 },{ name: 'suffix' },{ name: 'insert', value: 'dlo', position: -1 }];
	window['_dlo_previewMode'] = false;
	window['_dlo_readOnLoad'] = true;
	window['_dlo_validateRules'] = true;
	window['_dlo_enable_restart'] = false;

	window['_dlo_rules_adobe_am'] = [];
	window['_dlo_rules_ceddl'] = [];
	window['_dlo_rules_google_ec'] = [];
	window['_dlo_rules_google_ec_ga4'] = [];
	window['_dlo_rules_google_em'] = [];
	window['_dlo_rules_google_em_ga4'] = [];
	window['_dlo_rules_tealium_retail'] = [];
	try {
		window['_dlo_rules_custom'] = [
{
  "id": "fs-identify-customer-id",
  "source": "utag.data[^(customer_id,internal)]",
  "operators": [{
      "name": "query",
      "select": "$[(customer_id,internal)]"
  }, {
      "name": "insert",
      "select": "customer_id"
  }],
  "destination": "FS.identify",
  "readOnLoad": true,
  "monitor": true
}, 
{
"id": "fs-uservar-language",
"source": "navigator[(language)]",
"operators": [{
      "name": "rename",
      "properties": {
          "language": "locale"
      }
  }],
"destination": "FS.setUserVars",
"readOnLoad": true,
"monitor": false
},
{
  "id": "fs-page-path-var",
  "source": "_gaDataLayer",
  "operators": [{

      "name": "query",
      "select": "$[(tcc.nonLocalizedPagePath)]"
  }, {
      "name": "rename",
      "properties": {
          "tcc.nonLocalizedPagePath": "nonLocalizedPagePath"
      }
  }, {
      "name": "insert",
      "value": "page"
  }],
  "destination": "FS.setVars",
  "readOnLoad": true,
  "monitor": true
},
{
  "id": "fs-page-app_name",
  "source": "utag.data[^(app_name)]",
  "operators": [{

      "name": "query",
      "select": "$[(app_name)]"
  }, {
      "name": "insert",
      "value": "page"
  }],
  "destination": "FS.setVars",
  "readOnLoad": true,
  "monitor": true
},
{
  "id": "experiment",
  "source": "utag.data",
  "operators": [{

      "name": "query",
      "select": "$[(qp.hivemind, cp.xpdpp3, cp.hivemind)]"
  },{
      "name": "rename",
      "properties": {
          "cp.xpdpp3": "variant",
           "qp.hivemind": "hivemind",
          "cp.hivemind": "hivemind_id+variant"
      }
  }, {
      "name": "insert",
      "value": "hivemind experiment"
  }],
  "destination": "FS.event",
  "readOnLoad": true,
  "monitor": true
},{
"source": "_expDataLayer.dataLayerLog",
"operators": [
  {
    "name": "query",
    "select": "$.data"
  },
    {
    "name": "query",
    "select": "$[?(schema=add_micro_events)]"
  },
     {
    "name": "query",
    "select": "$.data.events"
  },
  {"name":"fan-out"},
  {
    "name": "query",
    "select": "$.data[(setting, percentageId, fqAppId)]"
  },
  {
    "name": "insert",
    "value": "Experiment"
  }
],
"destination": "FS.event"
},{
"source": "_expDataLayer.dataLayerLog",
"operators": [
  {
    "name": "query",
    "select": "$.data"
  },
    {
    "name": "query",
    "select": "$[?(schema=add_event)]"
  },
   {
    "name": "query",
    "select": "$.data"
  },
  {
    "name": "query",
    "select": "$[(eid)]"
  },
  { "name": "query",
    "select": "$[?(eid!=productivity.office365.panel.externaldomain.customerstep)]"
  },
  { "name": "query",
    "select": "$[?(eid!$.change)]"
  },
  { "name": "query",
    "select": "$[?(eid!$received)]"
  },
  {
    "name": "insert",
    "value": "EID"
  }
],
"destination": "FS.event"
}];
	} catch (err) {
		console.error('FullStory custom rules error; review DLO integration\'s custom rules.');
	}
	
	var mixpanelSessionUrl = sessionUrl + '?integration_src=mixpanel';
	// Check if the mixpanel script is on page
	if (window['mixpanel'] && typeof(mixpanel) == "object") {
		// Check if a new session has started since we last sent data to Mixpanel
		var lastSession = loadSession('fs_mixpanel');
		if (session != lastSession) {
			mixpanelFsIntegrationAsync();
		}
	} else {
		FS.log("warn", "Mixpanel integration is enabled, but mixpanel was not found on page");
		FS('stat', {
			eventType: 'INTEGRATION_INITIALIZED',
			payload: {
				provider_id: 'mixpanel',
				event_status: 'FAILURE',
				metadata: { detail: 'Mixpanel integration is enabled, but mixpanel was not found on page' }
			}
		})
	}

	// Wait for Mixpanel to be fully loaded before we try sending data
	// We can't use their on load callback because we don't call Mixpanel's init function, the client does that
	function mixpanelFsIntegrationAsync() {
		if(window['mixpanel']['__loaded']) {
			saveSession('fs_mixpanel', session);
			mixpanel.register({
				"FullStory Session": mixpanelSessionUrl
			});
			FS('stat', {
				eventType: 'INTEGRATION_INITIALIZED',
				payload: {
					provider_id: 'mixpanel',
					event_status: 'SUCCESS',
					metadata: { detail: 'mixpanel.register', sessionUrl: mixpanelSessionUrl }
				}
			})
			
		} else {
			setTimeout(mixpanelFsIntegrationAsync, 500);
		}
	}
	
  function runIntercept() {
    try {
      QSI.API.load()
      QSI.API.run()
      FS('stat', {
        eventType: 'INTEGRATION_INITIALIZED',
        payload: {
          provider_id: 'qualtrics',
          event_status: 'SUCCESS'
        }
      });
    } catch(e) {
      console.warn(e);
      FS.log("warn", "Failed to load or run QSI.API, please check your Qualtrics configuration.");
      FS('stat', {
        eventType: 'INTEGRATION_INITIALIZED',
        payload: {
          provider_id: 'qualtrics',
          event_status: 'FAILURE',
          metadata: {
            detail: 'Failed to load or run QSI.API, please check your Qualtrics configuration.'
          }
        }
      });
    }
  }

  if(typeof window.QSI !== 'undefined') {
    runIntercept();
  } else {
    window.addEventListener("qsi_js_loaded", runIntercept, false);
  }

	var dloScriptTag = document.createElement('script');
	dloScriptTag.type = 'text/javascript';
	dloScriptTag.async = true;
	var fsNs = (document.currentScript && document.currentScript.getAttribute('data-fs-namespace')) || window['_fs_namespace'] || 'FS';
	dloScriptTag.setAttribute('data-fs-namespace', fsNs);
	var fs = window[fsNs];
	var cfg = (typeof fs === 'function') ? fs('getConfig') : null;
	var recSettingsHost = (cfg && cfg.env && cfg.env.recSettingsHost) || window['_fs_rec_settings_host'];
	var host = (typeof recSettingsHost === 'string' && recSettingsHost) ? recSettingsHost : 'edge.fullstory.com';
	dloScriptTag.src = 'https://' + host + '/datalayer/v4/latest.js';
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(dloScriptTag,firstScriptTag);
	
})(window[document.currentScript&&document.currentScript.getAttribute('data-fs-namespace')||window['_fs_namespace']||'FS'])