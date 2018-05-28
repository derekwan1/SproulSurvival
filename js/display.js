/*
TO-DO:
*/ 


/**
 *
 * KROSSY ROAD
 * ----
 * Simple game for education purposes, by Derek Wan
 *
 */

var Colors = {
    red:0xff0000,
    white:0xffffff,
    roadBlack: 0x112222,
    orange:0xf47a41,
    black: 0x000000, 
    silver: 0x999999,
    redDark: 0xb00000,
    white:0xd8d0d1,
    brown:0x59332e,
    pink:0xF5986E,
    brownDark:0x23190f,
    blue:0x68c3c0,
    green:0x669900,
    greenDark:0x496d01,
    golden:0xff9900,
    darkBlue: 0x1341c1,
    lightBlue: 0xadd8e6, 
    yellow: 0xc5c500, 
    darkYellow: 0x969602
};

/**
 *
 * STEP 1
 * ------
 * Customize the car colors.
 */

var bodyColor = Colors.brown;
var roofColor = Colors.brown;
var bumperColor = Colors.brownDark;
var grateColor = Colors.brownDark;
var doorColor = Colors.brown;
var handleColor = Colors.brownDark;
var cars = [];
var score = 0;
var highscore = localStorage.getItem("highscore");
var firstLanes = [];
var markers = [];
var powerUps = [];
var invincible = 0;
var invincibleMoses = 0;
var slowDown = 0;

if (highscore == null) {
    highscore = 0;
}

/********** End step 1 **********/

function init() {
    // set up the scene, the camera and the renderer
    createScene();

    // add the lights
    createLights();

    // add the objects

    createGround("initial", 0);

    createChicken();

    createControls();
    // start a loop that will update the objects' positions
    // and render the scene on each frame

    loop();
}

/**
 *
 * RENDER
 * ------
 * Initial setup for camera, renderer, fog
 *
 * Boilerplate for scene, camera, renderer, lights taken from
 * https://tympanus.net/codrops/2016/04/26/the-aviator-animating-basic-3d-scene-threejs/
 */
var scene,
        camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH,
        renderer, container, car;

function createScene() {
    // Get the width and the height of the screen,
    // use them to set up the aspect ratio of the camera
    // and the size of the renderer.
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth - 325;

    // Create the scene
    scene = new THREE.Scene();

    // Add a fog effect to the scene; same color as the
    // background color used in the style sheet
    //scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

    // Create the camera
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60;
    nearPlane = 1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
        );

    // Set the position of the camera
    
    camera.position.x = -150;
    camera.position.z = 150;
    camera.position.y = 500;
    camera.lookAt(150, 0, 125);

    //Debugging position for removing passed
    //camera.position.y = 1500;
    //camera.lookAt(-1500, 0, 0);

    // Create the renderer
    renderer = new THREE.WebGLRenderer({
        // Allow transparency to show the gradient background
        // we defined in the CSS
        alpha: true,

        // Activate the anti-aliasing; this is less performant,
        // but, as our project is low-poly based, it should be fine :)
        antialias: true
    });

    // Define the size of the renderer; in this case,
    // it will fill the entire screen
    renderer.setSize(WIDTH, HEIGHT);

    // Enable shadow rendering
    renderer.shadowMap.enabled = true;

    // Add the DOM element of the renderer to the
    // container we created in the HTML
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);

    // Listen to the screen: if the user resizes it
    // we have to update the camera and the renderer size
    window.addEventListener('resize', handleWindowResize, false);
}

function handleWindowResize() {
    // update height and width of the renderer and the camera
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}

/**
 *
 * LIGHTS
 * ------
 * Utilities for applying lights in scene
 */
var hemisphereLight, shadowLight;

function createLights() {
    // A hemisphere light is a gradient colored light;
    // the first parameter is the sky color, the second parameter is the ground color,
    // the third parameter is the intensity of the light
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)

    // A directional light shines from a specific direction.
    // It acts like the sun, that means that all the rays produced are parallel.
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);

    // Set the direction of the light
    shadowLight.position.set(150, 350, 350);

    // Allow shadow casting
    shadowLight.castShadow = true;

    // define the visible area of the projected shadow
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    // define the resolution of the shadow; the higher the better,
    // but also the more expensive and less performant
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    // to activate the lights, just add them to the scene
    scene.add(hemisphereLight);
    scene.add(shadowLight);
}

/**
 *
 * OBJECTS
 * -------
 * Definitions and constructors for car, fuel, tree, ground
 */
var car, fuel, ground, trees = [], collidableTrees = [], numTrees = 10,
    collidableFuels = [];

/**
 * Generic box that casts and receives shadows
 */
function createBox(dx, dy, dz, color, x, y, z, notFlatShading) {
    var geom = new THREE.BoxGeometry(dx, dy, dz);
    var mat = new THREE.MeshPhongMaterial({color:color, flatShading: notFlatShading != true});
    var box = new THREE.Mesh(geom, mat);
    box.castShadow = true;
    box.receiveShadow = true;
    box.position.set( x, y, z );
    return box;
}

function createSphere(dx, dy, dz, color, x, y, z, notFlatShading) {
    var geometry = new THREE.SphereGeometry(dx, dy, dz);
    var material = new THREE.MeshPhongMaterial({color:color, flatShading: notFlatShading != true});
    var sphere = new THREE.Mesh(geometry, material);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    sphere.position.set( x, y, z );
    return sphere;
}

/**
 * Generic cylinder that casts and receives shadows
 */
function createCylinder(radiusTop, radiusBottom, height, radialSegments, color,
                        x, y, z) {
    var geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
    var mat = new THREE.MeshPhongMaterial({color:color, flatShading: true});
    var cylinder = new THREE.Mesh(geom, mat);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    cylinder.position.set( x, y, z );
    return cylinder;
}

/**
 * Cylinder with rotation specific to car
 */
function createTire(radiusTop, radiusBottom, height, radialSegments, color, x, y, z) {
    var cylinder = createCylinder(radiusTop, radiusBottom, height, radialSegments, color, x, y, z);
    cylinder.rotation.x = Math.PI / 2;  // hardcoded for tires in the car below
    return cylinder;
}

/**
 * Template objects
 */
 function Chicken(color, colorString) {

    this.mesh = new THREE.Object3D();

    var head = createBox(20, 40, 30, color, 0, 40, 0);
    var beak = createBox(6, 6, 10, Colors.orange, 0, 50, 20);
    var gobble = createBox(6, 8, 6, Colors.red, 0, 43, 18.5);
    var hat = createBox(9, 6, 12.5, Colors.red, 0, 63, 0);
    var rightEye = createBox(4, 4, 4, Colors.black, -9, 50, 5);
    var leftEye = createBox(4, 4, 4, Colors.black, 9, 50, 5);
    var rightWing = createBox(10, 10, 30, color, -13, 30, -5);
    var leftWing = createBox(10, 10, 30, color, 13, 30, -5);

    var rightLeg = createBox(5, 28, 5, Colors.orange, -7, 15, -5);
    var leftLeg = createBox(5, 28, 5, Colors.orange, 7, 15, -5);
    var rightFoot = createBox(10, 2, 10, Colors.orange, -7, 0, -5);
    var leftFoot = createBox(10, 2, 10, Colors.orange, 7, 0, -5);

    var tail = createBox(20, 20, 10, color, 0, 30, -21);
    var tailEnd = createBox(10, 10, 5, color, 0, 30, -29);

    this.mesh.add(head);
    this.mesh.add(beak);
    this.mesh.add(gobble);
    this.mesh.add(rightEye);
    this.mesh.add(leftEye);
    this.mesh.add(hat);
    this.mesh.add(rightWing);
    this.mesh.add(leftWing);
    this.mesh.add(rightLeg);
    this.mesh.add(leftLeg);
    this.mesh.add(rightFoot);
    this.mesh.add(leftFoot);
    this.mesh.add(tail);
    this.mesh.add(tailEnd);

    this.mesh.rotation.y = Math.PI/2;
    this.color = colorString;

    this.orient = function(direction) {
        if (direction.z < 0) {
            this.mesh.rotation.y = Math.PI;
        }
        if (direction.z > 0) {
            this.mesh.rotation.y = 0;
        }
        if (direction.x > 0) {
            this.mesh.rotation.y = Math.PI/2;
        }
        if (direction.x < 0) {
            this.mesh.rotation.y = -Math.PI/2;
        }
    }

    this.update = function(direction) {
        this.orient(direction);
        this.mesh.position.addScaledVector(direction, 120);
    }
}

function Car() {

    this.mesh = new THREE.Object3D();

    var body = createBox( 100, 30, 50, Colors.yellow, 0, 0, 0 );
    var roof = createBox( 60, 20, 45, Colors.white, -10, 25, 0);
    var bumper = createBox( 90, 10, 45, bumperColor, 10, -10, 0 );
    var headLightLeft = createBox( 5, 5, 5, Colors.white, 50, 5, 15 );
    var headLightRight = createBox( 5, 5, 5, Colors.white, 50, 5, -15 );
    var tailLightLeft = createBox( 5, 5, 10, Colors.darkYellow, -50, 5, 21)
    var tailLightRight = createBox( 5, 5, 10, Colors.darkYellow, -50, 5, -21)
    var grate = createBox( 5, 5, 15, grateColor, 50, 5, 0 );
    var frontLeftTire = createTire( 10, 10, 10, 32, Colors.black, 30, -12, 23 );
    var frontRightTire = createTire( 10, 10, 10, 32, Colors.black, 30, -12, -23 );
    var backLeftTire = createTire( 10, 10, 10, 32, Colors.black, -30, -12, 23 );
    var backRightTire = createTire( 10, 10, 10, 32, Colors.black, -30, -12, -23 );
    var leftMirror = createBox(5, 5, 15, Colors.darkYellow, 20, 10, 23);
    var rightMirror = createBox(5, 5, 15, Colors.darkYellow, 20, 10, -23)
    var backWindowLeft = createBox(8, 18, 2, Colors.black, -30, 20, -22.5);
    var backWindowRight = createBox(8, 18, 2, Colors.black, -30, 20, 22.5);
    var frontWindowLeft = createBox(30, 18, 2, Colors.black, -5, 20, -22.5);
    var frontWindowRight = createBox(30, 18, 2, Colors.black, -5, 20, 22.5);
    var frontWindowFront = createBox(1, 18, 30, Colors.black, 20, 20, 0);
    var backWindowFront = createBox(1, 18, 30, Colors.black, -40, 20, 0);
    var roofCap = createBox(18, 10, 35, Colors.yellow, -10, 35, 0);

    this.mesh.add(body);
    this.mesh.add(roof);
    this.mesh.add(bumper);
    this.mesh.add(headLightLeft);
    this.mesh.add(headLightRight);
    this.mesh.add(tailLightLeft);
    this.mesh.add(tailLightRight);
    this.mesh.add(grate);
    this.mesh.add(frontLeftTire);
    this.mesh.add(frontRightTire);
    this.mesh.add(backLeftTire);
    this.mesh.add(backRightTire);
    this.mesh.add(leftMirror);
    this.mesh.add(rightMirror);
    this.mesh.add(backWindowLeft);
    this.mesh.add(backWindowRight);
    this.mesh.add(frontWindowLeft);
    this.mesh.add(frontWindowRight);
    this.mesh.add(frontWindowFront);
    this.mesh.add(backWindowFront);
    this.mesh.add(roofCap);

    this.speed = -6;
    this.speedUpFactor = 1;
    this.bodySize = 100;
    this.descending = false;

    this.update = function(direction) {
        if (slowDown > 0) {
            this.slowDownFactor = 4;
        }
        if (slowDown == 0) {
            this.slowDownFactor = 1;
        }
        if (this.mesh.rotation.y > 0) {
            direction.y = -direction.y;
            this.mesh.position.addScaledVector(direction, this.speed*this.speedUpFactor*(1/this.slowDownFactor));
        }
        else {
            this.mesh.position.addScaledVector(direction, -this.speed*this.speedUpFactor*(1/this.slowDownFactor));
        }  
    }
}

function policeCar() {

    this.mesh = new THREE.Object3D();

    var body = createBox( 100, 30, 50, Colors.black, 0, 0, 0 );
    var roof = createBox( 60, 15, 45, Colors.black, 0, 20, 0);
    var lightPlatform = createBox( 40, 5, 45, Colors.white, 10, 30, 0)
    var backLightPlatform = createBox(20, 5, 45, Colors.black, -20, 30, 0)
    var bumper = createBox( 90, 10, 45, bumperColor, 10, -10, 0 );
    var headLightLeft = createBox( 5, 5, 5, Colors.white, 50, 5, 15 );
    var headLightRight = createBox( 5, 5, 5, Colors.white, 50, 5, -15 );
    var tailLightLeft = createBox( 5, 5, 10, Colors.red, -50, 5, 21)
    var tailLightRight = createBox( 5, 5, 10, Colors.red, -50, 5, -21)
    var grate = createBox( 5, 5, 15, grateColor, 50, 5, 0 );
    var leftDoor = createBox( 30, 30, 3, Colors.silver, 0, 0, 25 );
    var rightDoor = createBox( 30, 30, 3, Colors.silver, 0, 0, -25 );
    var frontLeftTire = createTire( 10, 10, 10, 32, Colors.brownDark, 30, -12, 23 );
    var frontRightTire = createTire( 10, 10, 10, 32, Colors.brownDark, 30, -12, -23 );
    var backLeftTire = createTire( 10, 10, 10, 32, Colors.brownDark, -30, -12, 23 );
    var backRightTire = createTire( 10, 10, 10, 32, Colors.brownDark, -30, -12, -23 );
    var blueSiren = createBox(15, 5, 15, Colors.darkBlue, 15, 35, 10);
    var whiteSiren = createBox(15, 8, 5, Colors.white, 15, 35, 0);
    var redSiren = createBox(15, 11, 15, Colors.redDark, 15, 35, -10);
    var leftMirror = createBox(5, 5, 15, Colors.white, 20, 10, 23);
    var rightMirror = createBox(5, 5, 15, Colors.white, 20, 10, -23)

    this.mesh.add(body);
    this.mesh.add(roof);
    this.mesh.add(bumper);
    this.mesh.add(headLightLeft);
    this.mesh.add(headLightRight);
    this.mesh.add(tailLightLeft);
    this.mesh.add(tailLightRight);
    this.mesh.add(grate);
    this.mesh.add(leftDoor);
    this.mesh.add(rightDoor);
    this.mesh.add(frontLeftTire);
    this.mesh.add(frontRightTire);
    this.mesh.add(backLeftTire);
    this.mesh.add(backRightTire);
    this.mesh.add(lightPlatform);
    this.mesh.add(backLightPlatform);
    this.mesh.add(blueSiren);
    this.mesh.add(whiteSiren);
    this.mesh.add(redSiren);
    this.mesh.add(leftMirror);
    this.mesh.add(rightMirror);

    this.speed = -6;
    this.speedUpFactor = 1;
    this.bodySize = 100;
    this.descending = false;

    this.update = function(direction) {
        if (slowDown > 0) {
            this.slowDownFactor = 4;
        }
        if (slowDown == 0) {
            this.slowDownFactor = 1;
        }
        if (this.mesh.rotation.y > 0) {
            direction.y = -direction.y;
            this.mesh.position.addScaledVector(direction, this.speed*this.speedUpFactor*(1/this.slowDownFactor));
        }
        else {
            this.mesh.position.addScaledVector(direction, -this.speed*this.speedUpFactor*(1/this.slowDownFactor));
        }  
    }
}

function createPowerUp() {

    this.mesh = new THREE.Object3D();

    var body = createBox(50, 10, 50, Colors.white, 0, 0, 0 );
    var target = createCylinder(10, 1, 2, 20, Colors.red, 0, 5, 0);

    this.bodySize = 25;
    this.mesh.add(body);
    this.mesh.add(target);
}

function createMosesEffect() {
    this.mesh = new THREE.Object3D();

    var body = createSphere(20, 100, 100, Colors.white, 0, 0, 0);
    this.bodySize = 30;
    this.mesh.add(body);
}

function createFreezeEffect() {
    this.mesh = new THREE.Object3D();

    var body = createBox(40, 40, 40, Colors.lightBlue, 0, 0,0 );
    this.bodySize = 40;
    this.mesh.add(body);
}

function firstLane(currRoadNumber, lanesPerRoad) {
    // Returns the x-coordinates to place a car in the first lane of a given road
    return (Math.floor(currRoadNumber/lanesPerRoad) * 480) + 120;
}

function orientAndPlaceCars(carsPerRoad, firstLane, lanesPerRoad) {

    usedPositions = {};

    for (var i = cars.length-carsPerRoad; i < cars.length; i+=1) {
        curr_car = cars[i];
        curr_car_lane = (curr_car.mesh.position.x - firstLane)/120;

        if (! (curr_car_lane in Object.keys(usedPositions))) {
            usedPositions[String(curr_car_lane)] = [];

            // Add information about which orientation each car should have in that lane
            left_or_right = Math.floor(Math.random() * 2);
            if (left_or_right == 0) {
                var rotation = Math.PI/2;
            }
            else {
                var rotation = -Math.PI/2;
            }

            // Add information about whether to speed up the car
            if (lanesPerRoad == 1) {
                isSpedUp = 40;
            }
            else {
                isSpedUp = Math.floor(Math.random() * 15);
            }
            speedFactor = 1 + 0.1*isSpedUp;

            usedPositions[String(curr_car_lane)].push(rotation);
            usedPositions[String(curr_car_lane)].push(speedFactor);
        }        

        curr_car.mesh.rotation.y = usedPositions[String(curr_car_lane)][0]
        curr_car.speedUpFactor = usedPositions[String(curr_car_lane)][1]

        shift = Math.floor(Math.random() * carsPerRoad) * 200;

        while (shift in usedPositions[String(curr_car_lane)]) {
            shift = Math.floor(Math.random() * carsPerRoad) * 200;
        }
        usedPositions[String(curr_car_lane)].push(shift);

        if (curr_car.mesh.rotation.y > 0) {
            curr_car.mesh.position.z = 200 + shift;
        }
        if (curr_car.mesh.rotation.y < 0) {
            curr_car.mesh.position.z = -200 - shift;
        }
    }
}

function createCar(numCars, lanesPerRoad, currRoadNumber) {
    for (var i = 0; i < numCars; i+=1) {
        car = new policeCar();
        var firstLaneOfThisRoad = firstLanes[currRoadNumber];
        car.mesh.position.y = 18;

        if (i >= lanesPerRoad) { // Generalized for any number of roads  
            car.mesh.position.x = firstLaneOfThisRoad + ((i%lanesPerRoad)*120);
        } 
        else {
            car.mesh.position.x = firstLaneOfThisRoad + 120*i;  
        }
        car.name = car.mesh.position.x;
        cars.push(car);
    }

    // HARDCODED 3 CARS PER LANE HERE AS WELL!!!!!
    orientAndPlaceCars(3*lanesPerRoad, firstLaneOfThisRoad, lanesPerRoad);

    for (var i = cars.length-numCars; i < cars.length; i+=1) {
        scene.add(cars[i].mesh);
    }
}

function createChicken() {
    chicken = new Chicken(Colors.white, 'white');
    scene.add(chicken.mesh);
}

function addLaneMarkers(numLanes, farthestPixel, currRoadNumber, initial = false) {
    if (initial == true) {
        for (var i = 0; i<3; i+=1) {
           for (var markerZPos = -1900; markerZPos < 1900; markerZPos+=230) {
                marker = createBox(10, 5, 100, Colors.white, 160 + (i*480), -7, markerZPos);
                scene.add(marker);
            }
            for (var markerZPos = -1900; markerZPos < 1900; markerZPos+=230) {
                marker = createBox(10, 5, 100, Colors.white, 300 + (i*480), -7, markerZPos);
                 scene.add(marker);
            }
        }
    }
    if (numLanes > 1 && initial==false) {
        for (var laneNumber = 0; laneNumber<numLanes-1; laneNumber+=1) {
            for (var markerZPos = -1900; markerZPos < 1900; markerZPos += 230) {
                marker = createBox(10, 5, 100, Colors.white, farthestPixel-240-(laneNumber*120), -7, markerZPos);
                scene.add(marker);
                marker.name = currRoadNumber-4;
                markers.push(marker);
            }
        }
    }
}

var currRoadLanes = 0;

function createGround(pixelsToReplace, farthestPixelDisplaying) {
    if (pixelsToReplace == "initial") {
        ground = createBox( 250, 20, 3500, Colors.greenDark, -65, -10, -50 );
        road = createBox(360, 10, 3500, Colors.roadBlack, 240, -10, 0);
        ground.name = 0;
        road.name = 0;
        firstLanes.push(120);

        ground2 = createBox(120, 20, 3500, Colors.greenDark, 480, -10, -150);
        road2 = createBox(360, 10, 3700, Colors.roadBlack, 720, -10, -150);
        ground2.name = 1;
        road2.name = 1;
        firstLanes.push(600);

        ground3 = createBox(120, 20, 3500, Colors.greenDark, 960, -10, -150);
        road3 = createBox(360, 10, 3700, Colors.roadBlack, 1200, -10, -150);
        road3.name = 2;
        ground3.name = 2;
        firstLanes.push(1080);

        ground4 = createBox(120, 20, 3500, Colors.greenDark, 1440, -10, -150);
        ground4.name = 3;

        addLaneMarkers(3, 1500, 0, true);
        createCar(9, 3, 0);
        createCar(9, 3, 1);
        createCar(9, 3, 2);

        moses = new createMosesEffect();
        scene.add(moses.mesh);
        moses.mesh.position.y = 10;
        moses.mesh.position.x = 480;
        moses.mesh.position.z = 0;
        moses.name = 'moses';
        powerUps.push(moses);
    }

    else {
        road_or_ground = Math.floor(Math.random() * 6);
        if (road_or_ground == 5 || currRoadLanes == 5) {
            isGround = true;
            isRoad = false;
        }
        else {
            isGround = false;
            isRoad = true;
            currRoadLanes += 1;
        }
        if (isGround == true) {
            // Create a power up / freeze effect / moses effect
            giveFreeze = Math.floor(Math.random() * 20);
            givePowerUp = Math.floor(Math.random() * 30);
            giveMoses = Math.floor(Math.random() * 40);

            if (givePowerUp == 0) {
                generatePowerUp(currRoadLanes, farthestPixelDisplaying, 'powerup');
            }
            if (giveFreeze == 0) {
                generatePowerUp(currRoadLanes, farthestPixelDisplaying, 'freeze');
            }
            if (giveMoses == 0) {
                generatePowerUp(currRoadLanes, farthestPixel, 'moses');
            }

            if (currRoadLanes == 0) {
                newGround = createBox(120, 20, 3500, Colors.greenDark, farthestPixelDisplaying-60, -10, -150);
                scene.add(newGround);
                newGround.name = firstLanes.length-1;
            }
            else {
                newRoad = createBox(currRoadLanes*120, 10, 3700, Colors.roadBlack, farthestPixelDisplaying-120-(60*currRoadLanes), -10, -150);
                scene.add(newRoad);
                newGround = createBox(120, 20, 3500, Colors.greenDark, farthestPixelDisplaying-60, -10, -150);
                scene.add(newGround);

                addLaneMarkers(currRoadLanes, farthestPixelDisplaying, firstLanes.length-1, false);

                firstLanes.push(farthestPixelDisplaying-(120*currRoadLanes)-60);

                // HARDCODED 3 CARS PER LANE HERE!!!!!
                createCar(3*currRoadLanes, currRoadLanes, firstLanes.length-1);

                newRoad.name = firstLanes.length-1;
                newGround.name = firstLanes.length;
                removePassedItems();
                currRoadLanes = 0;
            }
        }
    }

    scene.add(ground);
    scene.add(road);
    scene.add(ground2);
    scene.add(road2);
    scene.add(ground3);
    scene.add(road3);
    scene.add(ground4);
}

function removePassedItems() {
    for (var i = 0; i<scene.children.length;i+=1) {
        curr_item = scene.children[i];
        if (scene.children[i].name <= firstLanes.length-11 && typeof(scene.children[i].name) == 'number') {
            scene.remove(scene.children[i]);
            i -= 1;
        }
    }
    for (var i = cars.length-1; i>=0; i-=1) {
        if (cars[i].name <= camera.position.x - 1500 && typeof(cars[i].name) == 'number') {
            scene.remove(cars[i].mesh);
            cars.splice(i, 1);
        } 
    }
    for (var i = markers.length-1; i>=0; i-=1) {
        if (markers[i].name <= firstLanes.length-12 && typeof(markers[i].name) == 'number') {
            scene.remove(markers[i]);
            markers.splice(i, 1);
        } 
    }
    for (var i = powerUps.length-1; i>=0; i-=1) {
        try {
            name = powerUps[i].name1;
        }
        catch(error) {
            name = powerUps[i].name;
        }
        if (name <= firstLanes.length-11 && typeof(name) == 'number') {
            scene.remove(powerUps[i].mesh);
            powerUps.splice(i, 1);
        }
    }
}

function replaceChicken(color, colorString) {
    x = chicken.mesh.position.x;
    y = chicken.mesh.position.y;
    z = chicken.mesh.position.z;
    scene.remove(chicken.mesh);
    chicken = new Chicken(color, colorString);
    chicken.mesh.position.x = x;
    chicken.mesh.position.y = y;
    chicken.mesh.position.z = z;
    scene.add(chicken.mesh);
}

function generatePowerUp(currRoadLanes, farthestPixelDisplaying, type) {
    posOrNeg = Math.floor(Math.random() * 1)
    if (posOrNeg == 0) {
       factor = 1;
    }
    else {
        factor = -1;
    }

    if (type == 'powerup') {
        powerUp = new createPowerUp();
        powerUp.mesh.position.y = 0;
        powerUp.mesh.position.z = factor * Math.floor(Math.random() * 200);
        powerUp.mesh.position.x = farthestPixelDisplaying-60-(120*Math.floor(Math.random() * currRoadLanes));
        powerUp.name = firstLanes.length-3;
        powerUps.push(powerUp);
        scene.add(powerUp.mesh);
    }
    if (type=='moses') {
        moses = new createMosesEffect();
        moses.mesh.position.y = 10;
        moses.mesh.position.z = factor * Math.floor(Math.random() * 200);
        moses.mesh.position.x = farthestPixelDisplaying-60-(120*Math.floor(Math.random() * currRoadLanes));
        moses.name = 'moses';
        moses.name1 = firstLanes.length-3;
        powerUps.push(moses);
        scene.add(moses.mesh);
    }

    if (type=='freeze') {
        iceCube = new createFreezeEffect();
        iceCube.mesh.position.y = 20;
        iceCube.mesh.position.z = factor * Math.floor(Math.random() * 200);
        iceCube.mesh.position.x = farthestPixelDisplaying-60-(120*Math.floor(Math.random() * currRoadLanes));
        iceCube.name = 'freeze';
        iceCube.name1 = firstLanes.length-3;
        powerUps.push(iceCube);
        scene.add(iceCube.mesh);
    }
}
function checkCollisions(isInvincible) {
    chicken_z = chicken.mesh.position.z
    chicken_x = chicken.mesh.position.x;
    if (! isInvincible) {
        for (var i = 0; i<cars.length;i+=1) {
            car_z = cars[i].mesh.position.z;
            car_x = cars[i].mesh.position.x;
            car_y = cars[i].mesh.position.y;
            if ((chicken_z >= car_z - cars[i].bodySize/2) && (chicken_z <= car_z + cars[i].bodySize/2) && (car_x == chicken_x) && (car_y == 18)) {
                gameOver();
            }
        }
    }
    for (var i =0; i<powerUps.length; i+=1) {
        powerUp_z = powerUps[i].mesh.position.z;
        powerUp_x = powerUps[i].mesh.position.x;
        if ((chicken_z >= powerUp_z - powerUps[i].bodySize/2) && (chicken_z <= powerUp_z + powerUps[i].bodySize/2) && (powerUp_x == chicken_x)) {
            name = powerUps[i].name;
            scene.remove(powerUps[i].mesh);
            powerUps.splice(i, 1);

            var invincibleSeconds = 7.5;
            if (name == 'moses') {
                invincibleMoses = 60 * invincibleSeconds;
                color = Colors.green;
                colorString = 'green';
                // Makes sure that powerup effects don't stack.
                slowDown = 0;
                invincible = 0;
            }
            else if (name == 'freeze') {
                slowDown = 60*invincibleSeconds;
                color = Colors.lightBlue;
                colorString = 'lightBlue';
                // Makes sure that powerup effects don't stack.
                invincible = 0;
                invincibleMoses = 0;
            }
            else if (typeof(eval(name)) == 'number') {
                invincible = 60 * invincibleSeconds;
                color = Colors.golden;
                colorString = 'golden';
                // Makes sure that powerup effects don't stack.
                slowDown = 0;
                invincibleMoses = 0;
            }
            replaceChicken(color, colorString);
        }
    }   
}

function gameOver(){
    alert("Mr. Chicken has been run over! Try again!");
    document.location.reload(true);
    chicken.reload(forcedReload);
}


var movingLeft = false;
var movingRight = false;
var movingForward = false;
var movingBackward = false;
var initialCameraPosition = -150;
var farthestPixel = 1500;
var moveCamera = false;
var previousInvincibleMoses = 0;
var previousInvincible = 0;
var previousFreeze = 0;

function loop(){
    var chickenDirection = new THREE.Vector3(0, 0, 0);

    // check to see whether we need to generate new ground
    if (camera.position.x >= initialCameraPosition + 120) {
        createGround(120, farthestPixel+120);
        initialCameraPosition = Math.floor(camera.position.x / 120) * 120;
        farthestPixel += 120;
    }

    // Update the chicken's position if the user is pressing keys
    if (movingLeft == true ) {
        var chickenDirection = new THREE.Vector3(0, 0, -0.2);
    }
    if (movingRight == true) {
        var chickenDirection = new THREE.Vector3(0, 0, 0.2);
    }

    chicken.update(chickenDirection);

    // Update each car's position
    for (var i = 0; i<cars.length;i+=1) {
        if ((invincibleMoses > 0 && Math.abs(cars[i].mesh.position.z - chicken.mesh.position.z) <= 240 && cars[i].mesh.position.x == chicken.mesh.position.x) || cars[i].descending) {
                direction = new THREE.Vector3(0, -1, 1);
                cars[i].descending = true;
        }
        else {
            var direction = new THREE.Vector3(0, 0, 1);
        }

        cars[i].update(direction);

        var checkDirection = cars[i].mesh.rotation.y / Math.abs(cars[i].mesh.rotation.y);

        if (Math.abs(cars[i].mesh.position.z) > 900 && checkDirection == -cars[i].mesh.position.z/Math.abs(cars[i].mesh.position.z)) {
            cars[i].mesh.position.z = -cars[i].mesh.position.z;
            cars[i].mesh.position.y = 18;
            cars[i].descending = false;
        }
    }

    if (invincibleMoses > 0) {
        previousInvincibleMoses = invincibleMoses;
        invincibleMoses -= 1;
    }
    else {
        if (previousInvincibleMoses && ! invincibleMoses) {
            // Another powerup might be activated right now, so only switch to white if the chicken only has the moses effect
            if (chicken.color == 'green') {
                replaceChicken(Colors.white, 'white');
            }
            previousInvincibleMoses = 0;
        }
    }

    if (slowDown > 0) {
        previousFreeze = slowDown;
        slowDown -= 1;
    }
    else {
        if (previousFreeze && ! slowDown) {
            // Another powerup might be activated right now, so only switch to white if the chicken only has the freeze effect
            if (chicken.color=='lightBlue') {
                replaceChicken(Colors.white, 'white');
            }
            previousFreeze = 0;
        }  
    }

    // Check for collisions with cars
    if (! (invincible) && ! invincibleMoses) {
        // false means that the chicken is currently not invincible
        checkCollisions(false);
    }
    else {
        checkCollisions(true);
        if (invincible) {
            // Check whether invincibility has run out
            previousInvincible = invincible;
            invincible -= 1;
            if (previousInvincible && ! invincible) {
                replaceChicken(Colors.white, 'white');
            }
        }
    }
    // Update score
    score = chicken.mesh.position.x / 120;
    document.getElementById("time").innerHTML = score;
    if (score > highscore) {
        localStorage.setItem("highscore", score);  
        document.getElementById("displayedHighScore").innerHTML = score;    
    }
    else {
        document.getElementById("displayedHighScore").innerHTML = highscore;    
    }

    // Move the camera forward
    if (moveCamera) {
        if (chicken.mesh.position.x > camera.position.x + 360) {
            camera.position.x += 5;
        }
        else {
            camera.position.x += 2.5;
        }
    }

    // render the scene
    renderer.render(scene, camera);

    // call the loop function again
    requestAnimationFrame(loop);
}

var left = 37;
var right = 39;
var up = 38;
var down = 40;

function createControls() {
    var newLeft = new THREE.Vector3(0, 0, -1);
    var newRight = new THREE.Vector3(0, 0, 1);
    var newForward = new THREE.Vector3(1, 0, 0);
    var newBackward = new THREE.Vector3(-1, 0, 0);
    var stationary = new THREE.Vector3(0, 0, 0);

    document.addEventListener(
        'keydown',
        function( ev ) {
            key = ev.keyCode;

            if (key == left) {
              if (chicken.mesh.position.z >= -340) {
                movingLeft = true;
              }
              else { 
                movingLeft = false;
              }
              
            }
            if (key == right) {
                if (chicken.mesh.position.z <= 300) {
                  movingRight = true;
                }
                else {
                  movingRight = false;
                }
            }
            if (key == up) {
              if (chicken.mesh.position.x <= farthestPixel-840) {
                  chicken.update(newForward);
              }
              else {
                chicken.update(stationary);
              }
            }
            if (key == down) {
                chicken.update(newBackward);
            }
        }
    );

    document.addEventListener(
        'keyup',
        function( ev ) {
            key = ev.keyCode;

            if (key == left) {
                movingLeft = false;
            }
            if (key == right) {
                movingRight = false;
            }
            if (key == up) {
                chicken.update(stationary);
                moveCamera = true;
            }
            if (key == down) {
                chicken.update(stationary);
            }
        }
    );
}
window.addEventListener('load', init, false);
// init();  // uncomment for JSFiddle, wraps code in onLoad eventListener