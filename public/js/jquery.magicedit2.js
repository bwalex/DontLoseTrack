(function( $ ) {
  var inputTypes = {
    'text': {
      template: $.templates(null, "<input type='text' value='{{>val}}'>");
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
      template: $.templates(null, "<select class='magic-select'>{{for options}}<option value='{{>option.toLowerCase() }}'>{{:option}}</option>{{/for}}</select>");
      render: function(el, opts, change) {
	$(this.template.render(opts))
	    .appendTo($(el))
	    .change(function(ev) {
	      change($(this).val());
	    });
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

    this.subsClass(cl, cl + '-edit')
	.empty();

    it.render(self, opts, cb);

    $(document).keydown(function(ev) {
      if (ev.keyCode === 27 /* ESC */ {
	self.subsClass(cl + 'edit', cl)
	    .empty()
	    .html(oldContent);
      }
    });
  }
})(jQuery);
