// Load Variables
var workingAPI = 'http://banxsi.com/api/minecraftstatus?extension=' + chrome.app.getDetails().version,
    deadAPI = 'http://0.0.0.0/api/minecraftstatus?extension=' + chrome.app.getDetails().version,
    banxsiAPI = workingAPI,
    checkTimer = null;

function toggleAPI() {
    if (banxsiAPI === workingAPI) {
        banxsiAPI = deadAPI;
        console.debug('banxsiAPI = ' + deadAPI);
    } else {
        banxsiAPI = workingAPI;
        console.debug('banxsiAPI = ' + workingAPI);
    }
}

function sendNotification(id, subject, body, icon) {
    var notificationTimeout = window.options.notificationTimeout;
    icon = '../img/icon196.png';

    // If Notifications are enabled send one
    if (window.options.notificationEnable) {
        chrome.notifications.create(id, {
            type: 'basic',
            title: subject,
            message: body,
            iconUrl: icon
        }, function (id) {
            console.debug('Notification ID: ' + id);
            if (notificationTimeout !== '0') {
                setTimeout(function () {
                    chrome.notifications.clear(id, function () {});
                    }, notificationTimeout);
            }
        });
    }

    console.debug('Notification Title: ' + subject + ', Body: ' + body + ', Icon: ' + icon);
}

function sendAlert() {
    // If Alert Sounds are enabled send one
    if (window.options.alertEnable) {
        // Sound here
        console.debug('Play alert sound');
    } else {
        console.debug('Alert sound is disabled');
    }
}

function sendUpdate(minecraftInfo, badgeText, colour) {
    chrome.browserAction.setBadgeBackgroundColor({color: colour});
    chrome.browserAction.setBadgeText({text: badgeText});
    window.minecraftInfo = minecraftInfo;
    chrome.runtime.sendMessage({sendUpdate: true, data: minecraftInfo});
}

function trackFailure(attempt, checkFrequency, reason) {
    minecraftInfo = window.minecraftInfo;
    console.log('Number of failures: ' + attempt);
    if (attempt < 3) {
        checkFrequency = 15000;
    } else if (attempt === 3) {
        console.info('Banxsi.com has been unavailable for more than 45 seconds');
        var subject = 'Banxsi.com appears to be ' + reason + '...';
        if (minecraftInfo.msg) {
            // One of the things that needs to be improved before Messaging is released - they should be an object with a severity/importance to uptime.
            // No point now showing a message about a new rule etc.
            // Alright for the moment while the msg is blanked.
            subject = subject + '\n"' + minecraftInfo.msg + '"';
        }
        if (window.options.notificationEnableStatus) {
            sendNotification(reason, 'Status Update', subject);
            sendAlert();
        } else {
            console.debug('Status notifications are disabled. Subject: ' + subject);
        }
    }
    return {
        'attempt': attempt + 1,
        'checkFrequency': checkFrequency
    };
}

function getMinecraftInfo(attempt) {
    console.debug('begin checkTimer: ' + checkTimer);
    clearTimeout(checkTimer);
    checkTimer = null;
    var minecraftInfo = {},
        trackFailureRet = null,
        checkFrequency = window.options.checkFrequency,
        timeNow = Math.round(Date.now() / 1000);
    if (navigator.onLine) {
        $.ajax({
            dataType: 'json',
            url: banxsiAPI + '&t=' + timeNow,
            timeout: 3000,
            success: function (data) {
                minecraftInfo = data;
                // The message feature is not ready for release and is therefore blanked here.
                //minecraftInfo.msg = '';
                minecraftInfo.clientTime = Math.round(Date.now() / 1000);
                if (minecraftInfo.status === 'online') {
                    sendUpdate(minecraftInfo, minecraftInfo.playeronline.toString(), '#000000');
                } else {
                    sendUpdate(minecraftInfo, 'Off', '#FF0000');
                    trackFailureRet = trackFailure(attempt, checkFrequency, minecraftInfo.status);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.warn('ajax failed, status: ' + textStatus + ' thrown: ' + errorThrown);
                sendUpdate({
                    'time': Math.round(Date.now() / 1000),
                    'status': 'unavailable',
                    'msg': 'Could not connect to Banxsi.com'
                }, 'ERR', '#FF0000');
                trackFailureRet = trackFailure(attempt, checkFrequency, 'unavailable');
            },
            complete: function () {
                if (trackFailureRet) {
                    attempt = trackFailureRet.attempt;
                    checkFrequency = trackFailureRet.checkFrequency;
                }
                console.debug('complete checkTimer: ' + checkTimer);
                console.debug('Next re-check in ' + checkFrequency + ' milliseconds');
                if (checkFrequency !== '0') {
                    checkTimer = setTimeout(function () {
                        getMinecraftInfo(attempt);
                    }, checkFrequency);
                }
            }
        });
    } else {
        console.info('We (Chrome) appear to be offline/no connection.');
        sendUpdate({
            'time': timeNow,
            'status': 'noconnection',
            'msg': 'We appear to have no internet connection. Please check your internet connectivity.'
        }, 'N/C', '#FF9000');
    }
}

function loadOptions() {
    chrome.storage.local.get({
        'checkFrequency': 15000,
        'notificationEnable': false,
        'alertEnable': false,
        'notificationTimeout': 30000,
        'notificationEnableStatus': false,
        'notificationEnablePlayers': false,
        'notificationPlayerList': 'Banxsi, externo6, LukeHandle'
    }, function (items) {
        console.info('Loading in Options');
        console.debug(items);
        window.options = items;
        getMinecraftInfo(1);
    });
}

chrome.runtime.onMessage.addListener(function (request) {
    if (request.requestUpdate === true) {
        if (typeof window.minecraftInfo === 'undefined') {
            window.minecraftInfo = {clientTime: 0};
        }
        var timeData = window.minecraftInfo.clientTime,
            timeNow = Math.round(Date.now() / 1000);
        if (timeData + 15 <= timeNow) {
            // Send the cached data
            chrome.runtime.sendMessage({sendUpdate: true, data: window.minecraftInfo});
            // The data is older than 15 second, force a re-check irrelevant of the frequency set in options
            console.debug('requestUpdate for new data. Time Data: ' + timeData + ', Time Now: ' + timeNow + ', Difference: ' + (timeNow - timeData));
            console.debug('listener checkTimer: ' + checkTimer);
            clearTimeout(checkTimer);
            checkTimer = null;
            getMinecraftInfo(1);
        } else {
            // We can show them cached data
            console.debug('requestUpdate old data. Time Data: ' + timeData + ', Time Now: ' + timeNow + ', Difference: ' + (timeNow - timeData));
            chrome.runtime.sendMessage({sendUpdate: true, data: window.minecraftInfo});
        }
    }
});

$(window).on('online offline', function () {
    getMinecraftInfo(1);
});

chrome.storage.onChanged.addListener(function () {
    loadOptions();
});

loadOptions();