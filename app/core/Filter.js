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
var filterCSS = require("../../style/filter.scss");
var Config = require("./Config.js");
var Filter = module.exports = function() {

	var scope = this;
	BoilerPlate.call(this);
	this.name = "Filter";

	var isTyping = false;
	var filter = document.getElementById("filter");
	var filterInput = filter.getElementsByTagName('input')[0];
	var filterInputWrapper = filter.getElementsByClassName('input-wrapper')[0];
	var clearButton = filter.getElementsByClassName("clearButton")[0];
	var searchButton = filter.getElementsByClassName("searchButton")[0];
	var tags = filter.getElementsByClassName('tags')[0];
	this.isEmpty = true;

	var onKeyPress = function(event) {
		if (event.keyCode == 13) {
			scope.dispatchEvent("ON_UPDATE",[filterInput.value]);
			scope.dispatchEvent("ON_FOCUS_OUT",null);
			tags.classList.remove("show");
			filter.classList.remove("expand");
			scope.unfocus();
			event.stopPropagation();
			event.preventDefault();
		}
	}.bind(scope);

	var onFilter = function(event) {
		if(isTyping===false) {
			setTimeout(function(){
				if(filterInput.value === "") {
					this.isEmpty = true;
					this.dispatchEvent("ON_CLEAR");
				} else {
					// typing
					this.isEmpty = false;
					this.dispatchEvent("ON_UPDATE",[filterInput.value]);
					clearButton.classList.add("show");
					clearButton.classList.add("expand");
				}
				isTyping = false;
			}.bind(scope), 500);
		}
		isTyping = true;
	}.bind(scope);

	var onClear = function(event) {
		filterInput.value = "";
		clearButton.classList.remove("show");
		clearButton.classList.remove("expand");
		this.isEmpty = true;
		this.dispatchEvent("ON_CLEAR");

		event.stopPropagation();
		event.preventDefault();
	}.bind(scope);

	var onFocusIn = function(event) {
		filterInput.focus();
		filter.removeEventListener('click', onFocusIn, false);
		document.addEventListener('click', onFocusOut, false);
		tags.classList.add("show");
		filter.classList.add("expand");
		clearButton.classList.add("expand");
		this.dispatchEvent("ON_FOCUS_IN",[filterInput.value]);
		event.stopPropagation();
		event.preventDefault();
	}.bind(scope);

	var onFocusOut = function(event) {
		document.removeEventListener('click', onFocusOut, false);
		filter.addEventListener('click', onFocusIn, false);
		tags.classList.remove("show");
		filter.classList.remove("expand");
		scope.dispatchEvent("ON_FOCUS_OUT",[filterInput.value]);
		event.stopPropagation();
		event.preventDefault();
	}.bind(scope);

	filter.addEventListener('click', onFocusIn, false);
	filter.addEventListener('input', onFilter, false);
	filter.addEventListener('keypress', onKeyPress, false);
	clearButton.addEventListener('click', onClear, false);
	searchButton.addEventListener('click', onFilter, false);

	// input field added though Filter.js to prevent visual bugs
	var input = document.createElement("input");
	input.type = "text";

	this.contract = function() {
		clearButton.classList.remove("expand");
	};

	this.unfocus = function() {
		filterInput.blur();
	};
	
	this.clearAutoSuggest = function() {
		while (tags.firstChild) {
			tags.removeChild(tags.firstChild);
		}
	};

	this.updateAutoSuggest = function(suggestions) {
		this.clearAutoSuggest();

		var createButton = function(text) {
			var btn = document.createElement("BUTTON");
			btn.className = 'tagButton'; // SEE BIRDS ontouchmove
			var isSelectedWord = Config.emptySuggestions.indexOf(text) >= 0;

			var t = document.createTextNode(text);
			var onTagClicked = function(event){
				text = text.trim();
				filterInput.value = text;

				clearButton.classList.add("show");
				clearButton.classList.remove("expand");
				scope.isEmpty = false;
				tags.classList.remove("show");
				filter.classList.remove("expand");
				scope.dispatchEvent("ON_SUGGESTION_CLICKED",[text]);
				event.stopPropagation();
			};
			btn.addEventListener('click', onTagClicked, false);
			
			btn.appendChild(t);
			tags.appendChild(btn);
		}.bind(scope);

		var total = suggestions.length;
		for(var i=0; i<total; i++){
			createButton(suggestions[i]);
		}

	}.bind(scope);
};

Filter.prototype = new BoilerPlate();
Filter.prototype.constructor = Filter;