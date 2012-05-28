define(['appns', 'jquery', 'underscore', 'backbone', 'backbone-relational', 'jquery.magicedit2', 'jquery.autoclear', 'jsrender'], function(App, $, _, Backbone) {
  App.TaskDepView = Backbone.View.extend({
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
      this.model.bind('destroy:dep', this.remove);
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


  App.TaskView = Backbone.View.extend({
    tagName: 'div',
    className: 'taskView',
    expanded: false,
    filteredOut: false,

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
      this.model.bind('destroy', this.destroy);
      this.model.bind('add:task_deps', this.render);
      this.model.bind('remove:task_tags', this.refreshFilter);
      this.model.bind('destroy:tag', this.refreshFilter);
      this.bind('change:tasks:showCompleted', this.refreshFilterCompleted);
      this.bind('change:filter', this.filterChange);

      App.globalController.register(this);
    },

    template: $.templates('#task-tmpl'),

    testFn: function(rm, rel) {
      console.log("testFn: %o, %o", rm, rel);
      console.log("testFn- ", rm, rel);
    },

    refreshFilter: function() {
      this.filterChange(App.globalController.get('filter'));
    },

    filterChange: function(filterEnable) {
      if (filterEnable === false) {
	this.filteredOut = false;
	this.actOnHide();
	return;
      }

      var search_text = App.globalController.get('filter:text');
      if ((typeof(search_text) === 'string') && search_text !== '') {
	this.filteredOut = (this.model.get('summary').indexOf(search_text) < 0);
	this.actOnHide();
	if (this.filteredOut)
	  return;
      }


      var seltags = App.globalController.get('filter:tags');

      if ((typeof(seltags) !== 'undefined') && seltags.length > 0) {
	var tasktag = this.model.get('task_tags').detect(function(tt) {
	  var tag = tt.get('tag');
	  return (_.indexOf(seltags, tag) >= 0) ? true : false;
	});

	this.filteredOut = (typeof(tasktag) === 'undefined') ? true : false;
	this.actOnHide();
      }
    },

    refreshFilterCompleted: function(showCompleted) {
      this.actOnHide();
    },

    actOnHide: function() {
      console.log("actOnHide, completed? ", this.model.get('completed'));
      if (this.filteredOut || (!App.globalController.get('tasks:showCompleted') && this.model.get('completed')))
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
          .autoclear()
	  .autocomplete({
	    source: function(req, cb) {
	      cb(App.taskCollection
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
		var m = new App.TaskDep({dependency: depModel, dependency_id: depModel.get('id'), task: task, task_id: task.get('id')});
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
	var m = new App.TaskTag({tag: tagModel, tag_id: tagModel.get('id'), task: this.model, task_id: this.model.get('id')});
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
			      App.globalController.trigger('tasks:sort');
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
			      App.globalController.trigger('tasks:sort'); 
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
	  console.log("editText!: %o, %o - ", self, self.model, self, self.model);
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

    render: function() {
      var html = $(this.template.render(this.model.toJSON()));
      var self = this;

      if (typeof(this.model.get('task_deps')) !== 'undefined')
	this.model.get('task_deps').each(function(m) {
	  var t = m.get('task');
	  var d = m.get('dependency');
          var depView = new App.TaskDepView({model: m });
          $(html).find('div.deps').append($(depView.render()));
	});

      if (typeof(this.model.get('task_tags')) !== 'undefined')
	this.model.get('task_tags').each(function(m) {
	  var task = m.get('task');
	  var tag  = m.get('tag');
	  var tagView = new App.AppliedTagView({model: m });
	  $(html).find('div.tags > .placeholder-tag').before($(tagView.render()));
	});

      $(html).children('.summary').tagDroppable({});
      $(html).find('a[rel]').customOverlay();

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



  App.TaskListView = Backbone.View.extend({
    tagName: 'div',
    className: 'taskListView',

    events: {
      "click .sorter .sort-intellisort"   : "sortIntelliSort",
      "click .sorter .sort-importance"    : "sortImportance",
      "click .sorter .sort-duedate"       : "sortDueDate",
      "click .tabmenu .btn_showcompleted" : "showCompletedBtn",
      "click .tabmenu .btn_addtag"        : "addTagBtn",
      "keypress #newtasksummary"          : "newTaskKeypress"
    },

    sortDueDate: function(ev) {
      App.globalController.set('tasks:order', 'duedate');
      this.refreshSort();
    },

    sortImportance: function(ev) {
      App.globalController.set('tasks:order', 'importance');
      this.refreshSort();
    },

    sortIntelliSort: function(ev) {
      App.globalController.set('tasks:order', 'intelligent');
      this.refreshSort();
    },

    showCompletedBtn: function(ev) {
      $(this.el).find('.tabmenu .btn_showcompleted')
	  .toggleClass('btn-selected');

      this.showCompleted = App.globalController.get('tasks:showCompleted');
      this.showCompleted = (typeof(this.showCompleted) === 'undefined') ? true : !this.showCompleted;
      App.globalController.set('tasks:showCompleted', this.showCompleted);

      this.refetch();
    },

    refetch: function() {
      var sc = App.globalController.get('tasks:showCompleted');
      if (typeof(sc) === 'undefined')
	sc = false;

      if (sc)
	App.taskCollection.fetch();
      else
	App.taskCollection.fetch({data: { filter: { completed: false }}});
    },

    addTagBtn: function(ev) {
      selected = !$(this.el).find('.tabmenu .btn_addtag').hasClass('btn-selected');

      App.globalController.set('tagdrag_visible', selected);
    },

    tagbtn: function(sel) {
      if (sel)
        $(this.el).find('.tabmenu .btn_addtag').addClass('btn-selected');
      else
        $(this.el).find('.tabmenu .btn_addtag').removeClass('btn-selected');
    },

    destroy: function() {
      App.globalController.unregister(this);
      App.globalController.trigger('clean:addTags');
      this.remove();
      this.unbind();
    },

    newTaskKeypress: function(ev) {
      var self = this;

      if (ev.keyCode === 13 /* ENTER */) {
	var m = new App.Task({ summary: $(ev.currentTarget).val() });
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
      App.globalController.trigger('tasks:refreshSort');
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
		'refetch',
		'showCompletedBtn',
		'refreshSort',
		'sortDueDate',
		'sortImportance',
		'sortIntelliSort',
		'newTaskKeypress');
      //this.collection.bind('change', this.render);
      this.collection.bind('add', this.renderTaskTop);
      this.collection.bind('reset', this.render);

      this.bind('change:tagdrag_visible', this.tagbtn);
      this.bind('btn:task:showCompleted', this.refetch);
      this.bind('tasks:sort', this.refreshSort);
      App.globalController.register(this);
    },

    template: $.templates('#task-list-tmpl'),

    render: function() {
      var sc = App.globalController.get('tasks:showCompleted');
      sc = (typeof(sc) === 'undefined') ? false : sc;

      $(this.el).html(this.template.render({showCompleted: sc}));
      $(this.el).find('.autoclear').autoclear();
      this.tagbtn(App.globalController.get('tagdrag_visible'));
      this.collection.each(this.renderTask);
    },

    renderTask: function(task) {
      console.log("renderTask: task=%o", task);
      var taskView = new App.TaskView({model: task});
      $(this.el).find('#tasklist').append($(taskView.render()));
    },

    renderTaskTop: function(task) {
      var taskView = new App.TaskView({model: task});
      $(this.el).find('#tasklist').prepend($(taskView.render()));
    }
  });



});
