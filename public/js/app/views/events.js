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
      "click #eventfooter a"             : "loadMore",
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    initialize: function() {
      _.bindAll(this, 'render', 'renderEvent', 'renderEventAt', 'toggleLoadMoreBtn', 'destroy', 'forceRefetch', 'loadMore');

      this.collection.bind('add', this.renderEvent);
      this.collection.bind('reset', this.render);
    },

    template: $.templates('#event-list-tmpl'),

    forceRefetch: function(ids, opts) {
      if (typeof(ids) === 'undefined')
	ids = App.globalController.get('filter:tag_ids');

      var limit = App.globalController.get('events:nFetched', 30);
      if (limit < 30)
	limit = 30;
      var offset = App.globalController.get('events:fetchOffset', 0);
      App.globalController.set('events:nFetched', 0);

      this.collection.fetch({data: { limit: limit, offset: offset, filter: { tags: ids } }});
    },

    loadMore: function(ev) {
      var limit = 30;
      var offset = App.globalController.get('events:nFetched', 0);
      var ids = App.globalController.get('filter:tag_ids');

      this.collection.fetch({
	data: {
	  limit: limit,
	  offset: offset,
	  filter: {
	    tags: ids
	  }
	},
	add: true
      });
    },

    toggleLoadMoreBtn: function(ev) {
      var n_events = this.collection.length;
      var total_events = App.globalController.get('project').get('event_stats').total;
      console.log('events/events', n_events, total_events);
      if (n_events < total_events)
	$(this.el).find('#eventfooter a').removeClass('hide');
      else
	$(this.el).find('#eventfooter a').addClass('hide');
    },

    render: function() {
      var n_events = this.collection.length;
      App.globalController.set('events:nFetched');

      $(this.el).html(this.template.render({}));
      this.collection.each(this.renderEvent);
      this.toggleLoadMoreBtn();

      return $(this.el);
    },

    renderEvent: function(m, opt1, opt2) {
      var n_events = this.collection.length;
      App.globalController.set('events:nFetched', n_events);

      var idx = (typeof(opt1) === 'number') ? opt1 : opt2.index;
      console.log("renderEvent: idx=%o", idx);
      this.renderEventAt(m, idx);
      this.toggleLoadMoreBtn();
    },

    renderEventAt: function(m, idx) {
      var elist = $(this.el).find('.event-list');
      var nelems = elist.children().length;

      var eView = new App.EventView({model: m});
      var eHTML = $(eView.render());

      if (idx >= nelems)
	elist.append(eHTML);
      else
	elist.children().slice(idx).first().before(eHTML);
    }
  });


});
