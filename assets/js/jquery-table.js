(function () {
    __data = {};
    /**
     * 
     * @param {object} settings
     * @returns {jQuery.fn}
     * @todo Parse existing table data
     * @todo Search existing/given data
     * @todo order exisiting/given data
     */
    jQuery.fn.table = function (settings) {
        var config = {
            columns: [],
            data: [],
            ajax: null,
            append: false,
            limits: {values: [10, 20, 50, 100, 200], all: true, default: 10},
            searchable: true,
            label: true,
            pagination: {
                firstLast: false,
                nextPrevious: true,
                numbers: false,
                maxButtons: 12
            },
            loading_message: 'Loading table...',
            display_errors: false,
            log_errors: true,
            log_data: false,
            alert_errors: true,
            customizeRow: function (row, data) {
            }
        };
        $.extend(config, settings);
        function addOrders(id) {
            $.each($('#' + id + '>table>thead>tr>th'), function (i, v) {
                if (config.columns[i].sortable === false)
                    return true;
                $(v).append('<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>');
                $(this).addClass('sort').attr('title', 'Click to sort')
                        .data('colName', config.columns[i].data);
            });
        }
        function createLimit(id) {
            if (!config.limits)
                return;
            else if (!config.limits.values) {
                console.error('Limits must have values of array values');
                return;
            }
            $select = $('#' + id + '>.before-table').append('<label>Show <select class="limit" /></label> entries')
                    .find('select.limit');
            $.each(config.limits.values, function (i, v) {
                var selected = (v == config.limits.default) ? 'selected="selected"' : '';
                $select.append('<option ' + selected + ' value="' + v + '">' + v + '</option>');
            });
            if (config.limits.all)
                $select.append('<option ' + (('all' == config.limits.default) ? 'selected="selected"' : '')
                        + ' value="">All</option>');
        }
        function createSearch(id) {
            if (!config.searchable)
                return;
            $('#' + id + '>.before-table').append('<label class="search">Search <input type="search" /></label>');
        }
        function createLabel(id, data) {
            $('#' + id + '>.after-table>.label').remove();
            if (!config.label)
                return;
            var showing = data.start + getLimit(id);
            if (!showing || showing > data.total)
                showing = data.total;
            $('#' + id + '>.after-table').append('<div class="label">Showing'
                    + ' <span class="start">' + (data.start + 1) + '</span>'
                    + ' to <span class="showing">' + showing + '</span>'
                    + ' of <span class="total">' + data.total + '</span> entries</div>');
        }
        function createPagination(id, data) {
            var page = parseInt((__data[id].start && !isNaN(getLimit(id))) ?
                    (__data[id].start / getLimit(id)) + 1 : 1);
            __data[id]['page'] = page;
            __data[id].start = (page * getLimit(id)) - (getLimit(id) - 1);
            __data[id].start--;
            if (__data[id].start < 0)
                __data[id].start = 0;
            $('#' + id + '>.after-table>.pagination').remove();
            if (!config.pagination)
                return;
            if (typeof config.pagination === 'boolean' || config.append)
                config.pagination = {
                    firstLast: false,
                    nextPrevious: true,
                    numbers: false,
                    maxButtons: 12
                };
            var nextBtns = '', prevBtns = '', numberBtns = '', maxBtns = config.pagination.maxButtons;
            if (!maxBtns || maxBtns < 12)
                maxBtns = 12;
            if (config.pagination.nextPrevious) {
                prevBtns = '<button ' + (data.start === 0 ? 'disabled="disabled"' : '')
                        + ' class="next ' + (data.start === 0 ? 'disabled' : '')
                        + '">&larr; Previous</button>';
                nextBtns = '<button ' + (isNaN(getLimit(id)) || (data.start + getLimit(id)) >= data.total ? 'disabled="disabled"' : '')
                        + ' class="next ' + (isNaN(getLimit(id)) || (data.start + getLimit(id)) >= data.total ? 'disabled' : '')
                        + '">Next &rarr;</button>';
                maxBtns -= 2;
            }
            if (config.pagination.firstLast) {
                prevBtns = '<button ' + (data.start === 0 ? 'disabled="disabled"' : '')
                        + ' class="first ' + (data.start === 0 ? 'disabled' : '')
                        + '">&larrb; First</button>' + prevBtns;
                nextBtns += '<button ' + (isNaN(getLimit(id)) || (data.start + getLimit(id)) >= data.total ? 'disabled="disabled"' : '')
                        + ' class="last ' + (isNaN(getLimit(id)) || (data.start + getLimit(id)) >= data.total ? 'disabled' : '')
                        + '">Last &rarrb;</button>';
                maxBtns -= 2;
            }
            if (config.pagination.numbers && maxBtns) {
                var totalPages = Math.ceil(data.total / getLimit(id)),
                        allBtns = totalPages > maxBtns ? maxBtns : totalPages;
                var div2 = Math.floor(allBtns / 2),
                        mGrp = Math.floor(div2 / 3), // middle group
                        fGrp = div2 - mGrp, // first group
                        lGrp = fGrp, // last group
                        next = 1,
                        mid = page;
                if (page <= fGrp * 2 - mGrp) {// no fGrp if page is in fGrp
//                    mGrp += fGrp;
//                    mid = totalPages;
                    fGrp = false;
                }
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
            $('#' + id + '>.after-table').append('<div class="pagination">' + prevBtns + numberBtns + nextBtns + '</div>');
        }
        function loadData(id) {
            var data = __data[id];
            if (!data.total)
                return;
            createPagination(id, data);
            createLabel(id, data);
            $table = $('#' + id + '>table');
            if (!$table.children('tbody').is('tbody'))
                $table.append('<tbody />');
            $tbody = $table.children('tbody');
            if (!config.append)
                $tbody.html('');
            $.each(data.data, function (i, v) {
                if (!config.ajax) {
                    if (data.start && i < data.start)
                        return true;
                    if (data.total >= data.data.length && i === (getLimit(id) + data.start))
                        return false;
                }
                $tr = $tbody.append('<tr />').find('tr:last-child');
                if ($.isPlainObject(v) && config.columns.length) {
                    $.each(config.columns, function (i, j) {
                        $tr.append('<td>' + v[j.data] + '</td>');
                    });
                    return true;
                }
                if (typeof v == 'object') {
                    $.each(v, function (i, v) {
                        $tr.append('<td>' + v + '</td>');
                    });
                }
                else {
                    error(id, 'T4', 'DATA.data[' + (i + 1) + '] must be either an array or an object');
                }
                if (typeof config.customizeRow === 'function')
                    config.customizeRow.call($('#' + id + '>table')[0], $tr[0], v);
            });
        }
        function error(id, code, msg) {
            msg = 'ERROR ' + code + ' (https://github.com/ezra-obiwale/JQuery-Table/errors/' + code + '):\r'
                    + '  -  ' + msg;
            if (config.log_errors)
                console.error(msg);
            if (config.display_errors)
                $('#' + id + '>.msg').addClass('error active').html(msg).fadeIn();
            if (config.alert_errors)
                alert(msg);
        }
        function getLimit(id) {
            return parseInt($('#' + id + '>.before-table select.limit').val());
        }
        function fetchData(id) {
            $('#' + id + '>table>tbody').html('');
            if (!config.ajax && __data[id] && __data[id].data.length > getLimit(id)) {
                loadData(id);
                return;
            } else if (!config.ajax)
                return;
            $('#' + id + '>.msg').addClass('info').html(config.loading_message).fadeIn(function () {
                if ($(this).hasClass('active'))
                    $(this).fadeOut();
            }).fadeOut(function () {
                if ($(this).hasClass('active'))
                    $(this).fadeIn();
            }).addClass('active').fadeIn();
            if (typeof config.ajax === 'string') {
                config.ajax = {
                    url: config.ajax,
                    type: 'get'
                };
            } else if ($.isPlainObject(config.ajax) && !config.ajax.type)
                config.ajax.type = 'get';
            var url = config.ajax.url, data = {}, limit = getLimit(id);
            if (config.ajax.type.toLowerCase() === 'get') {
                url += '?search=' + encodeURIComponent($('#' + id + '>.before-table>label.search>input').val())
                        + '&limit=' + (limit ? limit : '') + '&start=' + (__data[id] ? __data[id].start : 0);
                if (__data[id] && __data[id].sort)
                    url += '&sort[column]=' + __data[id].sort.column + '&sort[dir]=' + __data[id].sort.dir;
            } else {
                data = {
                    search: encodeURIComponent($('#' + id + '>.before-table>label.search>input').val()),
                    limit: limit ? limit : '',
                    start: __data[id].start
                };
                if (__data[id] && __data[id].sort)
                    data.sort = __data[id].sort;
            }
            $.ajax({
                url: url,
                data: data,
                type: config.ajax.type,
                success: function (data) {
                    if (config.log_data)
                        console.info('RESPONSE', data);
                    if (typeof data === 'string')
                        data = $.parseJSON(data);
                    $('#' + id + '>.msg').html('');
                    useData(id, data);
                },
                complete: function () {
                    $('#' + id + '>.msg').removeClass('active info');
                }
            });
        }
        function useData(id, data) {
            if (!__data[id])
                __data[id] = {};
            if ($.isArray(data)) {
                __data[id].data = data;
                __data[id].start = 0;
                __data[id].total = data.length;
            }
            else if ($.isPlainObject(data))
                if (!$.isArray(data.data)) {
                    error(id, 'T3', 'Response data must be an array');
                    return false;
                }
                else if (isNaN(data.total)) {
                    error(id, 'T2', 'Response object must contain key <total> with an <integer value>');
                    return false;
                }
                else if (isNaN(data.start)) {
                    error(id, 'T2', 'Response object must contain key <start> with an <integer value>');
                    return false;
                }
                else {
                    __data[id].data = data.data;
                    __data[id].start = data.start;
                    __data[id].total = data.total;
                }
            else {
                error(id, 'T1', 'Response data must be an object');
                return false;
            }
            __data[id].timeout = 0;
            loadData(id);
        }
        this.each(function (i, v) {
            var id = 'table_' + i;
            $(v).wrap('<div id="' + id + '" class="jq-table" />');
            $('#' + id).prepend('<div class="before-table" />');
            $('#' + id).append('<div class="msg" />');
            $('#' + id).append('<div class="after-table" />');
            addOrders(id);
            createLimit(id);
            createSearch(id);
            if (config.ajax)
                fetchData(id);
            else
                useData(id, config.data);
        });
        $(document).ready(function () {
            $('body').on('change', '.jq-table>.before-table select.limit', function () {
                fetchData($(this).closest('.jq-table').attr('id'));
            });
            $('body').on('click', '.jq-table>table>thead>tr>th.sort', function () {
                var id = $(this).closest('.jq-table').attr('id');
                $(this).siblings().removeClass('asc desc');
                __data[id].sort = {
                    column: $(this).data('colName')
                };
                if ($(this).hasClass('asc')) {
                    __data[id].sort['dir'] = 'desc';
                    $(this).removeClass('asc').addClass('desc');
                } else {
                    __data[id].sort['dir'] = 'asc';
                    $(this).removeClass('desc').addClass('asc');
                }
                fetchData(id);
            });
            $('body').on('click', '.jq-table>.after-table>.pagination>button', function () {
                if ($(this).hasClass('disabled'))
                    return;
                var id = $(this).closest('.jq-table').attr('id');
                if ($(this).html().indexOf('First') !== -1)
                    __data[id].start = 0;
                else if ($(this).html().indexOf('Last') !== -1) {
                    __data[id].start = Math.floor(__data[id].total / getLimit(id));
                    if (__data[id].start * getLimit(id) >= __data[id].total)
                        __data[id].start--;
                    __data[id].start *= getLimit(id);
                } else if ($(this).html().indexOf('Next') !== -1)
                    __data[id].start += getLimit(id);
                else if ($(this).html().indexOf('Previous') !== -1)
                    __data[id].start -= getLimit(id);
                else
                    __data[id].start = (parseInt($(this).text()) - 1) * getLimit(id);
                fetchData(id);
            });
            $('body').on('keyup', '.jq-table>.before-table .search>input', function () {
                var id = $(this).closest('.jq-table').attr('id');
                clearTimeout(__data[id].timeout);
                __data[id].timeout = setTimeout(fetchData, 500, id);
            });
        });
        return this;
    };
})(jQuery);