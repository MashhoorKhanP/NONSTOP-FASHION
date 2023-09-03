$(document).on("click", ".offerProductBtn", function () {
    var cId = $(this).data('id');
    $("#offerProductId").val(cId);
});
