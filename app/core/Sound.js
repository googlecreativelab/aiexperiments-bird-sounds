/*
Copyright 2016 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

define(["./Config", "Tone/core/Buffers", "Tone/core/Buffer", "Tone/source/MultiPlayer", "raw!data/durations.txt"], 
	function (Config, Buffers, Buffer, MultiPlayer, durations) {

	(function(){
		durations = durations.split("\n").slice(0, -1);
		//convert them to numbers
		for (var i = 0; i < durations.length; i++){
			durations[i] = durations[i].split("\t");
			for (var d = 0; d < durations[i].length; d++){
				durations[i][d] = parseFloat(durations[i][d]);
			}
		}
	}());

	var Sound = function(container){
		this.buffers = null;
		this.player = new MultiPlayer({
			"fadeOut" : 0.01,
			"volume" : -10
		}).toMaster();

		this._loaded = false;
	};

	Sound.prototype.load = function(onload, onprogress){

		if(Config.isAudioDisabled) {
			onload();
		} else {
			var files = {};
			var i;
			var loadCount = 0;
			for (i = 0; i < Config.audioChunks; i++){
				files[i] = "samples_"+i.toString()+".mp3";
			}
			
			this.buffers = new Buffers(files, function(){
				onload();
				this._loaded = true;
			}.bind(this), Config.domain + Config.paths.audio);

			Buffer.on("progress", onprogress);
		}
	};

	Sound.prototype.play = function(index, velocity){
		if (this.buffers && this._loaded){
			var description = durations[index];
			if (description){
				var bufferNum = description[0];
				var startOffset = description[1];
				var duration = description[2];
				var buff = this.buffers.get(bufferNum);
				this.player.start(buff, undefined, startOffset, duration);
			}
		}
	};

	return Sound;
});