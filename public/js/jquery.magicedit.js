(function( $ ) {
  var inputTypes = {
    'text': {
      init: function(d) {
        return $.extend(d, {
          origContent: (typeof(d.getContent) === 'function') ? d.getContent.call(this, d) : $(this).text(),
          restoreContent: $(this).html(),
          newContent:  null,
          restoreTmpl: $.templates(null, "{{:restoreContent}}"),
          editTmpl: $.templates(null, "<input type='text' value='{{>origContent}}'>")
        });
      },
      appendEdit: function(d, fnSubmit, fnCancel) {
        var i = $(d.editTmpl.render(d)).appendTo($(this)).data('d', d).keypress(function(ev) {
          if (ev.keyCode === 13 /* ENTER */) {
            var d = $(this).data('d');
            d.newContent = $(this).val();
            $(this).parent().empty().append(d.restoreTmpl.render(d));
            fnSubmit(d);
          }
        });

        $(document).keydown(function(ev) {
          if (ev.keyCode === 27 /* ESC */) {
            var d = i.data('d');
            var p = i.parent();
            p.empty().append(d.restoreTmpl.render(d));
            fnCancel.call(p, d);
          }
        });
        return i;
      }
    },
    'select': {
      init: function(d) {
              return $.extend(d, {
                options: (typeof(d.getOptions) === 'function') ? d.getOptions.call(this, d) : [],
                origContent: (typeof(d.getContent) === 'function') ? d.getContent.call(this, d) : $(this).text(),
                restoreContent: $(this).html(),
                newContent: null,
                restoreTmpl: $.templates(null, "{{:restoreContent}}"),
                editTmpl: $.templates(null, "<select class='magic-select'>{{for options}}<option value='{{>option.toLowerCase() }}'>{{:option}}</option>{{/for}}</select>")
              });
            },
      appendEdit: function(d, fnSubmit, fnCancel) {
                    var s = $(d.editTmpl.render(d)).appendTo($(this)).data('d', d);
                    $(this).find('option[value="'+$.trim(d.origContent).toLowerCase() +'"]').attr("selected",true);
                    $(this).find('select').change(d, function(ev) {
                      // this -> select element
                      var d = ev.data;
                      d.newContent = $(this).val();
                      $(this).parent().empty().append(d.restoreTmpl.render(d));
                      fnSubmit(d);
                    });
                    $(document).keydown(function(ev) {
                      if (ev.keyCode === 27 /* ESC */) {
                        var p = s.parent();
                        var d = s.data('d');
                        p.empty().append(d.restoreTmpl.render(d));
                        fnCancel.call(p, d);
                      }
                    });
                  }
    },
    'text-area': {
      init: function(d) {
              return $.extend(d, {
                origContent: (typeof(d.getContent) === 'function') ? d.getContent.call(this, d) : $(this).text(),
                restoreContent: $(this).html(),
                newContent: null,
                restoreTmpl: $.templates(null, "{{:restoreContent}}"),
                editTmpl: $.templates(null,
                                      "<form><div class='magic-tarea-tarea'><textarea class='magic-tarea'>{{:origContent}}</textarea></div><div class='magic-tarea-input'><input type='submit'></div></form>")
              });
            },
      appendEdit: function(d, fnSubmit, fnCancel) {
                    var c = $(d.editTmpl.render(d)).appendTo($(this)).data('d', d);
                    c.submit(d, function(ev) {
                      // this -> form element
                      var d = ev.data;
                      d.newContent = $(this).find("textarea").val();
                      $(this).parent().empty().append(d.restoreTmpl.render(d));
                      fnSubmit(d);
                    });
                    // was: c.find("textarea")
                    $(document).keydown(function(ev) {
                      if (ev.keyCode === 27 /* ESC */) {
                        var p = c.parent();
                        var d = c.data('d');
                        p.empty().append(d.restoreTmpl.render(d));
                        fnCancel.call(p, d);
                      }
                    });
                  }
    }
  };

  $.fn.subsClass = function(curClass, newClass) {
    return $(this).hasClass(curClass) ?
        $(this).removeClass(curClass).addClass(newClass) :
        $(this);
  };

  $.fn.magicedit = function(ev, sel, d) {
    $(this).on(ev, sel + ' > .' + d.subclass, function(ev) {
      if ($.view(this).data.magic_editing === true) {
        return;
      }
      $.view(this).data.magic_editing = true;

      d = $.extend(d, {
        data: $.view(this).data,
        view: $.view(this)
      });
      d = inputTypes[d.type].init.call(this, d);
      $(this).subsClass(d.subclass, d.subclass + '-edit').empty();
      var par = this;
      inputTypes[d.type].appendEdit.call(this, d, function(d) {
        var pd = d.getPostData(d);
        var ctx = {d: d, pd: pd, par: par};
        
            $.ajax({
              type: 'POST',
              url: pd.url,
              data: pd.data,
              dataType: "json",
              context: ctx,
              success: function(data) {
                if (data.errors) {
                  $.each(data.errors, function(k, v) {
                    alert(v);
                  });
                  $(this.par).subsClass(this.d.subclass + '-edit', this.d.subclass);
                } else {
                  $.observable(this.pd.observable).update(this.d.view.index, data);
                }
              }
           });
       },
       function(d) {
         $.view(this).data.magic_editing = false;
         $(this).subsClass(d.subclass + '-edit', d.subclass);
       }
      );
    });
  }
})(jQuery);
