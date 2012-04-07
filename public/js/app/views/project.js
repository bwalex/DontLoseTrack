define(['appns', 'jquery', 'underscore', 'backbone', 'backbone-relational', 'jquery.elastic', 'jquery.magicedit2', 'jsrender'], function(App, $, _, Backbone) {

  App.ProjectNameView = Backbone.View.extend({
    initialize: function() {
      this.bind('change:project', this.render);

      App.globalController.register(this);
    },

    template: $.templates(null, '<h2>{{:name}}</h2>'),

    render: function(project) {
      if (typeof(project) !== 'object')
	project = {toJSON: function() { return {}; }};

      $(this.el).html(this.template.render(project.toJSON()));
    },
  });


  App.ProjectLinkView = Backbone.View.extend({
    tagName: 'tr',
    className: 'ProjectLinkView',

    events: {
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    initialize: function(params) {
      _.bindAll(this, 'render', 'destroy');
      this.model.bind('destroy', this.destroy);

      this.extraClass = params['extraClass'];
    },

    template: $.templates('#project-link-tmpl'),

    render: function() {
      console.log("extraClass: ", this.extraClass);
      return $(this.el)
	  .addClass(this.extraClass)
	  .html(this.template.render(this.model.toJSON()));
    }
  });


  App.ProjectListView = Backbone.View.extend({
    events: {
      "focus #newprojectname"          : "newProjFocus",
      "focusout #newprojectname"       : "newProjFocusOut",
      "keypress #newprojectname"       : "newProjKeypress"
    },

    renderCount: 0,

    newProjFocus: function(ev) {
      if ($(ev.currentTarget).val() == 'Add Project...')
	$(ev.currentTarget).val('');
    },

    newProjFocusOut: function(ev) {
      if ($(ev.currentTarget).val() == '')
	$(ev.currentTarget).val('Add Project...');
    },

    newProjKeypress: function(ev) {
      var self = this;

      if (ev.keyCode === 13 /* ENTER */) {
	var m = new App.Project({ name: $(ev.currentTarget).val() });
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

    destroy: function() {
      this.remove();
      this.unbind();
    },

    initialize: function() {
      _.bindAll(this, 'render', 'renderProject', 'destroy');
      this.collection.bind('add', this.renderProject);
      this.collection.bind('reset', this.render);
    },

    template: $.templates('#project-list-tmpl'),

    render: function() {
      this.renderCount = 0;
      $(this.el).html(this.template.render({}));
      this.collection.each(this.renderProject);
    },

    renderProject: function(p) {
      this.renderCount++;
      var extraClass = (this.renderCount%2) ? 'odd' : 'even';
      console.log("extraClass in ListView: ", extraClass);
      var pView = new App.ProjectLinkView({model: p, extraClass: extraClass});
      $(this.el).find('table').append($(pView.render()));
    }
  });


});
