
function hl_buttons(block, active = false, cls = "active") {
    // turn off all buttons in block except active
    btns = document.getElementById(block).children;
    for(var i = 0; i < btns.length; i++) {
	if(active) {
	    if(btns[i].id == active) {
		btns[i].classList.add(cls);
	    }
	    else {
		btns[i].classList.remove(cls);
	    }
	}
    }
}

var player = {
    sounds: {
	"end": new Audio("alarm.mp3")
    },

    play: function(snd) {
	player.sounds[snd].currentTime = 0;
	player.sounds[snd].loop = false;
	player.sounds[snd].play(); 
    },

    turn_off: function() {
	var paused = false;
	Object.entries(player.sounds).forEach(function([k, v]) { if(!v.paused) { paused = true; v.pause(); } })
	return paused;
    }
}

var timing = {
    // wrapper for timing object in JS
    _jstimer: false,
    start: function() {
	timing._jstimer = window.setInterval(timing._tick, 1000);
    },
    stop: function() {
	window.clearInterval(timing._jstimer);
	timing._jstimer = false;
    },
    counting: function() {
	return timing._jstimer;
    },
    _tick: function() {
	timer.tick();
    }
}

var countdown = {
    // separate countdown structure
    _total: 0,
    _current: 0,
    pause: function() {
	timing.stop();
    },
    reset: function() {
	countdown.pause();
	countdown._current = 0;
    },
    set: function(time) {
	countdown._total = time;
	countdown.reset();
    },
    _left: function() {
	return countdown._total - countdown._current;
    },
    start: function() {
	if(countdown._left() > 0) {
	    timing.start();
	}
    },
    status: function() {
	if(timing.counting()) {
	    return 'active';
	}
	else if(countdown._current == 0) {
	    return 'reset';
	}
	else if(countdown._left() == 0){
	    return 'finished';
	}
	else {
	    return 'paused';
	}
    },
    tick: function() {
	if(countdown._left() == 0) {
	    countdown.pause();
	}
	else {
	    countdown._current += 1;
	}
    },
    digital: function() {
	var left = countdown._left();
	var minutes = Math.floor(left / 60);
	var seconds = left - minutes * 60;

	var string = (minutes > 9 ? "" : "0") +
	    minutes + ":" +
	    (seconds > 9 ? "" : "0") + seconds;
	return string;
    },
    perc: function() {
	return (countdown._current / countdown._total) * 100;
    }
}

var strike = {}

var timer = {
    _current: "",
    _timers: {},
    load: function() {
	if(localStorage.getItem("_timers")) {
	    timer._timers = JSON.parse(localStorage.getItem("_timers"));
	}
	else {
	    timer._timers = {"work": {"min": 10*60, "cur": 25*60, "max": 30*60, "step": 60},
			     "short": {"min": 3*60, "cur": 5*60, "max": 6*60, "step": 30},
			     "long": {"min": 15*60, "cur": 20*60, "max": 30*60, "step": 60}};
	    timer.save();
	}
    },
    save: function() {
	localStorage.setItem("_timers", JSON.stringify(timer._timers));
    },
    windup: function(name) {
	timer._current = name;
	countdown.set(timer._timers[name].cur);
	if(name == "work") { hl_buttons("timer-intervals", "button-work"); }
	else if(name == "short") { hl_buttons("timer-intervals", "button-short"); }
	else if(name == "long") { hl_buttons("timer-intervals", "button-long"); }
	update();
    },
    reset: function() {
	countdown.reset();
	update();
    },
    start: function() {
	countdown.start();
    },
    pause: function() {
	countdown.pause();
    },
    end: function() {
	player.play("end");
	if(timer._current == "work") { timer.windup("short"); }
	else { timer.windup("work"); }
    },
    status: function() {
	return countdown.status();
    },
    tick: function() {
	countdown.tick();
	if(countdown.status() == "finished") {
	    timer.end();
	}
	update();
    },
    adj_timer: function(dir, name = false) {
	if(timer.status() != "reset") { return; }
	if(!name) { name = timer._current; }
	var adj = timer._timers[name].step;
	if(dir == "-") { adj *= -1; }
	timer._timers[name].cur += adj;
	if(timer._timers[name].cur > timer._timers[name].max) {
	    timer._timers[name].cur = timer._timers[name].max;
	}
	if(timer._timers[name].cur < timer._timers[name].min) {
	    timer._timers[name].cur = timer._timers[name].min;
	}
	timer.windup(timer._current);
	timer.save();
    }
}

function update() {
    // update screen
    document.getElementById("timer-counter-digital").innerHTML = countdown.digital();
    // update timer control panel
    var status = countdown.status();
    if(status == "reset") { hl_buttons("timer-control", "button-reset"); }
    else if(status == "active") { hl_buttons("timer-control", "button-start"); }
    else if(status == "paused") { hl_buttons("timer-control", "button-pause"); }
}

var user = {
    // buttons functions
    work: function() {
	if(!confirm_reset()) { return; }
	timer.windup('work')
    },
    "short": function() {
	if(!confirm_reset()) { return; }
	timer.windup('short');
    },
    "long": function() {
	if(!confirm_reset()) { return; }
	timer.windup('long');
    },
    start: function() {
	timer.start();
	update();
    },
    pause: function() {
	timer.pause();
	update();
    },
    reset: function() {
	if(!confirm_reset()) { return; }
	timer.reset();
	update();
    },
    end: function() {
	if(!confirm_reset()) { return; }
	timer.end();
	update();
    },
    start_pause: function() {
	if(player.turn_off()) return;
	switch(timer.status()) {
	case "reset":
	case "paused":
	    timer.start();
	    break;
	case "active":
	    timer.pause();
	    break;
	}
	update();
    },
    turn_off_signal: function() {
	player.turn_off();
    },
    cur_inc: function() {
	timer.adj_timer("+");
    },
    cur_dec: function() {
	timer.adj_timer("-");
    }
}

function confirm_reset() {
    if(timer.status() != "reset") {
	return confirm("Сбросить таймер?");
    }
    else {
	return true;
    }
}

function keypress(e) {
    e.preventDefault();
    switch(e.code) {
    case "Digit1":
	user.work();
	break;
    case "Digit2":
	user["short"]();
	break;
    case "Digit3":
	user["long"]();
	break;
    case "KeyQ":
	user.turn_off_signal();
	break;
    case "KeyA":
	user.start();
	break;
    case "KeyS":
	user.pause();
	break;
    case "KeyD":
	user.reset();
	break;
    case "KeyF":
	user.end();
	break;
    case "Space":
	user.start_pause();
	break;
    case "Equal":
	user.cur_inc();
	break;
    case "Minus":
	user.cur_dec();
	break;
    }
}
