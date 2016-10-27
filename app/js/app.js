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

  var client = new $.RestClient('/api/');
  client.add('api', { url: 'get-data' });

  client.api.create({'username':username, 'password':password, 'address':url, 'port':port}).done(function(results) {
    console.log(results);

    var is404 = _.find(results.errors, function(error) {
      return error === "404: Not found";
    });

    if(results.errors.length === 3 || is404) {
      errorMsg.text('Please validate your information and try again');
      errorRow.removeClass('hidden');
      clearProgress();
      return;
    }

    var notAuthed = _.find(results.errors, function(error) {
      return error === "401: Not Authorized";
    });

    if(notAuthed) {
      errorMsg.text('Please validate your username and password');
      errorRow.removeClass('hidden');
      clearProgress();
      return;
    }

    var tvData = $('#tvshow-data');
    var tvText = '';
    _.forEach(results.tvshows, function(tvshow, index, array) {
      tvText += tvshow;
      if(index !== array.length - 1)
        tvText += '\n';
    });
    tvData.text(tvText);

    var movieData = $('#movie-data');
    var movieText = '';
    _.forEach(results.movies, function(movie, index, array) {
      movieText += movie;
      if(index !== array.length - 1)
        movieText += '\n';
    });
    movieData.text(movieText);

    var artistData = $('#musicartists-data');
    var artistText = '';
    _.forEach(results.musicians, function(artist, index, array) {
      artistText += artist;
      if(index !== array.length - 1)
        artistText += '\n';
    });
    artistData.text(artistText);

    var albumData = $('#musicalbums-data');
    var albumText = '';
    _.forEach(results.albums, function(album, index, array) {
      albumText += album;
      if(index !== array.length - 1)
        albumText += '\n';
    });
    albumData.text(albumText);

    var musicplaylistsData = $('#musicplaylists-data');
    var musicplaylistsText = '';
    _.forEach(results.musicplaylists, function(playlist, index, array) {
      musicplaylistsText += playlist;
      if(index !== array.length - 1)
        musicplaylistsText += '\n';
    });
    musicplaylistsData.text(musicplaylistsText);

    dataRow.removeClass('hidden');

    clearProgress();
  });
}
