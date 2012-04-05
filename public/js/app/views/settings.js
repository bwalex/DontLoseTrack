define(['appns', 'jquery', 'underscore', 'backbone', 'backbone-relational', 'jquery.elastic', 'jquery.magicedit2', 'jsrender'], function(App, $, _, Backbone) {


  App.ExtResourceView = Backbone.View.extend({
    tagName: 'div',
    className: 'extResourceView',

    events: {
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    deleteResource: function(ev) {
      this.model.destroy();
    },

    initialize: function() {
      _.bindAll(this, 'render');

      this.model.bind('change'.this.render);
      this.model.bind('destroy', this.destroy);
    },

    template: $.templates('#extresource-tmpl'),

    render: function() {
      return $(this.el).html(this.template.render(this.model.toJSON()));
    }
  });


  App.ExtResourceListView = Backbone.View.extend({
    tagName: 'div',
    className: 'extResourceListView',

    events: {
    },

    initialize: function() {
      _.bindAll(this, 'render', 'renderExtResource');

      this.collection.bind('add', this.renderExtResource);
      this.collection.bind('reset', this.render);
    },

    template: $.templates('#extresource-list-tmpl'),

    render: function() {
      $(this.el).html(this.template.render({}));
      this.collection.each(this.renderExtResource);

      return $(this.el);
    },

    renderExtResource: function(m) {
      var erView = new App.ExtResourceView({model: m});
      $(this.el).find('.ext-resource-list').append($(erView.render()));
    }
  });


  App.SettingsView = Backbone.View.extend({
    events: {
    },

    initialize: function(params) {
      _.bindAll(this, 'render');

      this.projectModel = params.projectModel;
      this.extResourceCollection = params.extResourceCollection;

      this.collection.bind('reset', this.render);
    },

    template: $.templates('#settings-tmpl'),

    render: function() {
      var settings = {};

      this.collection.each(function(e) {
	settings[e.get('key')] = e.get('value');
      });

      var obj = {
	project: this.projectModel.toJSON(),
	settings: settings
      };

      $(this.el).html($(this.template.render(obj)));

      var eView = new App.ExtResourceListView({collection: this.extResourceCollection});
      $(this.el).find('.ext-resources').html($(eView.render()));
    }
  });


});
