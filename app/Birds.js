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

var BoilerPlate = require("./Boilerplate");
var Data = require("./core/Data");
var Grid = require("./grid/Grid");
var Loader = require("./core/Loader");
var Label = require("./core/Label");
var Sound = require("./core/Sound");
var Filter = require("./core/Filter");
var Config = require("./core/Config");
var ZoomControls = require("./core/ZoomControls");

var Birds = module.exports = function() {

	var scope = this;
	BoilerPlate.call(this);
	this.name = "Birds";

	this.grid = null;
	this.loader = null;
	this.sound = null;
	this.label = null;

	this.init = function() {

		// check for webGL;
		var canvas = document.createElement("canvas");
		var noGL = document.getElementById("noGL");
		var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
		if (gl && gl instanceof WebGLRenderingContext) {
			noGL.classList.remove("show");
			noGL.remove();
		} else {
			noGL.classList.add("show");
		}

		Config.domain 			= (getParameterByName("domain")==="local") ? "./" : Config.domain;
		Config.isAudioDisabled 	= (getParameterByName("isAudioDisabled")==="true");
		Config.isStatsEnabled 	= (getParameterByName("isStatsEnabled")==="true");
		Config.isDebugEnabled 	= (getParameterByName("isDebugEnabled")==="true");
		Config.isMobileEnabled 	= (getParameterByName("isMobileEnabled")==="true");

		if(isMobile.any() && !Config.isMobileEnabled) {
			noMobile.classList.add("show");
			return;
		}

		window.addEventListener("orientationchange", function (event) {
			this.reorient(event);
		}.bind(scope), false);

		var dragExceptions = "tagButtontagsdescriptionthumbnailabout";
		document.ontouchmove = function(event){
			if (dragExceptions.indexOf(event.target.className.split(" ")[0]) === -1 ) {
				event.preventDefault();
			}
		};
		document.addEventListener("ontouchmove", function(event){
			event.preventDefault();
		}, false);

		var aboutLink = document.getElementById("aboutLink");
		var about = document.getElementById("about");
		var cover = document.getElementById("cover");
		var aboutContainer = about.getElementsByClassName("container")[0];
		var intro = document.getElementById("intro");
		var startLink = document.getElementById("startLink");

		aboutContainer.addEventListener("click", function(event) {
			event.stopPropagation();
		}.bind(scope), false);

		aboutLink.addEventListener("click", function(event) {
			this.grid.disableZoom();
			about.classList.add("show");
			intro.classList.add("hide");
		}.bind(scope), false);

		// Grid of Bird Sprites
		this.grid = new Grid();
		this.grid.addEventListener("ON_LOADED", function(){
			this.dispatchEvent("GRID_LOADED");
			this.loadBirdData();
		}.bind(this));
		this.grid.addEventListener("ON_DOWN", function(){
			this.filter.unfocus();
		}.bind(this));
		this.grid.addEventListener("ON_CHANGED", function(birdData, position){
			this.sound.play(birdData.index);
			this.grid.highlight();
			this.label.show(birdData);
			this.label.reposition(position.x, position.y);
		}.bind(this));
		this.grid.addEventListener("ON_ZOOMED", function(position){
			this.label.reposition(position.x, position.y);
		}.bind(this));
		this.grid.addEventListener("ON_POSITION_UPDATED", function(position){
			this.label.reposition(position.x, position.y);
		}.bind(this));
		this.grid.addEventListener("ON_REPLAY", function(birdData){
			this.sound.play(birdData.index);
			this.grid.highlight();
		}.bind(this));
		this.grid.addEventListener("ON_MAX_MIN_ZOOM", function(){
			this.zoomControls.isDown = false; // forces the loop to stop
		}.bind(this));
		this.grid.init();

		// Filter
		this.filter = new Filter();
		this.filter.addEventListener("ON_FOCUS_IN", function(input){
			window.scrollTo(0, 0);
			document.body.scrollTop = 0;
			this.filter.updateAutoSuggest(Data.getSuggestions(input));
			this.grid.disableZoom();
			this.grid.filter();
			if(this.filter.isEmpty){
				this.grid.updateGridColor(Config.colorLight);
			}
		}.bind(this));
		this.filter.addEventListener("ON_FOCUS_OUT", function(input){
			this.grid.enableZoom();
			this.filter.clearAutoSuggest();
			if(this.filter.isEmpty){
				this.grid.updateGridColor(Config.colorLight);
			} else {
				this.filter.contract(); // if typed and clicks on bg in iphone
			}
		}.bind(this));
		this.filter.addEventListener("ON_SUGGESTION_CLICKED", function(input){
			this.filter.clearAutoSuggest();
			Data.filter(input);
			this.grid.filter();
			this.grid.updateGridColor(Config.colorDarker);
		}.bind(this));
		this.filter.addEventListener("ON_CLEAR", function(){
			this.filter.clearAutoSuggest();
			this.filter.updateAutoSuggest(Data.getSuggestions());
			Data.resetFilterStates();
			this.grid.filter();
			this.grid.updateGridColor(Config.colorLight);
		}.bind(this));
		this.filter.addEventListener("ON_UPDATE", function(input){
			this.filter.updateAutoSuggest(Data.getSuggestions(input));
			Data.filter(input);
			this.grid.filter();
			this.grid.updateGridColor(Config.colorDark);
		}.bind(this));

		// Zoom Controls
		this.zoomControls = new ZoomControls();
		this.zoomControls.addEventListener("ON_ZOOM_IN_CLICKED",function(){
			this.grid.zoom(true,0.025);
		}.bind(scope));
		this.zoomControls.addEventListener("ON_ZOOM_OUT_CLICKED",function(){
			this.grid.zoom(false,0.025);
		}.bind(scope));
		this.zoomControls.addEventListener("ON_WHEEL",function(delta){
			this.grid.zoom(delta < 0, 0.025);
		}.bind(scope));

		Data.createFilterStates();
		this.createUIButtons();
		this.grid.disableZoom();
		this.loadVideoPlayer();

	};

	this.loadBirdData = function() {

		startLink.classList.add("show");
		aboutLink.classList.add("show");

		this.label = new Label();
		this.sound = new Sound();
		this.loader = new Loader(this.label, this.sound);
		this.loader.addEventListener("ALL_LOADED", function(){
			var introExist = document.getElementById("intro");
			if(!introExist) {
				this.removeIntro();
			}
		}.bind(this));
	};

	this.loadVideoPlayer = function(event) {

		var playerContainer = document.getElementById("drumsVideo");
		var playButton = document.getElementsByClassName("playButton")[0];
		var thumbnail = document.getElementById("thumbnail");
		var ytPlayer = null;

		var onPlayerReady = function(event) {
			playerContainer.style.display = "none";
			playButton.addEventListener("click", function(event) {
				playerContainer.style.display = "block";
				ytPlayer.playVideo();
				playButton.style.display = "none";
				thumbnail.style.display = "none";
			},false);
			var about = document.getElementById("about");
			about.addEventListener("click", function(event) {
				ytPlayer.pauseVideo();
			},false);
		};
		ytPlayer = new YT.Player('drumsVideo', {
			width:'100%',
			height:'100%',
			videoId: Data.videoId,  // youtube video id
			playerVars: {
				'autoplay': 0,
				'rel': 0,
				'showinfo': 0
			},
			events: {
				'onReady': onPlayerReady
			}
		});
	};

	this.createUIButtons = function(){
		var aboutLink = document.getElementById("aboutLink");
		var infoIcon = document.getElementById("infoIcon");
		var about = document.getElementById("about");
		var intro = document.getElementById("intro");
		var cover = document.getElementById("cover");
		var label = document.getElementById("birdLabel");
		var filter = document.getElementById("filter");

		aboutLink.addEventListener("click", function(event) {
			this.grid.disableZoom();
			about.classList.add("show");
			intro.classList.add("hide");
		}.bind(scope));

		about.addEventListener("click", function(event) {
			var hasIntro = document.getElementById("intro");
			this.grid.enableZoom();
			this.zoomControls.show();
			about.classList.remove("show");
			if(hasIntro) {
				// shows intro
				intro.classList.remove("hide");
				cover.classList.add("show");
			} else {

				// shows experience
				filter.classList.add("show");
				label.classList.add("show");
				infoIcon.classList.add("show");
				cover.classList.remove("show");
				this.grid.show();
			}
		}.bind(scope));

		infoIcon.addEventListener("click", function(){
			filter.classList.remove("show");
			label.classList.remove("show");
			infoIcon.classList.remove("show");
			cover.classList.add("show");
			about.classList.add("show");
			
			this.grid.hide();
			this.grid.disableZoom();
		}.bind(scope));

	};
	
	this.beginExperience = function(){

		// show interface element after intro
		document.getElementById("infoIcon").classList.add("show");
		document.getElementById("cover").classList.remove("show");
		document.getElementById("intro").remove();

		if(!this.loader.isEverythingLoaded) {
			document.getElementById("birdLoader").classList.add("show");
			document.getElementById("filter").classList.remove("show");
			document.getElementById("birdLabel").classList.remove("show");
		} else {
			this.removeIntro();
		}

		this.grid.show();
		this.grid.enableZoom();
	};

	this.removeIntro = function () {
		document.getElementById("birdLoader").classList.remove("show");
		document.getElementById("birdLoader").remove();
		document.getElementById("filter").classList.add("show");
		document.getElementById("birdLabel").classList.add("show");
		this.zoomControls.show();
		scope.grid.createListeners();
		scope.grid.setDefault();
	};

	//a timeout is used get the the true height and width
	this.reorientTimer = null;
	this.reorient = function(event) {
		clearTimeout(this.reorientTimer);
		this.reorientTimer = setTimeout(function() {
			var isLandScape = window.innerHeight < window.innerWidth;
			var isPhone = window.innerHeight < 480 || window.innerWidth < 480; 
			var reorient = document.getElementById("reorient");
			if(isLandScape && isMobile.any() && isPhone) {
				reorient.classList.add("show");
			} else {
				reorient.classList.remove("show");
			}			

		}, 250);
	};

	var getParameterByName = function(name, url) {
		if (!url) url = window.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	};

	var isMobile = {
		Android: function() {
			return navigator.userAgent.match(/Android/i);
		},
		BlackBerry: function() {
			return navigator.userAgent.match(/BlackBerry/i);
		},
		iOS: function() {
			return navigator.userAgent.match(/iPhone|iPad|iPod/i);
		},
		Opera: function() {
			return navigator.userAgent.match(/Opera Mini/i);
		},
		Windows: function() {
			return navigator.userAgent.match(/IEMobile/i);
		},
		any: function() {
			return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
		}
	};
};

Birds.prototype = new BoilerPlate();
Birds.prototype.constructor = Birds;