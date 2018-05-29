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
 * Initialize relevant variables
 */

var score = 0;
var highscore = localStorage.getItem("highscore");

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

    createGround();

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
    WIDTH = window.innerWidth - 330;

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
    renderer.shadowMap.enabled = false;

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
    shadowLight.castShadow = false;

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
    box.castShadow = false;
    box.receiveShadow = false;
    box.position.set( x, y, z );
    return box;
}

function createSphere(dx, dy, dz, color, x, y, z, notFlatShading) {
    var geometry = new THREE.SphereGeometry(dx, dy, dz);
    var material = new THREE.MeshPhongMaterial({color:color, flatShading: notFlatShading != true});
    var sphere = new THREE.Mesh(geometry, material);
    sphere.castShadow = false;
    sphere.receiveShadow = false;
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
    cylinder.castShadow = false;
    cylinder.receiveShadow = false;
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
    this.mesh.position.x = 150;
    this.mesh.position.z = 125;
    goal_orientation = Math.PI/2;
    this.color = colorString;

    this.orient = function(direction) {
        this.mesh.rotation.y = this.mesh.rotation.y % (2*Math.PI);
        current_orientation = this.mesh.rotation.y;
        // Get the desired final orientation
        if (direction.z < 0) {
            if (direction.x > 0) {
                goal_orientation = 3*Math.PI/4;
            }
            else if (direction.x < 0) {
                goal_orientation = 5*Math.PI/4;
            }
            else if (direction.x == 0) {
                goal_orientation = Math.PI;
            }
        }
        else if (direction.z > 0) {
            if (direction.x > 0) {
                goal_orientation = Math.PI/4;
            }
            else if (direction.x < 0) {
                goal_orientation = 7*Math.PI/4;
            }
            else if (direction.x == 0) {
                goal_orientation = 0;
            }
        }
        else if (direction.z == 0) {
            if (direction.x > 0) {
                goal_orientation = Math.PI/2;
            }
            else if (direction.x < 0) {
                goal_orientation = 3*Math.PI/2;
            }
        }
        // Now increment the current orientation toward the goal orientation
        if (goal_orientation < current_orientation) {
            // Special case when rotation of 0 is involved
            if (goal_orientation == 0 && current_orientation > Math.PI) {
                this.mesh.rotation.y += (Math.PI/4)/5;
            }
            else {
                this.mesh.rotation.y -= (Math.PI/4)/5;
            }
        }
        else if (goal_orientation > current_orientation) {
            // Special case when rotation of 0 is involved
            if (current_orientation == 0 && goal_orientation > Math.PI) {
                this.mesh.rotation.y = 39*Math.PI/20;
            }
            else {
                this.mesh.rotation.y += (Math.PI/4)/5;
            }
        }
    }

    this.update = function(direction) {
        this.orient(direction);
        this.mesh.position.addScaledVector(direction, 50);
    }
}

function createChicken() {
    chicken = new Chicken(Colors.white, 'white');
    scene.add(chicken.mesh);
}

function createGround() {
    road = createBox(3600, 10, 3500, Colors.roadBlack, 240, -10, 0);
    scene.add(road);
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
var previousInvincibleMoses = 0;
var previousInvincible = 0;
var previousFreeze = 0;

function loop(){
    var chickenDirection = new THREE.Vector3(0, 0, 0);

    // Update the chicken's position if the user is pressing keys
    if (movingLeft == true ) {
        left_or_right = -0.07;
    }
    else if (movingRight == true) {
        left_or_right = 0.07;
    }
    else {
        left_or_right = 0;
    }

    if (movingForward == true) {
        back_or_forward = 0.07;
    }
    else if (movingBackward == true) {
        back_or_forward = -0.07;
    }
    else {
        back_or_forward = 0;
    }

    var chickenDirection = new THREE.Vector3(back_or_forward, 0, left_or_right);

    chicken.update(chickenDirection);

    // Update score
    // score = SOMETHING ELSE
    document.getElementById("time").innerHTML = score;
    if (score > highscore) {
        localStorage.setItem("highscore", score);  
        document.getElementById("displayedHighScore").innerHTML = score;    
    }
    else {
        document.getElementById("displayedHighScore").innerHTML = highscore;    
    }

    // Camera follows the character
    camera.position.x += back_or_forward*50;
    camera.position.z += left_or_right*50;

    camera.lookAt(chicken.mesh.position.x, chicken.mesh.position.y, chicken.mesh.position.z);
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
    document.addEventListener(
        'keydown',
        function( ev ) {
            key = ev.keyCode;

            if (key == left) {
                movingLeft = true;
              }
              
            if (key == right) {
                  movingRight = true;
                }

            if (key == up) {
                movingForward = true;
            }
            if (key == down) {
                movingBackward = true;
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
                movingForward = false;
            }
            if (key == down) {
                movingBackward = false;
            }
        }
    );
}
window.addEventListener('load', init, false);
// init();  // uncomment for JSFiddle, wraps code in onLoad eventListener