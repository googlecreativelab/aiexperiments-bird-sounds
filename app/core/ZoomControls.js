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
var zoomCSS = require("../../style/ZoomControls.scss");

var ZoomControls = module.exports = function() {
	var scope = this;
	BoilerPlate.call(this);
	this.name = "ZoomControls";

	this.eventString = null;
	this.isDown = false;

	var onWheel = function (event) {
		if(	document.getElementById("zoom").classList.contains("show")) {
			var delta = (!event.deltaY) ? event.detail : event.deltaY;
			scope.dispatchEvent("ON_WHEEL",[delta]);
		}
	};

	document.body.addEventListener("mousewheel", onWheel.bind(scope), false);
	document.body.addEventListener("DOMMouseScroll", onWheel.bind(scope), false);

	var onZoomInDown = function(event){
		this.isDown = true;
		this.eventString = "ON_ZOOM_IN_CLICKED";
		this.animate();

		event.preventDefault();
		event.stopPropagation();
		event.cancelBubble = true;
		event.returnValue = false;
		return false;

	}.bind(scope);

	var onZoomInUp = function(){
		this.isDown = false;
	}.bind(scope);

	var onZoomOutDown = function(event){
		this.isDown = true;
		this.eventString = "ON_ZOOM_OUT_CLICKED";
		this.animate();

		event.preventDefault();
		event.stopPropagation();
		event.cancelBubble = true;
		event.returnValue = false;
		return false;
		
	}.bind(scope);

	var onZoomOutUp = function(){
		this.isDown = false;
	}.bind(scope);

	this.animate = function() {
		if(!this.isDown) {
			return;
		}
		this.dispatchEvent(this.eventString);
		requestAnimationFrame(function() {
			scope.animate();
		});
	};

	this.show = function(){
		document.getElementById("zoom").classList.add("show");
	};
	this.hide = function(){
		document.getElementById("zoom").classList.remove("show");
	};

	this.zoomInIcon = document.getElementById("plusIcon");
	this.zoomInIcon.addEventListener("mousedown", onZoomInDown);
	this.zoomInIcon.addEventListener("touchstart", onZoomInDown);
	this.zoomInIcon.addEventListener("mouseup", onZoomInUp);
	this.zoomInIcon.addEventListener("touchend", onZoomInUp);

	this.zoomOutIcon = document.getElementById("minusIcon");
	this.zoomOutIcon.addEventListener("mousedown", onZoomOutDown);
	this.zoomOutIcon.addEventListener("touchstart", onZoomOutDown);
	this.zoomOutIcon.addEventListener("mouseup", onZoomOutUp);
	this.zoomOutIcon.addEventListener("touchend", onZoomOutUp);
	
};

ZoomControls.prototype = new BoilerPlate();
ZoomControls.prototype.constructor = ZoomControls;
