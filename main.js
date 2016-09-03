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

        addChatBubble('them', '화상 전화 연결 완료.');
        addMapMarkersForDemo();
        addLocationDefinedMessageForDemo();
      });
      session.ended(function(session) {
        console.log('--> Call ended');
        $videoBox.find('video').remove();
        setVideoStatus('#FFCF15');
      });
  });

  return false;
}

function setVideoStatus(color) {
  $('#status').css('background-color', color);
}


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

      addChatBubble((message.isHost == isHost ? 'me' : 'them'), message.text);
    }
});
pubnub.bind('keyup', chatIn, function(e) {
    if ((e.keyCode || e.charCode) === 13) {
      if (!chatIn.value) {
        return;
      }

      console.log('--> Message send', chatIn.value);
      sendChat(chatIn.value);
      chatIn.value = '';
    }
});

function addChatBubble(className, text) {
  chatOut.innerHTML = chatOut.innerHTML + '<p class="' +  className + '">' + text + '</p>';
  chatOut.scrollTop = chatOut.scrollHeight;
}

function sendChat(text) {
  pubnub.publish({
    channel: channel,
    message: {
      isHost: isHost,
      text: text,
    }
  });
}


// MARK: - Maps

var map;
function initMap() {
  console.log('Initialize maps');
  var isDraggable = $(document).width() > 480 ? true : false;

  map = new google.maps.Map(document.getElementById('map'), {
    draggable: isDraggable,
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


// MARK: - For demo

function addMapMarkersForDemo() {
  if (isHost) {
    addInfoWindow({ lat: 37.374804, lng: 126.667955 }, "신고자 위치");
  } else {
    addInfoWindow({ lat: 37.390786, lng: 126.651902 }, "송도 119 안전센터");
  }
}

function addConnectedMessageForDemo() {
  if (isHost) {
    addChatBubble('them', '신고자 010-0601-0811 연결되었습니다.<br><b>화상전화 연결중..</b>');
  } else {
    addChatBubble('them', '송도 119 안전센터에 연결되었습니다.<br><b>화상전화 연결중..</b>');
  }
}

function addLocationDefinedMessageForDemo() {
  setTimeout(function() {
    addChatBubble('them', '<b>신고자 위치 파악 완료</b><br>인천광역시 송도문화로 119, 인천글로벌캠퍼스체육관');
  }, 1000);
}

function addGoingMessageForDemo() {
  var now = new Date();
  sendChat('<b>송도 119 안전센터 구조대 출발</b><br>' +
    '현재시각: ' + now.getHours() + '시 ' + now.getMinutes() + '분 / 도착 예상시간: 5분');
}

function videoTemplate(fileName) {
  return '<video class="video-js" controls preload="auto" width="200" height="130" ' +
    'poster="./img/' + fileName + '.jpg" data-setup="{}">' +
    '<source src="./img/' + fileName + '.mp4" type="video/mp4">' +
  '</video>'
}


// MARK: - Events

$videoBox.on('click', '#status', function() {
  phone.hangup();
  setVideoStatus('#FFCF15');
});

$('#chat-buttons button').click(function() {
  var name = $(this).attr('id');

  if (name == 'chat-going') {
    return addGoingMessageForDemo();
  }

  // Otherwise, Videos
  sendChat('구조대가 도착하기 전 응급처치가 필요합니다.<br>아래 비디오를 참고하시어 응급처치를 해주세요.');
  sendChat(videoTemplate(name));
});


// MARK: - Run!

if (!isHost) { // Admin only interface
  $('.chat-buttons').hide();
}

login();
addConnectedMessageForDemo();

