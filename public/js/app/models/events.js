define(['appns', 'underscore', 'backbone', 'backbone-relational'], function(App, _, Backbone) {
  App.Event = Backbone.Model.extend({
    modelName: 'Timeline Event',
    urlRoot: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/events';
    },
    idAttribute: 'id'
  });

  App.EventCollection = Backbone.Collection.extend({
    modelName: 'Timeline Events',
    url: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/events';
    },

    comparator: function(a, b) {
      var a_ud = a.get('raw_occurred_at');
      var b_ud = b.get('raw_occurred_at');

      return (b_ud - a_ud);
    },


    model: App.Event
  });
});