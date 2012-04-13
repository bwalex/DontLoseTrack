define(['appns', 'jquery', 'underscore', 'backbone', 'backbone-relational', 'jsrender'], function(App, $, _, Backbone) {

  App.NavbarView = Backbone.View.extend({
    tagName: 'div',
    className: 'NavbarView',

    events: {
      "focus #projectSelector"          : "projSelFocus",
      "focusout #projectSelector"       : "projSelFocusOut",
      "click .signin"                   : "showDrop",
      "mouseup .drop-nav"               : "preventAction"
    },


    projSelFocus: function(ev) {
      if ($(ev.currentTarget).val() == 'Switch Project...')
	$(ev.currentTarget).val('');
    },

    projSelFocusOut: function(ev) {
      if ($(ev.currentTarget).val() == '')
	$(ev.currentTarget).val('Switch Project...');
    },

    preventAction: function(ev) {
      return false;
    },

    showDrop: function(ev) {
      var self = this;

      ev.preventDefault();
      console.log('moo. %o', $(document));
      $(this.el).find('.drop-nav').toggle();
      $(this.el).find('a.signin').toggleClass("menu-open");
      $(document).one('mouseup', function(e) {
	if ($(e.target).parent('a.signin').length == 0) {
	  $(self.el).find('.drop-nav').hide();
	  $(self.el).find('a.signin').removeClass('menu-open');
	}
      });
    },

    initialize: function() {
      _.bindAll(this,
		'render',
		'nav',
		'projSelFocus',
		'showDrop',
		'preventAction',
		'projSelFocusOut');

      this.bind('change:project', this.render);
      this.bind('navigate', this.nav);

      App.globalController.register(this);

      this.render();
    },

    template: $.templates('#navbar-tmpl'),

    render: function(project) {
      if (typeof(project) !== 'object')
	project = { toJSON: function() { return {}; } };

      $(this.el).html(this.template.render(project.toJSON()));
      $(this.el).find('#projectSelector')
	  .autocomplete({
	    minLength: 0,
	    source: function(req, cb) {
	      cb(App.projectCollection
		 .filter(function(p) {
		   return (p.get('name').toLowerCase().indexOf(req.term.toLowerCase()) !== -1);
		 })
		 .map(function(p) {
		   return {
		     label: p.get('name'),
		     value: p.get('id')
		   };
		 })
		);
	    },
	    focus: function(ev, ui) {
	      return false;
	    },
	    select: function(ev, ui) {
	      App.router.navigate("project/"+ ui.item.value +"/timeline", {trigger: true});
	      $(this).val('');
	      $(this).blur();
	      return false;
	    }
	  });
    },

    nav: function(item) {
      console.log("NavbarView: nav: ", item, this);
      console.log(this.el);
      $(this.el).find('.menu a').removeClass('current');
      $(this.el).find('.menu a[title="' + item + '"]').addClass('current');
    }
  });

});
