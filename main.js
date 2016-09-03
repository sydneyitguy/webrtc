/**
 * Emergency video chat support
 * A Hackathon project - needs to be refactored
 *
 * @author: Sebastian Kim
 */

var PUBNUB_SUBSCRIBE_KEY = 'sub-c-37e5c210-7107-11e6-91d9-02ee2ddab7fe';
var PUBNUB_PUBLISH_KEY = 'pub-c-99bfe32b-04e0-4067-961a-f28410406a6e';

// MARK: - WebRTC

var $videoBox = $('#vid-box');
var isHost = !!getURLParam('host');

function login() {
  window.phone = PHONE({
      number: isHost ? 'host' : 'guest',
      publish_key: PUBNUB_PUBLISH_KEY,
      subscribe_key: PUBNUB_SUBSCRIBE_KEY,
      ssl: (('https:' == document.location.protocol) ? true : false),
      media: { audio : false, video : true } // for demo
  });
  phone.ready(function() {
    console.log('Logged in');
    setVideoStatus('#FFCF15');

    // Make a call automatically if guest login
    if (!window.phone) {
      alert('Login First!');
    } else {
      console.log('Calling to: ' + (isHost ? 'guest' : 'host'));
      phone.dial(isHost ? 'guest' : 'host');
    }
  });
  phone.receive(function(session){
      session.connected(function(session) {
        console.log('<-- Call received');
        $videoBox.append(session.video);
        setVideoStatus('#0F9D58');
        addMapMarkersForDemo();
      });
      session.ended(function(session) {
        console.log('--> Call ended');
        $videoBox.find('video').remove();
        setVideoStatus('#FFCF15');
      });
  });

  return false;
}

function addMapMarkersForDemo() {
  if (isHost) {
    addInfoWindow({ lat: 37.374804, lng: 126.667955 }, "신고자 위치");
  } else {
    addInfoWindow({ lat: 37.390786, lng: 126.651902 }, "송도 119 안전센터");
  }
}

function setVideoStatus(color) {
  $('#status').css('background-color', color);
}

$videoBox.on('click', function() {
  phone.hangup();
  setVideoStatus('#FFCF15');
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
      console.log('<-- Message received', message);

      if (!message.text) {
        return;
      }

      chatOut.innerHTML = chatOut.innerHTML +
        '<p class="' + (message.isHost == isHost ? 'me' : 'them') + '">' + message.text + '</p>';
      chatOut.scrollTop = chatOut.scrollHeight;
    }
});
pubnub.bind('keyup', chatIn, function(e) {
    if ((e.keyCode || e.charCode) === 13) {
      if (!chatIn.value) {
        return;
      }

      console.log('--> Message send', chatIn.value);
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


// MARK: - Maps

var map;
function initMap() {
  console.log('Initialize maps');
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 37.4492881, lng: 126.5940125 },
    zoom: 10
  });

  // Try HTML5 geolocation.
  // if (navigator.geolocation) {
  //   navigator.geolocation.getCurrentPosition(function(position) {
      // var pos = {
      //   lat: position.coords.latitude,
      //   lng: position.coords.longitude
      // };

      // addInfoWindow(pos, "I'm here");
  //   }, function() {
  //     addInfoWindow(map.getCenter(), 'Error: The Geolocation service failed');
  //   });
  // } else {
  //   // Browser doesn't support Geolocation
  //   addInfoWindow(map.getCenter(), 'Error: Your browser doesn\'t support geolocation.');
  // }
}


function addInfoWindow(pos, content) {
  var infoWindow = new google.maps.InfoWindow({map: map});
  infoWindow.setPosition(pos);
  infoWindow.setContent(content);
  map.setCenter(pos);
  smoothZoom(15, map.getZoom());
}

// the smooth zoom function
function smoothZoom (max, cnt) {
    if (cnt >= max) {
        return;
    }
    else {
        z = google.maps.event.addListener(map, 'zoom_changed', function(event){
            google.maps.event.removeListener(z);
            smoothZoom(max, cnt + 1);
        });
        setTimeout(function(){map.setZoom(cnt)}, 400); // 80ms is what I found to work well on my system -- it might not work well on all systems
    }
}

$(function() {
  login();
});

