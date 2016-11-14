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

require("style/main.scss");

var Config = require("./core/Config");

require(["domready"], function(domReady){

	domReady(function(){

		document.onselectstart = function () { return false; };

		require(["Birds"], function(Birds){

			var onBadges = function (event) {
				event.stopPropagation();
				event.preventDefault();
			};

			var onAbout = function(event){
				event.preventDefault();
				event.stopPropagation();
			};

			var onStart = function(event){
				birds.beginExperience();
				badges.removeEventListener("click", onBadges,false);
				startButton.removeEventListener('click', onStart, false);
				aboutButton.removeEventListener('click', onAbout, false);
				event.preventDefault();
				event.stopPropagation();
			};

			var birds = new Birds();
			var aboutButton = document.getElementById("aboutLink");
			var startButton = document.getElementById("startLink");
			var badges = document.getElementById("badges");
			var cover = document.getElementById("cover");

			birds.addEventListener("GRID_LOADED",function(){
				if(Config.isSplashDisabled){
					birds.beginExperience();
				} else {
					badges.addEventListener("click", onBadges,false);
					startButton.addEventListener('click', onStart, false);
					aboutButton.addEventListener('click', onAbout, false);
				}
			});

			birds.init();
			cover.classList.add("show");
		});
	});
});