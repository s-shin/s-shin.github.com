// (C) 2011 shin <s2pch.luck at gmail.com>
(function() {

var BAN = { WIDTH: 9, HEIGHT: 9 };
var SIDE = { UWATE: 0, SHITATE: 1 };
var KOMA = {
	HU: 0, KYO: 1, KEI: 2, GIN: 3, KIN: 4, HISHA: 5, KAKU: 6, GYOKU: 7, OH: 8,
	TO: 9, NKYO: 10, NKEI: 11, NGIN: 12, RYU: 13, UMA: 14,
	NUM: 15, OMOTE_NUM: 9
};
var KOMA_JP = [
	"歩", "香", "桂", "銀", "金", "飛", "角", "玉", "王",
	"と", "成香", "成桂", "成銀", "龍", "馬"
];
var KOMA_EN = [
	"hu", "kyo", "kei", "gin", "kin", "hisha", "kaku", "gyoku", "oh",
	"to", "nkyo", "nkei", "ngin", "ryu", "uma"
];

/**
 * 局面の状態管理
 */
var State = function(side) {
	this.side = (side != undefined) ? side : SIDE.SHITATE; // 現在の手番
	this.ban = new Ban(this);
	this.dai = [new Dai(this), new Dai(this)];
	this.ban.setup();
	this.dai[SIDE.UWATE].setup();
	this.dai[SIDE.SHITATE].setup();
}
State.prototype = {
	turn: function() {
		this.side = (this.side == SIDE.SHITATE) ? SIDE.UWATE : SIDE.SHITATE;
	}
}

/**
 * 盤情報管理
 */
var Ban = function(state) {
	this.state = state;
	// マス目それぞれで情報を管理。（右下方向）
	this.field = new Array(BAN.HEIGHT);
	for (var i = 0; i < BAN.HEIGHT; ++i) {
		this.field[i] = new Array(BAN.WIDTH);
		for (var j = 0; j < BAN.WIDTH; ++j) {
			this.field[i][j] = {
				koma: null, // KOMA.*
				side: null  // SIDE.*
			};
		}
	}
}
Ban.prototype = {
	/**
	 * 配置初期化
	 */
	setup: function() {
		var field = this.field;
		for (var i = 0; i < BAN.HEIGHT; ++i) {
			for (var j = 0; j < BAN.WIDTH; ++j) {
				this.remove(j, i);
			}
		}
		// 1, 3, 7, 9段目
		var k = [
			KOMA.KYO, KOMA.KEI, KOMA.GIN, KOMA.KIN, KOMA.GYOKU,
			KOMA.KIN, KOMA.GIN, KOMA.KEI, KOMA.KYO
		];
		for (var i = 0; i < k.length; ++i) {
			this.set(i, 0, k[i], SIDE.UWATE);
			this.set(i, 2, KOMA.HU, SIDE.UWATE);
			this.set(i, 8, k[i], SIDE.SHITATE);
			this.set(i, 6, KOMA.HU, SIDE.SHITATE);
		}
		// 2, 8段目
		this.set(1, 1, KOMA.HISHA, SIDE.UWATE);
		this.set(7, 1, KOMA.KAKU, SIDE.UWATE);
		this.set(7, 7, KOMA.HISHA, SIDE.SHITATE);
		this.set(1, 7, KOMA.KAKU, SIDE.SHITATE);
	},
	/**
	 * setter
	 */
	set: function(x, y, koma, side) {
		var field = this.field;
		field[y][x] = { koma: koma, side: side };
	},
	/**
	 * getter
	 */
	get: function(x, y) {
		return this.field[y][x];
	},
	/**
	 * 駒を動かす。動けるかのチェックはしないが成るかどうかのチェックはする。
	 * 成れる場合、funcでtrueを返したら成る。
	 * 移動先に駒があればそれを取る。
	 */
	move: function(x, y, tx, ty, func) {
		var field = this.field;
		var dst = this.field[ty][tx];
		field[ty][tx] = field[y][x];
		field[y][x] = null;
		// ひっくり返す処理
		var turn = function(t, isNaru) {
			var list = [
				[KOMA.HU, KOMA.TO], [KOMA.KYO, KOMA.NKYO],
				[KOMA.KEI, KOMA.NKEI], [KOMA.GIN, KOMA.NGIN],
				[KOMA.HISHA, KOMA.RYU], [KOMA.KAKU, KOMA.UMA]
			];
			var x = isNaru ? [0, 1] : [1, 0];
			for (var i = 0; i < list.length; ++i) {
				if (t.koma == list[i][x[0]]) {
					t.koma = list[i][x[1]];
					return;
				}
			}
		}
		var t = field[ty][tx];
		// 強制的に成る
		if ((t.koma == KOMA.HU || t.koma == KOMA.KYO) &&
			((ty == 0 && t.side == SIDE.SHITATE) ||
			 (ty == 8 && t.side == SIDE.UWATE))) {
			turn(t, true);
		} else if ((t.koma == KOMA.KEI) &&
			((ty <= 1 && t.side == SIDE.SHITATE) ||
			 (ty >= 7 && t.side == SIDE.UWATE))) {
			turn(t, true);
		} else if (((ty <= 2 && t.side == SIDE.SHITATE) ||
			 (ty >= 6 && t.side == SIDE.UWATE)) &&
			[KOMA.HU, KOMA.KYO, KOMA.KEI, KOMA.GIN,
				KOMA.HISHA, KOMA.KAKU].contains(t.koma) &&
			func()) {
			// 成りたいなら成る
			turn(t, true);
		}
		// 相手の駒があれば取る
		if (dst) {
			// 取った駒が成ってたら戻す
			turn(dst, false);
			this.state.dai[t.side].append(dst.koma);
		}
	},
	/**
	 * 駒が置けるか
	 */
	canPut: function(x, y, koma, side) {
		var field = this.field;
		// 駒がある
		if (field[y][x] != null)
			return false;
		// 禁じ手か
		if (koma == KOMA.HU) {
			// 二歩
			for (var i = 0; i < BAN.HEIGHT; ++i) {
				if (i == y || field[i][x] == null)
					continue;
				if (field[i][x].koma == KOMA.HU && field[i][x].side == side)
					return false;
			}
			// TODO: 打ち歩詰め
		}
		// そもそも打てない
		if (koma == KOMA.HU || koma == KOMA.KYO) {
			if ((side == SIDE.UWATE && y == 8) ||
				(side == SIDE.SHITATE && y == 0))
				return false;
		}
		if (koma == KOMA.KEI) {
			if ((side == SIDE.UWATE && y < 7) ||
				(side == SIDE.SHITATE && y > 2))
				return false;
		}
		return true;
	},
	/**
	 * 駒の追加処理。既に駒があるか、禁じ手ならfalse。
	 */
	append: function(x, y, koma, side) {
		var field = this.field;
		if (!this.canPut(x, y, koma, side))
			return false;
		this.set(x, y, koma, side);
		return true;
	},
	/**
	 * 駒の削除処理。既に駒がないならfalse。
	 */
	remove: function(x, y) {
		if (this.field[y][x] == null)
			return false;
		this.field[y][x] = null;
		return true;
	},
	/**
	 * x,yの位置の駒の動ける箇所を返す。 [{x: *, y: *}, ...]
	 * 敵の駒が取れる場所も含まれる。
	 */
	select: function(x, y) {
		var ret = new Array();
		var field = this.field, state = this.state;
		// falseを返したら終了。
		var check = function(x, y) {
			if (x < 0 || x > 8 || y < 0 || y > 8)
				return false;
			var f = field[y][x];
			if (f == null) {
				ret.push({ x: x, y: y });
				return true;
			}
			if (f.side != state.side)
				ret.push({ x: x, y: y });
			return false;
		}
		var f = field[y][x];
		if (f == null)
			return ret;
		var sign = (f.koma.side == SIDE.UWATE) ? 1 : -1;
		switch (f.koma) {
		case KOMA.HU:
			check(x, y + sign * 1);
			break;
		case KOMA.KYO:
			for (var i = 1; i <= BAN.HEIGHT; ++i) {
				if (!check(x, y + sign * i))
					break;
			}
			break;
		case KOMA.KEI:
			var ty = y + sign * 2;
			check(x+1, ty); check(x-1, ty);
			break;
		case KOMA.GIN:
			var ty = y + sign * 1;
			check(x-1, ty); check(x, ty); check(x+1, ty); // 前
			ty = y - sign * 1;
			check(x-1, ty); check(x+1, ty); // 後
			break;
		case KOMA.TO: case KOMA.NKYO: case KOMA.NKEI: case KOMA.NGIN:
		case KOMA.KIN:
			var ty = y + sign * 1;
			check(x-1, ty); check(x, ty); check(x+1, ty); // 前
			check(x-1, y); check(x+1, y); // 左右
			ty = y - sign * 1;
			check(x, ty); // 後
			break;
		case KOMA.OH: case KOMA.GYOKU:
			var ty = y + sign * 1;
			check(x-1, ty); check(x, ty); check(x+1, ty); // 前
			check(x-1, y); check(x+1, y); // 左右
			ty = y - sign * 1;
			check(x-1, ty); check(x, ty); check(x+1, ty); // 後
			break;
		case KOMA.HISHA: case KOMA.RYU:
			for (var i = 1; i <= BAN.HEIGHT; ++i) { // 前
				if (!check(x, y + i))
					break;
			}
			for (var i = 1; i <= BAN.HEIGHT; ++i) { // 後
				if (!check(x, y - i))
					break;
			}
			for (var i = 1; i <= BAN.WIDTH; ++i) { // 右
				if (!check(x + i, y))
					break;
			}
			for (var i = 1; i <= BAN.WIDTH; ++i) { // 左
				if (!check(x - i, y))
					break;
			}
			if (f.koma == KOMA.RYU) { // 斜め
				check(x+1, y+1); check(x+1, y-1);
				check(x-1, y+1); check(x-1, y-1);
			}
			break;
		case KOMA.KAKU: case KOMA.UMA:
			for (var i = 1; i <= BAN.WIDTH; ++i) {
				if (!check(x + i, y + i))
					break;
			}
			for (var i = 1; i <= BAN.WIDTH; ++i) {
				if (!check(x - i, y + i))
					break;
			}
			for (var i = 1; i <= BAN.WIDTH; ++i) {
				if (!check(x - i, y - i))
					break;
			}
			for (var i = 1; i <= BAN.WIDTH; ++i) {
				if (!check(x + i, y - i))
					break;
			}
			if (f.koma == KOMA.UMA) { // 前後左右
				check(x+1, y); check(x-1, y);
				check(x, y+1); check(x, y-1);
			}
			break;
		}
		return ret;
	},
	/**
	 * side側の駒の位置を取得。
	 * func_(x, y, koma)で条件を付けられる。戻り値trueのものを選択
	 */
	fetch: function(side, func_) {
		var ret;
		var field = this.field;
		for (var i = 0; i < BAN.HEIGHT; ++i) {
			for (var j = 0; j < BAN.WIDTH; ++j) {
				if (field[i][j].side == side) {
					if (func_ && !func_(j, i, koma))
						continue;
					ret.push({ x: j, y: i });
				}
			}
		}
		return ret;
	},
	/**
	 * x,yの位置にside側のfunc_を満たす駒の利きがあるか。
	 * func_はfetchのfunc_と同じ。
	 */
	isKiki: function(side, x, y, func_) {
		// side側の駒を全部取得。利きを調べx,yがあればtrue。
		var p = this.fetch(side, func_);
		var komas = Array.prototype.slice.apply(arguments, 3);
		for (var i = 0; i < p.length; ++i) {
			var pp = this.select(p[i].x, p[i].y);
			for (var j = 0; j < pp.length; ++j) {
				if (komas.contains(pp[j].koma))
					continue;
				if (pp[j].x == x && pp[j].y == y)
					return true;
			}
		}
		return false;
	},
	/**
	 * x,yの駒で王手がかかっているならtrue, いないならfalse
	 */
	isOhte: function(x, y) {
		var k = this.get(x, y);
		var p = this.select(x, y);
		for (var i = 0; i < p.length; ++i) {
			if ((p[i].koma == KOMA.GYOKU || p[i].koma == KOMA.OH) &&
				(k.side != p[i].side))
				return true;
		}
		return false;
	},
	/**
	 * side側の玉が詰んでいるならtrue。
	 * 無駄合できるなら詰みでないとする。
	 */
	isTumi: function(side) {
		// [1] 玉の周りを順番に調べ、玉が動けない、かつ
		// [2] 遠距離の王手の場合、合駒が出来なければ詰み。
		var field = this.field;
		var enemy = (side == SIDE.UWATE) ? SIDE.SHITATE : SIDE.UWATE;
		// [1]
		// 玉の位置
		var g = this.fetch(side, function(x, y, koma) {
			return koma == KOMA.GYOKU || koma == KOMA.OH;
		})[0];
		var pp = this.select(g.x, g.y); // 動ける位置
		for (var i = 0; i < pp.length; ++i) {
			if (!isKiki(enemy, pp[i].x, pp[i].y)) // 利きがない！
				return false;
		}
		// [2]
		// 桂以外の飛び道具の抽出
		var komas = this.fetch(enemy, function(x, y, koma) {
			return [KOMA.KYO, KOMA.HISHA,
				KOMA.RYU, KOMA.KAKU, KOMA.UMA].contains(koma);
		});
		for (var i = 0; i < komas.length; ++i) {
			// 王手か
			if (!this.isOhte(komas[i].x, komas[i].y))
				continue;
			switch (komas[i].koma) {
			case KOMA.KYO:
				var sign = (enemy == SIDE.UWATE) ? 1 : -1;
				var d = (g.y - komas[i].y) * sign;
				// 遠距離王手か(距離が2以上)
				if (d >= 2) {
					// ■駒が打てるか
					// 使える駒の種類を取得
					var avail = this.state.dai[side].getAvailable();
					for (var j = 0; j < avail.length; ++j) {
						// 香の利きを順番に見ていき
						for (var k = 1; k < d; ++k) {
							// それが打てるか
							var y = komas[i].y + sign * j;
							if (this.canPut(komas[i].x, y, avail[j], side))
								return false; // 打てるので詰みではない
						}
					}
					// ■動かして防げるか
					for (var j = 1; j < d; ++j) {
						var y = komas[i].y + sign * j;
						// 玉以外でそこへ動ける駒があるか
						if (isKiki(side, komas[i].x, y, function(x, y, koma) {
							return koma != KOMA.GYOKU || koma != KOMA.OH;
						})) {
							return false; // 動けるので詰みではない
						}
					}
				}
				break;
			case KOMA.HISHA: case KOMA.RYU:
				// 方向の特定
				break;
			case KOMA.KAKU: case KOMA.UMA:
				// 方向の特定
				break;
			}
		}
		return true; // 詰み
	}
}

/**
 * 駒台情報管理
 */
var Dai = function(state) {
	this.state = state;
	// 駒ごとに情報を管理
	this.field = new Array(KOMA.NUM);
	for (var i = 0; i < KOMA.NUM; ++i)
		this.field[i] = 0; // 個数
}
Dai.prototype = {
	setup: function() {
		for (var i = 0; i < KOMA.NUM; ++i)
			this.field[i] = 0; // 個数
	},
	get: function(koma) {
		return this.field[koma];
	},
	append: function(koma) {
		this.field[koma]++;
	},
	remove: function(koma) {
		this.field[koma]--;
	},
	/**
	 * 利用可能な駒の種類を配列で返す
	 */
	getAvailable: function() {
		var ret = new Array();
		for (var koma = 0; koma < KOMA.NUM; ++koma) {
			if (this.field[koma] > 0)
				ret.push(koma);
		}
		return ret;
	}
}

//------------------------------------------------------

var CLASSNAME = {
	ACTIVE: { KOMA: "shogi-active-koma", KIKI: "shogi-active-kiki" },
	KOMA: (function() {
		var ret = new Array(KOMA.NUM);
		for (var i = 0; i < KOMA.NUM; ++i)
			ret[i] = "shogi-koma-" + KOMA_EN[i];
		return ret;
	}()),
	SIDE: [ "shogi-side-uwate", "shogi-side-shitate" ]
}

var Game = function(state, table, dai_uwate, dai_shitate) {
	var me = this;
	this.state = state;
	this.ACTIVE = { BAN: 0, DAI: 1 }
	// active = { type: this.ACTIVE.*,
	//		target: BANなら{x:*,y:*}, DAIなら{idx:*,koma:*}
	// }
	this.active = null;
	var field = new Array(BAN.HEIGHT);
	field.elem = table;
	for (var i = 0; i < BAN.HEIGHT; ++i) {
		field[i] = new Array(BAN.WIDTH);
		var tr = document.createElement("tr");
		for (var j = 0; j < BAN.WIDTH; ++j) {
			var td = document.createElement("td");
			field[i][j] = {
				elem: td
			};
			tr.appendChild(td);
			td.addEventListener("click", (function(x, y) {
				return function() {
					me.onClick(me.ACTIVE.BAN, { x: x, y: y });
				};
			}(j, i)));
		}
		table.appendChild(tr);
	}
	this.field = field;
	var dai = [ new Array(), new Array() ]; // { elem: * }
	dai[SIDE.SHITATE].elem = dai_shitate;
	dai[SIDE.UWATE].elem = dai_uwate;
	this.field.dai = dai;
}
Game.prototype = {
	/**
	 * 全描画更新
	 */
	update: function() {
		var me = this, field = this.field;
		// 盤の駒の表示
		for (var i = 0; i < BAN.HEIGHT; ++i) {
			for (var j = 0; j < BAN.WIDTH; ++j) {
				var t = this.state.ban.get(j, i);
				var f = field[i][j].elem;
				f.setAttribute("class", "");
				if (t) {
					f.innerHTML = "<span>" + KOMA_JP[t.koma] + "</span>";
					f.addClass(CLASSNAME.KOMA[t.koma]);
					f.addClass(CLASSNAME.SIDE[t.side]);
				} else {
					f.innerHTML = "";
				}
			}
		}
		// 台の駒の表示
		[SIDE.UWATE, SIDE.SHITATE].forEach(function(side) {
			// クリア
			var dai = this.field.dai[side];
			dai.clear();
			dai.elem.innerHTML = "";
			// セット
			var idx = 0;
			for (var koma = 0; koma < KOMA.OMOTE_NUM; ++koma) {
				var num = this.state.dai[side].get(koma);
				if (num > 0) {
					var span = document.createElement("span");
					span.innerHTML = KOMA_JP[koma] + num;
					span.addClass(CLASSNAME.KOMA[koma]);
					span.addEventListener("click", (function(idx) {
						return function() {
							me.onClick(me.ACTIVE.DAI, { side: side, idx: idx });
						};
					}(idx++)), false);
					dai.push({ koma: koma, elem: span });
					dai.elem.appendChild(span);
				}
			/*
				for (var j = 0; j < num; ++j) {
					var span = document.createElement("span");
					span.innerHTML = KOMA_JP[koma];
					this.dai[side].appendChild(span);
				}
			*/
			}
		}, this);
		// 選択状態の表示
		var active = this.active;
		if (active) {
			if (active.type == this.ACTIVE.BAN) {
				// 選択中駒の表示
				var p = active.target;
				var f = field[p.y][p.x].elem;
				f.addClass(CLASSNAME.ACTIVE.KOMA);
				// 利きの表示
				for (var i = 0; i < active.kiki.length; ++i) {
					var p = active.kiki[i];
					var f = field[p.y][p.x].elem;
					f.addClass(CLASSNAME.ACTIVE.KIKI);
				}
			} else {
				// 選択中駒の表示
				var t = active.target;
				var f = field.dai[t.side][t.idx].elem;
				f.addClass(CLASSNAME.ACTIVE.KOMA);
			}
		}
	},
	/**
	 * クリック時の処理はここに集約
	 */
	onClick: function(type, target) {
		var me = this, active = this.active,
			field = this.field, state = this.state;
		if (type == this.ACTIVE.BAN) {
			// 自分の駒があるなら選択
			var select = function() {
				var t = me.state.ban.get(target.x, target.y);
				if (t && t.side == me.state.side) {
					me.active = {
						type: type,
						target: target,
						kiki: me.state.ban.select(target.x, target.y)
					};
				}
			}
			if (active) {
				if (active.type != this.ACTIVE.BAN) {
					// 打てるなら打つ
					var koma = field.dai[state.side][active.target.idx].koma;
					var ok = state.ban.append(
						target.x, target.y, koma, state.side);
					if (ok) // 台から消す
						state.dai[state.side].remove(koma);
					// 打てない場合解除。駒があれば選択
					this.active = null;
					if (!ok)
						select();
					this.update();
				} else if (active.target.x == target.x &&
					active.target.y == target.y) {
					// 選択解除
					this.active = null;
					this.update();
				} else {
					// 行けない場所なら選択解除か別の駒選択
					// 行けるなら移動
					for (var i = 0; i < active.kiki.length; ++i) {
						var p = active.kiki[i];
						if (p.x == target.x && p.y == target.y)
							break;
					}
					if (i == active.kiki.length) {
						// とりあえず選択解除
						this.active = null;
						// もし押した箇所に自分の駒があるなら選択
						select();
						this.update();
					} else {
						// 移動
						state.ban.move(
							active.target.x, active.target.y,
							target.x, target.y, function() {
								return confirm("成りますか？[はい/キャンセル]");
							});
						this.active = null;
						this.update();
					}
				}
			} else {
				select();
				this.update();
			}
		} else {
			var select = function() {
				me.active = {
					type: type,
					target: target
				};
			}
			if (active) {
				if (active.target.idx != target.idx) {
					select();
				} else {
					this.active = null;
				}
				this.update();
			} else {
				select();
				this.update();
			}
		}
	}
};


//------------------------------------------------------

window.addEventListener("load", function() {
	this.state = new State(SIDE.UWATE);
	this.game = new Game(
		this.state,
		document.getElementById("ban"),
		document.getElementById("dai1"),
		document.getElementById("dai2")
	);
	this.game.update();
});


}());

