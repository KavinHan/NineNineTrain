/*global Vue, todoStorage */

(function(exports) {

  'use strict';

  document.addEventListener('deviceready', onDeviceReady, false);
  onDeviceReady();
  function onDeviceReady() {
    console.log("Start App!");
    console.log("LeanCloud ===> ");
    console.log(AV);
    AV.initialize('', '');

    FastClick.attach(document.body);


    Vue.filter('symbol', function(num) {
      num = parseInt(num);
      switch (num) {
        case 0:
          return '+';
        case 1:
          return '–';
        case 2:
          return '×';
        case 3:
          return '÷';
        default:
          return false;
      }
    });

    Vue.filter('HHMMDD', function(text) {
      text = parseInt(text / 1000);
      var hour = parseInt(text / 3600);
      text = text % 3600;
      var minute = parseInt(text / 60);
      var second = text % 60;

      hour = hour >= 10 ? hour : '0' + hour;
      minute = minute >= 10 ? minute : '0' + minute;
      second = second >= 10 ? second : '0' + second;

      return hour + ':' + minute + ':' + second;
    });

    var homePage = Vue.extend({
      template: '#home-template',
      replace: true,
      props: ['answer'],
      data: function() {
        return {
          answer: ''
        };
      }
    });

    var playPage = Vue.extend({
      template: '#play-template',
      replace: true,
      data: function() {
        return {
          answer: '',
          questions: [],
          timer: null,
          maxSecond: 10,
          nowSecond: 10,
          combo: 0,
          score: 0,
          count: 0,
          sTime: 0,
          eTime: 0,
          bGameOver: false,
          bConfirm: false,
          maxCombo: 0
        };
      },
      created: function() {
        console.log('creating...');
        var i;
        for (i = 0; i < 3; i++)
          this.questions.push(util.getQuestion());

        console.log(this.questions);
      },
      ready: function() {
        console.log('Ready');
        this.update();
        this.nowSecond = this.maxSecond;
        this.sTime = Date.now();
      },
      methods: {
        clickKeyboard: function(key) {
          var num = parseInt(key);
          if (num >= 0 && num <= 9 && this.answer.length < 2) {
            this.answer += num + '';
          }
          // enter
          else if (num == 10) {
            if (this.answer.length === 0) return false;
            // enter event
            if (parseInt(this.answer) === util.getAnswer(this.questions[0])) {
              console.log('Answer is right.^^');
              // change question
              // 3 -> 2
              // 2 -> 1
              // 1 -> new
              this.questions.shift();
              this.questions.push(util.getQuestion());
              // reset time
              this.nowSecond = this.maxSecond;
              // add combo
              this.combo++;
              if (this.combo > this.maxCombo) this.maxCombo = this.combo;
              // add score
              this.score++;
              // add do answer count
              this.count++;
            } else {
              console.log('Answer is wrong.--');
              console.log(this.combo, this.maxCombo);
              if (this.combo > this.maxCombo) this.maxCombo = this.combo;
              this.combo = 0;
              this.count++;
              this.score--;
              if (this.score < 0) {
                // game over
                if (this.timer) clearTimeout(this.timer);
                this.gameOver();
                this.score = 0;
              }
            }
            // clear answer
            this.answer = '';
          }
          // Clear
          else if (num == 11) {
            this.answer = '';

          }
        },
        update: function() {
          console.log('update');
          if (this.nowSecond > 1) {
            this.nowSecond--;
            if (this.timer) clearTimeout(this.timer);
            this.timer = setTimeout(this.update, 1000);
          } else {
            this.nowSecond--;
            if (this.timer) clearTimeout(this.timer);
            //game over
            this.gameOver();
          }
        },
        clickBack: function() {
          this.bConfirm = true;
          this.pause();
        },
        clickHome: function() {
          this.save();
          router.go('index');
        },
        clickCancle: function() {
          this.bConfirm = false;
          this.start();
        },
        gameOver: function() {
          console.log(this.timer);
          this.eTime = Date.now();
          var useTime = this.eTime - this.sTime;
          console.log(useTime);
          this.bGameOver = true;
          this.save();
        },
        pause: function() {
          if (this.timer) clearTimeout(this.timer);
        },
        start: function() {
          this.timer = setTimeout(this.update, 1000);
        },
        reStart: function() {
          // reset problem
          this.questions = [];
          var i;
          for (i = 0; i < 3; i++)
            this.questions.push(util.getQuestion());

          // reset params
          this.answer = '';
          this.combo = 0;
          this.score = 0;
          this.count = 0;
          this.sTime = 0;
          this.eTime = 0;
          this.bGameOver = false;
          this.maxCombo = 0;

          // reset timer
          this.nowSecond = this.maxSecond;
          if (this.timer) clearTimeout(this.timer);
          this.timer = setTimeout(this.update, 1000);
          this.sTime = Date.now();
          console.log(this.bGameOver);
        },
        save: function() {
          // if answered count is zero then stop save
          if (this.count === 0) return false;
          // make save object item
          var item = {
            score: this.score,
            playCount: this.count,
            playTime: this.eTime - this.sTime,
            maxCombo: this.maxCombo
          };
          // get score list from localstorage
          var itemArr = store.get('ScoreStore') || [];
          // push current score to score list
          itemArr.push(item);
          // sort score list, check current score index
          itemArr.sort(function(a, b) {
            return b.score - a.score;
          });

          // if this score is max score then upload to server
          if (item.score === itemArr[0].score) {
            // start upload score to server
            var GameScore = AV.Object.extend('GameScore');
            var gameScore = new GameScore();
            gameScore.save(item, {
              // upload finish
              success: function(object) {
                console.log('Upload Success.^^');
                console.log(object);
              },
              // upload failed
              error: function(err) {
                console.log(err);
              }
            });
          }
          // save new score list to localstorage
          store.set('ScoreStore', itemArr);
        }
      }
    });

    // rank page
    var rankPage = Vue.extend({
      template: '#rank-template',
      replace: true,
      data: function() {
        return {
          itemArr: [],
          loadingMsg: '',
          bShowMsg: false
        };
      },
      created: function() {
        // get score array from localstorage
        this.itemArr = store.get('ScoreStore') || [];
      },
      ready: function() {

      },
      methods: {
        showGlobe: function() {
          this.bShowMsg = true;
          this.loadingMsg = 'Loading';
          var GameScore = AV.Object.extend('GameScore');
          var query = new AV.Query(GameScore);
          query.limit(10);
          query.descending("score");
          var self = this;
          self.itemArr = [];
          console.log("Query === >");
          console.log(query);
          query.find({
            success: function(results) {
              console.log("Successfully retrieved " + results.length + " posts.");
              for (var i = 0; i < results.length; i++) {
                var object = results[i];
                self.itemArr.push({
                  score: object.get('score'),
                  playCount: object.get('playCount'),
                  playTime: object.get('playTime'),
                  maxCombo: object.get('maxCombo')
                });
                console.log(object.id + ' - ' + object.get('score'));
                self.bShowMsg = false;

              }
            },
            error: function(error) {
              console.log("Error: " + error.code + " " + error.message);
              this.loadingMsg('Load failed.=,=');
            }
          });
        },
        showLocal: function() {
          this.bShowMsg = false;
          this.itemArr = store.get('ScoreStore') || [];
        },
        test: function() {
          alert(1);
        }
      }
    });


    // root componet
    var App = Vue.extend({});

    // create router instance
    // default options
    var router = new VueRouter();
    console.dir(router);
    // define router role
    //  each router rule mapping a component。like vue.extent
    router.map({
      '/index': {
        component: homePage
      },
      '/play': {
        component: playPage
      },
      '/rank': {
        component: rankPage
      },
      '/': {
        component: homePage
      }
    });

    // run app
    router.start(App, '#app');

    // toggle keyboard class
    var keyboards = document.getElementsByClassName("keyboard-number");
    for (var i = 0; i < keyboards.length; i++) {
      keyboards[i].addEventListener('touchstart', function() {
        this.classList.add('hover');
      }, false);
      keyboards[i].addEventListener('touchend', function() {
        this.classList.remove('hover');
      }, false);
    }

  }

})(window);
