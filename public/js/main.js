require([
  "jquery.tools",
  "jquery.magicedit",
  //"jquery.views",
  "require.text!/tmpl/test.tmpl",
  "require.text!/tmpl/note.tmpl",
  "require.text!/tmpl/task.tmpl",
  "require.text!/tmpl/tag.tmpl"
  ], function() {
  //XXX: hardcoded project ID :(
  projectId = 1;

  // Insert all templates
  // XXX: adjust >= according to number of non-templates in
  //      dependencies.
  for (l = arguments.length-1 ; l >= 2; l--)
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
  // SIDEBAR TAG FILTER
  tags = [];

  $.templates({
    tagFilterTemplate: "#tag-tmpl"
  });
 
  $.link.tagFilterTemplate("#tagfilterlist > .tags", tags);

  $.getJSON('/tags?project_id=' + projectId, function(j) {
     $.each(j, function(k, v) {
      $.observable(tags).insert(0, v);
    });
  });



  ////////////////////////////////////////////////////////
  // NOTES
  n = [];

  $.templates({
    noteTemplate: "#note-tmpl"
  });

  $.link.noteTemplate("#notelist", n);

  $.getJSON('/notes?project_id=' + projectId, function(j) {
    $.each(j, function(k, v) {
      $.observable(n).insert(0, v);
    });
  });

  $('#newnote > form').submit(function() {
    newnote = {
      project_id: projectId,
      note_text:  $("#newnotetext").val()
    };

    $.post('/note_add', newnote, function(data) {
      if (data.errors) {
        $.each(data.errors, function(k, v) {
          alert(v);
        });
      } else {
        $.observable(n).insert(0, data);
        $("#newnotetext").val("");
      }
    }, "json");
  });




  ///////////////////////////////////////////////////////
  // TASKS
  tasks = [];

  $.templates({
    taskTemplate: "#task-tmpl"
  });

  $.link.taskTemplate("#tasklist", tasks);

  $.getJSON('/tasks?project_id=' + projectId, function(j) {
    $.each(j, function(k, v) {
      $.observable(tasks).insert(0, v);
    });
  });

  $('#newtask > form').submit(function() {
    newtask = {
      project_id: projectId,
      task_summary:  $("#newtasksummary").val()
    };

    $.post('/task_add', newtask, function(data) {
      if (data.errors) {
        $.each(data.errors, function(k, v) {
          alert(v);
        });
      } else {
        $.observable(tasks).insert(0, data);
        $("#newtasksummary").val("");
      }
    }, "json");
  });

  // XXX: Collapse all button

  /*
  $("#tasklist").on('click', ".task > .summary > .summary", function(ev) {
    $(this).parent().parent().children('.body').toggleClass("hide");
  });

  $("#tasklist").on('dblclick', ".task > .summary > .summary", function(ev) {
    $(this).parent().parent().children('.body').removeClass("hide");
  });
  */

  $("#tasklist").on('click', ".task > .summary", function(ev) {
    if ($(this).children(".summary-edit").length == 0)
      $(this).parent().children('.body').toggleClass("hide");
  });

  $("#tasklist").on('dblclick', ".task > .summary", function(ev) {
    $(this).parent().children('.body').removeClass("hide");
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
      success: function(data) {
        if (data.errors) {
          $.each(data.errors, function(k, v) {
            alert(v);
          });
        } else {
          $.observable(tasks).remove(this.idx);
          $.observable(tasks).insert(this.idx, data);
        }
      }
    });
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
});

