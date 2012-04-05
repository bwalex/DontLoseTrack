define(['appns', 'underscore', 'backbone', 'backbone-relational'], function(App, _, Backbone) {
  App.Tag  = Backbone.RelationalModel.extend({
    modelName: 'Tag',

    defaults: {
      selected: false
    },
    urlRoot: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/tag';
    },
    idAttribute: 'id',
    relations: [
      {
        type: Backbone.HasMany,
        key:  'note_tags',
        relatedModel: App.NoteTag,
	includeInJSON: false,
        reverseRelation: {
          key: 'tag',
	  keySource: 'tag_id'
        }
      },
      {
	type: Backbone.HasMany,
	key:  'task_tags',
	relatedModel: App.TaskTag,
	includeInJSON: false,
	reverseRelation: {
	  key: 'tag',
	  keySource: 'tag_id'
	}
      },
      {
	type: Backbone.HasMany,
	key:  'wiki_tags',
	relatedModel: App.WikiTag,
	includeInJSON: false,
	reverseRelation: {
	  key: 'tag',
	  keySource: 'tag_id'
	}
      }
    ]
  });

  App.TagCollection = Backbone.Collection.extend({
    modelName: 'Tags',

    url: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/tag';
    },
    model: App.Tag
  });
});