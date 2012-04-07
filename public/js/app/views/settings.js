define(['appns', 'jquery', 'underscore', 'backbone', 'backbone-relational', 'jquery.elastic', 'jquery.magicedit2', 'jsrender', 'jquery.tools'], function(App, $, _, Backbone) {


  App.ExtResourceView = Backbone.View.extend({
    tagName: 'div',
    className: 'extResourceView',

    events: {
      "click button"           : "deleteResource",
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    deleteResource: function(ev) {
      this.model.destroy();
    },

    initialize: function() {
      _.bindAll(this, 'render', 'destroy', 'deleteResource');

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
      "click .extres-new button"            : "addNewRes"
    },

    addNewRes: function(ev) {
      var e = new App.ExtResource({
	type: $(this.el).find('.extres-type select').val(),
	location: $(this.el).find('.extres-location input').val()
      });

      e.save({}, {wait: true});

      this.collection.add(e);
    },

    initialize: function() {
      _.bindAll(this, 'render', 'renderExtResource', 'addNewRes');

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
      "click .save-events"                  : 'saveEvents',
      "click button.rename-project"         : 'renameProject',
      "click .modal button.delete-project"  : 'deleteProject',
      "change .tasks .sorting select"       : 'saveTaskOrdering'
    },

    updateConfig: function(key, value) {
      var m = this.collection.where({key : key});
      if (m.length > 0) {
	m[0].save({ value: value }, { partialUpdate: true, wait: true });
      } else {
	m = new App.Setting({key: key, value: value});
	m.save({}, { wait: true });
	this.collection.add(m);
      }
    },

    saveEvents: function(ev) {
      var cbs = $(this.el).find('.visible-events :checked');
      console.log('cbs: %o', cbs);
      var v = [];

      _.each(cbs, function(c) {
	v.push($(c).val());
      });

      console.log('cbs val: %o, %o', v, v.join(','));
      this.updateConfig('timeline:events', v.join(','));
    },

    saveTaskOrdering: function(ev) {
      this.updateConfig('tasks:default_sort',
			$(this.el).find('.tasks .sorting select').val());
      App.globalController.trigger('reload:settings');
    },


    renameProject: function(ev) {
      console.log('renameProject: ', $(this.el).find('.project-knobs input'), $(this.el).find('.project-knobs input').val());
      this.projectModel.save({name: $(this.el).find('.project-knobs input').val() }, {partialUpdate: true, wait: true });
    },


    deleteProject: function(ev) {
      this.projectModel.destroy();
      App.router.navigate("/", {trigger: true});
    },


    destroy: function() {
      this.remove();
      this.unbind();
    },

    initialize: function(params) {
      _.bindAll(this, 'render', 'saveEvents', 'saveTaskOrdering', 'renameProject', 'deleteProject', 'updateConfig');

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
      $(this.el).find('.project-knobs > div > button.delete-project').overlay({
	mask: {
	  color: '#99173C',
	  opacity: 0.8
	},
	closeOnClick: false
      });

      var eView = new App.ExtResourceListView({collection: this.extResourceCollection});
      $(this.el).find('.ext-resources').html($(eView.render()));
    }
  });


});
