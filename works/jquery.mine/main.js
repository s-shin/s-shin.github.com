
$(function() {
	var game = $("#game").hide();
	var setup = $("#setup");

	$("input[type=button]").click(function() {
		setup.hide();
		game.show();
		$("#message").text("");
		$("#status span:eq(0)").text("-");
		$("#checkMode input:eq(0)").click();
		
		// get field size & bombs rate
		var size = $("#setup .size option:selected").text().split("*");
		var rate = $("#setup .rate option:selected").text();
		rate = rate.substring(0, rate.length - 1) / 100;
		
		game.mine({
			bombs: rate,
			field: { x: size[0], y: size[1] },
			event: {
				flagChanged: function(bombs, flags) {
					$("#status span:eq(1)").text(bombs-flags);
				},
				timer: function(s) {
					$("#status span:eq(0)").text(s);
				},
				gameOver: function() {
					$("#message").text("Game Over!!!");
					setup.show();
				},
				gameClear: function() {
					$("#message").text("Game Clear!!!");
					setup.show();
				}
			}
		}).mineComponent({
			"CheckMode": {
				type: "radio",
				open: "#checkMode input:eq(0)",
				flag: "#checkMode input:eq(1)",
				question: "#checkMode input:eq(2)"
			}
		});
	});
});

