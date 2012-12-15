/**
 * parze.textile.js v0.0.1
 * Copyright (C) 2011-2012 shin <s2pch.luck@gmail.com>
 * Apache License 2.0
 */
(function(Parze) {

	// http://textile.thresholdstate.com/
	// http://www.textism.com/tools/textile/?sample=2
	// http://redmine.jp/tech_note/textile/


	var p = new Parze();
	Parze.Plugin.register("textile", p);
	
	p.registerBlock({
		block1: {
			re: /^(h1|h2|h3|h4|h5|h6|bq|p)(({[^}]+}|\([^)]+\)|\[[^\]]+\])*)\.(.*)$/,
			parse: function(handler) {
				var m = handler.get().match;
				console.log(m);
				return Parze.Util.format(
					"<{0}{1}>{2}</{0}>",
					m[1] == "bq" ? "blockquote" : m[1],
					m[3] ? (" style='" + m[3] + "'") : "",
					m[4]);
			}
		},
		paragraph: {
			re: /^(.*)$/,
			parse: function(handler) {
				var m = handler.get().match;
				return m[1];
			}
		}
	});

	var makeInline = function(tag, a) {
		
	}

	p.registerInline({
		notextile: {
			re: /<notextile>(.*)<\/notextile>/,
			parse: function(m) {
				return m[1];
			}
		},
		quotes: {
			re: (function() {
				var t = "([^\"]*)\"|(')([^']*)";
				return new 
					/^([^"]*)"|(')([^']*)[ ]'/
},
			parse: function(m) {
				console.log(m);
				if (m[2] == "\"")
					return " &#8220" + m[3] + "&#8221 ";
				else
					return " &#8216" + m[5] + "&#8217 ";
			}
		},
		bold: {
			re: /[ ][ ]/,
			parse: function(m) {
				
			}
		},
		italic: {
			re: /nomatch/
		},
		underline: {
			re: /nomatch/
		},
		strike: {
			re: /nomatch/
		},
		q: {
			re: /nomatch/
		},
		code: {
			re: /nomatch/
		}
	});


})(Parze);


