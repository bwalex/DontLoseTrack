define(['appns', 'jquery', 'underscore', 'backbone', 'backbone-relational', 'jquery.magicedit2', 'jsrender'], function(App, $, _, Backbone) {

  App.TagDragView = Backbone.View.extend({
    tagName: 'div',
    className: 'tagDragView',
    initialize: function() {
      _.bindAll(this, 'render', 'destroy');
      this.model.bind('change', this.render);
      this.model.bind('destroy', this.destroy);
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    template: $.templates('#tag-norm-tmpl'),
    render: function() {
      var html = $(this.template.render(this.model.toJSON()));

      $(html).draggable({
	helper: 'clone',
	cursor: 'move',
	snap: false
      }).data('tagModel', this.model);

      console.log("app.TagDragView.render: %o", this.model);
      return $(this.el).html(html);
    }
  });


  App.TagDragListView = Backbone.View.extend({
    tagName: 'div',
    className: 'tagDragListView',
    initialize: function() {
      _.bindAll(this, 'render', 'renderTag', 'toggleVisibility', 'destroy');
      //this.model.bind('change', this.render);
      this.collection.bind('reset', this.render);
      this.collection.bind('add', this.renderTag);

      this.bind('change:tagdrag_visible', this.toggleVisibility);

      App.globalController.register(this);
    },

    toggleVisibility: function(show) {
      if (show)
        $(this.el).removeClass('hide');
      else
        $(this.el).addClass('hide');
    },

    destroy: function() {
      App.globalController.unregister(this);
      this.remove();
      this.unbind();
    },

    template: $.templates(null, '<div class="tags"></div><div class="clearer"></div>'),

    render: function() {
      $(this.el).html(this.template.render({}));
      console.log("render in TagDragListView: %o", this);
      this.collection.each(this.renderTag);
      this.toggleVisibility(App.globalController.get('tagdrag_visible'));
      console.log(this);
    },

    renderTag: function(tag) {
      console.log("renderDragTag: tag=%o", tag);
      var tagView = new App.TagDragView({model: tag});
      $(this.el).children('.tags').append($(tagView.render()));
      console.log(this.el, tagView.render());
    }
  });



});
