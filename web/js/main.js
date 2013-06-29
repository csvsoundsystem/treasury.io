$(function() {
  var encoding = 'false',
      api_endpoint = 'https://premium.scraperwiki.com/cc7znvq/47d80ae900e04f2/sql/?q=',
      $query_refresher = $('#query-refresher'),
      $download_csv_btn = $('#download-csv'),
      $download_json_btn = $('#download-json'),
      $sql_query_textarea = $('#sql');

  function bindHandlers(){
      /* NAV MENU BEHAVIOR */
      $('#navmenu').scrollSpy()

      $('#navmenu ul li a').on('click', function(e) {
          var that = this;
          scrollThere(that, e);
      });

      $('h2 a').on('click', function(e) {
          var that = this;
          scrollThere(that, e);
      });

      /* QUERY BOX BEHAVIOR */
      /* QUERY ENCODING */
      $("#query-encoding-options input[name='encoding']").change(function(){
        var query_text = $("#sql").val();
        encoding = $(this).val();
        if(encoding == 'true'){
           var encoded_text = encodeURI(query_text);
           $sql_query_textarea.val(encoded_text);
         }else{
           var unencoded_text = decodeURI(query_text);
           $sql_query_textarea.val(unencoded_text);
         }
      });

      /* QUERY REFRESHING */
      $('#query').on('keydown', '.gwt-TextBox', function(){
          $query_refresher.removeAttr('disabled');
      });

      /* DISABLE FIRST LIST ITEM, COULD BE IMPROVED  TO BE DISABLED FROM THE BEGINNING BUT THAT WAS CAUSING PROBLEMS WITH RQB */
      $('#query').on('change', '.gwt-ListBox', function(){
        if ($('#rqb .gwt-ListBox option:first-child').attr('disabled') == undefined){
          $('#rqb .gwt-ListBox option:first-child').attr('disabled','disabled');
        }
      });

      /* DOWNLOAD AS CSV BUTTON BEHAVIOR */
      $download_csv_btn.click(function(){
        if(!$(this).hasClass('disabled')){
          var q = $sql_query_textarea.val();
          setDownloadBtn('fetch');
          convertJSONtoCSV(q);
        };
      });

      $download_json_btn.click(function(){
        if(!$(this).hasClass('disabled')){
          return true
        }else{
          return false
        }
      });

  };
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
              $('#builder-btns .btn').removeClass('disabled');

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
          if (encoding == 'true'){
            console.log(encodeURI(sanitize_out(out)))
            document.getElementById("sql").value = encodeURI(sanitize_out(out));
          }else{
            document.getElementById("sql").value = sanitize_out(out);
          }
          document.getElementById("download-json").setAttribute('href', query(api_endpoint, out));
        },
      });
  };

  function setDownloadBtn(state){
    if (state == 'fetch'){
      var ajax_img = '<img src="web/images/ajax-loader.gif"/>';
      $(this).html('Fetching... ' + ajax_img);
    }else{
      $download_csv_btn.html('Download .csv');
    }
  }

  function convertJSONtoCSV(query){
    fetchJSON(query).done(function(json){
      setDownloadBtn('reset');
      var csv = dsv.csv.format(json);
      window.location.href = "data:text/csv," + encodeURIComponent(csv);
    }).fail(function(err){
      setDownloadBtn('reset');
      if (err.status == 404){
        alert('404 Error. Please recheck your query and make sure everything is spelled correctly.')
      }else{
        console.log(err.status + ' error: ' + err.statusText)
      }
    });
  };

  function fetchJSON(query){
    return $.ajax({
      url: api_endpoint + query
    });
  };

  $.get('web/table_schema/tables.json', function(table_schema) {
    initRedQuery(table_schema);
    bindHandlers();
  });


});
