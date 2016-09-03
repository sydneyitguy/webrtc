var $videoOut = $('#vid-box');
var $statusDot = $('#status');
var isHost = !!getURLParam('host');

function login() {
  window.phone = PHONE({
      number        : isHost ? 'host' : 'guest',
      publish_key   : 'pub-c-99bfe32b-04e0-4067-961a-f28410406a6e',
      subscribe_key : 'sub-c-37e5c210-7107-11e6-91d9-02ee2ddab7fe',
      ssl : (('https:' == document.location.protocol) ? true : false)
  });
  phone.ready(function() {
    $statusDot.css('background-color', 'green');

    // Make a call automatically if guest login
    if (!isHost) {
      makeCall();
    }
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
  // login();
});
