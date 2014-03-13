var mycookie = '_ga=GA1.2.188652600.1391760811; _xsrf=62f8059dc36f45399c3b54f4dd10f2a4; q_c1=591380ddf13d4e32969aafc159a80535|1393995351000|1388490028000; q_c0="ODFkYTJlYWQwMjgyOGE1MzBjODFiNmIzN2UwZWE5MGJ8OUYxbTlyYm9nZkVxeEtjZg==|1393995351|2e6eaaf42a04c46ed1583da39856cbc90bc6707b"; zata=zhihu.com.591380ddf13d4e32969aafc159a80535.265460; zatb=zhihu.com; __utma=51854390.188652600.1391760811.1394092620.1394165505.10; __utmb=51854390.3.9.1394165505; __utmc=51854390; __utmz=51854390.1394101585.5.4.utmcsr=weibo|utmccn=share_button|utmcmd=weibo_share|utmcct=share_answer; __utmv=51854390.100-1|2=registration_date=20120225=1^3=entry_date=20120225=1';

// getQuestion >> getAgree >> getGender;
var http = require('http');
var result; // array
var callback; // fun
var Counter; // num
var getQuestion = function (questionID) {
    var option = {
        host   : 'www.zhihu.com',
        path   : '/question/' + questionID,
        headers: {
            Cookie: mycookie
        }
    };

    var req = http.request(option, function (res) {
        var data = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            var arrAns = data.match(/data-aid(.|\n|\r|\t)*?data-score="\d*\.\d*"/g); //正则回答
            var arrAuth = data.match(/<h3 class="zm-item-answer-author-wrap"(.|\n|\r|\t)*?<\/h3>/g); //正则作者
            Counter = arrAns.length;

            console.log('loading...');

            for (var i = 0, l = arrAns.length; i < l; i++) {
                var id = getAnswerID(arrAns[i]);
                var score = getScore(arrAns[i]).toFixed(3);

                var author;
                if (arrAuth[i].indexOf('href="/people/') >= 0) {
                    // 获得回答作者名字
                    author = arrAuth[i].match(/href="\/people.*?<\/a>/)[0].replace(/href="\/people.*?">|<\/a>/g, '');
                } else {
                    author = '匿名用户';
                }

                new CreateSingleStat(id, author, score);
            }

        });
    });

    req.end();
};


var getAnswerID = function (str) {
    return str.match(/\d+/)[0];
};
var getScore = function (str) {
    return str.match(/data-score="\d*\.\d*"/)[0].replace(/data-score="|"/g, '') - 0;
};

var CreateSingleStat = function (answerID, answerAuthor, answerScore) {
    // 单个回答对象
    this.ID = answerID;
    this.Male = 0;
    this.Female = 0;
    this.reqCount = 0;
    this.Anonymous = 0;
    this.Author = answerAuthor;
    this.Score = answerScore;
    this.getAgree = getAgree;
    this.getGender = getGender;
    this.getAgree();
};

var CreateSingleStat2 = function (answerID) {
    // 单个回答对象
    this.ID = answerID;
    this.Male = 0;
    this.Female = 0;
    this.reqCount = 0;
    this.Anonymous = 0;
    this.getAgree = getAgree;
    this.getGender = getGender;
    this.getAgree();
};

var getAgree = function () {
    var self = this;
    // 取得赞同者
    var option = {
        host   : 'www.zhihu.com',
        path   : '/node/AnswerFullVoteInfoV2?params=%7B%22answer_id%22%3A%22' + self.ID + '%22%7D',
        headers: {
            Cookie: mycookie
        }
    };
    var req = http.request(option, function (res) {
        var data = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            var arr = data.match(/href=".*?"/g);
            var noname = data.match(/匿名用户|知乎用户/g);
            if (!data || !arr) {
                //没有人赞同的回答
                Counter--; //如果是直接爬回答，那么该回答不会是个没人赞同的回答
//                result.push(self);
                return;
            }
            if (!!noname) {
                self.Anonymous = noname.length;
            }

            self.reqCount = arr.length;
            for (var i = 0, l = arr.length; i < l; i++) {
                self.getGender(arr[i].replace(/href="\/people\/|"/g, ''));
            }
        });
    });
    req.end();
};

var getGender = function (name) {
    var self = this;
    // 取得赞同者性别
    var option = {
        host   : 'www.zhihu.com',
        path   : '/node/MemberProfileCardV2?params=%7B%22url_token%22%3A%22' + name + '%22%7D',
        headers: {
            Cookie: mycookie
        }
    };
    var req = http.request(option, function (res) {
        var data = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            self.reqCount--;
            if (data.indexOf('<i class="zg-icon female"></i>') >= 0) {
                self.Female++;
            } else {
                self.Male++;
            }
            if (self.reqCount === 0) {
                Counter--;
//                delete self.reqCount;
//                delete self.getAgree;
//                delete self.getGender;
                self.FemalPercent = (self.Female / (self.Male + self.Female + self.Anonymous)).toFixed(3);
                result.push({
                    ID: self.ID,
                    Male: self.Male,
                    Female: self.Female,
                    Anonymous: self.Anonymous,
                    FemalPercent: self.FemalPercent
                });
                if (Counter == 0) {
                    callback(result);
                    console.timeEnd('running time');
                }
            }
        });
    });
    req.end();
};

exports.countQuestion = function(){
    console.time('running time');
    result = [];
    Counter = 0;
    getQuestion(arguments[0]);
    callback = arguments[1];
};

exports.countSingleAnswer = function(){
    console.time('running time');
    result = [];
    Counter = 1;
    CreateSingleStat2(arguments[0]);
    callback = arguments[1];
};