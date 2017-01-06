var express = require('express');
var bodyParser = require('body-parser');
var compress = require('compression');
var axios = require('axios');
var _ = require('lodash');

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

  var musicPlaylistOptions = _.clone(mainOptions);
  musicPlaylistOptions.params = {"directory": "special://musicplaylists"};
  var videoPlaylistOptions = _.clone(mainOptions);
  videoPlaylistOptions.params = {"directory": "special://videoplaylists"};

  var addonsVideoOptions = _.clone(mainOptions);
  addonsVideoOptions.params = {"content": "video", "properties":["name"]};
  var addonsAudioOptions = _.clone(mainOptions);
  addonsAudioOptions.params = {"content": "audio", "properties":["name"]};
  var addonsImageOptions = _.clone(mainOptions);
  addonsImageOptions.params = {"content": "image", "properties":["name"]};
  var addonsExeOptions = _.clone(mainOptions);
  addonsExeOptions.params = {"content": "executable", "properties":["name"]};

  var getTVShows = _.clone(mainOptions);
  getTVShows.method = "VideoLibrary.GetTVShows";
  var getMovies = _.clone(mainOptions);
  getMovies.method = "VideoLibrary.GetMovies";
  var getMovieGenres = _.clone(mainOptions);
  getMovieGenres.method = "VideoLibrary.GetGenres";
  getMovieGenres.params = {"type":"movie"};
  var getMusicians = _.clone(mainOptions);
  getMusicians.method = "AudioLibrary.GetArtists";
  var getAlbums = _.clone(mainOptions);
  getAlbums.method = "AudioLibrary.GetAlbums";
  var getSongs = _.clone(mainOptions);
  getSongs.method = "AudioLibrary.GetSongs";
  var getMusicPlaylists = _.clone(musicPlaylistOptions);
  getMusicPlaylists.method = "Files.GetDirectory";
  var getVideoPlaylists = _.clone(videoPlaylistOptions);
  getVideoPlaylists.method = "Files.GetDirectory";
  var getAddonsVideo = _.clone(addonsVideoOptions);
  getAddonsVideo.method = "Addons.GetAddons";
  var getAddonsAudio = _.clone(addonsAudioOptions);
  getAddonsAudio.method = "Addons.GetAddons";
  var getAddonsImage = _.clone(addonsImageOptions);
  getAddonsImage.method = "Addons.GetAddons";
  var getAddonsExe = _.clone(addonsExeOptions);
  getAddonsExe.method = "Addons.GetAddons";

  var tvShowsArr = [];
  var moviesArr = [];
  var movieGenresArr = [];
  var musiciansArr = [];
  var albumsArr = [];
  var songsArr = [];
  var musicPlaylistsArr = [];
  var videoPlaylistsArr = [];
  var addonsArr = [];

  var sanitizeResult = function(str, removeBetween) {
    // Normalize string
    str = _.deburr(str);

    if(removeBetween) {
      str = str.replace(/\([^)]*\)/, "");
      str = str.replace(/\[[^)]*\]/, "");
    } else {
      str = str.replace(/\(/, "");
      str = str.replace(/\)/, "");
      str = str.replace(/\[/, "");
      str = str.replace(/\]/, "");
    }

    str = _.trim(str);
    return str;
  };

  var promisesArr = [
    axios({ method: 'post', url: url, auth: {username: serverInfo.username, password: serverInfo.password}, data: getTVShows, timeout: 10000 }),
    axios({ method: 'post', url: url, auth: {username: serverInfo.username, password: serverInfo.password}, data: getMovies, timeout: 10000 }),
    axios({ method: 'post', url: url, auth: {username: serverInfo.username, password: serverInfo.password}, data: getMovieGenres, timeout: 10000 }),
    axios({ method: 'post', url: url, auth: {username: serverInfo.username, password: serverInfo.password}, data: getMusicians, timeout: 10000 }),
    axios({ method: 'post', url: url, auth: {username: serverInfo.username, password: serverInfo.password}, data: getAlbums, timeout: 10000 }),
    axios({ method: 'post', url: url, auth: {username: serverInfo.username, password: serverInfo.password}, data: getSongs, timeout: 10000 }),
    axios({ method: 'post', url: url, auth: {username: serverInfo.username, password: serverInfo.password}, data: getMusicPlaylists, timeout: 10000 }),
    axios({ method: 'post', url: url, auth: {username: serverInfo.username, password: serverInfo.password}, data: getVideoPlaylists, timeout: 10000 }),
    axios({ method: 'post', url: url, auth: {username: serverInfo.username, password: serverInfo.password}, data: getAddonsVideo, timeout: 10000 }),
    axios({ method: 'post', url: url, auth: {username: serverInfo.username, password: serverInfo.password}, data: getAddonsAudio, timeout: 10000 }),
    axios({ method: 'post', url: url, auth: {username: serverInfo.username, password: serverInfo.password}, data: getAddonsImage, timeout: 10000 }),
    axios({ method: 'post', url: url, auth: {username: serverInfo.username, password: serverInfo.password}, data: getAddonsExe, timeout: 10000 })
  ];

  axios.all(promisesArr).then(axios.spread(function (shows, movies, moviegenres, musicians, albums, songs, musicplaylists, videoplaylists, addonsvideo, addonsaudio, addonsimage, addonsexe) {
    if(shows.data.result && shows.data.result.tvshows) {
      _.forEach(shows.data.result.tvshows, function(tvshow) {
        var str = sanitizeResult(tvshow.label);
        var str_stripped = sanitizeResult(tvshow.label, true);
        tvShowsArr.push(str);
        tvShowsArr.push(str_stripped);
      });
    }
    if(movies.data.result && movies.data.result.movies) {
      _.forEach(movies.data.result.movies, function(movie) {
        var str = sanitizeResult(movie.label);
        var str_stripped = sanitizeResult(movie.label, true);
        moviesArr.push(str);
        moviesArr.push(str_stripped);
      });
    }
    if(moviegenres.data.result && moviegenres.data.result.genres) {
      _.forEach(moviegenres.data.result.genres, function(genre) {
        var str = sanitizeResult(genre.label);
        var str_stripped = sanitizeResult(genre.label, true);
        movieGenresArr.push(str);
        movieGenresArr.push(str_stripped);
      });
    }
    if(musicians.data.result && musicians.data.result.artists) {
      _.forEach(musicians.data.result.artists, function(artist) {
        var str = sanitizeResult(artist.label);
        var str_stripped = sanitizeResult(artist.label, true);
        musiciansArr.push(str);
        musiciansArr.push(str_stripped);
      });
    }
    if(albums.data.result && albums.data.result.albums) {
      _.forEach(albums.data.result.albums, function(album) {
        var str = sanitizeResult(album.label);
        var str_stripped = sanitizeResult(album.label, true);
        albumsArr.push(str);
        albumsArr.push(str_stripped);
      });
    }
    if(songs.data.result && songs.data.result.songs) {
      _.forEach(songs.data.result.songs, function(song) {
        var str = sanitizeResult(song.label);
        var str_stripped = sanitizeResult(song.label, true);
        songsArr.push(str);
        songsArr.push(str_stripped);
      });
    }
    if(musicplaylists.data.result && musicplaylists.data.result.files) {
      _.forEach(musicplaylists.data.result.files, function(playlist) {
        var str = sanitizeResult(playlist.label);
        var str_stripped = sanitizeResult(playlist.label, true);
        musicPlaylistsArr.push(str);
        musicPlaylistsArr.push(str_stripped);
      });
    }
    if(videoplaylists.data.result && videoplaylists.data.result.files) {
      _.forEach(videoplaylists.data.result.files, function(playlist) {
        var str = sanitizeResult(playlist.label);
        var str_stripped = sanitizeResult(playlist.label, true);
        videoPlaylistsArr.push(str);
        videoPlaylistsArr.push(str_stripped);
      });
    }
    if(addonsvideo.data.result && addonsvideo.data.result.addons) {
      _.forEach(addonsvideo.data.result.addons, function(addon) {
        var str = sanitizeResult(addon.name);
        var str_stripped = sanitizeResult(addon.name, true);
        addonsArr.push(str);
        addonsArr.push(str_stripped);
      });
    }
    if(addonsaudio.data.result && addonsaudio.data.result.addons) {
      _.forEach(addonsaudio.data.result.addons, function(addon) {
        var str = sanitizeResult(addon.name);
        var str_stripped = sanitizeResult(addon.name, true);
        addonsArr.push(str);
        addonsArr.push(str_stripped);
      });
    }
    if(addonsimage.data.result && addonsimage.data.result.addons) {
      _.forEach(addonsimage.data.result.addons, function(addon) {
        var str = sanitizeResult(addon.name);
        var str_stripped = sanitizeResult(addon.name, true);
        addonsArr.push(str);
        addonsArr.push(str_stripped);
      });
    }
    if(addonsexe.data.result && addonsexe.data.result.addons) {
      _.forEach(addonsexe.data.result.addons, function(addon) {
        var str = sanitizeResult(addon.name);
        var str_stripped = sanitizeResult(addon.name, true);
        addonsArr.push(str);
        addonsArr.push(str_stripped);
      });
    }

    tvShowsArr = _.take(_.shuffle(_.compact(_.uniq(tvShowsArr))), 2500);
    moviesArr = _.take(_.shuffle(_.compact(_.uniq(moviesArr))), 2500);
    movieGenresArr = _.take(_.shuffle(_.compact(_.uniq(movieGenresArr))), 2500);
    musiciansArr = _.take(_.shuffle(_.compact(_.uniq(musiciansArr))), 2500);
    albumsArr = _.take(_.shuffle(_.compact(_.uniq(albumsArr))), 2500);
    songsArr = _.take(_.shuffle(_.compact(_.uniq(songsArr))), 2500);
    musicPlaylistsArr = _.take(_.shuffle(_.compact(_.uniq(musicPlaylistsArr))), 2500);
    videoPlaylistsArr = _.take(_.shuffle(_.compact(_.uniq(videoPlaylistsArr))), 2500);
    addonsArr = _.take(_.shuffle(_.compact(_.uniq(addonsArr))), 2500);
    res.send({'tvshows': tvShowsArr, 'movies': moviesArr, 'moviegenres': movieGenresArr, 'musicians': musiciansArr, 'albums': albumsArr, 'songs': songsArr, 'musicplaylists': musicPlaylistsArr, 'videoplaylists': videoPlaylistsArr, 'addons': addonsArr});
  })).catch(function(err) {
    console.log(err);

    if(err.response.status === 401)
      res.status(401).send('401: Not Authorized');
    else if(err.response.status === 404)
      res.status(404).send('404: Not found');
    else
      res.status(500).send('Could not complete request');
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
