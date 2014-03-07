/*
 * GET home page.
 */
var zhihu = require('../public/javascripts/zhihu.js');
exports.index = function (req, res) {
    res.render('index', {});
};

exports.hello = function (req, res) {
    zhihu(req.body.ID, function(obj){
        res.send(JSON.stringify(obj));
    });
//    res.send(JSON.stringify(d));
}