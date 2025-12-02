
import kaplay from "./kaplay.mjs";
import loadCars from "./car.js";
import loadRoads from "./roads.js";

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
const CarManager = loadCars();
const Roads = loadRoads();
let editMode = false;

scene("game", () => {
    editMode = false;
    Roads.resetMap();
    Roads.setTotalRoads(50);
    Roads.generateLevel();

    // Start order generation after 10 seconds
    setTimeout(() => {
        Roads.startOrderGeneration();
    }, 10000);

    // CarManager handles all car logic
    CarManager.init(Roads);

    onUpdate(() => {
        CarManager.update();
        roadCounter.text = `Roads: ${Roads.getRoadCount()}/${Roads.getTotalRoads()}`;
    });

    const editButton = add([
        pos(width()/2, 10),
        anchor("center"),
        rect(150, 30),
        color(12, 72, 212, 1),
        z(1000),
        area(),
    ]);

    editButton.add([
        text("Edit Roads", { size: 24, font: "monospace" }),
        pos(0, 4),
        color(255, 255, 255),
        anchor("center"),
        z(editButton.z - 100),
    ]);

    editButton.onClick(() => {
        editMode = !editMode;
        editButton.get("text")[0].text = editMode ? "Done Editing" : "Edit Roads";
        editButton.width = editButton.get("text")[0].width + 20;
        roadCounter.opacity = editMode ? 1 : 0;
        if (editMode) {
            Roads.showEditMode();
        } else {
            Roads.hideEditMode();
        }
    });

    // Road counter UI
    const roadCounter = add([
        text("", { size: 20, font: "monospace" }),
        pos(width()/2 + 140, 4),
        z(1000),
        opacity(0),
    ]);

    onClick((_) => {
        if (!editMode) return;
        const pos = mousePos();
        const x = Math.floor(pos.x / Roads.tileSize);
        const y = Math.floor(pos.y / Roads.tileSize);
        if (Roads.isProtectedRoad(x, y)) return;
        // Toggle road
        if (Roads.hasRoad(x, y)) {
            Roads.removeRoad(x, y);
        } else {
            Roads.addRoad(x, y);
        }
    });
});

go("game");