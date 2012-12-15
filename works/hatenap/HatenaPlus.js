/* 
 * HatenaPlus.js v1.0.0
 * Copyright (C) 2011 shin <s2pch.luck@gmail.com>
 * Apache License 2.0
 * http://www.apache.org/licenses/LICENSE-2.0.html
 */
(function() {

	//-----------------------------------------
	// Utility
	//-----------------------------------------
	
	var Utility = {
		replaceAll: function(str, re, newstr) {
			return str.split(re).join(newstr);
		},
		format: function(str) {
			for (var i = 1, len = arguments.length; i < len; ++i)
				str = this.replaceAll(str, "{"+(i-1)+"}", arguments[i]);
			return str;
		},
		htmlspecialchars: function(str) {
			var pre = document.createElement("pre");
			pre.textContent = str;
			return pre.innerHTML;
		},
		extend: function(dst, src) {
			if (!src || !dst)
				return;
			for (var k in dst)
				if (k in src)
					dst[k] = src[k];
		}
	};
	
	//-----------------------------------------
	// HATENA_PLUS
	//-----------------------------------------

	var HATENA_PLUS = {
		TOKEN: {
			HEAD: 10,
			LIST: 20,
			DEF: 30,
			TABLE: 40,
			PRE: 50, PRE_END: 51,
			SPRE: 60, SPRE_END: 61,
			BQ: 70, BQ_END: 71,
			NORMAL: 80, BLANK: 81,
			NOTE: 90, NOTE_END: 91,
			TAG: 100,
			DRAFT: 101, DRAFT_END: 102
		}
	}
	
	//-----------------------------------------
	// HatenaPlus
	//-----------------------------------------
	var HatenaPlus = function() { this.initialize.apply(this, arguments); }
	HatenaPlus.prototype = {
		initialize: function() {
			this.version = "1.0.0";
			this.inline = new HatenaPlus.Inline();
			this.block = new HatenaPlus.Block(this.inline);
		},
		parse: function(str, opts) {
			this.inline.setup();
			return this.block.parse(str, opts) + this.inline.getFootnote();
		}
	}
	
	//-----------------------------------------
	// HatenaPlus.Block
	//-----------------------------------------
	
	HatenaPlus.Block = function() { this.initialize.apply(this, arguments); }
	HatenaPlus.Block.prototype = {
		initialize: function(inline) {
			this.inline = inline;
		},
		tokenize: function(lines) {
			var tokens = [];
			for (var i = 0; i < lines.length; ++i) {
				var line = lines[i];
				switch (line[0]) {
				case "*":
					tokens.push(HATENA_PLUS.TOKEN.HEAD);
					break;
				case "-":
					if (line == "-->")
						tokens.push(HATENA_PLUS.TOKEN.DRAFT_END);
					else
						tokens.push(HATENA_PLUS.TOKEN.LIST);
					break;
				case "+":
					tokens.push(HATENA_PLUS.TOKEN.LIST);
					break;
				case ":":
					if (line.lastIndexOf(":") != 0)
						tokens.push(HATENA_PLUS.TOKEN.DEF);
					else
						tokens.push(HATENA_PLUS.TOKEN.NORMAL);
					break;
				case "|":
					if (line === "|<")
						tokens.push(HATENA_PLUS.TOKEN.PRE_END);
					else if (line === "||<")
						tokens.push(HATENA_PLUS.TOKEN.SPRE_END);
					else if (line[line.length-1] === "|")
						tokens.push(HATENA_PLUS.TOKEN.TABLE);
					else
						tokens.push(HATENA_PLUS.TOKEN.NORMAL);
					break;
				case ">":
					if (line == ">#")
						tokens.push(HATENA_PLUS.TOKEN.NOTE);
					else if (line.search(/^>\|[^| ]*$/) != -1)
						tokens.push(HATENA_PLUS.TOKEN.PRE);
					else if (line.search(/^>.*>$/) != -1)
						tokens.push(HATENA_PLUS.TOKEN.BQ);
					else if (line.search(/^>\|[^| ]*\|$/) != -1)
						tokens.push(HATENA_PLUS.TOKEN.SPRE);
					else
						tokens.push(HATENA_PLUS.TOKEN.NORMAL);
					break;
				case "<":
					if (line === "<<")
						tokens.push(HATENA_PLUS.TOKEN.BQ_END);
					else if (line == "<!--")
						tokens.push(HATENA_PLUS.TOKEN.DRAFT);
					else if (line.search(/^<.*>$/) != -1)
						tokens.push(HATENA_PLUS.TOKEN.TAG);
					else
						tokens.push(HATENA_PLUS.TOKEN.NORMAL);
					break;
				case "#":
					if (line == "#<")
						tokens.push(HATENA_PLUS.TOKEN.NOTE_END);
					else
						tokens.push(HATENA_PLUS.TOKEN.NORMAL);
					break;
				default:
					if (line.search(/^\s*$/) === 0)
						tokens.push(HATENA_PLUS.TOKEN.BLANK);
					else
						tokens.push(HATENA_PLUS.TOKEN.NORMAL);
					break;
				}
			}
			return tokens;
		},
		parse: function(str, options) {
			var opts = {
				/** hxの基準値 */
				baseHeadLevel: 3
			};
			Utility.extend(opts, options);
			
			this.currentHeadLevel = 0;
			
			var lines = str.split(/\r?\n/);
			var tokens = this.tokenize(lines);
			var r = "";
			for (var i = 0; i < lines.length; ++i) {
				var t = this.parseOne(lines, tokens, i, opts);
				i = t.i;
				r += t.r;
			}
			
			for (var i = 0; i <= this.currentHeadLevel - opts.baseHeadLevel; ++i)
				r += "</div></section>";
				
			return r;
		},
		/**
		 * ブロック一つを解析する
		 * @param Array(string) lines 入力文章(行ごと)
		 * @param Array(HATENA_PLUS.TOKEN) tokens 入力対応トークン
		 * @param int i 処理開始行。
		 * @param Object options オプション。処理ごとに異なる。
		 * @return Object { i: 処理終了時の行, r: 変換結果 }
		 */
		parseOne: function(lines, tokens, i, opts) {
			var s = this.syntax, m = {};
			m[HATENA_PLUS.TOKEN.HEAD] = s.head;
			m[HATENA_PLUS.TOKEN.LIST] = s.list;
			m[HATENA_PLUS.TOKEN.DEF] = s.def;
			m[HATENA_PLUS.TOKEN.TABLE] = s.table;
			m[HATENA_PLUS.TOKEN.PRE] = s.pre;
			m[HATENA_PLUS.TOKEN.SPRE] = s.spre;
			m[HATENA_PLUS.TOKEN.BQ] = s.bq;
			m[HATENA_PLUS.TOKEN.NORMAL] = s.normal;
			m[HATENA_PLUS.TOKEN.NOTE] = s.note;
			m[HATENA_PLUS.TOKEN.TAG] = s.tag;
			m[HATENA_PLUS.TOKEN.DRAFT] = s.draft;
			var ret = { i: i, r: "" };
			var t = tokens[i];
			if (m[t]) {
				ret = m[t].call(this, lines, tokens, i, opts);
				if (t != HATENA_PLUS.TOKEN.SPRE)
					ret.r = this.inline.parse(ret.r);
			}
			return ret;
		},
		syntax: {
			head: function(lines, tokens, i, opts) {
				var line = lines[i],
					r = "",
					j = 0;
				while (line[j] == "*" && j < line.length)
					++j;
				var t = j - 1 + opts.baseHeadLevel;
				if (t > 6)
					t = 6;
				for (var k = 0, dh = this.currentHeadLevel - t; k <= dh; ++k) {
					if (k < dh)
						r += "</div>";
					r += "</section>";
				}
				this.currentHeadLevel = t;
				r += "<section>";
				r += Utility.format("<h{0}>{1}</h{0}>",
					t, line.substring(j, line.length));
				r += "<div>";
				return { i: i, r: r };
			},
			list: function(lines, tokens, i) {
				var list = [];
				var r = "";
				for (; i < tokens.length; ++i) {
					if (tokens[i] != HATENA_PLUS.TOKEN.LIST)
						break;
					var m = lines[i].match(/^([-+]+)(.*)$/);
					var level = m[1].length;
					var tag = (m[1][level-1] == "-") ? "ul" : "ol";
					if (list.length == level) {
						r += "</li><li>" + m[2];
					} else if (list.length < level) {
						// 階層を増やす
						list.push(tag);
						r += Utility.format("<{0}><li>{1}", tag, m[2]);
					} else {
						// 階層が減る分だけ閉じる
						for (var j = 0; j < list.length - level; ++j) {
							r += Utility.format("</li></{0}>", list.pop());
						}
						// もう一度解析
						--i;
						continue;
					}
				}
				// 減る分だけ閉じる
				while (list.length != 0)
					r += Utility.format("</li></{0}>", list.pop());
				--i; // 最終行に戻す
				return { i: i, r: r };
			},
			def: function(lines, tokens, i) {
				var r = "<dl>";
				for (; i < lines.length; ++i) {
					if (tokens[i] != HATENA_PLUS.TOKEN.DEF)
						break;
					// todo: リンクの:は無視するようにする？
					var m = lines[i].match(/^:([^:]*):(.*)$/);
					if (!m)
						break;
					r += Utility.format("<dt>{0}</dt><dd>{1}</dd>", m[1], m[2]);
				}
				r += "</dl>";
				--i; // 最終行に戻す
				return { i: i, r: r };
			},
			table: function(lines, tokens, i) {
				var r = "<table>";
				for (; i < tokens.length; ++i) {
					if (tokens[i] != HATENA_PLUS.TOKEN.TABLE)
						break;
					var t = lines[i].split("|");
					r += "<tr>";
					for (j = 0; j < t.length; ++j) {
						if (t[j] == "")
							continue;
						if (t[j][0] == "*") {
							r += "<th>" + t[j].substr(1, t[j].length-1) + "</th>";
						} else {
							r += "<td>" + t[j] + "</td>";
						}
					}
					r += "</tr>";
				}
				r += "</table>";
				--i;
				return { i: i, r: r };
			},
			pre: function(lines, tokens, i, opts) {
				var r = "";
				for (++i; i < tokens.length; ++i) {
					if (tokens[i] == HATENA_PLUS.TOKEN.PRE_END)
						break;
					var t = this.parseOne(lines, tokens, i, opts);
					i = t.i;
					r += t.r;
				}
				r = "<pre>" + r + "</pre>";
				return { i: i, r: r };
			},
			spre: function(lines, tokens, i) {
				var r = "";
				var lang = lines[i].match(/^>\|([^|]*)\|$/)[1];
				var content = "";
				for (++i; i < lines.length; ++i) {
					if (tokens[i] == HATENA_PLUS.TOKEN.SPRE_END)
						break;
					// ||<のネストのための苦肉の策
					var line = lines[i];
					if (line == "||< ")
						line = "||<";
					content += Utility.htmlspecialchars(line) + "\n";
				}
				/*
				if (lang === "aa") {
					r = "<pre class='aa'>" + content + "</pre>";
				} else
				*/
				if (lang === "") {
					r = "<pre>" + content + "</pre>";
				} else {
					r = "<pre><code class='language-" + lang + "'>" + 
						content + "</code></pre>";
				}
				return { i: i, r: r };
			},
			bq: function(lines, tokens, i, opts) {
				var r = "", t;
				var url = lines[i].match(/^>(.*)>$/)[1];
				for (++i; i < tokens.length; ++i) {
					if (tokens[i] == HATENA_PLUS.TOKEN.BQ_END)
						break;
					t = this.parseOne(lines, tokens, i, opts);
					i = t.i;
					r += t.r;
				}
				if (url != "") {
					//var cite = this.inline.parseOne(url);
					var cite = url;
					var m = url.match(/\[(.*)(:title=.*)?\]/);
					if (m)
						url = m[1];
					r = Utility.format("<blockquote cite='{0}'>{1}<cite>{2}</cite></blockquote>",
						url, r, cite);
				} else {
					r = "<blockquote>" + r + "</blockquote>";
				}
				return { i: i, r: r };
			},
			normal: function(lines, tokens, i) {
				var r = "";
				var content = lines[i];
				if (tokens[i+1] == HATENA_PLUS.TOKEN.NORMAL) {
					for (++i; i < lines.length; ++i) {
						if (tokens[i] != HATENA_PLUS.TOKEN.NORMAL)
							break;
						content += "<br />" + lines[i];
					}
					i--;
				}
				r = "<p>" + content + "</p>";
				return { i: i, r: r };
			},
			note: function(lines, tokens, i, opts) {
				// preとパターンは一緒
				var r = "<aside>";
				for (++i; i < tokens.length; ++i) {
					if (tokens[i] == HATENA_PLUS.TOKEN.NOTE_END)
						break;
					var t = this.parseOne(lines, tokens, i, opts);
					i = t.i;
					r += t.r;
				}
				r += "</aside>";
				return { i: i, r: r };
			},
			tag: function(lines, tokens, i) {
				return { i: i, r: lines[i] };
			},
			draft: function(lines, tokens, i) {
				for (++i; i < tokens.length; ++i) {
					if (tokens[i] == HATENA_PLUS.TOKEN.DRAFT_END)
						break;
				}
				return { i: i, r: "" };
			}
		}
	};
	
	//-----------------------------------------
	// HatenaPlus.Inline
	//-----------------------------------------
	
	HatenaPlus.Inline = function() { this.initialize.apply(this, arguments); }
	HatenaPlus.Inline.prototype = {
		initialize: function() {
			this.id = 0;
		},
		setup: function() {
			this.notes = [];
			this.id++;
		},
		parse: function(str) {
			var r = str;
			for (var k in this.syntax)
				r = this.syntax[k].call(this, r);
			return r;
		},
		syntax: {
			address: function(str) {
				var r = str;
				var m = str.match(/\[[^\[\]]*\]/g);
				if (!m)
					return r;
				for (var i = 0; i < m.length; ++i) {
					// urlの正規表現はphpspotより：http://bit.ly/uvZBr9
					// httpとmailtoを同時に扱うのはマズイ？
					var mm = m[i].match(/^\[(https?:\/\/|ftp:\/\/|mailto:|url:)([-_.!~*'()a-zA-Z0-9;\/?\@&=+\$,%#]+):title=(.*)?\]$/);
					if (!mm) {
						mm = m[i].match(/^\[(https?:\/\/|ftp:\/\/|mailto:)([-_.!~*'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)\]$/);
						if (!mm)
							continue;
					}
					var url = "";
					if (mm[1] != "url:")
						url += mm[1];
					url += mm[2];
					var title = "";
					if (mm.length > 3 && mm[3]) {
						title = mm[3];
						// 自動取得には未対応
						// Ajaxで対応させることはできなくはないが…
					}
					if (!title) {
						if (mm[1] != "mailto:" && mm[1] != "url:")
							title = mm[1] + mm[2];
						else
							title = mm[2];
					}
					r = r.replace(m[i],
						Utility.format("<a href='{0}'>{1}</a>", url, title));
				}
				return r;
			},
			code: function(str) {
				var m = str.match(/``([^`]`|[^`])*`\w*`/g);
				if (!m)
					return str;
				var r = str;
				for (var i = 0; i < m.length; ++i) {
					var mm = m[i].match(/^``(.*)`(\w*)`$/);
					r = r.replace(m[i],
						Utility.format("<code{0}>{1}</code>",
							mm[2] ? " class='language-" + mm[2] + "'" : "",
							Utility.htmlspecialchars(mm[1])
						));
				}
				return r;
			},
			footnote: function(str) {
				var r = str;
				// ToDo: かなり適当
				var m = str.match(/\(\(([^)]\)|[^)])*\)\)/g);
				if (!m)
					return r;
				for (var i = 0; i < m.length; ++i) {
					var mm = m[i].match(/^\(\((.*)\)\)$/);
					r = r.replace(m[i],
						Utility.format("<span class='footnote'><a name='fn{0}-{1}' href='#f{0}-{1}' title='{2}'>*{1}</a></span>",
							this.id, this.notes.length+1, mm[1]));
					this.notes.push(mm[1]);
				}
				return r;
			}
		},
		getFootnote: function() {
			var notes = this.notes;
			if (notes.length == 0)
				return "";
			var r = "<div class='footnote'>";
			for (var i = 0; i < notes.length; ++i) {
				r += "<p class='footnote'>";
				r += Utility.format(
					"<a name='f{0}-{1}' href='#fn{0}-{1}'>*{1}</a>：",
						this.id, i+1);
				r += notes[i];
				r += "</p>";
			}
			r += "</div>";
			return r;
		}
	};
	
	//-----------------------------------------
	// window.HatenaPlus
	//-----------------------------------------
	var hp = new HatenaPlus();
	window.HatenaPlus = function(str, opts) {
		return hp.parse(str, opts);
	}

}());

