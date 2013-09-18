$(function() {

  var encoding                 = 'false',
    api_endpoint               = 'https://premium.scraperwiki.com/cc7znvq/47d80ae900e04f2/sql/?q=',
    $query_refresher           = $('#query-refresher'),
    $download_browser_btn      = $('#download-browser'),
    $download_csv_btn          = $('#download-csv'),
    $download_json_btn         = $('#download-json'),
    $sql_query_textarea        = $('#sql'),
    $any_download_as_csv_btn   = $('.download-as-csv-btn'),
    $chart_builder_input_text  = $('.chart-builder-input-text'),
    $chart_builder_view        = $('#view-chart'),
    $chart_builder_series_data = $('#cb-series-col'),
    $chart_builder_x_data      = $('#cb-x-col'),
    $chart_builder_y_data      = $('#cb-y-col'),
    $chart_container           = $('#chart-container');
    $chart_canvas              = $('#chart-canvas'),
    $builder_table_select      = $('#builder-table-select'),
    $qb_table_builders         = $('#qb-table-builders'),
    $help_hover                = $('#qb-help-text-hover'),
    $chart_builder_title       = $('#cb-chart-title'),
    $chart_builder_y_label     = $('#cb-y-axis-label');

  // For autogrowing of textarea
  // Textarea
  var sql_text_area = document.getElementById('sql');
  function resizeSqlArea () {
      sql_text_area.style.height = 'auto';
      sql_text_area.style.height = sql_text_area.scrollHeight+'px';
  }
  /* 0-timeout to get the already changed text */
  function delayedResize () {
      window.setTimeout(resizeSqlArea, 0);
  }
  $sql_query_textarea.on('change',  resizeSqlArea);
  $sql_query_textarea.on('cut',     delayedResize);
  $sql_query_textarea.on('paste',   delayedResize);
  $sql_query_textarea.on('drop',    delayedResize);
  $sql_query_textarea.on('keydown', delayedResize);


  var tables = {},
  apps = {},
  collections = {},
  chart_builder_settings = {
    t1: {
      series: 'account',
      x: 'date',
      y: 'close_today'
    },
    t2: {
      series: 'item',
      x: 'date',
      y: 'today'
    },
    t3a: {
      series: 'transaction_type',
      x: 'date',
      y: 'today'
    },
    t3b: {
      series: '',
      x: 'date',
      y: 'today'
    },      
    t3c: {
      series: 'item',
      x: 'date',
      y: 'close_today'
    },
    t4: {
      series: 'classification',
      x: 'date',
      y: 'today'
    },
    t5: {
      series: '',
      x: 'date',
      y: 'total'
    },
    t6: {
      series: 'refund_type',
      x: 'date',
      y: 'today'
    }
  },
  app,
  deposit_models = [],   
  withdrawal_models = [],
  d_and_w_models = []; 


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
           $sql_query_textarea.val(encoded_text).trigger('change');
         }else{
           var unencoded_text = decodeURI(query_text);
           $sql_query_textarea.val(unencoded_text).trigger('change');
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
        if(!$that.hasClass('disabled')){
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
        loadBtnAttrsWithQueryLink(q_string);
      });

      /* SHOW HIDE TABLE */
      $('.show-hide-button').click(function(){
        var state = $(this).data('state')
            target = $(this).data('target'),
            text   = $(this).data('text');

        if (state == 'hide'){
          $(target).hide();
          $(this).data('state','show');
          $(this).html('Show ' + text);
        }else{
          $(target).show();
          $(this).html('Hide ' + text);
          $(this).data('state','hide');
        };
      });      


      /* CHART BUILDER ENABLE DISABLE BUTTON */
      $chart_builder_input_text.keyup(function(e){
        validateChartBuilder();
      });

      $chart_builder_view.mousedown(function(e){
        if (! $(this).hasClass('disabled') ) {
          $("#chart-builder-options").hide();
          constructDynamicHighchartObject($(this));
          setDownloadBtn('fetch', $(this), 'Draw chart');
        };
      });


      /* (TQB) Treasury Query Builder */
      $builder_table_select.change( function(){
        $this = $(this);
        disableFirstChoice($this);
        var table_selector = $this.val();

        $('.qb-table-builder').hide();
        $('#' + table_selector + '-builder').show();
        apps[table_selector].updateQueryState(table_selector);


      });

      $('.group-toggle-all input').click(function(){
        $(this).parents('.sentence-option').find('.sentence-group input').prop('checked', this.checked).trigger('change');
      });

      /* The checkboxes and input textboxes need different listeners because .on('change') only detects changes for textfields after the box loses mouse focus (i.e. the user clicks away) */
      $qb_table_builders.on('change', '.sentence-group input:checkbox', function(){

        // If everything is checked, then check the main one, else uncheck it
        setParentCheckState($(this));

      }); 


      $('.toggle-chart-opts').click(function(){
        if ( !$(this).hasClass('disabled') ){
          $("#chart-builder-options").toggle();
        }
      });

  };

  function setParentCheckState($this){
    // If everything is checked, then check the main one, else uncheck it
    if($this.parents('.sentence-group').find('input:checkbox').length == $this.parents('.sentence-group').find('input:checkbox:checked').length) {
        $this.parents('.sentence-option').find(".toggle-group").prop('checked', 'true');
    } else {
        $this.parents('.sentence-option').find('.toggle-group').removeAttr('checked');
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
        makeKeyFromName: function(table_name, name){
          var name_formatted = name.toLowerCase().replace(/ /g, '_').replace(/\(|\)/g, ''); /* Lowercase, spaces to underscores, parenthesis to nuthin' */
          /* prepend table_name */
          return table_name + '-' + name_formatted;
        },
       formatBinaryToText: function(value){
         if (value == 0){
          return 'no'
         }else{
          return 'yes'
         }
       },
       comparinatorToText: function(comparinator){
        if (comparinator == '>'){
          return 'after'
        }else{
          return 'before'
        };
       }
      };

  function makeQueryBuilders(db_schema){
    _.each(db_schema.tables, function(table, table_name, table_list){
      tables[table_name] = table;
    });

    collections = {
      t1: {},
      t2: {},
      t3a: {},
      t3b: {},
      t3c: {},
      t4: {},
      t5: {},
      t6: {}
    };

    // makeTableColumns(tables[test_col], test_col, collections);
    _.each(tables, function(table_data, table_name_schema, table_list){
      $('#'+ table_name_schema +'-' + 'builder').find('.qb-table-available-columns').html('Columns:<pre><code class="no-wrap">' + table_data.all_cols.join(', ') + '</pre></code>');
      makeTableColumns(table_data, table_name_schema);
    });
  };


  function makeTableColumns(table, t_name){

    // Okay, how's it going?
    // Good!
    // Great!
    // Let's redo this query builder interface
    // Okay!
    // Step one
    // Make a model, that will be the model for all of our items
    var ElementModel = Backbone.Model.extend({
      defaults: {
        table_name: 'table_name_default',
        display_name: 'display_name_default',
        name: 'name_default',
        column_type: 'column_type__default',
        comparinator: 'comparinator_default',
        queryable: true,
        checked: true,
        value: 0
      },

      toggleChecked: function(){
        this.set('checked', !this.get('checked'));
      },

      toggleQueryable: function(){
        this.set('queryable', !this.get('queryable'));
      },

      updateValue: function(value){
        this.set('value', value);
      }

    });

    // Step two
    // Create our platonic collection
    var ElementCollection = Backbone.Collection.extend({
      // Will hold objects of the ElementModel model
      model: ElementModel,

      // Return an array only with the checked services
      getQueryableAndChecked: function(){
        return this.where({queryable:true, checked:true});
      },      

      getQueryableAndUnchecked: function(){
        return this.where({queryable:true, checked:false});
      },

      getCheckedCountAndQueryable: function(){
        var all_items = this.where({queryable: true}).length,
            checked_items = this.where({checked: true, queryable: true}).length,
            compare = checked_items / all_items

        // TODO handle when all or none are checked
        if (compare == 1 || compare == 0) {
          return 'all_none';
        }else if (compare >= .5 && compare < 1){
          return 'majority_checked';
        }else if (compare < .5) {
          return 'majority_unchecked';
        };
      },

      getDeposits: function(){
        var deposits = [];
        this.each(function(model){
          var under_deposit = _.contains( model.get('parents'), 'deposit' )
          if (under_deposit) { deposits.push( model ) }
        });

        return deposits;
      },

      getWithdrawals: function(){
        var withdrawals = [];
        this.each(function(model){
          var under_withdrawals = _.contains( model.get('parents'), 'withdrawal' )
          if (under_withdrawals) { withdrawals.push( model ) }
        });

        return withdrawals;
      },

      getDepositsAndWithdrawals: function(){
        var both = [];
        this.each(function(model){
          var under_withdrawals = _.contains( model.get('parents'), 'withdrawal' )
          var under_deposit     = _.contains( model.get('parents'), 'deposit' )
          if (under_withdrawals && under_deposit) { both.push( model ) }
        });

        return both;
      },

      getQueryableCount: function(){
        var all_items = this.length,
            queryable_items = this.where({queryable: true}).length,
            compare = queryable_items / all_items;

        if (compare == 0){
          return 'none_queryable'
        }else if (compare == 1){
          return 'all_queryable'
        }else{
          return 'some_querable'
        };
      }

    });

    // Step three
    // Make a collection of instances of this model based on how many checkbox groups we'll have in each question
    // Each checkbox group will be a collection
    // We should keep track of all of these collections though
    // So we made an object called collections up top there
    // The structure of that object will be t1: { col_name: backbone_collection }

    // But let's not get ahead of ourselves, first just instantiate a model for every item in the schema_json and add it to the models object
    // Instantiate item models and collections
    // console.log(collections)
    _.each(table.columns, function(column_info, column_name, columns){

      // Make models
      var models     = [],
          sub_models = [];
      // To save space, not every item has its table and column information
      // These are those values to add
      var parent_object_info = {
        table_name: t_name,
        column_name: column_info.name, // This line could be either column_name or column_info.name since the key is repeated, purely to keep it consistent with .type, use column_info.name
        column_type: column_info.column_type
      };
      // Loop through each item_value and add that parent_object_info by _.extending()
      // Turn them into instances of our models
      _.each(column_info.item_values, function(item_value){

        // Add that parent object by extending, like we said we were gonna do
        // then turn it into a model
        _.extend(item_value, parent_object_info);
        var item_model_instance = new ElementModel(item_value);
        models.push(item_model_instance);
      });

      // Instantiate our collection with data
      collections[t_name][column_info.name] = new ElementCollection(models);
      // console.log('here',t_name, column_info.name)
    });

    // Step four
    // Create the platonic forms of our views

    // Create the platonic CheckboxView
    var CheckboxView = Backbone.View.extend({
      tagName: 'li',

      template: _.template($('#Checkbox-view-templ').html()),

      events: {
        'change': function(e) {
            this.toggleChecked(e);
            this.limitPotentialChildren(e);
        },
        'mouseover .help-text-flag': 'showHelpText',
        'mouseleave .help-text-flag': 'hideHelpText'
      },

      initialize: function(){

        // Set up event listeners. The change backbone event
        // is raised when a property changes (like the checked field)
        var model_data = this.model.toJSON();
        _.extend(model_data, formatHelpers);
        this.$el.html( this.template(model_data) );

        this.listenTo(this.model, 'change', this.render);
      },

      render: function(){

        var table_name = this.model.get('table_name');

        // this.$el.find('input').prop('checked', this.model.get('checked'));

        if (this.model.get('queryable')){
          this.$el.css('display','list-item');
          // this.$el.parents('.sentence-option').find('.group-toggle-all input').prop('disabled', false)
        }else{
          this.$el.css('display','none');
          // var queryable_count = collections[table_name].getQueryableCount();
          // if (queryable_count == 'none_queryable'){
          //   this.$el.parents('.qc-col-ctnr').find('.qc-col-control-all input').prop('disabled', true);
          // };
        };

        // Make sure it stays alternating colors
        this.$el.parent().find('li:visible').filter(':even').css({'background-color': '#c1e4f2'});
        this.$el.parent().find('li:visible').filter(':odd').css({'background-color': '#fff'});          

        return this;
      },

      toggleChecked: function(e){
        this.model.toggleChecked();
        var this_table_name = this.model.get('table_name');
      },

      limitPotentialChildren: function(e){
        var main_context = this;

        var this_table_name = this.model.get('table_name');

        var val_name = this.model.get('value'),
            checked  = this.model.get('checked');

        if (val_name == 'deposit'){
          if (checked){
            deposit_models.forEach(function(model){
              model.set({'queryable': true})
            });
          }else{
            deposit_models.forEach(function(model){
              model.set({'queryable': false})
            });
          }
        }else if (val_name == 'withdrawal'){
          if (checked){
            withdrawal_models.forEach(function(model){
              model.set({'queryable': true})
            });
            
          }else{
            withdrawal_models.forEach(function(model){
              model.set({'queryable': false})
            });
          }
        }

        apps[this_table_name].updateQueryState(this_table_name);


      },

      toggleQueryable: function(e){
        this.model.toggleQueryable();

        var this_table_name = this.model.get('table_name');
        apps[this_table_name].updateQueryState(this_table_name);
      },

      showHelpText: function(e){
        var $help_text  = $(e.target),
            help_text   = $help_text.data('help-text'),
            offset      = $(e.target).offset(),
            offset_top  = offset.top,
            offset_left = offset.left;


        $help_hover.css({
          top: offset_top,
          left: offset_left + 6
        }).html(help_text).show();

      },

      hideHelpText: function(){
        $help_hover.hide();
      }
    }); 

    // Create the platonic DatefieldView
    var DatefieldView = Backbone.View.extend({
      tagName: 'li',

      template: _.template($('#OutputNumber-view-templ').html()),

      events:{
        'keyup': 'updateValue',
        'change': 'updateValue'
      },

      initialize: function(){

        // console.log('init datefield', this.model.get('table_name'))

        // Set up event listeners. The change backbone event
        // is raised when a property changes (like the checked field)
        var model_data = this.model.toJSON();
        _.extend(model_data, formatHelpers);
        this.$el.html( this.template(model_data) );
        // this.$el.addClass('query-checkbox-item').addClass('queryable-item');

        this.$el.find('input').datepicker({
          dateFormat: 'yy-mm-dd',
          showOn: "button",
          buttonImage: "/web/css/thirdparty/images/calendar.png",
          buttonImageOnly: true
        });

        this.$el.find('input').val( this.model.get('value') );

        this.listenTo(this.model, 'change', this.render);
      },

      render: function(){

        if (this.model.get('queryable')){
          this.$el.css('display','list-item');
        }else{
          this.$el.css('display','none');
        };

        return this;
      },

      updateValue: function(){
        var value = this.$el.find('input').val();
        this.model.updateValue(value);

        var this_table_name = this.model.get('table_name');
        apps[this_table_name].updateQueryState(this_table_name);
      }
    });

    // Create the platonic DatefieldSelectorView
    var DatefieldSelectorView = Backbone.View.extend({
      tagName: 'li',

      template: _.template($('#TextfieldSelector-view-templ').html()),

      events:{
        'change': 'toggleQueryable'
      },

      initialize: function(){

        // Set up event listeners. The change backbone event
        // is raised when a property changes (like the checked field)
        var model_data = this.model.toJSON();
        _.extend(model_data, formatHelpers);
        var model_markup = this.template(model_data);
        this.$el.html( model_markup );
        // console.log(model_markup)
        // this.$el.addClass('query-checkbox-controller');

        // this.listenTo(this.model, 'change', this.updateQueryState);
      },

      render: function(){

        // this.$el.find('input').prop('checked', this.model.get('queryable'));

        return this;
      },

      toggleQueryable: function(e){
        this.model.toggleQueryable();

        var this_table_name = this.model.get('table_name');
        apps[this_table_name].updateQueryState(this_table_name);
      }
    });  


    // Step five
    // This is where it all comes together
    // Our app will loop through this table's collections and create the appropriate view of that element
    // TODO add a siwtch so that it selects the proper view depending on whether it's a date column or a checkbox column
    // For a checkbox column there will actually be a subview for the value etc. etc. etc.
    var App = Backbone.View.extend({

      el: "#qb-table-builders",

      template: $('#sentence-col-templ').html(),

      initialize: function(){

        // console.log('app rendering')
        var main_context = this;

        // Small hack: So that we don't have to go about creating a bunch of empty uls in our markup
        // Create the uls for this table dynamically right here
        main_context.$el.find('#' + t_name + '-builder .sentence-option').append( main_context.template );

        _.each(collections[t_name], function(collection, collection_name, collection_list){
        // console.log('col rendering', collection_name)

          if (t_name == 't2' && collection_name == 'item'){
            main_context.constructDepositWithdrawalLists(collection);
            $(".t2-item").append('<div class="group-toggle-all"><label for="toggle-t2-item"><input type="checkbox" id="toggle-t2-item" class="toggle-group" checked/> Toggle all</div>')
          };

          // main_context.listenTo(collection, 'change', main_context.updateQueryState);

          // This is the meat and potatoes of the app
          // This is where the data from each collection is given a view and rendered into the appropriate div
          // I'm prefixing elements that are backbone view objects with v_ as opposed to their markup which is v_`name`.render().el
          collection.each( function(item){
            // console.log(collection_name)
            var sentence_wire;
            if (collection_name == 'date'){
              var v_el_date_select = new DatefieldSelectorView({model: item}),
                  v_el_date_value  = new DatefieldView({model: item});

              var select_item = v_el_date_select.render().el,
                  value_item  = v_el_date_value.render().el;

              // console.log(collection_name, select_item)

              sentence_wire = main_context.constructSw([t_name, collection_name, 'select']);
              this.$el.find('.sentence-option.' + sentence_wire + ' .sentence-group').append( select_item );
              
              sentence_wire = main_context.constructSw([t_name, collection_name, 'value']);
              this.$el.find('.sentence-option.' + sentence_wire + ' .sentence-group').append( value_item );

              // console.log(sentence_wire)
              
            }else{
              var v_el_checkbox_select = new CheckboxView({model: item})

              var checkbox_item = v_el_checkbox_select.render().el;
              sentence_wire = main_context.constructSw([t_name, collection_name]);
              this.$el.find('.sentence-option.' + sentence_wire + ' .sentence-group').append( checkbox_item );

            };


          }, main_context); // Make sure you give it the right context of this, whatever the hell that is.

        });

      },

      constructDepositWithdrawalLists: function(clltctn){
        // console.log(collection)
        deposit_models    = clltctn.getDeposits();
        withdrawal_models = clltctn.getWithdrawals();
        d_and_w_models    = clltctn.getDepositsAndWithdrawals();

      },

      constructSw: function(keys){
        return keys.join('-');
      },

      updateQueryState: function(this_table_name){
        // var this_table_name = model.get('table_name');

        // Build JSON object from collection attributes
        var columns_and_where_filters = buildQueryJson(collections[this_table_name]);
        // Build SQL string from JSON object
        var sql_string = JsonToSql(columns_and_where_filters, this_table_name);
        loadUiWithSqlString(sql_string);
        loadChartBuilderOptions(this_table_name);

      }

    });

    // The all-important one line that runs the app.
    apps[t_name] = new App();
    // console.log('t_name', t_name)

  };


  function loadChartBuilderOptions(table_name){
    var opts = chart_builder_settings[table_name];

    $chart_builder_series_data.val(opts.series);
    $chart_builder_x_data.val(opts.x);
    $chart_builder_y_data.val(opts.y);

    // $chart_builder_series_data.trigger('change');
  };

  function loadUiWithSqlString(sql_string){
    if (encoding == 'true'){
      sql_string = encodeURI(sql_string);
    };

    $sql_query_textarea.val(sql_string);
    resizeSqlArea();
    // $sql_query_textarea.autogrow();
    loadBtnAttrsWithQueryLink(sql_string);
    enableBuilderBtnsAndChartOptions();
  };

  function JsonToSql(where_filters, table_name){

    var select_string = buildSelectQuery(table_name),
        where_string  = buildWhereQuery(where_filters),
        query         = select_string + '\n' + where_string;

    return query;
  };

  function buildSelectQuery(table_name){
    // Get rid of footnotes
    var select_string = 'SELECT ' + wrapElsWithQuotes(tables[table_name].all_cols).join(', ').replace(', "footnote"', '') + '\nFROM\n' + table_name;
    return select_string;
  };

  function filtersExist(filters){
    var has_filters = false
    if (filters.length > 0){
      _.each(filters, function(filter){
        _.each(filter, function(filter_settings, filter_name, filter_list){
          if (filter_settings.length > 0){
            has_filters = true;
          }
        });
      });
    };

    return has_filters;

  };

  function buildWhereQuery(filters){
    // TODO, omit if there are no values
    var filters_exist = filtersExist(filters);
    if (filters_exist){
      var column_group = [];
      _.each(filters, function(filter) {
        for (var col in filter) {
          if (_.has(filter, col)) {
            var column_items = [];
            _.each(filter[col], function(column_item){
              var column_item_string = '"' + col  + '"' + ' ' + ((column_item.value == '(blank)') ? 'IS NULL' : (column_item.comparinator + ' ' + quoteValIfString(column_item.value)) );
              column_items.push(column_item_string);
            });

            if(filter[col][0]){
              // If it's a textfield value then it will have a `<` or a `>`, and those should be a "between" query, so use "AND"
              if (filter[col][0].comparinator == '>' || filter[col][0].comparinator == '<'){
                column_items_string = column_items.join(' AND ');
              }else{
                column_items_string = column_items.join(' OR ');
              };
              column_group.push(column_items_string);
            };
          };
        };

      });
      var column_group_string = wrapElsWithParens(column_group).join('\nAND \n');
      return 'WHERE ' + column_group_string;
    }else{
      return '';
    }
    var sql = url.replace('http://api.treasury.io/cc7znvq/47d80ae900e04f2/sql/?q=', '')
    _paq.push(['trackSiteSearch', sql, fileFormat, resultCount]);

  };

  function wrapElsWithParens(arr){
    return _.map(arr, function(el){ return '(' + el + ')' });
  };

  function wrapElsWithQuotes(arr){
    return _.map(arr, function(el){ return '"' + el + '"' });
  };

  function quoteValIfString(val){
    if ( isNaN(Number(val)) ){
      return "'" + val + "'";
    }else{
      return val;
    };
  };

  function buildQueryJson(this_col_collection){
    var queryable_models,
        checked_models,
        filters = [], // The structure of this object will be an array of objects that are arrays of objects. Fun, right?
        majority_status;
        /*  
          var filters = [
            {
              "type": [
                {
                  "comparinator": "=",
                  "value": "withdrawal"
                },
                {
                  "comparinator": "=",
                  "value": "deposit"
                }
              ]
            },
            {
              "item": [
                {
                  "comparinator": "=",
                  "value": "Medicare"
                },
                {
                  "comparinator": "=",
                  "value": "Medicaid"
                }
              ]
            },
            {
              "is_total":[
                {
                  "comparinator": "=",
                  "value": "0"
                }
              ]
            
            }
          ];
        */


    // For every collection in the table
    _.each(this_col_collection, function(collection, collection_name, collection_list){
      var column_obj  = {},
          add_model   = true,
          modify_cmpr = false,
          cmpr        = '=';

      // For each column
      column_obj[collection_name] = [];

      queryable_and_checked_models = collection.getQueryableAndChecked();

      if (collection_name != 'item'){
        queryable_models = collection.getQueryableAndChecked()
      }else{
        majority_status = collection.getCheckedCountAndQueryable();
        modify_cmpr = true;
        if (majority_status == 'majority_checked'){ // If the majority of them are checked, then it's easier to only do a WHERE clause on the excluded items
          queryable_models = collection.getQueryableAndUnchecked();
          cmpr = '!=';
        }else if (majority_status == 'majority_unchecked') {
          queryable_models = collection.getQueryableAndChecked();

        }else if(majority_status == 'all_none'){
          add_model = false;
          // Don't include any of this column's info if all of them are selected or none are selected
          // So don't add models to nuthin'
        };
      };

      if (add_model){
        _.each(queryable_models, function(elem, ind){
          var value_obj = {};
          value_obj['value'] = elem.get('value');
          value_obj['comparinator'] = (!modify_cmpr) ? elem.get('comparinator') : cmpr ;

          column_obj[collection_name].push(value_obj);
        });

        filters.push(column_obj);
      };

    });
    return filters;

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

  function constructDynamicHighchartObject($btn){
    var chart_settings = {
      query_url: $download_json_btn.attr('href'),
      chart_type: $('input:radio[name=chart-type]:checked').val(),
      series: ($chart_builder_series_data.val() != $chart_builder_series_data.title) ? $chart_builder_series_data.val() : '',
      x: ($chart_builder_x_data.val() != $chart_builder_x_data.title) ? $chart_builder_x_data.val() : '',
      y: ($chart_builder_y_data.val() != $chart_builder_y_data.title) ? $chart_builder_y_data.val() : '',
      title: ($chart_builder_title.val() != $chart_builder_title.title) ? $chart_builder_title.val() : '' , 
      y_axis_label: ($chart_builder_y_label.val() != $chart_builder_y_label.title) ? $chart_builder_y_label.val() : '' 
    };

    $chart_container.show();
    $chart_canvas.dynamicHighchart(chart_settings, function(response){
      setDownloadBtn('reset', $btn, 'Draw chart');

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
    var $builder_btns         = $('#builder-btns .btn'),
        $chart_options        = $('#chart-builder-options'),
        $preview_btns         = $('.buttn'),
        $toggle_chart_options = $('#toggle-chart-options');


    if($builder_btns.hasClass('disabled')){
      $toggle_chart_options.removeClass('disabled');
      $builder_btns.removeClass('disabled');
      $preview_btns.removeClass('disabled');
      $chart_options.removeClass('disabled');
      $('#builder-btns-overlay').css('z-index',0);
    };
  };

  function disableBuilderBtnsAndChartOptions(){
    var $builder_btns = $('#builder-btns .btn').not('.chart-builder-submit .btn'),
        $chart_options = $('#chart-builder-options'),
        $preview_btns  = $('.buttn'),
        $toggle_chart_options = $('#toggle-chart-options');

    if(!$builder_btns.hasClass('disabled')){
      $toggle_chart_options.addClass('disabled');
      $preview_btns.addClass('disabled');
      $builder_btns.addClass('disabled');
      $chart_options.addClass('disabled');
      $('#builder-btns-overlay').css('z-index',9999);
    };
  };


  function sanitizeForBtns(q_string){
    return q_string.replace(/\n/g,'%20').replace(/%20%20/g,'%20') // Convert line breaks to spaces, avoid double spaces
  };

  function loadBtnAttrsWithQueryLink(q_string){
    var q_string_sanitized = sanitizeForBtns(q_string);
    var query              = api_endpoint + q_string_sanitized;
    $download_json_btn.attr('href', query);
    $download_csv_btn.attr('data-query-link', query);
  };

  function setDownloadBtn(state, $this, before_text){
    if (state == 'fetch'){
      var ajax_img = '<img src="web/images/ajax-loader.gif"/>';
      $this.html('<span class="btn-loading-text">Fetching...</span>' + ajax_img).addClass('disabled');
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

    makeQueryBuilders(db_schema);;
    bindHandlers(db_schema);
  });

});
