function openDialog(selector) {
  var dialog = document.querySelector(selector);
  dialog.showModal();
}

function closeDialog(selector) {
    var dialog = document.querySelector(selector);
    dialog.close();
}