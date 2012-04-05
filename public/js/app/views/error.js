define(['appns', 'jquery', 'underscore', 'backbone', 'backbone-relational', 'jsrender'], function(App, $, _, Backbone) {
  App.ErrorView = Backbone.View.extend({
    events: {
    },

    error: function(resp, originalModel) {
      console.log('Error: resp: %o, origModel: %o', resp, originalModel);
      // resp.status => 500, 404, etc
      // resp.readyState => 4???
      // resp.statusText => "Internal Server Error"
      // resp.responseText => the json in string format
      //    	"{"errors":["Title has already been taken"]}"
      // originalModel instanceof App.Tag , ...

      var errors = [];

      try {
	var respObj = $.parseJSON(resp.responseText);
	errors = respObj.errors;
      } catch(err) {
      }

      var obj = {
	statusCode: resp.status,
	statusText: resp.statusText,
	errors: errors,
	modelName: originalModel.modelName
      };

      this.render(obj);
    },

    clear: function() {
      console.log('ErrorView: clear()');
      $(this.el).empty().addClass('hide');
    },


    deferClear: function() {
      _.delay(this.clear, 60*1000);
    },


    initialize: function() {
      _.bindAll(this,
		'render',
		'clear',
		'deferClear',
		'error');

      this.bind('backbone:error', this.error);
      this.bind('backbone:sync', this.clear);

      App.globalController.register(this);
    },

    template: $.templates('#error-tmpl'),

    render: function(obj) {
      $(this.el).html(this.template.render(obj)).removeClass('hide');

      window.scrollTo(0, 0);
      this.deferClear();
    }
  });

});
