// (C) 2012 shin

$(function() {

	var win = $(window);
	var doc = $(document);
	var content = $("#content");
	
	var numX = 50; // num
	var separatorWidth = 1; // px

	// letter width
	var LETTER_WIDTH = content.find("span").width();

	var changeContentWidth = function(numX
	content.width(content.find("span").width() * numX + separatorWidth);
	content.empty();

	var scrollable = true;
	var stopped = false;
	var speed = 300; // ms

	var pi = new SpigotPi(function(v) { update(v); });

	var update = function(s) {
		var span, d;
		span = $("<span>").html(s).hide().fadeIn(speed, function() {
			// next step
			if (update.isFirst) {
				update.isFirst = false;
				update(".<br />");
			} else if (!stopped) {
				pi.step();
			}
		});
		content.append(span); // show
		// iroiro
		d = pi.digits();
		if (d > 1) {
			span.attr("data-digits", d);
			if (d % 50 == 0)
				span.addClass("d50");
			else if (d % 10 == 0)
				span.addClass("d10");
			// scroll to bottom if content is bottom
			// - doc.height() is whole content's height
			// - win.height() is showing region's height
			if (d % NUM_X == 0)
				scrollable = doc.height() <= win.height() + win.scrollTop();
			// scroll on showing second number in order to get new height
			if (d % NUM_X == 2 && scrollable)
				$.scrollTo(doc.height(), 500);
		}
	};
	update.isFirst = true;

	var start = function() { stopped = false; pi.step(); };
	var stop = function() { stopped = true; };

	var 




	start();
	
});
