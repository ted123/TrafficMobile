$(".lane-options").on("click", ".left, .right", function() {   
  $('.two-lanes-btn').prop("disabled",false);
  IS_LEFT = $(this).hasClass('left') ? 1 : 0;
  
});
$(".cancel-option").on("click", "#cancelSelect", function() {
  $(".two-lanes-btn").prop("disabled",true);
  $("#OneWay").trigger('close');
  $("#TwoWay").trigger('close');
  $(".repmsgbox").hide();
});

$(".one-lane").on("click", ".light, .medium, .heavy", function() {
  TI_COUNT+=1;
  setHtmlStorage("TI-"+Traffic_intensity_id, TI_COUNT, 60);
  if($(this).hasClass('light')){
    _intensitySave('Light','NONE');
  }else if($(this).hasClass('medium')){
    _intensitySave('Medium','NONE');
  }else if($(this).hasClass('heavy')){
    _intensitySave('Heavy','NONE');
  }
  // $(".one-lane").hide();
  // $(".lupdate").hide();
  $("#OneWay").trigger('close');
});

$(".two-lanes").on("click", ".light, .medium, .heavy", function() {
  TI_COUNT+=1;
  setHtmlStorage("TI-"+Traffic_intensity_id, TI_COUNT, 60);
  if(IS_LEFT == 0){
    if($(this).hasClass('light')){
      _intensitySave('Light','Right');
    }else if($(this).hasClass('medium')){
      _intensitySave('Medium','Right');
    }else if($(this).hasClass('heavy')){
      _intensitySave('Heavy','Right');
    }
  }else{
    if($(this).hasClass('light')){
      _intensitySave('Light','Left');
    }else if($(this).hasClass('medium')){
      _intensitySave('Medium','Left');
    }else if($(this).hasClass('heavy')){
      _intensitySave('Heavy','Left');
    }
  }
  // $(".lane-options").hide();
  // $(".two-lanes").hide();
  // $(".lupdate").hide();
  $(".two-lanes-btn").prop("disabled",true);
  $("#TwoWay").trigger('close');
});

function _intensitySave(iv,lane){
  
  $.ajax({
        url: BASE_URL + 'intensityReport',
        type: 'POST',
        data: {traffic_intensity_id:Traffic_intensity_id , intensity_value:iv, lane: lane},
        success: function(results){
          if(IS_LOGGEDIN){
              MARKER_FILTER = "Official Traffic";   
              toggleMarkersByFilter();
            }else{
              MARKER_FILTER = "Unofficial Traffic";   
              toggleMarkersByFilter();
            }
        }
      });
}
