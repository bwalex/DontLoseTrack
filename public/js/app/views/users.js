define(['appns', 'jquery', 'underscore', 'backbone', 'backbone-relational', 'jquery.elastic', 'jquery.magicedit2', 'jsrender'], function(App, $, _, Backbone) {

  App.UserSettingsView = Backbone.View.extend({
    events: {
      "click input[type='submit']"        : 'submitChanges'
    },

    submitChanges: function(ev) {
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
	  wait: true
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
      return $(this.el).html($(this.template.render(this.model.toJSON())));
    }
  });
});
