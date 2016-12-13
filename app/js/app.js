(function init() {

})();

function validateIp(ip) {
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
}

function validateUrl(str) {
  var urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
  var url = new RegExp(urlRegex, 'i');
  return str.length < 2083 && url.test(str);
}

function submitForm() {
  var errorRow = $('#error-row');
  var errorMsg = $('#error-text');
  var submitBtn = $('#submit-button');
  var dataRow = $('#show-data');

  var clearProgress = function() {
    submitBtn.removeClass('loading');
    submitBtn.val('Submit');
    submitBtn.prop("disabled", false);
  };

  submitBtn.prop("disabled", true);
  submitBtn.width(48);
  submitBtn.val('');
  submitBtn.addClass('loading');
  errorRow.addClass('hidden');
  errorMsg.text('');
  dataRow.addClass('hidden');

  var url = $('#url').val();

  if(!validateUrl('https://' + url) && !validateIp(url)) {
    errorMsg.text('Please enter a valid address for your Kodi box.');
    errorRow.removeClass('hidden');
    clearProgress();
    return;
  }

  var port = $('#portnumber').val();

  if(port.length === 0) {
    errorMsg.text('Please enter a valid port number for your Kodi box.');
    errorRow.removeClass('hidden');
    clearProgress();
    return;
  }

  var username = $('#username').val();
  var password = $('#password').val();

  var promise = axios({
    method: 'post',
    url: '/api/get-data',
    timeout: 5000,
    data: {
      username: username,
      password: password,
      address: url,
      port: port
    }
  });

  promise.then(function(results) {
    var tvData = $('#tvshow-data');
    var tvText = '';
    _.forEach(results.data.tvshows, function(tvshow, index, array) {
      tvText += tvshow;
      if(index !== array.length - 1)
        tvText += '\n';
    });
    tvData.text(tvText);

    var movieData = $('#movie-data');
    var movieText = '';
    _.forEach(results.data.movies, function(movie, index, array) {
      movieText += movie;
      if(index !== array.length - 1)
        movieText += '\n';
    });
    movieData.text(movieText);

    var movieGenreData = $('#moviegenre-data');
    var movieGenreText = '';
    _.forEach(results.data.moviegenres, function(moviegenre, index, array) {
      movieGenreText += moviegenre;
      if(index !== array.length - 1)
        movieGenreText += '\n';
    });
    movieGenreData.text(movieGenreText);

    var artistData = $('#musicartists-data');
    var artistText = '';
    _.forEach(results.data.musicians, function(artist, index, array) {
      artistText += artist;
      if(index !== array.length - 1)
        artistText += '\n';
    });
    artistData.text(artistText);

    var albumData = $('#musicalbums-data');
    var albumText = '';
    _.forEach(results.data.albums, function(album, index, array) {
      albumText += album;
      if(index !== array.length - 1)
        albumText += '\n';
    });
    albumData.text(albumText);

    var songData = $('#musicsongs-data');
    var songText = '';
    _.forEach(results.data.songs, function(song, index, array) {
      songText += song;
      if(index !== array.length - 1)
        songText += '\n';
    });
    songData.text(songText);

    var musicplaylistsData = $('#musicplaylists-data');
    var musicplaylistsText = '';
    _.forEach(results.data.musicplaylists, function(playlist, index, array) {
      musicplaylistsText += playlist;
      if(index !== array.length - 1)
        musicplaylistsText += '\n';
    });
    musicplaylistsData.text(musicplaylistsText);

    var videoplaylistsData = $('#videoplaylists-data');
    var videoplaylistsText = '';
    _.forEach(results.data.videoplaylists, function(playlist, index, array) {
      videoplaylistsText += playlist;
      if(index !== array.length - 1)
        videoplaylistsText += '\n';
    });
    videoplaylistsData.text(videoplaylistsText);

    var addonsData = $('#addons-data');
    var addonsText = '';
    _.forEach(results.data.addons, function(addon, index, array) {
      addonsText += addon;
      if(index !== array.length - 1)
        addonsText += '\n';
    });
    addonsData.text(addonsText);

    dataRow.removeClass('hidden');
    clearProgress();
  }).catch(function(err) {
    console.log(err);
    errorMsg.text('Please validate your server information and try again');
    errorRow.removeClass('hidden');
    clearProgress();
  });
}
