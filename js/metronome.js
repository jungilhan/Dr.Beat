var Metronome = function() {};

Metronome.context = null;
Metronome.loopTimer = 0;
Metronome.isPlaying = false;

Metronome.init = function(volume) {
	this.context = new webkitAudioContext();
	this.gainNode = this.context.createGainNode();	
	this.volume = volume;
}

Metronome.setBuffer = function(buffer) {
	this.buffer = buffer;
}

Metronome.getVolume = function() {
	return Metronome.volume;
};

Metronome.volumeUp = function() {	
	if (Metronome.volume < 100) {
		Metronome.volume += 10;
	}

	return Metronome.volume;
};

Metronome.volumeDown = function() {
	if (Metronome.volume > 0) {
		Metronome.volume -= 10;		
	}

	return Metronome.volume;
};

Metronome.mute = function(on) {
	if (on) {
		Metronome.volume = 0;
	} else {
		Metronome.volume = 100;
	}
};

Metronome.setTempo = function(tempo) {
	this.tempo = tempo;
};

Metronome.setBuffer = function(buffer) {
	this.buffer = buffer;
};

Metronome.play = function(onPlayNote) {
	if (typeof this.tempo === "undefined" || typeof this.buffer === "undefined") {
		return;
	}
	
	var interval = (1 / (this.tempo / 60)) * 1000;
	var latency = 0;

	var playImpl = function() {
		var startTime = Metronome.context.currentTime;

		if (typeof onPlayNote !== "function") {
			onPlayNote = false;
		}
		
		if (onPlayNote) {
			onPlayNote();
		}

		Metronome.playNote(Metronome.buffer, 0);
		Metronome.play(onPlayNote);

		latency = Metronome.context.currentTime - startTime;
	};

	if (!this.isPlaying) {
		this.isPlaying = true;
		playImpl();
		return;
	}

	this.loopTimer = setTimeout(function() {		
		playImpl();
	}, interval - latency * 1000);
};

Metronome.playNote = function(buffer, when) {
	var source = this.context.createBufferSource();
	source.buffer = buffer;

	var gainNode = this.context.createGainNode();
	gainNode.gain.value = this.volume / 100;
	source.connect(gainNode);
	gainNode.connect(this.context.destination);			
	source.noteOn(when);	
};

Metronome.stop = function(timerId) {
	this.isPlaying = false;
	clearTimeout(this.loopTimer);
};