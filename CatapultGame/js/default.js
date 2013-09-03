// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    var canvas, context, stage;
    var bgImage, p1Image, p2Image, ammoImage, p1Lives, p2Lives, title, endGameImage;
    var bgBitmap, p1Bitmap, p2Bitmap, ammoBitmap;
    var preload;

    var MAX_CLOUDS = 4;
    var cloudImages = [], cloudBitmaps = [], cloudSpeeds = [];

    // Calculate display scale factor, original assets assume 800x480

    var SCALE_X = window.innerWidth / 800;
    var SCALE_Y = window.innerHeight / 480;
    var MARGIN = 25;
    var GROUND_Y = 390 * SCALE_Y;

    var LIVES_PER_PLAYER = 3;
    var player1Lives = LIVES_PER_PLAYER;
    var player2Lives = LIVES_PER_PLAYER;

    var isShotFlying = false;
    var playerTurn = 1;
    var playerFire = false;
    var shotVelocity;

    var MAX_SHOT_POWER = 10;
    var GRAVITY = 0.07;

    var isAiming = false;
    var aimPower = 1;
    var aimStart, aimVector;

    var FIRE_SOUND_FILE = "/sounds/CatapultFire.wav";
    var HIT_SOUND_FILE = "/sounds/BoulderHit.wav";
    var EXPLODE_SOUND_FILE = "/sounds/CatapultExplosion.wav";
    var LOSE_SOUND_FILE = "/sounds/Lose.wav";
    var AIM_SOUND_FILE = "/sounds/RopeStretch.wav";
    var WIN_SOUND_FILE = "/sounds/Win.wav";


    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());
        }
    };

    function initialise() {
        canvas = document.getElementById("gameCanvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        context = canvas.getContext("2d");

        canvas.addEventListener("MSPointerUp", endAim, false);
        canvas.addEventListener("MSPointerMove", adjustAim, false);
        canvas.addEventListener("MSPointerDown", beginAim, false);

        stage = new createjs.Stage(canvas);

        // Preload the sounds and images via PreloadJS

        preload = new createjs.LoadQueue();
        preload.addEventListener( "complete", prepareGame );

        var manifest = [
            { id: "screenImage", src: "images/Backgrounds/gameplay_screen.png" },
            { id: "redImage", src: "images/Catapults/Red/redIdle/redidle.png" },
            { id: "blueImage", src: "images/Catapults/Blue/blueIdle/blueidle.png" },
            { id: "ammoImage", src: "images/Ammo/rock_ammo.png" },
            { id: "winImage", src: "images/Backgrounds/victory.png" },
            { id: "loseImage", src: "images/Backgrounds/defeat.png" },
            { id: "redFire", src: "images/Catapults/Red/redFire/redCatapult_fire.png" },
            { id: "blueFire", src: "images/Catapults/Blue/blueFire/blueCatapult_fire.png" },
            { id: "c1Image", src: "images/Backgrounds/cloud1.png" },
            { id: "c2Image", src: "images/Backgrounds/cloud2.png" },

            { id: "hitSound", src: HIT_SOUND_FILE },
            { id: "explodeSound", src: EXPLODE_SOUND_FILE },
            { id: "fireSound", src: FIRE_SOUND_FILE },
            { id: "loseSound", src: LOSE_SOUND_FILE },
            { id: "aimSound", src: AIM_SOUND_FILE },
            { id: "winSound", src: WIN_SOUND_FILE },
        ];

        preload.loadManifest(manifest);
    }

    function prepareGame() {
        // Draw background first
        bgImage = preload.getResult("screenImage"); // Used to need .result
        bgBitmap = new createjs.Bitmap(bgImage);
        bgBitmap.scaleX = SCALE_X;
        bgBitmap.scaleY = SCALE_Y;
        stage.addChild(bgBitmap);

        // Player 1 Catapult
        p1Image = preload.getResult("redImage");
        p1Bitmap = new createjs.Bitmap(p1Image)
        p1Bitmap.scaleX = SCALE_X;
        p1Bitmap.scaleY = SCALE_Y;
        p1Bitmap.x = MARGIN;
        p1Bitmap.y = GROUND_Y - p1Image.height * SCALE_Y;
        stage.addChild(p1Bitmap);

        // Player 2 Catapult
        p2Image = preload.getResult("blueImage");
        p2Bitmap = new createjs.Bitmap(p2Image)
        p2Bitmap.regX = p2Image.width;
        p2Bitmap.scaleX = -SCALE_X;
        p2Bitmap.scaleY = SCALE_Y;
        p2Bitmap.x = canvas.width - MARGIN - (p2Image.width * SCALE_X);
        p2Bitmap.y = GROUND_Y - p2Image.height * SCALE_Y;
        stage.addChild(p2Bitmap);

        // Boulder, not visible for now
        ammoImage = preload.getResult("ammoImage");
        ammoBitmap = new createjs.Bitmap(ammoImage)
        ammoBitmap.scaleX = SCALE_X;
        ammoBitmap.scaleY = SCALE_Y;
        ammoBitmap.visible = false;
        stage.addChild(ammoBitmap);

        // Clouds

        for (var i = 0; i < MAX_CLOUDS; ++i) {
            cloudImages[i] = preload.getResult((i % 2) ? "c1Image" : "c2Image");
            cloudBitmaps[i] = new createjs.Bitmap(cloudImages[i]);
            cloudBitmaps[i].scaleX = SCALE_X;
            cloudBitmaps[i].scaleY = SCALE_Y;
            cloudBitmaps[i].x = MARGIN * 6 * i
            cloudBitmaps[i].y = MARGIN * i;

            stage.addChild(cloudBitmaps[i]);
        }

        // Player 1 Lives
        p1Lives = new createjs.Text('Lives Left: ' + player1Lives, "20px sans-serif", "red");
        p1Lives.scaleX = SCALE_X;
        p1Lives.scaleY = SCALE_Y;
        p1Lives.x = MARGIN;
        p1Lives.y = MARGIN * SCALE_Y;
        stage.addChild(p1Lives);

        // Player 2 Lives
        p2Lives = new createjs.Text('Lives Left: ' + player2Lives, "20px sans-serif", "blue");
        p2Lives.scaleX = SCALE_X;
        p2Lives.scaleY = SCALE_Y;
        p2Lives.x = canvas.width - p2Lives.getMeasuredWidth() * SCALE_X - MARGIN;
        p2Lives.y = MARGIN * SCALE_Y;
        stage.addChild(p2Lives);

        // Game Title
        title = new createjs.Text('Catapult Wars', "30px sans-serif", "black");
        title.scaleX = SCALE_X;
        title.scaleY = SCALE_Y;
        title.x = canvas.width / 2 - title.getMeasuredWidth() * SCALE_X / 2;
        title.y = 30 * SCALE_Y;
        stage.addChild(title);

        stage.update();

        startGame();
    }

    function startGame() {
        createjs.Ticker.setInterval(window.requestAnimationFrame);
        createjs.Ticker.addListener(gameLoop);

        // Set up clouds
        for (var i = 0; i < MAX_CLOUDS; ++i)
            cloudSpeeds[i] = Math.random() * 2 + 0.5;

        if( Math.random() > 0.5 )
            for (var i = 0; i < MAX_CLOUDS; ++i)
                cloudSpeeds[i] = -cloudSpeeds[i];
    }

    function gameLoop() {
        update();
        draw();
    }

    function update() {
        updateClouds();

        // Deal with shots and firing.

        if (isShotFlying) {     // There's a shot in the air
            ammoBitmap.x += shotVelocity.x;
            ammoBitmap.y += shotVelocity.y;
            shotVelocity.y += GRAVITY;      // Apply gravity each time.

            if (ammoBitmap.y + ammoBitmap.image.height >= GROUND_Y ||       // Missed!
                ammoBitmap.x <= 0 ||
                ammoBitmap.x + ammoBitmap.image.width >= canvas.width) {
                isShotFlying = false;
                ammoBitmap.visible = false;
                playerTurn = playerTurn % 2 + 1;    // Swap player
            }
            else if (playerTurn == 1) {
                if (checkHit(p2Bitmap)) {    // Hit!
                    p2Lives.text = "Lives Left: " + --player2Lives;
                    processHit();
                }
            }
            else if (playerTurn == 2) {
                if (checkHit(p1Bitmap)) {
                    p1Lives.text = "Lives Left: " + --player1Lives;
                    processHit();
                }
            }
        }
        else if (playerTurn == 1) {
            // Does player 1 want to fire?

            if (playerFire) {
                playerFire = false;
                ammoBitmap.x = p1Bitmap.x + p1Bitmap.image.width * SCALE_X / 2;
                ammoBitmap.y = p1Bitmap.y;
                shotVelocity = aimVector;
                fireShot();
            }
        }
        else if (playerTurn == 2) {
            // For now, player always fires
            ammoBitmap.x = p2Bitmap.x + p2Bitmap.image.width * SCALE_X / 2;
            ammoBitmap.y = p2Bitmap.y;
            shotVelocity = new createjs.Point(
                Math.random() * -4 * SCALE_X - 3,
                Math.random() * -3 * SCALE_Y - 1);
            fireShot();
        }
    }

    function updateClouds() {
        for (var i = 0; i < MAX_CLOUDS; ++i) {
            cloudBitmaps[i].x += cloudSpeeds[i];

            if (cloudBitmaps[i].x > canvas.width) {
                cloudSpeeds[i] = Math.random() * 2 + 0.5;
                cloudBitmaps[i].x = -cloudBitmaps[i].image.width;
            }
            else if (cloudBitmaps[i].x < -cloudBitmaps[i].image.width) {
                cloudSpeeds[i] = Math.random() * -2 - 0.5;
                cloudBitmaps[i].x = canvas.width;
            }
        }
    }

    function beginAim(e) {      // Triggered by MSPointerDown
        if (playerTurn == 1) {
            if (!isAiming) {
                playSound(AIM_SOUND_FILE);
                aimStart = new createjs.Point(e.x, e.y);
                isAiming = true;
            }
        }
    }

    function adjustAim(e) {     // Triggered by MSPointerMove
        if (isAiming) {
            var aimCurrent = new createjs.Point(e.x, e.y);
            aimVector = calculateShot(aimStart, aimCurrent);
            // TODO - Show text or an arrow
            Debug.writeln("Aiming... " + aimVector.x + ", " + aimVector.y);
        }
    }

    function endAim(e) {
        if (isAiming) {
            isAiming = false;
            var aimCurrent = new createjs.Point(e.x, e.y);
            aimVector = calculateShot(aimStart, aimCurrent);
            playerFire = true;
        }
    }

    function calculateShot( start, current) {
        // NOTE: This only works for player 1

        var aim = new createjs.Point((current.x - start.x) / 80, (current.y - start.y) / 80);

        // Constrain x to 0 -> MAX_SHOT_POWER
        aim.x = Math.min(MAX_SHOT_POWER, aim.x);
        aim.x = Math.max(0, aim.x);

        // Likewise, contrain y to -MAX_SHOT_POWER -> 0
        aim.y = Math.max(-MAX_SHOT_POWER, aim.y);
        aim.y = Math.min(0, aim.y);

        return aim;
    }

    function fireShot() {
        playSound(FIRE_SOUND_FILE);
        ammoBitmap.visible = true;
        isShotFlying = true;
    }

    function checkHit(target) {
        // EaselJS hitTest() method doesn't factor in scaling,
        // so we'll use bounding boxes

        // Centre of Rock
        var shotX = ammoBitmap.x + ammoBitmap.image.width / 2;
        var shotY = ammoBitmap.y + ammoBitmap.image.height / 2;

        // Is it inside the bitmap?

        return (shotX >= target.x) && (shotX <= target.x + target.image.width * SCALE_X) &&
               (shotY >= target.y) && (shotY <= target.y + target.image.height * SCALE_Y);
    }

    function processHit() {
        playSound(HIT_SOUND_FILE);
        isShotFlying = false;               // Stop shot
        ammoBitmap.visible = false;         // Hide shot
        playerTurn = playerTurn % 2 + 1;    // Swap player

        if (player1Lives <= 0 || player2Lives <= 0) {
            endGame();
        }
    }

    function endGame() {
        createjs.Ticker.setPaused(true);    // Stop updates

        // Show win or lose

        var endGameImage;

        if (player1Lives <= 0) {
            endGameImage = preload.getResult("loseImage");
            playSound(LOSE_SOUND_FILE);
        }
        else if (player2Lives <= 0) {
            endGameImage = preload.getResult("winImage");
            playSound(WIN_SOUND_FILE);
        }

        var endGameBitmap = new createjs.Bitmap(endGameImage);

        endGameBitmap.x = canvas.width / 2 - endGameImage.width * SCALE_X / 2;
        endGameBitmap.y = canvas.height / 2 - endGameImage.height * SCALE_Y / 2;
        endGameBitmap.scaleX = SCALE_X;
        endGameBitmap.scaleY = SCALE_Y;

        stage.addChild(endGameBitmap);
        stage.update();
    }

    function draw() {
        stage.update();     // Ooh, that was difficult!
    }

    // For simplicity, this uses one audio instance per sound.
    //  It avoids clipping, but incurs overhead of additional instances.
    //  A more sophisticated implementation might use a pool.
    //  See also: http://msdn.microsoft.com/en-us/hh550087.aspx

    function playSound( path ) {
        var sound = document.createElement("audio");

        sound.src = path;
        sound.autoplay = true;
    }

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };

    document.addEventListener("DOMContentLoaded", initialise, false);
    app.start();
})();

