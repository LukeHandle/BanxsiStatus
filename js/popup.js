function updateMinecraftInfoPanel(data) {
    if (data.status === 'online') {
        $('#mc-info').addClass('panel-success').removeClass('panel-info panel-danger');
        $('#sStatus').text('Online');
        $('#sPlayersOnline').text(data.playeronline);
        if (data.playerlist) {
            var playerlist_html = '';
            playerlist_html += '<div id="dPlayerlist" class="list-group">';
            for (var i = 0; i < data.playerlist.length; i++) {
                var player = data.playerlist[i];
                if (player[1]) {
                    playerlist_html += '<a href="http://forum.banxsi.com/members/' + player[1] + '/" target="_blank" class="list-group-item"><span class="badge">Forum</span>' + player[0] + '</a>';
                } else {
                    playerlist_html += '<a class="list-group-item">' + player[0] + '</a>';
                }
            }
            playerlist_html += '</div>';
            $('#dPlayerlist').remove();
            $('#mc-info_body').append(playerlist_html).removeClass('hidden');
        } else {
            $('#mc-info_body').addClass('hidden');
        }
    } else {
        $('#mc-info').addClass('panel-danger').removeClass('panel-info panel-success');
        if (data.status === 'offline') {
            $('#sStatus').text('Offline');
        } else if (data.status === 'unavailable') {
            $('#sStatus').text('Unavail');
        } else if (data.status === 'noconnection') {
            $('#sStatus').text('Internet!?');
        }
        $('#mc-info_body').addClass('hidden');
        $('#sPlayersOnline').text('');
    }
    if (data.msg) {
        $('#pMessage').text(data.msg);
    } else {
        $('#pMessage').text('');
    }
    var unix = new Date(data.time * 1000),
        time = ("0" + unix.getHours()).slice(-2) + ':' + ("0" + unix.getMinutes()).slice(-2) + ':' + ("0" + unix.getSeconds()).slice(-2);
    $('#pUpdated').remove();
    $('#mc-info_footer').append('<p id="pUpdated" class="h4">Last Updated: <span id="sUpdated">' + time + '</span></p>');
}

chrome.runtime.sendMessage({requestUpdate: true});

chrome.runtime.onMessage.addListener(function (request) {
    if (request.sendUpdate === true) {
        updateMinecraftInfoPanel(request.data);
    }
});
