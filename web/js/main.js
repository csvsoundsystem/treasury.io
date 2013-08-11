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
      $qb_table_builders         = $('#qb-table-builders'),
      $help_hover                = $('#qb-help-text-hover');

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
        console.log('change')
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
        makeKeyFromName: function(table_name, name){
          var name_formatted = name.toLowerCase().replace(/ /g, '_').replace(/\(|\)/g, ''); /* Lowercase, spaces to underscores, parenthesis to nuthin' */
          /* prepend table_name */
          return table_name + '-' + name_formatted;
        },
       formatBinaryToText: function(value){
        // console.log(value)
         if (value == 0){
          return 'no'
         }else{
          return 'yes'
         }
       },
       comparinatorToText: function(comparinator){
        if (comparinator == '>'){
          return 'min'
        }else{
          return 'max'
        };
       }
      };

  function initQueryBuilderBackbone(t2){

    var active_parents = {};


    function delegateModelEvents(from, to, eventKey) {
        from.bind('all', function(eventName) {
            var args = _.toArray(arguments);
            if (eventKey) {
                args[0] = eventKey + ':' + args[0];
            }
            to.trigger.apply(to, args);
        });
    };
     
    function getUpdateOp(model) {
        return (model instanceof Backbone.Collection) ? 'reset' : 'set';
    };
     
    Backbone.RelationalModel = Backbone.Model.extend({
        relations: {},
        set: function(attrs, options) {
            _.each(this.relations, function(constructor, key) {
                var relation = this[key];
     
                // set up relational model if it's not there yet
                if ( !relation) {
                    relation = this[key] = new constructor();
     
                    // makes it so relation events are triggered out
                    // e.g. 'add' on a relation called 'collection' would
                    // trigger event 'collection:add' on this model
                    delegateModelEvents(relation, this, key);
                }
     
                // check to see if incoming set will affect relation
                if (attrs[key]) {
                    // perform update on relation model
                    relation[ getUpdateOp(relation) ](attrs[key], options);
     
                    // remove from attr hash, prevents duplication of data +
                    // keeps models out of attributes, which should be only used for
                    // dumb JSON attributes
                    delete attrs[key];
                }
            }, this);
     
            return Backbone.Model.prototype.set.call(this, attrs, options);
        }
    });
    /********** M O D E L ************/

    var ElementModel = Backbone.Model.extend({
      defaults: {
        table_name: 't',
        name: 'c',
        column_type: 't',
        comparinator: '=',
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

    // var ColumnModel = Backbone.Model.extend({

    //   defaults: {
    //     table_name: 't',
    //     name: 'c',
    //     column_type: 't',
    //     queryable: true
    //   },

    //   toggleQueryable: function(){
    //     this.set('queryable', !this.get('queryable'));
    //   }
    // });

    var ElementCollection = Backbone.Collection.extend({
      model: ElementModel
    });

    var Column = Backbone.RelationalModel.extend({
        relations: {
            item_values: ElementCollection
        }
    });

    var column_models = {};

    // Instantiate column models
    _.each(t2.columns, function(column_info, column_name, columns){
      // To save space, not every item has its parent table and colum information
      // These are those values to add
      var parent_object_info = {
        table_name: 't2',
        column_name: column_info.name, // This line could be either column_name or column_info.name since the key is repeated, purely to keep it consistent with .type, use column_info.name
        column_type: column_info.type
      };
      // Loop through each item_value and add that info by _.extending()
      _.each(column_info.item_values, function(item_value){
        _.extend(item_value, parent_object_info);
      });
      column_models[column_name] = new Column(column_info);

    });

    var column_collections = {};
    // Instantiate column collections
    // It craetes a collection object and then creates an instance of that collection object with a model
    _.each(column_models, function(model, model_name, model_list){
      column_collections[model_name] = Backbone.Collection.extend({
        model: ElementModel
      });
      column_collections[model_name] = new column_collections[model_name](model);
    });




/*
    models.ColumnModel = Backbone.Model.extend({
      defaults: {
        table_name: 't1',
        name: 'column',
        type: 'text',
        queryable: true
      },
      toggleQueryable: function(){
        this.set('queryable', !this.get('queryable'))
      }
    });

    // Create a model for the services
    models.DateModel = Backbone.Model.extend({

      // These are the default values
      defaults:{
        table_name: 't0',
        column_name: 'date',
        type: 'none',
        comparinator: '>',
        value: 0,
        date_range: ['1970-01-01', '2013-11-05'],
        checked: true,
        queryable: true
      },

      // Helper function for checking/unchecking a service
      toggle: function(){
          this.set('checked', !this.get('checked'));
      },
      toggleQueryable: function(){
        this.set('queryable', !this.get('queryable'))
      },
      updateValue: function(value){
        this.set('value', value);
      }
    });

    models.TypeParentModel = Backbone.Model.extend({

      // These are the default values
      defaults:{
        table_name: 't0',
        column_name: 'no_column',
        type: 'none',
        value: 'item',
        comparinator: '=',
        date_range: ['1970-01-01', '2013-11-05'],
        is_type_parent: true,
        checked: true,
        queryable: true
      },

      // Helper function for checking/unchecking a service
      toggle: function(){
          this.set('checked', !this.get('checked'));
      },
      toggleQueryable: function(){
        this.set('queryable', !this.get('queryable'))
      }
    });


    // Create a model for the services
    models.ItemModel = Backbone.Model.extend({

      // These are the default values
      defaults:{
          table_name: 't0',
          column_name: 'no_column',
          type: 'none',
          value: 'item',
          comparinator: '=',
          date_range: ['1970-01-01', '2013-11-05'],
          type_parents: {},
          parent_item: null,
          checked: true,
          queryable: true
      },

      // Helper function for checking/unchecking a service
      toggle: function(){
          this.set('checked', !this.get('checked'));
      },
      toggleQueryable: function(){
        this.set('queryable', !this.get('queryable'))
      }
    });

    models.IsTotalModel = Backbone.Model.extend({

      defaults: {
        table_name: 't0',
        column_name: 'is_total',
        value: '0',
        comparinator: '=',
        checked: true,
        queryable: true
      },

      // Helper function for checking/unchecking a service
      toggle: function(){
          this.set('checked', !this.get('checked'));
      },
      toggleQueryable: function(){
        this.set('queryable', !this.get('queryable'))
      }

    });

    models.OutputNumberModel = Backbone.Model.extend({

      defaults: {
        table_name: 't0',
        column_name: 'output_number',
        value: 0,
        comparinator: '>',
        checked: true,
        queryable: true
      },

      // Helper function for checking/unchecking a service
      updateValue: function(value){
        this.set('value', value);
      },
      toggleQueryable: function(){
        this.set('checked', !this.get('checked'));
        this.set('queryable', !this.get('queryable'))
      }

    });

*/
    /********** C O L L E C T I O N S ************/
    // var column_collections = {};

    // // Create an object to hold each collection of items (a collection corresponds to a column in the database)
    // var column_collections       = {};
    // var column_value_collections = {};
    // var values;

    // Loop through each column name in the table
    // for (var column_name in t2.columns){
    //   if ( _.has(t2.columns, column_name)) {

    //     /**** COLUMN_COLLECTIONS ****/
    //     // Create a new collection for each column
    //     column_collections[column_name] = Backbone.Collection.extend({
    //       model: models.ColumnModel,

    //       getQueryable: function(){
    //           return this.where({queryable: true});
    //       },

    //     });

    //     // Fill each collection with the information for that column
    //     column_collections[column_name] = new column_collections[column_name]([
    //       new models.ColumnModel({ 
    //         table_name: 't2',
    //         name: t2.columns[column_name].name,
    //         type: t2.columns[column_name].type,
    //       })
    //     ]);

    //     /**** VALUE_COLLECTIONS ****/
    //     // Create a collection for that column's values
    //     column_value_collections[column_name] = Backbone.Collection.extend({
    //       model: models[t2.columns[column_name].model],

    //       getCheckedCountAndQueryable: function(){
    //         var all_items = this.length,
    //             checked_items = this.where({checked: true, queryable: true}).length,
    //             compare = checked_items / all_items

    //         // TODO handle when all or none are checked
    //         if (compare == 1 || compare == 0) {
    //           return 'all_none';
    //         }else if (compare >= .5 && compare < 1){
    //           return 'majority_checked';
    //         }else if (compare < .5) {
    //           return 'majority_unchecked';
    //         };
    //       },

    //       getQueryableCount: function(){
    //         var all_items = this.length,
    //             queryable_items = this.where({queryable: true}).length,
    //             compare = queryable_items / all_items;

    //         if (compare == 0){
    //           return 'none_queryable'
    //         }else if (compare == 1){
    //           return 'all_queryable'
    //         }else{
    //           return 'some_querable'
    //         };
    //       },

    //       getLimitedByParents: function(){
    //         var that = this;
    //         var json = that.toJSON(),
    //             names_to_queryableify = [],
    //             names_to_unqueryableify = [],
    //             models_to_queryableify = [],
    //             models_to_unqueryableify = [];

    //         // Get each model
    //         _.each(json, function(model){
    //           var type_parents = model.type_parents;

    //           // For each of its parents, it needs at least one in all of its categories.
    //           // So, if it had one in account, two in transaction_type and one in is_total
    //           // It would need at least three `true`s for it to be visible
    //           // It other words, it needs a yes from each column.
    //           var results = []
    //           _.each(type_parents, function(required_parents, column_name, list){
    //             var column_active_parents = active_parents[column_name];
    //             var overlap = _.intersection(column_active_parents, required_parents);
    //             if (overlap.length > 0){
    //               results.push(0);
    //             }else{
    //               results.push(1);
    //             };
    //           });
    //           var sum_results = _.reduce(results, function(memo, num){ return memo + num; }, 0);

    //           if (sum_results > 0){
    //            // Fail
    //            names_to_unqueryableify.push(model.value)
    //           }else{
    //            // Pass
    //            names_to_queryableify.push(model.value)
    //           };

    //         });
            

    //         _.each(names_to_queryableify, function(name){
    //           models_to_queryableify.push(that.where({ value: name }))
    //         });

    //         _.each(names_to_unqueryableify, function(name){
    //           models_to_unqueryableify.push(that.where({ value: name }))
    //         });

    //         return [models_to_queryableify, models_to_unqueryableify];
    //       },

    //       getQueryableAndChecked: function(){
    //         return this.where({queryable: true, checked: true});
    //       },

    //       getQueryableAndUnchecked: function(){
    //         return this.where({queryable: true, checked: false});
    //       },

    //     });

        
    //     // Fill that collection with the column values
    //     if (t2.columns[column_name].model == 'DateModel'){
    //       column_value_collections[column_name] = new column_value_collections[column_name]([
    //         new models.DateModel({ 
    //           table_name: 't2',
    //           column_name: 'date',
    //           comparinator: '>',
    //           value: t2.columns[column_name].date_range[0],
    //           checked: true
    //         }),
    //         new models.DateModel({ 
    //           table_name: 't2',
    //           column_name: 'date',
    //           comparinator: '<',
    //           value: t2.columns[column_name].date_range[1],
    //           checked: true
    //         })
    //       ]);
    //     }else if (t2.columns[column_name].model == 'TypeParentModel' || t2.columns[column_name].model == 'ItemModel'){

    //       var column_values = [];
    //       _.each(t2.columns[column_name].values, function(value){
    //          _.extend(value, {table_name: 't2', column_name: column_name, type: t2.columns[column_name].type });
    //          var column_value = new models[t2.columns[column_name].model](value);
    //          column_values.push(column_value);

    //       });

    //       column_value_collections[column_name] = new column_value_collections[column_name](column_values);

    //     }else if (t2.columns[column_name].model == 'IsTotalModel'){
    //       // Fill each collection with the information for that column, in this case two checkboxes, both selected, one 0 and one 1.
    //       column_value_collections[column_name] = new column_value_collections[column_name]([
    //         new models.IsTotalModel({ 
    //           table_name: 't2',
    //           column_name: 'is_total',
    //           value: 0,
    //           checked: true
    //         }),
    //         new models.IsTotalModel({ 
    //           table_name: 't2',
    //           column_name: 'is_total',
    //           value: 1,
    //           checked: true
    //         })
    //       ]);
    //     }else if (t2.columns[column_name].model == 'OutputNumberModel'){
    //       column_value_collections[column_name] = new column_value_collections[column_name]([
    //         new models.OutputNumberModel({ 
    //           table_name: 't2',
    //           column_name: column_name,
    //           comparinator: '>',
    //           value: t2.columns[column_name].values[0],
    //           checked: true
    //         }),
    //         new models.OutputNumberModel({ 
    //           table_name: 't2',
    //           column_name: column_name,
    //           comparinator: '<',
    //           value: t2.columns[column_name].values[1],
    //           checked: true
    //         })
    //       ]);
    //     }else{
    //       // console.log(t2.columns[column_name].model)
    //     }

    //   };
    // };


    /********** V I E W S ************/
    //This view turns a Column model into HTML. Will create DIV elements and a UL for the ItemView LIs to be appended to.
    var ColumnView = Backbone.View.extend({
        tagName : 'div',

        template: _.template($('#ColumnView-templ').html()),

        events: {
          'change .qc-select-all': 'checkUncheckAll'
        },

        initialize: function(){

          this.listenTo(this.model, 'change', this.render) 
          var model_data = this.model.toJSON();
          _.extend(model_data, formatHelpers);
          this.$el.html( this.template(model_data) );
        },

        render: function(){
          $(this.el).attr('id','qc-col-ctnr-' + this.model.get('name')).addClass('qc-col-ctnr');

          return this;
        },

        checkUncheckAll: function(e){
          var $checkbox = this.$el.find('.qc-select-all')
          var collection_name = $checkbox.data('collection-name');
          var checked_state = $checkbox.prop('checked');

          column_value_collections[collection_name].each(function(elem){
            elem.set('checked', checked_state);
          });



        }
    });

    var DatefieldView = Backbone.View.extend({
        tagName: 'li',

        template: _.template($('#OutputNumber-view-templ').html()),

        events:{
          'keyup': 'updateValue'
        },

        initialize: function(){

          // Set up event listeners. The change backbone event
          // is raised when a property changes (like the checked field)
          var model_data = this.model.toJSON();
          _.extend(model_data, formatHelpers);
          this.$el.html( this.template(model_data) );
          this.$el.addClass('query-checkbox-item').addClass('queryable-item');

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
            this.$el.show();
          }else{
            this.$el.hide();
          };

          return this;
        },

        updateValue: function(){
          var value = this.$el.find('input').val();
          this.model.updateValue(value);
        }
    });

    var DatefieldSelectorView = Backbone.View.extend({
        tagName: 'div',

        template: _.template($('#TextfieldSelector-view-templ').html()),

        events:{
          'change': 'toggleQueryable'
        },

        initialize: function(){

          // Set up event listeners. The change backbone event
          // is raised when a property changes (like the checked field)
          var model_data = this.model.toJSON();
          _.extend(model_data, formatHelpers);
          this.$el.html( this.template(model_data) );
          this.$el.addClass('query-checkbox-controller');

            this.listenTo(this.model, 'change', this.render);
        },

        render: function(){

          this.$el.find('input').prop('checked', this.model.get('queryable'));

          return this;
        },

        toggleQueryable: function(e){
          this.model.toggleQueryable();
        }
    });

    // This view turns an Value model into HTML. Will create LI elements.
    var CheckboxView = Backbone.View.extend({
        tagName: 'li',

        template: _.template($('#Checkbox-view-templ').html()),

        events:{
          'change': 'toggleItem',
          'mouseover .help-text-flag': 'showHelpText',
          'mouseleave .help-text-flag': 'hideHelpText'
        },

        initialize: function(){

          // Set up event listeners. The change backbone event
          // is raised when a property changes (like the checked field)
          // Create the HTML
          var model_data = this.model.toJSON();
          _.extend(model_data, formatHelpers);
          this.$el.html( this.template(model_data) );
          this.$el.addClass('queryable-item');

          this.listenTo(this.model, 'change', this.render);
        },

        render: function(){

          this.$el.find('input').prop('checked', this.model.get('checked'));

          if (this.model.get('queryable')){
            this.$el.show();
            this.$el.parents('.qc-col-ctnr').find('.qc-col-control-all input').prop('disabled', false)
          }else{
            this.$el.hide();
            var queryable_count = column_value_collections.item.getQueryableCount();
            if (queryable_count == 'none_queryable'){
              this.$el.parents('.qc-col-ctnr').find('.qc-col-control-all input').prop('disabled', true);
            };
          };

          // Make sure it stays alternating colors
          this.$el.parent().find('li:visible').filter(':even').css({'background-color': '#c1e4f2'});
          this.$el.parent().find('li:visible').filter(':odd').css({'background-color': '#fff'});          

          return this;
        },

        toggleItem: function(e){
          this.model.toggle();
        },

        toggleQueryable: function(e){
          this.model.toggleQueryable();
        },

        showHelpText: function(e){
          var $help_text = $(e.target),
              help_text = $help_text.data('help-text'),
              offset = $(e.target).offset(),
              offset_top = offset.top,
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

    var TypeParentCheckboxView = Backbone.View.extend({
        tagName: 'li',

        template: _.template($('#Checkbox-view-templ').html()),

        events:{
          'change': 'toggleItem',
          'mouseover .help-text-flag': 'showHelpText',
          'mouseleave .help-text-flag': 'hideHelpText'
        },

        initialize: function(){

          // Set up event listeners. The change backbone event
          // is raised when a property changes (like the checked field)
          // Create the HTML
          var model_data = this.model.toJSON();
          _.extend(model_data, formatHelpers);
          this.$el.html( this.template(model_data) );
          this.$el.addClass('queryable-item');
          this.listenTo(this.model, 'change', this.render);
        },

        render: function(){

          this.$el.find('input').prop('checked', this.model.get('checked'));
          this.setParentLimits();

          // console.log(active_parents)
          return this;
        },

        showHelpText: function(){
          console.log('here')
        },

        setParentLimits: function(){
          this.insertCheckedParents();
          this.setQueryablity();
        },

        insertCheckedParents: function(){
          active_parents = {}; // Clear everything
          _.each(column_value_collections, function(collection, column_name, collection_list){
            var model_type = t2.columns[column_name].model;
            if (model_type == 'TypeParentModel' || model_type == 'IsTotalModel'){
              // Make an empty array for this type_parent, but only if it doesn't already exist
              if (active_parents[column_name] == undefined){
                active_parents[column_name] = []
              };
              var checked_models = collection.getQueryableAndChecked();
              _.each(checked_models, function(elem){
                var name_to_add;
                if (elem.get('value') != '(blank)'){ // TODO handle blanks better
                  name_to_add = elem.get('value');
                }else{
                  name_to_add = null;
                };
                active_parents[column_name].push(name_to_add)
              });
            }
          });
        },

        setQueryablity: function(){
          _.each(column_value_collections, function(collection, column_name, collection_list){
            var model_type = t2.columns[column_name].model;
            if (model_type == 'ItemModel'){
              var models_to_alter = collection.getLimitedByParents(),
                  models_to_queryableify = models_to_alter[0],
                  models_to_unqueryableify = models_to_alter[1];


              _.each(models_to_queryableify, function(elem){
                elem[0].set('queryable', true);
              });
              _.each(models_to_unqueryableify, function(elem){
                elem[0].set('queryable', false);
              });
            };
          });
        },

        toggleItem: function(e){
          this.model.toggle();
        },

        toggleQueryable: function(e){
          this.model.toggleQueryable();
        },

        showHelpText: function(e){
          var $help_text = $(e.target),
              help_text = $help_text.data('help-text'),
              offset = $(e.target).offset(),
              offset_top = offset.top,
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

    var TextfieldView = Backbone.View.extend({
        tagName: 'li',

        template: _.template($('#OutputNumber-view-templ').html()),

        events:{
          'keyup': 'updateValue'
        },

        initialize: function(){

          var model_data = this.model.toJSON();
          _.extend(model_data, formatHelpers);
          this.$el.html( this.template(model_data) );
          this.$el.addClass('query-checkbox-item').addClass('queryable-item');

          this.$el.find('input').val( this.model.get('value') );
          this.listenTo(this.model, 'change', this.render);
        },

        render: function(){


          if (this.model.get('queryable')){
            this.$el.show();
          }else{
            this.$el.hide();
          };

          return this;
        },

        updateValue: function(){
          var value = this.$el.find('input').val();
          this.model.updateValue(value);
        }
    });

    var TextfieldSelectorView = Backbone.View.extend({
        tagName: 'div',

        template: _.template($('#TextfieldSelector-view-templ').html()),

        events:{
          'change': 'toggleQueryable'
        },

        initialize: function(){

          // Set up event listeners. The change backbone event
          // is raised when a property changes (like the checked field)
          var model_data = this.model.toJSON();
          _.extend(model_data, formatHelpers);
          this.$el.html( this.template(model_data) );
          this.$el.addClass('query-checkbox-controller');

          this.listenTo(this.model, 'change', this.render);
        },

        render: function(){
          this.$el.find('input').prop('checked', this.model.get('checked'));

          return this;
        },

        toggleQueryable: function(e){

          // e.preventDefault();
          this.model.toggleQueryable();
        }
    });


    // var ColumnView = Backbone.View.extend({    
    //     initialize: function(){
    //      var attrs = this.model.toJSON(),
    //          items_values = this.model.item_values.toJSON();
                      
    //      console.log(attrs, items_values);
    //     }
    // });

    // var App = Backbone.View.extend({
    //     el: '#hey',
        
    //     initialize: function(){
    //         var column_view = new ColumnView({model: column})   
    //     }
    // });

    // new App();


    /********** A P P  V I E W ************/
    // The main view of the application
    var App = Backbone.View.extend({

        // Base the view on an existing element
        el: '#qb-table-builders',

        initialize: function(){

          var that = this;
          // Listen for the change event on the collection.
          // This is equivalent to listening on every one of the 
          // items objects in the collection.
          console.log(column_collections)
          _.each(column_collections, function(collection, collection_name, collections){
            // that.listenTo(collection, 'change', this.render);

            console.log(collection)
            collection.each( function(column_data){
              var column_view = new ColumnView( {model: column_data} );
              that.$el.append(column_view.render().el);
            })
          });

          /*for (var collection_name in column_collections){
            if ( _.has(column_collections, collection_name)){
              this.listenTo(column_collections[collection_name], 'change', this.render);
              // this.listenTo(column_value_collections[collection_name], 'change', this.render);

              // Create views for every one of the items in the column collection

              column_collections[collection_name].each( function(column){
                var column_view = new ColumnView({model: column});
                that.$el.append(column_view.render().el)
              }, that); // "that" is the context in the callback

              // // Create views for all of the items
              column_value_collections[collection_name].each(function(item){
                var model_type = t2.columns[collection_name].model,
                    item_value_view,
                    controller_view;

                // TODO Make these into an object that you can access via a naming convention
                if (model_type != 'OutputNumberModel' && model_type != 'DateModel' ){
                  if (model_type == 'TypeParentModel' || model_type == 'IsTotalModel'){
                    item_value_view = new TypeParentCheckboxView({ model: item });
                  }else{
                    item_value_view = new CheckboxView({ model: item });
                  }
                }else{
                  if (model_type == 'OutputNumberModel'){
                    item_value_view = new TextfieldView({ model: item });
                    controller_view = new TextfieldSelectorView({ model: item });
                  }else{
                    item_value_view = new DatefieldView({ model: item });
                    controller_view = new DatefieldSelectorView({ model: item });
                  }
                  $('#qc-col-ctnr-' + collection_name).find('.qc-col-controls').append(controller_view.render().el);
                }

                $('#qc-col-ctnr-' + collection_name).find('ul.qc-values-ctnr').append(item_value_view.render().el);
              }, that); // "that" is the context in the callback
            };
          };
          */

        },

        render: function(){
          // BUILD JSON OBJECT FOR SQL STRING
          var filter_json = buildQueryJson(column_value_collections);
          var sql_string = JsonToSql(filter_json);

          loadUiWithSqlString(sql_string)

          return this;
        }
    });

    

    new App();

  };

  function loadUiWithSqlString(sql_string){
    if (encoding == 'true'){
      sql_string = encodeURI(sql_string);
    };

    $sql_query_textarea.val(sql_string);
    $sql_query_textarea.autogrow();
    loadBtnAttrsWithQueryLink(sql_string);
    enableBuilderBtnsAndChartOptions();
  };

  function JsonToSql(filters){
    var where_string = buildWhereQuery(filters),
        select_string = buildSelectQuery(filters),
        query = select_string + '\n' + where_string;

    return query
  };

  function buildSelectQuery(filters){
    var select_string = 'SELECT *\nFROM\nt2'
    return select_string
  };

  function buildWhereQuery(filters){
    // TODO, omit if there are no values
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

  };

  function wrapElsWithParens(arr){
    return _.map(arr, function(el){ return '(' + el + ')' });
  };

  function quoteValIfString(val){
    if ( isNaN(Number(val)) ){
      return "'" + val + "'";
    }else{
      return val;
    };
  };

  function buildQueryJson(column_value_collections){
    var queryable_models,
        checked_models,
        column_obj = {},
        filters = []; // The structure of this object will be an array of objects that are arrays of objects.

        /*  var filters = [
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


    // Loop through every collection
    for (var collection_name in column_value_collections){
      if ( _.has(column_value_collections, collection_name)){
        // For every column...
        // TODO: ADD `IF COLLECTION (column) IS QUERYABLE`
        column_obj = {};

        var cmpr = '=',
            majority_status,
            add_model = true;

        column_obj[collection_name] = [];

        // We only want to include queryable items
        if (collection_name != 'item'){
          queryable_models = column_value_collections[collection_name].getQueryableAndChecked();
        }else{
          majority_status = column_value_collections[collection_name].getCheckedCountAndQueryable();
          if (majority_status == 'majority_checked'){ // If the majority of them are checked, then it's easier to only do a WHERE clause on the excluded items
            cmpr = '!='
            queryable_models = column_value_collections[collection_name].getQueryableAndUnchecked();
          }else if (majority_status == 'majority_unchecked') {
            queryable_models = column_value_collections[collection_name].getQueryableAndChecked();
          }else if(majority_status == 'all_none'){
            add_model = false;
            // Don't include any of this column's info if all of them are selected or none are selected
            // So don't addModels to nuthin'

          };
        };

        if (add_model){
          _.each(queryable_models, function(elem, ind){
            var value_obj = {};
            value_obj['value'] = elem.get('value');

            if (elem.get('comparinator') == '='){
             value_obj['comparinator'] = cmpr;
            }else{
              value_obj['comparinator'] = elem.get('comparinator');
            };

            column_obj[collection_name].push(value_obj);
          });

          filters.push(column_obj);
        };
      };
    };
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
