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
var Dragger = require("./Dragger");
var PIXI = require("pixi.js");
var gridCSS = require("../../style/grid.scss");
var Data = require("../core/Data");
var Config = require("../core/Config");
var Stats = require("stats.js");
var TWEEN = require("Tween.js");

var Grid = module.exports = function() {

	var scope = this;
	BoilerPlate.call(this);

	var IS_SETTLING = 1;
	var IS_DRAGGING = 2;
	var IS_ZOOMING = 3;
	var IS_SETTLED = 4;

	this.name = "Grid";
	var stats = null;
	var stage = null;
	var base = null;
	var renderer = null;
	var birdGrid = null;
	var dragger = null;
	var margin = 100;
	var selectedIndex = -1;
	var cursorIndex = new PIXI.Point(60,56);

	var touchState = IS_SETTLED;
	var pinchDistanceSquared = 0;
	var pinchDistanceSquaredStart = 0;

	var filterCovers = null;
	var HIDE_OFFSET = -100000000;
	var textureSquareDark = null;
	var textureSquareDarker = null;

	var debugBox = null;

	this.isZoomEnabled = true;
	this.birdData = null;

	this.init = function() {
		if(Config.isStatsEnabled) {
			stats = new Stats();
			stats.domElement.style.position = 'absolute';
			stats.domElement.style.left = '0px';
			stats.domElement.style.top = null;
			stats.domElement.style.bottom = '0px';
			document.body.appendChild( stats.domElement );
		}

		PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
		var loader = PIXI.loader;
		loader.add("spriteSheet", Config.birdFFTSpriteSheet);
		loader.once('complete',function() {
			scope.onSpriteSheetLoaded();
		});
		loader.load();
		requestAnimationFrame(tweenAnimate);
	};

	this.onSpriteSheetLoaded = function (event) {
		// base elements
		renderer = new PIXI.WebGLRenderer(
			window.innerWidth,
			window.innerHeight,
			{
				backgroundColor: 0xf2efea,
				antialias: false,
				transparent: false,
				resolution: 1,
				roundPixels:true
			},
			true
		);
		var grid = document.getElementById('grid');
		grid.appendChild(renderer.view);
		stage = new PIXI.Container();
		base = new PIXI.Graphics();
		stage.addChild(base);

		// bird grid
		birdGrid = new PIXI.Container();
		birdGrid.defaultCursor = "pointer";
		base.addChild(birdGrid);

		birdGridOutline = new PIXI.Graphics();
		base.addChild(birdGridOutline);

		// bird grid texture
		var texture = PIXI.Texture.fromImage(Config.birdFFTSpriteSheet, false, PIXI.SCALE_MODES.NEAREST);
		this.sprite = new PIXI.Sprite(texture);
		this.sprite.storedWidth = this.sprite.width;
		this.sprite.storedHeight = this.sprite.height;
		birdGrid.addChild(this.sprite);

		var field = new PIXI.Graphics();
		field.beginFill(0x65b1b3, 0.125);
		field.drawRect(0,0,this.sprite.width,this.sprite.height);
		field.endFill();
		field.blendMode = PIXI.BLEND_MODES.MULTIPLY;
		birdGrid.field = field;
		birdGrid.field.visible = false;
		birdGrid.addChild(field);

		debugBox = new PIXI.Graphics();
		debugBox.beginFill(0xFF0000, 1.0);
		debugBox.drawRect(0,0,100,100);
		debugBox.endFill();
		debugBox.blendMode = PIXI.BLEND_MODES.MULTIPLY;
		debugBox.x = 50;
		debugBox.y = 50;

		// centers bird grid
		birdGrid.x = (window.innerWidth-birdGrid.width)*0.5;
		birdGrid.y = (window.innerHeight-birdGrid.height)*0.5;

		// dragger
		dragger = new Dragger();
		dragger.init();
		base.addChild(dragger.getContainer());
		dragger.container.visible = false;

		// filter cover
		var totalSprites = Data.getTotalPoints();
		filterCovers = new PIXI.ParticleContainer(totalSprites);
		birdGrid.addChild(filterCovers);

		var squareCover = new PIXI.Graphics();
		squareCover.beginFill(Config.colorLight);
		squareCover.drawRect(0,0,32,32);
		squareCover.endFill();
		textureSquareDark = squareCover.generateTexture();

		for (var i = 0; i < totalSprites; i++) {
			var square = new PIXI.Sprite(textureSquareDark);
			square.x = (i%Config.gridTotalX)*Config.gridUnit;
			square.y = HIDE_OFFSET;
			filterCovers.addChild(square);
		}

		// DEBUG
		var wedgeGraphicCoords = [ 
			0, 0, 
			Config.gridUnit, 0, 
			Config.gridUnit, Config.gridUnit*0.5,  
			Config.gridUnit*0.5, Config.gridUnit, 
			0, Config.gridUnit
		];

		// cursor in bird grid
		var cursor = new PIXI.Graphics();
		cursor.beginFill(0x00FFFF, 1.0);
		cursor.drawPolygon(wedgeGraphicCoords);
		cursor.endFill();
		cursor.blendMode = PIXI.BLEND_MODES.MULTIPLY;
		birdGrid.cursor = cursor;

		// cursor snapped in bird grid
		var cursorSnapped = new PIXI.Graphics();
		cursorSnapped.beginFill(0xFF00FF, 1.0);
		cursorSnapped.drawPolygon(wedgeGraphicCoords);
		cursorSnapped.endFill();
		cursorSnapped.blendMode = PIXI.BLEND_MODES.MULTIPLY;
		birdGrid.cursorSnapped = cursorSnapped;

		if(Config.isDebugEnabled) {
			birdGrid.addChild(cursor);
			birdGrid.addChild(cursorSnapped);
		}

		window.addEventListener("resize", function(){
			this.resize();
		}.bind(scope));

		this.animate();
		this.dispatchEvent("ON_LOADED");
	};

	this.draw = function() {
		renderer.render(stage);
	};

	this.createListeners = function (){

		var curr = new PIXI.Point();
		var prev = new PIXI.Point();
		var speed = new PIXI.Point();
		var acceleration = new PIXI.Point();
		var direction = new PIXI.Point();
		var normal = new PIXI.Point();
		var increment = new PIXI.Point();
		var bounds = new PIXI.Point(0.5,0.5); // distance from center to edge

		var onDragStarted = function(event) {
			var touches = event.data.originalEvent.changedTouches;

			if(touches && touches.length===2) {
				var dx = touches[0].clientX - touches[1].clientX;
				var dy = touches[0].clientY - touches[1].clientY;
				pinchDistanceSquared = (dx*dx + dy*dy);
				pinchDistanceSquaredStart = pinchDistanceSquared;

				touchState = IS_ZOOMING;
				return;
			}

			scope.dispatchEvent("ON_DOWN");
			curr.x = event.data.global.x;
			curr.y = event.data.global.y;
			prev.x = curr.x; 
			prev.y = curr.y;
			touchState = IS_DRAGGING;
			onDragging(event);
			onButtonLoop();
			if(scope.birdData){
				scope.dispatchEvent("ON_REPLAY", [scope.birdData]);
			}
			speed.x = 0;
			speed.y = 0;
		}.bind(scope);

		var onDragging = function(event) {
			curr.x = event.data.global.x;
			curr.y = event.data.global.y;

			if(touchState === IS_ZOOMING) {
				var touches = event.data.originalEvent.changedTouches;
				var dx = touches[0].clientX - touches[1].clientX;
				var dy = touches[0].clientY - touches[1].clientY;
				pinchDistanceSquared = (dx*dx + dy*dy);
				this.zoom(
					(pinchDistanceSquaredStart < pinchDistanceSquared), 
					0.025);
				return;
			}

		}.bind(scope);

		var onDragStopped = function(event) {
			touchState = IS_SETTLING;
		}.bind(scope);

		/*
		 * Gets the position of dragger, 
		 * converts it to gridspace as defined by birdGrid.cursor,
		 * cursor position in converted to increments stored in cursorIndex
		 * index is calculated from cursorIndex
		*/
		var onButtonLoop = function(event) {
			if (touchState === IS_ZOOMING) {
				return;
			}

			if (touchState === IS_SETTLED) {
				return;
			}

			var scalar = birdGrid.scale.x;
			dragger.x = curr.x;
			dragger.y = curr.y;

			// panning related
			normal.x = (dragger.x / window.innerWidth)*2-1; // set number to be from -1 to 1
			normal.y = (dragger.y / window.innerHeight)*2-1; // set number to be from -1 to 1
			direction.x = (normal.x<0) ? -1 : 1;
			direction.y = (normal.y<0) ? -1 : 1;
			acceleration.x = (Math.abs(normal.x) < bounds.x) ? 0 : (0.3);
			acceleration.y = (Math.abs(normal.y) < bounds.y) ? 0 : (0.3);

			var isInRange = this.isInBounds(birdGrid.cursor.x,0,this.sprite.storedWidth) && this.isInBounds(birdGrid.cursor.y,0,this.sprite.storedHeight);

			if((touchState === IS_SETTLING) || !isInRange){
				acceleration.x = 0;
				acceleration.y = 0;
			}

			var friction = (touchState === IS_SETTLING) ? 0.8 : 0.95;
			speed.x += acceleration.x*direction.x;
			speed.y += acceleration.y*direction.y;
			speed.x *= friction;
			speed.y *= friction;
			speed.x = this.clamp(speed.x, -10,10); // max min speeds
			speed.y = this.clamp(speed.y, -10,10); // max min speeds

			if((touchState === IS_SETTLING) && Math.abs(speed.x)<0.1 && Math.abs(speed.y)<0.1){
				touchState = IS_SETTLED;
				speed.x = 0;
				speed.y = 0;
			}

			var isGridVisible = 
				birdGrid.x > 0 &&
				birdGrid.y > 0 &&
				(birdGrid.x + birdGrid.width) < window.innerWidth &&
				(birdGrid.y + birdGrid.height) < window.innerHeight;

			if(isGridVisible) {
				birdGrid.x += ((window.innerWidth - birdGrid.width)*0.5-birdGrid.x)*0.1;
				birdGrid.y += ((window.innerHeight - birdGrid.height)*0.5-birdGrid.y)*0.1;
			} else {
				birdGrid.x -= speed.x;
				birdGrid.y -= speed.y;
			}

			this.updateOuterBorder();

			if((touchState === IS_DRAGGING)) {
				birdGrid.cursor.x = 1/scalar * (dragger.x - birdGrid.x);
				birdGrid.cursor.y = 1/scalar * (dragger.y - birdGrid.y);
			}

			// do nearest check if filtered
			if(Data.filteredList.length!==0 && Data.filteredList.length<=5000) {

				var diameterSquared = 100000000;
				var smallestIndex = -1;
				var currentIndex = -1;
				var dx,dy,dsq;
				var posX, posY;
				for(  i=0; i<Data.filteredList.length; i++){
					currentIndex = Data.filteredList[i];
					posX = (currentIndex%Config.gridTotalX)*Config.gridUnit;
					posY = ((currentIndex/Config.gridTotalX)|0)*Config.gridUnit;

					dx = birdGrid.cursor.x - posX;
					dy = birdGrid.cursor.y - posY;

					dsq = dx*dx + dy*dy;
					if(dsq<diameterSquared){
						diameterSquared = dsq;
						smallestIndex = currentIndex;
					}
				}
				birdGrid.cursor.x = (smallestIndex%Config.gridTotalX)*Config.gridUnit;
				birdGrid.cursor.y = ((smallestIndex/Config.gridTotalX)|0)*Config.gridUnit;
			}

			cursorIndex.x = (birdGrid.cursor.x/Config.gridUnit) | 0;
			cursorIndex.y = (birdGrid.cursor.y/Config.gridUnit) | 0;
			cursorIndex.x = this.clamp(cursorIndex.x,0,Config.gridTotalX-1);
			cursorIndex.y = this.clamp(cursorIndex.y,0,Config.gridTotalY-1);

			this.updateDragPosition();

			var index = cursorIndex.y * Config.gridTotalX + cursorIndex.x;
			if(filterCovers.children[index].y===HIDE_OFFSET) {
				this.setBird(cursorIndex);
			}

			// loop
			requestAnimationFrame(function() {
				onButtonLoop();
			});
		}.bind(scope);

		var onPinchStarted = function(event) {
			var touches = event.data.originalEvent.changedTouches;
			var dx = touches[ 0 ].clientX - touches[ 1 ].clientX;
			var dy = touches[ 0 ].clientY - touches[ 1 ].clientY;
			var touchZoomDistance = Math.sqrt( dx * dx + dy * dy );
			var touchZoomDistancePrev = touchZoomDistance;

			var onPinchMoved = function(event) {
				var touches = event.data.originalEvent.changedTouches;
				var dx = touches[ 0 ].clientX - touches[ 1 ].clientX;
				var dy = touches[ 0 ].clientY - touches[ 1 ].clientY;
				touchZoomDistancePrev = touchZoomDistancePrev;
				var touchZoomDistancePrev = Math.sqrt( dx * dx + dy * dy );
				this.zoom(touchZoomDistancePrev>touchZoomDistance,0.025);

				event.stopPropagation();
				event.preventDefault();
			}.bind(scope);

			var onPinchEnded = function(event) {
				base.mousedown = onDragStarted;
				base.touchstart = onTouchStarted;
				base.touchmove = onDragging;
				base.touchend = onDragStopped;
				base.touchendoutside = onDragStopped;

			}.bind(scope);

			base.mousedown = null;
			base.touchstart = null;
			base.touchmove = onPinchMoved;
			base.touchend = onPinchEnded;
			base.touchendoutside = onPinchEnded;

		}.bind(scope);

		var onTouchStarted = function(event) {
			var touches = event.data.originalEvent.changedTouches;

			switch ( touches.length ) {
				case 1:
					touchState = IS_DRAGGING;
					onDragStarted(event);
					break;
				case 2:
					touchState = IS_ZOOMING;
					onPinchStarted(event);
					break;

				default:
			}
		}.bind(scope);

		// add events to grid
		base.interactive = true;
		base.buttonMode = true;

		base.mousedown = onDragStarted;
		base.mousemove = onDragging;
		base.mouseup = onDragStopped;
		base.mouseupoutside = onDragStopped;

		base.touchstart = onTouchStarted;
		base.touchmove = onDragging;
		base.touchend = onDragStopped;
		base.touchendoutside = onDragStopped;

		// add keyboard events
		document.body.addEventListener("keydown", function(event){
			if(document.activeElement === document.body.getElementsByTagName('input')[0]){
				return;
			}
			var x, y;
			normal.x = (dragger.container.x / window.innerWidth)*2-1; // set number to be from -1 to 1
			normal.y = (dragger.container.y / window.innerHeight)*2-1; // set number to be from -1 to 1
			increment.x = (Config.gridUnit*birdGrid.scale.x);
			increment.y = (Config.gridUnit*birdGrid.scale.y);
			switch(event.keyCode) {
				case 38: // UP
					birdGrid.y = (normal.y < -bounds.y) ? (birdGrid.y + increment.y) : (birdGrid.y);
					cursorIndex.y = this.clamp(--cursorIndex.y, 0, Config.gridTotalY-1);
					this.updateOuterBorder();
					this.setBird(cursorIndex);
					break;
				case 40: // DOWN
					birdGrid.y = (normal.y > bounds.y) ? (birdGrid.y - increment.y) : (birdGrid.y);
					cursorIndex.y = this.clamp(++cursorIndex.y, 0, Config.gridTotalY-1);
					this.updateOuterBorder();
					this.setBird(cursorIndex);
					break;
				case 37: // LEFT
					birdGrid.x = (normal.x < -bounds.x) ? (birdGrid.x + increment.x) : (birdGrid.x);
					cursorIndex.x = this.clamp(--cursorIndex.x, 0, Config.gridTotalX-1);
					this.updateOuterBorder();
					this.setBird(cursorIndex);
					break;
				case 39: // RIGHT
					birdGrid.x = (normal.x > bounds.x) ? (birdGrid.x - increment.x) : (birdGrid.x);
					cursorIndex.x = this.clamp(++cursorIndex.x, 0, Config.gridTotalX-1);
					this.updateOuterBorder();
					this.setBird(cursorIndex);
					break;
				case 32: // SPACEBAR
					this.dispatchEvent("ON_REPLAY", [this.birdData]);
					break;
				default:
			}
		}.bind(scope));
	};

	this.updateDragPosition = function() {
		var scalar = birdGrid.scale.x;
		var xPos = birdGrid.x;
		var yPos = birdGrid.y;
		xPos += (birdGrid.cursorSnapped.x )*scalar;
		yPos += (birdGrid.cursorSnapped.y )*scalar;
		xPos += 16*scalar;
		yPos += 16*scalar;

		dragger.container.x = xPos;
		dragger.container.y = yPos;
		this.dispatchEvent("ON_POSITION_UPDATED", [dragger.container]);

	};

	this.createTrail = function() {
		var scalar = birdGrid.scale.x;
		var trail;
		trail = new PIXI.Graphics();
		trail.lineStyle(2/scalar, Config.colorHighlight);
		trail.drawRect(-32*0.5, -32*0.5, 32, 32);
		trail.x = (birdGrid.cursorSnapped.x );
		trail.y = (birdGrid.cursorSnapped.y );
		trail.x += 16;
		trail.y += 16;

		birdGrid.addChild(trail);

		var isComplete;
		var state = { scalar: 1, alpha:1 };
			tween = new TWEEN.Tween(state)
				.to({ scalar: 1, alpha:0 }, 1000)
				.easing(TWEEN.Easing.Quadratic.InOut)
				.onUpdate(function() {

					trail.scale.x = state.scalar;
					trail.scale.y = state.scalar;
					trail.alpha = state.alpha;
				})
				.onComplete(function(){
					birdGrid.removeChild(trail);
				})
				.start();

	};
	this.setBird = function(bird) {
		if(!birdGrid) return;
		var scalar = birdGrid.scale.x;
		var index = bird.y * Config.gridTotalX + bird.x;
		var soundOffsetIndex = (index+Config.gridTotalX)%(Config.gridTotalX*Config.gridTotalY);
		var selectedBirdData = Data.getBird(index);
		scope.birdData = Data.getBird(soundOffsetIndex);

		// visuals
		birdGrid.cursorSnapped.x = scope.snapToGrid( bird.x*Config.gridUnit, Config.gridUnit );
		birdGrid.cursorSnapped.y = scope.snapToGrid( bird.y*Config.gridUnit, Config.gridUnit );

		scope.updateDragPosition();

		if(selectedBirdData.index != selectedIndex) {
			selectedIndex = selectedBirdData.index;
			dragger.setSprite(selectedBirdData);
			scope.createTrail();
			scope.dispatchEvent("ON_CHANGED", [scope.birdData, dragger.container]);
		} else if(	touchState === IS_ZOOMING) {
			scope.dispatchEvent("ON_ZOOMED", [dragger.container]);
		}

	};

	this.getGraphCoordinates = (function () {
		var ctx = {
			global: { x: 0, y: 0}
		};
		return function (x, y) {
			ctx.global.x = x; 
			ctx.global.y = y;
			return PIXI.interaction.InteractionData.prototype.getLocalPosition.call(ctx, birdGrid);
		};
	}());

	this.zoom = function (isZoomIn, zoomStrength) {
		if(!this.isZoomEnabled) {
			return;
		}
		var windowDistance = window.innerWidth;
		var spriteDistance = scope.sprite.storedWidth;
		if(window.innerHeight<window.innerWidth){
			windowDistance = window.innerHeight;
			spriteDistance = scope.sprite.storedHeight;
		}

		if(!isZoomIn && birdGrid.scale.x <= (windowDistance-margin*2)/spriteDistance) {
			birdGrid.x += ((window.innerWidth - birdGrid.width)*0.5-birdGrid.x)*0.2;
			birdGrid.y += ((window.innerHeight - birdGrid.height)*0.5-birdGrid.y)*0.2;
			scope.updateOuterBorder();
			scope.setBird(cursorIndex);
			return;
		}

		// if at max zoom level
		if(isZoomIn && birdGrid.scale.x*Config.gridUnit >= dragger.size) {
			birdGrid.scale.x = dragger.size/Config.gridUnit;
			birdGrid.scale.y = dragger.size/Config.gridUnit;
			scope.dispatchEvent("ON_MAX_MIN_ZOOM");
		} else {
			direction = isZoomIn ? 1 : -1;
			var factor = (1 + direction * zoomStrength);
			birdGrid.scale.x *= factor;
			birdGrid.scale.y *= factor;
		}

		// Pulled from ngraph - Pixi js examples
		// https://github.com/anvaka/ngraph/tree/master/examples/pixi.js/03%20-%20Zoom%20And%20Pan
		var beforeTransform = scope.getGraphCoordinates(dragger.container.x, dragger.container.y);
		birdGrid.updateTransform();
		var afterTransform = scope.getGraphCoordinates(dragger.container.x, dragger.container.y);

		birdGrid.position.x += (afterTransform.x - beforeTransform.x) * birdGrid.scale.x;
		birdGrid.position.y += (afterTransform.y - beforeTransform.y) * birdGrid.scale.y;
		birdGrid.updateTransform();

		var scalar = birdGrid.scale.x;
		var xPos = birdGrid.x;
		var yPos = birdGrid.y;
		xPos += (birdGrid.cursorSnapped.x )*scalar;
		yPos += (birdGrid.cursorSnapped.y )*scalar;
		xPos += 16*scalar;
		yPos += 16*scalar;

		dragger.container.x = xPos;
		dragger.container.y = yPos;

		scope.updateOuterBorder();

		scope.dispatchEvent("ON_ZOOMED", [dragger.container]);
	};

	this.filter = function(){

		var totalSprites = Data.getTotalPoints();
		Data.filteredList = [];
		for (var i = 0; i < totalSprites; i++) {
			var soundOffsetIndex = (i+Config.gridTotalX)%(Config.gridTotalX*Config.gridTotalY);
			if(Data.filterStates[Data.getBirdIndex(soundOffsetIndex)] === Config.filterHidden){
				filterCovers.children[i].y = ((i/Config.gridTotalX)|0)*Config.gridUnit;
			} else {
				filterCovers.children[i].y = HIDE_OFFSET;
				Data.filteredList.push(i);
			}
		}

	};

	this.updateGridColor = function(color) {
		birdGrid.field.visible = (color!==Config.colorLight);
		this.updateOuterBorder();
	};

	this.updateOuterBorder = function () {
		birdGridOutline.clear();
		birdGridOutline.lineStyle(20, renderer.backgroundColor);
		birdGridOutline.drawRect(
			(birdGrid.x-8)|0,
			(birdGrid.y-8)|0,
			(birdGrid.width+16)|0,
			(birdGrid.height+16)|0
			);

		birdGridOutline.lineStyle(1, 0xCCCCCC);
		birdGridOutline.drawRect(
			(birdGrid.x-10)|0,
			(birdGrid.y-10)|0,
			(birdGrid.width+20)|0,
			(birdGrid.height+20)|0
			);
	};

	this.highlight = function() {
		dragger.highlight();
	};

	this.disableZoom = function() {
		this.isZoomEnabled = false;
	};

	this.enableZoom = function() {
		this.isZoomEnabled = true;
	};
	this.show = function(){
		dragger.container.visible = true;
	};
	this.hide = function(){
		dragger.container.visible = false;
	};
	this.setDefault = function(){
		cursorIndex.x = 60;
		cursorIndex.y = 56;
		scope.setBird(cursorIndex);
	};

	// ------------------------------------------------------------
	// EVENTS
	// ------------------------------------------------------------
	this.resize = function(){
		renderer.resize(window.innerWidth, window.innerHeight);
	};
	
	// ------------------------------------------------------------
	// UTILITY
	// ------------------------------------------------------------

	this.snapToGrid = function(num, gridSize) {
	    return gridSize * Math.round(num / gridSize);
	};

	this.animate = function() {
		this.draw();

		if(Config.isStatsEnabled) {
			stats.update();
		}
		requestAnimationFrame(function() {
			scope.animate();
		});
	};

	this.clamp = function(value, min, max) {
		return Math.min(Math.max(value, min), max);
	};

	this.isInBounds = function(value, min, max) {
		return value >= min && value <= max;
	};
	function tweenAnimate(time) {
		requestAnimationFrame(tweenAnimate);
		TWEEN.update(time);
	}
};

Grid.prototype = new BoilerPlate();
Grid.prototype.constructor = Grid;