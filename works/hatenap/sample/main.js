
$(function() {
	// 記法処理
	var convert = function(srcHtml, dst) {
		dst.html(HatenaPlus(srcHtml));
		//dst.text(HatenaPlus(srcHtml));
		var codes = dst.find("code[class]");
		codes.toggleClass("prettyprint");
		prettyPrint();
		codes.toggleClass("prettyprint");
	}
	// 自動変換処理
	var wnd = $(window);
	var src = $("#content > div:first textarea");
	var dst = $("#content > div:last");
	wnd.keyup(function() {
		convert(src.val(), dst);
	}).keyup();
	// チートシート
	var cs = $("header > .cheat-sheet");
	$.get("cheat-sheet.txt", function(data) {
		console.log(data);
		convert(data, cs);
		var d = cs.find("> section > div");
		d.children("section").each(function() {
			var t = $(this);
			var h = t.children("h4");
			var c = t.children("div").hide();
			h.click(function() {
				h.toggleClass("active");
				c.slideToggle("fast");
			});
			c.children("p:eq(2)").click(function() {
				h.click();
			});
			var input = c.children("pre:first");
			var output = c.children("div");
			convert(input.text(), output);
		});
	}, "text");

	// cheat sheet
	var content = $("#content");
	cs.css("height", content.height());
	wnd.resize(function() {
		cs.height(content.height());
	});
	var btns = $("header > ul > li > span");
	btns.filter(".help").click(function() {
		cs.css("height", content.height());
		cs.slideToggle();
	});
	// html code
	btns.filter(".code").click(function() {
		var data = "data:text/plain;charset=utf-8,"
			+ encodeURIComponent(dst.html());
		var wnd = window.open(data, "_blank");
	});
	
});


