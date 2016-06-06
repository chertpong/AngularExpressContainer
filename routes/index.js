var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
  return  res.sendFile(path.resolve(__dirname,'..','public','app','index.html'));
});

module.exports = router;
