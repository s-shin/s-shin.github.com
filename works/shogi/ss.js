/**
 * 超適当ライブラリ
 * サポートはIE9以上とその他概ね標準準拠のブラウザ。
 * としたいが一応IE8に対応している（つもり）。
 */

/**
 * 有名な継承関数
 * 親クラスのコンストラクタは__super.constructで。
 * @param {Function} s スーパークラス
 * @param {Function} c コンストラクタ
 */
var extend = function(s, c) {
	var F = new Function();
	F.prototype = s.prototype;
	c.prototype = new F();
	c.prototype.__super = s.prototype;
	c.prototype.__super.construct = s;
	//c.prototype.construct = c;
	return c;
}
/** Functionにも導入しておく */
Function.prototype.extend = function(c) {
	return extend(this, c);
}

/**
 * jQuery的な$関数。
 * @return 要素の配列(Array型)。
 */
var $ = function(sel) {
	return Array.prototype.slice.apply(document.querySelectorAll(sel));
}

/** 要素にaがあるか。indexOfで出来るが分かりにくいので。 */
Array.prototype.contains = function(a) {
	return (this.indexOf(a) != -1);
}
/** 要素番号iを削除。spliceで出来るが分かりにくいので。 */
Array.prototype.remove = function(i) {
	this.splice(i, 1);
}
/** クリア。spliceで出来るが分かりにくいので。 */
Array.prototype.clear = function() {
	this.splice(0, this.length);
}
/** sort用関数。数値昇順。元ネタはActionScript？ */
Array.prototype.NUMERIC = function(a, b) {
	return a - b;
}

/** class属性の追加。複数指定可。 */
Element.prototype.addClass = function(/* class names */) {
	var tc = this.getAttribute("class"); // target class
	var c = Array.prototype.slice.apply(arguments);
	if (tc == null) {
		this.setAttribute("class", c.join(" "));
		return;
	}
	tc = tc.split(" ");
	for (var i = 0, len = c.length; i < len; ++i)
		if (tc.indexOf(c[i]) == -1)
			tc.push(c[i]);
	this.setAttribute("class", tc.join(" "));
}
/** class属性の削除。複数指定可。 */
Element.prototype.removeClass = function(/* class names */) {
	var tc = this.getAttribute("class");
	if (tc == null)
		return;
	var c = Array.prototype.slice.apply(arguments);
	tc = tc.split(" ");
	for (var i = 0, len = c.length; i < len; ++i) {
		var idx = c.indexOf(c[i]);
		if (t != -1)
			tc.splice(idx, 1);
	}
	this.setAttribute("class", tc.join(" "));
}
/** IE9未満用addEventListener **/
if (!Element.prototype.addEventListener) {
	Element.prototype.addEventListener = function(type, listener, useCapture) {
		var t = this;
		this.attachEvent("on" + type, function(e) { listener.call(t, e); });
		if (useCapture && console)
			console.log("useCaptureは無視されます。");
	}
}






