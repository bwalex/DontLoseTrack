define(['appns', 'jquery', 'underscore', 'backbone', 'backbone-relational', 'jquery.elastic', 'jquery.magicedit2', 'jsrender'], function(App, $, _, Backbone) {

  App.UserSettingsView = Backbone.View.extend({
    events: {
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    initialize: function(params) {
      _.bindAll(this, 'render', 'destroy');
      this.model.bind('destroy', this.destroy);

      this.extraClass = params['extraClass'];
    },

    template: $.templates('#user-settings-tmpl'),

    render: function() {
      return $(this.el).html($(this.template.render(this.model.toJSON())));
    }
  });
});
