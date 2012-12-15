
framework = $.processing.framework
Scene = framework.Scene

WIDTH = 400
HEIGHT = 300
FPS = 30
CELL_WIDTH = 10
CELL_HEIGHT = 10
CELL_NUM_X = WIDTH / CELL_WIDTH
CELL_NUM_Y = HEIGHT / CELL_HEIGHT
CELL_NUM = CELL_NUM_X * CELL_NUM_Y
FIELD_X = 0
FIELD_Y = 0
FIELD_WIDTH = WIDTH
FIELD_HEIGHT= HEIGHT


class Start extends framework.Scene
	setup: (p) ->
		p.frameRate FPS
		p.size WIDTH, HEIGHT
		new GameMain


class GameMain extends framework.Scene
	setup: (p) ->
		@state = new logic.State
		@field = new logic.Field CELL_NUM_X, CELL_NUM_Y, @state
		false

	update: (p) ->
		keys = [p.UP, p.RIGHT, p.DOWN, p.LEFT]
		DIR = logic.DIRECTION
		dirs = [DIR.UP, DIR.RIGHT, DIR.DOWN, DIR.LEFT]
		for i in [0..keys.length-1]
			if framework.key.isPressed(keys[i])
				@field.snake.direct(dirs[i])
		if p.frameCount % (FPS/10) == 0
			@field.update()
			if @state.isEnd
				return new GameOver
		false

	draw: (p) ->
		p.background 255
		# body
		for b in @field.snake.body
			p.noStroke()
			if b is @field.snake.head()
				p.fill 0
			else
				p.fill 100
			@drawCell p, b
		# food
		p.fill 0, 0, 255
		@drawCell p, @field.food
		false

	drawCell: (p, pos) ->
		p.rect pos.x * CELL_WIDTH, pos.y * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT


class GameOver extends framework.Scene
	update: (p) ->
		if framework.key.isPressed(" ")
			return new GameMain
		false

	draw: (p) ->
		p.background 255
		p.fill 255, 0, 0
		p.textFont "Arial", 20
		s = "Game Over"
		w = p.textWidth s
		p.text s, (WIDTH-w)/2, HEIGHT/2
		p.textFont "Arial", 13
		s = "Press space key to restart"
		w = p.textWidth s
		p.text s, (WIDTH-w)/2, HEIGHT/2 + 30
		false


(exports ? this).scene =
	Start: Start

































