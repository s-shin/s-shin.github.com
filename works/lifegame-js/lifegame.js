(function() {

	var LifeGame = function() { this.initialize.apply(this, arguments); }
	LifeGame.prototype = {
		initialize: function(opts) {
			// オプション整理
			(function(a, b) {
				if (!a) 
					return b;
				// bにあってaにないものを代入
				for (var k in b) 
					if (!a[k])
						a[k] = b[k];
			})(opts, {
				width: 30, height: 30,
				drawCell: function(game, x, y) {},
				setupField: function(game) {}
			});
			
			var w = this.width = opts.width;
			var h = this.height = opts.height;
			this.drawCell_ = opts.drawCell;
			var field = this.field = new Array(w);
			var subfield = this.subfield_ = new Array(w);
			// フィールド作成
			for (var i = 0; i < w; ++i) {
				field[i] = new Array(h);
				subfield[i] = new Array(h);
				for (var j = 0; j < h; ++j) {
					field[i][j] = false;
					subfield[i][j] = false;
				}
			}
			opts.setupField(this)
			
		},
		update: function() {
			var w = this.width, h = this.height, field = this.field,
				subfield = this.subfield_;
			// 値はsubcellに更新していく
			for (var i = 0; i < w; ++i) {
				for (var j = 0; j < h; ++j) {
					var count = this.getLivingCellCount_(i, j);
					subfield[i][j] = field[i][j];
					if (field[i][j]) {
						if (count != 2 && count != 3)
							subfield[i][j] = false;
					} else {
						if (count == 3)
							subfield[i][j] = true;
					}
				}
			}
			// 入れ替える
			this.field = subfield;
			this.subfield_ = field;
		},
		draw: function() {
			var w = this.width, h = this.height;
			for (var i = 0; i < w; ++i)
				for (var j = 0; j < h; ++j)
					this.drawCell_(this, i, j);
		},
		getLivingCellCount_: function(x, y) {
			// 周囲の生きている個数
			var w = this.width, h = this.height, field = this.field;
			var getCell = function(x, y) {
				x = (w+x) % w;
				y = (h+y) % h;
				return field[x][y];
			}
			var count = 0;
			for (var i = -1; i <= 1; ++i) {
				for (var j = -1; j <= 1; ++j) {
					// 自分は無視
					if (i == 0 && j == 00)
						continue;
					if (getCell(x+i, y+j))
						count++;
				}
			}
			return count;
		}
	}

	LifeGame.Tool = {
		setupFieldAtRandom: function(game, lifes) {
			var field = game.field, w = game.width, h = game.height;
			if (lifes < 1)
				lifes = w * h * lifes;
			// クリア
			for (var i = 0; i < w; ++i)
				for (var j = 0; j < h; ++j) 
					field[i][j] = false;
			// セット
			var count = 0;
			while (count < lifes) {
				var i = Math.floor(Math.random() * w);
				var j = Math.floor(Math.random() * h);
				if (field[i][j])
					continue;
				field[i][j] = true;
				count++;
			}
		}
	}

	window.LifeGame = LifeGame;

})();

