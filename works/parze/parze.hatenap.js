/**
 * parze.hatenap.js v1.0.0
 * Copyright (C) 2011-2012 shin <s2pch.luck@gmail.com>
 * Apache License 2.0
 */
(function(Parze) {

	var baseHeadLevel = 3;
	var headLevel = 0;

	var closeSection = function(count) {
		r = "";
		for (var i = 0; i < count; ++i) {
			//if (i < count)
			//  r += "</div>";
			r += "</div></section>";
		}
		return r;
	}
	
	var HatenaBlock = {
		/**
		 * 見出し記法: "*...", "**...", "***...", ...
		 * 直後のスペース1つは無視する
		 */
		head: {
			re: /^(\*+)[ ]?(.*)$/,
			parse: function(handler) {
				var t = handler.get();
				var m = t.match;
				var hlevel = m[1].length + baseHeadLevel - 1;
				if (hlevel > 6)
					hlevel = 6;
				var r = "";
				// for (var i = 0, dh = headLevel - hlevel; i <= dh; ++i) {
				// 	if (i < dh)
				// 		r += "</div>";
				// 	r += "</section>";
				// }
				r += closeSection(headLevel - hlevel + 1);
				headLevel = hlevel;
				r += "<section>";
				r += Parze.Util.format("<h{0}>{1}</h{0}>", hlevel, m[2]);
				r += "<div>";
				return r;
			}
		},
		/**
		 * 下書き記法: "<!-- ... -->"
		 */
		draft: {
			re: /^<!--$/,
			parse: function(handler) {
				var t;
				while (t = handler.getNext()) {
					if (t.token == "draft_end")
						break;
				}
				return "";
			}
		},
		draft_end: {
			re: /^-->$/
		},
		/**
		 * リスト記法: "+..., "-...", "+-...", ...
		 * 直後のスペース1つは無視する
		 */
		list: {
			re: /^([-+]+)[ ]?(.*)$/,
			parse: function(handler) {
				var t = handler.get();
				var r = "";
				var list = [];
				do {
					if (t.token != "list")
						break;
					var m = t.match;
					var level = m[1].length;
					var tag = (m[1][level-1] == "-") ? "ul" : "ol";
					if (list.length == level) {
						r += "</li><li>" + m[2];
					} else if (list.length < level) {
						// 階層を増やす
						list.push(tag);
						r += Parze.Util.format("<{0}><li>{1}", tag, m[2]);
					} else {
						// 階層が減る分だけ閉じる
						for (var i = 0; i < list.length - level; ++i)
							r += Parze.Util.format("</li></{0}>", list.pop());
						// もう一度解析
						handler.prev();
						continue;
					}
				} while (t = handler.getNext());
				// 階層が減る分だけ閉じる
				while (list.length != 0)
					r += Parze.Util.format("</li></{0}>", list.pop());
				handler.prev(); // 最終行に戻す
				return r;
			}
		},
		/**
		 * 定義リスト記法: ":dt:dd"
		 */
		def: {
			re: /^:([^:]*):(.*)$/,
			parse: function(handler) {
				var t = handler.get();
				var r = "<dl>";
				do {
					if (t.token != "def")
						break;
					var m = t.match;
					r += Parze.Util.format(
						"<dt>{0}</dt><dd>{1}</dd>", m[1], m[2]);
				} while (t = handler.getNext());
				r += "</dl>";
				handler.prev();
				return r;
			}
		},
		/**
		 * スーパーpre記法: ">|| ... ||<", ">|lang| ... ||<"
		 */
		spre: {
			re: /^>\|(.*)\|$/,
			inline: false,
			parse: function(handler) {
				var t = handler.get();
				var m = t.match;
				var r = "";
				if (m[1].length > 1) {
					if (m[1].search(/^[ ]*$/) >= 0)
						r = "<pre><code>";
					else
						r = "<pre><code class='language-" + m[1] + "'>";
				} else {
					r = "<pre>";
				}
				while (t = handler.getNext()) {
					if (t.token == "spre_end")
						break;
					var tt = t.str;
					// スーパーpre内でpre閉じの文字列を使いたい場合には
					// 末尾にスペースを1つ以上追加することにしている。
					// スペースが1つの時は、それを消すことにする。
					// これにより、変換後にさらにはてな記法を適用することが
					// 可能となる。（ニッチなシチュエーションだけれども）
					if (tt == "||< ")
						tt = "||<";
					r += Parze.Util.htmlspecialchars(tt) + "\n";
				}
				if (m[1].length > 1)
					r += "</code>";
				r += "</pre>"
				return r;
			}
		},
		spre_end: {
			re: /^\|\|<$/
		},
		pre: {
			re: /^>\|$/,
			parse: function(handler) {
				var t, r = "<pre>";
				while (t = handler.getNext()) {
					if (t.token == "pre_end")
						break;
					if (t.parse)
						r += t.parse(handler);
				}
				return r + "</pre>";
			}
		},
		pre_end: {
			re: /^\|<$/
		},
		bq: {
			re: /^>(.*)>$/,
			parse: function(handler) {
				var t = handler.get();
				var m = t.match;
				var r = null;
				if (m[1].length > 1) {
					// 単純にcite属性に入れるだけにする。
					// cite要素はユーザが自分で書くべき。
					r = "<blockquote cite='" + m[1] + "'>";
				} else {
					r = "<blockquote>";
				}
				while (t = handler.getNext()) {
					if (t.token == "bq_end")
						break;
					if (t.parse)
						r += t.parse(handler);
				}
				r += "</blockquote>";
				return r;
			}
		},
		bq_end: {
			re: /^<<$/
		},
		table: {
			re: /^\|(.*)\|$/,
			parse: function(handler) {
				var t = handler.get();
				var r = "<table>";
				do {
					if (t.token != "table")
						break;
					var m = t.match;
					var tds = m[1].split("|");
					r += "<tr>";
					for (i = 0; i < tds.length; ++i) {
						if (tds[i] == "")
							continue;
						var tag = "td";
						var val = tds[i];
						if (tds[i][0] == "*") {
							tag = "th";
							val = val.substr(1, val.length - 1);
						}
						r += Parze.Util.format("<{0}>{1}</{0}>", tag, val);
					}
					r += "</tr>";
				} while (t = handler.getNext());
				r += "</table>";
				return r;
			}
		},
		note: {
			re: /^>#$/,
			parse: function(handler) {
				var r = "<aside>";
				var t;
				while (t = handler.getNext()) {
					if (t.token == "note_end")
						break;
					if (t.parse)
						r += t.parse(handler);
				}
				r +=" </aside>";
				return r;
			}
		},
		note_end: {
			re: /^#<$/
		},
		tag: {
			re: /^[ \t]*(<.*>)$/,
			parse: function(handler) {
				return handler.get().str;
			}
		},
		blank: {
			re: /^[ ¥t]*$/
		},
		normal: {
			re: /^.*$/,
			parse: function(handler) {
				var t = handler.get();
				var r = "<p>" + t.str;
				while (t = handler.getNext()) {
					if (t.token != "normal")
						break;
					r += "<br />" + t.str;
				}
				r += "</p>";
				handler.prev();
				return r;
			}
		}
	};

	var id = 0;
	var footnote = [];
	var getFootnote = function() {
		if (footnote.length == 0)
			return "";
		var r = "<div class='footnote'>";
		for (var i = 0; i < footnote.length; ++i) {
			r += "<p class='footnote'>";
			r += Parze.Util.format(
				"<a name='f{0}-{1}' href='#fn{0}-{1}'>*{1}</a>：", id, i+1);
			r += footnote[i];
			r += "</p>";
		}
		r += "</div>";
		return r;
	}

	var HatenaInline = {
		link: {
			re: /\[(https?:\/\/|ftp:\/\/|mailto:|url:)([-_.!~*'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)(:title(=(.*))?)?\]/,
			parse: function(m) {
				// urlは自動で特殊文字処理する
				var url = Parze.Util.htmlspecialchars(m[2]);
				if (m[1] != "mailto:" && m[1] != "url:")
					url = m[1] + url;
				var val = url;
				if (m[5]) {
					val = m[5];
				} else {
					var mm = m[2].match(/^(.*):title(=(\w*))?$/);
					if (mm)
						val = mm[3];
				}
				return Parze.Util.format(
					"<a href='{0}'>{1}</a>", url, val);
			}
		},
		code: {
			re: /``(([^`]`|[^`])*)`(\w*)`/,
			parse: function(m) {
				return Parze.Util.format(
					"<code{1}>{0}</code>",
					Parze.Util.htmlspecialchars(m[1]),
					"class='language-" + m[3] + "'");
			}
		},
		footnote: {
			re: /\(\((([^)]\)|[^)])*)\)\)/,
			parse: function(m) {
				footnote.push(m[1]);
				return Parze.Util.format(
					"<span class='footnote'><a name='fn{0}-{1}' href='#f{0}-{1}' title='{2}'>*{1}</a></span>",
					id, footnote.length, m[1]);
			}
		}
	};

	var HatenaHook = {
		setup: function(opts) {
			var defopts = {
				baseHeadLevel: 3
			};
			if (!opts)
				opts = {};
			for (var k in defopts)
				if (!opts[k])
					opts[k] = defopts[k];
			baseHeadLevel = opts.baseHeadLevel;
			headLevel = 0;
			footnote = [];
			id++;
		},
		afterParse: function(str) {
			console.log(headLevel);
			return str + getFootnote();
		}
	};
	
	var p = new Parze();
	p.registerBlock(HatenaBlock);
	p.registerInline(HatenaInline);
	p.registerHook(HatenaHook);
	Parze.Plugin.register("hatenap", p);
	Parze.Plugin.register("hatena+", p);

})((typeof exports !== 'undefined' ? require('./parze.js') : window).Parze);





