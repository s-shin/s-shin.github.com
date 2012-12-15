// -*- tab-width: 4; -*-

// [ToDo]
// left, right, automatic open
//

(function($) {

	var Mine = function() { this.initialize.apply(this, arguments); }
	Mine.CHECK_MODE = { OPEN: 0, FLAG: 1, QUESTION: 2 }
	Mine.prototype = {
		// initialize Mine object
		initialize: function(options) {
			var that = this;
			var isFirstClick = false;
			//-----------------------------------------
			// 'opt' property is option of the game.
			// This property DO NOT change in program without initialization.
			var opt = this.opt = {
				// bombs ratio or num. if gt 1 then bomb nums.
				bombs: 0.1,
				// field size ('num' is automatically set)
				field: { x: 10, y: 10, num: null },
				// specific mark showed
				mark: { bomb: "B", flag: "F", question: "?" },
				// can use selector/element/...
				dom: {
					// make table in this element
					target: "#mine"
				},
				// called on ...
				event: {
					gameOver: function() { alert("Game Over!!!"); },
					gameClear: function() { alert("Game Clear!!!"); },
					flagChanged: function(bombNum, flagNum) {},
					timer: function(s) {}
				}
			}
			$.extend(true, opt, options);
			opt.field.num = opt.field.x * opt.field.y;
			opt.bombs = opt.bombs > 1 ? opt.bombs :
				opt.field.x * opt.field.y * opt.bombs;
			opt.event.flagChanged(opt.bombs, 0);
			//-----------------------------------------
			// 'dom' property has the doms to handle.
			var dom = this.dom = {
				target: $(opt.dom.target),
				table: $("<table>"),
				field: new Array(opt.field.x) // array of $("<td>")
			};
			// init dom tree
			dom.target.empty();
			for (var i = 0; i < opt.field.y; ++i) {
				dom.field[i] = new Array(opt.field.y);
			}
			for (var y = 0; y < opt.field.y; ++y) {
				var tr = $("<tr>");
				for (var x = 0; x < opt.field.x; ++x) {
					dom.field[x][y] = $("<td>");
					// directly set property on dom 
					dom.field[x][y][0].pos = { x: x, y: y };
					// event
					$(dom.field[x][y]).bind("click.mine", function() {
						if (!isFirstClick &&
							data.checkMode != Mine.CHECK_MODE.FLAG &&
							data.checkMode != Mine.CHECK_MODE.QUESTION) {
							that.setup(this.pos);
							isFirstClick = true;
						}
						that.onClickField(this.pos);
					});
					tr.append(dom.field[x][y]);
				}
				dom.table.append(tr);
			}
			dom.target.append(dom.table);
			//-----------------------------------------
			// 'data' property has the game data.
			var data = this.data = {
				field: (function() {
					var a = new Array(opt.field.x) 
					for (var i = 0; i < opt.field.x; ++i) {
						a[i] = new Array(opt.field.y);
						for (var j = 0; j < opt.field.y; ++j) {
							// field[i][j] = a[i][j]
							a[i][j] = {
								isBomb: false,
								mode: Mine.CHECK_MODE.OPEN,
								bombsAround: 0, // isBomb == true -> -1
								opened: false
							}
						}
					}
					return a;
				}()),
				checkMode: Mine.CHECK_MODE.OPEN,
				openedNum: 0, // use in checking game clear
				flagNum: 0,
				timer: null
				//isOpenAround: false
			};
		},
		// setup field
		setup: function(safepos) {
			var data = this.data, dom = this.dom, opt = this.opt;
			// set bomb except safepos
			for (var i = 0; i < opt.bombs; ++i) {
				var x = Math.floor(Math.random() * opt.field.x);
				var y = Math.floor(Math.random() * opt.field.y);
				if (!data.field[x][y].isBomb &&
					!(safepos && (safepos.x == x && safepos.y == y))) {
					data.field[x][y].isBomb = true;
				} else {
					--i;
				}
			}
			// calc bombs around
			for (var x = 0; x < opt.field.x; ++x) {
				for (var y = 0; y < opt.field.y; ++y) {
					var c = 0;
					if (!data.field[x][y].isBomb) {
						for (var xx = x-1; xx <= x+1; ++xx) {
							for (var yy = y-1; yy <= y+1; ++yy) {
								if (xx < 0 || yy < 0 ||
									xx >= opt.field.x || yy >= opt.field.y) {
									continue;
								}
								if (data.field[xx][yy].isBomb) {
									++c;
								}
							}
						}
						data.field[x][y].bombsAround = c;
						dom.field[x][y].addClass("mine-bombsAround-" + c);
					} else {
						data.field[x][y].bombsAround = -1;
						dom.field[x][y].addClass("mine-isBomb");
					}
				}
			}
			// timer start
			(function() {
				var s = 0;
				data.timer = setInterval(function() {
					opt.event.timer(++s);
				}, 1000);
			}())
			opt.event.timer(0);
		},
		// unbind all event
		unbindAll: function() {
			$("*").unbind(".mine");
			clearInterval(this.data.timer);
		},
		// handler on clicking
		onClickField: function(pos) {
			var data = this.data, dom = this.dom, opt = this.opt;
			var x = pos.x, y = pos.y;
			if (data.field[x][y].opened) {
				if (data.checkMode != Mine.CHECK_MODE.OPEN) {
					return;
				}
			}
			// branch by checkMode
			switch (data.checkMode) {
			case Mine.CHECK_MODE.FLAG:
				switch (data.field[x][y].mode) {
				case Mine.CHECK_MODE.FLAG:
					data.field[x][y].mode = Mine.CHECK_MODE.OPEN;
					dom.field[x][y]
						.text("")
						.removeClass("mine-isFlag");
					opt.event.flagChanged(opt.bombs, --data.flagNum);
					break;
				case Mine.CHECK_MODE.QUESTION:
					data.field[x][y].mode = Mine.CHECK_MODE.FLAG;
					dom.field[x][y]
						.text(opt.mark.flag)
						.removeClass("mine-isQuestion")
						.addClass("mine-isFlag");
					opt.event.flagChanged(opt.bombs, --data.flagNum);
					break;
				case Mine.CHECK_MODE.OPEN:
					data.field[x][y].mode = Mine.CHECK_MODE.FLAG;
					dom.field[x][y]
						.text(opt.mark.flag)
						.addClass("mine-isFlag");
					if (data.flagNum < opt.bombs) {
						opt.event.flagChanged(opt.bombs, ++data.flagNum);
					}
					break;
				}
				break;
			case Mine.CHECK_MODE.QUESTION:
				switch (data.field[x][y].mode) {
				case Mine.CHECK_MODE.FLAG:
					data.field[x][y].mode = Mine.CHECK_MODE.QUESTION;
					dom.field[x][y]
						.text(opt.mark.question)
						.removeClass("mine-isFlag")
						.addClass("mine-isQuestion");
					opt.event.flagChenged(opt.bombs, --data.flagNum);
					break;
				case Mine.CHECK_MODE.QUESTION:
					data.field[x][y].mode = Mine.CHECK_MODE.OPEN;
					dom.field[x][y]
						.text("")
						.removeClass("mine-isQuestion");
					break;
				case Mine.CHECK_MODE.OPEN:
					data.field[x][y].mode = Mine.CHECK_MODE.QUESTION;
					dom.field[x][y]
						.text(opt.mark.question)
						.addClass("mine-isQuestion");
					break;
				}
				break;
			case Mine.CHECK_MODE.OPEN:
				switch (data.field[x][y].mode) {
				case Mine.CHECK_MODE.FLAG:
					// do nothing
					break;
				case Mine.CHECK_MODE.QUESTION: // implicitly QUESTION -> OPEN
				case Mine.CHECK_MODE.OPEN:
					if (data.field[x][y].opened) {
						this.openAround(pos);
					} else {
						this.open(pos);
					}
					break;
				}
				break;
			}
		},
		// open the position in field
		open: function(pos) {
			var data = this.data, dom = this.dom, opt = this.opt;
			var x = pos.x, y = pos.y;
			if (data.field[x][y].isBomb) {
				// game over
				this.unbindAll();
				dom.table.addClass("mine-isGameOver");
				// show all bombs
				dom.table.find(".mine-isBomb").text(opt.mark.bomb);
				opt.event.gameOver();
			} else {
				var tOpen = function(x, y) {
					data.field[x][y].opened = true;
					dom.field[x][y]
						.removeClass("mine-isQuestion")
						.addClass("mine-opened");
					data.openedNum++;
				}
				// if 0, open around recursively and unbind click event
				// ToDo: code too much? can be more simple?
				if (data.field[x][y].bombsAround == 0) {
					(function(pos) {
						var x = pos.x, y = pos.y;
						if (data.field[x][y].opened) {
							return;
						}
						// open 0. not draw.
						dom.field[x][y].text("");
						tOpen(x, y);
						// open around
						for (var xx = x - 1; xx <= x + 1; ++xx) {
							for (var yy = y - 1; yy <= y + 1; ++yy) {
								// ignore out of range & flagged
								if (xx < 0 || yy < 0 ||
									xx >= opt.field.x || yy >= opt.field.y ||
									(xx == x && yy == y) ||
									data.field[xx][yy].mode == Mine.CHECK_MODE.FLAG) {
									continue;
								}
								if (data.field[xx][yy].bombsAround == 0) {
									// recursively
									arguments.callee({ x: xx, y: yy });
								}
								if (!data.field[xx][yy].opened) {
									dom.field[xx][yy]
										.text(data.field[xx][yy].bombsAround);
									tOpen(xx, yy);
								}
							}
						}
					}(pos));
				} else {
					dom.field[x][y].text(data.field[x][y].bombsAround);
					tOpen(x, y);
				}
			}
			// check game clear
			if (data.openedNum == opt.field.num - opt.bombs) {
				this.unbindAll();
				opt.event.gameClear();
			}
		},
		// open around when flags of number of bombs around are set.
		openAround: function(pos) {
			var data = this.data, dom = this.dom, opt = this.opt;
			var x = pos.x, y = pos.y;
			if (data.field[x][y].bombsAround > 0) {
				// count flags around
				var flags = 0;
				for (var xx = x - 1; xx <= x + 1; ++xx) {
					for (var yy = y - 1; yy <= y + 1; ++yy) {
						if (xx < 0 || yy < 0 ||
							xx >= opt.field.x || yy >= opt.field.y ||
							(xx == x && yy == y) ||
							data.field[xx][yy].opened) {
							continue;
						}
						if (data.field[xx][yy].mode == Mine.CHECK_MODE.FLAG) {
							++flags;
						}
					}
				}
				if (flags == data.field[x][y].bombsAround) {
					for (var xx = x - 1; xx <= x + 1; ++xx) {
						for (var yy = y - 1; yy <= y + 1; ++yy) {
							if (xx < 0 || yy < 0 ||
								xx >= opt.field.x || yy >= opt.field.y ||
								(xx == x && yy == y) ||
								data.field[xx][yy].mode == Mine.CHECK_MODE.FLAG ||
								data.field[xx][yy].opened) {
								continue;
							}
							// ToDo: OK?
							this.open({x: xx, y: yy});
						}
					}
				}
			}
		},
		// change check mode
		// This method is often called components.
		setCheckMode: function(mode) {
			var data = this.data, dom = this.dom, opt = this.opt;
			switch (data.checkMode) {
			case Mine.CHECK_MODE.OPEN:
				switch (mode) {
				case Mine.CHECK_MODE.OPEN:
					break;
				case Mine.CHECK_MODE.FLAG:
					data.checkMode = Mine.CHECK_MODE.FLAG;
					dom.table.addClass("mine-checkMode-flag");		
					break;
				case Mine.CHECK_MODE.QUESTION:
					data.checkMode = Mine.CHECK_MODE.QUESTION;
					dom.table.addClass("mine-checkMode-question");		
					break;
				}
				break;
			case Mine.CHECK_MODE.FLAG:
				switch (mode) {
				case Mine.CHECK_MODE.OPEN:
					data.checkMode = Mine.CHECK_MODE.OPEN;
					dom.table.removeClass("mine-checkMode-flag");
					break;
				case Mine.CHECK_MODE.FLAG:
					break;
				case Mine.CHECK_MODE.QUESTION:
					data.checkMode = Mine.CHECK_MODE.QUESTION;
					dom.table
						.removeClass("mine-checkMode-flag")
						.addClass("mine-checkMode-question");
					break;
				}
				break;
			case Mine.CHECK_MODE.QUESTION:
				switch (mode) {
				case Mine.CHECK_MODE.OPEN:
					data.checkMode = Mine.CHECK_MODE.OPEN;
					dom.table.removeClass("mine-checkMode-question");
					break;
				case Mine.CHECK_MODE.FLAG:
					data.checkMode = Mine.CHECK_MODE.FLAG;
					dom.table
						.removeClass("mine-checkMode-question")
						.addClass("mine-checkMode-flag");
					break;
				case Mine.CHECK_MODE.QUESTION:
					break;
				}
				break;
			}
		}
	};

	//---------------------------------------------
	// Mine.Component
	Mine.Component = {};

	// factory method of components
	Mine.Component.create = function(mine, name, op) {
		switch (name) {
		case Mine.Component.CheckMode.NAME:
			return new Mine.Component.CheckMode(mine, op);
		}
	};

	// Mine.Component.CheckMode class
	Mine.Component.CheckMode = function() {
		this.initialize.apply(this, arguments); 
	}
	Mine.Component.CheckMode.NAME = "CheckMode";
	Mine.Component.CheckMode.prototype = {
		initialize: function(mine, options) {
			this.mine = mine;
			var opt = this.opt = {
				// radio
				type: "radio",
				open: "#mine-component-checkMode-open",
				flag: "#mine-component-checkMode-flag",
				question: "#mine-component-checkMode-question"
				// order
				//type: "order",
				//button: "#mine-component-checkMode-button",
				//order: ["open", "flag", "question"]
			}
			$.extend(true, opt, options);
			switch (opt.type) {
			case "radio":
				this.setupRadio();
				break;
			case "order":
				//this.setupOrder();
				break;
			}
		},
		setupRadio: function() {
			var mine = this.mine, opt = this.opt;
			var cm = Mine.CHECK_MODE;
			$(opt.open).bind("click.mine", function() {
				mine.setCheckMode(cm.OPEN);
			});
			$(opt.flag).bind("click.mine", function() {
				mine.setCheckMode(cm.FLAG);
			});
			$(opt.question).bind("click.mine", function() {
				mine.setCheckMode(cm.QUESTION);
			});
		},
		setupOrder: function() {
		}
	}

	//-------------------------------------------------

	$.fn.mine = function(op) {
		for (var i = 0; i < this.length; ++i) {
			var that = $(this[i]);
			var mine = that.data("mine");
			if (!mine) {
				mine = new Mine(op);
				that.data("mine", mine);
			} else {
				mine.initialize(op);
			}
		}
		return this;
	}
	$.fn.mineComponent = function(name_option) {
		for (var i = 0; i < this.length; ++i) {
			var that = $(this[i]);
			var mine = that.data("mine");
			for (var k in name_option) {
				Mine.Component.create(mine, k, name_option[k]);
			}
		}
		return this;
	}

}(jQuery));
