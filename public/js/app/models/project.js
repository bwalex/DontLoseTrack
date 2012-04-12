define(['appns', 'underscore', 'backbone', 'backbone-relational'], function(App, _, Backbone) {
  App.ProjectUser = Backbone.RelationalModel.extend({
    modelName: 'Project User',

    urlRoot: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/projectuser';
    },

    idAttribute: 'id'
  });

  App.ProjectUserCollection = Backbone.Collection.extend({
    modelName: 'Project Users',

    url: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/projectuser';
    },

    model: App.Project
  });


  App.Project = Backbone.RelationalModel.extend({
    modelName: 'Project',
    urlRoot: '/api/project',
    idAttribute: 'id',

    relations: [
      {
        type: Backbone.HasMany,
        key:  'project_users',
        relatedModel: App.ProjectUser,
        reverseRelation: {
          key: 'project',
	  keySource: 'project_id'
        }
      }
    ]
  });

  App.ProjectCollection = Backbone.Collection.extend({
    modelName: 'Projects',
    url: '/api/project',
    model: App.Project
  });


});