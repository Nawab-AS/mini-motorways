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

scene("game", () => {
    // Set up game state and UI
    Roads.initGame();
    Roads.setupUI();
    Roads.setupClickHandler();
    
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

go("game");