require([
  "jquery.tools",
  "jquery-ui-1.8.18.custom.min",
  "jquery.magicedit2",
  "jquery.elastic",
  //"jquery.views",
  "require.text!/tmpl/test.tmpl",
  "require.text!/tmpl/note.tmpl",
  "require.text!/tmpl/note-list.tmpl",
  "require.text!/tmpl/task.tmpl",
  "require.text!/tmpl/task-list.tmpl",
  "require.text!/tmpl/taskdep.tmpl",
  "require.text!/tmpl/tag.tmpl",
  "require.text!/tmpl/tag-list.tmpl",
  "require.text!/tmpl/tag-norm.tmpl",
  "require.text!/tmpl/tag-applied.tmpl",
  "require.text!/tmpl/project-list.tmpl",
  "require.text!/tmpl/project-link.tmpl",
  "require.text!/tmpl/navbar.tmpl",
  "require.text!/tmpl/wiki-list.tmpl",
  "require.text!/tmpl/wiki-overview.tmpl",
  "require.text!/tmpl/wiki.tmpl"
], function() {

  // Insert all templates
  // XXX: adjust >= according to number of non-templates in
  //      dependencies.
  for (l = arguments.length-1 ; l >= 4; l--)
    $("body").append(arguments[l]);

  // Set up tabs
  //$(".tabs:first").tabs(".panes:first > div", { history: false });


  String.prototype.trunc = function(n,useWordBoundary) {
    var toLong = this.length>n,
    s_ = toLong ? this.substr(0,n-1) : this;
    s_ = useWordBoundary && toLong ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
    return  toLong ? s_ +'...' : s_;
  };


  $.views.helpers({
    textcolor: function(bgcolor) {
      // http://stackoverflow.com/questions/946544/good-text-foreground-color-for-a-given-background-color
      var r = parseInt(bgcolor.substring(1,3), 16);
      var g = parseInt(bgcolor.substring(3,5), 16);
      var b = parseInt(bgcolor.substring(5,7), 16);
      var gray = r*0.299 + g*0.587 + b*0.114;

      return (gray > 150) ? "black" : "white";
    }
  });



  ////////////////////////////////////////////////////////
  // NOTES

  $.app = {};

  DontLoseTrack = this.DontLoseTrack = {};

  var GlobalController = DontLoseTrack.GlobalController = function(options) {
    this.listeners = [];

    this.initialize.apply(this, options);
  };

  _.extend(GlobalController.prototype, {
    events: {},

    attributes: {},

    initialize: function(){},

    register: function(listener, options) {
      if ((typeof(listener) !== 'object') ||
	  (typeof(listener.trigger) !== 'function')) {
	throw "Only objects with a 'trigger' function can be registered";
      }

      var opts = (typeof(options) === 'object') ? options : {};

      this.listeners.push({ obj: listener, opts: opts});
      this.trigger('register', listener);
    },

    unregister: function(listener) {
      this.listeners = _.reject(this.listeners, function(l) {
	return (l.obj === listener);
      });
    },

    get: function(attr) {
      return this.attributes[attr];
    },

    set: function(attr, val) {
      var oldVal = this.attributes[attr];
      this.attributes[attr] = val;

      this.trigger('change:'+attr, val, oldVal);
    },

    trigger: function(event) {
      console.log('GlobalController: trigger event', event);
      var args = Array.prototype.slice.call(arguments, 1);
      var allArgs = Array.prototype.slice.call(arguments);

      _.each(this.listeners, function(listener) {
	listener.obj.trigger.apply(listener.obj, allArgs);
      });

      var handler = null;

      if (typeof(this.events[event]) === 'string')
	handler = this[this.events[event]];
      else if (typeof(this.events[event]) === 'function')
	handler = this.events[event];

      if (typeof(handler) === 'function')
	handler.apply(this, args);
    }
  });

  GlobalController.extend = function(protoProps, classProps) {
    var ctor = function(){};

    var inherits = function(parent, protoProps, staticProps) {
      var child;

      // The constructor function for the new subclass is either defined by you
      // (the "constructor" property in your `extend` definition), or defaulted
      // by us to simply call the parent's constructor.
      if (protoProps && protoProps.hasOwnProperty('constructor')) {
	child = protoProps.constructor;
      } else {
	child = function(){ parent.apply(this, arguments); };
      }

      // Inherit class (static) properties from parent.
      _.extend(child, parent);

      // Set the prototype chain to inherit from `parent`, without calling
      // `parent`'s constructor function.
      ctor.prototype = parent.prototype;
      child.prototype = new ctor();

      // Add prototype properties (instance properties) to the subclass,
      // if supplied.
      if (protoProps) _.extend(child.prototype, protoProps);

      // Add static properties to the constructor function, if supplied.
      if (staticProps) _.extend(child, staticProps);

      // Correctly set child's `prototype.constructor`.
      child.prototype.constructor = child;

      // Set a convenience property in case the parent's prototype is needed later.
      child.__super__ = parent.prototype;

      return child;
    };

    var child = inherits(this, protoProps, classProps);


    child.extend = this.extend;
    return child;
  };



  $.app.GlobalController = DontLoseTrack.GlobalController.extend({
    events: {
      "change:projectId"    : "changeProjectId",
      "change:project"      : "changeProject",
      "navigate"            : "navigate",
      "select:tag"          : "updateFilter",
      "register"            : "registered"
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
		'navigate');
    },

    registered: function(listener) {
    },

    updateFilter: function(tag) {
      var selTags = $.app.tagCollection.where({selected: true});
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

      var projectModel = $.app.projectCollection.get(newProj);
      this.set('project', projectModel);
    },

    changeProject: function(newModel, oldModel) {
      this.set('filter', false);
      //this.set('filter:tags', []);
      //this.set('filter:tag_ids', []);

      console.log("changeProject: ", newModel, oldModel);
      if (typeof(newModel) !== 'undefined')
	$.app.tagCollection.fetch({async: false});
    }
  });



  $.app.Project = Backbone.Model.extend({
    urlRoot: '/api/project',
    idAttribute: 'id'
  });

  $.app.ProjectCollection = Backbone.Collection.extend({
    url: '/api/project',
    model: $.app.Project
  });


  $.app.TaskDep = Backbone.RelationalModel.extend({
    urlRoot: function() {
      return '/api/project/'+ $.app.globalController.get('projectId') +'/taskdep';
    },

    idAttribute: 'id',
    initialize: function() {
      var dit = this;
      console.log("moo, taskdep: %o", this);
      //console.log(this.get("dependency") === this.get("task"));
      //this.get('dependency').on('change', function(model) {
	//dit.trigger('change:dep', model);
        //dit.get('task').trigger('change:dep', model);
      //});
    },
    toJSON: function() {
      return { task_id: this.get('task').get('id'), dependency_id: this.get('dependency').get('id') };
    }
  });

  $.app.TaskTag = Backbone.RelationalModel.extend({
    urlRoot:  function() {
      return '/api/project/'+ $.app.globalController.get('projectId') +'/tasktag';
    },
    idAttribute: 'id',
    initialize: function() {
      var dit = this;
      console.log("this.get('tag'):");

      this.on('destroy:tag', function(model) {
	var task = dit.get('task');
	if (typeof(task) !== 'undefined')
	  task.trigger('destroy:tag', model);
      });

      this.on('change:tag', function(model) {
	var task = dit.get('task');
	if (typeof(task) !== 'undefined')
          task.trigger('change:tag', model);
      });
    },
    toJSON: function() {
      return { task_id: this.get('task').get('id'), tag_id: this.get('tag').get('id') };
    }
  });

  $.app.Task = Backbone.RelationalModel.extend({
    iSortWeight: 0,

    defaults: {
      expanded: false
    },
    urlRoot: function() {
      return '/api/project/'+ $.app.globalController.get('projectId') +'/task';
    },

    calcISortWeight: function() {
      console.log('calcISortWeight for ', this);
      if (this.isNew())
	return;

      if (this.get('completed') === true) {
	this.iSortWeight = -5;
	return;
      }

      var today = Math.floor(Date.now()/1000/(3600*24));
      var extraDays = 10;

      function dd_diff_weight(m) {
	var m_dd = m.get('raw_due_date');
	var m_dd_diff = (m_dd != null) ? today + extraDays - m_dd/(3600*24) : 0;
	var m_dd_weight = (m_dd_diff < 0) ? 0 : (m_dd_diff > 10) ? 10 : m_dd_diff; // range is 0 .. 10
	return m_dd_weight;
      }

      var a_dd_weight = dd_diff_weight(this); // range is 0 .. 10

      var a_pri = this.get('raw_importance') - 2; // normalize so range is -2 .. 1 (none .. high)
      var a_blocked = this.get('blocked'); // true or false
      var a_depends = this.get('task_deps').length; // number of tasks this task depends on
      var a_depweight = 0; // weight of the sum of the tasks that depend on this one

      function depweight(d) {
	var d_dd_weight = dd_diff_weight(d); // range 0 .. 10
	var d_pri = (typeof(d.get('raw_importance')) !== 'undefined') ? d.get('raw_importance') -2 : 0; // range -2 .. 1
	var d_blocked = d.get('blocked'); // true or false
	var d_completed = d.get('completed');
	var d_ndeps = (typeof(d.get('dep_tasks')) !== 'undefined') ? d.get('dep_tasks').length : 0; // number of tasks that depend on this one

	console.log('depweight. pri? %o, dd_weight? %o, ndeps? %o', d_pri, d_dd_weight, d_ndeps);
	return (d_blocked || d_completed) ? 0 : 3*d_pri + d_dd_weight + d_ndeps;
      }

      this.get('dep_tasks').each(function(m) {
	a_depweight += depweight(m);
      });


      console.log('blocked? %o, pri? %o, dd_weight? %o, dep_weight? %o, depends? %o',
		  a_blocked, a_pri, a_dd_weight, a_depweight, a_depends);
      var a_total_weight = (a_blocked) ? 0 : 3*a_pri + a_dd_weight + a_depweight/4 - a_depends;

      this.iSortWeight = a_total_weight;
    },

    initialize: function() {
      _.bindAll(this, 'calcISortWeight');
      this.bind('change', this.calcISortWeight);
      this.bind('tasks:refreshSort', this.calcISortWeight);
      $.app.globalController.register(this);
      this.calcISortWeight();
    },

    idAttribute: 'id',
    relations: [
      {
        type: Backbone.HasMany,
        key:  'task_deps',
        relatedModel: $.app.TaskDep,
        reverseRelation: {
          key: 'task',
	  keySource: 'task_id'
        }
      },
      {
        type: Backbone.HasMany,
        key:  'dep_tasks',
        relatedModel: $.app.TaskDep,
        reverseRelation: {
          key: 'dependency',
	  keySource: 'dependency_id'
        }
      },
      {
	type: Backbone.HasMany,
	key:  'task_tags',
	relatedModel: $.app.TaskTag,
	reverseRelation: {
	  key: 'task',
	  keySource: 'task_id'
	}
      }
    ]
  });

  $.app.TaskCollection = Backbone.Collection.extend({
    url: function() {
      return '/api/project/'+ $.app.globalController.get('projectId') +'/task';
    },


    sortDueDate: function(a, b) {
      var a_dd = a.get('raw_due_date');
      var b_dd = b.get('raw_due_date');
      var a_pri = a.get('raw_importance');
      var b_pri = b.get('raw_importance');

      if (a_dd != b_dd)
	return (a_dd === null && b_dd === null) ? 0 :
	  (a_dd === null) ?  1 :
	  (b_dd === null) ? -1 :
	  (a_dd - b_dd);

      return (b_pri - a_pri);
    },


    sortPriority: function(a, b) {
      console.log('sortPriorty!... ', a, b);
      var a_dd = a.get('raw_due_date');
      var b_dd = b.get('raw_due_date');
      var a_pri = a.get('raw_importance');
      var b_pri = b.get('raw_importance');

      console.log('ab, pri: ', a_pri, b_pri);

      if (a_pri != b_pri)
	return (b_pri - a_pri);

      return (a_dd === null && b_dd === null) ? 0 :
	  (a_dd === null) ?  1 :
	  (b_dd === null) ? -1 :
	  (a_dd - b_dd);
    },


    sortIntelligent: function(a, b) {
      return (b.iSortWeight - a.iSortWeight);
    },

    updateComparator: function(order) {
      if (typeof(order) === 'undefined')
	order = $.app.globalController.get('tasks:order');

      if (order === 'intelligent')
	this.comparator = this.sortIntelligent;
      else if (order === 'duedate')
	this.comparator = this.sortDueDate;
      else if (order === 'importance')
	this.comparator = this.sortPriority;
      else
	/* Default sorter */
	this.comparator = this.sortPriority;

      console.log("Setting comparator...", this.comparator);
    },

    initialize: function() {
      _.bindAll(this, "updateComparator");
      this.bind('change:tasks:order', this.updateComparator);
      this.updateComparator();
      $.app.globalController.register(this);
    },

    model: $.app.Task
  });

  $.app.NoteTag = Backbone.RelationalModel.extend({
    urlRoot:  function() {
      return '/api/project/'+ $.app.globalController.get('projectId') +'/notetag';
    },

    idAttribute: 'id',

    initialize: function() {
      var dit = this;
      console.log("this.get('tag'):");

      this.on('destroy:tag', function(model) {
	var note = dit.get('note');
	if (typeof(note) !== 'undefined')
	  note.trigger('destroy:tag', model);
      });

      this.on('change:tag', function(model) {
	var note = dit.get('note');
        if (typeof(note) !== 'undefined')
	  note.trigger('change:tag', model);
      });
    },
    toJSON: function() {
      return { note_id: this.get('note').get('id'), tag_id: this.get('tag').get('id') };
    }
  });











 $.app.WikiTag = Backbone.RelationalModel.extend({
    urlRoot:  function() {
      return '/api/project/'+ $.app.globalController.get('projectId') +'/wikitag';
    },

    idAttribute: 'id',

    initialize: function() {
      var dit = this;
      console.log("this.get('tag'):");

      this.on('destroy:tag', function(model) {
	var wiki = dit.get('wiki');
	if (typeof(wiki) !== 'undefined')
	  wiki.trigger('destroy:tag', model);
      });

      this.on('change:tag', function(model) {
	var wiki = dit.get('wiki');
        if (typeof(wiki) !== 'undefined')
	  wiki.trigger('change:tag', model);
      });
    },
    toJSON: function() {
      return { wiki_id: this.get('wiki').get('id'), tag_id: this.get('tag').get('id') };
    }
  });


  $.app.WikiContent = Backbone.RelationalModel.extend({
    urlRoot: function() {
      return '/api/project/'+ $.app.globalController.get('projectId') + 'wiki/' + this.get('wiki').get('id') +'/wikicontent';
    },

    idAttribute: 'id'
  });

  $.app.WikiContentCollection = Backbone.Collection.extend({
    url: function(models) {
      return '/api/project/'+ $.app.globalController.get('projectId') + '/wikicontent' + ( models ? '/' + _.pluck( models, 'id' ).join(';') : '' );
    },
    model: $.app.WikiContent
  });


  $.app.Wiki = Backbone.RelationalModel.extend({
    defaults: {
      visible: true
    },
    urlRoot: function() {
      return '/api/project/'+ $.app.globalController.get('projectId') +'/wiki';
    },
    idAttribute: 'id',
    relations: [
      {
        type: Backbone.HasMany,
        key:  'wiki_tags',
        relatedModel: $.app.WikiTag,
        reverseRelation: {
          key: 'wiki',
	  keySource: 'wiki_id'
        }
      },
      {
	type: Backbone.HasMany,
	key:  'wiki_contents',
	relatedModel: $.app.WikiContent,
	collectionType: $.app.WikiContentCollection,
	reverseRelation: {
	  key: 'wiki',
	  keySource: 'wiki_id'
	}
      }
    ],
    initialize: function() {
    }
  });

  $.app.WikiCollection = Backbone.Collection.extend({
    url: function() {
      return '/api/project/'+ $.app.globalController.get('projectId') +'/wiki';
    },
    model: $.app.Wiki
  });













  $.app.Tag  = Backbone.RelationalModel.extend({
    defaults: {
      selected: false
    },
    urlRoot: function() {
      return '/api/project/'+ $.app.globalController.get('projectId') +'/tag';
    },
    idAttribute: 'id',
    relations: [
      {
        type: Backbone.HasMany,
        key:  'note_tags',
        relatedModel: $.app.NoteTag,
	includeInJSON: false,
        reverseRelation: {
          key: 'tag',
	  keySource: 'tag_id'
        }
      },
      {
	type: Backbone.HasMany,
	key:  'task_tags',
	relatedModel: $.app.TaskTag,
	includeInJSON: false,
	reverseRelation: {
	  key: 'tag',
	  keySource: 'tag_id'
	}
      },
      {
	type: Backbone.HasMany,
	key:  'wiki_tags',
	relatedModel: $.app.WikiTag,
	includeInJSON: false,
	reverseRelation: {
	  key: 'tag',
	  keySource: 'tag_id'
	}
      }
    ]
  });

  $.app.TagCollection = Backbone.Collection.extend({
    url: function() {
      return '/api/project/'+ $.app.globalController.get('projectId') +'/tag';
    },
    model: $.app.Tag
  });

  $.app.Note = Backbone.RelationalModel.extend({
    defaults: {
      visible: true
    },
    urlRoot: function() {
      return '/api/project/'+ $.app.globalController.get('projectId') +'/note';
    },
    idAttribute: 'id',
    relations: [
      {
        type: Backbone.HasMany,
        key:  'note_tags',
        relatedModel: $.app.NoteTag,
        reverseRelation: {
          key: 'note',
	  keySource: 'note_id'
        }
      }
    ],
    initialize: function() {
      this.on('change:tag', function(model) {
        console.log('related tag=%o updated', model);
      });
    }
  });

  $.app.NoteCollection = Backbone.Collection.extend({
    url: function() {
      return '/api/project/'+ $.app.globalController.get('projectId') +'/note';
    },
    model: $.app.Note
  });

  $.app.AppliedTagView = Backbone.View.extend({
    tagName: 'div',
    className: 'tagAppliedView',

    events: {
      "click .rm-icon > .rm-button"     : "removeMe",
    },

    initialize: function() {
      _.bindAll(this, 'render', 'removeMe', 'destroy');
      this.model.bind('change:tag', this.render);
      this.model.bind('change', this.render);
      //this.model.bind('remove', this.destroy);
      this.model.bind('destroy', this.destroy);
      this.model.bind('destroy:tag', this.destroy);
    },

    removeMe: function(ev) {
      console.log("AppliedTagView removeMe: %o", this);
      this.model.destroy();
    },

    destroy: function(ev) {
      console.log("AppliedTagView destroy: %o", this);
      this.remove();
      this.unbind();
    },

    template: $.templates('#tag-applied-tmpl'),

    render: function() {
      console.log("AppliedTagView... %o", this.model);

      if (this.model.get('tag') == null) {
	console.log("AppliedTagView early return");
	return;
      }
      var ht = $(this.el).html(this.template.render(this.model.get('tag').toJSON()));
      console.log("AppliedTagView render: %o", ht);
      return ht;
    }
  });

  $.app.NoteView = Backbone.View.extend({
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
	var m = new $.app.NoteTag({tag: tagModel, tag_id: tagModel.get('id'), note: this.model, note_id: this.model.get('id')});
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
        var tagView = new $.app.AppliedTagView({model: m });
        $(html).find('div.tags > .placeholder-tag').before($(tagView.render()));
      });

      $(html).children('.meta').tagDroppable({});
      console.log("app.NoteView.render: %o", this.model);

      if ($.app.globalController.get('filter') === true) {
	var seltags = $.app.globalController.get('filter:tags');

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

  $.app.NoteListView = Backbone.View.extend({
    tagName: 'div',
    className: 'noteListView',

    events: {
      "click .tabmenu .btn_addtag"      : "addTagBtn",
      "focus #newnotetext"              : "newNoteFocus",
      "focusout #newnotetext"           : "newNoteFocusOut",
      "submit #newnote"                 : "newNoteSubmit"
    },

    addTagBtn: function(ev) {
      $.app.globalController.trigger('btn:addTags');
    },

    tagbtn: function() {
      $(this.el).find('.tabmenu .btn_addtag')
	  .toggleClass('btn-selected');
    },

    destroy: function() {
      $.app.globalController.unregister(this);
      $.app.globalController.trigger('clean:addTags');
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

      var m = new $.app.Note({ text: $(ev.currentTarget).find('#newnotetext').val() });
      console.log("Moo, saving... ", m);
      m.save({},{
	wait: true,
	success: function(model, resp) {
	  console.log("Success: ", model, resp);
	  self.collection.add(m);
	  $(ev.currentTarget).find('#newnotetext').val("");
	  $(ev.currentTarget).find('#newnotetext').blur();
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
      $.app.globalController.register(this);
    },

    template: $.templates('#note-list-tmpl'),

    filterChange: function(ids) {
      this.forceRefetch(ids);
    },

    forceRefetch: function(ids) {
      if (typeof(ids) === undefined)
	ids = $.app.globalController.get('filter:tag_ids');

      this.collection.fetch({data: { limit: 100, offset: 0, filter: { tags: ids } }});
    },

    render: function() {
      $(this.el).html(this.template.render({}));
      $(this.el).find('#newnotetext').elastic();
      this.collection.each(this.renderNote);
    },

    renderNote: function(inote) {
      console.log("renderNote: inote=%o", inote);
      var noteView = new $.app.NoteView({model: inote});
      $(this.el).find('#notelist').prepend($(noteView.render()));
    }
  });



  $.app.TagView = Backbone.View.extend({
    tagName: 'div',
    className: 'tagView',

    events: {
      "click .tag"                      : "toggleFilter",
      "click .edit-icon > .edit-button" : "editTag",
      "click .rm-icon > .rm-button"     : "removeMe"
    },

    toggleFilter: function(ev) {
      this.model.set('selected', !this.model.get('selected'));
      $.app.globalController.trigger('select:tag', this.model);
    },

    initialize: function() {
      _.bindAll(this, 'render', 'editTag', 'removeMe', 'remove', 'toggleFilter');
      this.model.bind('change', this.render);
      this.model.bind('reset', this.render);
      this.model.bind('destroy', this.remove);
    },

    removeMe: function(ev) {
      $.app.globalController.trigger('select:tag', this.model);
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

      console.log("app.TagView.render: %o", this.model);
      return $(this.el).html(html);
    }
  });


  $.app.TagListView = Backbone.View.extend({
    tagName: 'div',
    className: 'tagListView',

    events: {
      "focus #newtagname"          : "newTagFocus",
      "focusout #newtagname"       : "newTagFocusOut",
      "keypress #newtagname"       : "newTagKeypress"
    },

    destroy: function() {
      $.app.globalController.unregister(this);
      this.remove();
      this.unbind();
    },

    newTagFocus: function(ev) {
      if ($(ev.currentTarget).val() == 'Add Tag...')
	$(ev.currentTarget).val('');
    },

    newTagFocusOut: function(ev) {
      if ($(ev.currentTarget).val() == '')
	$(ev.currentTarget).val('Add Tag...');
    },

    newTagKeypress: function(ev) {
      var self = this;

      if (ev.keyCode === 13 /* ENTER */) {
	var m = new $.app.Tag({ name: $(ev.currentTarget).val() });
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
		'newTagFocus',
		'newTagFocusOut',
		'newTagKeypress',
		'destroy');

      //this.model.bind('change', this.render);
      this.collection.bind('reset', this.render);
      this.collection.bind('add', this.renderTagTop);
      $.app.globalController.register(this);
    },

    template: $.templates('#tag-list-tmpl'),

    render: function() {
      $(this.el).html(this.template.render({}));
      this.collection.each(this.renderTag);
    },

    renderTag: function(tag) {
      console.log("renderTag: tag=%o", tag);
      var tagView = new $.app.TagView({model: tag});
      $(this.el).find('#tagfilterlist .tags').append($(tagView.render()));
      console.log(this.el, tagView.render());
    },

    renderTagTop: function(tag) {
      var tagView = new $.app.TagView({model: tag});
      $(this.el).find('#tagfilterlist .tags').prepend($(tagView.render()));
    }
  });


  $.app.TagDragView = Backbone.View.extend({
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


  $.app.TagDragListView = Backbone.View.extend({
    tagName: 'div',
    className: 'tagDragListView',
    initialize: function() {
      _.bindAll(this, 'render', 'renderTag', 'toggleVisibility', 'removeVisibility', 'destroy');
      //this.model.bind('change', this.render);
      this.collection.bind('reset', this.render);
      this.collection.bind('add', this.renderTag);

      this.bind('btn:addTags', this.toggleVisibility);
      this.bind('clean:addTags', this.removeVisibility);

      $.app.globalController.register(this);
    },

    toggleVisibility: function() {
      $(this.el).toggleClass('hide');
    },

    removeVisibility: function() {
      $(this.el).addClass('hide');
    },

    destroy: function() {
      $.app.globalController.unregister(this);
      this.remove();
      this.unbind();
    },

    template: $.templates(null, '<div class="tags"></div><div class="clearer"></div>'),

    render: function() {
      $(this.el).html(this.template.render({}));
      this.removeVisibility();
      console.log("render in TagDragListView: %o", this);
      this.collection.each(this.renderTag);
      console.log(this);
    },

    renderTag: function(tag) {
      console.log("renderDragTag: tag=%o", tag);
      var tagView = new $.app.TagDragView({model: tag});
      $(this.el).children('.tags').append($(tagView.render()));
      console.log(this.el, tagView.render());
    }
  });














  $.fn.tagDroppable = function(opts) {
    $(this).droppable(_.defaults(opts, {
      accept: '#tagdrag .tags > .tagDragView > .tag',
      activate: function(ev, ui) {
        $(this).find('.placeholder-tag')
	    .width(ui.draggable.width())
	    .addClass('show');
      },
      deactivate: function(ev, ui) {
        $(this).find('.placeholder-tag')
	    .removeClass('show');
      },
      over: function(ev, ui) {
        $(this).find('.placeholder-tag')
	    .addClass('placeholder-tag-highlight');
      },
      out: function(ev, ui) {
        $(this).find('.placeholder-tag')
	    .removeClass('placeholder-tag-highlight');
      },
    }));
  };
























  $.app.TaskDepView = Backbone.View.extend({
    tagName: 'div',
    className: 'taskdep',

    events: {
      "click .rm-icon-2 > .rm-button-2"  : "removeMe"
    },

    initialize: function() {
      _.bindAll(this, 'render', 'removeMe', 'remove');
      this.model.bind('change:dep', this.render);
      this.model.bind('change', this.render);
      this.model.bind('destroy', this.remove);
    },

    removeMe: function(ev) {
      this.model.destroy();
    },

    destroy: function(ev) {
      $(this.el).remove();
    },

    template: $.templates('#task-dep-tmpl'),

    render: function() {
      var ht = $(this.el).html(this.template.render(this.model.get('dependency').toJSON()));
      console.log("TaskDepView render: %o", ht);
      return ht;
    }
  });


  $.app.TaskView = Backbone.View.extend({
    tagName: 'div',
    className: 'taskView',
    expanded: false,
    filteredOut: false,
    hideCompleted: true,

    events: {
      "click .deltask .rm-button"        : "deleteTask",
      "click .task > .summary"           : "toggleExpand",
      "dblclick .summary > .summary"     : "editSummary",
      "dblclick .summary > .imp"         : "editImportance",
      "dblclick .summary > .duedate"     : "editDueDate",
      "dblclick .body > .text"           : "editText",
      "dblclick .info > .blocked .value" : "editBlocked",
      "change input:checkbox"            : "editComplete",

      "drop .summary"                    : "dropTag",

      "click .adddep-button"             : "addDep"
    },

    initialize: function() {
      _.bindAll(this,
		'render',
		'renderDeps',
		'error',
		'destroy',
		'deleteTask',
		'toggleExpand',
		'editSummary',
		'editImportance',
		'editDueDate',
		'editText',
		'editComplete',
		'editBlocked',
		'dropTag',
		'addDep',
		'filterChange',
		'refreshFilter',
		'refreshFilterCompleted',
		'actOnHide'
	       );

      this.model.bind('change', this.render);
      this.model.bind('add:task_tags', this.render);
      this.model.bind('error', this.error);
      this.model.bind('destroy', this.destroy);
      this.model.bind('add:task_deps', this.render);
      this.model.bind('remove:task_tags', this.refreshFilter);
      this.model.bind('destroy:tag', this.refreshFilter);
      this.bind('btn:task:showCompleted', this.refreshFilterCompleted);
      this.bind('change:filter', this.filterChange);

      $.app.globalController.register(this);
    },

    template: $.templates('#task-tmpl'),

    testFn: function(rm, rel) {
      console.log("testFn: %o, %o", rm, rel);
      console.log("testFn- ", rm, rel);
    },

    refreshFilter: function() {
      this.filterChange($.app.globalController.get('filter'));
    },

    filterChange: function(filterEnable) {
      if (filterEnable === false) {
	this.filteredOut = false;
	this.actOnHide();
	return;
      }

      var seltags = $.app.globalController.get('filter:tags');

      var tasktag = this.model.get('task_tags').detect(function(tt) {
	var tag = tt.get('tag');
	return (_.indexOf(seltags, tag) >= 0) ? true : false;
      });

      this.filteredOut = (typeof(tasktag) === 'undefined') ? true : false;
      this.actOnHide();
    },

    refreshFilterCompleted: function(showCompleted) {
      this.hideCompleted = !showCompleted;
      console.log('refreshFilterCompleted: ', this.hideCompleted, showCompleted);
      this.actOnHide();
    },

    actOnHide: function() {
      console.log("actOnHide, completed? ", this.model.get('completed'));
      if (this.filteredOut || (this.hideCompleted && this.model.get('completed')))
	$(this.el).addClass('contracted');
      else
	$(this.el).removeClass('contracted');
    },


    destroy: function() {
      this.remove();
      this.unbind();
    },

    deleteTask: function(ev) {
      this.model.destroy();
    },


    toggleExpand: function(ev) {
      if (ev.currentTarget != ev.target) {
	return true;
      }

      if ($(ev.target).is('input,textarea,select,option') === false)
	$(this.el).find('div.body').toggleClass('contracted');

      this.expanded = !$(this.el).find('div.body').hasClass('contracted');
    },


    addDep: function(ev) {
      var self = this;
      var task = this.model;
      var btn = ev.currentTarget;
      var depc = $(btn).closest('.deps');

      function cleanup() {
	depc.find('.input-dep').remove();
	$(btn).removeClass('btn-selected');
      }

      if ($(btn).hasClass('btn-selected')) {
	cleanup();
	return;
      }

      $(btn).addClass('btn-selected');
      $('<div class="input-dep"><input type="text" value="Add Dependency..."/></div>')
	  .appendTo(depc)
	  .children('input')
	  .on('focus', function() {
            if ($(this).val() == 'Add Dependency...')
              $(this).val('');
	  })
	  .on('focusout', function() {
            if ($(this).val() == '')
              $(this).val('Add Dependency...');
	  })
	  .autocomplete({
	    source: function(req, cb) {
	      cb($.app.taskCollection
		 .filter(function(task) {
		   return (task.get('summary').toLowerCase().indexOf(req.term.toLowerCase()) !== -1);
		 })
		 .map(function(task) {
		   return {
		     label: task.get('summary'),
		     value: task
		   };
		 })
		);
	    },
	    focus: function(ev, ui) {
	      return false;
	    },
	    select: function(ev, ui) {
	      var depModel = ui.item.value;
	      var found = false;
	      _.each(task.get('task_deps').pluck('dependency'), function(dep) {
		if (dep === depModel)
		  found = true;
	      });
	      if (!found) {
		var m = new $.app.TaskDep({dependency: depModel, dependency_id: depModel.get('id'), task: task, task_id: task.get('id')});
		console.log(m);
		task.get('task_deps').add(m);
		m.save();
	      }
	      cleanup();
	    }
	  });

      $(document).keydown(function(ev) {
	if (ev.keyCode === 27 /* ESC */)
	  cleanup();
      });
    },


    dropTag: function(ev, ui) {
      var tagModel = ui.draggable.data('tagModel');
      var found = false;
      _.each(this.model.get('task_tags').pluck('tag'), function(tag) {
	console.log("moo moo moo", tag, tagModel);
	if (tag === tagModel)
	  found = true;
      });
      if (!found) {
	var m = new $.app.TaskTag({tag: tagModel, tag_id: tagModel.get('id'), task: this.model, task_id: this.model.get('id')});
	console.log(m);
	//var ret = this.model.get('task_tags').add({tag: tagModel, tag_id: tagModel.get('id'),  task: this.model});
	this.model.get('task_tags').add(m);
	console.log(m);
	//console.log("RET: ", ret);
	m.save();
      }
    },


    editComplete: function(ev) {
      console.log("editComplete event: %o", ev);
      var self = this;

      self.model.save({ 'completed': $(ev.currentTarget).prop('checked')?true:false },
        {
	  wait: true,
	  partialUpdate: true,
	  success: function(model, resp) {
	    self.model.set('status', resp.status);
	  }
	});
    },


    editDueDate: function(ev) {
      var self = this;

      $(ev.currentTarget).magicedit2(
	'duedate', 'date',
	{
	  val: this.model.get('due_date')
	},
	function(val) {
	  self.model.save({ 'due_date': val },
	    {
	      wait: true,
	      partialUpdate: true,
	      success: function(model, resp) {
		self.model.set('duedate_class', resp.duedate_class);
		$.app.globalController.trigger('tasks:sort');
	      }
	    });
	});
    },


    editSummary: function(ev) {
      var self = this;

      $(ev.currentTarget).magicedit2(
	'summary', 'text',
	{
	  val: this.model.get('summary')
	},
	function(val) {
	  self.model.save({ 'summary': val },
	    { wait: true, partialUpdate: true });
	});
    },


    editBlocked: function(ev) {
      var self = this;

      $(ev.currentTarget).magicedit2(
	'value', 'select',
	{
	  val: this.model.get('blocked') ? "Yes" : "No",
	  options: [
	    "No",
	    "Yes"
	  ]
	},
	function(val) {
	  self.model.save({ 'blocked': (val === 'Yes') ? true : false },
	    {
	      wait: true,
	      partialUpdate: true,
	      success: function(model, resp) {
		console.log('Response: ', resp);
		self.model.set('status', resp.status);
	      }
	    });
	});
    },


    editImportance: function(ev) {
      var self = this;

      $(ev.currentTarget).magicedit2(
	'imp', 'select',
	{
	  val: this.model.get('importance'),
	  options: [
	    "none",
	    "low",
	    "medium",
	    "high"
	  ]
	},
	function(val) {
	  self.model.save({ 'importance': val },
	    {
	      wait: true,
	      partialUpdate: true,
	      success: function(model, resp) {
		$.app.globalController.trigger('tasks:sort'); 
	      }
	    });
	});
    },


    editText: function(ev) {
      var self = this;

      $(ev.currentTarget).magicedit2(
	'text', 'textarea',
	{
	  val: this.model.get('text')
	},
	function(val) {
	  self.model.save({ 'text': val },
	    {
	      wait: true,
	      partialUpdate: true,
	      success: function(model, resp) {
		console.log('Response: ', resp);
		self.model.set('html_text', resp.html_text);
	      }
	    });
	});
    },

    error: function(oldModel, resp) {
      alert('error error!');
      console.log(oldModel === this.model);
      console.log(resp);
    },

    render: function() {
      var html = $(this.template.render(this.model.toJSON()));
      var self = this;

      this.model.get('task_deps').each(function(m) {
	var t = m.get('task');
	var d = m.get('dependency');
        console.log("Each task_deps: %o", m);
        console.log("---> %o", t);
        console.log("---> %o", d);
	console.log(d === t);
        var depView = new $.app.TaskDepView({model: m });
        $(html).find('div.deps').append($(depView.render()));
      });

      this.model.get('task_tags').each(function(m) {
	var task = m.get('task');
	var tag  = m.get('tag');
	console.log("Each task_tags: %o", m);
	console.log("---> %o", task);
	console.log("---> %o", tag);
	var tagView = new $.app.AppliedTagView({model: m });
	$(html).find('div.tags > .placeholder-tag').before($(tagView.render()));
      });

      $(html).children('.summary').tagDroppable({});

      if (this.expanded)
	$(html).find('div.body').removeClass('contracted');

      console.log("app.TaskView.render: %o", this.model);
      this.refreshFilter();
      return $(this.el).html(html);
    },
    renderDeps: function(dep) {
      console.log("Party time, dep=%o", dep);
    }
  });



  $.app.TaskListView = Backbone.View.extend({
    tagName: 'div',
    className: 'taskListView',
    showCompleted: false,

    events: {
      "click .sorter .sort-intellisort"   : "sortIntelliSort",
      "click .sorter .sort-importance"    : "sortImportance",
      "click .sorter .sort-duedate"       : "sortDueDate",
      "click .tabmenu .btn_showcompleted" : "showCompletedBtn",
      "click .tabmenu .btn_addtag"        : "addTagBtn",
      "focus #newtasksummary"             : "newTaskFocus",
      "focusout #newtasksummary"          : "newTaskFocusOut",
      "keypress #newtasksummary"          : "newTaskKeypress"
    },

    sortDueDate: function(ev) {
      $.app.globalController.set('tasks:order', 'duedate');
      this.refreshSort();
    },

   sortImportance: function(ev) {
      $.app.globalController.set('tasks:order', 'importance');
      this.refreshSort();
    },

   sortIntelliSort: function(ev) {
      $.app.globalController.set('tasks:order', 'intelligent');
      this.refreshSort();
    },

    showCompletedBtn: function(ev) {
      $(this.el).find('.tabmenu .btn_showcompleted')
	  .toggleClass('btn-selected');

      this.showCompleted = !this.showCompleted;
      $.app.globalController.trigger('btn:task:showCompleted', this.showCompleted);
    },

    addTagBtn: function(ev) {
      $.app.globalController.trigger('btn:addTags');
    },

    tagbtn: function() {
      $(this.el).find('.tabmenu .btn_addtag')
	  .toggleClass('btn-selected');
    },

    destroy: function() {
      $.app.globalController.unregister(this);
      $.app.globalController.trigger('clean:addTags');
      this.remove();
      this.unbind();
    },

    newTaskFocus: function(ev) {
      if ($(ev.currentTarget).val() == 'Add Task...')
	$(ev.currentTarget).val('');
    },

    newTaskFocusOut: function(ev) {
      if ($(ev.currentTarget).val() == '')
	$(ev.currentTarget).val('Add Task...');
    },

    newTaskKeypress: function(ev) {
      var self = this;

      if (ev.keyCode === 13 /* ENTER */) {
	var m = new $.app.Task({ summary: $(ev.currentTarget).val() });
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

    refreshSort: function() {
      $.app.globalController.trigger('tasks:refreshSort');
      this.collection.sort();
    },

    initialize: function() {
      _.bindAll(this,
		'render',
		'renderTask',
		'renderTaskTop',
		'addTagBtn',
		'destroy',
		'tagbtn',
		'newTaskFocus',
		'newTaskFocusOut',
		'showCompletedBtn',
		'refreshSort',
		'sortDueDate',
		'sortImportance',
		'sortIntelliSort',
		'newTaskKeypress');
      //this.collection.bind('change', this.render);
      this.collection.bind('add', this.renderTaskTop);
      this.collection.bind('reset', this.render);

      this.bind('btn:addTags', this.tagbtn);
      this.bind('tasks:sort', this.refreshSort);
      $.app.globalController.register(this);
    },

    template: $.templates('#task-list-tmpl'),

    render: function() {
      $(this.el).html(this.template.render({}));
      this.collection.each(this.renderTask);
    },

    renderTask: function(task) {
      console.log("renderTask: task=%o", task);
      var taskView = new $.app.TaskView({model: task});
      $(this.el).find('#tasklist').append($(taskView.render()));
    },

    renderTaskTop: function(task) {
      var taskView = new $.app.TaskView({model: task});
      $(this.el).find('#tasklist').prepend($(taskView.render()));
    }
  });




























  $.app.WikiView = Backbone.View.extend({
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




























  $.app.WikiOverviewView = Backbone.View.extend({
    tagName: 'div',
    className: 'wikiOverviewView',

    events: {
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
	var m = new $.app.WikiTag({tag: tagModel, tag_id: tagModel.get('id'), wiki: this.model, wiki_id: this.model.get('id')});
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

    initialize: function() {
      _.bindAll(this, 'render', 'destroy', 'deleteWiki', 'dropTag');

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
        var tagView = new $.app.AppliedTagView({model: m });
        $(html).find('div.tags > .placeholder-tag').before($(tagView.render()));
      });

      $(html).find('.summary').tagDroppable({});

      if ($.app.globalController.get('filter') === true) {
	var seltags = $.app.globalController.get('filter:tags');

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









  $.app.WikiListView = Backbone.View.extend({
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
      $.app.globalController.trigger('btn:addTags');
    },

    tagbtn: function() {
      $(this.el).find('.tabmenu .btn_addtag')
	  .toggleClass('btn-selected');
    },

    destroy: function() {
      $.app.globalController.unregister(this);
      $.app.globalController.trigger('clean:addTags');
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
	var m = new $.app.Wiki({ title: $(ev.currentTarget).val() });
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

      $.app.globalController.register(this);
    },

    template: $.templates('#wiki-list-tmpl'),

    filterChange: function(ids) {
      this.forceRefetch(ids);
    },

    forceRefetch: function(ids) {
      if (typeof(ids) === undefined)
	ids = $.app.globalController.get('filter:tag_ids');

      this.collection.fetch({data: { limit: 100, offset: 0, filter: { tags: ids } }});
    },

    render: function() {
      $(this.el).html(this.template.render({}));
      this.collection.each(this.renderWiki);
    },

    renderWiki: function(wiki) {
      console.log("renderWiki: wiki=%o", wiki);
      var wikiView = new $.app.WikiOverviewView({model: wiki});
      $(this.el).find('#wikilist').append($(wikiView.render()));
    }
  });









































  $.app.ProjectNameView = Backbone.View.extend({
    initialize: function() {
      this.bind('change:project', this.render);

      $.app.globalController.register(this);
    },

    template: $.templates(null, '<h2>{{:name}}</h2>'),

    render: function(project) {
      if (typeof(project) !== 'object')
	project = {toJSON: function() { return {}; }};

      $(this.el).html(this.template.render(project.toJSON()));
    },
  });


  $.app.ProjectLinkView = Backbone.View.extend({
    tagName: 'tr',
    className: 'ProjectLinkView',

    events: {
      "click .delproject .rm-button"        : "deleteProject",
    },

    destroy: function() {
      this.remove();
      this.unbind();
    },

    deleteProject: function(ev) {
      this.model.destroy();
    },

    initialize: function(params) {
      _.bindAll(this, 'render', 'deleteProject', 'destroy');
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






  $.app.ProjectListView = Backbone.View.extend({
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
	var m = new $.app.Project({ name: $(ev.currentTarget).val() });
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
      var pView = new $.app.ProjectLinkView({model: p, extraClass: extraClass});
      $(this.el).find('table').append($(pView.render()));
    }
  });



  $.app.NavbarView = Backbone.View.extend({
    tagName: 'div',
    className: 'NavbarView',

    events: {
      "focus #projectSelector"          : "projSelFocus",
      "focusout #projectSelector"       : "projSelFocusOut"
    },


    projSelFocus: function(ev) {
      if ($(ev.currentTarget).val() == 'Switch Project...')
	$(ev.currentTarget).val('');
    },

    projSelFocusOut: function(ev) {
      if ($(ev.currentTarget).val() == '')
	$(ev.currentTarget).val('Switch Project...');
    },


    initialize: function() {
      _.bindAll(this,
		'render',
		'nav',
		'projSelFocus',
		'projSelFocusOut');

      this.bind('change:project', this.render);
      this.bind('navigate', this.nav);

      $.app.globalController.register(this);

      this.render();
    },

    template: $.templates('#navbar-tmpl'),

    render: function(project) {
      if (typeof(project) !== 'object')
	project = { toJSON: function() { return {}; } };

      $(this.el).html(this.template.render(project.toJSON()));
      $(this.el).find('#projectSelector')
	  .autocomplete({
	    minLength: 0,
	    source: function(req, cb) {
	      cb($.app.projectCollection
		 .filter(function(p) {
		   return (p.get('name').toLowerCase().indexOf(req.term.toLowerCase()) !== -1);
		 })
		 .map(function(p) {
		   return {
		     label: p.get('name'),
		     value: p.get('id')
		   };
		 })
		);
	    },
	    focus: function(ev, ui) {
	      return false;
	    },
	    select: function(ev, ui) {
	      $.app.router.navigate("project/"+ ui.item.value +"/notes", {trigger: true});
	      $(this).val('');
	      $(this).blur();
	      return false;
	    }
	  });
    },

    nav: function(item) {
      console.log("NavbarView: nav: ", item, this);
      console.log(this.el);
      $(this.el).find('.menu a').removeClass('current');
      $(this.el).find('.menu a[title="' + item + '"]').addClass('current');
    }
  });


























  $.app.Router = Backbone.Router.extend({
    routes: {
      ""                                  : "showProjects",
      "project/:projectId/notes"          : "showNotes",
      "project/:projectId/tasks"          : "showTasks",
      "project/:projectId/wikis"          : "showWikis",
      "project/:projectId/wikis/:wiki"    : "showWiki"
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
      //$.app.tagCollection  = new $.app.TagCollection();

      this.currentSidebarView = $.app.tagListView = new $.app.TagListView({
	el: $('<div></div>').appendTo('#sidebar'),
	collection: $.app.tagCollection
      });

      this.currentTagDragView = $.app.tagDragListView = new $.app.TagDragListView({
	el: $('<div class="tagdrag-container"></div>').appendTo('#tagdrag'),
	collection: $.app.tagCollection
      });

      this.currentSidebarView.render();
      this.currentTagDragView.render();

      // XXX: Kludge; for some reason the tag collection needs
      //      to be fetched synchronously (and first), otherwise
      //      the relationships won't work as expected.
      //$.app.tagCollection.fetch({async: false});
    },


    showProjects: function() {
      this.cleanView();
      $.app.globalController.set('projectId', -1);
      $.app.globalController.trigger('navigate', 'home');

      this.currentView = $.app.projectListView = new $.app.ProjectListView({
	el: $('<div></div>').appendTo('#main-pane'),
	collection: $.app.projectCollection
      });

      $.app.projectListView.render();
    },


    showNotes: function(proj) {
      this.cleanView();

      $.app.globalController.set('projectId', proj);
      $.app.globalController.trigger('navigate', 'notes');

      this.showTags();

      $.app.noteCollection = new $.app.NoteCollection();
      this.currentView = $.app.noteListView   = new $.app.NoteListView({
        el: $('<div></div>').appendTo('#main-pane'),
        collection: $.app.noteCollection
      });
      $.app.noteCollection.fetch({data: { limit: 100, offset: 0, filter: { tags: $.app.globalController.get('filter:tag_ids') } }});
    },




    showWikis: function(proj) {
      this.cleanView();

      $.app.globalController.set('projectId', proj);
      $.app.globalController.trigger('navigate', 'wikis');

      this.showTags();

      $.app.wikiCollection = new $.app.WikiCollection();
      this.currentView = $.app.wikiListView   = new $.app.WikiListView({
        el: $('<div></div>').appendTo('#main-pane'),
        collection: $.app.wikiCollection
      });
      $.app.wikiCollection.fetch({data: { limit: 100, offset: 0, filter: { tags: $.app.globalController.get('filter:tag_ids') } }});
    },


    showWiki: function(proj, wiki) {
      this.cleanView();

      $.app.globalController.set('projectId', proj);
      $.app.globalController.trigger('navigate', 'wiki');

      //this.showTags();

      $.app.wikiModel = new $.app.Wiki({id: wiki, project_id: proj});
      this.currentView = $.app.wikiView   = new $.app.WikiView({
        el: $('<div></div>').appendTo('#main-pane'),
        model: $.app.wikiModel
      });

      $.app.wikiModel.fetch();
    },



    showTasks: function(proj) {
      this.cleanView();

      $.app.globalController.set('projectId', proj);
      $.app.globalController.trigger('navigate', 'tasks');

      this.showTags();

      $.app.taskCollection = new $.app.TaskCollection();
      this.currentView = $.app.taskListView = new $.app.TaskListView({
	el: $('<div></div>').appendTo('#main-pane'),
	collection: $.app.taskCollection
      });
      //$.app.taskCollection.fetch({data: { filter: { tags: [5,17] }}});
      $.app.taskCollection.fetch();
    }
  });

  $.app.globalController = new $.app.GlobalController();

  $.app.tagCollection = new $.app.TagCollection();
  $.app.projectCollection = new $.app.ProjectCollection();
  $.app.projectCollection.fetch({async: false});

  
  $.app.navbarView = new $.app.NavbarView({
    el: $('#navbar .grid_16')
  });

  $.app.projectNameView = new $.app.ProjectNameView({
    el: $('#logo .project-name')
  });

  $.app.router = new $.app.Router;
  Backbone.history.start();

});

