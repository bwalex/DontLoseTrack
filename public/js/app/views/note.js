define(['appns', 'jquery', 'underscore', 'backbone', 'backbone-relational', 'jquery.elastic', 'jquery.magicedit2', 'jsrender'], function(App, $, _, Backbone) {

  App.NoteView = Backbone.View.extend({
    tagName: 'div',
    className: 'noteView',

    events: {
      "click .delnote .rm-button"     : "deleteNote",
      "drop .meta"                    : "dropTag"
    },


    dropTag: function(ev, ui) {
      var tagModel = ui.draggable.data('tagModel');
      var found = false;
      _.each(this.model.get('note_tags').pluck('tag'), function(tag) {
	if (tag === tagModel)
	  found = true;
      });
      if (!found) {
	var m = new App.NoteTag({tag: tagModel, tag_id: tagModel.get('id'), note: this.model, note_id: this.model.get('id')});
	this.model.get('note_tags').add(m);
	console.log(m);
	m.save();
      }
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    deleteNote: function() {
      this.model.destroy();
    },

    initialize: function() {
      _.bindAll(this,
		'render',
		'renderTags',
		'dropTag',
		'destroy',
		'deleteNote');
      this.model.bind('change', this.render);
      this.model.bind('destroy', this.destroy);
      this.model.bind('add:note_tags', this.render);
      this.model.bind('remove:note_tags', this.render);
    },

    template: $.templates('#note-tmpl'),

    render: function() {
      var html = $(this.template.render(this.model.toJSON()));
      var self = this;

      this.model.get('note_tags').each(function(m) {

        console.log("Each note_tags: %o", m);
        console.log("---> %o", m.get('note'));
        console.log("---> %o", m.get('tag'));
        var tagView = new App.AppliedTagView({model: m });
        $(html).find('div.tags > .placeholder-tag').before($(tagView.render()));
      });

      $(html).children('.meta').tagDroppable({});
      console.log("app.NoteView.render: %o", this.model);

      if (App.globalController.get('filter') === true) {
	var seltags = App.globalController.get('filter:tags');

	var notetag = this.model.get('note_tags').detect(function(nt) {
	  var tag = nt.get('tag');
	  return (_.indexOf(seltags, tag) >= 0) ? true : false;
	});

	if (typeof(notetag) === 'undefined')
	  $(this.el).addClass('contracted');
      }

      return $(this.el).html(html);
    },
    renderTags: function(tag) {
      console.log("Party time, tag=%o", tag);
    }
  });

  App.NoteListView = Backbone.View.extend({
    tagName: 'div',
    className: 'noteListView',

    events: {
      "click .tabmenu .btn_addtag"      : "addTagBtn",
      "focus #newnotetext"              : "newNoteFocus",
      "focusout #newnotetext"           : "newNoteFocusOut",
      "click #newnote button"           : "newNoteSubmit"
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

    newNoteFocus: function(ev) {
      if ($(ev.currentTarget).val() == 'Add Note...')
	$(ev.currentTarget).val('');
    },

    newNoteFocusOut: function(ev) {
      if ($(ev.currentTarget).val() == '')
	$(ev.currentTarget).val('Add Note...');
    },

    newNoteSubmit: function(ev) {
      var self = this;

      var m = new App.Note({ text: $(this.el).find('#newnotetext').val() });
      console.log("Moo, saving... ", m);
      m.save({},{
	wait: true,
	success: function(model, resp) {
	  console.log("Success: ", model, resp);
	  self.collection.add(m);
	  $(self.el).find('#newnotetext').val("");
	  $(self.el).find('#newnotetext').blur();
	}
      });
    },

    initialize: function() {
      _.bindAll(this, 'render', 'renderNote', 'addTagBtn', 'destroy', 'tagbtn', 'filterChange', 'forceRefetch');
      //this.model.bind('change', this.render);
      this.collection.bind('reset', this.render);
      this.collection.bind('add', this.renderNote);
      this.bind('btn:addTags', this.tagbtn);
      this.bind('change:filter:tag_ids', this.filterChange);
      this.bind('note:force-refetch', this.forceRefetch);
      App.globalController.register(this);
    },

    template: $.templates('#note-list-tmpl'),

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
      $(this.el).find('#newnotetext').elastic();
      $(this.el).find('a[rel]').customOverlay();
      this.collection.each(this.renderNote);
    },

    renderNote: function(inote) {
      console.log("renderNote: inote=%o", inote);
      var noteView = new App.NoteView({model: inote});
      $(this.el).find('#notelist').prepend($(noteView.render()));
    }
  });


});
