
Parze - Simple Parser Library by JavaScript
===========================================

License: Apache License 2.0

Example
-------

Parser code:

	var p = new Parze();
	p.registerBlock({
		head: {
			re: /^(\*+)(.*)$/,
			parse: function(handle) {
				var t = handle.get();
				var m = t.match;
				return Parze.Util.format(
					"<h{0}>{1}</h{0}>", m[1].length, m[2]);
			}
		},
		normal: {
			re: /^.*$/,
			parse: function(handle) {
				var t = handle.get();
				return "<p>" + t.str + "</p>";
			}
		}
	});

Input text:

	*Head1
	FooBar
	**Head1-1
	FooBar

is converted to

	<h1>Head1</h1>
	<p>FooBar</p>
	<h2>Head1-1</h2>
	<p>FooBar</p>


Other Samples
-------------

- [First example (ja)](http://s-shin.github.com/works/parze/samples/simple/)
- [Simple Editor (ja)](http://s-shin.github.com/works/parze/samples/editor/)


