require([
  "jquery.tools",
  "jquery.views",
  "require.text!/tmpl/test.tmpl",
  "require.text!/tmpl/note.tmpl",
  "require.text!/tmpl/task.tmpl"
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

  $("#notelist").on('dblclick', ".tags > .tag", function(ev) {
    var view = $.view(this);
    alert(JSON.stringify(view.data));
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
});



