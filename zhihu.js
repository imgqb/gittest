var mycookie = '_xsrf=31db63af8fdb49118ef2246eb0ed53a2; q_c1=591380ddf13d4e32969aafc159a80535|1391344146000|1388490028000; q_c0="ODFkYTJlYWQwMjgyOGE1MzBjODFiNmIzN2UwZWE5MGJ8OUYxbTlyYm9nZkVxeEtjZg==|1391344169|ae881221835612588a60df7a64d5b18d610dd465"; _ga=GA1.2.188652600.1391760811; zata=zhihu.com.591380ddf13d4e32969aafc159a80535.797902; zatb=zhihu.com; __utma=51854390.42272649.1392359043.1392477288.1392531585.8; __utmb=51854390.50.9.1392535898367; __utmc=51854390; __utmz=51854390.1392128487.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); __utmv=51854390.100-1|2=registration_date=20120225=1^3=entry_date=20120225=1';


// getQuestion >> getAgree >> getGender;
var http = require('http');
var getQuestion = function(questionID){
    

    var option = {
        host : 'www.zhihu.com',
        path : '/question/'+questionID,
        headers : {
            Cookie : mycookie
        }
    }

    var req = http.request(option, function(res){
        var data = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk){
            data += chunk;
        });
        res.on('end', function(){
            var arrAns = data.match(/data-aid(.|\n|\r|\t)*?data-score="\d*\.\d*"/g); //正则回答
            var arrAuth = data.match(/<h3 class="zm-item-answer-author-wrap"(.|\n|\r|\t)*?<\/h3>/g); //正则作者

            for (var i=0,l=arrAns.length; i<l; i++){
                var id = getAnswerID(arrAns[i]);
                var author;
                if (arrAuth[i].indexOf('href="/people/')>=0) {
                    // 获得回答作者名字
                    author = arrAuth[i].match(/href="\/people.*?<\/a>/)[0].replace(/href="\/people.*?">|<\/a>/g,'');
                } else {
                    author = '匿名用户';
                }
                getAgree(id,author);
            }

        });
    });

    req.end();    
}(22774479)


var getAnswerID = function(str){
    // console.log(str.match(/\d+/)[0])
    return str.match(/\d+/)[0];
};

var CreatSingleStat = function(answerAuthor){
    // 单个回答对象
    this.Male = 0;
    this.Female = 0;
    this.reqCount = 0;
    this.Anonymous = 0;
    this.Author = answerAuthor;
};

var getAgree = function(answerID, answerAuthor){
    // 取得赞同者
    var obj = new CreatSingleStat(answerAuthor);
    var option = {
        host : 'www.zhihu.com',
        path : '/node/AnswerFullVoteInfoV2?params=%7B%22answer_id%22%3A%22'+answerID+'%22%7D',
        headers : {
            Cookie : mycookie
        }
    }
    var req = http.request(option, function(res){
        var data = '';
        // res.setEncoding('utf8');
        res.on('data', function(chunk){
            data += chunk;
        });
        res.on('end', function(){
            var arr = data.match(/href=".*?"/g);
            var noname = data.match('匿名用户');
            if (!data || !arr) {
                //没有人赞同的回答
                // console.log('no agree');
                return ;
            }
            if (!!noname)
                obj.Anonymous = noname.length;

            obj.reqCount = arr.length;
            for (var i=0,l=arr.length; i<l; i++){
                getGender(arr[i].replace(/href="\/people\/|"/g,''), obj);
            }
            // console.log(arr);
        });
    });
    req.end();
};

var getGender = function(name, obj){
    // 取得赞同者性别
    var option = {
        host : 'www.zhihu.com',
        path : '/node/MemberProfileCardV2?params=%7B%22url_token%22%3A%22'+name+'%22%7D',
        headers : {
            Cookie : mycookie
        }
    }
    var req = http.request(option, function(res){
        var data = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk){
            data += chunk;
        });
        res.on('end', function(){
            obj.reqCount--;
            if ( data.indexOf('<i class="zg-icon female"></i>') >= 0 ) {
                obj.Female++;
            } else {
                obj.Male++;
            }
            if (obj.reqCount === 0){
                delete obj.reqCount;
                console.log(obj)
            }
        });
    });
    req.end();
}