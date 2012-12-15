
supportedExts =
	# built-in
	cpp: ["c", "cc", "cpp", "cxx", "cyc", "m"]
	cs: ["cs"]
	java: ["java"]
	py: ["py", "cv"]
	rb: ["rb"]
	pl: ["pl", "pm", "perl"]
	sh: ["sh", "bsh", "csh"]
	xml: ["htm", "html", "mxml", "xhtml", "xml", "xsl"]
	js: ["js"]
	json: ["json"]
	coffee: ["coffee"]
	# plugin
	apollo: ["apollo", "agc", "aea"]
	clj: ["clj"]
	css: ["css"]
	ngo: ["go"]
	hs: ["hs"]
	lisp: ["cl", "el", "lisp", "scm"]
	lua: ["lua"]
	ml: ["fs", "ml"]
	n: ["n", "nemerle"]
	proto: ["proto"]
	scala: ["scala"]
	sql: ["sql"]
	tex: ["latex", "tex"]
	vb: ["vb", "vbs"]
	vhdl: ["vhdl", "vhd"]
	wiki: ["wiki.meta"]
	xq: ["xq", "xquery"]
	yaml: ["yaml", "yml"]

getExt = (name) ->
	m = name.match /^.*[.](\w+)$/
	return m[1] if m
	null

checkSupportedExt = (name) ->
	ext = getExt name
	if ext
		for k, v of supportedExts
			return k if v.indexOf(ext) != -1
	null

supportedFileNames =
	makefile: ["Makefile"]

checkSupportedFileName = (name) ->
	for k, v of supportedFileNames
		return k if v.indexOf(name) != -1
	null

checkType = (name) ->
	t = checkSupportedExt name
	return t if t
	t = checkSupportedFileName name
	return t if t
	null

#----------------------------------

readFile = (file, fn) ->
	reader = new FileReader
	reader.onload = () -> fn reader.result
	reader.readAsText file

#----------------------------------

text2lines = (text) -> text.split /\r?\n/

lines2text = (lines) -> lines.join "\n"

trim = (lines) ->
	while lines.length > 0 and lines[0].length is 0
		lines.shift()
	while lines.length > 0 and lines[lines.length-1].length is 0
		lines.pop()
	lines

untabify = (lines, width) ->
	if typeof width isnt "number" or width < 0
		return lines
	spaces = ""
	spaces += " " for i in [1..width]
	ret = []
	for line in lines
		t = ""
		m = line.match /^(\t+)([^\t].*)$/
		if m
			t += spaces for [1..m[1].length]
			t += m[2]
		else
			t = line
		ret.push t
	ret

escape = (code) -> $("<pre>").text(code).html()

preprocess = (code, tabwidth=null) ->
	lines2text(untabify(trim(text2lines(escape(code))), tabwidth))

#----------------------------------

$ ->
	content = $ "#content"
	body = $ "body"
	target = content.find "pre code.prettyprint"

	print = (code, type) ->
		if type is "makefile"
			t = preprocess code
		else
			t = preprocess code, 4
		target.html PR.prettyPrintOne(t, type)


	body
		.bind "drop", (jqe) ->
			jqe.preventDefault()
			e = jqe.originalEvent
			file = e.dataTransfer.files[0];
			type = checkType(file.name)
			if type
				readFile file, (r) -> print r, type
				info.ddhere.hide()


	info =
		ddhere:
			obj: $("#content .info .ddhere")
			show: () -> @obj.fadeIn 100
			hide: () -> @obj.fadeOut 500
			over: () -> @obj.css "color", "red"
			out: () -> @obj.css "color", "black"
				



