
function sec2str(sec) {
    var str_min = Math.floor(sec / 60);
    var str_sec = sec - str_min * 60;
    var string = (str_min > 9 ? "" : "0") +
	str_min + ":" +
	(str_sec > 9 ? "" : "0") + str_sec;
    return string;
}

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
    config: {
	"volume": 10
    },
    sounds: {
	"end": new Audio("alarm.mp3"),
	"windup": new Audio("winding.mp3")
    },

    play: function(snd) {
	player.sounds[snd].volume = player.config["volume"] / 10;
	player.sounds[snd].currentTime = 0;
	player.sounds[snd].loop = false;
	player.sounds[snd].play(); 
    },

    turn_off: function() {
	Object.entries(player.sounds).forEach(function([k, v]) { v.pause(); })
    },
    volume_inc: function() {
	player.config["volume"] += 1;
	if(player.config["volume"] > 10) player.config["volume"] = 10;
	player.save();
	update_parameters();
    },
    volume_dec: function() {
	player.config["volume"] -= 1;
	if(player.config["volume"] < 1) player.config["volume"] = 1;
	player.save();
	update_parameters();
    },
    load: function() {
	if(localStorage.getItem("_player")) {
	    player.config = JSON.parse(localStorage.getItem("_player"));
	}
	else {
	    player.config = {
		"volume": 10
	    };
	    player.save();
	}
    },
    save: function() {
	localStorage.setItem("_player", JSON.stringify(player.config));
    },
    init: function() {
	player.load();
	update_parameters();
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

var l10n = {
    "intervals/work": "Работа",
    "intervals/short": "Перерыв",
    "intervals/long": "Отдых",
    "notify/pre/title": "Скоро окончание интервала",
    "notify/pre/body": "Осталось %l",
    "notify/work-short/title": "Время сделать короткий перерыв!",
    "notify/work-short/body": "Отличная работа!",
    "notify/short-work/title": "Назад к работе!",
    "notify/short-work/body": "Осталось немного!",
    "notify/work-long/title": "Время отдохнуть!",
    "notify/work-long/body": "Отличный страйк!",
    "notify/long-work/title": "Начинаем новый страйк!",
    "notify/long-work/body": "Еще один прорыв на сегодня!",
    "notify/strikes": "Страйки",
    "notify/test/title": "Тестовое уведомление",
    "notify/test/body": "Так будут выглядеть уведомления",
    sub: function(string) {
	ret = l10n[string];
	ret = ret.replace(/%l/, sec2str(countdown._left()));
	return ret;
    }
}

var timer = {
    _current: "",
    _timers: {},
    _prenotify: 0,
    init: function() {
	timer.load();
	timer.windup("work");
    },
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
	if(localStorage.getItem("_prenotify")) {
	    timer._prenotify = JSON.parse(localStorage.getItem("_prenotify"));
	}
	else {
	    timer._prenotify = 180;
	    timer.save();
	}
    },
    save: function() {
	localStorage.setItem("_timers", JSON.stringify(timer._timers));
	localStorage.setItem("_prenotify", JSON.stringify(timer._prenotify));
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
	if(countdown.status() == "reset") {
	    player.play("windup");
	}
	countdown.start();
    },
    pause: function() {
	countdown.pause();
    },
    end: function() {
	player.play("end");
	if(timer._current == "work") {
	    notify.work_short();
	    timer.windup("short");
	}
	else {
	    notify.short_work();
	    timer.windup("work");
	}
    },
    status: function() {
	return countdown.status();
    },
    adj_prenotify: function(dir) {
	if(dir == "+") {
	    timer._prenotify += 30;
	    if(timer._prenotify > 300) timer._prenotify = 300;
	}
	else {
	    timer._prenotify -= 30;
	    if(timer._prenotify < 30) timer._prenotify = 30;
	}
	timer.save();
	update_parameters();
    },
    tick: function() {
	countdown.tick();
	if(countdown.status() == "finished") {
	    timer.end();
	}
	else if(timer._current == "work") {
	    if(countdown._left() == timer._prenotify) {
		notify.pre();
	    }
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

var notify = {
    allowed: false,
    notification: false,
    notify: function(title, body) {
	notify.notification = new Notification(title, {body: body});
	setTimeout(notify.close, 10*1000);
    },
    work_short: function() {
	notify.notify(l10n["notify/work-short/title"], l10n["notify/work-short/body"]);
    },
    short_work: function() {
	notify.notify(l10n["notify/short-work/title"], l10n["notify/short-work/body"]);
    },
    close: function() {
	notify.notification.close();
    },
    pre: function() {
	notify.notify(l10n["notify/pre/title"], l10n.sub("notify/pre/body"));
    },
    test: function() {
	notify.notify(l10n["notify/test/title"], l10n["notify/test/body"]);
    }
}

if(Notification.permmission !== "granted") {
    Notification.requestPermission();
}

function update_parameters() {
    document.getElementById("volume_value").innerHTML = player.config["volume"] + "&nbsp;/&nbsp;10";
    var mins = Math.floor(timer._prenotify / 60);
    var secs = timer._prenotify - mins * 60;
    document.getElementById("pre_notification").innerHTML = mins + ":" + (secs < 10 ? "0" : "") + secs;
}

function show_parameters() {
    document.getElementById("preferences-panel").classList.remove("hidden");
    document.getElementById("preferences-message").classList.add("hidden");
}

function hide_parameters() {
    document.getElementById("preferences-panel").classList.add("hidden");
    document.getElementById("preferences-message").classList.remove("hidden");
}

function update() {
    // update countdown
    document.getElementById("timer-counter-digital").innerHTML = countdown.digital();
    document.getElementById("timer-counter-progress").style = "width: " + countdown.perc() + "%";

    // update timer control panel
    var status = countdown.status();
    if(status == "reset") { hl_buttons("timer-control", "button-reset"); }
    else if(status == "active") { hl_buttons("timer-control", "button-start"); }
    else if(status == "paused") { hl_buttons("timer-control", "button-pause"); }

    // update title
    var tm = countdown.digital();
    var symbol = "";
    switch(countdown.status()) {
    case "reset":
	symbol = "⏹";
	break;
    case "active":
	symbol = "⏩";
	break;
    case "paused":
	symbol = "⏸";
	break;
    }
    document.title = symbol + " " + tm + " | " + l10n["intervals/" + timer._current] + " | Pomodoro Timer by Konstantin Morenko";

    if(timer.status() != "reset") hide_parameters();
    else show_parameters();
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
	if(timer.status() == "reset") { return; }
	timer.end();
	update();
    },
    start_pause: function() {
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
    },
    wipe_all: function() {
	if(!confirm("Сбросить все настройки?")) return;
	localStorage.clear();
	init();
    },
    check_alarm: function() {
	player.play("end");
    },
    check_notification: function() {
	notify.test();
    },
    volume_inc: function() {
	player.volume_inc();
    },
    volume_dec: function() {
	player.volume_dec();
    },
    prenotify_inc: function() {
	timer.adj_prenotify("+");
    },
    prenotify_dec: function() {
	timer.adj_prenotify("-");
    }
}

function init() {
    timer.init();
    player.init();
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
    document.activeElement.blur();
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
