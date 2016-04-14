var express = require('express');
var bodyParser = require('body-parser');
var compress = require('compression');
var restler = require('restler');
var _ = require('lodash');
var removeDiacritics = require('./removeDiacritics');

var app = express();
var env = process.env.NODE_ENV || 'development';

var forceSsl = function (req, res, next) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  return next();
};

if(env === 'production') {
  app.use(forceSsl);
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(compress());
app.use(express.static(__dirname + '/app'));

app.post('/api/get-data', function (req, res) {
  var serverInfo = req.body;
  serverInfo.address = _.trimEnd(serverInfo.address, '/');
  var url = 'http://' + serverInfo.address + ':' + serverInfo.port + '/jsonrpc';
  
  var mainOptions = {
    "jsonrpc":"2.0",
    "id":1
  };
  
  var getTVShows = mainOptions;
  getTVShows.method = "VideoLibrary.GetTVShows";
  getTVShows = JSON.stringify(getTVShows);
  var getMovies = mainOptions;
  getMovies.method = "VideoLibrary.GetMovies";
  getMovies = JSON.stringify(getMovies);
  var getMusicians = mainOptions;
  getMusicians.method = "AudioLibrary.GetArtists";
  getMusicians = JSON.stringify(getMusicians);
  
  var tvShowsArr = [];
  var moviesArr = [];
  var musiciansArr = [];
  var errorsArr = [];
  
  var sanitizeResult = function(str) {
    str = removeDiacritics.remove(str);
    str = str.replace(/\([^)]*\)/, "");
    str = _.trimEnd(str);
    return str;
  };
  
  restler.post(url, {
    username: serverInfo.username,
    password: serverInfo.password,
    data: getTVShows
  }).on('success', function(shows) {
    if(shows.result && shows.result.tvshows) {
      _.forEach(shows.result.tvshows, function(tvshow) {
        var str = sanitizeResult(tvshow.label);
        tvShowsArr.push(str);
      });
    }
  }).on('401', function(data, err) {
    console.log(err);
    errorsArr.push('401: Not Authorized');
  }).on('error', function(err) {
    console.log(err);
    if(err.code === "ENOTFOUND")
      errorsArr.push('404: Not found');
    else
      errorsArr.push('Could not get TV Shows');
  }).on('complete', function() {
    restler.post(url, {
      username: serverInfo.username,
      password: serverInfo.password,
      data: getMovies
    }).on('success', function(movies) {
      if(movies.result && movies.result.movies) {
        _.forEach(movies.result.movies, function(movie) {
          var str = sanitizeResult(movie.label);
          moviesArr.push(str);
        });
      }
    }).on('error', function(err) {
      console.log(err);
      errorsArr.push('Could not get Movies');
    }).on('complete', function() {
      restler.post(url, {
        username: serverInfo.username,
        password: serverInfo.password,
        data: getMusicians
      }).on('success', function(musicians) {
        if(musicians.result && musicians.result.artists) {
          _.forEach(musicians.result.artists, function(artist) {
            var str = sanitizeResult(artist.label);
            musiciansArr.push(str);
          });
        }
      }).on('error', function(err) {
        console.log(err);
        errorsArr.push('Could not get Artists');
      }).on('complete', function() {
        tvShowsArr = _.uniq(tvShowsArr);
        moviesArr = _.uniq(moviesArr);
        musiciansArr = _.uniq(musiciansArr);
        res.send({'errors': errorsArr, 'tvshows': tvShowsArr, 'movies': moviesArr, 'musicians': musiciansArr});
      });
    });
  });
});

app.all('*', function(req, res, next) {
  if(req.path.match(/\.(html|js|css|png|jpg|jpeg|gif|webp|svg)$/)) {
    return next();
  }

  res.sendfile('app/index.html');
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
