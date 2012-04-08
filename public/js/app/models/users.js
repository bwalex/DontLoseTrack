define(['appns', 'underscore', 'backbone', 'backbone-relational'], function(App, _, Backbone) {
  App.User = Backbone.Model.extend({
    modelName: 'User',
    url: function() {
      return '/api/user';
    },

    idAttribute: 'id'
  });

  App.UserCollection = Backbone.Collection.extend({
    modelName: 'Users',
    url: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/user';
    },
    model: App.User
  });
});