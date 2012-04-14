var requirejs = require( 'requirejs' );

var config = {
  logLevel: 0,
  appDir: '../public/',
  baseUrl: 'js',
  dir: '../public_opt',
  modules: [
    {
      name: "app"
    }
  ],
  paths: {
    'app'                 : 'app/main',
    'appns'               : 'app/appns',
    'global-controller'   : 'modules/global-controller',
    'text'                : 'contrib/require.text',
    'order'               : 'contrib/require.order',
    'jquery'              : 'contrib/jquery-1.7.2',
    'jquery.tools'        : 'contrib-mod/jquery.tools.custom',
    'jquery-ui'           : 'contrib-mod/jquery-ui-1.8.18.custom',
    'jquery.elastic'      : 'contrib-mod/jquery.elastic',
    'jquery.autoclear'    : 'contrib-mod/jquery.autoclear',
    'jquery.colorpicker'  : 'contrib-mod/jquery.colorpicker',
    'jsrender'            : 'contrib-mod/jsrender',
    'jquery.magicedit2'   : 'modules/jquery.magicedit2',
    'underscore'          : 'contrib-mod/underscore',
    'backbone'            : 'contrib-mod/backbone',
    'backbone-relational' : 'contrib-mod/backbone-relational',
    'models'              : 'app/models',
    'views'               : 'app/views'
  },

  optimizeCss: "standard.keepLines",

  fileExclusionRegExp: /(^\.|^node_modules|\.haml$|\.tmpl$)/,

  onBuildWrite : function( name, path, contents ) {
    function endsWith(str, suffix) {
      return str.toLowerCase().indexOf(suffix.toLowerCase(), str.length - suffix.length) !== -1;
    }

    if (endsWith(path, '.js')) {
      console.log('Pre-processing JS: ' + name);
      contents = contents.replace(/console.(log|debug|info|count)\((.*)\);?/g, '');
    }

    return contents;
  }
};


requirejs.optimize(config);
