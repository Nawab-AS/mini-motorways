import kaplay from "./kaplay.mjs";
import loadCars from "./car.js";
import loadRoads from "./roads.js";

// Set up the game window and scaling
const size = { width: 1280, height: 720, margin: 0.01 };
const scale = Math.min(
    window.innerWidth * (1 - size.margin * 2) / size.width,
    window.innerHeight * (1 - size.margin * 2) / size.height
);
kaplay({
    width: size.width,
    height: size.height,
    background: "#99e7d3",
    scale: scale,
});

loadRoot("./assets");

// Create managers for cars and roads
const CarManager = loadCars();
const Roads = loadRoads();

function addSnowEffect() {
    const snowflakes = [];
    for (let i = 0; i < 50; i++) {
        const snowflake = add([
            pos(rand(0, width()), rand(-height(), height())),
            circle(rand(1, 3)),
            color(255, 255, 255),
            opacity(rand(0.3, 0.8)),
            z(1000),
            "snowflake",
            {
                speed: rand(20, 60),
                sway: rand(-15, 15),
                swayOffset: rand(0, Math.PI * 2),
            }
        ]);
        snowflakes.push(snowflake);
    }
    
    onUpdate(() => {
        for (const flake of snowflakes) {
            if (!flake.exists()) continue;
            flake.pos.y += flake.speed * dt();
            flake.pos.x += Math.sin(time() + flake.swayOffset) * flake.sway * dt();
            
            if (flake.pos.y > height()) {
                flake.pos.y = -10;
                flake.pos.x = rand(0, width());
            }
        }
    });
}

scene("menu", () => {
    add([
        pos(0, 0),
        color(30, 30, 40),
        rect(width(), height()),
        z(-1),
    ]);
    
    addSnowEffect();
    
    add([
        text("Mini Motorways", { size: 72, font: "monospace" }),
        pos(width() / 2, height() / 2 - 150),
        anchor("center"),
        color(255, 255, 255),
    ]);
    
    const playButton = add([
        pos(width() / 2, height() / 2),
        anchor("center"),
        rect(250, 60),
        color(12, 72, 212),
        area(),
        z(10),
    ]);
    
    playButton.add([
        text("Play", { size: 36, font: "monospace" }),
        pos(0, 4),
        color(255, 255, 255),
        anchor("center"),
    ]);
    
    playButton.onClick(() => {
        go("game");
    });
    
    playButton.onHoverUpdate(() => {
        playButton.color = rgb(20, 100, 255);
    });
    
    playButton.onHoverEnd(() => {
        playButton.color = rgb(12, 72, 212);
    });
    
    const howToPlayButton = add([
        pos(width() / 2, height() / 2 + 90),
        anchor("center"),
        rect(250, 60),
        color(60, 60, 80),
        area(),
        z(10),
    ]);
    
    howToPlayButton.add([
        text("How to Play", { size: 30, font: "monospace" }),
        pos(0, 4),
        color(255, 255, 255),
        anchor("center"),
    ]);
    
    howToPlayButton.onClick(() => {
        go("howtoplay");
    });
    
    howToPlayButton.onHoverUpdate(() => {
        howToPlayButton.color = rgb(80, 80, 100);
    });
    
    howToPlayButton.onHoverEnd(() => {
        howToPlayButton.color = rgb(60, 60, 80);
    });
});

scene("howtoplay", () => {
    add([
        pos(0, 0),
        color(30, 30, 40),
        rect(width(), height()),
        z(-1),
    ]);
    
    addSnowEffect();
    
    add([
        text("How to Play", { size: 56, font: "monospace" }),
        pos(width() / 2, 60),
        anchor("center"),
        color(255, 255, 255),
    ]);
    
    const instructions = [
        "Connect houses to stores using roads",
        "Cars will deliver orders from houses to stores",
        "Each house can only have 2 cars at a time",
        "Click 'Edit Roads' to add or remove roads",
        "Stores with >5 orders turn red",
        "If a store stays red for 30 seconds, you lose",
        "Complete orders to earn points",
    ];
    
    let yPos = 150;
    for (const instruction of instructions) {
        add([
            text(instruction, { size: 22, font: "monospace" }),
            pos(width() / 2, yPos),
            anchor("center"),
            color(200, 200, 200),
        ]);
        yPos += 50;
    }
    
    const backButton = add([
        pos(width() / 2, height() - 80),
        anchor("center"),
        rect(200, 50),
        color(12, 72, 212),
        area(),
        z(10),
    ]);
    
    backButton.add([
        text("Back", { size: 28, font: "monospace" }),
        pos(0, 4),
        color(255, 255, 255),
        anchor("center"),
    ]);
    
    backButton.onClick(() => {
        go("menu");
    });
    
    backButton.onHoverUpdate(() => {
        backButton.color = rgb(20, 100, 255);
    });
    
    backButton.onHoverEnd(() => {
        backButton.color = rgb(12, 72, 212);
    });
});

scene("game", () => {
    // Set up game state and UI
    Roads.initGame();
    Roads.setupUI();
    Roads.setupClickHandler();
    
    addSnowEffect();
    
    // Set up car manager
    CarManager.init(Roads);

    // Main game loop
    onUpdate(() => {
        CarManager.update();
        Roads.updateUI();
    });
});

scene("gameover", (data) => {
    const finalScore = data.score || 0;
    
    // Get high score from browser storage
    let highScore = parseInt(localStorage.getItem("miniMotorwaysHighScore") || "0");
    
    // Update high score if the player beat it
    if (finalScore > highScore) {
        highScore = finalScore;
        localStorage.setItem("miniMotorwaysHighScore", highScore.toString());
    }
    
    // Draw background for game over screen
    add([
        pos(0, 0),
        color(50, 50, 50),
        rect(width(), height()),
        z(-1),
    ]);
    
    addSnowEffect();
    
    // Show "You Lost" message
    add([
        text("You Lost!", { size: 64, font: "monospace" }),
        pos(width() / 2, height() / 2 - 100),
        anchor("center"),
        color(255, 100, 100),
    ]);
    
    // Show player's score
    add([
        text(`Score: ${finalScore}`, { size: 36, font: "monospace" }),
        pos(width() / 2, height() / 2),
        anchor("center"),
        color(255, 255, 255),
    ]);
    
    // Show high score
    add([
        text(`High Score: ${highScore}`, { size: 36, font: "monospace" }),
        pos(width() / 2, height() / 2 + 50),
        anchor("center"),
        color(255, 215, 0),
    ]);
    
    // Add play again button
    const playButton = add([
        pos(width() / 2, height() / 2 + 130),
        anchor("center"),
        rect(200, 50),
        color(12, 72, 212),
        area(),
        z(10),
    ]);
    
    playButton.add([
        text("Play Again", { size: 28, font: "monospace" }),
        pos(0, 4),
        color(255, 255, 255),
        anchor("center"),
    ]);
    
    playButton.onClick(() => {
        go("game");
    });
    
    // Change button color when hovered
    playButton.onHoverUpdate(() => {
        playButton.color = rgb(20, 100, 255);
    });
    
    playButton.onHoverEnd(() => {
        playButton.color = rgb(12, 72, 212);
    });
});

go("menu");