define(['jquery', 'jsrender', 'jquery.tools', 'jquery-ui', 'jquery.elastic', 'jquery.colorpicker'], function(jQuery) {
(function( $ ) {
  var inputTypes = {
    'text': {
      template: $.templates(null, "<input type='text' value='{{>val}}'>"),

      render: function(el, opts, change) {
	$(this.template.render(opts))
	    .appendTo($(el))
	    .keypress(function(ev) {
	      if (ev.keyCode === 13 /* ENTER */) {
		change($(this).val());
	      }
	    });
      }
    },


    'select': {
      template: $.templates(null, "<select class='magic-select'> {{for options ~val=val}} {{if (~val).toLowerCase() === (#data).toLowerCase()}}<option value='{{>#data }}' selected='selected'>{{:#data}}</option>{{else}}<option value='{{>#data }}'>{{:#data}}{{/if}}{{/for}}</select>"),

      render: function(el, opts, change) {
	$(this.template.render(opts))
	    .appendTo($(el))
	    .change(function(ev) {
	      change($(this).val());
	    });
      }
    },


    'textarea': {
      template: $.templates(null, "<form><div class='magic-tarea-tarea'><textarea class='magic-tarea'>{{:val}}</textarea></div><div class='magic-tarea-input'><input type='submit' value='Save'><a target='_blank' rel='#cheat-overlay' href='/markdown-cheatsheet'>Markdown cheatsheet</a></div></form>"),

      render: function(el, opts, change) {
	$(this.template.render(opts))
	    .appendTo($(el))
	    .submit(function(ev) {
	      change($(this).find("textarea").val());
	    })
	    .find('textarea')
	    .elastic();
	$(el).find('a[rel]').customOverlay();
      }
    },


    'date': {
      template: $.templates(null, "<input type='date' min='-1' value='{{>val}}'>"),

      render: function(el, opts, change) {
	$(this.template.render(opts))
	    .appendTo($(el))
	    .dateinput({
	      format: "dd/mm/yyyy",
	      firstDay: 1 /* Monday */
	    })
	    .change(function(ev) {
	      change($(this).val());
	    })
	    .keypress(function(ev) {
	      if (ev.keyCode === 13 /* ENTER */) {
		change($(this).val());
	      }
	    });
      }
    },


    'tag': {
      template: $.templates(null, "<span class='magic-tag-color'><div class='colorSelector'><div></div></div></span><span class='magic-tag-text'><input type='text' value='{{>text}}'></span>"),

      render: function(el, opts, change) {
	var c = $(this.template.render(opts));

	c.find('input:text')
	    .keypress(function(ev) {
	      if (ev.keyCode === 13 /* ENTER */) {
		change({
		  text: $(c).find('input:text').val(),
		  color: $(c).find('.colorSelector div').data('color')
		});
	      }
	    });
	
	$(c).find('.colorSelector')
	    .ColorPicker({
	      color: opts.color,
	      onShow: function(colpkr) {
		$(colpkr).fadeIn(100);
		return false;
	      },
	      onHide: function(colpkr) {
		$(colpkr).fadeOut(100);
		return false;
	      },
	      onChange: function(hsb, hex, rgb) {
		$(c).find('.colorSelector div')
		    .css('backgroundColor', '#' + hex)
		    .data('color', '#' + hex);
		
	      }
	    })
	    .find('div')
	    .css('backgroundColor', opts.color);

	$(el).append(c);
      }
    }
  };


  $.fn.subsClass = function(curClass, newClass) {
    return $(this).hasClass(curClass) ?
        $(this).removeClass(curClass).addClass(newClass) :
        $(this);
  };


  $.fn.magicedit2 = function(cl, type, opts, cb) {
    var it = inputTypes[type];
    var self = this;
    var oldContent = $(this).html();

    function cleanup() {
      if (self.hasClass(cl + '-edit')) {
	self.subsClass(cl + '-edit', cl)
	    .empty()
	    .html(oldContent);
      }
    }

    this.subsClass(cl, cl + '-edit')
	.empty();

    it.render(self, opts, function(newVal) {
      cleanup();
      cb(newVal);
    });

    $(document).on("keydown", function(ev) {
      if (ev.keyCode === 27 /* ESC */) {
	cleanup();
      }
    });
  };


  $.fn.customOverlay = function() {
    $(this).overlay({
      mask: {
	color: null,
	opacity: 0.6,
	maskId: 'mask'
      },
      onBeforeLoad: function() {
	this.getOverlay()
	    .find(".content-wrap")
	    .load(this.getTrigger().attr("href"));
      }
    });
  };



  $.fn.tagDroppable = function(opts) {
    $(this).droppable(_.defaults(opts, {
      accept: '#tagdrag .tags > .tagDragView > .tag',
      activate: function(ev, ui) {
        $(this).find('.placeholder-tag')
	    .width(ui.draggable.width())
	    .addClass('show');
      },
      deactivate: function(ev, ui) {
        $(this).find('.placeholder-tag')
	    .removeClass('show');
      },
      over: function(ev, ui) {
        $(this).find('.placeholder-tag')
	    .addClass('placeholder-tag-highlight');
      },
      out: function(ev, ui) {
        $(this).find('.placeholder-tag')
	    .removeClass('placeholder-tag-highlight');
      },
    }));
  };



})(jQuery);

});