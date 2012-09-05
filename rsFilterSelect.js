/**
 * User: Roman Suprotkin
 * Date: 2012-08-23
 * Time: 22:20
 */
 
//TODO: Catch non filter parameters 
 
var jQuery = django.jQuery;
var $ = jQuery;
var emptyValue = '__empty_value__';
var djangoQSFilters = '__(exact|isnull)';
var reDjangoQSFilters = new RegExp(djangoQSFilters, '');
var reID = new RegExp(djangoQSFilters+'=[A-z0-9]*');
var queryHash = {};
var queryVars = {};

var _splitUri = (function() {
    var splitRegExp = new RegExp(
        '^' +
            '(?:' +
            '([^:/?#.]+)' +                         // scheme - ignore special characters
                                                    // used by other URL parts such as :,
                                                    // ?, /, #, and .
            ':)?' +
            '(?://' +
            '(?:([^/?#]*)@)?' +                     // userInfo
            '([\\w\\d\\-\\u0100-\\uffff.%]*)' +     // domain - restrict to letters,
                                                    // digits, dashes, dots, percent
                                                    // escapes, and unicode characters.
            '(?::([0-9]+))?' +                      // port
            ')?' +
            '([^?#]+)?' +                           // path
            '(?:\\?([^#]*))?' +                     // query
            '(?:#(.*))?' +                          // fragment
            '$');

    return function (uri) {
        var split;
        split = uri.match(splitRegExp);
        return {
            'scheme':split[1],
            'user_info':split[2],
            'domain':split[3],
            'port':split[4],
            'path':split[5],
            'query_data': split[6],
            'fragment':split[7]
        }
    }; })();

var vars;

function normalizeValue ( value ) {
    return value.replace(reDjangoQSFilters, '').replace('=', '')
}

jQuery.fn.filterSelect = function() {
    var form = $(document.createElement('form'))
        .attr('id', 'filterForm')
        .attr('method', 'get')
        .attr('action', '.')
        .appendTo(this.parent());
    
    this.appendTo(form);
    $(document.createElement('input'))
        .val(gettext("to filter"))
        .attr('type', 'button')
        .addClass('capitalize')
        .attr('id', 'submitFilters')
        .appendTo(this)
        .click(function(){
            var formValues = '';
            $('#filterForm select').each(function() {
                var value = $(this).val(); 
                if ( value != emptyValue )
                    formValues += '&' + this.id + value;
            });
            location.href = form.attr('action') + '?' + formValues.slice(1);
            return false;
        });
    $(document.createElement('input'))
        .val(gettext("clear"))
        .attr('type', 'button')
        .addClass('capitalize')
        .attr('id', 'clearFilters')
        .appendTo(this)
        .click(function(){
            $('#filterForm select').each(function() {
                $(this).val(emptyValue).change();                 
            });
            
        });
    
    this.children('ul').each(function (){
        var $this = $(this);
        var $select = $(document.createElement('select'));
        var selectID = false;
        var emptyOption;
        var index = 0;
        $this.children('li').each(function(){
            var $a = $(this).children('a');
            var href = $a.attr('href');
            data = href.slice(1).split('&');
            var option = $(document.createElement('option'))
                .html($a.html()) 
                .appendTo($select);
            for (var i = 0; i < data.length; i++ ){
                if ( queryHash.hasOwnProperty(data[i])) {
                    data.splice(i, 1);
                    i--;
                }
            }
            value = data[0];
                
            if ( !value ) {
                value = emptyValue;
                if ( index ) emptyOption = option;
            } else {
                var modifier = reDjangoQSFilters.exec(value);
                var split;
                try {
                    split = value.split(modifier[0]); 
                    value = modifier[0] + split[1];   
                } catch(e){
                    if ( e instanceof TypeError ) {
                        split = value.split('=');
                        value = '='.concat(split[1]);
                    }
                    
                }
                
                
            
                if ( !selectID ) selectID = split[0];
            }
            option.val(value);
            if ( $(this).hasClass('selected') ) option.attr('selected', 'selected'); 
            index++;
        });
        if ( !!emptyOption ) emptyOption.val(queryVars[selectID]);
        $select.attr('id', selectID).attr('name', selectID);
        $this.after($select);
        $this.hide();
    });
    
}

jQuery(document).ready(function(){
    var data = _splitUri(location.href).query_data
    if ( !!data ) {
        data = data.split('&');
        for (var i = 0; i < data.length; i++) {
            var modifier = reDjangoQSFilters.exec(data[i]);
            if ( !!modifier ) {
                var split = data[i].split(modifier[0]);
                queryVars[split[0]] = modifier[0] + split[1];
            }
            queryHash[data[i]] = true;
        } 
    }
    $('#changelist-filter').filterSelect();
});
