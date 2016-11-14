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

var cssSequencer = require("../../style/loader.scss");
var birdCoords = require("raw!data/tsne/grid.30.30.2d.sorted.tsv");
var filenames = require("raw!data/names.txt");
var Config = require("./Config.js");
var birdSuggestions = require("raw!data/autosuggest_bird.txt");

(function(){

	var i,j;
	//setup the bird coords
	birdCoords = birdCoords.split("\n");
	for (i = 0; i < birdCoords.length; i++){
		var row = birdCoords[i].split("\t");
		birdCoords[i] = [
			parseFloat(row[0]), 
			parseFloat(row[1]), 
			parseFloat(row[2])
			]; 
	}

	filenames = filenames.split("\n");
	for (i = 0; i < filenames.length; i++){
		filenames[i] = filenames[i].toUpperCase();
	}

	birdSuggestions = birdSuggestions.split("\n");
}());

var Data = module.exports = {
	videoId: '31PWjb7Do1s',
	totalPoints: birdCoords.length,
	filterStates:null,
	filteredList: [],
	getBird: function(index){
		return {
				x: birdCoords[index][0],
				y: birdCoords[index][1],
				index: birdCoords[index][2]
			};
	},
	getBirdIndex: function(index) {
		return birdCoords[index][2];
	},
	getBirdX: function(index) {
		return birdCoords[index][0];
	},
	getBirdY: function(index) {
		return birdCoords[index][1];
	},

	getTotalPoints: function(){
		return this.totalPoints;
	},

	randomizeFilterStates: function () {
		var i,j,k;
		var total = Data.getTotalPoints();
		var randomState;

		for(i=0;i<total; i++){
			randomState = (((Math.random()*4)|0) === 0) ? Config.filterVisible:Config.filterHidden;
			Data.setFilterState(i,randomState);
		}
	},

	createFilterStates: function (state) {
		var i,j,k;
		var total = Data.getTotalPoints();
		state = state || Config.filterVisible;
		Data.filterStates = [];
		for(i=0;i<total; i++){
			Data.setFilterState(i,state);
		}
	},

	setFilterState: function (index, state) {
		Data.filterStates[index] = state;
	},

	resetFilterStates: function () {
		var i,j,k;
		var total = Data.getTotalPoints();

		for(i=0;i<total; i++){
			Data.setFilterState(i,Config.filterVisible);
		}
	},

	filter: function(value){
		var i,j,k;
		var tag, tags;
		var total = Data.getTotalPoints();
		var totalTags;
		var term = value.toUpperCase();

		// single word
		if(term.split(" ").length===1) {
			var name;
			var separators = [' ', '-', '\\\(', '\\\)'].join('|');
			for (i = 0; i < filenames.length; i++){
				this.filterStates[i] = Config.filterHidden;
				if(	~filenames[i].indexOf(term) ){
					name = filenames[i].split(new RegExp(separators, 'g'));
					for(j=(name.length-1); j>=0; --j) {
						if(name[j].indexOf(term)===0) {
							this.filterStates[i] = Config.filterVisible;
							break;
						}
					}

				}
			}

		// multi word
		} else {
			for (i = 0; i < filenames.length; i++){
				this.filterStates[i] = Config.filterHidden;
				if(	~filenames[i].indexOf(term) ){
					this.filterStates[i] = Config.filterVisible;
				}
			}

		}

	},

	getSuggestions: function(value){
		var suggestions;
		if (!value) {
			suggestions = Config.emptySuggestions;
			return suggestions;
		}
		var i,j,k;
		var tag, tags;
		var total = birdSuggestions.length;
		var term = value.toUpperCase();
		var name;
		suggestions = [];

		var separators = [' ', '-', '\\\(', '\\\)'].join('|');

		// inline search
		for (i = 0; i < birdSuggestions.length; i++){

			name = birdSuggestions[i].split(new RegExp(separators, 'g'));
			for(j=(name.length-1); j>=0; --j) {
				if(name[j].indexOf(term)===0) {
					suggestions.push(birdSuggestions[i]);
					break;
				}
			}
		}

		return suggestions;
	},

};