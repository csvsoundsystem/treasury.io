$(function() {
  var encoding = false;
  var $query_refresher = $('#query-refresher');
  function bindHandlers(){
      $('#navmenu').scrollSpy()

      $('#navmenu ul li a').on('click', function(e) {
          var that = this;
          scrollThere(that, e);
      });

      $('h2 a').on('click', function(e) {
          var that = this;
          scrollThere(that, e);
      });

      $("#query-encoding-options input[name='encoding']").change(function(){
        var query_text = $("#sql").val();
        encoding = $(this).val();
        if(encoding == 'true'){
           var encoded_text = encodeURI(query_text);
           $("#sql").val(encoded_text);
         }else{
           var unencoded_text = decodeURI(query_text);
           $("#sql").val(unencoded_text);
         }
      });

      $('#query').on('keydown', '.gwt-TextBox', function(){
          $query_refresher.removeAttr('disabled');
      });

      $('#query').on('change', '.gwt-ListBox', function(){
        if ($('#rqb .gwt-ListBox option:first-child').attr('disabled') == undefined){
          $('#rqb .gwt-ListBox option:first-child').attr('disabled','disabled');
        }
      })

  }
  function scrollThere(that, e){
    e.preventDefault();
    target = that.hash;
    console.log(that.hash);
    $.scrollTo(target, 300, {offset:-10});
  }
  function initRedQuery(table_schema){
      RedQueryBuilderFactory.create({
          meta : table_schema,
          onSqlChange : function(sql, args) {
              $query_refresher[0].disabled = true;
              var out = sql + '\r\n';
              for (var i = 0; i < args.length; i++) {
                var arg = args[i];
                if(isNaN(arg)){
                  arg = "'" + arg + "'"
                }else{
                  arg = Number(arg);
                }
                out = out.replace('?', arg)
              }
              sanitize_out = function(out) { return out.replace(/\"x0\"\.?/g, '');
          }

          query = function(base, out) { return base + encodeURI(sanitize_out(out)); }
          if (encoding == true){
            document.getElementById("sql").value = encodeURI(sanitize_out(out));
          }else{
            document.getElementById("sql").value = sanitize_out(out);
          }
          document.getElementById("download-json").setAttribute('href', query('https://premium.scraperwiki.com/cc7znvq/47d80ae900e04f2/sql/?q=', out));
          document.getElementById("download-csv").setAttribute('href', query('http://jsonadapter.herokuapp.com/?q=', out));
        },
      });
  };

  $.get('web/table_schema/tables.json', function(table_schema) {
    initRedQuery(table_schema);
    bindHandlers();
  });



});
