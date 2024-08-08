for (i=0; i<runs.length; i++){
    coords = runs[i][2].features[0].geometry.coordinates[0]
    lon=0
    lat=0
    for (j=0; j<coords.length; j++){
        lon+=coords[j][0]
        lat+=coords[j][1]
    }
    lon=lon/coords.length
    lat=lat/coords.length
    runs[i].push([lon,lat])
}



/*----------------------------------------------------------------------------------------------------------------------------*/
/*Set up map instructions*/

//set up mapbox token for my account
mapboxgl.accessToken = 'pk.eyJ1Ijoic2FtYXJudyIsImEiOiJjbGl1c2F1dDAwOW02M3BueTJwdDViNHY4In0.5F8W4nYLQk7H0xjRONCGkw'; // Replace with your Mapbox access token

//instantiate my map with prefered settings
var map = new mapboxgl.Map({
    container: 'map', // Container ID
    style: 'mapbox://styles/mapbox/satellite-streets-v11', // Mapbox Satellite Streets style
    center: [-72.667, 41.551358], // Initial center coordinates (longitude, latitude)
    zoom: 13.5// Initial zoom level
});

//when the map loads in get runs from routes.js. add them as a layer and make them invisible until selected
map.on('load', function() {
    for (var i=0; i<runs.length; i++){
        addLayer(runs[i][2].features[0].geometry.coordinates[0],runs[i][0], "#C21807")
        map.setLayoutProperty(runs[i][0], 'visibility', 'none');
    }
}
);

//when you drag or wheel off a route remove the distance marker from the screen
map.on('drag', () => {
    document.getElementById("distanceMarker").style.display = 'none'
});
map.on('wheel', () => {
    document.getElementById("distanceMarker").style.display = 'none'
});

//when the mouse moves properly adjust the distance marker
map.on('mousemove', (e) => {
    //only do this for single run selected
    if (clickOrder.length != 1){
        return;
    }
    //get the coordinates of the mouse movement
    const x = e.lngLat.lng.toFixed(6); // Round the longitude to 6 decimal places
    const y = e.lngLat.lat.toFixed(6); // Round the latitude to 6 decimal places
    var point = [map.unproject(e.point).lng,map.unproject(e.point).lat];

    //take all its coordaintes and put it in the array curCoords
    var point = [map.unproject(e.point).lng,map.unproject(e.point).lat];
    var curCoords = new Array(0);
    for (var i=0; i<runs[clickOrder[0]][2].features[0].geometry.coordinates[0].length; i++){
        curCoords.push(runs[clickOrder[0]][2].features[0].geometry.coordinates[0][i])
    }
    //use function findClosestPoint to take the coordinates array of the selected run and the moved to point
    var closest = findClosestPoint(runs[clickOrder[0]][2].features[0].geometry.coordinates[0], point);
    //if there's no coordinate in vecinity of mouse then turn off the distance marker
    if (closest == null){
        document.getElementById("distanceMarker").style.display = 'none'
        return;
    }
    //if there was a close point that turn on the distance marker and put it at the closest point
    var pos = map.project(new mapboxgl.LngLat(closest[0], closest[1]));
    document.getElementById("distanceMarker").style.display = 'block';
    document.getElementById('distanceMarker').style.left = `${pos.x-15}px`; // Add an offset for better visibility
    document.getElementById('distanceMarker').style.top = `${pos.y-10}px`; 
    //find index of the close point and then take the run upto that coordiante and use turf to find the distance
    //of that run which is distance to that point to add to the distance marker
    var closeI = curCoords.indexOf(closest)
    curCoords.splice(closeI+1)
    var linestring = {
        "type": "Feature",
        "geometry": {
             "type": "LineString",
             "coordinates": curCoords
        }
    };
    //convert dist to miles
    var dist = Math.round(1.0*(turf.lineDistance(linestring)*3280.84/5280)*Math.pow(10,2))/Math.pow(10,2);
    document.getElementById("distanceMarker").innerHTML = dist;
});

/*Done setting up map instructions*/
/*----------------------------------------------------------------------------------------------------------------------------*/
/*Instantiate variables*/

/*
- ClickOrder stores the order in which multi select routes were selected to know which to deselect and such when it's turned off. 
- curSingle stores whether it's in single select or multi select mode
- isSatellite stores whether its in sattellite mode
- showingInfo stores whether the comments box is on or whether
- clear the values of the search fields
- create an empty array to store values of the fields
*/
var clickOrder = new Array(0);
var curSingle = true;
var isSatellite=true;
var showingInfo = true;
document.getElementById("dist1").value =""
document.getElementById("dist2").value =""
document.getElementById("search").value =""
var searchFields = ["","",""]

/*start the page my turning on the popup and define the close popup for exiting it*/
function showPopup() {
    overlay.style.display = 'block';
     popup.style.display = 'block';
}
//
function closePopup() {
    overlay.style.display = 'none';
    popup.style.display = 'none';
}
var overlay = document.getElementById('overlay');
var popup = document.getElementById('popup');
window.onload = showPopup;
/*finish setting up the pop up stuff*/

/*set up the route table with buttons*/
var table = document.getElementById("routes")
var row;
var cell;
for (var i=0; i<runs.length; i++){
    row = table.insertRow();
    for (var j = 0; j<2; j++){
        row.insertCell();
    }
    row.cells[0].innerHTML = runs[i][0]
    row.cells[1].innerHTML = runs[i][1]+"";
    row.cells[0].addEventListener("click", show);
    row.cells[1].addEventListener("click", show);
    row.cells[0].style.backgroundColor = "#C21807";
    row.cells[1].style.backgroundColor = '#C21807';
    row.cells[0].style.color = "white";
    row.cells[1].style.color = 'white';
}

/*Done Instantiating variables*/
/*----------------------------------------------------------------------------------------------------------------------------*/
/*Create event listeners*/

document.addEventListener('keydown', handleArrowKeys);

//handle arrows to move around in run select
function handleArrowKeys(event){
    console.log(clickOrder)
    if (!curSingle){
        return;
    }
        if (event.key === 'ArrowUp') {
            if (clickOrder[0]==0){
                event.preventDefault();
                document.getElementById("innerRouteTable").scrollTop = document.getElementById("innerRouteTable").scrollHeight+100;
            }
            else{
                doShow([clickOrder[0]-1,getTableIndex(clickOrder[0]-1)])
            } 
      } 
      if (event.key == 'ArrowDown'){
        if (clickOrder[0]==runs.length-1){
                event.preventDefault();
                console.log(clickOrder)
                doShow([0,1])
                document.getElementById("innerRouteTable").scrollTop = 0;
            }
            else{
                doShow([clickOrder[0]+1,getTableIndex(clickOrder[0]+1)])
            }
      }
}

/*save the values of the searches at beginning of the event to be able to restore if needed*/
function handleNameSearch(event){
    searchFields[0] = document.getElementById(event.target.id).value
}
function handleDist1Search(event){
    searchFields[1] = document.getElementById(event.target.id).value
}
function handleDist2earch(event){
   searchFields[2] = document.getElementById(event.target.id).value
}
/*done saving the values*/

//handle a serach event
function search(event){
    //find the field that got changed and get values of every field
    var source = document.getElementById(event.target.id);
    var text = document.getElementById("search").value;
    var d1 = document.getElementById("dist1").value;
    var d2 = document.getElementById("dist2").value;

    //create an array to get the values of the upper and lower bound if they're entered
    //if not then set them to a defined upper and lower bound
    var dist = new Array(0)
    if (!isNaN(parseFloat(d1)) && !isNaN(parseFloat(d2))){
        dist.push(parseFloat(d1))
        dist.push(parseFloat(d2))
    }
    else if (!isNaN(parseFloat(d1)) && isNaN(parseFloat(d2))){
        dist.push(parseFloat(d1))
        dist.push(100)
    }
    else if (isNaN(parseFloat(d1)) && !isNaN(parseFloat(d2))){
        dist.push(0)
        dist.push(parseFloat(d2))
    }
    else{
        dist.push(0)
        dist.push(100)
    }
    /*done getting the thresholds*/

    //see if any routes match the description
    var match = false;
    for (var i=0; i<runs.length; i++){
        if (runs[i][0].substring(0,text.length).toUpperCase()==text.toUpperCase() && runs[i][1]>dist[0] && runs[i][1]<dist[1]){
            match = true;
        }
    }

    //if not then reset the fields to before the search and print error to the screen
    if (!match){
        if (source.id == "search"){
            source.value = searchFields[0]
        }
        if (source.id == "dist1"){
            source.value = searchFields[1]
        }
        if (source.id == "dist2"){
            source.value = searchFields[2]
        }
        printError("No routes match those specifications")
        return;
    }
    /*done with reset*/

    //take the table and clear it out and then if any run matches the thresholds then add it back
    var table = document.getElementById("routes");
    var row;
    while (table.rows.length > 1) {
      table.deleteRow(1);
    }
    for (var i=0; i<runs.length; i++){
        if (runs[i][0].substring(0,text.length).toUpperCase()==text.toUpperCase() && runs[i][1]>dist[0] && runs[i][1]<dist[1]){

        row = table.insertRow();
        for (var j = 0; j<2; j++){
            row.insertCell();
        }
        row.cells[0].innerHTML = runs[i][0]
        row.cells[1].innerHTML = runs[i][1]+"";
        row.cells[0].addEventListener("click", show);
        row.cells[1].addEventListener("click", show);
        //if there's click than re add the clicked runs
        for (var j=0; j<clickOrder.length; j++){
            if (clickOrder[j]==i){
                row.cells[0].style.backgroundColor = "black";
                row.cells[1].style.backgroundColor = "black";
                continue;
            }
        }
        if (row.cells[0].style.backgroundColor!="black"){
            row.cells[0].style.backgroundColor = "#C21807";
            row.cells[1].style.backgroundColor = '#C21807';
        } 
        row.cells[0].style.color = "white";
        row.cells[1].style.color = 'white';
        }
    }
  }


function show(event){
    document.getElementById("distanceMarker").style.display = 'none'
    showingInfo=true;
    var clickedRow = event.target.parentElement;
    var tableIndex = Array.from(clickedRow.parentNode.children).indexOf(clickedRow);
    var runsIndex;
    for (var i=0; i<runs.length; i++){
        if (runs[i][0]==document.getElementById("routes").rows[tableIndex].cells[0].innerHTML){
            runsIndex=i;
        }
    }
    doShow([runsIndex,tableIndex])
}

/*Done With Event handling*/
/*----------------------------------------------------------------------------------------------------------------------------*/
/*Start showing and hiding html visibilities*/

function showInfo(runIndex){
    document.getElementById("showInfoDivText").innerHTML = runs[runIndex][3];
    console.log(clickOrder)
    if (!commentsOn){
        return
    }
    if (clickOrder.length>1){
        document.getElementById("showInfoDiv").style.display = 'none'
        document.getElementById('infoClose').style.display = 'none'
        return
    }

    document.getElementById("showInfoDiv").style.display = 'block'
    document.getElementById('infoClose').style.display = 'block'
}

function closeInfo() {
    document.getElementById("showInfoDiv").style.display = "none";
    showingInfo = false;
}

function showTable(){
    document.getElementById("show").style.display = 'none';
    document.getElementById("hide").style.display = 'block';
    document.getElementById("RouteTable").style.display = 'block';
        
    if (clickOrder.length!=0 && showingInfo){
        if (commentsOn){
            document.getElementById("showInfoDiv").style.display = 'block'

        }
    }
    document.getElementById("toggleSelect").style.left = 'max(23%, 250px)'
    document.getElementById("toggleSat").style.left = 'max(23%, 250px)'
    document.getElementById("toggleSelect").style.bottom = '55px';
    document.getElementById("toggleSat").style.bottom = '10px';
}

function hideTable(){
    document.getElementById("show").style.display = 'block';
    document.getElementById("hide").style.display = 'none';
    document.getElementById("RouteTable").style.display = 'none';
    document.getElementById("showInfoDiv").style.display = 'none'
    document.getElementById("toggleSelect").style.left = '8px';
    document.getElementById("toggleSat").style.left = '8px';
    document.getElementById("toggleSelect").style.bottom = '75px';
    document.getElementById("toggleSat").style.bottom = '30px';
}

/*Done hiding and showing html stuff*/
/*----------------------------------------------------------------------------------------------------------------------------*/
/*Do toggles*/

//toggle the Sattellite
function toggleSatellite() { 
    //remove all the layers
    for (var i = 0; i < runs.length; i++) {
        map.removeLayer(runs[i][0]);
        map.removeSource(runs[i][0]);
    }
    //change the setting of satelitte
    if (!isSatellite) {
        document.getElementById("show").style.color = "white"
        map.setStyle('mapbox://styles/mapbox/satellite-streets-v11');
        isSatellite = true;
        document.getElementById("toggleSat").textContent= "View Streets"
    } 
    else {
        map.setStyle('mapbox://styles/mapbox/streets-v11');
        document.getElementById("show").style.color = "black"
        document.getElementById("toggleSat").textContent= "View Satellite"
        isSatellite = false;
    }

    //when the style loads add the runs back
    map.on('style.load', function () {
    for (var i = 0; i < runs.length; i++) {
        addLayer(runs[i][2].features[0].geometry.coordinates[0], runs[i][0], "#C21807");
        map.setLayoutProperty(runs[i][0], 'visibility', 'none');
        for (var j=0; j<clickOrder.length; j++){
            if (clickOrder[j]==i){
                map.setLayoutProperty(runs[i][0], 'visibility', 'visible');
            }
        }
    }
  });
}

//toggle single and multi select
function toggleSelect(){
    curSingle = document.getElementById("toggleSelect").textContent != "Use Single Select";
    //if its in multi select then go through all the runs except most recent and remove it
    if (!curSingle){
        document.getElementById("toggleSelect").textContent = "Use Multi Select"
        curSingle = true;
        if (clickOrder.length>0){
            for (var i=0; i<clickOrder.length-1; i++){
                map.setLayoutProperty(runs[clickOrder[i]][0], 'visibility', 'none');
                document.getElementById("routes").rows[getTableIndex(clickOrder[i])].cells[0].style.backgroundColor = '#C21807'
                document.getElementById("routes").rows[getTableIndex(clickOrder[i])].cells[1].style.backgroundColor = '#C21807'
            }
            clickOrder[0] = clickOrder[clickOrder.length-1]
            clickOrder.splice(1)
            if (commentsOn){
                showInfo(clickOrder[0])
            }
        }
      }
      else{
            document.getElementById("toggleSelect").textContent = "Use Single Select"
            curSingle = false;
      }
}

commentsOn=true
function toggleComments(){
    if (document.getElementById("toggleComments").textContent == "Comments: On"){
        document.getElementById("toggleComments").textContent = "Comments: Off"
        document.getElementById("showInfoDiv").style.display = 'none';
        commentsOn=false
    }
    else{
        document.getElementById("toggleComments").textContent = "Comments: On"
        commentsOn=true
        if (clickOrder.length==1){
            document.getElementById("showInfoDiv").style.display = 'block'
        }
    }
}

/*Done with toggles*/
/*----------------------------------------------------------------------------------------------------------------------------*/
/* Set Up helper functions*/

//get the index in the table of a runs index
function getTableIndex(runsIndex){
    var rows = document.getElementById("routes").rows;
    for (var i=0; i<rows.length; i++){
        if (rows[i].cells[0].innerHTML==runs[runsIndex][0]){
            return i;
        }
    }
}

//function to print an error message to the screen
function printError(message){
    var errorMessage = document.getElementById('error-message');
    errorMessage.innerText = message;
    errorMessage.style.display = 'block';

    setTimeout(function() {
        errorMessage.style.display = 'none';
    }, 3000); // Display for 3 seconds (3000 milliseconds)
}

//simple distance function to get distance between points
function getMagnitude(vector) {
    return Math.sqrt(Math.pow(vector[0],2)+Math.pow(vector[1],2));
 }

//function to get the nearest point for a mousemove
function findClosestPoint(coords,point){
    //first assume the first point is closest and find the vector of it using the geometry of earth to convert lat and lon to distances
    var closestPt = coords[0];
    var closestVec =[Math.abs(365214.666667*Math.cos((Math.PI/180)*coords[0][1])*(coords[0][0]-point[0])), Math.abs(365214.666667 *(coords[0][1]-point[1]))];
    
    //now go through and for each point and see if its shorter than last to find the closest point and its index
    var curVec;
    var closestIndex = 0;
    for (var i = 1; i < coords.length; i++){
        curVec =[Math.abs(365214.666667*Math.cos((Math.PI/180)*coords[i][1])*(coords[i][0]-point[0])), Math.abs(365214.666667 *(coords[i][1]-point[1]))];
        if (getMagnitude(curVec)<getMagnitude(closestVec)){
            closestVec = curVec;
            closestIndex=i;
            closestPt = coords[i];
        }
    }
    //only return it if its close to the point and not just a hover on a random map point
    if (getMagnitude(closestVec)>250){
        return null;
    }
    return closestPt;
}

//adds a route to the map just give it the coords a color and the id for it
function addLayer(coords,name,color){
    map.addLayer({
        "id": name,
        "type": "line",
        "source": {
            "type": "geojson",
            "data": {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "LineString",
                    "coordinates": coords
                }
            }
        },
        "layout": {
            "line-join": "round",
            "line-cap": "round"
        },
        "paint": {
            "line-color": color,
            "line-width": 4
        }
    })
}
function doShow(indices){
    if (document.getElementById("routes").rows[indices[1]].cells[0].style.backgroundColor =="black"){
        map.setLayoutProperty(runs[indices[0]][0], 'visibility', 'none');
        document.getElementById("routes").rows[indices[1]].cells[0].style.backgroundColor = '#C21807'
        document.getElementById("routes").rows[indices[1]].cells[1].style.backgroundColor = '#C21807'
        clickOrder.splice(clickOrder.indexOf(indices[0]),1)
        if (clickOrder.length==0){
            document.getElementById("showInfoDiv").style.display = 'none'
        }
        else{
            showInfo(clickOrder[clickOrder.length-1])
            //if (runs[clickOrder[clickOrder.length-1]][3]!=document.getElementById("showInfoDivText").innerHTML){
              //  document.getElementById("showInfoDivText").innerHTML = runs[clickOrder[clickOrder.length-1]][3]
            //}  
        } 
    }
    else{
        map.setLayoutProperty(runs[indices[0]][0], 'visibility', 'visible');
        if (getMagnitude([map.getCenter().lng-runs[indices[0]][2].features[0].geometry.coordinates[0][0][0],map.getCenter().lat-runs[indices[0]][2].features[0].geometry.coordinates[0][0][1]])>.02){
            map.setCenter(runs[indices[0]][2].features[0].geometry.coordinates[0][0]);
            map.setZoom(13.5)
        }/*
       if (getMagnitude([map.getCenter().lng-runs[indices[0]][5][0],map.getCenter().lat-runs[indices[0]][5][1]])>.02){
            map.setCenter(runs[indices[0]][5]);
            map.setZoom(12.5)
        }*/
        document.getElementById("routes").rows[indices[1]].cells[0].style.backgroundColor = "black"
        document.getElementById("routes").rows[indices[1]].cells[1].style.backgroundColor = "black"
        if (curSingle && clickOrder.length!=0){
            for (var i=0; i<document.getElementById("routes").rows.length; i++){
                //console.log(document.getElementById("routes").rows[i].cells[0].innerHTML)
                if (document.getElementById("routes").rows[i].cells[0].innerHTML==runs[clickOrder[0]][0]){
                    document.getElementById("routes").rows[getTableIndex(clickOrder[0])].cells[0].style.backgroundColor = '#C21807'
                    document.getElementById("routes").rows[getTableIndex(clickOrder[0])].cells[1].style.backgroundColor = '#C21807'
                    break;
                }
            }
            map.setLayoutProperty(runs[clickOrder[0]][0], 'visibility', 'none');
            clickOrder = new Array(0)
        }
        clickOrder.push(indices[0])
        showInfo(indices[0])
    }
}
/*Done with helper functions*/
/*----------------------------------------------------------------------------------------------------------------------------*/
