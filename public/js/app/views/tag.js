define(['appns', 'jquery', 'underscore', 'backbone', 'backbone-relational', 'jquery.magicedit2', 'jquery.autoclear', 'jsrender'], function(App, $, _, Backbone) {
  App.TagView = Backbone.View.extend({
    tagName: 'div',
    className: 'tagView',

    events: {
      "click .tag"                      : "toggleFilter",
      "click .edit-icon > .edit-button" : "editTag",
      "click .rm-icon > .rm-button"     : "removeMe"
    },

    toggleFilter: function(ev) {
      this.model.set('selected', !this.model.get('selected'));
      App.globalController.trigger('select:tag', this.model);
    },

    initialize: function() {
      _.bindAll(this, 'render', 'editTag', 'removeMe', 'remove', 'toggleFilter');
      this.model.bind('change', this.render);
      this.model.bind('reset', this.render);
      this.model.bind('destroy', this.remove);
    },

    removeMe: function(ev) {
      App.globalController.trigger('select:tag', this.model);
      this.model.destroy();
    },

    destroy: function(ev) {
      $(this.el).remove();
    },

    editTag: function(ev) {
      var self = this;

      $(ev.currentTarget).closest('.tag').magicedit2(
	'tag', 'tag',
	{
	  text: this.model.get('name'),
	  color: this.model.get('color')
	},
	function(val) {
	  console.log('editTag: ', val);
	  self.model.save({ name: val.text, color: val.color },
			  { wait: true, partialUpdate: true });
	});
      return false;
    },

    template: $.templates('#tag-tmpl'),

    render: function() {
      var html = $(this.template.render(this.model.toJSON()));
      return $(this.el).html(html);
    }
  });


  App.TagListView = Backbone.View.extend({
    tagName: 'div',
    className: 'tagListView',

    events: {
      //"keyup #search-string"       : "changeSearchString",
      "change #search-string"      : "changeSearchString",
      "keypress #newtagname"       : "newTagKeypress"
    },

    destroy: function() {
      App.globalController.unregister(this);
      this.remove();
      this.unbind();
    },

    changeSearchString: function(ev) {
      var self = this;
      App.globalController.set('filter:text', $(this.el).find('#search-string').val());
    },

    newTagKeypress: function(ev) {
      var self = this;

      if (ev.keyCode === 13 /* ENTER */) {
	var m = new App.Tag({ name: $(ev.currentTarget).val() });
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
		'renderTag',
		'renderTagTop',
		'newTagKeypress',
		'changeSearchString',
		'destroy');

      //this.model.bind('change', this.render);
      this.collection.bind('reset', this.render);
      this.collection.bind('add', this.renderTagTop);
      App.globalController.register(this);
    },

    template: $.templates('#tag-list-tmpl'),

    render: function() {
      $(this.el).html(this.template.render({}));
      $(this.el).find('.autoclear').autoclear();
      $(this.el).find('#search-string').val(App.globalController.get('filter:text'));
      this.collection.each(this.renderTag);
    },

    renderTag: function(tag) {
      console.log("renderTag: tag=%o", tag);
      var tagView = new App.TagView({model: tag});
      $(this.el).find('#tagfilterlist .tags').append($(tagView.render()));
      console.log(this.el, tagView.render());
    },

    renderTagTop: function(tag) {
      var tagView = new App.TagView({model: tag});
      $(this.el).find('#tagfilterlist .tags').prepend($(tagView.render()));
    }
  });

});
