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
var Data = require("../core/Data");
var TWEEN = require("Tween.js");
var Config = require("../core/Config");

var Dragger = module.exports = function() {

	var scope = this;
	BoilerPlate.call(this);
	this.name = "Dragger";
	this.container = null;
	this.x = -1;
	this.y = -1;
	this.size = Config.draggerSize;

	this.init = function() {
		scope.container = new PIXI.Container();

		scope.container.interactive = true;
		scope.container.buttonMode = true;
		scope.container.defaultCursor = "pointer";

		var texture = PIXI.Texture.fromImage(Config.birdFFTSpriteSheet, false, PIXI.SCALE_MODES.NEAREST);
		this.sprite = new PIXI.Sprite(texture);
		this.sprite.scale.x = this.size/32.0;
		this.sprite.scale.y = this.size/32.0;
		scope.container.addChild(this.sprite);

		var myMask = new PIXI.Graphics();
		myMask.beginFill();
		myMask.drawRect(-this.size*0.5, -this.size*0.5, this.size, this.size);
		myMask.endFill();
		scope.container.addChild(myMask);

		this.sprite.mask = myMask;

		var square = new PIXI.Graphics();
		square.beginFill(Config.colorHighlight, 0.0);
		square.lineStyle(2, Config.colorHighlight);
		square.drawRect(-this.size*0.5, -this.size*0.5, this.size, this.size);
		square.endFill();
		scope.container.addChild(square);

		field = new PIXI.Graphics();
		field.beginFill(Config.colorHighlight, 0.125);
		field.drawRect(-this.size*0.5, -this.size*0.5, this.size, this.size);
		field.endFill();
		field.blendMode = PIXI.BLEND_MODES.MULTIPLY;
		square.addChild(field);

		var dot = new PIXI.Graphics();
		dot.beginFill(0xFF00FF, 1.0);
		dot.drawRect(0, 0, 4, 4);
		dot.endFill();

		this.setSprite({x: 60, y: 57, index: 567});

		scope.container.x = -200;
		scope.container.y = -200;
		requestAnimationFrame(tweenAnimate);
	};

	this.highlight = function() {
		var isComplete;
		var state = { value: 1.25 };
			tween = new TWEEN.Tween(state)
				.to({ value: 1 }, 100)
				.easing(TWEEN.Easing.Quadratic.InOut)
				.onStart(function(){
					isComplete = false;
				})
				.onUpdate(function() {

					scope.container.scale.x = state.value;
					scope.container.scale.y = state.value;

				})
				.onComplete(function(){
					isComplete = true;
				})
				.start();
	};

	this.setSprite = function(obj) {
		this.sprite.x = -this.size*(obj.x)-this.size*0.5;
		this.sprite.y = -this.size*(obj.y)-this.size*0.5;
	};

	this.getContainer = function() {
		return scope.container;
	};
	
	this.getPosition = function() {
		return scope.container;
	};

	function tweenAnimate(time) {
		requestAnimationFrame(tweenAnimate);
		TWEEN.update(time);
	}
};

Dragger.prototype = new BoilerPlate();
Dragger.prototype.constructor = Dragger;