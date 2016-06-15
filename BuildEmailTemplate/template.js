exports.compile = function (tags, template) {
  "use strict";
  console.log("Template Body: " + template);

  // Perform the substitutions
  var mark = require('markup-js');

  var message = mark.up(template, tags);
  console.log("Final message: " + message);
  return message;
}
