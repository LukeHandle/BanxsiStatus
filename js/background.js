// Load Variables
var banxsiAPI = 'http://banxsi.com/api/minecraftstatus?extension=' + chrome.app.getDetails().version,
    timerId = null;

function loadOptions() {
    chrome.storage.local.get({
        'checkFrequency': 15000,
        'notificationEnable': false,
        'notificationTimeout': 30000,
        'notificationEnableStatus': false,
        'notificationEnablePlayers': false,
        'notificationPlayerList': 'Banxsi, externo6, LukeHandle'
    }, function (items) {
        console.info('Loading in Options');
        console.debug(items);
        window.options = items;
        clearTimeout(timerId);
        updateMinecraftInfo();
    });
}

function updateBadge(badgeText, colour) {
    colour = typeof colour !== 'undefined' ? colour : '#000000';

    chrome.browserAction.setBadgeBackgroundColor({color: colour});
    chrome.browserAction.setBadgeText({text: badgeText});
}

function sendError(status, msg, badgeText, colour) {
    updateBadge(badgeText, colour);
    var offlineInfo = {"time": Math.round(Date.now() / 1000), 'status': status, 'msg': msg};
    window.minecraftInfo = offlineInfo;
    chrome.runtime.sendMessage({sendUpdate: true, data: offlineInfo});
}

function useMinecraftInfo(minecraftInfo) {
    window.minecraftInfo = minecraftInfo;
    if (minecraftInfo.status === 'online') {
        updateBadge(minecraftInfo.playeronline.toString());
    } else if (minecraftInfo.status === 'offline') {
        updateBadge('Off', '#FF0000');
    }
    chrome.runtime.sendMessage({sendUpdate: true, data: minecraftInfo});
}

function getMinecraftInfo() {
    if (navigator.onLine) {
        var timeNow = Math.round(Date.now() / 1000),
            requestObj = $.getJSON(banxsiAPI + '&rf=' + window.options.checkFrequency + '&t=' + timeNow, function (data) {
                useMinecraftInfo(data);
            }).fail(function (d, textStatus, error) {
                console.warn("getJSON failed, status: " + textStatus + ", error: " + error);
                sendError('unavailable', 'Could not connect to Banxsi.com', 'ERR', '#FF0000');
            });
        setTimeout(function () {requestObj.abort("timeout"); }, 5000);
    } else {
        console.warn("We appear to be Offline");
        sendError('noconnection', 'We appear to be Offline', 'N/C', '#FFFF00');
    }
}

function updateMinecraftInfo() {
    if (window.options.checkFrequency !== '0') {
        getMinecraftInfo();
        timerId = setTimeout(updateMinecraftInfo, window.options.checkFrequency);
    }
}

chrome.runtime.onMessage.addListener(function (request) {
    if (request.requestUpdate === true) {
        console.debug('Popover has requested update');
        if (typeof window.minecraftInfo === 'undefined') {
            window.minecraftInfo = {time: 0};
        }
        var timeData = window.minecraftInfo.time,
            timeNow = Math.round(Date.now() / 1000);
        if (timeData + 15 <= timeNow) {
            // Send the cached data
            chrome.runtime.sendMessage({sendUpdate: true, data: window.minecraftInfo});
            // The data is older than 15 second, force a re-check irrelevant of the frequency set in options
            console.debug('requestUpdate for new data. Time Data: ' + timeData + ', Time Now: ' + timeNow + ', Difference: ' + (timeNow - timeData));
            getMinecraftInfo();
        } else {
            // We can show them cached data
            console.debug('requestUpdate old data. Time Data: ' + timeData + ', Time Now: ' + timeNow + ', Difference: ' + (timeNow - timeData));
            chrome.runtime.sendMessage({sendUpdate: true, data: window.minecraftInfo});
        }
    }
});

chrome.storage.onChanged.addListener(function () {
    loadOptions();
});

loadOptions();
