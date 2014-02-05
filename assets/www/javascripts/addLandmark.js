$(function(){

	MapHandler.setup({init_zoom: 14}, function(map){
		MapHandler.MAP.setOptions({draggableCursor: "crosshair"});

		google.maps.event.addListener(map, "click", function(event) {
			var lat = event.latLng.lat();
			var lng = event.latLng.lng();
			// populate yor box/field with lat, lng
			$('#confirmLandmark').trigger('open');
			modalTop('confirmLandmark');
			$('#lat').val(lat);
			$('#lng').val(lng);
			$('#landmarkDetails').html('<div class="form-group"><label class="control-label col-sm-5">Landmark Name:</label><div class="col-sm-7 form-control" style="display: inline !important; max-width:250px !important;">'+$('#landmarkName').val()+'</div></div><div class="form-group" style="margin-bottom: 0px;"><div style="text-align: center;"><img src="https://maps.googleapis.com/maps/api/staticmap?center='+lat+','+lng+'&zoom=15&size=240x200&markers='+lat+','+lng+'&sensor=false"><br/><p style="font-size: x-small !important; line-height:1 !important; margin-bottom: 0px;">Lat:'+lat+'<br/>Lng:'+lng+'</p></div></div>');

		});//end of click event 
	});//end of setup

});