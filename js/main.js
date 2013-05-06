$(document).ready(function () {
	$(".live-tile").not(".exclude").liveTile();	
	$('a[rel*=leanModal]').leanModal({overlay: 0.5, closeButton: '.dialog-close'});

	var conf = loadConfiguration();
	if (conf === null) {
		conf = {
			tempo: 100,
			volume: 100,
			beat: 4,
			rhythm: "quarter",
			mute: false,
			type: 0
		};
	}

	var tempo = new Tempo({
		max: 250,
		min: 40,
		tempo: Number(conf.tempo)
	});

	var beat = new Beat({
		max: 16,
		min: 1,
		beat: Number(conf.beat)
	});

	var rhythm = new Rhythm(conf.rhythm);	
	var type = new Type(Number(conf.type));

	var dashboard = new Dashboard();
	dashboard.update(conf);

	Metronome.init(Number(conf.volume));
	Metronome.mute(conf.mute);	

	var buffers = null;
	var sounds = ['resources/classic1.ogg', 'resources/classic2.ogg', 
								'resources/wooden1.ogg', 'resources/wooden2.ogg',
								'resources/electronic1.ogg', 'resources/electronic2.ogg',
								'resources/drum1.ogg', 'resources/drum2.ogg']
	var bufferLoader = new BufferLoader(Metronome.context, sounds, function(bufferList) {
		buffers = bufferList;
	});
	bufferLoader.load();

	$("#tempo-up").click(function() {
		tempo.up();
		dashboard.update({
			tempo: tempo.getValue()
		});

		Metronome.setTempo(rhythm.toTempo(tempo.getValue()));
	});

	$("#tempo-down").click(function() {
		tempo.down();
		dashboard.update({
			tempo: tempo.getValue()
		});

		Metronome.setTempo(rhythm.toTempo(tempo.getValue()));		
	});

	$("#volume-up").click(function() {
		dashboard.update({
			volume: Metronome.volumeUp()
		});
	});

	$("#volume-down").click(function() {
		dashboard.update({
			volume: Metronome.volumeDown()
		});
	});

	$("#mute").click(function() {		
		var volume = Metronome.getVolume();
		if (volume <= 0) {
			Metronome.mute(false);
			dashboard.update({mute: false});
		} else {
			Metronome.mute(true);
			dashboard.update({mute: true});
		}
	});

	$("#type").click(function() {		
		dashboard.update({
			type: type.getNext()
		});
	});

	$("#beat-up").click(function() {
		beat.up();
		dashboard.update({
			beat: beat.getValue()
		});
	});

	$("#beat-down").click(function() {
		beat.down();
		dashboard.update({
			beat: beat.getValue()
		});
	});

	$("#start-stop").click(function() {
		if (Metronome.isPlaying) {
			Metronome.stop();
			beat.initCount();

		} else {
			if (buffers !== null) {
				Metronome.setTempo(rhythm.toTempo(tempo.getValue()));
				Metronome.setBuffer(buffers[type.get() * 2]);

				Metronome.play(function() {					
					if (rhythm.getValue() == "quarter") {
						var count = beat.addCount();	
						if (count == 1) {
							Metronome.setBuffer(buffers[type.get() * 2]);
						} else {
							Metronome.setBuffer(buffers[type.get() * 2 + 1]);
						}

						dashboard.update({
							count: count
						});

					} else {
						var rhythmToCount = beat.addCountWithRhythm(rhythm.getValue());
						if (rhythmToCount == 1) {
							Metronome.setBuffer(buffers[type.get() * 2]);
						} else {
							Metronome.setBuffer(buffers[type.get() * 2 + 1]);						
						}

						if (rhythm.getValue() == "eighth") {
							if (rhythmToCount % 2) {
								dashboard.update({
									count: rhythmToCount / 2 + 0.5
								});
							}
						} else if (rhythm.getValue() == "triplet") {
							if (rhythmToCount % 3 == 1) {
								dashboard.update({
									count: parseInt(rhythmToCount / 3) + 1
								});
							}
						}
					}
				});	
			}
		}
	});

	$("#rhythm").click(function() {
		dashboard.update({ 
			rhythm: rhythm.getNextRhythm()
		});

		beat.initCount();
		Metronome.setTempo(rhythm.toTempo(tempo.getValue()));
	});

	/**
	 * Bind an event to mouse held down event.
	 */
	(function() {
		var timerId = 0;
		var tick = 80;

		var $tempUp = $("#tempo-up");
		var $tempDown = $("#tempo-down");
		var $beatUp = $("#beat-up");
		var $beatDown = $("#beat-down");
		var $volumeUp = $("#volume-up");
		var $volumeDown = $("#volume-down");

		bindMouseHeldDown($tempUp);
		bindMouseHeldDown($tempDown);
		bindMouseHeldDown($beatUp);
		bindMouseHeldDown($beatDown);
		bindMouseHeldDown($volumeUp);
		bindMouseHeldDown($volumeDown);

		function bindMouseHeldDown($target) {
			$target.longclick(function(event) {
				if (event.which == 1) {
					timerId = setInterval(function() {
						$target.click();
					}, tick);
				}
			}).bind("mouseup mouseleave", function() {
					clearInterval(timerId);
			});
		}	
	}());

	/**
	 * Bind an event handler to the "keypress/keydown" JavaScript event
	 */
	 $(document).keypress(function(event) {	 	
	 	var shortcuts = {enter: 13, space: 32, help: 63, sound: 115};
	 	var keyCode = (event.keyCode ? event.keyCode : event.which);	 	

		switch (keyCode) {
		case shortcuts.enter:
			$("#rhythm").click();
			break;
		case shortcuts.space:
			$("#start-stop").click();
			break;
		case shortcuts.help:
			$("#shortcuts-trigger").click();
			break;
		case shortcuts.sound:
			$("#type").click();
			break;
		}
	 });

	 $(document).keydown(function(event) {
		var arrow = {left: 37, up: 38, right: 39, down: 40};
		var esc = 27;
		var keyCode = (event.keyCode ? event.keyCode : event.which);

		switch (keyCode) {
		case arrow.left:			
			$("#beat-down").click();
			break;
		case arrow.right:	
			$("#beat-up").click();
			break;
		case arrow.up:
			$("#tempo-up").click();
			break;
		case arrow.down:
			$("#tempo-down").click();
			break;
		case esc:
			var display = $("#shortcuts-dialog").css("display");
			if (display == "block") {
				$(".dialog-close").click();
			}
			break;
		}
	 });

	 /**
	 * Detecting the page's visibility state.
	 */
	(function() {
		var resume = false;
		document.addEventListener("webkitvisibilitychange", function() {
			if (document.webkitHidden) {
				if (Metronome.isPlaying) {
			 		Metronome.stop();
					resume = true;	
		 		}				
			} else {
				if (resume) {
					$("#start-stop").click();
					resume = false;
				}
			}
		}, false);
	 }());
});

var Tempo = function(value) {
	var MAX = value.max;
	var MIN = value.min;
	var tempo = value.tempo;

	this.getValue = function() {
		return tempo;
	}

	this.up = function() {
		if (tempo < MAX) {
			tempo += 1;
		}
	}

	this.down = function() {
		if (tempo > MIN) {
			tempo -= 1;
		}
	}
};

var Beat = function(value) {
	var MAX = value.max;
	var MIN = value.min;
	var beat = value.beat;
	var count = 0;
	var countWithRhythm = 0;

	this.getValue = function() {
		return beat;
	}

	this.up = function() {
		if (beat < MAX) {
			beat += 1;
		}
	}

	this.down = function() {
		if (beat > MIN) {
			beat -= 1;
		}
	}

	this.initCount = function() {
		count = 0;
		countWithRhythm = 0;
	}

	this.getCount = function() {
		return count;
	}	

	this.addCount = function() {
		if (count >= beat) {
			count = 1;
		} else {
			count += 1;	
		}

		return count;
	}

	this.addCountWithRhythm = function(rhythm) {
		var beatWithRhythm = beat;
		if (rhythm == "eighth") {
			beatWithRhythm *= 2;
		} else if (rhythm == "triplet") {
			beatWithRhythm *= 3;
		}

		if (countWithRhythm >= beatWithRhythm) {
			countWithRhythm = 1;
		} else {
			countWithRhythm += 1;	
		}

		return countWithRhythm;
	}
};

var Rhythm = function(value) {
	var rhythm = value || "quarter";
	var count = 0;
	var $note = $("#note > img").attr({
		src: Rhythm.getIcon(rhythm),
		alt: rhythm
	});
				
	this.getValue = function() {
		return rhythm;
	}

	this.getNextRhythm = function() {
		if (rhythm == "quarter") {
			rhythm = "eighth";

		} else if (rhythm == "eighth") {
			rhythm = "triplet";

		} else if (rhythm == "triplet") {
			rhythm = "quarter";
		}

		$note.attr({
			src: Rhythm.getIcon(rhythm),
			alt: rhythm
		});

		return rhythm;
	}

	this.toTempo = function(globalTempo) {
		var tempo = globalTempo;

		if (rhythm == "quarter") {
			tempo *= 1;

		} else if (rhythm == "eighth"){
			tempo *= 2;

		} else if (rhythm == "triplet"){
			tempo *= 3;
		}

		return tempo;
	}
};

Rhythm.getIcon = function(rhythm) {
	return "images/" + rhythm + ".png"; 	
}


var Volume = function() {
	var volume = 0;

	this.getValue = function() {
		return volume;
	}

	this.up = function() {
		volume += 1;
	}

	this.down = function() {
		volume -= 1;
	}	
};

var Type = function(value) {
	var SOUND_LENGTH = 4;	
	var type = value || 0;

	this.get = function() {
		return type;
	}

	this.getNext = function() {
		type += 1;
		if (type >= SOUND_LENGTH) type = 0;

		return type;
	}

	Type.toString = function(value) {
		var str = "CLASSIC";

		switch (value) {
			case 0: str = "CLASSIC"; break;
			case 1: str = "WOODEN"; break;
			case 2: str = "ELECTRONIC"; break;
			case 3: str = "DRUM"; break;
		}

		return str;
	}

	Type.parse = function(str) {
		var value = 0;

		switch (str) {
			case "CLASSIC": value = 0; break;
			case "WOODEN": value = 1; break;
			case "ELECTRONIC": value = 2; break;
			case "DRUM": value = 3; break;
		}

		return value;
	}
}

var Dashboard = function() {
	var $tempo = $("#tempo");
	var $beat = $("#beat");
	var $volume = $("#volume");
	var $count = $("#count");
	var $note = $("#note > img");
	var $mute = $("#mute-icon > img");
	var $type = $("#type-val");

	this.update = function(conf) {
		$tempo.text(conf.tempo);
		$beat.text(conf.beat);
		$volume.text(conf.volume);
		$count.text(conf.count);
		if (conf.mute !== undefined) conf.mute ? $mute.show() : $mute.hide();
		if (conf.type !== undefined) $type.text(Type.toString(conf.type));

		saveConfiguration({
			tempo: $tempo.text(),
			beat: $beat.text(),
			volume: $volume.text(),
			rhythm: $note.attr("alt"),
			mute: $mute.css('display') != 'none' ? true : false,
			type: Type.parse($type.text())
		});
	}
};

var saveConfiguration = function(conf) {
	localStorage.setItem('conf', JSON.stringify(conf));
};

var loadConfiguration = function() {
	var conf = localStorage.getItem('conf');		
	if (conf !== null) {
		conf = JSON.parse(conf);
	}

	return conf;
};