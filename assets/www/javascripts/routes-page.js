$(function(){
	MapHandler.setup({init_zoom: 13}, function(map){
		var route = {};
		route.title = $("#route-title").val();
		route.start = unescape($("#route-start").val());
		route.end = unescape($("#route-end").val());
        route.nodes = unescape($("#route-nodes").val());
        route.is_Official = $("#route-is_Official").val();

        console.log($("#route-start").val());

        $("#page-container").on("click", ".roback", function(){
        	viewPage("routes");
			$(".mapnav").show();
        });

        $(".msgbox").html("<p style=\"margin: 0 !important; \"> " + route.start + " - " + route.end + "</p>");

		//load route
		Route.init(MapHandler.MAP, false);
		Route.loadRoute(JSON.parse(route.nodes));
	});
	$(".mapnav").hide();
});