define(['appns', 'underscore', 'backbone', 'backbone-relational', 'models/tag_link'], function(App, _, Backbone) {
  App.WikiContent = Backbone.RelationalModel.extend({
    modelName: 'Wiki',

    defaults: {
      selected: false,
      displayRaw: false
    },

    urlRoot: function() {
      return '/api/project/'+ App.globalController.get('projectId') + '/wiki/' + this.get('wiki').get('id') +'/wikicontent';
    },

    idAttribute: 'id',

    initialize: function() {
      var self = this;

      this.on('error', function(model, resp) {
	var wiki = self.get('wiki');
	if (typeof(wiki) !== 'undefined')
	  wiki.trigger('error:content', model, resp);
      });
    },

    toJSON: function() {
      return {
	wiki_id: this.get('wiki').get('id'),
	text: this.get('text'),
	comment: this.get('comment'),
	updated_at: this.get('updated_at'),
	id: this.get('id'),
	user_id: this.get('user_id'),
	selected: this.get('selected'),
	displayRaw: this.get('displayRaw'),
	html_text: this.get('html_text')
      };
    }

  });

  App.WikiContentCollection = Backbone.Collection.extend({
    modelName: 'Wiki',

    url: function(models) {
      return '/api/project/'+ App.globalController.get('projectId') + '/wikicontent' + ( models ? '/' + _.pluck( models, 'id' ).join(';') : '' );
    },
    model: App.WikiContent
  });


  App.Wiki = Backbone.RelationalModel.extend({
    modelName: 'Wiki',

    defaults: {
      visible: true
    },
    urlRoot: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/wiki';
    },
    idAttribute: 'id',
    relations: [
      {
        type: Backbone.HasMany,
        key:  'wiki_tags',
        relatedModel: App.WikiTag,
        reverseRelation: {
          key: 'wiki',
	  keySource: 'wiki_id'
        }
      },
      {
	type: Backbone.HasMany,
	key:  'wiki_contents',
	relatedModel: App.WikiContent,
	collectionType: 'App.WikiContentCollection',
	reverseRelation: {
	  key: 'wiki',
	  keySource: 'wiki_id'
	}
      }
    ],
    initialize: function() {
    }
  });

  App.WikiCollection = Backbone.Collection.extend({
    modelName: 'Wikis',

    url: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/wiki';
    },
    model: App.Wiki
  });
});