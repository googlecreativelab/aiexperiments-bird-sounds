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

var BoilerPlate = require("../Boilerplate");
var Data = require("./Data");
var Config = require("./Config");
var loaderCSS = require("style/loader.scss");
var ImageLoader = require("image-progress");

var Loader = module.exports = function(image, audio) {

	var scope = this;
	BoilerPlate.call(this);
	this.name = "Loader";

	this.audioprogress = 0;
	this.imageprogress = 0;
	this.loadCount = 0;

	this.isEverythingLoaded = false;
	this.maxWidth = 0;
	this.audioLoadCount = 0;

	this.init = function() {
		image.load(this.loaded.bind(this), this.onimageprogress.bind(this));

		// load preview image
		this.img = null;
		this.isPreviewLoaded = false;
		this.url = "../img/bird_thumbnailsPreview.jpg";
		this.imgLoader = new ImageLoader(this.url);
		this.imgLoader.on("complete", function(){
			this.img = new Image();
			this.img.onload = function(){
				this.isPreviewLoaded = true;
				// this.show({x: 60, y: 57, index: 567});
			}.bind(this);
			this.img.src = this.url;
		}.bind(this));
		this.imgLoader.load();

		this.birdContainer = document.getElementById("birdLoader");
		
		this.canvas = document.getElementById("birdLoaderCanvas");
		this.text = document.getElementById("birdLoaderText");
		this.width = 46*25;//this.canvas.offsetWidth * 2;
		this.height = 46;//this.canvas.offsetHeight * 2;
		this.context = this.canvas.getContext("2d");
		this.context.canvas.width = this.width;
		this.context.canvas.height = this.height;

		this.name = document.getElementById("birdName");
	};

	this.loaded = function(mod){
		this.loadCount++;
		switch(this.loadCount) {
			case 1:
				audio.load(this.loaded.bind(this), this.onaudioprogress.bind(this));
				break;
			case 2:
				this.isEverythingLoaded = true;
				this.dispatchEvent("ALL_LOADED");
				break;
			default:
		}
	};

	this.onaudioprogress = function(amt){
		this.audioprogress = amt;
		this.showprogress();
	};

	this.onimageprogress = function(amt){
		this.imageprogress = amt;
		this.showprogress();
	};

	this.showprogress = function(){
		// percentages are based off of general file size
		var prog = (this.audioprogress*23/25 + this.imageprogress*2/25);
		if (this.isPreviewLoaded && !this.isEverythingLoaded){
			var imgSize = 46;
			var index = Math.floor(prog*49); // 25*2-1
			var row = Math.floor(index / Config.spriteSheetColumns);
			var column = index % Config.spriteSheetColumns;
			this.context.clearRect(0, 0, this.width, this.height);
			this.context.drawImage(this.img, column * imgSize, row * imgSize, imgSize, imgSize, 0, 0, this.width, this.height);
			this.text.innerHTML =  "LOADING " +numberWithCommas(Math.floor(prog*14482))+ " OF 14,482 BIRD SOUNDS";
		}
		if(prog===1) {
			this.isEverythingLoaded = true;
		}
	};
	
	function numberWithCommas(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	this.init();
};

Loader.prototype = new BoilerPlate();
Loader.prototype.constructor = Loader;