// Frequency of check
// Notifications:
//  Timeout
//  Certain Players, Offline Status, Timeout of it

// Saves options to chrome.storage
function save_options() {
    var checkFrequency = document.getElementById('checkFrequency').value,
        notificationEnable = document.getElementById('notificationEnable').checked,
        notificationTimeout = document.getElementById('notificationTimeout').value,
        notificationEnableStatus = document.getElementById('notificationEnableStatus').checked,
        notificationEnablePlayers = document.getElementById('notificationEnablePlayers').checked,
        notificationPlayerList = document.getElementById('notificationPlayerList').value;
    chrome.storage.local.set({
        'checkFrequency': checkFrequency,
        'notificationEnable': notificationEnable,
        'notificationTimeout': notificationTimeout,
        'notificationEnableStatus': notificationEnableStatus,
        'notificationEnablePlayers': notificationEnablePlayers,
        'notificationPlayerList': notificationPlayerList
    }, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 1000);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.local.get({
        'checkFrequency': 15000,
        'notificationEnable': false,
        'notificationTimeout': 30000,
        'notificationEnableStatus': false,
        'notificationEnablePlayers': false,
        'notificationPlayerList': 'Banxsi, externo6, LukeHandle'
    }, function(items) {
        document.getElementById('checkFrequency').value = items.checkFrequency;
        document.getElementById('notificationEnable').checked = items.notificationEnable;
        document.getElementById('notificationTimeout').value = items.notificationTimeout;
        document.getElementById('notificationEnableStatus').checked = items.notificationEnableStatus;
        document.getElementById('notificationEnablePlayers').checked = items.notificationEnablePlayers;
        document.getElementById('notificationPlayerList').value = items.notificationPlayerList;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);


sels = $('.form-control');
for(i=0; i<sels.length; i++) {
    sels[i].addEventListener('change', save_options);
}