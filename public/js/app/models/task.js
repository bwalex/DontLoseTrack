define(['appns', 'underscore', 'backbone', 'backbone-relational', 'models/tag_link'], function(App, _, Backbone) {

  App.TaskDep = Backbone.RelationalModel.extend({
    modelName: 'Task Dependency',
    urlRoot: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/taskdep';
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


  App.Task = Backbone.RelationalModel.extend({
    modelName: 'Task',
    iSortWeight: 0,

    defaults: {
      expanded: false
    },
    urlRoot: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/task';
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
      App.globalController.register(this);
      this.calcISortWeight();
    },

    idAttribute: 'id',
    relations: [
      {
        type: Backbone.HasMany,
        key:  'task_deps',
        relatedModel: App.TaskDep,
        reverseRelation: {
          key: 'task',
	  keySource: 'task_id'
        }
      },
      {
        type: Backbone.HasMany,
        key:  'dep_tasks',
        relatedModel: App.TaskDep,
        reverseRelation: {
          key: 'dependency',
	  keySource: 'dependency_id'
        }
      },
      {
	type: Backbone.HasMany,
	key:  'task_tags',
	relatedModel: App.TaskTag,
	reverseRelation: {
	  key: 'task',
	  keySource: 'task_id'
	}
      }
    ]
  });

  App.TaskCollection = Backbone.Collection.extend({
    modelName: 'Tasks',
    url: function() {
      return '/api/project/'+ App.globalController.get('projectId') +'/task';
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
	order = App.globalController.get('tasks:order');

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
      App.globalController.register(this);
    },

    model: App.Task
  });



});