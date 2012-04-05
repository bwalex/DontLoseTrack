define(['appns', 'underscore', 'backbone', 'backbone-relational'], function(App, _, Backbone) {
  App.Project = Backbone.Model.extend({
    modelName: 'Project',
    urlRoot: '/api/project',
    idAttribute: 'id'
  });

  App.ProjectCollection = Backbone.Collection.extend({
    modelName: 'Projects',
    url: '/api/project',
    model: App.Project
  });
});