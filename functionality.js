var clickOrder = new Array(0);
var curSingle = true;
var isSatellite=true;
var showingInfo = true;
mapboxgl.accessToken = 'pk.eyJ1Ijoic2FtYXJudyIsImEiOiJjbGl1c2F1dDAwOW02M3BueTJwdDViNHY4In0.5F8W4nYLQk7H0xjRONCGkw'; // Replace with your Mapbox access token

var map = new mapboxgl.Map({
    container: 'map', // Container ID
    style: 'mapbox://styles/mapbox/satellite-streets-v11', // Mapbox Satellite Streets style
    center: [-72.667, 41.551358], // Initial center coordinates (longitude, latitude)
    zoom: 14 // Initial zoom level
});

document.getElementById("dist1").value =""
document.getElementById("dist2").value =""
document.getElementById("search").value =""
map.on('load', function() {
    for (var i=0; i<runs.length; i++){
        addLayer(runs[i][2].features[0].geometry.coordinates[0],runs[i][0],"blue")
        map.setLayoutProperty(runs[i][0], 'visibility', 'none');
    }
}
);

map.on('drag', () => {
    document.getElementById("distanceMarker").style.display = 'none'
});

map.on('wheel', () => {
    document.getElementById("distanceMarker").style.display = 'none'
});

map.on('mousemove', (e) => {
    const x = e.lngLat.lng.toFixed(6); // Round the longitude to 6 decimal places
    const y = e.lngLat.lat.toFixed(6); // Round the latitude to 6 decimal places
    if (clickOrder.length!=1){
        return;
    }

    var point = [map.unproject(e.point).lng,map.unproject(e.point).lat];
    var curCoords = new Array(0);
    for (var i=0; i<runs[clickOrder[0]][2].features[0].geometry.coordinates[0].length; i++){
        curCoords.push(runs[clickOrder[0]][2].features[0].geometry.coordinates[0][i])
    }
    var closest = findClosestPoint(runs[clickOrder[0]][2].features[0].geometry.coordinates[0],point);
    if (closest==null){
        document.getElementById("distanceMarker").style.display = 'none'
        return;
    }
    var pos = map.project(new mapboxgl.LngLat(closest[0], closest[1]));
    document.getElementById("distanceMarker").style.display = 'block';
    document.getElementById('distanceMarker').style.left = `${pos.x-15}px`; // Add an offset for better visibility
    document.getElementById('distanceMarker').style.top = `${pos.y-10}px`; 
    var closeI = curCoords.indexOf(closest)
    curCoords.splice(closeI+1)
    var linestring = {
        "type": "Feature",
        "geometry": {
             "type": "LineString",
             "coordinates": curCoords
        }
    };
    var dist = Math.round(1.0*(turf.lineDistance(linestring)*3280.84/5280)*Math.pow(10,2))/Math.pow(10,2);
    document.getElementById("distanceMarker").innerHTML =dist;
});

map.on('click', function(e){
    if (clickOrder.length!=1){
        return;
    }
    var x = map.unproject(e.point).lng;
    var y = map.unproject(e.point).lat;
    var point = [map.unproject(e.point).lng,map.unproject(e.point).lat];
    var curCoords = new Array(0);
    for (var i=0; i<runs[clickOrder[0]][2].features[0].geometry.coordinates[0].length; i++){
        curCoords.push(runs[clickOrder[0]][2].features[0].geometry.coordinates[0][i])
    }
    var closest = findClosestPoint(runs[clickOrder[0]][2].features[0].geometry.coordinates[0],point);
    if (closest==null){
        document.getElementById("distanceMarker").style.display = 'none'
    return
    }
    var pos = map.project(new mapboxgl.LngLat(closest[0], closest[1]));
    document.getElementById("distanceMarker").style.display = 'block';
    document.getElementById('distanceMarker').style.left = `${pos.x-15}px`; // Add an offset for better visibility
    document.getElementById('distanceMarker').style.top = `${pos.y-10}px`; 
    var closeI = curCoords.indexOf(closest)
    curCoords.splice(closeI+1)
    var linestring = {
        "type": "Feature",
        "geometry": {
             "type": "LineString",
             "coordinates": curCoords
        }
    };
    var dist = Math.round(1.0*(turf.lineDistance(linestring)*3280.84/5280)*Math.pow(10,2))/Math.pow(10,2);
    document.getElementById("distanceMarker").innerHTML =dist;
});

function getMagnitude(vector) {
    return Math.sqrt(Math.pow(vector[0],2)+Math.pow(vector[1],2));
 }

document.addEventListener('keydown', handleArrowKeys);

function handleArrowKeys(event){
    if (!curSingle){
        return;
    }
      if (event.key === 'ArrowUp') {
            if (clickOrder[0]==0){
                //doShow(runs.length)
               // document.getElementById("RouteTable").scrollTop = document.getElementById("RouteTable").scrollHeight;
            }
            else{
                doShow([clickOrder[0]-1,getTableIndex(clickOrder[0]-1)])
            }
            
      } 
      if (event.key == 'ArrowDown'){
        if (clickOrder[0]==runs.length-1){
                doShow(1);
                document.getElementById("RouteTable").scrollTop = '0';
            }
            else{
                doShow([clickOrder[0]+1,getTableIndex(clickOrder[0]+1)])
            }
      }
      if (event.key == 'ArrowLeft'){
        //console.log(getTableIndex(clickOrder[0]))
      }
    }

var searchFields = ["","",""]

function handleNameSearch(event){
    searchFields[0] = document.getElementById(event.target.id).value
}

function handleDist1Search(event){
    searchFields[1] = document.getElementById(event.target.id).value
}

function handleDist2earch(event){
   searchFields[2] = document.getElementById(event.target.id).value
}

function search(event){
    var source = document.getElementById(event.target.id);
    var text = document.getElementById("search").value;
    var d1 = document.getElementById("dist1").value;
    var dist = new Array(0)
    var d2 = document.getElementById("dist2").value;
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
    var change = false;
    for (var i=0; i<runs.length; i++){
        if (runs[i][0].substring(0,text.length).toUpperCase()==text.toUpperCase() && runs[i][1]>dist[0] && runs[i][1]<dist[1]){
            change = true;
        }
    }
    if (!change){
        if (source.id == "search"){
            source.value = searchFields[0]
        }
        if (source.id == "dist1"){
            source.value = searchFields[1]
        }
        if (source.id == "dist2"){
            source.value = searchFields[2]
        }
        printError("No trails match those specifications")
        return;
    }

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

  function getTableIndex(runsIndex){
    var rows = document.getElementById("routes").rows;
    for (var i=0; i<rows.length; i++){
        if (rows[i].cells[0].innerHTML==runs[runsIndex][0]){
            return i;
        }
    }
  }

function findClosestPoint(coords,point){
    var closestPt = coords[0];
    var closestVec =[Math.abs(365214.666667*Math.cos((Math.PI/180)*coords[0][1])*(coords[0][0]-point[0])),Math.abs(365214.666667 *(coords[0][1]-point[1]))];
    var curVec;
    var closestI=0;
    for (var i =1; i<coords.length; i++){
        curVec =[Math.abs(365214.666667*Math.cos((Math.PI/180)*coords[i][1])*(coords[i][0]-point[0])),Math.abs(365214.666667 *(coords[i][1]-point[1]))];
        if (getMagnitude(curVec)<getMagnitude(closestVec)){
            closestVec = curVec;
            closestI=i;
            closestPt = coords[i];
        }
    }
    if (getMagnitude(closestVec)>250){
        return null;
    }
    return closestPt;
}
    


    var table = document.getElementById("routes")
    var row;
    var cell;
    //var button;
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
        if (!runs[i][3].includes("Comments: </p>")){
            row.cells[0].style.color = "white";
        row.cells[1].style.color = 'white';
        }
        else{
            row.cells[0].style.color = "blue";
         row.cells[1].style.color = "blue";
        }
    }

var overlay = document.getElementById('overlay');
var popup = document.getElementById('popup');
    
function showPopup() {
    overlay.style.display = 'block';
     popup.style.display = 'block';
}

function closePopup() {
    overlay.style.display = 'none';
    popup.style.display = 'none';
}
window.onload = showPopup;



function toggleSatellite() { 
    for (var i = 0; i < runs.length; i++) {
        map.removeLayer(runs[i][0]);
        map.removeSource(runs[i][0]);
    }

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

map.on('style.load', function () {
    for (var i = 0; i < runs.length; i++) {
        addLayer(runs[i][2].features[0].geometry.coordinates[0], runs[i][0], "blue");
        map.setLayoutProperty(runs[i][0], 'visibility', 'none');
        for (var j=0; j<clickOrder.length; j++){
            if (clickOrder[j]==i){
                map.setLayoutProperty(runs[i][0], 'visibility', 'visible');
            }
        }
    }
  });
}

function reverseArray(arr) {
    var reversedArr = [];
    for (var i = arr.length - 1; i >= 0; i--) {
        reversedArr.push(arr[i]);
    }
    return reversedArr;
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
            if (runs[clickOrder[clickOrder.length-1]][3]!=document.getElementById("showInfoDivText").innerHTML){
                document.getElementById("showInfoDivText").innerHTML = runs[clickOrder[clickOrder.length-1]][3]
            }  
        } 
    }
    else{
        map.setLayoutProperty(runs[indices[0]][0], 'visibility', 'visible');
        if (getMagnitude([map.getCenter().lng-runs[indices[0]][2].features[0].geometry.coordinates[0][0][0],map.getCenter().lat-runs[indices[0]][2].features[0].geometry.coordinates[0][0][1]])>.02){
            map.setCenter(runs[indices[0]][2].features[0].geometry.coordinates[0][0]);
        }
        document.getElementById("routes").rows[indices[1]].cells[0].style.backgroundColor = "black"
        document.getElementById("routes").rows[indices[1]].cells[1].style.backgroundColor = "black"
        showInfo(indices[0])
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
    }
}

function showInfo(runIndex){
    document.getElementById("showInfoDiv").style.display = 'block'
    document.getElementById("showInfoDivText").innerHTML = runs[runIndex][3];
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
        document.getElementById("showInfoDiv").style.display = 'block'
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

function toggleSelect(){
    curSingle = document.getElementById("toggleSelect").textContent != "Use Single Select";
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
        }
      }
      else{
            document.getElementById("toggleSelect").textContent = "Use Single Select"
            curSingle = false;
      }
}

function printError(message){
    var errorMessage = document.getElementById('error-message');
    errorMessage.innerText = message;
    errorMessage.style.display = 'block';

    setTimeout(function() {
        errorMessage.style.display = 'none';
    }, 3000); // Display for 3 seconds (3000 milliseconds)
}

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
            "line-color": "#C21807",
            "line-width": 4
        }
    })
}