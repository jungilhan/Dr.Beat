var WebAudioAdapter = function() {};

WebAudioAdapter.context = null;
WebAudioAdapter.loopTimer = 0;
WebAudioAdapter.isPlaying = false;

WebAudioAdapter.init = function(volume) {
	this.context = new webkitAudioContext();
	this.gainNode = this.context.createGainNode();	
	this.volume = volume;
}

WebAudioAdapter.setBuffer = function(buffer) {
	this.buffer = buffer;
}

WebAudioAdapter.getVolume = function() {
	return WebAudioAdapter.volume;
};

WebAudioAdapter.volumeUp = function() {	
	if (WebAudioAdapter.volume < 100) {
		WebAudioAdapter.volume += 10;
	}

	return WebAudioAdapter.volume;
};

WebAudioAdapter.volumeDown = function() {
	if (WebAudioAdapter.volume > 0) {
		WebAudioAdapter.volume -= 10;		
	}

	return WebAudioAdapter.volume;
};

WebAudioAdapter.setTempo = function(tempo) {
	this.tempo = tempo;
};

WebAudioAdapter.setBuffer = function(buffer) {
	this.buffer = buffer;
};

WebAudioAdapter.play = function(onPlayNote) {
	if (typeof this.tempo === "undefined" || typeof this.buffer === "undefined") {
		return;
	}
	
	var interval = (1 / (this.tempo / 60)) * 1000;
	var latency = 0;

	var playImpl = function() {
		var startTime = WebAudioAdapter.context.currentTime;

		if (typeof onPlayNote !== "function") {
			onPlayNote = false;
		}
		
		if (onPlayNote) {
			onPlayNote();
		}

		WebAudioAdapter.playNote(WebAudioAdapter.buffer, 0);
		WebAudioAdapter.play(onPlayNote);

		latency = WebAudioAdapter.context.currentTime - startTime;
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

WebAudioAdapter.playNote = function(buffer, when) {
	var source = this.context.createBufferSource();
	source.buffer = buffer;

	var gainNode = this.context.createGainNode();
	gainNode.gain.value = this.volume / 100;
	source.connect(gainNode);
	gainNode.connect(this.context.destination);			
	source.noteOn(when);	
};

WebAudioAdapter.stop = function(timerId) {
	this.isPlaying = false;
	clearTimeout(this.loopTimer);
};