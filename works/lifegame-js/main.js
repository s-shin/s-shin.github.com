window.addEventListener("load", function() {

	var $ = function(sel) { return document.querySelector(sel); }
	
	var game = null;
	var tds = null;
	
	var setupTable = function(game, target) {
		var width = game.width, height = game.height;
		var table = document.createElement("table");
		var tds = new Array(width);
		for (var i = 0; i < width; ++i) {
			var tr = document.createElement("tr");
			tds[i] = new Array(height);
			for (var j = 0; j < height; ++j) {
				var td = document.createElement("td");
				tr.appendChild(td);
				tds[i][j] = td;
			}
			table.appendChild(tr);
		}
		// クリックで編集可能に
		for (var i = 0; i < width; ++i) {
			for (var j = 0; j < height; ++j) {
				(function(i, j) {
					tds[i][j].addEventListener("click", function() {
						game.field[i][j] = !game.field[i][j];
						game.draw();
					});
				})(i, j);
			}
		}
		var t = document.querySelector(target);
		if (t.firstChild)
			t.removeChild(t.firstChild);
		t.appendChild(table);
		return tds;
	}
	
	var drawCell = function(game, x, y, tds) {
		if (game.field[x][y])
			tds[x][y].className = "life";
		else
			tds[x][y].className = "";
	}
	
	var phase = 1;
	var changePhase = function(to) {
		$(".phase" + phase).style.display = "none";
		phase = to;
		$(".phase" + phase).style.display = "block";
	}
	
	var timer = null;
	var play = function() {
		var t = $(".phase2 .play");
		if (timer) {
			clearInterval(timer);
			timer = 0;
			t.innerHTML = "再生";
		} else {
			timer = setInterval(function() {
				game.update();
				game.draw();
			}, 100);
			t.innerHTML = "停止";
		}
	}
	
	$(".phase1 .ok").addEventListener("click", function() {
		var tds = null;
		var w = parseInt($(".phase1 .width").value);
		var h = parseInt($(".phase1 .height").value);
		if (!w || !h)
			return alert("入力に不備があります");
		game = new LifeGame({
			width: w, height: h,
			drawCell: function(game, x, y) {
				drawCell(game, x, y, tds);
			}
		});
		tds = setupTable(game, ".lifegame");
		changePhase(phase+1);
	});
	$(".phase1 .quick").addEventListener("click", function() {
		var tds = null;
		game = new LifeGame({
			width: 100, height: 100,
			drawCell: function(game, x, y) {
				drawCell(game, x, y, tds);
			},
			setupField: function(game) {
				LifeGame.Tool.setupFieldAtRandom(game, 0.5);
			}
		});
		tds = setupTable(game, ".lifegame");
		changePhase(phase+1);
		play();
	});
	
	$(".phase2 .random").addEventListener("click", function() {
		LifeGame.Tool.setupFieldAtRandom(game, 0.5);
		game.draw();
	});
	
	$(".phase2 .clear").addEventListener("click", function() {
		LifeGame.Tool.setupFieldAtRandom(game, 0);
		game.draw();
	});

	$(".phase2 .play").addEventListener("click", function() {
		play();
	});
	
	

});


