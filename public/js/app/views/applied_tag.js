define(['appns', 'jquery', 'underscore', 'backbone', 'backbone-relational', 'jsrender'], function(App, $, _, Backbone) {
  App.AppliedTagView = Backbone.View.extend({
    tagName: 'div',
    className: 'tagAppliedView',

    events: {
      "click .rm-icon > .rm-button"     : "removeMe",
    },

    initialize: function() {
      _.bindAll(this, 'render', 'removeMe', 'destroy');
      this.model.bind('change:tag', this.render);
      this.model.bind('change', this.render);
      //this.model.bind('remove', this.destroy);
      this.model.bind('destroy', this.destroy);
      this.model.bind('destroy:tag', this.destroy);
    },

    removeMe: function(ev) {
      this.model.destroy();
    },

    destroy: function(ev) {
      this.remove();
      this.unbind();
    },

    template: $.templates('#tag-applied-tmpl'),

    render: function() {

      if (this.model.get('tag') == null) {
	return;
      }
      var ht = $(this.el).html(this.template.render(this.model.get('tag').toJSON()));
      return ht;
    }
  });
});
