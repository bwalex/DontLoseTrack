define(['appns', 'jquery', 'underscore', 'backbone', 'backbone-relational', 'jquery.elastic', 'jquery.magicedit2', 'jsrender'], function(App, $, _, Backbone) {


  App.WikiContentView = Backbone.View.extend({
    tagName: 'div',
    className: 'wikiHistoricContentView',

    destroy: function() {
      this.remove();
      this.unbind();
    },

    initialize: function() {
      _.bindAll(this, 'render', 'destroy');

      this.model.bind('change', this.render);
      this.model.bind('destroy', this.destroy);
    },

    template: $.templates('{{if displayRaw link=false}}<pre>{{>text}}</pre>{{else}}{{:html_text}}{{/if}}'),

    render: function() {
      console.log('WCV render: ', this.model.toJSON(), this.template.render(this.model.toJSON()));
      return $(this.el).html(this.template.render(this.model.toJSON()));
    }
  });




  App.WikiHistoricView = Backbone.View.extend({
    tagName: 'div',
    className: 'wikiHistoricView',

    events: {
      "click .buttons .toggle-view"   : "toggleView"
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    deleteWiki: function() {
      this.model.destroy();
    },

    toggleView: function(ev) {
      if (typeof(this.cmodel) === 'undefined')
	return false;

      this.cmodel.set('displayRaw', !this.cmodel.get('displayRaw'));
      return false;
    },

    initialize: function(opts) {
      this.wcId = opts.wcId;
      _.bindAll(this, 'render', 'destroy', 'deleteWiki', 'toggleView');
      this.model.set('wcId', this.wcId);

      this.model.bind('change', this.render);
      this.model.bind('destroy', this.destroy);
    },

    template: $.templates('#wiki-historic-tmpl'),

    render: function() {
      var html = $(this.template.render(this.model.toJSON()));
      var self = this;

      $(this.el).html(html);

      console.log(this.model);
      console.log(this.wcId);
      console.log(this.model.get('wiki_contents'));

      if (typeof(this.cmodel) === 'undefined') {
	this.cmodel = this.model.get('wiki_contents').get(this.wcId);
	this.cmodel.fetch();
      }

      var cview = new App.WikiContentView({model: this.cmodel });
      $(this.el).find('.content').html(cview.render());

      return $(this.el);
    }
  });





  App.WikiView = Backbone.View.extend({
    tagName: 'div',
    className: 'wikiView',

    events: {
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    deleteWiki: function() {
      this.model.destroy();
    },

    initialize: function() {
      _.bindAll(this, 'render', 'destroy', 'deleteWiki');

      this.model.bind('change', this.render);
      this.model.bind('destroy', this.destroy);
    },

    template: $.templates('#wiki-tmpl'),

    render: function() {
      var html = $(this.template.render(this.model.toJSON()));
      var self = this;

      return $(this.el).html(html);
    }
  });






  App.WikiEditView = Backbone.View.extend({
    tagName: 'div',
    className: 'wikiEditView',

    events: {
      "click .buttons .save-changes"         : "saveChanges",
      "click .buttons .preview"              : "showPreview",
      "focus .comment input"                 : "commentFocus",
      "focusout .comment input"              : "commentFocusOut",
      "focus textarea"                       : "removePreview"
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    removePreview: function(ev) {
      $(this.el).find('.preview-content .container').empty();
    },

    deleteWiki: function() {
      this.model.destroy();
    },

    commentFocus: function(ev) {
      if ($(ev.currentTarget).val() == 'Required comment about this change...')
	$(ev.currentTarget).val('');
    },

    commentFocusOut: function(ev) {
      if ($(ev.currentTarget).val() == '')
	$(ev.currentTarget).val('Required comment about this change...');
    },

    showPreview: function(ev) {
      $(this.el).find('.preview-content .container').load('/api/preview', {
	text: $(this.el).find('textarea').val()
      });
      return false;
    },

    saveChanges: function(ev) {
      var self = this;
      var tarea = $(this.el).find('textarea');
      var cinput = $(this.el).find('.comment input');
      var icomment = cinput.val();

      if (icomment === 'Required comment about this change...')
	icomment = '';

      var m = new App.WikiContent({
	wiki: this.model,
	wiki_id: this.model.get('id'),
	text: tarea.val(),
	comment: icomment
      });

      m.save({},{
	success: function(model, resp) {
	  cinput.val('Required comment about this change...');
	  alert('Changes saved');
	}
      });

      return false;
    },


    initialize: function() {
      _.bindAll(this, 'render', 'destroy', 'deleteWiki', 'saveChanges', 'commentFocus', 'commentFocusOut', 'removePreview', 'showPreview');

      this.model.bind('change', this.render);
      this.model.bind('destroy', this.destroy);
    },

    template: $.templates('#wiki-edit-tmpl'),

    render: function() {
      var html = $(this.template.render(this.model.toJSON()));
      var self = this;

      var ret = $(this.el).html(html);
      $(this.el).find('a[rel]').customOverlay();
      $(this.el).find('.elastic').elastic();
      return ret;
    }
  });






  App.WikiHistoryEntryView = Backbone.View.extend({
    tagName: 'tr',
    className: 'wikiHistoryEntryView',

    events: {
      "change input:checkbox"                 : "markSelected",
    },

    markSelected: function(ev) {
      this.model.set('selected', $(ev.currentTarget).prop('checked')?true:false );
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    error: function(oldModel, resp) {
      alert('error error!' + JSON.stringify(resp));
      console.log(oldModel === this.model);
      console.log(resp);
    },

    initialize: function() {
      _.bindAll(this, 'render', 'destroy', 'error', 'markSelected');

      this.model.bind('change', this.render);
      this.model.bind('destroy', this.destroy);
    },

    template: $.templates('#wiki-history-entry-tmpl'),

    render: function() {
      console.log('WikiHistoryEntryView: %o', this.model.toJSON());
      return $(this.el).html($(this.template.render(this.model.toJSON())));
    }
  });





  App.WikiHistoryView = Backbone.View.extend({
    tagName: 'div',
    className: 'wikiHistoryView',

    events: {
      "click .buttons a.diff-wiki"           : "diffWikis",
      "click .buttons a.restore-wiki"        : "restoreWiki"
    },

    restoreWiki: function(ev) {
      var self = this;
      var models = this.model.get('wiki_contents').where({selected: true});

      console.log('restoreWiki: ', models);
      if (models.length !== 1) {
	alert('You need to select exactly one history entry to restore');
	return false;
      }

      var m = new App.WikiContent({
	wiki: this.model,
	wiki_id: this.model.get('id'),
	text: models[0].get('text'),
	comment: 'Restore revision ' + models[0].get('id')
      });

      m.save({},{
	wait: true,
	success: function(model, resp) {
	}
      });
    },

    diffWikis: function(ev) {
      var self = this;

      console.log('diffWikis!');
      var models = _.pluck(this.model.get('wiki_contents').where({selected: true}), 'id');

      console.log('models: %o', models);

      if (models.length !== 2) {
	alert('You need to select exactly two history entries for diff');
	return false;
      }

      $(this.el).find('.diffView .content').load('/api/project/' + this.model.get('project_id') + '/wiki/' + this.model.get('id') + '/diff', {
	ids: models
      });

      return false;
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    error: function(oldModel, resp) {
      alert('error error!' + JSON.stringify(resp));
      console.log(oldModel === this.model);
      console.log(resp);
    },

    initialize: function() {
      _.bindAll(this, 'render', 'renderHistoryEntry', 'destroy', 'error', 'diffWikis', 'restoreWiki');

      this.model.bind('change', this.render);
      this.model.bind('destroy', this.destroy);
      this.model.fetchRelated('wiki_contents');
    },

    template: $.templates('#wiki-history-tmpl'),

    render: function() {
      var self = this;
      var html = $(this.template.render(this.model.toJSON()));
      $(this.el).html(html);

      this.model.get('wiki_contents').each(this.renderHistoryEntry);
    },

    renderHistoryEntry: function(m) {
      m.fetch();
      console.log('renderHistoryEntry: %o', m);
      var hview = new App.WikiHistoryEntryView({model: m});
      $(this.el).find('.history-entries').prepend($(hview.render()));
    }
  });




  App.WikiOverviewView = Backbone.View.extend({
    tagName: 'div',
    className: 'wikiOverviewView',

    events: {
      "click .delwiki .edit-button"   : "editTitle",
      "click .delwiki .rm-button"     : "deleteWiki",
      "drop .summary"                 : "dropTag"
    },

    dropTag: function(ev, ui) {
      var tagModel = ui.draggable.data('tagModel');
      var found = false;
      _.each(this.model.get('wiki_tags').pluck('tag'), function(tag) {
	if (tag === tagModel)
	  found = true;
      });
      if (!found) {
	var m = new App.WikiTag({tag: tagModel, tag_id: tagModel.get('id'), wiki: this.model, wiki_id: this.model.get('id')});
	this.model.get('wiki_tags').add(m);
	console.log(m);
	m.save();
      }
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    deleteWiki: function() {
      this.model.destroy();
    },

    editTitle: function(ev) {
      var self = this;

      $(this.el).find('.title').magicedit2(
	'title', 'text',
	{
	  val: this.model.get('title')
	},
	function(val) {
	  console.log('change!: ', val);
	  self.model.save({ 'title': val },
			  { wait: true, partialUpdate: true });
	});
    },

    initialize: function() {
      _.bindAll(this, 'render', 'destroy', 'deleteWiki', 'editTitle', 'dropTag');

      this.model.bind('change', this.render);
      this.model.bind('destroy', this.destroy);
      this.model.bind('add:wiki_tags', this.render);
      this.model.bind('remove:wiki_tags', this.render);
    },

    template: $.templates('#wiki-overview-tmpl'),

    render: function() {
      var html = $(this.template.render(this.model.toJSON()));
      var self = this;

      this.model.get('wiki_tags').each(function(m) {

        console.log("Each wiki_tags: %o", m);
        console.log("---> %o", m.get('wiki'));
        console.log("---> %o", m.get('tag'));
        var tagView = new App.AppliedTagView({model: m });
        $(html).find('div.tags > .placeholder-tag').before($(tagView.render()));
      });

      $(html).find('.summary').tagDroppable({});

      if (App.globalController.get('filter') === true) {
	var seltags = App.globalController.get('filter:tags');

	var wikitag = this.model.get('wiki_tags').detect(function(wt) {
	  var tag = wt.get('tag');
	  return (_.indexOf(seltags, tag) >= 0) ? true : false;
	});

	if (typeof(wikitag) === 'undefined')
	  $(this.el).addClass('contracted');
      }

      return $(this.el).html(html);
    }
  });





  App.WikiListView = Backbone.View.extend({
    tagName: 'div',
    className: 'wikiListView',
    showCompleted: false,

    events: {
      "click .tabmenu .btn_addtag"      : "addTagBtn",
      "focus #newwikititle"             : "newWikiFocus",
      "focusout #newwikititle"          : "newWikiFocusOut",
      "keypress #newwikititle"          : "newWikiKeypress"
    },

    addTagBtn: function(ev) {
      App.globalController.trigger('btn:addTags');
    },

    tagbtn: function() {
      $(this.el).find('.tabmenu .btn_addtag')
	  .toggleClass('btn-selected');
    },

    destroy: function() {
      App.globalController.unregister(this);
      App.globalController.trigger('clean:addTags');
      this.remove();
      this.unbind();
    },

    newWikiFocus: function(ev) {
      if ($(ev.currentTarget).val() == 'Add Wiki...')
	$(ev.currentTarget).val('');
    },

    newWikiFocusOut: function(ev) {
      if ($(ev.currentTarget).val() == '')
	$(ev.currentTarget).val('Add Wiki...');
    },

    newWikiKeypress: function(ev) {
      var self = this;

      if (ev.keyCode === 13 /* ENTER */) {
	var m = new App.Wiki({ title: $(ev.currentTarget).val() });
	console.log("Moo, saving... ", m);
	m.save({},{
	  wait: true,
	  success: function(model, resp) {
	    console.log("Success: ", model, resp);
	    self.collection.add(m);
	    $(ev.currentTarget).val("");
	    $(ev.currentTarget).blur();
	  }
	});
      }
    },

    initialize: function() {
      _.bindAll(this,
		'render',
		'renderWiki',
		'addTagBtn',
		'destroy',
		'tagbtn',
		'filterChange',
		'forceRefetch',
		'newWikiFocus',
		'newWikiFocusOut',
		'newWikiKeypress');

      //this.collection.bind('change', this.render);
      this.collection.bind('add', this.renderWiki);
      this.collection.bind('reset', this.render);

      this.bind('btn:addTags', this.tagbtn);
      this.bind('change:filter:tag_ids', this.filterChange);
      this.bind('wiki:force-refetch', this.forceRefetch);

      App.globalController.register(this);
    },

    template: $.templates('#wiki-list-tmpl'),

    filterChange: function(ids) {
      this.forceRefetch(ids);
    },

    forceRefetch: function(ids) {
      if (typeof(ids) === undefined)
	ids = App.globalController.get('filter:tag_ids');

      this.collection.fetch({data: { limit: 100, offset: 0, filter: { tags: ids } }});
    },

    render: function() {
      $(this.el).html(this.template.render({}));
      this.collection.each(this.renderWiki);
    },

    renderWiki: function(wiki) {
      console.log("renderWiki: wiki=%o", wiki);
      var wikiView = new App.WikiOverviewView({model: wiki});
      $(this.el).find('#wikilist').append($(wikiView.render()));
    }
  });

});
