$(document).ready(function () {
	$(".live-tile").not(".exclude").liveTile();	

	var conf = loadConfiguration();
	if (conf === null) {
		conf = {
			tempo: 100,
			volume: 100,
			beat: 4
		};
	}

	var dashboard = new Dashboard();
	dashboard.update(conf);

	var tempo = new Tempo({
		max: 250,
		min: 60,
		tempo: Number(conf.tempo)
	});
	var beat = new Beat({
		max: 8,
		min: 1,
		beat: Number(conf.beat)
	});

	var buffers = null;

	WebAudioAdapter.init(Number(conf.volume));
	var bufferLoader = new BufferLoader(WebAudioAdapter.context, ['resources/stick.ogg', 'resources/closed_hh.ogg'], function(bufferList) {
		buffers = bufferList;
	});
	bufferLoader.load();

	$("#tempo-up").click(function() {
		tempo.up();
		dashboard.update({
			tempo: tempo.getValue()
		});

		WebAudioAdapter.setTempo(tempo.getValue());
	});

	$("#tempo-down").click(function() {
		tempo.down();
		dashboard.update({
			tempo: tempo.getValue()
		});

		WebAudioAdapter.setTempo(tempo.getValue());
	});

	$("#volume-up").click(function() {
		dashboard.update({
			volume: WebAudioAdapter.volumeUp()
		});
	});

	$("#volume-down").click(function() {
		dashboard.update({
			volume: WebAudioAdapter.volumeDown()
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
		if (WebAudioAdapter.isRunning) {
			WebAudioAdapter.stop();

		} else {
			if (buffers !== null) {
				WebAudioAdapter.setTempo(tempo.getValue());
				WebAudioAdapter.setBuffer(buffers[0]);
				WebAudioAdapter.play(function() {
					beat.addCount();

					var count = beat.getCount();
					if (count == 1) {
						WebAudioAdapter.setBuffer(buffers[0]);
					} else {
						WebAudioAdapter.setBuffer(buffers[1]);
					}

					dashboard.update({
						count: count
					});
				});	
			}
		}
	});

	$("#rhythm").click(function() {
		
	});

	$(window).unload(function() {
		saveToLocalStorage({ 
				tempo: tempo.getValue(), 
				volume: WebAudioAdapter.getVolume(), 
				beat: beat.getValue()
			});
	});
});

var Tempo = function(value) {
	var MAX = value.max;
	var MIN = value.min;
	var tempo = value.tempo;

	/*var MAX = 250;
	var MIN = 60;
	var tempo = value;
*/
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

	this.getCount = function() {
		return count;
	}	

	this.addCount = function() {
		if (count >= beat) {
			count = 1;
		} else {
			count += 1;	
		}

		console.log(count);
	}
};

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

var Dashboard = function() {
	var $tempo = $("#tempo");
	var $beat = $("#beat");
	var $volume = $("#volume");
	var $count = $("#count");

	this.update = function(conf) {
		$tempo.text(conf.tempo);
		$beat.text(conf.beat);
		$volume.text(conf.volume);
		$count.text(conf.count);

		saveConfiguration({
			tempo: $tempo.text(),
			beat: $beat.text(),
			volume: $volume.text()
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
