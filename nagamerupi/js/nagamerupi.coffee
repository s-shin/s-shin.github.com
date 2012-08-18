
class NagameruPi
	constructor: (@separatorWidth = 1) ->
		@win = $ window
		@doc = $ document
		@content = $ "#content"
		@content.empty() # no more need
		@pi = new SpigotPi (v) => @update(v);
		# state
		@isFirst = true;
		@setContentWidth 50 # @numX = 50
		@scrollable = true
		@stopped = false;
		@speed = 300 # ms

	update: (s) ->
		span = $("<span>").html(s).hide().fadeIn @speed, () =>
			if @isFirst
				@isFirst = false
				@update ".<br />"
			else if not @stopped
				@pi.step()
		# view
		@content.append span # show
		d = @pi.digits()
		if d > 1
			span.attr "data-digits", d
			span.addClass "d10" if d % 10 is 0
			span.addClass "d50" if d % 50 is 0
			if d % @numX is 0
				@scrollable = @doc.height() <= @win.height() + @win.scrollTop()
			else if d % @numX is 2 && @scrollable
				$.scrollTo @doc.height(), 500

	start: () ->
		@stopped = false
		@pi.step()

	stop: () ->
		@stopped = true

	setContentWidth: (@numX) ->
		@updateContentWidth()

	updateContentWidth: () ->
		letterWidth = @content.find("span:eq(0)").width()
		@content.width \
			letterWidth * @numX + @separatorWidth * Math.ceil(@numX / 10)

			
$ ->
	content = $ "#content"
	np = new NagameruPi
	np.start()

	# setup events
	do ->
		playStop = $ "header nav .playStop"
		playStop.click () ->
			if playStop.hasClass "playing"
				np.stop()
			else
				np.start()
			playStop.toggleClass "playing"

		config = $ "header nav .config"
		config.click () ->
			$("header div.configArea").toggle 500
		
	do ->
		target = $ "header div.configArea section.width div"
		value = $ "header div.configArea section.width h1 span"
		resize = (v) ->
			np.setContentWidth v
			value.text v
		target.slider
			min: 40
			max: 60,
			value: 50, # default value
			slide: (ev, ui) -> resize ui.value
		resize target.slider("value")

	do ->
		target = $ "header div.configArea section.font input"
		change = (f, s) ->
			content.css
				"font-family": f, "font-size": s
			np.updateContentWidth()
		target.eq(0).val content.css("font-family")
		target.eq(1).val content.css("font-size")
		target.blur () ->
			change target.eq(0).val(), target.eq(1).val()
		target.keypress (e) ->
			if e.which is 13 # Enter
				change target.eq(0).val(), target.eq(1).val()

	do ->
		target = $ "header div.configArea section.guide input"
		target.click () ->
			content.toggleClass "guide"
















































