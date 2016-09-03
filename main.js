/**
 * Emergency video chat support
 * A Hackathon project - needs to be refactored
 *
 * @author: Sebastian Kim
 */

var PUBNUB_SUBSCRIBE_KEY = 'sub-c-37e5c210-7107-11e6-91d9-02ee2ddab7fe';
var PUBNUB_PUBLISH_KEY = 'pub-c-99bfe32b-04e0-4067-961a-f28410406a6e';

// MARK: - WebRTC

var $videoOut = $('#vid-chatOut');
var $statusDot = $('#status');
var isHost = !!getURLParam('host');

function login() {
  window.phone = PHONE({
      number: isHost ? 'host' : 'guest',
      publish_key: PUBNUB_PUBLISH_KEY,
      subscribe_key: PUBNUB_SUBSCRIBE_KEY,
      ssl: (('https:' == document.location.protocol) ? true : false)
  });
  phone.ready(function() {
    $statusDot.css('background-color', 'green');

    // Make a call automatically if guest login
    makeCall();
  });
  phone.receive(function(session){
      session.connected(function(session) { $videoOut.append(session.video); });
      session.ended(function(session) { $videoOut.innerHTML=''; });
  });

  return false;
}

function makeCall() {
  if (!window.phone) alert("Login First!");
  else phone.dial(isHost ? 'guest' : 'host');

  return false;
}

$(function() {
  login();
});


// MARK: - Chatting

var chatOut = PUBNUB.$('chat-out')
  , chatIn = PUBNUB.$('chat-in')
  , channel = 'chat';

var pubnub = PUBNUB.init({
  publish_key: PUBNUB_PUBLISH_KEY,
  subscribe_key: PUBNUB_SUBSCRIBE_KEY,
  ssl: (('https:' == document.location.protocol) ? true : false)
});

pubnub.subscribe({
    channel: channel,
    callback: function(message) {
      chatOut.innerHTML = chatOut.innerHTML +
        '<p class="' + (message.isHost == isHost ? 'me' : 'them') + '">' + message.text + '</p>';
      chatOut.scrollTop = chatOut.scrollHeight;
    }
});
pubnub.bind('keyup', chatIn, function(e) {
    if ((e.keyCode || e.charCode) === 13) {
      pubnub.publish({
        channel: channel,
        message: {
          isHost: isHost,
          text: chatIn.value,
        }
      });
      chatIn.value = '';
    }
});
