$(function() {
      var encoding               = 'false',
      api_endpoint               = 'https://premium.scraperwiki.com/cc7znvq/47d80ae900e04f2/sql/?q=',
      $query_refresher           = $('#query-refresher'),
      $download_browser_btn      = $('#download-browser'),
      $download_csv_btn          = $('#download-csv'),
      $download_json_btn         = $('#download-json'),
      $sql_query_textarea        = $('#sql'),
      $any_download_as_csv_btn   = $('.download-as-csv-btn'),
      $chart_builder_input_text  = $('.chart-builder-input-text'),
      $chart_builder_view        = $('.chart-builder-submit .btn'),
      $chart_builder_series_data = $('#cb-series-col'),
      $chart_builder_x_data      = $('#cb-x-col'),
      $chart_builder_y_data      = $('#cb-y-col'),
      $chart_container           = $('#chart-container');
      $chart_canvas              = $('#chart-canvas'),
      $builder_table_select      = $('#builder-table-select'),
      $qb_table_builders         = $('#qb-table-builders');

  function bindHandlers(db_schema){
      /* NAV MENU BEHAVIOR */
      $('#navmenu').scrollSpy()

      $('#navmenu ul li a').mousedown(function(e) {
          if ($(that).attr('id') == 'logo'){
            var that = $('#navmenu a[href="#query"]')[0]
          } else {
            var that = this;
          };
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
         };
      });

      /* DISABLE FIRST LIST ITEM, COULD BE IMPROVED  TO BE DISABLED FROM THE BEGINNING BUT THAT WAS CAUSING PROBLEMS WITH RQB */
      // $('#query').on('change', '.gwt-ListBox', function(){
      //   disableFirstChoice($this);
      //   // if ($('#rqb .gwt-ListBox option:first-child').attr('disabled') == undefined){
      //   //   $('#rqb .gwt-ListBox option:first-child').attr('disabled','disabled');
      //   // };
      // });

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
            $('#results').html('<img src="web/images/ajax-loader.gif"/>');
            $('#results-container').show();
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
                    return '<td><a href="' + row[columnName] + '" target="_blank">Source</td>'
                  } else { 
                    return '<td>' + row[columnName] + '</td>'
                  };
                }).join('') + '</tr>'
              }).join(''))
            };
          }).fail(function(err){
            setDownloadBtn('reset', $that, before_text);
            if (err.status == 404){
              alert('404 Error. Please recheck your query and make sure everything is spelled correctly.');
            }else{
              alert(err.status + ' ' + JSON.stringify(err.responseJSON));
            };
          });
        }else{
          return false;
        };
      });

      $sql_query_textarea.keyup(function(){
        var q_string = $sql_query_textarea.val();
        if (q_string.length > 0 ){
          enableBuilderBtnsAndChartOptions();
        }else{
          disableBuilderBtnsAndChartOptions();
        }
        loadBtnAttrsWithQueryLink(q_string)
      });

      $sql_query_textarea.autogrow();
      makeTextfieldsPlaceholderable();

      /* SHOW HIDE TABLE */
      $('.show-hide-table').click(function(){
        var state = $(this).data('state');
        if (state == 'hide'){
          $('#results-table-container').hide();
          $(this).data('state','show');
          $(this).html('Show preview table')
        }else{
          $('#results-table-container').show();
          $(this).html('Hide preview table')
          $(this).data('state','hide');
        };
      });

      /* CHART BUILDER ENABLE DISABLE BUTTON */
      $chart_builder_input_text.keyup(function(e){
        validateChartBuilder();
      });

      $chart_builder_view.mousedown(function(e){
        constructDynamicHighchartObject();
      });


      /* (TQB) Treasury Query Builder */
      $builder_table_select.change( function(){
        $this = $(this);
        disableFirstChoice($this);
        var table_selector = $this.val(),
            table_schema   = db_schema.tables[table_selector],
            table_cols     = table_schema.columns;
            // table_desc = table_schema.desc;

        $('.qb-table-builder').removeClass('queryable-table');
        $('#qb-table-builder-'+table_selector).addClass('queryable-table');

      });

      $('.qc-select-all').click(function(){
        $(this).parents('.qc-col-ctnr').find('.query-checkbox-item input').prop('checked', this.checked);
      });

      /* The checkboxes and input textboxes need different listeners because .on('change') only detects changes for textfields after the box loses mouse focus (i.e. the user clicks away) */
      $qb_table_builders.on('change', '.queryable-item input:checkbox', function(){

        // If everything is checked, then check the main one, else uncheck it
        setParentCheckState($(this));

        buildQueryFromInputs();
      }); 

      $qb_table_builders.on('keyup', '.queryable-item input:text', function(){
        buildQueryFromInputs();
      }); 

  };

  function setParentCheckState($this){
    // If everything is checked, then check the main one, else uncheck it
    if($this.parents('.qc-values-ctnr').find('input:checkbox').length == $this.parents('.qc-values-ctnr').find('input:checkbox:checked').length) {
        $this.parents('.qc-values-ctnr').siblings('.qc-col-header').find(".qc-select-all").prop('checked', 'true');
    } else {
        $this.parents('.qc-values-ctnr').siblings('.qc-col-header').find('.qc-select-all').removeAttr('checked');
    };

  };

  function buildQueryFromInputs(){
    var filters = [];
    // $('.queryable-table').find('.query')
  };

  function drawQueryBuilders(db_schema){
    var tables = db_schema.tables;
    for (var table in tables){
      if ( _.has(tables, table) ){
        var table_schema   = tables[table],
            table_cols     = table_schema.columns;
        
        drawQueryBuilder(table_schema.name, table_cols);
      };
    };
  };

  /* TODO, move thse template vars to the top */
  var qb_table_builder_templ = $('#qb-table-builder-templ').html(),
      queryTableBuilderTemplFactory = _.template(qb_table_builder_templ),
      formatHelpers = {
        normalizeFormatType: function(type){
          type = type.toLowerCase();
          return '(' + type + ')';
        },
        makeKeyFromName: function(name, table_name){
          var name_formatted = name.toLowerCase().replace(/ /g, '_').replace(/\(|\)/g, ''); /* Lowercase, spaces to underscores, parenthesis to nuthin' */
          /* prepend table_name */
          return table_name + '-' + name_formatted;
        }
      };

  function initQueryBuilderBackbone(t2){

    /********** M O D E L ************/
    // Create a model for the services
    var Value = Backbone.Model.extend({

        // These are the default values
        defaults:{
            name: 'item',
            date_range: ['1970-01-01', '2013-11-05'],
            is_type_parent: false,
            type_parents: null,
            checked: false
        },

        // Helper function for checking/unchecking a service
        toggle: function(){
            this.set('checked', !this.get('checked'));
        }
    });


    /********** C O L L E C T I O N S ************/

    // Create an object to hold each collection of items (a collection corresponds to a column in the database)
    var collections = {},
        values;
    for (var column in t2.columns){
      if ( _.has(t2.columns, column)) {

        if (t2.columns[column].type == 'TEXT' && t2.columns[column].name != 'date'){

          // Create a collection for that column
          collections[column] = Backbone.Collection.extend({
            model: Value,

            getChecked: function(){
                return this.where({checked:true});
            }
          });

          // Fill that collection with the column values
          var column_values = [];
          _.each(t2.columns[column].values, function(value){
             var column_value = new Value(value);
             column_values.push(column_value);
          });

          collections[column] = new collections[column](column_values)

        };

      };
    };

    // // Create a collection of items
    // var ItemCollection = Backbone.Collection.extend({

    //     // Will hold objects of the Service model
    //     model: Item,

    //     // Return an array only with the checked services
    //     getChecked: function(){
    //         return this.where({checked:true});
    //     }
    // });



    // var item_list = [];
    // t2.columns.item.values.forEach( function(item){
    //   var new_item = new Item(item);
    //   item_list.push(new_item)
    // });

    // // Prefill the collection with a number of services.
    // var items = new ItemCollection(item_list);


    /********** V I E W ************/
    // This view turns an Item model into HTML. Will create LI elements.
    var ItemView = Backbone.View.extend({
        tagName: 'li',

        events:{
            'click': 'toggleItem'
        },

        initialize: function(){

            // Set up event listeners. The change backbone event
            // is raised when a property changes (like the checked field)

            this.listenTo(this.model, 'change', this.render);
        },

        render: function(){

            // Create the HTML

            this.$el.html('<input type="checkbox" value="1" name="' + this.model.get('name') + '" /> ' + this.model.get('name'));
            this.$('input').prop('checked', this.model.get('checked'));

            // Returning the object is a good practice
            // that makes chaining possible
            return this;
        },

        toggleItem: function(){
            this.model.toggle();
        }
    });


    /********** A P P  V I E W ************/
    // The main view of the application
    var App = Backbone.View.extend({

        // Base the view on an existing element
        el: $('#qb-table-builders'),

        initialize: function(){

            var that = this;

            // Cache these selectors
            // this.total = $('#total span');
            this.list = $('#items');

            /* Do some crazy looping shit */
            // Listen for the change event on the collection.
            // This is equivalent to listening on every one of the 
            // items objects in the collection.
            for (var collection in collections){
              if ( _.has(collections, collection)){
                console.log(collections[collection])
                this.listenTo(collections[collection], 'change', this.render);

                // Create views for every one of the items in the
                // collection and add them to the page
                collections[collection].each(function(item){

                  var view = new ItemView({ model: item });
                  this.$el.append(view.render().el);

                }, that); // "that" is the context in the callback
              };
            };


        },

        render: function(){

            // Calculate the total order amount by agregating
            // the prices of only the checked elements

            // var total = 0;

            for (var collection in collections){
              if ( _.has(collections, collection)){

                _.each(collections[collection].getChecked(), function(elem){
                  console.log(elem.get('name'))
                });
              };
            };

            // // Update the total price
            // this.total.text('$'+total);

            return this;
        }
    });

    new App();




  };

  function drawQueryBuilder(table_name, table_cols){
      var table_info    = {
        table_name: table_name,
        table_cols: table_cols
      };

      _.extend(table_info, formatHelpers, table_name);
      var table_builder = queryTableBuilderTemplFactory(table_info);

      $qb_table_builders.append(table_builder);

  };

  function disableFirstChoice($el){
    $choice = $el.find('option:first-child')
    if ($choice.attr('disabled') == undefined){
      $choice.attr('disabled','disabled');
    };
  };

  function constructDynamicHighchartObject(){
    var chart_settings = {
      query_url: $download_json_btn.attr('href'),
      chart_type: $('input:radio[name=chart-type]:checked').val(),
      series: $chart_builder_series_data.val(),
      x: $chart_builder_x_data.val(),
      y: $chart_builder_y_data.val()
    };

    $chart_container.show();
    $chart_canvas.dynamicHighchart(chart_settings, function(response){
      console.log(response)
    });
  };

  function validateChartBuilder(){
    var $cb_inputs = $('.chart-builder-input-text'),
        input_checker = 0;

    // Loop through the input fields and if they are something other than the default value or empty, count that as acceptable for the chart builder button to become active.
    $.each($cb_inputs, function(ind, el){
      var $el = $(el);
      if ($el.val() != 'Series names ' && $el.val() != 'Y-axis data ' && $el.val() != 'X-axis data ' && $el.val() != '' && $el.val() != '' && $el.val() != ''){
        input_checker++
      };
    });

    if (input_checker != 3){
      // More info needed
      disableChartViewBtn();

    }else{
      // Ok to go!
      enableChartViewBtn();
    };
  };

  function disableChartViewBtn(){
    $chart_builder_view.addClass('disabled');
  };

  function enableChartViewBtn(){
    $chart_builder_view.removeClass('disabled');
  };

  function makeTextfieldsPlaceholderable(){
    /* Clears textfields from helper text on click */
    /* https://gist.github.com/mhkeller/5827111    */
    var $textfield = $('.placeholder-textfield');
 
    $textfield.focus(function(srcc){
      if ($(this).val() == $(this)[0].title){
          $(this).removeClass("placeholder-textfield-active");
          $(this).val("");
      };
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
    };

    // Track
    if (encoding == 'true'){
      var url = decodeURI($('#sql').val())
    }else{
      var url = $('#sql').val()
    };
    var sql = url.replace('https://premium.scraperwiki.com/cc7znvq/47d80ae900e04f2/sql/?q=', '')
    _paq.push(['trackSiteSearch', sql, fileFormat, resultCount]);
  }

  function scrollThere(that, e){
    e.preventDefault();
    e.stopPropagation();
    target = that.hash;
    $.scrollTo(target, 300);
  };

  function enableBuilderBtnsAndChartOptions(){
    var $builder_btns = $('#builder-btns .btn').not('.chart-builder-submit .btn'),
        $chart_options = $('#chart-builder-options');

    if($builder_btns.hasClass('disabled')){
      $builder_btns.removeClass('disabled');
      $chart_options.removeClass('disabled');
      $('#builder-btns-overlay').css('z-index',0);
    };
  };

  function disableBuilderBtnsAndChartOptions(){
    var $builder_btns = $('#builder-btns .btn').not('.chart-builder-submit .btn'),
        $chart_options = $('#chart-builder-options');

    if(!$builder_btns.hasClass('disabled')){
      $builder_btns.addClass('disabled');
      $chart_options.addClass('disabled');
      $('#builder-btns-overlay').css('z-index',9999);
    };
  };
  // function initRedQuery(table_schema){
  //   RedQueryBuilderFactory.create({
  //     meta : table_schema,
  //     onSqlChange : function(sql, args) {
  //       enableBuilderBtnsAndChartOptions();

  //       $query_refresher[0].disabled = true;
  //       var out = sql + '\r\n';
  //       for (var i = 0; i < args.length; i++) {
  //         var arg = args[i];
  //         if(isNaN(arg)){
  //           arg = "'" + arg + "'"
  //         }else{
  //           arg = Number(arg);
  //         }
  //         out = out.replace('?', arg)
  //       }
  //       sanitize_out = function(out) { return out.replace(/\"x0\"\.?/g, ''); }

  //       query = function(base, out) { return base + encodeURI(sanitize_out(out)); }

  //       if (encoding == 'true'){
  //         document.getElementById("sql").value = encodeURI(sanitize_out(out));
  //       }else{
  //         document.getElementById("sql").value = sanitize_out(out);
  //       }
  //       loadBtnAttrsWithQueryLink(sanitize_out(out));
  //     }
  //   });
  // };

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
    };
  };

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

  $.get('web/table_schema/db_schema.json', function(db_schema) {

    initQueryBuilderBackbone(db_schema.tables.t2);
    // drawQueryBuilders(db_schema);
    bindHandlers(db_schema);
  });

});
