define(['appns', 'jquery', 'underscore', 'backbone', 'backbone-relational', 'jquery.elastic', 'jquery.magicedit2', 'jsrender', 'jquery.tools'], function(App, $, _, Backbone) {


  App.EventView = Backbone.View.extend({
    tagName: 'div',
    className: 'eventView',

    events: {
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    initialize: function() {
      _.bindAll(this, 'render', 'destroy');

      this.model.bind('change', this.render);
      this.model.bind('destroy', this.destroy);
    },

    template: $.templates('#event-tmpl'),

    render: function() {
      return $(this.el).html(this.template.render(this.model.toJSON()));
    }
  });


  App.EventListView = Backbone.View.extend({
    events: {
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    initialize: function() {
      _.bindAll(this, 'render', 'renderEvent', 'destroy');

      this.collection.bind('add', this.renderEvent);
      this.collection.bind('reset', this.render);
    },

    template: $.templates('#event-list-tmpl'),

    render: function() {
      $(this.el).html(this.template.render({}));
      this.collection.each(this.renderEvent);

      return $(this.el);
    },

    renderEvent: function(m) {
      var eView = new App.EventView({model: m});
      $(this.el).find('.event-list').append($(eView.render()));
    }
  });


});
