(function( $ ){
  $.fn.magicedit = function(ev, sel, subclass, type, pdarg, postdata) {
    $(this).on(ev, sel + ' > .' + subclass, function(ev) {
      var view = $.view(this);
      var t = '';
      if (type === 'text')
        t = $(this).text();
      $(this).empty();
      $(this).removeClass(subclass);
      $(this).addClass(subclass + '-edit');
      $("<input type='text' value='"+t+"'>")
        .appendTo($(this))
        .data('d', {
          origtext: t,
          subclass: subclass,
          data: view.data,
          postdata: postdata,
          pdarg: pdarg,
          view: view
        })
        .keypress(function(ev) {
          if (ev.keyCode === 13 /* ENTER */) {
            var d = $(this).data('d');
            d.newtext = $(this).val();
            var pd = d.postdata(d);
            var ctx = {d: d, pd: pd};

            $(this).parent().empty().append(d.origtext);

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
                } else {
                  $.observable(this.pd.observable).remove(this.d.view.index);
                  $.observable(this.pd.observable).insert(this.d.view.index, data);
                }
              }
            });
          }

          if (ev.keyCode === 27 /* ESC */) {
            t = $(this).data('d').origtext;
            $(this).parent().empty().append(t);
          }
        });
    });
  };
})(jQuery);
