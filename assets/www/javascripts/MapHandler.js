/*
	This file is a javascript object that handles the initialiation some basic bahavior of the google map in the system
	Usage:
		MapHandler.setup(options, callback); --all parameters are optional
	
	You can add custom events, inside the callback method. the callback method has access to the map
	The map can be accesed using MapHandler.MAP

	You can Add new UI inside the map using:
		MapHandler.UIControl(text, position, callback);
*/

var MapHandler = {
	API_KEY: "AIzaSyCXzsYoJeFVeuF8vAbEqOVpw6kp1-1s9WM",
	MIN_ZOOM: 14,
	INIT_ZOOM: 14,
	startBounds: null,
	endBounds: null,
	MAP: null,
	customEvents: null,
	src: "",
	EVENTS: {},
	_cebuBounds: null,

	/* This function must be called only once.. */
	setup: function(options, callback) {
		MapHandler.src = "http://maps.googleapis.com/maps/api/js?key=" + MapHandler.API_KEY + "&sensor=false&callback=MapHandler._initMap";
		if(options != null){
			MapHandler.MIN_ZOOM = typeof(options.min_zoom) != "undefined"	? options.min_zoom : MapHandler.MIN_ZOOM;
			MapHandler.INIT_ZOOM = typeof(options.init_zoom) != "undefined"	? options.init_zoom : MapHandler.INIT_ZOOM;
		}
		
		if(document.querySelector("script[src='" + MapHandler.src + "']")){
			MapHandler._spawnMap();
			if(typeof(callback) != "undefined") callback(MapHandler.MAP);
		}else{
			MapHandler._loadMapScript();
		}
		if(typeof(callback) != "undefined") MapHandler.customEvents = callback;
	},

	/* This function appends/loads the google map asynchronously */
	_loadMapScript: function() {
		var script = document.createElement("script");
		script.type = "text/javascript";
		script.src = MapHandler.src;
		document.body.appendChild(script);
	},
	_spawnMap: function(){
		MapHandler.startBounds =	new google.maps.LatLng(10.360515,123.874441); 
		MapHandler.endBounds =	new google.maps.LatLng(10.291105,123.92448);

		var mapOptions = {
			zoom: MapHandler.INIT_ZOOM,
			maxZoom: 18,
			// center: MapHandler._getMapCenter(),
			center: new google.maps.LatLng(10.309884,123.89311),
			keyboardShortcuts: false, 
			panControl:false,
			mapTypeControl:false,
			streetViewControl:false,
			zoomControl:true,
			disableDoubleClickZoom: true,
			zoomControlOptions: {
				style: google.maps.ZoomControlStyle.SMALL,
				position: google.maps.ControlPosition.TOP_RIGHT
			},

			mapTypeId: google.maps.MapTypeId.ROADMAP
		}
		MapHandler.MAP = new google.maps.Map($("#map-canvas")[0], mapOptions);

		google.maps.event.addListener(MapHandler.MAP, 'dragend', function(){ MapHandler._preventOutOfBounds(); });
		google.maps.event.addListener(MapHandler.MAP, 'zoom_changed', function() { if (MapHandler.MAP.getZoom() < MapHandler.MIN_ZOOM) MapHandler.MAP.setZoom(MapHandler.MIN_ZOOM); });
		MapHandler.fixInfoWindow();
	},
	fixInfoWindow: function() {
		var set = google.maps.InfoWindow.prototype.set;
		google.maps.InfoWindow.prototype.set = function (key, val) {
			if (key === 'map') {	if (!this.get('noSupress')) {return;}	}
			set.apply(this, arguments);
		}
	},

	/* This function is the actual initialization of the map, this adds the google map to the page */
	_initMap: function(){
		MapHandler._spawnMap();

		if(typeof(MapHandler.customEvents) != "undefined") MapHandler.customEvents(MapHandler.MAP);
	},

	/* This function calculates the coordinates of the center of the map using the bounds of Cebu City that will be covered by the system.  */
	_getMapCenter: function(){
		var startBounds = MapHandler.startBounds, 
				endBounds = MapHandler.endBounds;
		var lat = startBounds.lat() - Math.abs( (endBounds.lat() - startBounds.lat())/2);
		var lng = startBounds.lng() + Math.abs( (endBounds.lng() - startBounds.lng())/2);
		return new google.maps.LatLng(lat, lng);
	},

	/* This function prevents the user from navigating away from the bounds of Cebu City that is covered by the system */
	_preventOutOfBounds: function(){
		var c = MapHandler.MAP.getCenter(),
				x = c.lng(),
				y = c.lat(),
				maxX = MapHandler.endBounds.lng(),
				minY = MapHandler.endBounds.lat(),
				minX = MapHandler.startBounds.lng(),
				maxY = MapHandler.startBounds.lat();

		if(!(x > minX && x < maxX && y > minY && y < maxY)){
			if (x < minX) x = minX;
			if (x > maxX) x = maxX;
			if (y < minY) y = minY;
			if (y > maxY) y = maxY;

			var newCenter = new google.maps.LatLng(y, x);
			MapHandler.MAP.panTo(newCenter);
			MapHandler.MAP.setCenter(newCenter);
		}
	},

	/* This function creates a custom UI Control inside the google map */
	addUIControl: function(text, position, callback) {
		var controlDiv = document.createElement('div');
		controlDiv.index = 1;
		controlDiv.style.padding = '5px';
		var controlUI = document.createElement('div');
		controlUI.style.backgroundColor = 'yellow';
		controlUI.style.border='1px solid';
		controlUI.style.cursor = 'pointer';
		controlUI.style.textAlign = 'center';
		controlDiv.appendChild(controlUI);
		var controlText = document.createElement('div');
		controlText.style.fontFamily='Arial,sans-serif';
		controlText.style.fontSize='12px';
		controlText.style.paddingLeft = '4px';
		controlText.style.paddingRight = '4px';
		controlText.innerHTML = text;
		controlUI.appendChild(controlText);

		if(typeof(callback) != 'undefined'){
			google.maps.event.addDomListener(controlUI, 'click', function() {
				callback(text);
			});
		}
		MapHandler.MAP.controls[position].push(controlDiv);
	},
	clearControls: function(){
        MapHandler.MAP.controls[google.maps.ControlPosition.BOTTOM_CENTER].clear();
        MapHandler.MAP.controls[google.maps.ControlPosition.TOP_RIGHT].clear();
        MapHandler.MAP.controls[google.maps.ControlPosition.CENTER].clear();
	},

	/*
		DEBUG FUNCTION
		This function shows the bounds(RED RECTANGLE) of Cebu City that will be covered by the system.
	*/
	showBounds: function(){
		var startBounds = MapHandler.startBounds, 
				endBounds = MapHandler.endBounds;
		var _cebuBoundsPath = [
			startBounds,
			new google.maps.LatLng(startBounds.lat(), endBounds.lng()),
			endBounds,
			new google.maps.LatLng(endBounds.lat(), startBounds.lng())
		];

		MapHandler._cebuBounds = new google.maps.Polygon({
			paths: _cebuBoundsPath,
			strokeColor: '#FF0000',
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: '#FF0000',
			fillOpacity: 0.1
		});

		MapHandler._cebuBounds.setMap(MapHandler.MAP);
		BOUNDS_VISIBILITY = true;
	},
	
	hideBounds: function(){
		MapHandler._cebuBounds.setMap(null);
		BOUNDS_VISIBILITY = false;
	}

};
