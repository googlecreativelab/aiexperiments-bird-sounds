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

define(["style/label.scss", "image-progress", "raw!data/image_offset.txt", "raw!data/names.txt", "core/Config"], 
	function (pictureStyle, ImageLoader, imageOffsets, filenames, Config) {

	(function(){
		imageOffsets = imageOffsets.split("\n");
		filenames = filenames.split("\n");
		for (var i = 0; i < imageOffsets.length; i++){
			imageOffsets[i] = parseInt(imageOffsets[i]);
		}
	}());

	var Label = function(){
		this.url = "../img/bird_thumbnails.jpg";
		this.imgLoader = new ImageLoader(this.url);
		this.loaded = false;
		this.img = null;

		this.element = document.getElementById("birdLabel");
		this.element.classList.add("show");

		this.canvas = document.getElementById("birdCanvas");

		this.width = 92;//this.canvas.offsetWidth * 2;
		this.height = 92;//this.canvas.offsetHeight * 2;

		this.context = this.canvas.getContext("2d");
		this.context.canvas.width = this.width;
		this.context.canvas.height = this.height;

		this.name = document.getElementById("birdName");

		this.element.classList.remove("show");
	};

	Label.prototype.load = function(onload, onprogress){
		this.imgLoader.on("progress", function(e){
			onprogress(e.progress);
		});
		this.imgLoader.on("complete", function(){
			this.img = new Image();
			this.img.onload = function(){
				onload();
				this.loaded = true;
				this.show({x: 60, y: 57, index: 567});
			}.bind(this);
			this.img.src = this.url;
		}.bind(this));
		this.imgLoader.load();
	};

	Label.prototype.show = function(birdData){
		if (this.loaded){

			var imgSize = Config.spriteSheetSize;
			var index = imageOffsets[birdData.index];
			var row = Math.floor(index / Config.spriteSheetColumns);
			var column = index % Config.spriteSheetColumns;

			this.name.innerHTML = "";
			this.name.innerHTML += filenames[birdData.index].toUpperCase();

			this.context.clearRect(0, 0, this.width, this.height);
			this.context.drawImage(this.img, column * imgSize, row * imgSize, imgSize, imgSize, 0, 0, this.width, this.height);
		}
	};

	Label.prototype.reposition = function(xPos, yPos){
		xPos -= 208*0.5; // half label width
		yPos -= 60; // label height
		yPos -= 32*2*0.5; // half dragger height/size
		yPos -= 10; // spacing
		this.element.style.left = xPos + "px";
		this.element.style.top = yPos + "px";
	};

	return Label;
});