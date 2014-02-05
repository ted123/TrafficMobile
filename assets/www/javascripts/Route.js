var Route = {
    MARKERS: [],
    SEGMENTS: [],
    ALPHAS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    ALPHA_IDX: 0,
    MAP: null, //init later
    SERVICE: null, //init later
    POLY: null, //init later
    SUGGEST_ROUTE_LISTENER: null,

    init: function(map, suggest_mode){
        Route.MARKERS = [];
        Route.SEGMENTS = [];
        Route.ALPHA_IDX = 0;
        Route.MAP = map;
        Route.SERVICE = new google.maps.DirectionsService();
        Route.POLY = new google.maps.Polyline({
            map: map,
            strokeColor: '#de5842',
            strokeOpacity: 0.6,
            strokeWeight: 5
        });
        
        if(suggest_mode){
            Route.MAP.setOptions({draggableCursor: "crosshair"});
            Route.MARKERS = [];
            google.maps.event.removeListener(Route.SUGGEST_ROUTE_LISTENER);
            Route.SUGGEST_ROUTE_LISTENER = google.maps.event.addListener(Route.MAP, "click", Route._suggestClickHandler);
        }
    },

    resetMarkers: function(){
        for (i in Route.MARKERS) {
            Route.MARKERS[i].setMap(null);
        }
        Route.ALPHA_IDX = 0;
        Route.SEGMENTS = [];
        Route.MARKERS = [];
        if(Route.POLY != null) Route.POLY.setPath([]);
    },

    _createMarkers: function(nodes){
        var pos = null,
            c = null;
            options = null,
            marker = null;

        Route.MARKERS = [];
        for(i in nodes){
            pos = new google.maps.LatLng(nodes[i].lat, nodes[i].lng);
            options = { 
                map: Route.MAP,
                position: pos,
                draggable: false,
                icon: IMG_BASE + 'plus.png'
            };
            marker = new google.maps.Marker(options);

            marker.segmentIndex = Route.MARKERS.length - 1;
        
            google.maps.event.addListener(marker, 'dragend', Route._updateSegments);
        
            Route.MARKERS.push(marker);

            if (Route.MARKERS.length > 1) {
                Route._addSegment(Route.MARKERS[Route.MARKERS.length - 2].getPosition(), pos, marker.segmentIndex);
            }
        }
    },

    _addSegment: function(start, end, segIdx) {
        Route.SERVICE.route(
            {
                origin: start,
                destination: end,
                travelMode: google.maps.DirectionsTravelMode.DRIVING
            },
            function (result, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    //store the entire result, as we may at some time want
                    //other data from it, such as the actual directions
                    Route.SEGMENTS[segIdx] = result;
                    Route.POLY.setPath(Route._getSegmentsPath());
                }
            }
        );
    },
    _getSegmentsPath: function() {
        var a, i,
            len = Route.SEGMENTS.length,
            arr = [];
        for (i = 0; i < len; i++) {
            a = Route.SEGMENTS[i];
            if (a && a.routes) {
                arr = arr.concat(a.routes[0].overview_path);
            }
        }
        return arr;
    },

    _updateSegments: function() {
        var start, end, inserts, i,
            idx = this.segmentIndex,
            segLen = Route.SEGMENTS.length, //segLen will always be 1 shorter than markers.length
            myPos = this.getPosition();
        if (segLen === 0) { //nothing to do, this is the only marker
            return;
        }
        if (idx == -1) { //this is the first marker
            start = [myPos];
            end = [Route.MARKERS[1].getPosition()];
            inserts = [0];
        } else if (idx == segLen - 1) { //this is the last marker
            start = [Route.MARKERS[Route.MARKERS.length - 2].getPosition()];
            end = [myPos];
            inserts = [idx];
        } else {//there are markers both behind and ahead of this one in the 'markers' array
            start = [Route.MARKERS[idx].getPosition(), myPos];
            end = [myPos, Route.MARKERS[idx + 2].getPosition()];
            inserts = [idx, idx + 1];
        }
        for (i = 0; i < start.length; i++) {
            Route._addSegment(start[i], end[i], inserts[i]);
        }
    },

    _suggestClickHandler: function (e) {
        //limiting the number of markers added to no more than 26. (Alphabet)
        if (Route.ALPHA_IDX > 25) { return; }

        var evtPos = e.latLng,
            c = Route.ALPHAS[Route.ALPHA_IDX++],
            marker = new google.maps.Marker({
                map: Route.MAP,
                position: evtPos,
                draggable: true,
                icon: IMG_BASE + 'plus.png' //icon: 'http://www.google.com/mapfiles/marker'+ c +'.png'
            });
        marker.segmentIndex = Route.MARKERS.length - 1;
        marker.iconChar = c;//just storing this for good measure, may want at some time
        
        google.maps.event.addListener(marker, 'dragend', Route._updateSegments);
        
        Route.MARKERS.push(marker);

        if (Route.MARKERS.length > 1) {
            Route._addSegment(Route.MARKERS[Route.MARKERS.length - 2].getPosition(), evtPos, marker.segmentIndex);
        }

    },

    getNodesStr: function(){
        var nodes = "{";
        var keys;
        for(i in Route.MARKERS){
            keys = Object.keys(Route.MARKERS[i].position)
            nodes += "\"node" + i + "\": {\"lat\": " + Route.MARKERS[i].position[keys[0]] + ", ";
            nodes += "\"lng\": " + Route.MARKERS[i].position[keys[1]] + "}";
            if(i < Route.MARKERS.length - 1) nodes += ", ";
        }
        nodes += "}";
        return nodes;
    },

    loadRoute: function(nodes){
        Route._createMarkers(nodes);
        MapHandler.MAP.setCenter(nodes[Object.keys(nodes)[0]]);
        MapHandler.MAP.setZoom(15);
    }

};