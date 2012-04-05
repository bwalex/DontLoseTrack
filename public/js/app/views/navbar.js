define(['appns', 'jquery', 'underscore', 'backbone', 'backbone-relational', 'jsrender'], function(App, $, _, Backbone) {

  App.NavbarView = Backbone.View.extend({
    tagName: 'div',
    className: 'NavbarView',

    events: {
      "focus #projectSelector"          : "projSelFocus",
      "focusout #projectSelector"       : "projSelFocusOut"
    },


    projSelFocus: function(ev) {
      if ($(ev.currentTarget).val() == 'Switch Project...')
	$(ev.currentTarget).val('');
    },

    projSelFocusOut: function(ev) {
      if ($(ev.currentTarget).val() == '')
	$(ev.currentTarget).val('Switch Project...');
    },


    initialize: function() {
      _.bindAll(this,
		'render',
		'nav',
		'projSelFocus',
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
	      App.router.navigate("project/"+ ui.item.value +"/notes", {trigger: true});
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
