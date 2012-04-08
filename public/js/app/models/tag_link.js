define(['appns', 'underscore', 'backbone', 'backbone-relational'], function(App, _, Backbone) {

  App.TaskTag = Backbone.RelationalModel.extend({
    modelName: 'Task Tag',
    urlRoot:  function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/tasktag';
    },
    idAttribute: 'id',
    initialize: function() {
      var dit = this;

      this.get('tag').on('destroy', function(model) {
        dit.trigger('destroy:tag');

	var task = dit.get('task');
	if (typeof(task) !== 'undefined')
	  task.trigger('destroy:tag', model);
      });

      this.get('tag').on('change', function(model) {
        dit.trigger('change:tag');

	var task = dit.get('task');
	if (typeof(task) !== 'undefined')
          task.trigger('change:tag', model);
      });
    },
    toJSON: function() {
      return { task_id: this.get('task').get('id'), tag_id: this.get('tag').get('id') };
    }
  });



  App.NoteTag = Backbone.RelationalModel.extend({
    modelName: 'Note Tag',

    urlRoot:  function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/notetag';
    },

    idAttribute: 'id',

    initialize: function() {
      var dit = this;
      console.log("this.get('tag'):");

      this.get('tag').on('destroy', function(model) {
        dit.trigger('destroy:tag');

	var note = dit.get('note');
	if (typeof(note) !== 'undefined')
	  note.trigger('destroy:tag', model);
      });

      this..get('tag').on('change', function(model) {
        dit.trigger('change:tag');

	var note = dit.get('note');
        if (typeof(note) !== 'undefined')
	  note.trigger('change:tag', model);
      });
    },
    toJSON: function() {
      return { note_id: this.get('note').get('id'), tag_id: this.get('tag').get('id') };
    }
  });





  App.WikiTag = Backbone.RelationalModel.extend({
    modelName: 'Wiki Tag',

    urlRoot:  function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/wikitag';
    },

    idAttribute: 'id',

    initialize: function() {
      var dit = this;
      console.log("this.get('tag'):");

      this.get('tag').on('destroy', function(model) {
        dit.trigger('destroy:tag');

	var wiki = dit.get('wiki');
	if (typeof(wiki) !== 'undefined')
	  wiki.trigger('destroy:tag', model);
      });

      this.get('tag').on('change', function(model) {
	var wiki = dit.get('wiki');
        dit.trigger('change:tag');

        if (typeof(wiki) !== 'undefined')
	  wiki.trigger('change:tag', model);
      });
    },
    toJSON: function() {
      return { wiki_id: this.get('wiki').get('id'), tag_id: this.get('tag').get('id') };
    }
  });

});