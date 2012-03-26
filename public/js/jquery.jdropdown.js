/**
 * Jdropdown
 *
 * @author Sam Millman
 * @licence GNU or whatever
 *
 * This plugin basically allows you to connect a menu to an anchor.
 * This anchor can be literally anything, from a <div/> to an <a/> and even a <li/>.
 */
(function($){
	var methods = {
		init: function(options){
			return this.each(function(){
				var $this = $(this),
				items = $this.data('items');

				if(!$this.data('jdropdown')){
					$(options.container).addClass("jdropdown-menu");
					$(this).addClass('jdropdown-anchor').data('jdropdown', {
						'items': typeof items === 'object' ? items : options.items,
						'anchor': $(this),
						'menu': $(options.container),
						'options': options
					}).on({ 'click': open });
				}
				return this;
			});
		},
		destroy: function(){}
	},
	open = function(event){
		event.preventDefault();
		if($(this).hasClass('jdropdown-active')){
			close();
			return;
		}else{
			close();
		}

		var data  = $(this).data('jdropdown'),
		offset = $(this).offset(),
		container = data.menu;
		container.data('jdropdown', data);
		container.empty();

		if($.isFunction(data.renderMenu)){
			if($.isFunction(data.renderItem)){
				var ul = data.renderItem(data.renderMenu(), data.items);
			}else{
				var ul = renderItem(data.renderMenu(), data.items);
			}
		}else{
			if($.isFunction(data.renderItem)){
				var ul = data.renderItem($( '<ul></ul>' ), data.items);
			}else{
				var ul = renderItem($( '<ul></ul>' ), data.items);
			}
		}
		ul.appendTo( container );

		if(data.options.orientation == 'left'){
			data.menu.css({
				'position': 'absolute',
				'left': offset.left,
				'top': (offset.top + $(this).outerHeight()),
				'display': 'block'
			});
		}else{
			data.menu.css({
				'position': 'absolute',
				'left': (offset.left - container.outerWidth()) + $(this).outerWidth(),
				'top': (offset.top + $(this).outerHeight()),
				'display': 'block'
			});
		}
		$(this).addClass('jdropdown-active').trigger('jdropdown.open');
	},
	renderItem = function($menu, $items){
		$.each($items, function(i, item){
			$('<li></li>').data('jdropdown.item', item).append(
				$( "<a></a>" ).attr({
					'href': '#', 'class': item['class']
				}).text( item.label ).on({ 'click': selectItem })
			).appendTo( $menu );
		});
		return $menu;
	},
	selectItem = function(){
		close();
		$(this).trigger('jdropdown.selectItem');
	},
	close = function(){
    	$('.jdropdown-menu').css({ 'display': 'none' }); //hide all drop downs
    	$('.jdropdown-anchor').removeClass("jdropdown-active");
		$(this).trigger('jdropdown.close');
	};

	$(document).on('click', function(e) {
	    // Lets hide the menu when the page is clicked anywhere but the menu.
	    var $clicked = $(e.target);
	    if (!$clicked.parents().hasClass("jdropdown-menu") && !$clicked.parents().hasClass("jdropdown-anchor") && !$clicked.hasClass("jdropdown-menu") && !$clicked.hasClass("jdropdown-anchor")){
	    	close();
		}
	});

	$.fn.jdropdown = function(method){
		// Method calling logic
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.j_slider' );
		}
	};
})(jQuery);

