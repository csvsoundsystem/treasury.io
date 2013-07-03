$(function() {
  var encoding = 'false',
      api_endpoint = 'https://premium.scraperwiki.com/cc7znvq/47d80ae900e04f2/sql/?q=',
      $query_refresher = $('#query-refresher'),
      $download_browser_btn = $('#download-browser'),
      $download_csv_btn = $('#download-csv'),
      $download_json_btn = $('#download-json'),
      $sql_query_textarea = $('#sql'),
      $any_download_as_csv_btn = $('.download-as-csv-btn');

  function bindHandlers(){
      /* NAV MENU BEHAVIOR */
      $('#navmenu').scrollSpy()

      $('#navmenu ul li a').mousedown(function(e) {
          if ($(that).attr('id') == 'logo'){
            var that = $('#navmenu a[href="#query"]')[0]
          } else {
            var that = this;
          }
          scrollThere(that, e);
          return false;
      });

      $('#navmenu ul li a').click(function(e){
        e.preventDefault();
      });

      $('h2 a').mousedown(function(e) {
          var that = this;
          scrollThere(that, e);
          return false;
      });

      $('.smooth-scroll').click(function(e){
          var that = this;
          scrollThere(that, e);
          return false;
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
      $any_download_as_csv_btn.mousedown(function(e){
        if($(this).attr('href') == '#'){
          e.preventDefault();
        };
        if(!$(this).hasClass('disabled')){
          trackQuery('csv')
          var q = $(this).attr('data-query-link');
          var before_text = $(this).html();
          setDownloadBtn('fetch', $(this));
          convertJSONtoCSV(q, $(this), before_text);
        };
        return false;
      });

      // Disable button if it has a disable class
      $download_json_btn.mousedown(function(e){
        if(!$(this).hasClass('disabled')){
          trackQuery('json');
        }else{
          return false
        };
      });

      /* PREVIEW IN BROWSER BUTTON */
      $download_browser_btn.mousedown(function(){
        var $that = $(this);
        if(!$(this).hasClass('disabled')){
          var q = $('#download-csv').attr('data-query-link');
          var before_text = $that.html()
          setDownloadBtn('fetch', $that);
          fetchJSON(q + ' LIMIT 10').done(function(results){
            setDownloadBtn('reset', $download_browser_btn, before_text);
            trackQuery('browser', results.length)
            $('#results').html('<img src="web/images/ajax-loader.gif"/>')
            $('#results-container').show()
            if (results.length === 0) {
              $('#results').html('No results found')
            } else {
              $('#results').html('')
              $('#results').append('<thead></thead><tbody></tbody>')
              var columnNames = Object.keys(results[0])
              $('#results thead').append('<tr>' + columnNames.map(function(columnName){return '<th>' + columnName + '</th>'}).join('') + '</tr>')
              $('#results tbody').html(results.map(function(row){
                return '<tr>' + columnNames.map(function(columnName){
                  if (columnName == 'url') {
                    return '<td><a href="' + row[columnName] + '">' + row[columnName].replace('https://www.fms.treas.gov/fmsweb/viewDTSFiles?', '...') + '</td>'
                  } else { 
                    return '<td>' + row[columnName] + '</td>'
                  }
                }).join('') + '</tr>'
              }).join(''))
            }
          }).fail(function(err){
            setDownloadBtn('reset', $that, before_text);
            if (err.status == 404){
              alert('404 Error. Please recheck your query and make sure everything is spelled correctly.')
            }else{
              alert(err.status + ' ' + JSON.stringify(err.responseJSON))
            };
          })
        }else{
          return false
        };
      });

      $sql_query_textarea.keyup(function(){
        enableBuilderBtns();
        var q_string = $sql_query_textarea.val();
        loadBtnAttrsWithQueryLink(q_string)
      });

      $sql_query_textarea.autogrow();
      makeTextfieldsPlaceholderable();

  };

  function makeTextfieldsPlaceholderable(){
    /* Clears textfields from helper text on click */
    /* https://gist.github.com/mhkeller/5827111    */
    var $textfield = $('.placeholder-textfield');
 
    $textfield.focus(function(srcc){
        if ($(this).val() == $(this)[0].title){
            $(this).removeClass("placeholder-textfield-active");
            $(this).val("");
        }
    });
 
    $textfield.blur(function(){
        if ($(this).val() == ""){
            $(this).addClass("placeholder-textfield-active");
            $(this).val($(this)[0].title);
        }
    });
 
    $textfield.blur();
  }

  function trackQuery(fileFormat, resultCount){
    if (typeof(resultCount) == 'undefined') {
      var resultCount = false;
    }

    // Track
    if (encoding == 'true'){
      var url = decodeURI($('#sql').val())
    }else{
      var url = $('#sql').val()
    }
    var sql = url.replace('https://premium.scraperwiki.com/cc7znvq/47d80ae900e04f2/sql/?q=', '')
    _paq.push(['trackSiteSearch', sql, fileFormat, resultCount]);
  }

  function scrollThere(that, e){
    e.preventDefault();
    e.stopPropagation();
    target = that.hash;
    $.scrollTo(target, 300);
  }

  function enableBuilderBtns(){
    var $builder_btns = $('#builder-btns .btn')
    if($builder_btns.hasClass('disabled')){
      $builder_btns.removeClass('disabled');
      $('#builder-btns-overlay').css('z-index',0);
    };
  }
  function initRedQuery(table_schema){
    RedQueryBuilderFactory.create({
      meta : table_schema,
      onSqlChange : function(sql, args) {
        enableBuilderBtns();

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
        sanitize_out = function(out) { return out.replace(/\"x0\"\.?/g, ''); }

        query = function(base, out) { return base + encodeURI(sanitize_out(out)); }

        if (encoding == 'true'){
          document.getElementById("sql").value = encodeURI(sanitize_out(out));
        }else{
          document.getElementById("sql").value = sanitize_out(out);
        }
        loadBtnAttrsWithQueryLink(sanitize_out(out));
      }
    });
  };

  function sanitizeForBtns(q_string){
    return q_string.replace(/\n/g,'%20').replace(/%20%20/g,'%20') // Convert line breaks to spaces, avoid double spaces
  };

  function loadBtnAttrsWithQueryLink(q_string){
    var q_string_sanitized = sanitizeForBtns(q_string);
    var query = api_endpoint + q_string_sanitized;
    $download_json_btn.attr('href', query);
    $download_csv_btn.attr('data-query-link', query);
  };

  function setDownloadBtn(state, $this, before_text){
    if (state == 'fetch'){
      var ajax_img = '<img src="web/images/ajax-loader.gif"/>';
      $this.html('Fetching... ' + ajax_img).addClass('disabled');
    }else{
      $this.html(before_text).removeClass('disabled');
    }
  }

  function convertJSONtoCSV(query, $this, before_text){
    fetchJSON(query).done(function(json){
      setDownloadBtn('reset', $this, before_text);
      var csv = dsv.csv.format(json);
      window.location.href = "data:text/csv," + encodeURIComponent(csv);
    }).fail(function(err){
      setDownloadBtn('reset', $this, before_text);
      if (err.status == 404){
        alert('404 Error. Please recheck your query and make sure everything is spelled correctly.')
      }else{
        alert(err.status + ' ' + JSON.stringify(err.responseJSON))
      };
    })
  };

  function fetchJSON(query){
    return $.ajax({
      url: query
    });
  };

  $.get('web/table_schema/tables.json', function(table_schema) {
    initRedQuery(table_schema);
    bindHandlers();
  });

});
