(function( $ ) {
  var inputTypes = {
    'text': {
      init: function(d) {
        return $.extend(d, {
          origContent: (typeof(d.getContent) === 'function') ? d.getContent(d) : $(this).text(),
          restoreContent: $(this).html(),
          newContent:  null,
          restoreTmpl: $.templates(null, "{{:restoreContent}}"),
          editTmpl: $.templates(null, "<input type='text' value='{{:origContent}}'>")
        });
      },
      appendEdit: function(d, fnSubmit, fnCancel) {
        return $(d.editTmpl.render(d)).appendTo($(this)).data('d', d).keypress(function(ev) {
          if (ev.keyCode === 13 /* ENTER */) {
            var d = $(this).data('d');
            d.newContent = $(this).val();
            $(this).parent().empty().append(d.restoreTmpl.render(d));
            fnSubmit(d);
          } else if (ev.keyCode === 27 /* ESC */) {
            var d = $(this).data('d');
            var p = $(this).parent();
            p.empty().append(d.restoreTmpl.render(d));
            fnCancel.call(p, d);
          }
        });
      }
    },
    'text-area': {
      init: function(d) {
              return $.extend(d, {
                origContent: d.getContent ? d.getContent(d) : $(this).text(),
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
                    c.find("textarea").keypress(function(ev) {
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

  $.fn.magicedit = function(ev, sel, subclass, type, pdarg, content, postdata) {
    $(this).on(ev, sel + ' > .' + subclass, function(ev) {
      var view = $.view(this);
      var d = {
        subclass: subclass,
        data: view.data,
        getPostData: postdata,
        getContent: content,
        pdarg: pdarg,
        view: view
      };
      d = inputTypes[type].init.call(this, d);
      $(this).subsClass(subclass, subclass + '-edit').empty();
      var par = this;
      inputTypes[type].appendEdit.call(this, d, function(d) {
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
                  $.observable(this.pd.observable).remove(this.d.view.index);
                  $.observable(this.pd.observable).insert(this.d.view.index, data);
                }
              }
           });
       },
       function(d) {
         $(this).subsClass(subclass + '-edit', subclass);
       }
      );
    });
  }
})(jQuery);
