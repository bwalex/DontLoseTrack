require([
  "jquery.tools",
  "jquery-ui-1.8.18.custom.min",
  "jquery.magicedit",
  "jquery.jdropdown",
  //"jquery.views",
  "require.text!/tmpl/test.tmpl",
  "require.text!/tmpl/note.tmpl",
  "require.text!/tmpl/task.tmpl",
  "require.text!/tmpl/taskdep.tmpl",
  "require.text!/tmpl/tag.tmpl",
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
    var toLong = this.ength>n,
    s_ = toLong ? this.substr(0,n-1) : this;
    s_ = useWordBoundary && toLong ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
    return  toLong ? s_ +'...' : s_;
  };

  
  ////////////////////////////////////////////////////////
  // SIDEBAR TAG FILTER, TAG DRAG
  tags = [];

  $.templates({
    tagFilterTemplate: "#tag-tmpl",
    tagNoRmTemplate: "#tag-norm-tmpl"
  });
  
  $.link.tagFilterTemplate("#tagfilterlist > .tags", tags);
  $.link.tagNoRmTemplate("#tagdrag > .tags", tags);

  $.getJSON('/tags?project_id=' + projectId, function(j) {
    $.each(j, function(k, v) {
      $.observable(tags).insert(0, v);
    });
  });



  $('#tagfilterlist').on('click', '.tags .tag .rm-icon .rm-button', function(ev) {
    var view = $.view(this);
    $.ajax({
      type: 'POST',
      url: '/tag_delete',
      data: {
        project_id: projectId,
        tag_id: view.data.id
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
        $.observable(tags).remove(view.index);
      }
    });
  });


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



  $('.btn_addtag').on('click', function(ev) {
    $('#tagdrag').toggleClass('hide');
    $('.btn_addtag').toggleClass('btn-selected');
  });

  $('#tasklist').on('click', '.dep .rm-icon-2 .rm-button-2', function(ev) {
    var view = $.view(this);
    var parview = $.view(this).parent.parent;
    if (parview.data.magic_editing === true)
      return;
    console.log(view);
    console.log(parview);
    $.ajax({
      type: 'POST',
      url: '/task_deletedep',
      data: {
        project_id: projectId,
        task_id: view.data.task_id,
        task_dep_id: view.data.dependency_id
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
        $.observable(tasks).update(parview.index, data);
      }
    });
  });

  $('#tasklist').on('click', '.adddep-button', function(ev) {
    var depc = $(this).closest('.deps');
    var s = this;

    if ($(this).hasClass('btn-selected')) {
      depc.find('.input-dep').remove();
      $(this).removeClass('btn-selected');
      $.view(this).data.magic_editing = false;
      return;
    } else {
      if ($.view(this).data.magic_editing === true)
        return;
      $.view(this).data.magic_editing = true;
    }

    $(this).toggleClass('btn-selected');
    
    var ibd = $('<div class="input-dep"><input type="text" value="Add Dependency..."/></div>');

    ibd.find('input')
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
            var options = [];
            $.each(tasks, function(k, v) {
              if (v.summary.toLowerCase().indexOf(req.term.toLowerCase()) !== -1)
		options.push({label: v.summary, value: v.id});
            });
            cb(options);
          },
          focus: function(ev, ui) {
            return false;
          },
          select: function(ev, ui) {
            var view = $.view(this);
            //view.data.expanded = !$(this).closest('.task').children('.body').hasClass('hide');
            
            ev.stopImmediatePropagation();
            $.ajax({
              type: 'POST',
              url: '/task_adddep',
              data: {
		project_id: projectId,
		task_id: view.data.id,
		task_dep_id: ui.item.value
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
		var depc = $(this).closest('.deps');
		depc.find('.adddep-button').removeClass('btn-selected');
		view.data.magic_editing = false;
		depc.find('.input-dep').remove();
		$.observable(tasks).update(view.index, data);
              }
            });
          }
	});
    
    $(document).keydown(function(ev) {
      if (ev.keyCode === 27 /* ESC */) {
        $.view(s).data.magic_editing = false; 
        depc.find('.input-dep').remove();
        depc.find('.adddep-button').removeClass('btn-selected');
      }
    });

    ibd.appendTo(depc);
    
  });

  $.views.helpers({
    afterUpdate: function(oldItem, newItem) {
      var view = this,
      oldItem = oldItem[0],
      newItem = newItem[0];

      console.log("After Update");
      console.log(view);
      console.log(oldItem);
      console.log(newItem);
      newItem.expanded = oldItem.expanded;
      if (newItem.expanded) {
        console.log(view.nodes[0]);
        console.log($(view.nodes[0]));
        $(view.nodes[0]).children('.contracted').removeClass('contracted');
      }
    },
    afterChange: function(ev) {
      $('#tagdrag > .tags > .tag').draggable({
        helper: 'clone',
        cursor: 'move',
        snap: false
      });

      $('.task > .summary'/*'.tags > .placeholder-tag' */).droppable({
        accept: '#tagdrag > .tags > .tag',
        //activeClass: 'show',
        //hoverClass: 'placeholder-tag-highlight',
        activate: function(ev, ui) {
          $(this).find('.placeholder-tag').width(ui.draggable.width());
          $(this).find('.placeholder-tag').addClass('show');
        },
        deactivate: function(ev, ui) {
          $(this).find('.placeholder-tag').removeClass('show');
        },
        over: function(ev, ui) {
          $(this).find('.placeholder-tag').addClass('placeholder-tag-highlight');
        },
        out: function(ev, ui) {
          $(this).find('.placeholder-tag').removeClass('placeholder-tag-highlight');
        },
        drop: function(ev, ui) {
          var view = $.view(this);
          if (view.data.magic_editing === true)
            return;
          var view_tag = $.view(ui.draggable.context);
          $.ajax({
            type: 'POST',
            url: '/task_addtag',
            data: {
              project_id: projectId,
              task_id: view.data.id,
              tag_id: view_tag.data.id
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
              $.observable(tasks).update(view.index, data);
            }
          });
        }
      });
    }
  });





















































  ////////////////////////////////////////////////////////
  // NOTES

  $.app = {};

  $.app.TaskDep = Backbone.RelationalModel.extend({
    initialize: function() {
      var dit = this;
      console.log("moo, taskdep: %o", this);
      console.log(this.get("dependency") === this.get("task"));
      this.get('dependency').on('change', function(model) {
        dit.get('task').trigger('change:dep', model);
      });
    }
  });

  $.app.TaskTag = Backbone.RelationalModel.extend({
    initialize: function() {
      var dit = this;
      console.log("this.get('tag'):");
      console.log(this.get('tag'));
      this.get('tag').on('change', function(model) {
        dit.get('task').trigger('change:tag', model);
      });
    }
  });

  $.app.Task = Backbone.RelationalModel.extend({
    urlRoot: '/api/task',
    idAttribute: 'id',
    relations: [
      {
        type: Backbone.HasMany,
        key:  'task_deps',
        relatedModel: $.app.TaskDep,
        reverseRelation: {
	  includeInJSON: Backbone.Model.prototype.idAttribute,
          key: 'task',
	  keySource: 'task_id'
        }
      },
      {
        type: Backbone.HasMany,
        key:  'dep_tasks',
        relatedModel: $.app.TaskDep,
	includeInJSON: false,
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
	  includeInJSON: "tag_id",
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
      console.log("this.get('tag'):");
      console.log(this.get('tag'));
      this.get('tag').on('change', function(model) {
        dit.get('note').trigger('change:tag', model);
      });
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
    initialize: function() {
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
    },
    template: $.templates('#tag-applied-tmpl'),
    render: function() {
      var ht = $(this.el).html(this.template.render(this.model.toJSON()));
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
        var tagView = new $.app.AppliedTagView({model: m.get('tag') });
        $(html).find('div.tags').append($(tagView.render()));
      });
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
    initialize: function() {
      _.bindAll(this, 'render', 'renderNote');
      //this.model.bind('change', this.render);
      this.collection.bind('reset', this.render);
    },
    template: $.templates('#note-tmpl'),
    render: function() {
      this.collection.each(this.renderNote);
      console.log(this);
    },
    renderNote: function(inote) {
      console.log("renderNote: inote=%o", inote);
      var noteView = new $.app.NoteView({model: inote});
      $(this.el).append($(noteView.render()));
    }
  });










































  $.app.TaskDepView = Backbone.View.extend({
    tagName: 'div',
    className: 'taskdep',
    initialize: function() {
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
    },
    template: $.templates('#task-dep-tmpl'),
    render: function() {
      var ht = $(this.el).html(this.template.render(this.model.toJSON()));
      console.log("TaskDepView render: %o", ht);
      return ht;
    }
  });


  $.app.TaskView = Backbone.View.extend({
    tagName: 'div',
    className: 'taskView',

    events: {
      "dblclick .summary > .summary": "editSummary"
    },

    initialize: function() {
      _.bindAll(this,
		'render',
		'renderDeps',
		'editSummary'
	       );

      this.model.bind('change', this.render);
      this.model.bind('add:task_deps', this.renderDeps);
    },

    template: $.templates('#task-tmpl'),

    editSummary: function(ev) {
      console.log("editSummary: %o, %o, %o", this, ev, ev.currentTarget);
      $(ev.currentTarget).magicedit('text', function(val) {
      });
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
        var depView = new $.app.TaskDepView({model: d });
        $(html).find('div.deps').append($(depView.render()));
      });

      this.model.get('task_tags').each(function(m) {
	var task = m.get('task');
	var tag  = m.get('tag');
	console.log("Each task_tags: %o", m);
	console.log("---> %o", task);
	console.log("---> %o", tag);
	var tagView = new $.app.AppliedTagView({model: tag });
	$(html).find('div.tags > .placeholder-tag').before($(tagView.render()));
      });

      $(html).children('.summary').droppable({
        accept: '#tagdrag > .tags > .tag',
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
        drop: function(ev, ui) {
        }
      });

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
    initialize: function() {
      _.bindAll(this, 'render', 'renderTask');
      //this.model.bind('change', this.render);
      this.collection.bind('reset', this.render);
    },
    render: function() {
      this.collection.each(this.renderTask);
      console.log(this);
    },
    renderTask: function(task) {
      console.log("renderTask: task=%o", task);
      var taskView = new $.app.TaskView({model: task});
      $(this.el).append($(taskView.render()));
    }
  });










































  var scope = this;

  $.app.tagCollection  = new $.app.TagCollection();
  $.app.tagCollection.fetch();
  alert('miau!');

  $.app.Router = Backbone.Router.extend({
    routes: {
      "notes": "showNotes",
      "tasks": "showTasks"
    },

    showNotes: function() {
      $.app.noteCollection = new $.app.NoteCollection();
      $.app.noteListView   = new $.app.NoteListView({
        el: $('#notelist'),
        collection: $.app.noteCollection
      });
      $.app.noteCollection.fetch();
    },

    showTasks: function() {
      $.app.taskCollection = new $.app.TaskCollection();
      $.app.taskListView   = new $.app.TaskListView({
	el: $('#tasklist'),
	collection: $.app.taskCollection
      });
      $.app.taskCollection.fetch();
    }
  });

  var app_router = new $.app.Router;
  Backbone.history.start();
































































  ///////////////////////////////////////////////////////
  // TASKS
  tasks = [];

/*
  $.templates({
    taskTemplate: "#task-tmpl"
  });

  $.link.taskTemplate("#tasklist", tasks);

  $.getJSON('/tasks?project_id=' + projectId, function(j) {
    $.each(j, function(k, v) {
      $.observable(tasks).insert(tasks.length, v);
    });
  });
*/

  $('#newtasksummary').on('focus', function() {
    if ($(this).val() == 'Add Task...')
      $(this).val('');
  });

  $('#newtasksummary').on('focusout', function() {
    if ($(this).val() == '')
      $(this).val('Add Task...');
  });

  $('#newtasksummary').keypress(function(ev) {
    if (ev.keyCode === 13 /* ENTER */) {
      $.ajax({
        type: 'POST',
        url: '/task_add',
        data: {
          project_id: projectId,
          task_summary: $("#newtasksummary").val()
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
          $.observable(tasks).insert(0, data);
          $("#newtasksummary").val("");
          $("#newtasksummary").blur();
        }
      });
    }
  });

  $(document).keydown(function(ev) {
    if (ev.keyCode === 27 /* ESC */)
      $('#newtasksummary').blur();
  });

  // XXX: Collapse all button


  $("#tasklist").on('click', ".task > .summary", function(ev) {
    if ($(this).children(".summary-edit").length == 0) {
      $(this).parent().children('.body').toggleClass("contracted");
      $.view(this).data.expanded = !$(this).parent().children('.body').hasClass("contracted");
    }
  });

  $("#tasklist").on('dblclick', ".task > .summary", function(ev) {
    $(this).parent().children('.body').removeClass("contracted");
    $.view(this).data.expanded = true;
  });

  $("#tasklist").magicedit('dblclick', ".task > .summary", {
    subclass: "summary",
    type: 'text', 
    getPostData: function(d) {
      return {
        observable: tasks,
        url: '/task_changesummary',
        data: {
          project_id: projectId,
          task_id: d.data.id,
          task_summary: d.newContent
        }
      };
    }
  });


  $("#tasklist").on("click", ".task .summary .tags .tag .rm-icon .rm-button", function(ev) {
    view = $.view(this);
    console.log(view);
    console.log(view.data);
    parview = $.view(this).parent.parent;
    if (parview.data.magic_editing === true)
      return;
    console.log(parview);
    var ctx = { view: view, data: view.data, idx: parview.index };
    $.ajax({
      type: 'POST',
      url: '/task_deletetag',
      data: {
        project_id: projectId,
        task_id: parview.data.id,
        tag_id: view.data.id
      },
      dataType: "json",
      context: ctx,
      error: function(r, s, e) {
        var data = $.parseJSON(r.responseText);
        if (data != null) {
          $.each(data.errors, function(k, v) {
            alert(v);
          });
        }
      },
      success: function(data) {
        $.observable(tasks).update(this.idx, data);
      }
    });
    ev.stopImmediatePropagation();
  });

  $("#tasklist").on("change", ".task .summary .check input:checkbox", function(ev) {
    var view = $.view(this);
    var complete = $(this).prop('checked');
    $.ajax({
      type: 'POST',
      url: '/task_' + (complete?'':'un') + 'complete',
      data: {
        project_id: projectId,
        task_id: view.data.id
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
        $.observable(tasks).update(view.index, data);
      }
    });
  });
  $("#tasklist").on("click", ".task .summary .check input:checkbox", function(ev) {
    ev.stopImmediatePropagation();
  });

  $("#tasklist").magicedit('dblclick', ".task > .body > .info > .blocked", {
    subclass: "value",
    type: 'select',
    getOptions: function(d) {
      return [{option: "yes"}, {option: "no"}];
    },
    getPostData: function(d) {
      return {
        observable: tasks,
        url: '/task_block',
        data: {
          project_id: projectId,
          task_id: d.data.id,
          task_block: d.newContent
        }
      };
    }
  });


  $("#tasklist").magicedit('dblclick', ".task > .summary", {
    subclass: "imp",
    type: 'select',
    getContent: function(d) { return d.data.importance; },
    getOptions: function(d) {
      return [
        {option: "none"},
        {option: "low"},
        {option: "medium"},
        {option: "high"},
      ];
    },
    getPostData: function(d) {
      return {
        observable: tasks,
        url: '/task_changeimportance',
        data: {
          project_id: projectId,
          task_id: d.data.id,
          task_importance: d.newContent
        }
      };
    }
  });

  
  $("#tasklist").magicedit('dblclick', ".task > .body", {
    subclass: "text",
    type: 'text-area', 
    getContent: function(d) { return d.data.text; },
    getPostData: function(d) {
      return {
        observable: tasks,
        url: '/task_changetext',
        data: {
          project_id: projectId,
          task_id: d.data.id,
          task_text: d.newContent
        }
      };
    }
  });

  $('#task_sorter').jdropdown({ 'container': '#fb_menu', 'orientation': 'right' });
});

