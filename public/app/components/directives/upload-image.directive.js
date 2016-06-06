(function(){
  angular
    .module('myApp')
    .directive("uploadImage", [function () {
      return {
        scope: {
          uploadImage: "="
        },
        link: function (scope, element, attributes) {
          element.bind("change", function (changeEvent) {
            var reader = new FileReader();
            scope.uploadImage = { result:null, file:changeEvent.target.files[0]};
            reader.onload = function (loadEvent) {
              scope.$apply(function () {
                scope.uploadImage.result = loadEvent.target.result;
              });
            };
            reader.readAsDataURL(changeEvent.target.files[0]);
          });
        }
      }
    }]);
})();