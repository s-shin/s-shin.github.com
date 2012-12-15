/**
 * parze.js v1.0.0
 * Copyright (C) 2011-2012 shin <s2pch.luck@gmail.com>
 * Apache License 2.0
 */
window.Parze = (function() {

	var Parze = function() { this.initialize.apply(this, arguments); }
	
	Parze.prototype = {
		initialize: function() {
			this.block = [];
			this.inline = [];
		},
		/**
		 * ブロック記法の登録。
		 * { token名(handler.get().tokenに相当): {
		 *     re: 正規表現(必須。マッチの結果はhandler.match),
		 *     inline: インライン記法のパースをするか(デフォルトでtrue),
		 *     parse: function(handler) { return 変換結果; }
		 *            handler.get().parseに相当。
		 *            無くても良い。その場合はパースされない。
		 * }}
		 */
		registerBlock: function(s) {
			for (var k in s) {
				if (s[k].token === undefined)
					s[k].token = k;
				if (s[k].inline === undefined)
					s[k].inline = true;
				this.block.push(s[k]);
			}
		},
		/**
		 * インライン記法の登録。
		 * { 記法名(任意): {
		 *     re: 正規表現(必須。マッチの結果がparseの引数のmatch),
		 *     parse: function(match) { return 置き換わる文字列; }
		 * }}
		 */
		registerInline: function(s) {
			for (var k in s)
				this.inline.push(s[k]);
		},
		/**
		 * フックの登録
		 */
		registerHook: function(hooks) {
			for (var k in hooks)
				this.hook[k] = hooks[k];
		},
		hook: {
			/**
			 * parse関数実行時に最初に呼ばれる。
			 * parse関数に渡すoptsはこのopts
			 */
			setup: function(opts) {},
			/**
			 * 処理後に呼ばれるフィルタ
			 */
			afterFilter: function(str) { return str; },
			/**
			 * 処理前に呼ばれるフィルタ
			 */
			beforeFilter: function(str) { return str; }
		},
		/**
		 * メイン変換処理
		 */
		parse: function(str, opts) {
			this.hook.setup(opts);
			this.setText(str);
			this.tokenize();
			this.handler.me = this;
			this.hook.beforeFilter(str);
			return this.hook.afterFilter(this.parseBlock());
		},
		/**
		 * テキストのセット。
		 * @private
		 */
		setText: function(str) {
			this.lines = [];
			t = str.split(/\r?\n/);
			for (var i = 0; i < t.length; ++i)
				this.lines.push({str: t[i]});
			this.current = 0;
		},
		/**
		 * テキストの字句解析
		 * setText後に実行する
		 * NOTE: この処理はブロックで各行を処理する前に行なっても良い。
		 * ここでは、すべての行を一度に処理しているが、フックをかませるのであれば、
		 * line.parse前に行うほうが良いかもしれない。
		 * @private
		 */
		tokenize: function() {
			var lines = this.lines, block = this.block;
			for (var i = 0; i < lines.length; ++i) {
				var line = lines[i];
				var m = false;
				for (var j = 0; j < block.length; ++j) {
					var b = block[j];
					m = line.str.match(b.re);
					if (m) {
						line.token = b.token;
						line.parse = b.parse;
						line.inline = b.inline;
						line.match = m;
						break;
					}
				}
			}
		},
		/**
		 * ブロックの変換処理
		 * tokenize後に実行する
		 * @private
		 */
		parseBlock: function() {
			var lines = this.lines;
			var r = "";
			while (this.current < lines.length) {
				var line = lines[this.current];
				if (line.parse) {
					var t = line.parse(this.handler);
					if (line.inline)
						t = this.parseInline(t);
					r += t;
				}
				this.current++;
			}
			return r;
		},
		/**
		 * インラインの変換処理
		 * 単独で使える
		 * @private
		 */
		parseInline: function(str) {
			// parse inline
			for (var k in this.inline) {
				// globalにしてマッチ
				var inline = this.inline[k];
				var re = new RegExp(inline.re.source, "g");
				var m = str.match(re);
				if (!m)
					continue;
				// 一つ一つ変換する
				for (i = 0; i < m.length; ++i) {
					var mm = m[i].match(inline.re);
					// 最初にマッチしたものだけ交換されるのでこれで良い
					str = str.replace(m[i], inline.parse(mm));
				}
			}
			return str;
		},
		/**
		 * ユーザのparse時に利用される。
		 */
		handler: {
			/**
			 * 現在の行(正規表現のマッチ結果)を取得
			 * m[0]: 行全体, m[1～]: マッチした部分の文字列
			 */
			get: function() {
				var t = this.me;
				if (this.end())
					throw new ReferenceError("内部カウントが不正です。handle.nextし過ぎではありませんか？");
				return t.lines[t.current];
			},
			/**
			 * 内部行カウントを１増やす
			 */
			next: function() {
				this.me.current++;
			},
			/**
			 * 内部行カウントを１減らす
			 */
			prev: function() {
				this.me.current--;
			},
			/**
			 * nextしてgetするショートカット関数。
			 */
			getNext: function() {
				this.next();
				return this.end() ? false : this.get();
			},
			/**
			 * 終わりかどうか
			 */
			end: function() {
				var t = this.me;
				return (t.current >= t.lines.length);
			}
		}
	};
	
	Parze.Plugin = {
		plugin: {},
		/**
		 * プラグインの登録。名前とインスタンスを指定。
		 */
		register: function(name, parze) {
			this.plugin[name] = parze;
		},
		/**
		 * プラグインのロード。
		 */
		load: function(name) {
			return this.plugin[name];
		}
	};
	
	Parze.Util = {
		/**
		 * 特殊文字の変換。よく使うと思うので。
		 */
		htmlspecialchars: function(str) {
			var pre = document.createElement("pre");
			pre.textContent = str;
			return pre.innerHTML;
		},
		/**
		 * Pythonライクなformat関数。
		 */
		format: function(fmt /* ... */) {
			for (var i = 1; i < arguments.length; ++i)
				fmt = fmt.split("{"+(i-1)+"}").join(arguments[i]);
			return fmt;
		}
	};

    return Parze;
})();

// DIGRESSION: 実はParzeの読みはパルツェだとか何とか（イタリア語）

