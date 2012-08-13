/**
 * jquery.processing.js v3.0.0
 * (C) 2012 shin <s2pch.luck at gmail.com>
 * MIT License
 */
(function($) {

	"use strict";

	// events in processing
	var EVENTS = ["setup", "draw",
				  "mouseClicked", "mouseDragged", "mouseMoved",
				  "mouseOut", "mouseOver", "mousePressed", "mouseReleased",
				  "keyPressed", "keyReleased"];
	
	/**
	 * simple wrapper for processing.js
	 */
	var processing = function(targets, sketch) {
		return targets.each(function() {
			// "this" is <canvas>
			$(this).data("jquery-processing",
				new Processing(this, function(p) {
					$.each(EVENTS, function(k, v) {
						if (sketch[v])
							p[v] = function() { sketch[v](p); };
					});
				})
			);
		});
	};
	
	/**
	 * with simple scene management system
	 */
	var processing_ex = function(targets, start, config_) {
		// make configuration
		var config = $.extend(true, {
			// mapping of event function name
			eventMapping: (function() {
				var r = {};
				for (var i = 0; i < EVENTS.length; ++i)
					r[EVENTS[i]] = EVENTS[i];
				return r; // { setup: "setup", draw: "draw", ... }
			})()
		}, config_);
		
		// create scene driven sketch
		var sketch = {};
		var current = start;
		var eventMapping = config.eventMapping;
		
		$.each(EVENTS, function(k, v) {
			sketch[v] = function(p) {
				var currentSketch, eventFunc, nextSketch, setupFunc;
				var next, next2;
				eventFunc = current[eventMapping[v]];
				if (eventFunc) {
					next = eventFunc.call(current, p);
					if (next) {
						do {
							next2 = null;
							setupFunc = next[eventMapping["setup"]];
							if (setupFunc) {
								next2 = setupFunc.call(next, p);
								if (next2)
									next = next2;
							}
						} while (next2);
						current = next;
					}
				}
			};
		});
		
		return processing(targets, sketch);
	};

	//---------------------------------------------

	/**
	 * KeyInput Management
	 * This is used for detection of multiple keys
	 */
	var Key = function() {
		this.key = {};
	};
	Key.prototype = {
		constructor: Key,
		press: function(k) {
			this.key[this.getCode(k)] = true;
		},
		release: function(k) {
			this.key[this.getCode(k)] = false;
		},
		isPressed: function(k) {
			return this.key[this.getCode(k)];
		},
		getCode: function(k) {
			if (typeof(k) == "string")
				k = k.toUpperCase().charCodeAt();
			return k;
		}
	};

	var key = new Key();

	/**
	 * Base Scene
	 * hacking processing
	 */
	var Scene = function() {};
	Scene.prototype = {
		constructor: Scene, // for CoffeeScript
		/** @private */
		__draw: function(p) {
			return this.update(p) || this.draw(p);
		},
		/** @private */
		__keyPressed: function(p) {
			key.press(p.keyCode);
			return this.keyPressed(p);
		},
		/** @private */
		__keyReleased: function(p) {
			key.release(p.keyCode);
			return this.keyReleased(p);
		},
		update: function(p) {},
		draw: function(p) {},
		keyPressed: function(p) {},
		keyReleased: function(p) {}
	};

	$.processing = {
		framework: { Scene: Scene, key: key }
	};

	//-----------------------------------------------

	/**
	 * jQuery plugin for processing.js
	 */
	$.fn.processing = function() {
		if (arguments.length < 1) {
			console.error("$().processing need more than one argument.");
			return null;
		}
		var op = arguments[0];
		if (typeof op !== "string")
			return processing(this, arguments[0]);
		if (op === "simple")
			return processing(this, arguments[1]);
		if (op === "scene")
			return processing_ex(this, arguments[1], arguments[2]);
		if (op === "framework") {
			var config = $.extend(true, arguments[2], {
				eventMapping: {
					draw: "__draw",
					keyPressed: "__keyPressed",
					keyReleased: "__keyReleased"
				}
			});
			return processing_ex(this, arguments[1], config);
		}
		console.error("invalid operation");
		return null;
	};

})(jQuery);


