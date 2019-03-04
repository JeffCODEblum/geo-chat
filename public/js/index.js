var MyApp = angular.module("MyApp", []);
var socket = io();

MyApp.controller('mainCtrl', function($scope, $http, $compile) {
	$scope.newPost = {
		heading: "",
		body: "",
		coords: {}
	};

	$scope.post = function() {
		socket.emit('post', $scope.newPost);
	}

	require(["esri/map", "dojo/domReady!"], function(Map) {
		var map = new Map("map", {
		  center: [-118, 34.5],
		  zoom: 8,
		  basemap: "topo",
		  height: window.innerHeight,
		  width: window.innerWidth
		});
		map.on("load", function() {
			document.getElementById("overlay").style.left = document.getElementById("map").getBoundingClientRect().left;
			var gl = new esri.layers.GraphicsLayer();
			map.addLayer(gl);
	
			navigator.geolocation.getCurrentPosition(function(pos) {
				console.log(pos);
				var coords = pos.coords;
				var point = new esri.geometry.Point(coords.longitude, coords.latitude);
				map.centerAt(point);
				$scope.newPost.coords = {longitude: coords.longitude, latitude: coords.latitude};
				socket.emit('position', {longitude: coords.longitude, latitude: coords.latitude});
			}, function(error) {
				console.log(error);
			});

			function run() {
				socket.emit('update');
				setTimeout(run, 1000/10);
			}
			run();
	
			var markers = [];
			function getMarkerById(id) {
				for (var i = 0; i < markers.length; i++) {
					if (markers[i]._id == id) {
						return markers[i];
					}
				}
				return false;
			}
			socket.on('update', function(data) {
				document.getElementById('overlay').innerHTML = "";
				//markers = data;
				for (var i = 0; i < data.length; i++) {
					var marker = getMarkerById(data[i]._id);
					if (!marker) {
						marker = data[i];
						marker.visible = true;
						markers.push(marker);
					}
					var point = new esri.geometry.Point(data[i].coords.longitude, data[i].coords.latitude);
					var symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE);
					var graphic = new esri.Graphic(point, symbol);
					gl.add(graphic);

					var point2 = esri.geometry.toScreenPoint(map.extent, map.width, map.height, point);

					$('#overlay').append(`
						<div id='marker${i}' style="width: 100px; height: 100px;" class="marker-wrapper">
							<div id='marker${i}well' class="marker-well" style="padding: 10px; background-color: rgba(255, 255, 255, 0.5); width: 100px">
								<h4 id='marker${i}Heading' class="marker-heading"></h4>
								<p id='marker${i}Body' class="marker-body"></p>
							</div>
						</div>
					`);
					//console.log(marker);
					document.getElementById('marker' + i).style.position = "absolute";
					document.getElementById('marker' + i).style.left = point2.x + "px";
					document.getElementById('marker' + i).style.top = point2.y + "px";
					document.getElementById('marker' + i + 'Heading').innerText = data[i].heading;
					document.getElementById('marker' + i + 'Body').innerText = data[i].body;
					if (!marker.visible) document.getElementById('marker' + i).style.visibility = 'hidden';
				}
			});

			// $(document).on('click', function(e) {
			// 	console.log(e.pageX, e.pageY);
			// 	for (var i = 0; i < markers.length; i++) {
			// 		var el = document.getElementById('marker' + i);
			// 		var rect = el.getBoundingClientRect();
			// 		if (e.pageX > rect.x && e.pageX < rect.x + rect.width && e.pageY > rect.y && e.pageY < rect.y + rect.height) {
			// 			markers[i].visible = !markers[i].visible;
			// 			console.log(markers[i]);
			// 		}
			// 	}
			// 	console.log(markers.length);
			// });

			document.body.addEventListener('touchstart', function(e) {
				for (var i = 0; i < markers.length; i++) {
					var el = document.getElementById('marker' + i);
					var rect = el.getBoundingClientRect();
					if (e.touches[0].pageX > rect.left && e.touches[0].pageX < rect.right && e.touches[0].pageY > rect.top && e.touches[0].pageY < rect.bottom) {
						markers[i].visible = !markers[i].visible;
						console.log(markers[i]);
					}
				}
			});

			document.body.addEventListener('click', function(e) {
				console.log(e.pageX, e.pageY);
				for (var i = 0; i < markers.length; i++) {
					var el = document.getElementById('marker' + i);
					var rect = el.getBoundingClientRect();
					if (e.pageX > rect.x && e.pageX < rect.x + rect.width && e.pageY > rect.y && e.pageY < rect.y + rect.height) {
						markers[i].visible = !markers[i].visible;
						console.log(markers[i]);
					}
				}
				console.log(markers.length);
			});
	
			// map.on('click', function(event) {
			// 	for (var i = 0; i < markers.length; i++) {
			// 		var markerPosition = esri.geometry.lngLatToXY(markers[i].coords.longitude, markers[i].coords.latitude);
			// 		var dx = event.mapPoint.x - markerPosition[0];
			// 		var dy = event.mapPoint.y - markerPosition[1];
			// 		var distance = Math.sqrt(dx * dx + dy * dy);
			// 		console.log(distance);
			// 		if (distance < 100) {
			// 			console.log("you clicked user");
			// 		}
			// 	}
			// });
		});
	  });



});



