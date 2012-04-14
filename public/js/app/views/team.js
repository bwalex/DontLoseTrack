define(['appns', 'jquery', 'underscore', 'backbone', 'backbone-relational', 'jquery.elastic', 'jquery.magicedit2', 'jquery.autoclear', 'jsrender', 'jquery.tools'], function(App, $, _, Backbone) {

  App.ProjectUserView = Backbone.View.extend({
    tagName: 'tr',
    className: 'projectUserView',

    events: {
      "click .actions > button.delete-user"           : "deleteUser",
      "click .modal button.transfer-ownership"        : "transferOwnership"
    },

    transferOwnership: function(ev) {
      var p = App.globalController.get('project');
      var u = this.model.get('user_id');
      p.save(
	{
	  'new_owner': u
	},
	{
	  partialUpdate: true,
	  wait: true,
	  success: function(model, oldModel) {
	    App.router.navigate("", {trigger: true});
	  }
	}
      );
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    deleteUser: function(ev) {
      this.model.destroy();
    },

    initialize: function() {
      _.bindAll(this, 'render', 'destroy', 'deleteUser', 'transferOwnership');

      this.model.bind('change', this.render);
      this.model.bind('destroy', this.destroy);
    },

    template: $.templates('#project-user-tmpl'),

    render: function() {
      console.log('model: %o', this.model.attributes);
      var u = this.model.get('user_id');
      console.log('u = ', u);
      console.log('userColl: %o', App.userCollection);
      u = App.userCollection.get(u);
      console.log('u ==> ', u);
      $(this.el).html(this.template.render(u.toJSON()));
      $(this.el).find('.actions > button.transfer-ownership').overlay({
	target: $(this.el).find('.transfer-ownership-modal'),
	//load: true,

	mask: {
	  color: '#99173C',
	  opacity: 0.8
	},
	closeOnClick: false
      });
      return $(this.el);
    }
  });


  App.ProjectUserListView = Backbone.View.extend({
    tagName: 'div',
    className: 'extProjectUserListView',

    events: {
      "keypress #newprojectuser"          : "newUserKeypress",
      "click .projectuser-leave button"   : "leaveProject"
    },

    leaveProject: function(ev) {
      var pu = this.collection.where({ user_id: App.currentUser.get('id') });
      if (pu.length < 1)
	return;

      pu[0].destroy();

      App.projectCollection.fetch();
      App.router.navigate("", { trigger: true });
    },

    newUserKeypress: function(ev) {
      var self = this;

      if (ev.keyCode === 13 /* ENTER */) {
	var e = new App.ProjectUser({
	  user_alias: $(this.el).find('#newprojectuser').val()
	});

	e.save({},{
	  wait: true,
	  success: function(model, resp) {
	    console.log("Success: ", model, resp);
	    App.globalController.trigger('refresh:users');

	    self.collection.add(e);
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
      _.bindAll(this, 'render', 'renderUser', 'leaveProject', 'newUserKeypress', 'destroy');

      console.log("===> %o", this.collection);

      this.collection.bind('add', this.renderUser);
      this.collection.bind('reset', this.render);
    },

    template: $.templates('#project-user-list-tmpl'),

    render: function() {
      $(this.el).html(this.template.render({}));
      $(this.el).find('.autoclear').autoclear();
      this.collection.each(this.renderUser);

      return $(this.el);
    },

    renderUser: function(m) {
      var puView = new App.ProjectUserView({model: m});
      $(this.el).find('.projectuser-list').append($(puView.render()));
    }
  });

});
