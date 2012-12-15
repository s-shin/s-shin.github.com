
rand = (x) -> Math.floor (Math.random() * x)

find = (arr, func) ->
	for v in arr
		if func v then return v
	

DIRECTION = UP: 1, RIGHT: 2, DOWN: 3, LEFT: 4


class Position
	constructor: (@x, @y) ->
		# do nothing

	equal: (p) ->
		@x is p.x && @y is p.y


class SnakeBody extends Position
	constructor: (@direction, @x, @y) ->
		# do nothing

	goTo: (direction, isReverse) ->
		s = if isReverse then -1 else 1
		switch direction
			when DIRECTION.UP then @y -= s
			when DIRECTION.RIGHT then @x += s
			when DIRECTION.DOWN then @y += s
			when DIRECTION.LEFT then @x -= s

	update: () ->
		@goTo @direction
		

class Snake
	constructor: (direction, x, y) ->
		@body = [new SnakeBody direction, x, y]

	head: () -> @body[0]
	tail: () -> @body[@body.length-1]
	direct: (direction) -> @head().direction = direction

	eat: () ->
		t = @tail()
		t = new SnakeBody t.direction, t.x, t.y
		t.goTo t.direction, true
		@body.push t

	update: () ->
		@body[i].update() for i in [0..@body.length-1]
	

class Food extends Position
	constructor: (@width, @height) ->
		@random()

	random: () ->
		@x = rand @width
		@y = rand @height	


class Field
	constructor: (@width, @height, @state, @isWall=false) ->
		@snake = new Snake DIRECTION.RIGHT, 0, 0
		@food = new Food @width, @height

	setFood: () ->
		food = @food
		food.random() while (find @snake.body, (b) -> b.equal(food))?

	isOutside: (p) ->
		p.x >= @width or p.x < 0 or p.y >= @height or p.y < 0

	update: () ->
		@snake.update()
		body = @snake.body
		head = @snake.head()
		for b in body
			# 場外かチェック
			if @isOutside(b)
				# 壁があるなら終了
				if @isWall
					@state.end()
					return
				# 逆から出てくる
				b.x = (b.x + @width) % @width
				b.y = (b.y + @height) % @height
			# headとbodyがぶつかっているか
			if b isnt head and head.equal b
				@state.end()
				return
		# 逆順に方向を修正
		if body.length > 1
			body[i].direction = body[i-1].direction for i in [body.length-1..1]
		# 食べたか判定
		if head.equal @food
			@snake.eat()
			@setFood()


class State
	constructor: (@event={}) ->
		@isEnd = false
		
	end: () ->
		@isEnd = true
		@event.onEnd?()


(exports ? this).logic =
	Snake: Snake,
	Food: Food,
	Field: Field,
	State: State	
	DIRECTION: DIRECTION




















