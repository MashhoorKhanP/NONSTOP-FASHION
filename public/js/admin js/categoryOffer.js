$(document).on("click", ".popupBTN", function () {
  var cId = $(this).data('id');
  var cVal = $(this).data('val');
  $(".modal-body #catID").val(cId);
  $(".modal-body #categoryName").val(cVal);
});
$(document).on("click", ".offerBtn", function () {
  var cId = $(this).data('id');
  $("#offerCategoryId").val(cId);
});
