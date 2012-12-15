/**
 * parze.js v1.1.0
 * Copyright (C) 2011-2012 shin <s2pch.luck@gmail.com>
 * Apache License 2.0
 */
(function(exports) {

	/**
	 * コアクラス
	 * DIGRESSION: 実はParzeの読みはイタリア語風にパルツェだとか何とか
	 */
	var Parze = function() {
		// ブロック記法
		this.block = [];
		// インライン記法
		this.inline = [];
		// 各種フック
		this.hook = {
			/**
			 * parse関数実行時に最初に呼ばれる。
			 * parse関数に渡すoptsはこのopts
			 */
			setup: function(opts) {},
			/**
			 * parse後に呼ばれるフィルタ
			 * strは全文字列
			 */
			afterParse: function(str) { return str; },
			/**
			 * parse前に呼ばれるフィルタ
			 * strは全文字列
			 */
			beforeParse: function(str) { return str; },
			/**
			 * parseBlockで各行が処理される前に呼ばれる。
			 * strは現在行の文字列
			 */
			beforeParseLine: function(str) { return str; },
			/**
			 * parseBlockで各行が処理された後に呼ばれる。
			 * strは現在行の文字列
			 */
			afterParseLine: function(str) { return str; }
		};
		this.handler = new Parze.Handler(this);

		// 以下、残りのメンバの初期化

		/**
		 * 各行の情報を保持するオブジェクト
		 * parze.linesの構造
		 * parze.lines = [
		 *     // 以下をline構造体と呼ぶことにする
		 *     { str: 行文字列, tokenized: トークン化済み,
		 *       // 以下マッチした場合のみ
		 *       match: マッチ結果, token: マッチしたトークン,
		 *       parse: トークンのparse関数 },
		 *     ...
		 * ]
		 */
		this.lines = null;

		// 処理時の現在行
		this.current = null;
	}

	Parze.prototype = {
		/**
		 * ブロック記法の登録。
		 * { token名(handler.get().tokenに相当): {
		 *     re: 正規表現(必須。マッチの結果はhandler.match),
		 *     inline: インライン記法のパースをするか(デフォルトでtrue),
		 *     parse: function(handler) { return 変換結果; }
		 *            handler.get().parseに相当。
		 *            無くても良い。その場合はパースされない。
		 * }}
		 * @protected
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
		 * @protected
		 */
		registerInline: function(s) {
			for (var k in s)
				this.inline.push(s[k]);
		},
		/**
		 * フックの登録
		 * @protected
		 */
		registerHook: function(hooks) {
			for (var k in hooks)
				this.hook[k] = hooks[k];
		},
		/**
		 * メイン変換処理
		 * @public
		 */
		parse: function(str, opts) {
			var hook = this.hook;
			hook.setup(opts);
			this.lines = this.setupText(hook.beforeParse(str));
			this.current = 0; // parse前に現在行を0に初期化
			return hook.afterParse(this.parseBlock());
		},
		/**
		 * テキストを分割してline構造体で返す。
		 * 副作用なし
		 * @private
		 */
		setupText: function(str) {
			var lines = [];
			t = str.split(/\r?\n/);
			for (var i = 0; i < t.length; ++i)
				lines.push({str: t[i], tokenized: false});
			return lines;
		},
		/**
		 * テキストの字句解析
		 * 副作用なし
		 * @private
		 */
		tokenize: function(str) {
			var ret = {};
			var block = this.block;
			var m = false;
			for (var j = 0; j < block.length; ++j) {
				var b = block[j];
				m = str.match(b.re);
				if (m) {
					// line構造体で返す
					ret = {
						str: str,
						token: b.token,
						parse: b.parse,
						inline: b.inline,
						match: m
					};
					break;
				}
			}
			ret.tokenized = true;
			return ret;
		},
		/**
		 * ブロックの変換処理
		 * tokenize後に実行する
		 * @private
		 */
		parseBlock: function() {
			var lines = this.lines, hook = this.hook;
			var r = "";
			while (this.current < lines.length) {
				var line = lines[this.current];
				if (!line.tokenized) {
					line = this.tokenize(hook.beforeParseLine(line.str));
					lines[this.current] = line;
				}
				if (line.parse) {
					var t = line.parse(this.handler);
					if (line.inline)
						t = this.parseInline(t);
					r += hook.afterParseLine(t);
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
		}
	};


	/**
	 * プラグインでparse時に利用される。
	 * Parzeのprivateにアクセスする
	 * @protected
	 */
	Parze.Handler = function(parze) {
		this.parze = parze;
	}
	Parze.Handler.prototype = {
		/**
		 * 現在の行(正規表現のマッチ結果)を取得
		 * m[0]: 行全体, m[1～]: マッチした部分の文字列
		 */
		get: function() {
			var t = this.parze;
			if (this.end())
				throw new ReferenceError("内部カウントが不正です。handle.nextし過ぎではありませんか？");
			// tokenizeしていなかったら
			var line = t.lines[t.current];
			if (!line.tokenized) {
				line = t.tokenize(line.str);
				t.lines[t.current] = line;
			}
			return line;
		},
		/**
		 * 内部行カウントを１増やす
		 */
		next: function() {
			this.parze.current++;
		},
		/**
		 * 内部行カウントを１減らす
		 */
		prev: function() {
			this.parze.current--;
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
			var t = this.parze;
			return (t.current >= t.lines.length);
		}
	};

	
	/**
	 * プラグイン
	 */
	Parze.Plugin = {
		plugin: {},
		/**
		 * プラグインの登録。名前とインスタンスを指定。
		 * @protected
		 */
		register: function(name, parze) {
			this.plugin[name] = parze;
		},
		/**
		 * プラグインのロード。
		 * @public
		 */
		load: function(name) {
			return this.plugin[name];
		}
	};
	

	/**
	 * ユーティリティ関数
	 * @protected
	 */
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

    exports.Parze = Parze;

})(typeof exports !== 'undefined' ? exports : window);



