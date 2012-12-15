
$(function() {
	var HatenaPlus = function(src) {
		return Parze.Plugin.load("hatena").parse(src);
	}
	// 記法処理
	var convert = function(srcHtml, dst) {
		dst.html(HatenaPlus(srcHtml));
		//dst.text(HatenaPlus(srcHtml));
		var codes = dst.find("code[class]");
		codes.toggleClass("prettyprint");
		prettyPrint();
		codes.toggleClass("prettyprint");
	}
	// チートシート
	var cs = $("body");
	$.get("cheat-sheet.txt", function(data) {
		convert(data, cs);
		var d = cs.find("> section > div");
		d.children("section").each(function() {
			var t = $(this);
			var h = t.children("h4");
			var c = t.children("div");
			var input = c.children("pre:first");
			var output = c.children("div");
			convert(input.text(), output);
		});
	}, "text");
});


