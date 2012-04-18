// (C) 2012 shin
(function() {

var INITIAL_PAGE = 0;
var TABLE_COLUMNS = 3;
var TABLE_ROWS = 3;
var PHOTO_MAX_WIDTH = 300;
var PHOTO_MAX_HEIGHT = 200;
var CCV_ASYNC = false;
//var FACE_COM = "2c58a97906cca473bf7295677b388852";
var FACE_COM = false;

//-------------------------------------------------
// initialize
//-------------------------------------------------
var initialize = function(video) {

	// 実際に表示する大きさを算出する（画素数は元のままでcssで縮小）
	var size = {};
	var w = video.videoWidth * PHOTO_MAX_HEIGHT / video.videoHeight;
	if (w < PHOTO_MAX_WIDTH) {
		// 高さに合わせる
		size.height = PHOTO_MAX_HEIGHT;
		size.width = w;
	} else {
		// 幅に合わせる
		size.height = video.videoHeight * PHOTO_MAX_WIDTH / video.videoWidth;
		size.width = PHOTO_MAX_WIDTH;
	}


	//---------------------------------------
	// 描画メソッド
	//---------------------------------------
	var drawHearts = function(canvas, face, stop) {
		if (!drawHearts.img) {
			var img = new Image();
			img.src = "img/heart.gif";
			drawHearts.img = img;
		}
		if (!drawHearts.img.complete) {
			return;
		}
		if (stop !== undefined && !stop) {
			if (canvas.dataset.timer)
				clearInterval(canvas.dataset.timer);
			canvas.dataset.timer = null;
			return;
		}
		if (!canvas.dataset.timer) {
			canvas.dataset.timer = setInterval(function() {
				var ctx = canvas.getContext("2d");
				ctx.drawImage(
					drawHearts.img, face.x, face.y, face.width, face.height);
			}, 200);
		}
	}



	//---------------------------------------
	// ページの設定
	//---------------------------------------
	var getName = function(name) {
		return $("<span>").html(name).attr("class", "name");
	}

	var pages = [
		//
		// page 0
		//
		[{
			name: getName("Denoise"),
			canvas: fx.canvas(),
			fx: function(face) {
				var cnvs = this.canvas;
				var tex = cnvs.texture(video);
				cnvs.draw(tex).denoise(15).update();
			}
		}, {
			name: getName("Vignette"),
			canvas: fx.canvas(),
			fx: function(face) {
				var cnvs = this.canvas;
				var tex = cnvs.texture(video);
				cnvs.draw(tex).vignette(0.4, 0.7).update();
			}
		}, {
			name: getName("Zoom Blur"),
			canvas: fx.canvas(),
			fx: function(face) {
				var w = video.videoWidth;
				var h = video.videoHeight;
				var cnvs = this.canvas;
				var tex = cnvs.texture(video);
				cnvs.draw(tex).zoomBlur(w/2, h/2, 0.3).update();
			}
		}, {
			name: getName("Triangle Blur"),
			canvas: fx.canvas(),
			fx: function(face) {
				var cnvs = this.canvas;
				var tex = cnvs.texture(video);
				cnvs.draw(tex).triangleBlur(20).update();
			}
		}, {
			name: getName("Lens Blur"),
			canvas: fx.canvas(),
			fx: function(face) {
				var cnvs = this.canvas;
				var tex = cnvs.texture(video);
				cnvs.draw(tex).lensBlur(12, 1, 0).update();
			}
		}, {
			name: getName("Swirl"),
			canvas: fx.canvas(),
			fx: function(face) {
				var w = video.videoWidth;
				var h = video.videoHeight;
				var cnvs = this.canvas;
				var tex = cnvs.texture(video);
				cnvs.draw(tex).swirl(w/2, h/2, h/2, 2).update();
			}
		}, {
			name: getName("Color Halftone"),
			canvas: fx.canvas(),
			fx: function(face) {
				var cnvs = this.canvas;
				var tex = cnvs.texture(video);
				cnvs.draw(tex).colorHalftone(0, 0, 0.25, 4).update();
			}
		}, {
			name: getName("Bulge Pinch"),
			canvas: fx.canvas(),
			fx: function(face) {
				var w = video.videoWidth;
				var h = video.videoHeight;
				var cnvs = this.canvas;
				var tex = cnvs.texture(video);
				cnvs.draw(tex).bulgePinch(w/2, h/2, h/2, 0.8).update();
			}
		}, {
			name: getName("Hexagonal Pixelate"),
			canvas: fx.canvas(),
			fx: function(face) {
				var cnvs = this.canvas;
				var tex = cnvs.texture(video);
				cnvs.draw(tex).hexagonalPixelate(0, 0, 10).update();
			}
		}, {
			name: getName("Noise"),
			canvas: fx.canvas(),
			fx: function(face) {
				var cnvs = this.canvas;
				var tex = cnvs.texture(video);
				cnvs.draw(tex).noise(0.5).update();
			}
		}],
		//
		// page 1
		//
		[{
			name: getName("Solarize"),
			canvas: document.createElement("canvas"),
			fx: function(face) {
				var w = video.videoWidth;
				var h = video.videoHeight;
				var cnvs = this.canvas;
				var ctx = cnvs.getContext("2d");
				ctx.drawImage(video, 0, 0, w, h);
				var data = ctx.getImageData(0, 0, w, h);
				JSManipulate.solarize.filter(data);
				ctx.putImageData(data, 0, 0);
			}
		}, {
			name: getName("Sine Ripples"),
			canvas: document.createElement("canvas"),
			fx: function(face) {
				var w = video.videoWidth;
				var h = video.videoHeight;
				var cnvs = this.canvas;
				var ctx = cnvs.getContext("2d");
				ctx.drawImage(video, 0, 0, w, h);
				var data = ctx.getImageData(0, 0, w, h);
				JSManipulate.sineripple.filter(data, {
					xamplitude: 10, yamplitude: 10,
					xwavelength: 20, ywavelenth: 20
				});
				ctx.putImageData(data, 0, 0);
			}
		}, {
			name: getName("Posterize"),
			canvas: document.createElement("canvas"),
			fx: function(face) {
				var w = video.videoWidth;
				var h = video.videoHeight;
				var cnvs = this.canvas;
				var ctx = cnvs.getContext("2d");
				ctx.drawImage(video, 0, 0, w, h);
				var data = ctx.getImageData(0, 0, w, h);
				JSManipulate.posterize.filter(data, { levels: 8 });
				ctx.putImageData(data, 0, 0);
			}
		}, {
			name: getName("Sparkle"),
			canvas: document.createElement("canvas"),
			fx: function(face) {
				var w = video.videoWidth;
				var h = video.videoHeight;
				var cnvs = this.canvas;
				var ctx = cnvs.getContext("2d");
				ctx.drawImage(video, 0, 0, w, h);
				var data = ctx.getImageData(0, 0, w, h);
				JSManipulate.sparkle.filter(data, {
					rays: 50, size: 25, amount: 50,
					randomness: 25, centerx: w/2, centery: h/2
				});
				ctx.putImageData(data, 0, 0);
			}
		}, {
			name: getName("Dither"),
			canvas: document.createElement("canvas"),
			fx: function(face) {
				var w = video.videoWidth;
				var h = video.videoHeight;
				var cnvs = this.canvas;
				var ctx = cnvs.getContext("2d");
				ctx.drawImage(video, 0, 0, w, h);
				var data = ctx.getImageData(0, 0, w, h);
				JSManipulate.dither.filter(data, {
					levels: 3, color: true
				});
				ctx.putImageData(data, 0, 0);
			}
		}, {
			name: getName("Face Detection"),
			canvas: document.createElement("canvas"),
			fx: function(face) {
				var cnvs = this.canvas;
				var ctx = cnvs.getContext("2d");
				ctx.drawImage(
					video, 0, 0, video.videoWidth, video.videoHeight);
				if (face)
					ctx.strokeRect(face.x, face.y, face.width, face.height);
			}
		}, {
			name: getName("Hippopotamus"),
			canvas: fx.canvas(),
			fx: function(face) {
				var cnvs = this.canvas;
				var tex = cnvs.texture(video);
				if (face) {
					var hw = face.width / 2;
					var hh = face.height / 2;
					var cx = face.x + hw;
					var cy = face.y + hh;
					cnvs.draw(tex).bulgePinch(
						cx, cy + hh/2, hw, 0.6).update();
				} else {
					cnvs.draw(tex).update();
				}
			}
		}, {
			name: getName("Chipmunk"),
			canvas: fx.canvas(),
			fx: function(face) {
				var cnvs = this.canvas;
				var tex = cnvs.texture(video);
				if (face) {
					var hw = face.width / 2;
					var hh = face.height / 2;
					var cx = face.x + hw;
					var cy = face.y + hh;
					cnvs.draw(tex)
						.bulgePinch(cx - hw/2, cy + hh/2.2, hw/2, 0.7)
						.bulgePinch(cx + hw/2, cy + hh/2.2, hw/2, 0.7)
						.bulgePinch(cx - hw/2, cy + hh/1.2, hw/2, 0.8)
						.bulgePinch(cx + hw/2, cy + hh/1.2, hw/2, 0.8)
						.update();
				} else {
					cnvs.draw(tex).update();
				}
			}
		}, {
			name: getName("Swirl Nose"),
			canvas: fx.canvas(),
			fx: function(face) {
				var cnvs = this.canvas;
				var tex = cnvs.texture(video);
				if (face) {
					var hw = face.width / 2;
					var hh = face.height / 2;
					var cx = face.x + hw;
					var cy = face.y + hh;
					cnvs.draw(tex)
						.swirl(cx, cy + hh/4, hw/3.5, 3.5)
						.update();
				} else {
					cnvs.draw(tex).update();
				}
			}
/*		}, {
			name: getName("Lovesickness"),
			canvas: document.createElement("canvas"),
			fx: function(face) {
				var cnvs = this.canvas;
				var ctx = cnvs.getContext("2d");
				ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
				if (face) {
					drawHearts(cnvs, face);
				}
			}
*/
		}]
	];

	// 現在のページ番号
	var current = null;

	//---------------------------------------
	// DOMの構築
	//---------------------------------------
	// ページはliを利用する
	var ul = $("<ul>");
	for (var n = 0; n < pages.length; ++n) {
		var li = $("<li>");
		// 写真はtableで配置する
		var table = $("<table>");
		// 1ページ最大TABLE_COLUMNS*TABLE_ROWS
		for (var i = 0; i < TABLE_ROWS; ++i) {
			var tr = $("<tr>");
			for (var j = 0; j < TABLE_COLUMNS; ++j) {
				var td = $("<td>");
				// pages[n]の写真数がCOLUMNS*ROWS以下だった時の
				// 空き部分はダミーにする
				var k = i * TABLE_ROWS + j;
				if (k < pages[n].length) {
					td.append(pages[n][k].canvas, pages[n][k].name);
				} else {
					td.addClass("dummy");
				}
				// サイズをセットしておく
				td.css(size);
				td.find("canvas").css(size).attr({
					width: video.videoWidth,
					height: video.videoHeight
				});;
				tr.append(td);
			}
			table.append(tr);
		}
		ul.append(li.append(table));
	}
	
	ul.css("opacity", 0);
	$("#content .mode-select .view").append(ul);
	// 少し遅らせる演出
	setTimeout(function() {
		ul.animate({opacity: 1}, 1000);
	}, 500);

	ul.css({width: size.width*3+4, height: size.height*3+4});

	ul.anythingSlider({
		buildArrows: false,
		buildNavigation: false,
		buildStartStop: false,
		startPanel: current + 1,
		hashTags: false
	});
	
	//---------------------------------------
	// ページナビゲーション
	//---------------------------------------
	var pswitch = $("#content .mode-select .page-switch");

	var changePage = function(n) {
		if (n == current)
			return;
		if (n >= pages.length)
			n = 0;
		else if (n < 0)
			n = pages.length - 1;
		current = n;
		var spans = pswitch.find("span");
		spans.filter(".active").removeClass("active");
		spans.eq(n).addClass("active");
		ul.data("AnythingSlider").gotoPage(n+1);
	}

	for (var i = 0; i < pages.length; ++i) {
		var span = $("<span>");
		pswitch.append(span);
		span.data("page-number", i);
		(function(i) {
			span.click(function() { changePage(i); });
		})(i);
	}
	$("#content .mode-select .pagebtn.back").click(function() {
		var n = current - 1;
		if (current == 0)
			n = pages.length - 1;
		changePage(n);
	});
	$("#content .mode-select .pagebtn.next").click(function() {
		var n = current + 1;
		if (current == pages.length - 1)
			n = 0
		changePage(n);
	});

	
	//---------------------------------------
	// メインループ
	//---------------------------------------
	var face = null;
	var mainLoop = function() {
		// 顔認識用にcanvasを作成 & videoから読み込み
		var canvas = document.createElement("canvas");
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
		if (!FACE_COM) {
			// ccv.jsによる顔認識。オーバーヘッドが大きいので単独スレッドにする。
			// しかしながら、転送のオーバーヘッドは大きい。
			// ccv.js自体にWorkerスレッド機能があるが、ここでは使用しない。
			var updateFace = function(comp) {
				if (comp && comp.length > 0)
					face = comp[0];
				else
					face = null;
			}
			//ccv.grayscale(canvas);
			if (CCV_ASYNC) {
				ccv.detect_objects({
					canvas: canvas,
					cascade: cascade,
					interval: 5,
					min_neighbors: 1,
					worker: 1,
					async: true
				})(updateFace);
			} else {
				var comp = ccv.detect_objects({
					canvas: canvas,
					cascade: cascade,
					interval: 5,
					min_neighbors: 1
				});
				updateFace(comp);
			}
		} else {
			// face.com apiを利用
			console.log("Face detection by face.com is not supported yet.");
		}
		// カレントページのcanvasのみ再描画
		var page = pages[current];
		for (var i = 0; i < page.length; ++i)
			page[i].fx(face);
	};


	//---------------------------------------

	

	var mainLoopID = null;

	// コントロールボタン
	var btnPlayPause = $("#content .btns .play_pause").click(function() {
		if (btnPlayPause.hasClass("pause")) {
			btnPlayPause.removeClass("pause").addClass("play");
			clearInterval(mainLoopID);
			video.pause();
		} else {
			btnPlayPause.removeClass("play").addClass("pause");
			mainLoopID = setInterval(function() { mainLoop(); }, 1000);
			video.play();
		}
	});


	// 初期ページ
	changePage(INITIAL_PAGE);
	btnPlayPause.click();


/*
	setInterval(function() {
		clearInterval(mainLoopID);
		video.pause();
	}, 10000);
*/

}

//-------------------------------------------------
// startup
//-------------------------------------------------
$(function() {

	// ローディングが要らないくらい早かった
/*
	var end = false;
	var loading = $("#content .view .loading").lettering();
	var intro = function() {
		if (end)
			return;
		loading.animateLetters(
			{top: 10, opacity: 0},
			{top: 0, opacity: 1},
			{randomOrder: false, time: 2000}, function() {
				outro();
			});
	}
	var outro = function() {
		if (end)
			return;
		loading.animateLetters(
			{top: 0, opacity: 1},
			{top: 10, opacity: 0},
			{randomOrder: false, time: 2000}, function() {
				intro();
			});
	}
	intro();

			end = true;
			loading.hide();
*/

	// 手抜き事前チェック
	if (!navigator.webkitGetUserMedia) {
		console.log("WebRTC is not supported");
		return;
	}
	
	// videoの作成。WebRTCのセットアップ。
	var video = document.createElement("video");
	navigator.webkitGetUserMedia("audio, video",
		function(stream) {
			video.src = webkitURL.createObjectURL(stream);
			video.play();
			readyVideoSize();
		},
		function(err) {
			console.log(err);
		});

	// videoのサイズが出るまで待つ
	var readyVideoSize = function() {
		if (video.videoWidth > 0 && video.videoHeight > 0) {
			initialize(video);
			return;
		}
		setTimeout(function() {
			readyVideoSize();
		}, 300);
	}


});


})();
