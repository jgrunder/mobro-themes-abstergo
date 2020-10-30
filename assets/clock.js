/**
 * Glitch Clock from codepen by Konstantin
 * https://codepen.io/fearOfCode/pen/FsGtu
 */
$(document).ready(function () {

  function second_passed() {
    $('.clock').removeClass('is-off');
    setTimeout(function() {
      $('.screen').toggleClass('glitch');
    }, 4000);
  }
  setTimeout(second_passed, 2000)

  setInterval(function() {
    $('.screen').toggleClass('glitch');
    setTimeout(function() {
      $('.screen').toggleClass('glitch');
    }, 4000);
  }, 32739);


  var newDate = new Date();
  newDate.setDate(newDate.getDate());

  setInterval( function() {

    var hours    = new Date().getHours();
    var minutes  = new Date().getMinutes();

    var realTime = ( hours < 10 ? '0' : '' ) + hours + ' : ' + ( minutes < 10 ? '0' : '' ) + minutes

    $('.time').html(realTime);
    $('.time').attr('data-time', realTime);

  }, 1000);

});
