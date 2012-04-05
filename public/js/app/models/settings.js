define(['appns', 'underscore', 'backbone', 'backbone-relational'], function(App, _, Backbone) {
  App.Setting = Backbone.Model.extend({
    modelName: 'Setting',
    urlRoot: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/settings';
    },
    idAttribute: 'id'
  });

  App.SettingsCollection = Backbone.Collection.extend({
    modelName: 'Settings',
    url: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/settings';
    },
    model: App.Setting
  });

  App.ExtResource = Backbone.Model.extend({
    modelName: 'External Resource',
    urlRoot: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/extresource';
    },
    idAttribute: 'id'
  });

  App.ExtResourceCollection = Backbone.Collection.extend({
    modelName: 'External Resources',
    url: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/extresource';
    },
    model: App.ExtResource
  });

});