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

var Config = module.exports = {
	isStatsEnabled: false,
	isDebugEnabled: false,
	isAudioDisabled: false,
	isMobileEnabled: false,
	isResizeDisabled: false,
	isSplashDisabled: false,

	spriteSheetRows : 28,
	spriteSheetColumns : 25,
	spriteSheetSize : 100,
	gridTotalX: 120,
	gridTotalY: 119,
	gridUnit: 32,
	filterHidden:1,
	filterVisible:2,
	colorLight:0xf2efea,
	colorDark:0xe6e3df,
	colorDarker:0xd9d6d2,
	colorHighlight:0x18BABA,
	trailsTotal:6,
	draggerSize:32*2,//48;
	audioChunks : 20, // the number of files the audio is split into
	emptySuggestions:[
		"DUCK",
		"SPARROW",
		"HUMMINGBIRD",
		"GOLDFINCH",
		"OWL",
		"WREN",
		"HAWK",
		"WARBLER",
		"PHOEBE",
		"WAXWING",
		"GNATCATCHER",
		"GULL"
	],
	birdFFTSpriteSheet: "./img/spritesheet_new.png",
	domain: "./", 
	paths: {
		tsne: "meta/",
		audio: "audio/"
	}

};