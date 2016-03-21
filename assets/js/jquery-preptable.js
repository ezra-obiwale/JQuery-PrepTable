(function() {
    var __data = {length: 0}, __page_data = {};
    /**
     * Sort, paginate and search table
     * @param {object} settings
     * @returns {jQuery.fn}
     */
    jQuery.fn.prepTable = function(settings) {
	var config = {
	    columns: [],
	    data: [],
	    ajax: null,
	    append: false,
	    limits: {values: [10, 20, 50, 100, 200], all: true, default: 10},
	    searchable: true,
	    sortable: true,
	    label: true,
	    pagination: {
		firstLast: false,
		nextPrevious: true,
		numbers: false,
		maxButtons: 12
	    },
	    loading_message: 'Loading table...',
	    empty_message: 'NO ENTRIES FOUND.',
	    display_errors: false,
	    log_errors: true,
	    log_data: false,
	    alert_errors: true,
	    cache: false,
	    createDivs: true,
	    createRow: function(row, data, index) {
		if ($.isPlainObject(data) && config.columns.length) {
		    $.each(config.columns, function(i, v) {
			$(row).append('<td>' + data[v.data] + '</td>');
		    });
		}
		else if ($.isArray(data)) {
		    $.each(data, function(i, v) {
			$(row).append('<td>' + v + '</td>');
		    });
		}
		else {
		    error($(this).parent().attr('id'), 'T4', 'DATA.data['
			    + index + '] must be either an array or an object');
		}
	    }
	};
	$.extend(config, settings);
	function addOrders(id) {
	    if (__data[id].sortable === false || (__data[id].sortable == undefined && !config.sortable))
		return;
	    $.each($('#' + id + '>table>thead>tr>th'), function(i, v) {
		if ($(this).hasClass('no-sort') ||
			(config.columns[i] && config.columns[i].sortable === false))
		    return true;
		$(v).append('<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>');
		$(this).addClass('sort').attr('title', 'Click to order').data('pos', i);
		if (config.columns[i])
		    $(this).data('colName', config.columns[i].data);
	    });
	}
	function createLimit(id) {
	    var values = __data[id].limitsValues ?
		    __data[id].limitsValues.split(',') : config.limits.values,
		    defaults = __data[id].limitsDefault || config.limits.default;
	    if (!values) {
		console.error('Limits must have values of array values');
		return;
	    }
	    var $select = $('#' + id + ' .before-table').append('<label class="jq-limit">Show <select /> entries</label>')
		    .find('.jq-limit>select');
	    if (__data[id].limits === false || (__data[id].limits === undefined && !config.limits)) {
		$select.parent().css('display', 'none');
		defaults = 'all';
	    }
	    $.each(values, function(i, v) {
		var selected = (v == defaults) ? 'selected="selected"' : '';
		$select.append('<option ' + selected + ' value="' + v + '">' + v + '</option>');
	    });
	    if (__data[id].limitsAll || (__data[id].limitsAll !== false && config.limits.all))
		$select.append('<option ' + (('all' == defaults) ? 'selected="selected"' : '')
			+ ' value="">All</option>');
	}
	function createSearch(id) {
	    var $label = $('#' + id + ' .before-table').append('<label class="jq-search">Search <input type="text" /></label>')
		    .children('label.search');

	    if (__data[id].searchable === false || (__data[id].searchable === undefined && !config.searchable))
		$label.css('display', 'none');
	    $.each(config.columns, function(i, v) {
		if (v.searchable !== undefined && !v.searchable)
		    return true;
		if (!__data[id]['searchables'])
		    __data[id]['searchables'] = '';
		if (i)
		    __data[id].searchables += ',';
		__data[id].searchables += v.data;
	    });
	}
	function createLabel(id, data, domready) {
	    $('#' + id + ' .after-table>.jq-label').remove();
	    if (data.label === false || (data.label === undefined && !config.label) || !data.data.length)
		return;
	    var start = (data.start ? data.start * getLimit(id) + 1 : 1),
		    showing = start + getLimit(id) - 1;
	    if (!showing || showing > data.total)
		showing = data.total;

	    $('#' + id + ' .after-table').append('<div class="jq-label">Showing'
		    + ' <span class="start">' + (data.append ? 1 : start) + '</span>'
		    + ' to <span class="showing">' + (data.append && domready ?
			    $('#' + id + '>table>tbody>tr').length : showing) + '</span>'
		    + ' of <span class="total">' + data.total + '</span> entries</div>');
	}
	function createPagination(id, data) {
	    var page = data.start + 1;
	    $('#' + id + ' .after-table>.jq-pagination').remove();
	    if (data.pagination === false || !config.pagination || !data.data.length)
		return;
	    if (typeof config.pagination === 'boolean')
		config.pagination = {
		    firstLast: false,
		    nextPrevious: true,
		    numbers: false,
		    maxButtons: 12
		};

	    var start = data.start ? data.start * getLimit(id) : 0,
		    nextBtns = '', prevBtns = '', numberBtns = '',
		    maxBtns = data.paginationMaxButtons || config.pagination.maxButtons;
	    if (!maxBtns)
		maxBtns = 12;
	    if (data.paginationNextPrevious || (data.paginationNextPrevious !== false && config.pagination.nextPrevious)) {
		prevBtns = '<button ' + (start === 0 ? 'disabled="disabled"' : '')
			+ ' class="prev ' + (start === 0 ? 'disabled' : '')
			+ '">&larr; Previous</button>';
		nextBtns = '<button ' + (isNaN(getLimit(id)) || start + getLimit(id) >= data.total ? 'disabled="disabled"' : '')
			+ ' class="next ' + (isNaN(getLimit(id)) || start + getLimit(id) >= data.total ? 'disabled' : '')
			+ '">Next &rarr;</button>';
		maxBtns -= 2;
	    }
	    if (data.paginationFirstLast || (data.paginationFirstLast !== false && config.pagination.firstLast)) {
		prevBtns = '<button ' + (start === 0 ? 'disabled="disabled"' : '')
			+ ' class="first ' + (start === 0 ? 'disabled' : '')
			+ '">&larrb; First</button>' + prevBtns;
		nextBtns += '<button ' + (isNaN(getLimit(id)) || start + getLimit(id) >= data.total ? 'disabled="disabled"' : '')
			+ ' class="last ' + (isNaN(getLimit(id)) || start + getLimit(id) >= data.total ? 'disabled' : '')
			+ '">Last &rarrb;</button>';
		maxBtns -= 2;
	    }
	    if (data.paginationNumbers || (data.paginationNumbers !== false && config.pagination.numbers && maxBtns)) {
		if (maxBtns < 8)
		    maxBtns = 8;
		var totalPages = Math.ceil(data.total / getLimit(id)),
			allBtns = totalPages > maxBtns ? maxBtns : totalPages;
		var div2 = Math.floor(allBtns / 2),
			mGrp = Math.floor(div2 / 3), // middle group
			fGrp = div2 - mGrp, // first group
			lGrp = fGrp, // last group
			next = 1,
			mid = page;
		if (page <= fGrp * 2 - mGrp) // no fGrp if page is in fGrp
		    fGrp = false;
		else if (page >= totalPages - lGrp - mGrp + 1) { // no lGrp if page is in lGrp
		    mGrp += lGrp;
		    mid = totalPages;
		    lGrp = false;
		}
		for (var i = 1; i <= allBtns; i++) {
		    if (next > totalPages)
			break;
		    numberBtns += '<button id="_' + (i - 1) + '"';
		    if (next === page)
			numberBtns += ' class="current" disabled="disabled"';
		    numberBtns += '>' + next + '</button>';
		    var last = next;
		    next++;
		    if (totalPages !== allBtns && ((fGrp && i === fGrp) || (lGrp && i === allBtns - lGrp + 1))) {
			if (i === fGrp) { // first ellipsis added
			    // update next button
			    if (i > page) // already displayed page
				mid = Math.ceil(totalPages / 2);
			    next = mid - mGrp;
			} else { // second ellipsis added
			    next = totalPages - lGrp + 2;
			}
			if (next > last + 1)
			    numberBtns += '<span class="ellipsis">...</span>';
			if (next === last) // Can't have same button twice
			    next++;
		    }
		}
	    }
	    $('#' + id + ' .after-table').append('<div class="jq-pagination">' + prevBtns + numberBtns + nextBtns + '</div>');
	}
	function error(id, code, msg) {
	    msg = 'ERROR ' + code + ' (http://ezra-obiwale.github.io/JQuery-Table/#errors):\r'
		    + '  -  ' + msg;
	    if (__data[id].logErrors || (__data[id].logErrors !== false && config.log_errors))
		console.error(msg);
	    if (__data[id].displayErrors || (__data[id].displayErrors !== false && config.display_errors))
		$('#' + id + ' .jq-msg').addClass('error').html(msg);
	    if (__data[id].alertErrors || (__data[id].alertErrors !== false && config.alert_errors))
		alert(msg);
	}
	function getLimit(id) {
	    return parseInt($('#' + id + ' .before-table .jq-limit>select').val());
	}
	function parseTable(id) {
	    if (!__page_data[id])
		__page_data[id] = {};
	    __page_data[id]['rows'] = $('#' + id + '>table>tbody>tr');
	    __data[id].total = __page_data[id].rows.length;
	    if (getLimit(id) !== '') { // show limit
		$('#' + id + '>table>tbody>tr').each(function(i, v) {
		    if (i == getLimit(id))
			return false;
		    $(v).addClass('__showing');
		});
		$('#' + id + '>table>tbody>tr:not(.__showing)').detach();
		$('#' + id + '>table>tbody>tr').removeClass('__showing');
	    }
	    createLabel(id, $.extend({
		data: $('#' + id + '>table>tbody>tr'),
		total: __page_data[id]['rows'].length
	    }, __data[id]), true);
	    createPagination(id, $.extend({
		data: $('#' + id + '>table>tbody>tr'),
		total: __page_data[id]['rows'].length
	    }, __data[id]));
	}
	function loadDOMNext(id, start) {
	    var $tbody = $('#' + id + '>table>tbody'),
		    search = $('#' + id + ' .before-table .jq-search>input').val().toLowerCase(),
		    total = 0, shown = 0, skipped = 0;
	    $('#' + id + ' .jq-msg').addClass('info').hide();
	    if (__data[id].order && (!__page_data[id].order || __page_data[id].order
		    && (__data[id].order.index !== __page_data[id].order.index
			    || __data[id].order.dir !== __page_data[id].order.dir))) {
		sortData(id);
		__page_data[id].order = __data[id].order;
	    }
	    $.each(__page_data[id].rows, function(i, v) {
		if (search && $(v).text().toLowerCase().indexOf(search) == -1) { // searching but not found
		    return true;
		}
		else if (skipped < start) {
		    if (search)
			total++;
		    skipped++;
		    return true;
		}
		else if (getLimit(id) && shown === getLimit(id)) {
		    total++;
		    return (search);
		}
		$tbody.append(v);
		total++;
		shown++;
	    });
	    total = search ? total : __page_data[id]['rows'].length;
	    createLabel(id, $.extend({
		data: $('#' + id + '>table>tbody>tr'),
		total: total
	    }, __data[id]), true);
	    createPagination(id, $.extend({
		data: $('#' + id + '>table>tbody>tr'),
		total: total
	    }, __data[id]));
	    if (!$('#' + id + '>table>tbody>tr').length)
		$('#' + id + ' .jq-msg').addClass('info').removeClass('active')
			.html(__data[id].emptyMessage || config.empty_message).show();
	}
	function sortData(id) {
	    return __page_data[id].rows.sort(function(a, b) {
		var A = $(a).children('td').eq(__data[id].order.index).text().toUpperCase(),
			B = $(b).children('td').eq(__data[id].order.index).text().toUpperCase();
		if (A < B) {
		    return (__data[id].order.dir === 'desc') ? 1 : -1;
		} else {
		    return (__data[id].order.dir === 'desc') ? -1 : 1;
		}
		return 0;
	    });
	}
	function loadPage(id, start, append) {
	    if (!__data[id].append || !append)
		$('#' + id + '>table>tbody>tr:not(._' + (start + 1) + ')').remove();
	    if (__data[id].cache && __page_data[id] && __page_data[id][start]
		    && __page_data[id][start].limit == getLimit(id)) {
		if (append || !__data[id].append) {
		    $.extend(__data[id], __page_data[id][start]);
		    loadData(id);
		} else {
		    createLabel(id, __page_data[id][start], true);
		    createPagination(id, __page_data[id][start]);
		}
	    }
	    else {
		if (!append && __data[id].append) {
		    createLabel(id, __page_data[id][start], true);
		    createPagination(id, __page_data[id][start]);
		} else if (__page_data[id].rows)
		    loadDOMNext(id, getLimit(id) ? start * getLimit(id) : 0);
		else
		    fetchData(id);
	    }
	}
	function fetchData(id) {
	    if (__data[id] && !__data[id].ajax && __data[id].data.length > getLimit(id)) {
		loadData(id);
		return;
	    } else if (!__data[id].ajax)
		return;
	    $('#' + id + ' .jq-msg').addClass('info').html(__data[id].loadingMessage || config.loading_message).fadeIn();
	    var url = __data[id].ajax.url, data = {}, limit = getLimit(id);
	    if (__data[id].ajax.type.toLowerCase() === 'get') {
		url += '?search[columns]=' + encodeURIComponent(__data[id].searchables) + '&search[value]=' + encodeURIComponent($('#' + id + ' .before-table>label.search>input').val())
			+ '&limit=' + (!isNaN(limit) ? limit : '') + '&start=' + (!isNaN(limit) ? limit * __data[id].start : 0);
		if (__data[id].order)
		    url += '&order[column]=' + __data[id].order.column + '&order[dir]=' + __data[id].order.dir;
	    } else {
		data = {
		    search: {
			columns: __data[id].searchables,
			value: encodeURIComponent($('#' + id + ' .before-table>label.search>input').val())
		    },
		    limit: !isNaN(limit) ? limit : '',
		    start: !isNaN(limit) ? limit * __data[id].start : 0
		};
		if (__data[id].order)
		    data.order = __data[id].order;
	    }
	    $('#' + id + ' .after-table>.jq-label,#' + id + ' .after-table>.jq-pagination').remove();
	    $.ajax({
		url: url,
		data: data,
		type: __data[id].ajax.type,
		success: function(data) {
		    if (__data[id].logData || (__data[id].logData !== false && config.log_data))
			console.info('RESPONSE', data);
		    if (typeof data === 'string')
			data = $.parseJSON(data);
		    $('#' + id + ' .jq-msg').html('');
		    useData(id, data);
		    $('#' + id + ' .jq-msg').hide();
		},
		error: function(x) {
		    error(id, 'T0', 'Connection error: ' + x.responseText);
		}
	    });
	}
	function useData(id, data) {
	    if ($.isArray(data)) {
		__data[id].data = data;
		__data[id].start = 0;
		__data[id].total = data.length;
	    }
	    else if ($.isPlainObject(data))
		if (!$.isArray(data.data)) {
		    error(id, 'T3', 'Data in <Response> must be an array');
		    return false;
		}
		else if (isNaN(data.total)) {
		    error(id, 'T2', 'Response object must contain key <total> with an <integer value>');
		    return false;
		}
		else {
		    __data[id].data = data.data;
		    __data[id].total = data.total;
		}
	    else {
		error(id, 'T1', 'Response data must be an object');
		return false;
	    }
	    __data[id].timeout = 0;
	    __data[id].limit = getLimit(id);
	    loadData(id);
	}
	function loadData(id) {
	    var data = __data[id];
	    if (!data.data.length)
		$('#' + id + ' .jq-msg').addClass('info').removeClass('active')
			.html(__data[id].emptyMessage || config.empty_message);
	    if (!data.total)
		return;
	    if (!__page_data[id])
		__page_data[id] = {};
	    __page_data[id][data.start] = $.extend({}, data);
	    createPagination(id, data);
	    createLabel(id, data);
	    var $table = $('#' + id + '>table');
	    if (!$table.children('tbody').is('tbody'))
		$table.append('<tbody />');
	    var $tbody = $table.children('tbody');
	    if (!__data[id].append)
		$tbody.html('');
	    $.each(data.data, function(i, v) {
		if (!data.ajax) {
		    if (data.start && i < data.start)
			return true;
		    if (data.total >= data.data.length && i === (getLimit(id) || 0 + data.start))
			return false;
		}
		var $tr = $tbody.append('<tr />').find('tr:last-child');
		$tbody.children().addClass('_' + (__data[id].start + 1));
		if (data.createRow)
		    data.createRow.call($('#' + id + '>table')[0], $tr[0], v, i);
		else if (typeof config.createRow === 'function')
		    config.createRow.call($('#' + id + '>table')[0], $tr[0], v, i);
	    });
	}
	this.each(function(i, v) {
	    var id = 'table_' + __data.length;
	    __data.length++;
	    __data[id] = $.extend({}, $(v).data());
	    __data[id]['start'] = 0;
	    __data[id].config = config;
	    if (typeof __data[id].append !== 'boolean')
		__data[id]['append'] = config.append;
	    if (typeof __data[id].cache !== 'boolean')
		__data[id]['cache'] = config.cache;
	    $(v).wrap('<div id="' + id + '" class="jq-table" />');
	    if (__data[id].createDivs !== false || (__data[id].createDivs === undefined && config.createDivs)) {
		$('#' + id).prepend('<div class="before-table" />');
		$('#' + id).append('<div class="after-table"><div class="jq-msg"></div></div>');
	    }
	    else {
		if (!$(v).children('thead').length)
		    $(v).append('<thead/>');
		if (!$(v).children('tfoot').length)
		    $(v).append('<tfoot/>');
		var cols = $(v).children('thead').children('tr:first-child').children('th').length;
		$(v).children('thead').prepend('<tr><td class="before-table" colspan="' +
			(cols ? cols : 100) + '">&nbsp;</td></tr>');
		$(v).children('tfoot').append('<tr><td class="after-table" colspan="' +
			(cols ? cols : 100) + '"><div class="jq-msg"></div></td></tr>');
	    }
	    addOrders(id);
	    createLimit(id);
	    createSearch(id);
	    if ($(v).data('createRow')) {
		var func = $(v).data('createRow');
		if (window[func] && typeof window[func] === 'function') {
		    __data[id]['createRow'] = window[func];
		} else if (func.indexOf('.') != -1) {
		    var callback = window;
		    $.each(func.split('.'), function(i, v) {
			if (callback[v])
			    callback = callback[v];
			else
			    return false;
		    });
		    if (typeof callback === 'function')
			__data[id]['createRow'] = callback;
		}
	    }
	    if ($(v).data('ajaxUrl')) {
		__data[id]['ajax'] = {
		    url: $(v).data('ajaxUrl'),
		    type: $(v).data('ajaxType') ? $(v).data('ajaxType') : 'get'
		};
		fetchData(id);
	    }
	    else if (config.ajax) {
		if (typeof config.ajax === 'string')
		    __data[id]['ajax'] = {
			url: config.ajax,
			type: 'get'
		    };
		else if ($.isPlainObject(config.ajax) && !config.ajax.type) {
		    __data[id]['ajax'] = config.ajax;
		    __data[id].ajax['type'] = 'get';
		}
		fetchData(id);
	    }
	    else if (config.data.length)
		useData(id, config.data);
	    else {
		parseTable(id);
	    }

	    $(v).parent().on('change', '.before-table .jq-limit>select', function() {
		var id = $(this).closest('.jq-table').attr('id');
		// Ensure display of data if limit is going out of boundary
		if ($(this).val() && __data[id].start * parseInt($(this).val()) > __data[id].total)
		    __data[id].start = Math.floor(__data[id].total / parseInt($(this).val())) - 1;
		if (__data[id].append) {
		    __data[id].start = 0;
		    $('#' + id + '>table>tbody').html('');
		    __page_data[id] = {};
		}
		loadPage(id, __data[id].start, __data[id].append);
	    });
	    $(v).parent().on('click', 'table>thead>tr>th.sort', function() {
		var id = $(this).closest('.jq-table').attr('id');
		$(this).siblings().removeClass('asc desc');
		__data[id].order = {
		    index: $(this).index(),
		    column: $(this).data('colName')
		};
		if ($(this).hasClass('asc')) {
		    __data[id].order['dir'] = 'desc';
		    $(this).removeClass('asc').addClass('desc');
		} else {
		    __data[id].order['dir'] = 'asc';
		    $(this).removeClass('desc').addClass('asc');
		}
		console.log('click')
		loadPage(id, __data[id].start, __data[id].append);
	    });
	    $(v).parent().on('click', '.after-table>.jq-pagination>button', function() {
		if ($(this).hasClass('disabled'))
		    return;
		$(this).addClass('disabled');
		var id = $(this).closest('.jq-table').attr('id'), append = false;
		if ($(this).html().indexOf('First') !== -1) {
		    __data[id].start = 0;
		}
		else if ($(this).html().indexOf('Last') !== -1) {
		    __data[id].start = Math.floor(__data[id].total / getLimit(id));
		    if (__data[id].start * getLimit(id) >= __data[id].total)
			__data[id].start--;
		    append = true;
		}
		else if ($(this).html().indexOf('Next') !== -1) {
		    __data[id].start++;
		    append = true;
		}
		else if ($(this).html().indexOf('Previous') !== -1) {
		    if (__data[id].start > 0)
			__data[id].start--;
		}
		else {
		    var page = parseInt($(this).text());
		    if (page - 1 > __data[id].start) // fetching a previous page
			append = true;
		    __data[id].start = page - 1;
		}
		loadPage(id, __data[id].start, append);
	    });
	    $(v).parent().on('keyup', '.before-table .jq-search>input', function() {
		var id = $(this).closest('.jq-table').attr('id');
		clearTimeout(__data[id].timeout);
		__data[id].start = 0;
		__data[id].timeout = setTimeout(loadPage, 500, id, __data[id].start, __data[id].append);
	    });
	});
	return this;
    };
})(jQuery);