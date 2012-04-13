define(['appns', 'jquery', 'underscore', 'backbone', 'backbone-relational', 'jquery.elastic', 'jquery.magicedit2', 'jsrender'], function(App, $, _, Backbone) {

  App.UserSettingsView = Backbone.View.extend({
    events: {
      "click input[type='submit']"        : 'submitChanges'
    },

    submitChanges: function(ev) {
      var self = this;
      console.log('submitChanges!');
      this.model.save(
	{
	  'new_password'              : $(this.el).find('input#password').val(),
	  'new_password_confirmation' : $(this.el).find('input#password-confirmation').val(),
	  'name'                      : $(this.el).find('input#name').val(),
	  'alias'                     : $(this.el).find('input#alias').val(),
	  'email'                     : $(this.el).find('input#email').val()
	},
	{
	  partialUpdate: true,
	  wait: true,
	  success: function() {
	    App.currentUser.fetch();
	    $(self.el).find('#changes-saved-modal').data('overlay').load();
	  }
	}
      );
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    initialize: function(params) {
      _.bindAll(this, 'render', 'destroy', 'submitChanges');
      this.model.bind('destroy', this.destroy);
      this.model.bind('change', this.render);
    },

    template: $.templates('#user-settings-tmpl'),

    render: function() {
      var ret = $(this.el).html($(this.template.render(this.model.toJSON())));

      $(this.el).find('#changes-saved-modal').overlay({
	mask: {
	  color: 'white',
	  opacity: 0.6
	},
	closeOnClick: true
      });

      return ret;
    }
  });
});
