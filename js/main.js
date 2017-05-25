'use strict'

var map;
var infoWindow;
var geocoder;
var LOCATION;
var MICHIGAN_UNION = {lat: 42.2752, lng: -83.7415};
var SEARCH_CACHE = null;
var markers = [];

// MAP FUNCTIONS
function init(){
    if("geolocation" in navigator){
        navigator.geolocation.getCurrentPosition(use_coords, 
            function(error){ LOCATION = MICHIGAN_UNION },
            {   enableHighAccuarcy: true,
                timeout: 5000  // 5 seconds
        });
    }
    draw_map(MICHIGAN_UNION);
}

function use_coords(pos){
    LOCATION = new google.maps.LatLng(
        {lat: pos.coords.latitude, lng: pos.coords.longitude});
    draw_map(LOCATION);
}

function draw_map(LatLng){
    map = new google.maps.Map(document.getElementById('map'), {
        center: LatLng,
        zoom: 16
    });
    infoWindow = new google.maps.InfoWindow();
    geocoder = new google.maps.Geocoder();
}
    
function create_marker(place, node){
    var marker = new google.maps.Marker({
        map: map,
        title: place.name,
        position: place.geometry.location
    });
    (function(location){
        node.addEventListener('mouseover', function(){
            infoWindow.setContent(location.name);
            infoWindow.open(map, marker);
        });
    })(place);
    (function(location){
        google.maps.event.addListener(marker, 'click', function(){
            infoWindow.setContent(location.name);
            infoWindow.open(map, marker);
        });
    })(place);
    markers.push(marker);
    return marker;
}

// Description: Returns an array of k random ints between min and max
function k_random_ints(k, min, max){
    var ints = [];
    for(var i = 0; i < k; ++i){
        ints.push(Math.floor(Math.random() * (max - min)) + min);
    }
    return ints;
}

// Description: Creates div for displaying restaurant info in sidebar
function create_node(restaurant){
    var new_div = document.createElement("div");
    new_div.setAttribute('class', 'res-div');
    var name = document.createElement("h4");
    name.innerHTML = restaurant.name;
    
    var details = document.createElement("ul");
    
    var address = document.createElement("li");
    address.innerHTML = restaurant.formatted_address;
    details.appendChild(address);

    if('opening_hours' in restaurant){
        var open = document.createElement("li");
        open.innerHTML = restaurant.opening_hours.open_now ? "Open Now" : "Closed Now";
        details.appendChild(open);
    }

    var website_elt = document.createElement("li");
    var website = document.createElement("a");
    website.setAttribute("href", restaurant.url);
    website.innerHTML = "Website";
    website_elt.appendChild(website);
    details.appendChild(website_elt);
    
    new_div.appendChild(name);
    new_div.appendChild(details);
    return new_div;
}

// Description: Adds the restaurants data to sidebar and to the map 
function display(restaurants){
    var sidebar = document.getElementById("sidebar");
    var delete_nodes = [];
    sidebar.childNodes.forEach(function(node){
        delete_nodes.push(node);
    });
    delete_nodes.forEach(function(node){
        sidebar.removeChild(node);
    });
    markers.forEach(function(marker){
        marker.setMap(null);
        marker = null;
    });
         
    restaurants.forEach(function(rest){
        var node = create_node(rest);
        var marker = create_marker(rest, node);
        sidebar.appendChild(node);
    });
}

// Description: Issue Radar Search API call
function get_places(new_loc){
    if(SEARCH_CACHE && !new_loc){
        callback(SEARCH_CACHE, google.maps.places.PlacesServiceStatus.OK);
    }
    else{
        if(new_loc){
            SEARCH_CACHE = null;
        }
        var service = new google.maps.places.PlacesService(map);
        service.radarSearch({
            location: LOCATION,
            radius: 600,
            type: ['restaurant'] }, callback);
    }
}

function callback(results, status){
    if(status === google.maps.places.PlacesServiceStatus.OK){
        if(!SEARCH_CACHE){
            SEARCH_CACHE = results;
        }
        var rand_indices = k_random_ints(3, 0, results.length - 1);
        var restaurants = [];
        var counter = 0;
        rand_indices.forEach(function(i){
            var service = new google.maps.places.PlacesService(map);
            service.getDetails({placeId: results[i].place_id}, function(place, status){
                restaurants.push(place);
                ++counter;
                if(counter === rand_indices.length){
                    display(restaurants);
                }
            });
        });
    }
}

// Description: Use location text input to find map center
function locate_by_address(event, callback_func){
    var address = event.target.children[1].value;
    geocoder.geocode({'address': address}, function(results, status){
        if(status == "OK"){
            LOCATION = results[0].geometry.location;
            map.setCenter(LOCATION);
            callback_func(true);
        }
        else{
            console.log(status);
        }
    });
}

// Event handlers
document.getElementById("find-btn").addEventListener('click', function(event){
    event.preventDefault();
    get_places();
});

document.getElementById("user-location").addEventListener('submit', function(event){
    event.preventDefault();
    locate_by_address(event, get_places);
});
