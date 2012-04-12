define(['appns', 'underscore', 'backbone', 'backbone-relational', 'models/tag_link'], function(App, _, Backbone) {
  App.Note = Backbone.RelationalModel.extend({
    modelName: 'Note',

    defaults: {
      visible: true
    },
    urlRoot: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/note';
    },
    idAttribute: 'id',
    relations: [
      {
        type: Backbone.HasMany,
        key:  'note_tags',
        relatedModel: App.NoteTag,
        reverseRelation: {
          key: 'note',
	  keySource: 'note_id'
        }
      }
    ],
    initialize: function() {
      this.on('change:tag', function(model) {
        console.log('related tag=%o updated', model);
      });
    }
  });

  App.NoteCollection = Backbone.Collection.extend({
    modelName: 'Notes',

    url: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/note';
    },

    comparator: function(a, b) {
      var a_ud = a.get('raw_updated_at');
      var b_ud = b.get('raw_updated_at');

      return (b_ud - a_ud);
    },

    model: App.Note
  });
});