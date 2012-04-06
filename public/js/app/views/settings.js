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

      this.model.bind('change', this.render);
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
      "click .save-events"                : 'saveEvents',
      "click button.rename-project"       : 'renameProject',
      "click button.delete-project"       : 'deleteProject',
      "change .tasks .sorting select"     : 'saveTaskOrdering'
    },

    saveEvents: function(ev) {
      var cbs = $(this.el).find('.visible-events :checked');
      var v = [];

      cbs.each(function() {
	v.push($(this).val());
      });

      var m = this.collection.where({key : 'timeline:events'});
      m = m[0];

      m.save({value: v.join(',')}, { partialUpdate: true, wait: true });
    },

    saveTaskOrdering: function(ev) {
      var m = this.collection.where({key : 'tasks:default_sort'});
      m = m[0];

      m.save({value: $(this.el).find('.tasks .sorting select').val()}, { partialUpdate: true, wait:true });
    },


    renameProject: function(ev) {
      this.projectModel.save({name: $(this.el).find('project-knobs input').val() }, {partialUpdate: true, wait: true });
    },


    deleteProject: function(ev) {
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    initialize: function(params) {
      _.bindAll(this, 'render', 'saveEvents', 'saveTaskOrdering', 'renameProject', 'deleteProject');

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
