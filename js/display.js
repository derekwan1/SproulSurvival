/**
 *
 * Sproul Survival
 * ----
 * Simple game for education purposes, by Derek Wan
 *
 */

 /**
TODO: 
    1. Need to add more satisfying zombie death, probably an explosion of green cubes
    2. Chance of exploding, damage other zombies--since this will speed up zombie death rate, also add mechanism for recycling zombies
    3. Chance of mega-zombie, if you leave them alive too long
    4. UFO Assembly to kill zombies for you
    5. Need to add zombie mesh so that they don't merge into one
 **/

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
var resized = false;
//var highscore = localStorage.getItem("highscore");
var highscore = 0;
if (highscore == null) {
    highscore = 0;
}
var characterOrientation = 0;
var bullets = [];
var zombies = [];

/********** End step 1 **********/

function init() {
    // set up the scene, the camera and the renderer
    createScene();

    // add the lights
    createLights();

    createControls();

    // add the objects

    createGround();

    createTrees();

    createChicken();

    createZombie();
    // Preload bullets
    for (var i = 0; i<100; i+=1) {
        createBullet();
    }

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
    //camera.position.x = 150;
    camera.position.z = 150;
    //camera.position.z = 200;
    camera.position.y = 500;
    //camera.position.y = 50;
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
    resized = true;
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

function createCircle(dr, x, y, z, color, thetaStart, thetaLength, notFlatShading) {
    var geometry = new THREE.CircleGeometry(dr, 50, thetaStart, thetaLength);
    var material = new THREE.MeshPhongMaterial( { color: color, flatShading: notFlatShading != true});
    var circle = new THREE.Mesh(geometry, material );
    circle.castShadow = false;
    circle.receiveShadow = false;
    circle.position.set( x, y, z);
    return circle
}

function createRing(innerRadius, outerRadius, x, y, z, color) {
    var geometry = new THREE.RingGeometry(innerRadius, outerRadius, 50 );
    var material = new THREE.MeshPhongMaterial( { color: color});
    var ring = new THREE.Mesh( geometry, material );
    ring.castShadow = false;
    ring.receiveShadow = false;
    ring.position.set( x, y, z);
    return ring
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

    this.orient = function(direction, isFiring) {
        if (this.mesh.rotation.y > (2*Math.PI)) {
            this.mesh.rotation.y = this.mesh.rotation.y % (2*Math.PI);
        }
        else if (this.mesh.rotation.y < 0) {
            this.mesh.rotation.y = (2*Math.PI) + this.mesh.rotation.y;
        }
        current_orientation = this.mesh.rotation.y;
        // Get the desired final orientation
        if (! isFiring) {
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
        }
        // If the user is firing, character should face in direction of click regardless of movement direction
        else { 

            // x axis goes from 333 to 1276 (left to right), y axis goes from 0 to 633 (top to bottom)
            // HARDCODED FOR MY SCREEN, OTHER SCREENS COULD BE DIFFERENT. ALSO RESIZE IS ASSUMING THE NEW SIZE IS THE SAME AS THE OLD SIZE
            xLeg = mouse_x_Coordinate - 810;
            if (resized) {
                xLeg = mouse_x_Coordinate - 970;
            }
            yLeg = -(mouse_y_Coordinate - 316.5);

            angle = Math.atan(yLeg / xLeg);

            // Calculation for the second and third quadrants
            if ((xLeg < 0 && yLeg > 0) || (xLeg < 0 && yLeg < 0)) {
                angle = Math.PI + angle;
            }

            // Calculation for the fourth quadrant
            if (xLeg > 0 && yLeg < 0) {
                angle = (2*Math.PI) + angle;
            }

            goal_orientation = Math.PI/20 * Math.round(angle/(Math.PI/20));
        }

        // Now increment the current orientation toward the goal orientation
        difference = current_orientation - goal_orientation;
        characterOrientation = goal_orientation;
        if (goal_orientation < current_orientation) {
            if (difference > Math.PI) {
                    this.mesh.rotation.y += Math.PI/20;
                }
            else {
                this.mesh.rotation.y -= Math.PI/20;
            }
        }

        if (goal_orientation > current_orientation) {
            if (difference < -Math.PI) {
                this.mesh.rotation.y -= Math.PI/20;
            }

            else {
                this.mesh.rotation.y += Math.PI/20;
            }
        }
    }

    this.update = function(direction, isFiring) {
        this.orient(direction, isFiring);
        this.mesh.position.addScaledVector(direction, 50);
        }
    }

function Bullet() {

    this.mesh = new THREE.Object3D();

    var bulletShell = createBox(5, 1, 15, Colors.yellow, 0, 60, 0);
    //var bulletLight = new THREE.PointLight( 0xffcc00, 3, 100 );
    //var bulletLight2 = new THREE.PointLight( 0xffcc00, 3, 100 )

    //bulletLight.position.set(11, 63, 0);
    //bulletLight2.position.set(-11, 63, 0);

    this.mesh.add(bulletShell);
    //this.mesh.add(bulletLight);
    //this.mesh.add(bulletLight2);

    this.oriented = false;
    this.onScreen = false;
    this.travelIncrements = 0;

    this.checkCollisions = function() {
        for (var i =0; i<zombies.length; i+=1) {
            if (Math.abs(this.mesh.position.z - zombies[i].mesh.position.z) < 25 && Math.abs(this.mesh.position.x - zombies[i].mesh.position.x) < 20 && zombies[i].mesh.position.y > 60 && zombies[i].mesh.position.y < 140) {
                if (zombies[i].hitPoints > 0) {
                    zombies[i].hitPoints -= 1;
                    zombies[i].pushBack = 1;
                    zombies[i].bulletVelocity = this.position_change;
                }
                return true;
            }
        }
        return false;
    }

    this.orient = function() {
        this.mesh.rotation.y = characterOrientation;
        this.oriented = true;
    }

    this.update = function() {
        // Remove the bullet from the scene if it has traveled 2000 units or if it collides with a zombie

        if (this.travelIncrements == 100 || this.checkCollisions()) {
            this.onScreen = false;
            this.travelIncrements = -1;
        }

        this.travelIncrements += 1;

        // Bullet will move 20 radial units per frame regardless of angle
        if (! this.oriented) {
            this.orient();  
        }

        // If the bullet is taken off screen, reset orientation
        if (! this.onScreen) {
            this.oriented = false;
            this.mesh.position.set(0, -200, 0);
        }

        travelOrientation = (this.mesh.rotation.y) % (2*Math.PI);

        bulletSine = Math.sin(travelOrientation);
        yComponent = bulletSine;
        hypotenuse = 1;
        xComponent = Math.pow(1 - Math.pow(yComponent, 2), 0.5)

        // Calculation for the second quadrant
        if (travelOrientation > Math.PI/2 && travelOrientation <= Math.PI) {
            xComponent = -xComponent;
        }

        // Calculation for the third quadrant
        if (travelOrientation <= 3*Math.PI/2 && travelOrientation > Math.PI) {
            xComponent = -xComponent;
        }

        this.position_change = new THREE.Vector3(yComponent, 0, xComponent);

        this.mesh.position.addScaledVector(this.position_change, 20);
}

}

function Zombie() {
    this.mesh = new THREE.Object3D();

    var mainHead = createBox(40, 60, 50, Colors.greenDark, 0, 0, 0);
    var hair = createBox(43, 24, 53, Colors.black, 0, 19, 0);
    var mouth = createCircle(15, -21, -25, 0, Colors.black, 0, Math.PI);
    var leftEyeWithoutPupil = createRing(3, 7, -21, -2, 10, Colors.red);
    var rightEyeWithoutPupil = createRing(3, 7, -21, -2, -10, Colors.red);
    var leftPupil = createSphere(3, 20, 20, Colors.golden, -20, -2, 10);
    var rightPupil = createSphere(3, 20, 20, Colors.golden, -20, -2, -10);
    var bottomTeeth = createBox(2, 3, 18, Colors.silver, -20.5, -23, 0);
    var mainBody = createBox(35, 30, 35, Colors.darkBlue, 0, -45, 0);
    var butt = createBox(35, 10, 35, Colors.brownDark, 0, -65, 0);
    var leftArm = createBox(7, 7.5, 7.5, Colors.greenDark, -23, -40, -10);
    var rightArm = createBox(7, 7.5, 7.5, Colors.greenDark, -23, -40, 10);
    var leftLeg = createBox(10, 10, 10, Colors.black, 0, -75, -8);
    var rightLeg = createBox(10, 10, 10, Colors.black, 0, -75, 8);

    
    mouth.rotation.y = 3*Math.PI/2;
    leftEyeWithoutPupil.rotation.y = 3*Math.PI/2;
    rightEyeWithoutPupil.rotation.y = 3*Math.PI/2;
    
    this.mesh.add(hair);
    this.mesh.add(mainHead);
    this.mesh.add(mouth);
    this.mesh.add(leftEyeWithoutPupil);
    this.mesh.add(rightEyeWithoutPupil);
    this.mesh.add(leftPupil);
    this.mesh.add(rightPupil);
    this.mesh.add(bottomTeeth);
    this.mesh.add(mainBody);
    this.mesh.add(butt);
    this.mesh.add(leftArm);
    this.mesh.add(rightArm);
    this.mesh.add(leftLeg);
    this.mesh.add(rightLeg);

    this.final_orientation = 0;
    this.rotateAmount = 0.01;
    this.hitPoints = 4;
    this.timeStep = 0;
    this.mass = 50;
    this.offScreen = false;
    this.pushBack = 0;

    this.orient = function() {

        if (this.mesh.rotation.y > (2*Math.PI)) {
            this.mesh.rotation.y = this.mesh.rotation.y % (2*Math.PI);
        }
        else if (this.mesh.rotation.y < 0) {
            this.mesh.rotation.y = (2*Math.PI) + this.mesh.rotation.y;
        }
        current_orientation = this.mesh.rotation.y;

        // Get the desired final orientation, toward the character
        xLeg = chicken.mesh.position.z - this.mesh.position.z;
        yLeg = chicken.mesh.position.x - this.mesh.position.x;

        if (xLeg != 0 && yLeg != 0) {
            angle = Math.atan(yLeg / xLeg);

            // Calculation for the second and third quadrants
            if ((xLeg < 0 && yLeg > 0) || (xLeg < 0 && yLeg < 0)) {
                angle = Math.PI + angle;
            }

            // Calculation for the fourth quadrant
            if (xLeg > 0 && yLeg < 0) {
                angle = (2*Math.PI) + angle;
            }

            final_orientation = (Math.PI/20 * Math.round(angle/(Math.PI/20)) + Math.PI/2) % (2*Math.PI);
            this.final_orientation = final_orientation;

            // Now increment the current orientation toward the goal orientation
            difference = current_orientation - final_orientation;

            if (final_orientation < current_orientation) {
                if (difference > Math.PI) {
                        this.mesh.rotation.y += Math.PI/20;
                    }
                else {
                    this.mesh.rotation.y -= Math.PI/20;
                }
            }

            if (final_orientation > current_orientation) {
                if (difference < -Math.PI) {
                    this.mesh.rotation.y -= Math.PI/20;
                }

                else {
                    this.mesh.rotation.y += Math.PI/20;
                }
            }
        }
    }

    this.bounce = function() {
        if (this.mesh.position.y > 75 && this.bounces == 0) {
            this.velocity = -9.8 * this.timeStep;
            this.energy = 0.5 * this.mass * Math.pow(this.velocity, 2);
        }

        else if (this.mesh.position.y < 75) {
            this.timeStep = 0;
            this.bounces += 1;
            this.energy = 0.5 * this.energy;
            this.velocity = Math.pow(2*this.energy/this.mass, 0.5);
            this.initialVelocity = this.velocity;
        }

        else if (this.mesh.position.y > 75 && this.bounces >= 1) {
            this.velocity = this.initialVelocity - (9.8*this.timeStep);
        }

        this.mesh.position.y += this.velocity;
        this.timeStep += 1/60
    }

    this.update = function() {
        this.orient();

        if (this.pushBack < 10 && this.pushBack > 0) {
            this.pushBack += 1;
            this.mesh.position.addScaledVector(this.bulletVelocity, 5);
        }

        else {
            this.pushBack = 0;
        }

        if (this.bounces < 8) {
            this.bounce();
        }

        if (this.hitPoints == 0) {
            if (this.mesh.position.y > -50) {
                this.mesh.position.y -= 4;
            }
            else {
                this.offScreen = true;
            }
        }
        else {

            // Zombie will move 1 radial unit per frame regardless of angle
            hypotenuse = Math.pow(Math.pow(xLeg, 2) + Math.pow(yLeg, 2), 0.5);

            sine = Math.sin(yLeg / hypotenuse);
            y = sine;
            x = Math.pow(1 - Math.pow(y, 2), 0.5);

            // Calculation for the second quadrant
            if (xLeg < 0 && yLeg > 0) {
                y = sine;
                x = -Math.pow(1 - Math.pow(y, 2), 0.5);
            }

            // Calculation for the third quadrant
            if (xLeg < 0 && yLeg < 0) {
                y = sine;
                x = -Math.pow(1 - Math.pow(y, 2), 0.5);
            }

            // Calculation for the fourth quadrant
            if (xLeg > 0 && yLeg < 0) {
                y = sine;
                x = Math.pow(1 - Math.pow(y, 2), 0.5)
            }        

            delta_position = new THREE.Vector3(y, 0, x);

            this.mesh.position.addScaledVector(delta_position, 1);
            /**
            if (Math.abs(this.mesh.position.x - chicken.mesh.position.x) < 30 && Math.abs(this.mesh.position.z - chicken.mesh.position.z) < 30 && Math.abs(this.mesh.position.y) < 130) {
                gameOver();
            }
            **/
        }
}

    this.headRotate = function() {
        // Rotate function for aesthetic animation
        if (this.final_orientation <= Math.PI/4 || this.final_orientation >= 7*Math.PI/4 || this.final_orientation >=3*Math.PI/4 && this.final_orientation <= 5*Math.PI/4) {
            this.mesh.rotation.z += this.rotateAmount;
            if (Math.abs(this.mesh.rotation.z) <= Math.PI/16 + 0.1 && Math.abs(this.mesh.rotation.z) >= Math.PI/16 - 0.1) {
                this.rotateAmount = -this.rotateAmount;
            }
        }
        else {
            this.mesh.rotation.x += this.rotateAmount;
            if (Math.abs(this.mesh.rotation.x) <= Math.PI/16 + 0.1 && Math.abs(this.mesh.rotation.x) >= Math.PI/16 - 0.1) {
                this.rotateAmount = -this.rotateAmount;
            }
        }

    }
}

function Tree() {

    this.mesh = new THREE.Object3D();
    var top = createCylinder( 1, 30, 30, 4, Colors.green, 0, 90, 0 );
    var mid = createCylinder( 1, 40, 40, 4, Colors.green, 0, 70, 0 );
    var bottom = createCylinder( 1, 50, 50, 4, Colors.green, 0, 40, 0 );
    var trunk = createCylinder( 10, 10, 30, 32, Colors.brownDark, 0, 0, 0 );

    this.mesh.add( top );
    this.mesh.add( mid );
    this.mesh.add( bottom );
    this.mesh.add( trunk );

}

function createZombie() {
    zombie = new Zombie();
    scene.add(zombie.mesh);

    zombie.mesh.position.set(getRandomInt(chicken.mesh.position.x-500, chicken.mesh.position.x+500), 400, chicken.mesh.position.z-500, chicken.mesh.position.z + 500);
    zombies.push(zombie);

    zombie.bounces = 0;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createTrees() {
    for (var i = 0; i<8; i+=1) {

        // Trees on bottom
        var tree = new Tree();
        var tree2 = new Tree();

        // Trees on top
        var tree3 = new Tree();
        var tree4 = new Tree();
        var tree11 = new Tree();
        var tree12 = new Tree();

        // Trees on left
        var tree5 = new Tree();
        var tree6 = new Tree();

        var tree13 = new Tree();
        var tree14 = new Tree();

        var tree9 = new Tree();
        var tree17 = new Tree();

        // Trees on right
        var tree7 = new Tree();
        var tree8 = new Tree();

        var tree15 = new Tree();
        var tree16 = new Tree();

        var tree10 = new Tree();
        var tree18 = new Tree();

        pos = i*250;

        // Trees on bottom
        scene.add(tree.mesh);
        tree.mesh.position.set(-970, 40, pos);
        tree.mesh.scale.set(3, 3, 3);

        // Trees on top
        scene.add(tree3.mesh);
        tree3.mesh.position.set(1470, 40, pos);
        tree3.mesh.scale.set(3, 3, 3);

        scene.add(tree11.mesh);
        tree11.mesh.position.set(1720, 40, pos);
        tree11.mesh.scale.set(3, 3, 3); 
         
        // Trees on left
        scene.add(tree5.mesh);
        tree5.mesh.position.set(pos, 40, -1220);
        tree5.mesh.scale.set(3, 3, 3);

        scene.add(tree13.mesh);
        tree13.mesh.position.set(pos, 40, -1470);
        tree13.mesh.scale.set(3, 3, 3);

        scene.add(tree9.mesh);
        tree9.mesh.position.set(pos, 40, -1720);
        tree9.mesh.scale.set(3, 3, 3);

        // Trees on right
        scene.add(tree6.mesh);
        tree6.mesh.position.set(pos, 40, 1220);
        tree6.mesh.scale.set(3, 3, 3);

        scene.add(tree15.mesh);
        tree15.mesh.position.set(pos, 40, 1470);
        tree15.mesh.scale.set(3, 3, 3);
        
        scene.add(tree10.mesh);
        tree10.mesh.position.set(pos, 40, 1720);
        tree10.mesh.scale.set(3, 3, 3);


        if (i!=0) {
            // Trees on bottom
            scene.add(tree2.mesh);
            tree2.mesh.position.set(-970, 40, -pos);
            tree2.mesh.scale.set(3, 3, 3);

            // Trees on top
            scene.add(tree4.mesh);
            tree4.mesh.position.set(1470, 40, -pos);
            tree4.mesh.scale.set(3, 3, 3);

            scene.add(tree12.mesh);
            tree12.mesh.position.set(1720, 40, -pos);
            tree12.mesh.scale.set(3, 3, 3);            

            if (i < 6) {
                // Trees on left
                scene.add(tree7.mesh);
                tree7.mesh.position.set(-pos, 40, -1220);
                tree7.mesh.scale.set(3, 3, 3);

                scene.add(tree14.mesh);
                tree14.mesh.position.set(-pos, 40, -1470);
                tree14.mesh.scale.set(3, 3, 3);
                
                scene.add(tree17.mesh);
                tree17.mesh.position.set(-pos, 40, -1720);
                tree17.mesh.scale.set(3, 3, 3);

                // Trees on right
                scene.add(tree8.mesh);
                tree8.mesh.position.set(-pos, 40, 1220);
                tree8.mesh.scale.set(3, 3, 3);

                scene.add(tree16.mesh);
                tree16.mesh.position.set(-pos, 40, 1470);
                tree16.mesh.scale.set(3, 3, 3); 

                scene.add(tree18.mesh);
                tree18.mesh.position.set(-pos, 40, 1720);
                tree18.mesh.scale.set(3, 3, 3);               
            }
        }
    }
}

function createChicken() {
    chicken = new Chicken(Colors.white, 'white');
    scene.add(chicken.mesh);
}

function createBullet() {
    bullet = new Bullet();
    scene.add(bullet.mesh);
    bullet.mesh.position.set(0, -200, 0);
    bullets.push(bullet);
}

function createGround() {
    road = createBox(3500, 10, 3500, Colors.roadBlack, 240, -10, 0);
    // Add lines for perspective
    for (var i = 1; i < 14; i+=1) {
        position = -1750 + (250*i)
        crissCross = createBox(3500, 2, 2, Colors.white, 240, 1, 0);
        crissCross.position.z = position;
        scene.add(crissCross);

        crissCross2 = createBox(2, 2, 3500, Colors.white, 0, 1, 0);
        crissCross2.position.x = position + 250;
        scene.add(crissCross2);
    }
    scene.add(road);
}

function gameOver(){
    alert("You have been flyered! Try again.");
    document.location.reload(true);
    chicken.reload(forcedReload);
}


var movingLeft = false;
var movingRight = false;
var movingForward = false;
var movingBackward = false;
var isFiring = false;
var fireInterval = 0;
var bulletIndex = 0;
var zombieInterval = 120;
var loops = 0;

function loop(){
    var chickenDirection = new THREE.Vector3(0, 0, 0);

    // Uncomment to generate lots of zombies
    loops += 1;
    if (loops % zombieInterval == 0) {
        loops = 0;
        createZombie();
    }

    for (var i = 0; i < zombies.length; i += 1) {
        if (zombies[i].offScreen) {
            scene.remove(zombies[i]);
            zombies.splice(i, 1)
            i -= 1
        }
        else {
            zombies[i].headRotate();
            zombies[i].update();
        }
    }
    /**
    zombie.headRotate();
    zombie.update();
    **/

    // Move existing bullets
    for (var i = 0; i<bullets.length;i+=1) {
        currBullet = bullets[i];
        if (currBullet.onScreen) {
            currBullet.update();
        }
    }

    // Create new bullets for every 0.15 seconds that the mouse is down assuming 60 fps
    if (isFiring) {
        if (fireInterval % 9 == 0) {
            fireInterval = 0;
            while (bullets[bulletIndex].onScreen) {
                bulletIndex += 1;     
                bulletIndex = bulletIndex % bullets.length;        
            }
            bullets[bulletIndex].onScreen = true;
            bullets[bulletIndex].mesh.position.set(chicken.mesh.position.x, chicken.mesh.position.y, chicken.mesh.position.z);
        }
        fireInterval += 1;
    }

    // Update the chicken's position if the user is pressing keys
    if (movingLeft == true && chicken.mesh.position.z >= -1068) {
        left_or_right = -0.07;
    }
    else if (movingRight == true && chicken.mesh.position.z <= 1073) {
        left_or_right = 0.07;
    }
    else {
        left_or_right = 0;
    }

    if (movingForward == true && chicken.mesh.position.x <= 1350) {
        back_or_forward = 0.07;
    }
    else if (movingBackward == true && chicken.mesh.position.x >= -798) {
        back_or_forward = -0.07;
    }
    else {
        back_or_forward = 0;
    }

    var chickenDirection = new THREE.Vector3(back_or_forward, 0, left_or_right);

    chicken.update(chickenDirection, isFiring);

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

var left = 65;
var right = 68;
var up = 87;
var down = 83;
var mouseDown = false;

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

    document.addEventListener (
        'mousemove', 
        function(ev) {
            if (mouseDown) {
                isFiring = true;
                mouse_x_Coordinate = ev.pageX;
                mouse_y_Coordinate = ev.pageY;
            }
        }
    );

    document.addEventListener (
        'mousedown', 
        function(ev) {
            isFiring = true;
            mouseDown = true;
            mouse_x_Coordinate = ev.pageX;
            mouse_y_Coordinate = ev.pageY;
        }
    );

    document.addEventListener (
        'mouseup', 
        function(ev) {
            isFiring = false;
            fireInterval = 0;
            mouseDown = false;
        }
    );

}
window.addEventListener('load', init, false);
// init();  // uncomment for JSFiddle, wraps code in onLoad eventListener