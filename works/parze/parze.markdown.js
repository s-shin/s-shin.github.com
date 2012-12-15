/**
 * parze.markdown.js v0.0.1
 * Copyright (C) 2011-2012 shin <s2pch.luck@gmail.com>
 * Apache License 2.0
 */
(function() {
	
	// http://daringfireball.net/projects/markdown/syntax
	// http://github-preview.herokuapp.com/
	// http://blog.2310.net/archives/6
	
	var p = new Parze();
	Parze.Plugin.register("markdown", p);
	
	var bqLevel = 0;

	p.registerBlock({
		list: {
			re: /^([\t ]{0,3})(\*|-|\+|\d+\.)[\t ]+(.*)$/,
			parse: function(handler) {
				var t = handler.get();
				var m = t.match;
				//console.log(m);
				return t.str;
			}
		},
		head_setext: {
			re: /^(=|-)+$/
		},
		head_atx: {
			re: /^(#{1,6})(.*)[^#]#*$/,
			parse: function(handler) {
				var t = handler.get();
				var m = t.match;
				return Parze.Util.format("<h{0}>{1}</h{0}>", m[1].length, m[2]);
			}
		},
		blank: {
			re: /^$/
		},
		blockquote: {
			re: "^>[ ]?(.*)$",
			parse: function(handler) {
				var t = handler.get();
				var m = t.match;
				
			}
		},
		paragraph: {
			re: /^.*$/,
			parse: function(handler) {
				var t = handler.get();
				// Setextスタイルの見出しかチェック
				var tt = handler.getNext();
				if (tt && tt.token == "head_setext") {
					return Parze.Util.format(
						"<h{0}>{1}</h{0}>",
						tt.match[1] == "=" ? 1 : 2,
						t.str);
				}

				// 最終行ならすぐ終了
				if (!tt) {
					handler.prev();
					return "<p>" + t.str + "</p>";
				}
				
				var r = "<p>";
				do {
					if (t.str.search(/^.*[ ]{2}$/) != -1
						// 改行
						&& tt.token == "paragraph") {
						r += t.str.substr(0, t.str.length - 2);
						r += " <br />"
					} else {
						// 改行コードは加える
						r += t.str + "\n";
					}
					if (tt.token != "paragraph")
						break;
				} while (t = tt, tt = handler.getNext());
				handler.prev();

				return r + "</p>";
			}
		}
	});
	
	p.registerInline({
		code: {
			re: /(`+)([^`].*[^`])(`+)/,
			parse: function(m) {
				var num = m[1].length;
				var mm = m[2].match(new RegExp(
					"((`{0," + (num-1) + "}[^`]|[^`])*)`{" + num + "}(.*)"));
				console.log(mm);
				//var t = m[1].split("`").join("&#x0060;");
				//return "<code>" + t + "</code>";
				return "";
			}
		},
		/*
		code1: {
			re: /`([^`]*)`/,
			parse: function(m) {
				return "<code>" + m[1] + "</code>";
			}
		}
		*/
	});

	p.registerHook({
		beforeParse: function(str) {
			return ""; // do nothing
		},
		beforeParseLine: function(str) {
			return str;
		}
	});

})();

