
$(function() {

	var init = function(syntax, file) {
		var src = $("<div>");
		var txt = $("<textarea>");
		src.append(txt);
		var dst = $("<div class='result'>");

		var p = Parze.Plugin.load(syntax);
		txt.keyup(function(e) {
			// 矢印は無視
			switch (e.keyCode) {
			case 37: case 38: case 39: case 40:
				return;
			}
			dst.html(p.parse(txt.val()));
		});

		if (file) {
			$.ajax(file, {
				async: false,
				data: "text",
				success: function(r) {
					txt.val(r);
				}
			});
			txt.keyup();
		}
		
		return { src: src, dst: dst };
	}

	var change = function(syntax) {
		var s = Syntax[syntax];
		if (s.btn.hasClass("active"))
			return;
		var c = $("#content");
		c.empty().append(s.dom.src, s.dom.dst);
		for (var k in Syntax)
			Syntax[k].btn.removeClass("active");
		s.btn.addClass("active");
	}

	var Syntax = (function() {
		var list = $("#syntaxlist a").each(function() {
			var t = $(this).click(function() {
				change(t.data("syntax"));
			});
		});
		var Syntax = {
			hatenap: {
				btn: list.eq(0)
			}
			/*
			markdown: {
				btn: list.eq(1)
			},
			textile: {
				btn: list.eq(2)
			}
			*/
		}
		for (var k in Syntax)
			Syntax[k].dom = init(k, k + "-test.txt");
		return Syntax;
	})();

	Syntax.hatenap.btn.click();
	//Syntax.markdown.btn.click();
	//Syntax.textile.btn.click();
});



