require([
  "appns",
  "jquery",
  "underscore",
  "global-controller",
  "backbone",
  "backbone-relational",
  "models/users",
  "models/tag_link",
  "models/tag",
  "models/project",
  "models/settings",
  "models/events",
  "models/note",
  "models/task",
  "models/wiki",
  "views/error",
  "views/navbar",
  "views/users",
  "views/project",
  "views/settings",
  "views/events",
  "views/applied_tag",
  "views/tag_drag",
  "views/tag",
  "views/note",
  "views/task",
  "views/wiki",
  "jquery.tools",
  "jquery-ui",
  "jquery.magicedit2",
  "jquery.elastic",
  "jsrender"
], function(App, $, _, GlobalController, Backbone) {

  // Insert all templates
  // XXX: adjust >= according to number of non-templates in
  //      dependencies.
  for (l = arguments.length-1 ; l >= 6; l--)
    $("body").append(arguments[l]);


  String.prototype.trunc = function(n,useWordBoundary) {
    var toLong = this.length>n,
    s_ = toLong ? this.substr(0,n-1) : this;
    s_ = useWordBoundary && toLong ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
    return  toLong ? s_ +'...' : s_;
  };


  $.views.helpers({
    projectId: function() {
      return App.globalController.get('projectId');
    },

    textcolor: function(bgcolor) {
      // http://stackoverflow.com/questions/946544/good-text-foreground-color-for-a-given-background-color
      var r = parseInt(bgcolor.substring(1,3), 16);
      var g = parseInt(bgcolor.substring(3,5), 16);
      var b = parseInt(bgcolor.substring(5,7), 16);
      var gray = r*0.299 + g*0.587 + b*0.114;

      return (gray > 150) ? "black" : "white";
    },

    access: function(obj, key) {
      return obj[key];
    },

    settingArrayContains: function(settings, key, needle) {
      var t = settings[key];
      if (typeof(t) === 'undefined')
	return false;
      else 
	t = t.split(',');
      console.log('settings array %o', t);
      return (_.indexOf(t, needle) >= 0) ? true : false;
    },

    settingToArray: function(settings, key) {
      var t = settings[key];
      if (typeof(t) === 'undefined')
	return [];
      else
	return t.split(',');
    },

    settingToMapArray: function(settings, key) {
      var mapArr = [];

      _.each(settings[key].split(','), function(e) {
	var s = e.split(':');
	mapArr.push({key: s[0], value: s[1]});
      });

      return mapArr;
    },


    userAvatar: function(user_id, size) {
      console.log('userAvatar for user_id = ', user_id);
      var baseUrl = '';

      if (user_id == null)
	baseUrl = "http://www.gravatar.com/avatar/00000000000000000000000000000000";
      else
	baseUrl = "http://www.gravatar.com/avatar/" + ((typeof(user_id) === 'number') ? App.userCollection.get(user_id).get('email_hashed') : user_id);

      baseUrl += "?d=mm" + ((typeof(size) !== 'undefined') ? ("&s=" + size) : "");

      return baseUrl;
    },


    userName: function(user_id) {
      console.log('userName for user_id = ', user_id);

      if (user_id == null)
	return "Unknown user";

      return App.userCollection.get(user_id).get('name');
    },

    curUserName: function() {
      return App.currentUser.get('name');
    },

    curUserAvatar: function(size) {
      return $.views.helpers.userAvatar(App.currentUser.get('email_hashed'), size);
    }
  });



  ////////////////////////////////////////////////////////
  // NOTES


  App.GlobalController = GlobalController.extend({
    events: {
      "change:projectId"    : "changeProjectId",
      "change:project"      : "changeProject",
      "navigate"            : "navigate",
      "select:tag"          : "updateFilter",
      "register"            : "registered",
      "reload:settings"     : "loadKnownSettings"
    },

    attributes: {
      filter: false
    },

    initialize: function() {
      _.bindAll(this,
		'changeProjectId',
		'changeProject',
		'updateFilter',
		'registered',
		'loadKnownSettings',
		'navigate');
    },

    registered: function(listener) {
    },

    updateFilter: function(tag) {
      var selTags = App.tagCollection.where({selected: true});
      var selTagIds = _.pluck(selTags, "id");

      console.log(selTagIds);

      this.set('filter:tags', selTags);
      this.set('filter:tag_ids', selTagIds);
      this.set('filter', (selTags.length > 0) ? true : false);
    },

    navigate: function(item) {
    },

    changeProjectId: function(newProj, oldProj) {
      var self = this;
      if (newProj === oldProj)
	return;

      var projectModel = App.projectCollection.get(newProj);
      this.set('project', projectModel);
    },


    loadKnownSettings: function() {
      var s = App.settingsCollection.where({ key: 'tasks:default_sort' });
      if (s.length > 0)
	this.set('tasks:order', s[0].get('value'));
    },


    changeProject: function(newModel, oldModel) {
      this.set('filter', false);

      console.log("changeProject: ", newModel, oldModel);
      if (typeof(newModel) !== 'undefined') {
	App.userCollection.fetch({async: false});
	App.settingsCollection.fetch({async: false});
	App.tagCollection.fetch({async: false});

	this.trigger('reload:settings');
      }
    }
  });




  Backbone.wrapError = function(onError, originalModel, options) {
    return function(model, resp) {
      resp = model === originalModel ? resp : model;
      if (onError) {
        onError(originalModel, resp, options);
      } else {
        originalModel.trigger('error', originalModel, resp, options);
      }

      App.globalController.trigger('backbone:error', resp, originalModel);
    };
  };






  App.Router = Backbone.Router.extend({
    routes: {
      ""                                        : "showProjects",
      "user/settings"                           : "showUserSettings",
      "project/:projectId/settings"             : "showSettings",
      "project/:projectId/timeline"             : "showTimeline",
      "project/:projectId/notes"                : "showNotes",
      "project/:projectId/tasks"                : "showTasks",
      "project/:projectId/wikis"                : "showWikis",
      "project/:projectId/wikis/:wiki"          : "showWiki",
      "project/:projectId/wikis/:wiki/edit"     : "showWikiEdit",
      "project/:projectId/wikis/:wiki/history"  : "showWikiHistory",
      "project/:projectId/wikis/:wiki/history/:wc"  : "showWikiHistoric"

    },


    currentView: null,
    currentSidebarView: null,

    initialize: function() {
    },

    cleanView: function() {
      if (this.currentView != null && typeof(this.currentView.destroy) === 'function') {
	this.currentView.destroy();
	this.currentView = null;
      }

      if (this.currentSidebarView != null && typeof(this.currentSidebarView.destroy) === 'function') {
	this.currentSidebarView.destroy();
	this.currentSidebarView = null;
      }

      if (this.currentTagDraView != null && typeof(this.currentTagDragView.destroy) === 'function') {
	this.currentTagDragView.destroy();
	this.currentTagDragView = null;
      }
    },


    showTags: function() {
      //App.tagCollection  = new App.TagCollection();

      this.currentSidebarView = App.tagListView = new App.TagListView({
	el: $('<div></div>').appendTo('#sidebar'),
	collection: App.tagCollection
      });

      this.currentTagDragView = App.tagDragListView = new App.TagDragListView({
	el: $('<div class="tagdrag-container"></div>').appendTo('#tagdrag'),
	collection: App.tagCollection
      });

      this.currentSidebarView.render();
      this.currentTagDragView.render();

      // XXX: Kludge; for some reason the tag collection needs
      //      to be fetched synchronously (and first), otherwise
      //      the relationships won't work as expected.
      //App.tagCollection.fetch({async: false});
    },


    showProjects: function() {
      this.cleanView();
      App.globalController.set('projectId', -1);
      App.globalController.trigger('navigate', 'home');

      this.currentView = App.projectListView = new App.ProjectListView({
	el: $('<div></div>').appendTo('#main-pane'),
	collection: App.projectCollection
      });

      App.projectListView.render();
    },



    showUserSettings: function() {
      this.cleanView();
      App.globalController.set('projectId', -1);
      App.globalController.trigger('navigate', 'home');

      this.currentView = App.userSettingsView = new App.UserSettingsView({
	el: $('<div></div>').appendTo('#main-pane'),
	model: App.currentUser
      });

      App.userSettingsView.render();
    },



    showSettings: function(proj) {
      this.cleanView();

      App.globalController.set('projectId', proj);
      App.globalController.trigger('navigate', 'settings');

      this.showTags();

      App.extResourceCollection = new App.ExtResourceCollection();

      this.currentView = App.settingsView   = new App.SettingsView({
        el: $('<div></div>').appendTo('#main-pane'),
        collection: App.settingsCollection,
	projectModel: App.globalController.get('project'),
	extResourceCollection: App.extResourceCollection
      });

      App.settingsView.render();
      App.extResourceCollection.fetch();
    },



    showTimeline: function(proj) {
      this.cleanView();

      App.globalController.set('projectId', proj);
      App.globalController.trigger('navigate', 'timeline');

      this.showTags();

      App.eventCollection = new App.EventCollection();
      this.currentView = App.eventListView = new App.EventListView({
        el: $('<div></div>').appendTo('#main-pane'),
        collection: App.eventCollection
      });
      App.eventCollection.fetch({data: { limit: 100, offset: 0 }});
    },



    showNotes: function(proj) {
      this.cleanView();

      App.globalController.set('projectId', proj);
      App.globalController.trigger('navigate', 'notes');

      this.showTags();

      App.noteCollection = new App.NoteCollection();
      this.currentView = App.noteListView   = new App.NoteListView({
        el: $('<div></div>').appendTo('#main-pane'),
        collection: App.noteCollection
      });
      App.noteCollection.fetch({data: { limit: 100, offset: 0, filter: { tags: App.globalController.get('filter:tag_ids') } }});
    },




    showWikis: function(proj) {
      this.cleanView();

      App.globalController.set('projectId', proj);
      App.globalController.trigger('navigate', 'wikis');

      this.showTags();

      App.wikiCollection = new App.WikiCollection();
      this.currentView = App.wikiListView   = new App.WikiListView({
        el: $('<div></div>').appendTo('#main-pane'),
        collection: App.wikiCollection
      });
      App.wikiCollection.fetch({data: { limit: 100, offset: 0, filter: { tags: App.globalController.get('filter:tag_ids') } }});
    },


    showWiki: function(proj, wiki) {
      this.cleanView();

      App.globalController.set('projectId', proj);
      App.globalController.trigger('navigate', 'wikis');

      //this.showTags();

      App.wikiModel = new App.Wiki({id: wiki, project_id: proj});
      this.currentView = App.wikiView   = new App.WikiView({
        el: $('<div></div>').appendTo('#main-pane'),
        model: App.wikiModel
      });

      App.wikiModel.fetch();
    },


    showWikiHistoric: function(proj, wiki, wc) {
      this.cleanView();

      App.globalController.set('projectId', proj);
      App.globalController.trigger('navigate', 'wikis');

      //this.showTags();

      App.wikiModel = new App.Wiki({id: wiki, project_id: proj});
      this.currentView = App.wikiHistoricView   = new App.WikiHistoricView({
        el: $('<div></div>').appendTo('#main-pane'),
        model: App.wikiModel,
	wcId: wc
      });

      App.wikiModel.fetch();
    },



    showWikiEdit: function(proj, wiki) {
      this.cleanView();

      App.globalController.set('projectId', proj);
      App.globalController.trigger('navigate', 'wikis');

      //this.showTags();

      App.wikiModel = new App.Wiki({id: wiki, project_id: proj});
      this.currentView = App.wikiEditView   = new App.WikiEditView({
        el: $('<div></div>').appendTo('#main-pane'),
        model: App.wikiModel
      });

      App.wikiModel.fetch();
    },



    showWikiHistory: function(proj, wiki) {
      this.cleanView();

      App.globalController.set('projectId', proj);
      App.globalController.trigger('navigate', 'wikis');

      //this.showTags();

      App.wikiModel = new App.Wiki({id: wiki, project_id: proj});
      this.currentView = App.wikiHistoryView   = new App.WikiHistoryView({
        el: $('<div></div>').appendTo('#main-pane'),
        model: App.wikiModel
      });

      App.wikiModel.fetch();
    },




    showTasks: function(proj) {
      this.cleanView();

      App.globalController.set('projectId', proj);
      App.globalController.trigger('navigate', 'tasks');

      this.showTags();

      App.taskCollection = new App.TaskCollection();
      this.currentView = App.taskListView = new App.TaskListView({
	el: $('<div></div>').appendTo('#main-pane'),
	collection: App.taskCollection
      });
      //App.taskCollection.fetch({data: { filter: { tags: [5,17] }}});
      App.taskCollection.fetch();
    }
  });

  App.globalController = new App.GlobalController();

  App.errorView = new App.ErrorView({
    el: $('#content .errors')
  });

  App.currentUser = new App.User();
  App.currentUser.fetch({async: false});

  App.settingsCollection = new App.SettingsCollection();
  App.tagCollection = new App.TagCollection();
  App.userCollection = new App.UserCollection();
  App.projectCollection = new App.ProjectCollection();
  App.projectCollection.fetch({async: false});

  
  App.navbarView = new App.NavbarView({
    el: $('#navbar .grid_16')
  });


  App.projectNameView = new App.ProjectNameView({
    el: $('#logo .project-name')
  });

  App.router = new App.Router;
  Backbone.history.start();

});

