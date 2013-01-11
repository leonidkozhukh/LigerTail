$(document).ready(function() {
    $('#payFormSwitch').facebox();

    var $ratePrices = $('#ratePrices');
    $('#ratePrices .row').mouseover(function() {
        if ($(this).hasClass('row-active'))
            return;

        $(this).addClass('row-hover');
    });

    $('#ratePrices .row').mouseout(function() {
        if ($(this).hasClass('row-active'))
            return;

        $(this).removeClass('row-hover');
    });
});