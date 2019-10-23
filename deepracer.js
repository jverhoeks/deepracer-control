// Libs
var joystick = require('joystick');
const request = require('request')
const cheerio = require("cheerio");

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}
// because cert isn't signed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

var url = 'https://192.168.xxx.xxx'
var password = 'xxxxx'
var speed = 40




const j = request.jar()
const request_call = request.defaults({
  jar: j
})


var headers = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'x-csrftoken': crfs,
};
var headers_json = {
  'Content-Type': 'application/json',
  'x-csrftoken': crfs,
};

var form = {
  password: password
};
var drive_form = {
  drive_mode: 'manual'
}
var start_form = {
  start_stop: 'start'
}
var stop_form = {
  start_stop: 'stop'
}
var crfs

var x = 0.5
var y = 0.5
var ready = 0

try {
  request_call(url, function(error, response, body) {
    if (error) {
      //return reject(error)
      console.log(error)
    } else {
      var $ = cheerio.load(body)
      crfs = $('meta[name="csrf-token"]').attr('content')
      console.log(crfs)
      headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-csrftoken': crfs,
      };
      headers_json = {
        'Content-Type': 'application/json',
        'x-csrftoken': crfs,
      };

      request_call.post({
        url: url + '/login',
        form: form,
        headers: headers
      }, function(e, r, body) {
        if (e) {
          console.log(e)
        } else console.log(body)
        request_call({
          method: 'PUT',
          uri: url + '/api/drive_mode',
          json: true,
          body: drive_form,
          headers: headers_json
        }, function(e, r, body) {
          if (e) {
            console.log(e)
          } else console.log(body)
          request_call({
            method: 'PUT',
            uri: url + '/api/start_stop',
            json: true,
            body: start_form,
            headers: headers_json
          }, function(e, r, body) {
            if (e) {
              console.log(e)
            } else console.log(body)
            console.log("driving")
            ready = 1;
          });
        });
      });
    }
  });
} catch (err) {
  console.log("no connection")
}

// Init PS3 controller, 0 = /dev/input/js0
const ps3Controller = new joystick(0, 3500);

// On button press (triggers when pressed and when released)
ps3Controller.on('button', button => {
  switch (button.number) {
    case 0: // cross\
      try {
        request_call({
          method: 'GET',
          uri: url + '/api/get_network_details',
          json: true,
          body: start_form,
          headers: headers_json
        }, function(e, r, body) {
          if (e) {
            console.log(e)
          } else console.log(body)
        });
      } catch (err) {
        console.log("no connection")
      }
      break;
    case 1: // circle
      try {
        request_call({
          method: 'GET',
          uri: url + '/api/get_battery_level',
          json: true,
          body: start_form,
          headers: headers_json
        }, function(e, r, body) {
          if (e) {
            console.log(e)
          } else console.log(body)
        });
      } catch (err) {
        console.log("no connection")
      }
      // try {
      //   request_call({
      //     method: 'PUT',
      //     uri: url + '/api/start_stop',
      //     json: true,
      //     body: stop_form,
      //     headers: headers_json
      //   }, function(e, r, body) {
      //     // your callback body'
      //     if (e) {
      //       console.log(e)
      //     }
      //     console.log("stop")
      //   });
      // } catch (err) {
      //   console.log("no connection")
      // }
      break;
    case 2: // triangle
      break;
    case 3: // square
      break;
    case 6: // left flap
      speed = speed - 1
      break;
    case 7: // right flap
      speed = speed + 1
      break;

  }
});


// On axis movement
ps3Controller.on('axis', axis => {
  // Max value in both directions
  const max = 32767;


  // Value between 0 and 1, default: 0.5
  //    const value = (axis.value * 1) / max / 2 + 0.5;
  const value = (axis.value * 1) / max;

  switch (axis.number) {
    case 3: // right x-axis
      x = value
      if (value > 0.1 && value <= 0.5)
        x = 0.5
      if (value > 0.5)
        x = 1
      if (value < -0.1 && value >= -0.5)
        x = -0.5
      if (value < -0.5)
        x = -1

      break;
    case 4: // right y-axis
      if (value < 0) { // reduce speed forwards
        y = value * (speed / 100)
      } else { // backwards = fullspeed
        y = value
      }
      break;
  }
  console.log("X: " + x + " Y:" + y + " ready: " + ready + " speed: " + speed)

  drive = {
    angle: x,
    throttle: y
  }
  if (ready == 1) { // send drive request
    try {
      request_call({
        method: 'PUT',
        uri: url + '/api/manual_drive',
        json: true,
        body: drive,
        headers: headers_json
      }, function(e, r, body) {
        // your callback body'
        if (e) {
          console.log(e)
        }
      });
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    } catch (err) {
      console.log("no connection")
    }
  }
});
