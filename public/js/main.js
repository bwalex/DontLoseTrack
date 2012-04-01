require([
  "jquery.tools",
  "jquery-ui-1.8.18.custom.min",
  "jquery.magicedit2",
  "jquery.jdropdown",
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
  "require.text!/tmpl/tag-applied.tmpl"
], function() {
  //XXX: hardcoded project ID :(
  projectId = 1;

  // Insert all templates
  // XXX: adjust >= according to number of non-templates in
  //      dependencies.
  for (l = arguments.length-1 ; l >= 4; l--)
    $("body").append(arguments[l]);

  // Set up tabs
  $(".tabs:first").tabs(".panes:first > div", { history: true });


  String.prototype.trunc = function(n,useWordBoundary) {
    var toLong = this.length>n,
    s_ = toLong ? this.substr(0,n-1) : this;
    s_ = useWordBoundary && toLong ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
    return  toLong ? s_ +'...' : s_;
  };

  
  ////////////////////////////////////////////////////////
  // SIDEBAR TAG FILTER, TAG DRAG
  tags = [];


  $('#newtagname').on('focus', function() {
    if ($(this).val() == 'Add Tag...')
      $(this).val('');
  });

  $('#newtagname').on('focusout', function() {
    if ($(this).val() == '')
      $(this).val('Add Tag...');
  });

  $('#newtagname').keypress(function(ev) {
    if (ev.keyCode === 13 /* ENTER */) {
      $.ajax({
        type: 'POST',
        url: '/tag_add',
        data: {
          project_id: projectId,
          tag_name: $("#newtagname").val()
        },
        dataType: "json",
        error: function(r, s, e) {
          var data = $.parseJSON(r.responseText);
          if (data != null) {
            $.each(data.errors, function(k, v) {
              alert(v);
            });
          }
        },
        success: function(data) {
          $.observable(tags).insert(0, data);
          $("#newtagname").val("");
          $("#newtagname").blur();
        }
      });
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

    initialize: function(){},

    register: function(listener, options) {
      if ((typeof(listener) !== 'object') ||
	  (typeof(listener.trigger) !== 'function')) {
	throw "Only objects with a 'trigger' function can be registered";
      }

      var opts = (typeof(options) === 'object') ? options : {};

      this.listeners.push({ obj: listener, opts: opts});
    },

    unregister: function(listener) {
      this.listeners = _.reject(this.listeners, function(l) {
	return (l.obj === listener);
      });
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
      "btn:addTags"     : "addTagsPress",
      "clean:addTags"   : "addTagsClean"
    },

    initialize: function() {
      _.bindAll(this, 'addTagsPress', 'addTagsClean');
    },

    addTagsPress: function() {
      $('#tagdrag').toggleClass('hide');
    },

    addTagsClean: function() {
      $('#tagdrag').addClass('hide');
    }
  });

  $.app.globalController = new $.app.GlobalController();


  $.app.TaskDep = Backbone.RelationalModel.extend({
    urlRoot: '/api/taskdep',
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
    urlRoot: '/api/tasktag',
    idAttribute: 'id',
    initialize: function() {
      var dit = this;
      console.log("this.get('tag'):");
      //console.log(this.get('tag'));
      this.get('tag').on('destroy', function(model) {
	dit.trigger('destroy:tag', model);
	dit.get('task').trigger('destroy:tag', model);
      });

      this.get('tag').on('change', function(model) {
	dit.trigger('change:tag', model);
        dit.get('task').trigger('change:tag', model);
      });
    },
    toJSON: function() {
      return { task_id: this.get('task').get('id'), tag_id: this.get('tag').get('id') };
    }
  });

  $.app.Task = Backbone.RelationalModel.extend({
    defaults: {
      expanded: false
    },
    urlRoot: '/api/task',
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
    url: '/api/task',
    model: $.app.Task
  });

  $.app.NoteTag = Backbone.RelationalModel.extend({
    initialize: function() {
      var dit = this;
      //console.log("this.get('tag'):");
      //console.log(this.get('tag'));
      //this.get('tag').on('change', function(model) {
      //  dit.get('note').trigger('change:tag', model);
      //});
    }
  });


  $.app.Tag  = Backbone.RelationalModel.extend({
    defaults: {
      selected: true
    },
    urlRoot: '/api/tag',
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
      }
    ]
  });

  $.app.TagCollection = Backbone.Collection.extend({
    url: '/api/tag',
    model: $.app.Tag
  });

  $.app.Note = Backbone.RelationalModel.extend({
    defaults: {
      visible: true
    },
    urlRoot: '/api/note',
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
    url: '/api/note',
    model: $.app.Note
  });

  $.app.AppliedTagView = Backbone.View.extend({
    tagName: 'div',
    className: 'tagAppliedView',

    events: {
      "click .rm-icon > .rm-button"     : "removeMe"
    },

    initialize: function() {
      _.bindAll(this, 'render', 'removeMe', 'remove');
      this.model.bind('change:tag', this.render);
      this.model.bind('change', this.render);
      this.model.bind('destroy', this.remove);
      this.model.bind('destroy:tag', this.remove);
    },

    removeMe: function(ev) {
      this.model.destroy();
    },

    remove: function(ev) {
      $(this.el).remove();
    },

    template: $.templates('#tag-applied-tmpl'),

    render: function() {
      var ht = $(this.el).html(this.template.render(this.model.get('tag').toJSON()));
      console.log("AppliedTagView render: %o", ht);
      return ht;
    }
  });

  $.app.NoteView = Backbone.View.extend({
    tagName: 'div',
    className: 'noteView',
    initialize: function() {
      _.bindAll(this, 'render', 'renderTags');
      this.model.bind('change', this.render);
      this.model.bind('add:note_tags', this.renderTags);
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
      "click .tabmenu .btn_addtag"      : "addTagBtn"
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

    initialize: function() {
      _.bindAll(this, 'render', 'renderNote', 'addTagBtn', 'destroy', 'tagbtn');
      //this.model.bind('change', this.render);
      this.collection.bind('reset', this.render);
      this.bind('btn:addTags', this.tagbtn);
      $.app.globalController.register(this);
    },

    template: $.templates('#note-list-tmpl'),

    render: function() {
      $(this.el).html(this.template.render({}));
      this.collection.each(this.renderNote);
    },

    renderNote: function(inote) {
      console.log("renderNote: inote=%o", inote);
      var noteView = new $.app.NoteView({model: inote});
      $(this.el).find('#notelist').append($(noteView.render()));
    }
  });



  $.app.TagView = Backbone.View.extend({
    tagName: 'div',
    className: 'tagView',

    events: {
      "dblclick .tag"               : "editTag",
      "click .rm-icon > .rm-button" : "removeMe"
    },

    initialize: function() {
      _.bindAll(this, 'render', 'editTag', 'removeMe', 'remove');
      this.model.bind('change', this.render);
      this.model.bind('destroy', this.remove);
    },

    removeMe: function(ev) {
      this.model.destroy();
    },

    destroy: function(ev) {
      $(this.el).remove();
    },

    editTag: function(ev) {
      var self = this;

      $(ev.currentTarget).magicedit2(
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
    },

    destroy: function() {
      $.app.globalController.unregister(this);
      this.remove();
      this.unbind();
    },

    initialize: function() {
      _.bindAll(this, 'render', 'renderTag', 'destroy');
      //this.model.bind('change', this.render);
      this.collection.bind('reset', this.render);
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
    }
  });


  $.app.TagDragView = Backbone.View.extend({
    tagName: 'div',
    className: 'tagDragView',
    initialize: function() {
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
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
      _.bindAll(this, 'render', 'renderTag');
      //this.model.bind('change', this.render);
      this.collection.bind('reset', this.render);
    },
    render: function() {
      console.log("render in TagDragListView: %o", this);
      this.collection.each(this.renderTag);
      console.log(this);
    },
    renderTag: function(tag) {
      console.log("renderDragTag: tag=%o", tag);
      var tagView = new $.app.TagDragView({model: tag});
      $(this.el).append($(tagView.render()));
      console.log(this.el, tagView.render());
    }
  });














  $.fn.tagDroppable = function(opts) {
    $(this).droppable(_.defaults(opts, {
      accept: '#tagdrag > .tags > .tagDragView > .tag',
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

    events: {
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
		'toggleExpand',
		'editSummary',
		'editImportance',
		'editDueDate',
		'editText',
		'editComplete',
		'editBlocked',
		'dropTag',
		'addDep'
	       );

      this.model.bind('change', this.render);
      this.model.bind('add:task_tags', this.render);
      this.model.bind('error', this.error);
      this.model.bind('add:task_deps', this.render);
    },

    template: $.templates('#task-tmpl'),


    toggleExpand: function(ev) {
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
	    { wait: true, partialUpdate: true });
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
      return $(this.el).html(html);
    },
    renderDeps: function(dep) {
      console.log("Party time, dep=%o", dep);
    }
  });



  $.app.TaskListView = Backbone.View.extend({
    tagName: 'div',
    className: 'taskListView',

    events: {
      "click .tabmenu .btn_addtag"     : "addTagBtn",
      "focus #newtasksummary"          : "newTaskFocus",
      "focusout #newtasksummary"       : "newTaskFocusOut",
      "keypress #newtasksummary"       : "newTaskKeypress"
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
		'newTaskKeypress');
      //this.collection.bind('change', this.render);
      this.collection.bind('add', this.renderTaskTop);
      this.collection.bind('reset', this.render);

      this.bind('btn:addTags', this.tagbtn);
      $.app.globalController.register(this);
    },

    template: $.templates('#task-list-tmpl'),

    render: function() {
      $(this.el).html(this.template.render({}));
      $(this.el).find('#task_sorter')
	  .jdropdown({ 'container': '#fb_menu', 'orientation': 'right' });
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


































  $.app.Router = Backbone.Router.extend({
    routes: {
      "notes": "showNotes",
      "tasks": "showTasks"
    },

    currentView: null,
    cleanView: function() {
      if (this.currentView != null && typeof(this.currentView.destroy) === 'function') {
	this.currentView.destroy();
	this.currentView = null;
      }
    },

    showNotes: function() {
      this.cleanView();

      $.app.noteCollection = new $.app.NoteCollection();
      this.currentView = $.app.noteListView   = new $.app.NoteListView({
        el: $('<div></div>').appendTo('#notes'),
        collection: $.app.noteCollection
      });
      $.app.noteCollection.fetch();
    },

    showTasks: function() {
      this.cleanView();

      $.app.taskCollection = new $.app.TaskCollection();
      this.currentView = $.app.taskListView = new $.app.TaskListView({
	el: $('<div></div>').appendTo('#tasks'),
	collection: $.app.taskCollection
      });
      $.app.taskCollection.fetch();
    }
  });


  $.app.tagCollection  = new $.app.TagCollection();

  $.app.tagListView = new $.app.TagListView({
    el: $('<div></div>').appendTo('#sidebar'),
    collection: $.app.tagCollection
  });

  $.app.tagDragListView = new $.app.TagDragListView({
    el: $('#tagdrag .tags'),
    collection: $.app.tagCollection
  });

  // XXX: Kludge; for some reason the tag collection needs
  //      to be fetched synchronously (and first), otherwise
  //      the relationships won't work as expected.
  $.app.tagCollection.fetch({async: false});

  var app_router = new $.app.Router;
  Backbone.history.start();

});

