define(['appns', 'underscore', 'backbone', 'backbone-relational'], function(App, _, Backbone) {
  App.Event = Backbone.Model.extend({
    modelName: 'Timeline Event',
    urlRoot: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/events';
    },
    idAttribute: 'id'
  });

  App.EventCollection = Backbone.Collection.extend({
    modelName: 'TImeline Events',
    url: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/events';
    },
    model: App.Event
  });
});