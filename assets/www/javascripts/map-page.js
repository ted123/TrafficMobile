/* Globals */
var MODES = {NORMAL: 1, SUGGEST: 2, REPORT: 3, FILTER: 4};
var MODE = MODES.NORMAL;

INTENSITIES_OFFICIAL = {};
INTENSITIES_UNOFFICIAL = {};
REPORT_MARKERS = {};
MAX_TI_VOTE = 3;
REPORT_MARKERS_COUNT=0;
ROAD_OFFICIAL = {};
ROAD_UNOFFICIAL = {};
MARKER_FILTER = "View All";
INIT_MAP_ZOOM = 15;
BOUNDS_VISIBILITY= false;
REPORT_RADIUS = 0.001; // factor == 10000
 

$(function(){
    CREATE_REPORT_LISTENER = null;
    MAXCHAR = 200;
    var sample = {};
    var x=0;
    MapHandler.setup({init_zoom: INIT_MAP_ZOOM}, function(map){
        seedTI(INTENSITIES_OFFICIAL);
        seedTI(INTENSITIES_UNOFFICIAL);

        getRoadIntensity('getRoadIntensityUnofficial', ROAD_UNOFFICIAL);
        getRoadIntensity('getRoadIntensityOfficial', ROAD_OFFICIAL, function(){
            updateRoad('updateRoadOfficial', ROAD_OFFICIAL, function(){
                updateRoad('updateRoadUnofficial', ROAD_UNOFFICIAL);
            });
        });

        
        if(typeof(TOGGLE_MARKERS_VISIBILITY) != "undefined") google.maps.event.removeListener(TOGGLE_MARKERS_VISIBILITY);
        TOGGLE_MARKERS_VISIBILITY = google.maps.event.addListener(MapHandler.MAP, 'zoom_changed', function() {
                toggleMarkersByFilter();
        });

        getReports();

    });

    $("body").on("click", "#addReport", _addReportHandler);
    $("body").on("click", "#plotRoute", _suggestRouteHandler);
    $(".mapnav").on("click", ".search", _gotoHandler);
    $(".mapnav").on("click", ".suggest", _suggestRoutePopop);
    $(".mapnav").on("click", ".report", _createReport);
    // $(".mapnav").on("click", ".filter", function(){});
    $("#suggestRoute").on("click", ".closeSR", function(){suggestToNormal();});
    $("#info").hide();

    $("#suggestRoute").on("input", ".limited-input", function(e){
        var max = $(this).data("max-length");
        var value = this.value;
        if(value.length > parseInt(max)){
            this.value = value.substring(0, parseInt(max));
            _showSuggestRouteError("Max length of " + (this.id || "input") + " is " + max, 1000);
        }
    });
});

function setmapPageDefault(){
    MARKER_FILTER = "View All";
    toggleMarkersByFilter();

    MODE = MODES.NORMAL;
    MapHandler.MAP.setZoom(INIT_MAP_ZOOM);
    $(".msgbox").hide();
    $(".navbox").hide();
    $('.mapnav').show();
}
var Traffic_intensity_id, Click;

function _gotoHandler(){
    $(".slError1").hide();
    $(".slError2").hide();
    $(".slError3").hide();
    $('#name').val("");
    $("#SearchLandMark").trigger("open.mm").off("opened.mm").on("opened.mm",function(){
        $("#name").focus();
    });
    $("#landmark-results").html('');
}

function _showSuggestRouteError(msg, duration){
    $("#errorMsg span").text(msg);
    $("#errorMsg").show();
    setTimeout(function(){
        $("#errorMsg").hide("slow");
    }, parseInt(duration) || 1000);
}

function _suggestRouteHandler(e){
   
    MARKER_FILTER = "Hide All";
    toggleMarkersByFilter();
    $("#mapstat").hide();
    $('.mapnav').hide();
    var expDay = $('#route-durationDays').val();
    var expHour = $('#route-durationHours').val();

    if(IS_OFFICIAL == 1){
        if(expDay == ""){       expDay = "0";   }
        if(expHour == ""){      expHour = "0";  }
    }
    if( ($('#origin').val() == "") || ($('#destination').val() == "")){
        _showSuggestRouteError('Both fields must not be blank!', 1000);
        return;
    }else if((expDay=="0") && (expHour=="0")){
        _showSuggestRouteError('Duration must not be zero!', 1000);
        return;
    }
    e.preventDefault();
    $(".mapnav").hide();
    $("#suggestRoute").trigger("close");
    START = $("#origin").val();
    END = $("#destination").val();

    ROUTE_DURATION_MINS = ROUTES_CONFIG.min;
    if(IS_LOGGEDIN){
        ROUTE_DURATION_DAYS = $("#route-durationDays").val() || 0;
        ROUTE_DURATION_HOURS = $("#route-durationHours").val() || 0;
    }else{
        ROUTE_DURATION_DAYS = ROUTES_CONFIG.day;
        ROUTE_DURATION_HOURS = ROUTES_CONFIG.hour;
    }
    var suggest_guide = "Click on map to place markers, drag markers to change route";
    $(".msgbox").html("<p style=\"margin: 0 !important; \"> " + suggest_guide + "</p>");
    $(".msgbox").show();
    $(".navbox").show();
    $("#page-container").on("click", ".roback", function(){
        viewPage("routes");
        $(".mapnav").show();
    });

    $("#page-container").off("click", ".srcancel").on("click", ".srcancel", suggestToNormal);
    $("#page-container").off("click", ".srclear").on("click", ".srclear", Route.resetMarkers);
    $("#page-container").off("click", ".srdone").on("click", ".srdone", _saveRoute);

    MapHandler.MAP.setZoom(16);
    Route.init(MapHandler.MAP, true); 
    
}

function getReports(){
    REPORT_MARKERS = {};
    
    $(".reports").each(function(){
        var myLatlng = new google.maps.LatLng($(this).data('lat'),$(this).data('lng'));
        var reportIcon = ($(this).data('type').replace(/\s+/g, '')).toLowerCase();

        var marker = new google.maps.Marker({
            position: myLatlng,
            map: MapHandler.MAP,
            title: $(this).data('type'),
            id: $(this).data('id'),
            icon: IMG_BASE + reportIcon + '.png'
        });

        REPORT_MARKERS[$(this).data('id')] = marker;
        REPORT_MARKERS_COUNT++;

        google.maps.event.addListener(marker, 'click', function(event) {
            var id = "#reports-" + this.id;
            var status = ($(id).data('official')) ? 'Verified': 'Not Verified';
            var d = $(id).data('created').split("-");
            d[1] = parseInt(d[1]) + 1;
            var createDate = d.join("-");

            $('#downvoteReport').removeAttr("disabled");
            $('#openReport').trigger('open');
            modalTop('openReport');
            $('.displayReportInfo').html('<div class="form-group"><label>Report Type:</label> <div class="form-control">' + $(id).data('type') + '</div> </div> <div class="form-group"> <label>Details:</label> <div class="form-control" style="overflow: auto; height: 100%; min-height:42px;">' + unescape($(id).data('details')) + '</div> </div>');
            $('.datestamp').html('<label><em>Created at:</em> '+ createDate + ' </label>');
            $('.statstamp').html(status);
            if(status == 'Verified'){
                $('.statstamp').addClass('verified');
            }else
                $('.statstamp').removeClass('verified');

            $('#downvotes').html($(id).data('downvotes'));
            $('#downvotesAmt').val($(id).data('downvotes'));
            $('#reportId').val($(id).data('id'));
        });
    });
}

function getRoadIntensity(link,obj, cb){
    $.ajax({
        url: "data/road.traffic",
        type: 'GET',
        success: function(response){
            var flightPlanCoordinates = [];
            roadDATA = JSON.parse(response);
            for(i in roadDATA){
                road = roadDATA[i].road;
                flightPlanCoordinates = [];
                for(j in road){
                    var s = new google.maps.LatLng(road[j].lat, road[j].lng);
                    flightPlanCoordinates.push(s);
                }
                var flightPath = new google.maps.Polyline({
                    path: flightPlanCoordinates,
                    geodesic: true,
                    clickable: false,
                    strokeColor: '#33b100',
                    strokeOpacity: 1.0,
                    strokeWeight: 4,
                    id: roadDATA[i].id
                }); 

                obj[flightPath.id] = flightPath;
                flightPath.setMap(MapHandler.MAP);
            }

            if(typeof(cb) != "undefined"){
                cb();
            }else{
                MARKER_FILTER = "View All";
                toggleMarkersByFilter();
            }
            
        }
    });
}
function updateRoad(link,obj, cb){
    $.ajax({
        url: BASE_URL + link,
        type: 'POST',
        data: {},
        success: function(response){
            for(i in response){
              if(typeof(obj[ response[i].id ]) != "undefined"){
                if(response[i].status == "Light" && (response[i].lane == 1 || response[i].lane == 0)){
                  obj[response[i].id].setOptions({strokeColor: '#33b100'});
                }else if(response[i].status == "Medium" && (response[i].lane == 1 || response[i].lane == 0)){
                  obj[response[i].id].setOptions({strokeColor: '#ffcc00'});
                }else if(response[i].status == "Heavy" && (response[i].lane == 1 || response[i].lane == 0)){
                  obj[response[i].id].setOptions({strokeColor: '#990000'});
                }
              }

            }
            if(typeof(cb) != "undefined"){  cb();   }
        }
    });
}
function getUpdate(link,obj){
    $.ajax({
        url: BASE_URL + link,
        type: 'POST',
        success: function(response){
            for(i in response){
                if(obj[response[i].id] == INTENSITIES_UNOFFICIAL[response[i].id]){
                    if(obj[response[i].id]) obj[response[i].id].setVisible(false);
                }

                if(typeof(obj[ response[i].id ]) != "undefined")
                obj[ response[i].id ].setIcon( getIcon(response[i].lane_1, response[i].lane_2) );
            }
        }
    });
}

function seedTI(obj){
    var marker,mark;
    var x = 0;
    var marker_holder = {};
    
    IN = [];
    IN_E = [];
    $.ajax({
        url: "data/node.traffic",
        type: 'GET',
        success: function(response){
            intensity = JSON.parse(response);
            for(i in intensity){
                if(!marker_holder[intensity[i].id]){
                    marker_holder[intensity[i].id] = [];
                    var _marker = new google.maps.Marker({
                        position: new google.maps.LatLng(intensity[i].lat , intensity[i].lng),
                        map: MapHandler.MAP,
                        title: 'Traffic' + intensity[i].id,
                        visible: true,
                        id: intensity[i].id,
                        icon: IMG_BASE + 'g1.png',
                        lane: intensity[i].lane_1,
                    });

                    obj[_marker.id] = _marker;
                    google.maps.event.addListener(_marker, 'click', function(event) {
                        TI_COUNT = parseInt( (localStorage.getItem('TI-'+ this.id) == null) ? 0 : localStorage.getItem('TI-'+ this.id) );
                        if(TI_COUNT >= MAX_TI_VOTE){
                            alert("CAN'T VOTE");
                        }else{
                            Traffic_intensity_id = this.id;
                            if(MARKER_FILTER.toLowerCase() == OFFICIAL_TRAFFIC.toLowerCase() || MARKER_FILTER.toLowerCase() == "view all"){
                                lastUpdate = "getLastUpdateOfficial";
                            }else{
                                $(".msgTI").hide(); 
                                lastUpdate = "getLastUpdateUnofficial";
                            }
                            $.ajax({
                                url: BASE_URL + lastUpdate,
                                type: 'POST',
                                data: {id: this.id},
                                success: function(response){
                                    $(".ti_icon").html("<img src = " +getIcon(response[0].lane_1, response[0].lane_2) +">");
                                    var out = "";
                                    if(response[0].last_update == "0000-00-00 00:00:00"){
                                        out = "-- --:--";
                                    }
                                    else{
                                        var date1 = new Date(response[1]);
                                        var date2 = new Date(response[0].last_update);
                                        var ddf = date1.getDate() - date2.getDate();
                                        var hdf = date1.getHours() - date2.getHours();
                                        var mdf = date1.getMinutes() - date2.getMinutes();
                                        
                                        if(mdf < 0){
                                            mdf = mdf +  60;
                                            hdf--;
                                        }
                                        if(hdf < 0){
                                            hdf = hdf + 24;
                                            ddf--;
                                        }
                                        if(ddf != 0) out += ddf+"D ";
                                        if(hdf != 0) out += hdf+"H ";
                                        if(mdf != 0) out += mdf + "M ";
                                        if(out=="") out = " just now";
                                        else out += " ago";
                                    }
                                    if(MARKER_FILTER.toLowerCase() == OFFICIAL_TRAFFIC.toLowerCase() || MARKER_FILTER.toLowerCase() == "view all"){
                                        $(".lastUpdate").html(out);
                                    }else{
                                        $(".lastUpdate").html(out);
                                    }
                                }
                                });
                            if(IS_LOGGEDIN)
                                $(".msgTI").hide();

                            if(this.lane != "NONE"){
                                $(".lane-options").show();
                                $(".two-lanes").show();
                                $(".lupdate").show();
                                $('#TwoWay').trigger('open');
                                modalTop('TwoWay');
                            }else{
                                $(".one-lane").show();
                                $(".lupdate").show();
                                $('#OneWay').trigger('open');
                                modalTop('TwoWay');
                            }
                        }
                    });
                    IN.push(_marker);
                }
                marker_holder[intensity[i].id].push(intensity[i]);

                if(obj == INTENSITIES_OFFICIAL){
                    getUpdate('getUpdateOfficial',INTENSITIES_OFFICIAL);
                }else{
                    getUpdate('getUpdateUnofficial',INTENSITIES_UNOFFICIAL);
                }
                
            }


        },
        error: function(){
            alert("ERROR");
        }
    });
}

function _saveRoute(){
    if(Route.MARKERS.length < 2){
        $("#alertDialog").html("Please plot a route.").removeClass().addClass('alert alert-danger');
        $("#alertbox").trigger("open");
        return;
    }
    var nodes = Route.getNodesStr(); //TRAP later

    var routes = {
        title: START + " " + END,
        start: START,
        end: END,
        days: ROUTE_DURATION_DAYS,
        hours: ROUTE_DURATION_HOURS,
        min: ROUTE_DURATION_MINS,
        nodes: nodes
    };
    $.ajax({
        url: BASE_URL + 'addRoutes',
        type: 'POST',
        data: routes, 
        success: function(response){
            if(response == "TRUE"){
                $("#alertDialog").html("Success: Suggested routes has been added.").removeClass().addClass('alert alert-success');
                $("#alertbox").trigger("open");
                if(!IS_LOGGEDIN){
                    SUGGEST_NUMBER += 1;
                    setHtmlStorage('Route-create', SUGGEST_NUMBER, 60);
                }
                suggestToNormal();
            }else{
                $("#alertDialog").html("Error: Adding the suggested route has failed.").removeClass().addClass('alert alert-danger');
                $("#alertbox").trigger("open");
            }
        }
    });
}

function suggestToNormal(){
    MARKER_FILTER = "View All";
    toggleMarkersByFilter();
    $(".msgbox").hide();
    $(".navbox").hide();
    $('.mapnav').show();
    MODE = MODES.NORMAL;
    MapHandler.MAP.setZoom(INIT_MAP_ZOOM); //ZOOM OUT
    Route.resetMarkers();
    MapHandler.MAP.controls[google.maps.ControlPosition.BOTTOM_CENTER].clear();
    MapHandler.MAP.controls[google.maps.ControlPosition.TOP_RIGHT].clear();
    $("#mapstat").html("<p style=\"margin: 0 !important;\">OFFICIAL</p>").addClass('verified');
    $("#mapstat").show();
    MapHandler.MAP.setOptions({draggableCursor: "default"});
    
    google.maps.event.removeListener(Route.SUGGEST_ROUTE_LISTENER);
}
/* end of suggest route */

/* Start of 'Report Module' */
function _addReportHandler(){

    var expDay = $('#durationDays').val();
    var expHour = $('#durationHours').val();
    var startLat = 10.360515;
    var startLng = 123.874441;
    var endLat = 10.291105;
    var endLng = 123.92448;

    $("#mapstat").hide();
    $(".mapnav").hide();
    if(IS_OFFICIAL == 1){
        if(expDay==""){expDay = "0";}
        if(expHour==""){expHour = "0";}
    }

    if((expDay=="0") && (expHour=="0")){
        $("#info span#msg").text('Invalid input of duration!');
        $("#info").show();
        setTimeout(function(){  $("#info").hide("slow"); }, 1000);  
    }else{
        $("#reportSituation").trigger("close");
        var report_guide = "Click on map to select location";
        var report2_guide = "Cannot place report here. Place report inside the RED area.";
        $(".msgbox").html("<p style=\"margin: 0 !important; \"> " + report_guide + "</p>").show();
        
        CREATE_REPORT_LISTENER = google.maps.event.addListener(MapHandler.MAP, "click", function(event) {
            var lat = event.latLng.lat();
            var lng = event.latLng.lng();

            if( ((lat <  startLat) && (lng > startLng)) && ((lat >  endLat) && (lng < endLng)) ){

                 var adjReport = _hasAdjacentReport(lat, lng);
                 if(adjReport != null){
                    $('#reportExist').trigger("open");
                    modalTop('reportExist');
                    $('#existReportDetails').html('<div class="form-group"><label>Report Type:</label> <div class="form-control">' + $("#reports-"+adjReport.id).data('type') + '</div> </div> <div class="form-group"> <label>Details:</label> <div class="form-control" style="overflow: auto; height: 100%; min-height:42px;">' + unescape($("#reports-"+adjReport.id).data('details')) + '</div> </div>');
                    $('#oldReportDetails').val( unescape($("#reports-"+adjReport.id).data('details')) );
                    $('#report_id').val( adjReport.id );
                    $('#newReportDetails').html( $('#reportDetails').val());
                 }
                 else{
                    $('#confirmReport').trigger("open");
                    modalTop('confirmReport');
                    $('#lat').val(lat);
                    $('#lng').val(lng);
                    $('#days').val(expDay);
                    $('#hours').val(expHour);
                    $('#confirmDetails').html('<div class="col-md-6"> <div class="form-group"> <label class="control-label">Report Type:</label> <div class="form-control">'+$('#reportType').val()+'</div> </div> <div class="form-group"> <label class="control-label" rows="3">Details:</label> <div class="form-control" style="overflow: auto; height: 100% !important;">'+$('#reportDetails').val()+' </div> </div> </div> <div class="col-md-6"> <div class="form-group" style="margin-bottom: 0px;"> <div style="text-align: center; padding-top: 30px;"><img src="https://maps.googleapis.com/maps/api/staticmap?center='+lat+','+lng+'&zoom=15&size=240x200&markers='+lat+','+lng+'&sensor=false"><br/> <p style="font-size: x-small !important; line-height:1 !important; margin-bottom: 0px;">Lat:'+lat+'<br/>Lng:'+lng+'</p> </div> </div> </div>');
                }
            }
            else{
                if(!BOUNDS_VISIBILITY){
                    $(".msgbox").html("<p style=\"margin: 0 !important; \"> " + report2_guide + "</p>").show();
                    MapHandler.showBounds();
                    setTimeout(function(){
                        MapHandler.hideBounds();
                        $(".msgbox").html("<p style=\"margin: 0 !important; \"> " + report_guide + "</p>").show();
                    }, 2000);
                }
            }
        });
    }
}
    
function _createReport(){
    //var create_report_cookie = get_cookie("Report-create");
    REPORT_NUMBER = parseInt( (localStorage.getItem('Report-create') == null) ? 0 : localStorage.getItem('Report-create') );

    //if(create_report_cookie < MAX_CREATE_REPORT){
    if(REPORT_NUMBER < REPORTS_CONFIG.max_create||IS_LOGGEDIN){

         if(MODE == MODES.NORMAL){
            MODE = MODES.REPORT;

            MARKER_FILTER = "Hide All";
            toggleMarkersByFilter();

            $('#reportDetails').val("");
            $('#durationDays').val("");
            $('#durationHours').val("");
            $('#txtCount').html(MAXCHAR);
            $(".limitdicator").removeClass('atlimit');
            $("#reportDetails").removeClass('atlimit');
            $('#reportSituation').trigger("open");
            modalTop('reportSituation');
        }else{
            alert('report - invalid action');
        }
    }
    else{
        alert("Can't create anymore report.");
    }
}

function _hasAdjacentReport(lat, lng){
    if(REPORT_MARKERS.length == 0) return false;

    var check_report = new google.maps.LatLng(lat, lng);
    var keys = Object.keys(check_report);
    var d = 0;
    
    for(i in REPORT_MARKERS){
        c = new google.maps.LatLng(REPORT_MARKERS[i].position[keys[0]], REPORT_MARKERS[i].position[keys[1]]);
         
        d = Math.sqrt(Math.pow(Math.abs(c[keys[0]] - check_report[keys[0]]), 2) + Math.pow( Math.abs(c[keys[1]] - check_report[keys[1]]), 2));

        if(d <= REPORT_RADIUS){
            return REPORT_MARKERS[i];   
        }
    }
    return null;
}

function _suggestRoutePopop(){
    SUGGEST_NUMBER = parseInt( (localStorage.getItem('Route-create') == null) ? 0 : localStorage.getItem('Route-create') );
    if(SUGGEST_NUMBER<ROUTES_CONFIG.max_create||IS_LOGGEDIN){
        $('#origin').val("");
        $('#destination').val("");
        $('#route-durationDays').val("");
        $('#route-durationHours').val("");
        $("#suggestRoute #errorMsg").hide();
        $("#suggestRoute").trigger('open');
        modalTop('suggestRoute');
    }else{
        alert("Can't create routes anymore.");
    }
}
