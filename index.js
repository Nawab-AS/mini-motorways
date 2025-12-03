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
const Car = loadCars();
const Roads = loadRoads();
let editMode = false;


scene("game", () => {
    editMode = false;
    Roads.resetMap();
    Roads.setTotalRoads(50);
    Roads.generateLevel();
    
    // Delay order generation so player can edit roads first
    setTimeout(() => {
        Roads.startOrderGeneration();
    }, 10000);

    const activeCars = [];
    const carSpawnTimer = 0.5;
    let timeSinceLastCheck = 0;
    let lastTime = Date.now();
    const carsPerHouse = new Map();
    const houseLastSpawn = new Map();


    // Handles car spawning, pathfinding, and cooldown logic for houses
    onUpdate(() => {
        const now = Date.now();
        const dt = (now - lastTime) / 1000;
        lastTime = now;
        
        roadCounter.text = `Roads: ${Roads.getRoadCount()}/${Roads.getTotalRoads()}`;
        // Remove inactive cars from the array
        for (let i = activeCars.length - 1; i >= 0; i--) {
            const carInstance = activeCars[i];
            carInstance.update(dt);
            
            if (!carInstance.active) {
                activeCars.splice(i, 1);
            }
        }
        
        // Try to spawn a car if there are pending orders
        timeSinceLastCheck += dt;
        if (timeSinceLastCheck >= carSpawnTimer) {
            timeSinceLastCheck = 0;
            
            const storesWithOrders = Roads.getStoresWithOrders();
            const houses = Roads.getHousePositions();
            
            // Prioritize stores with more orders
            storesWithOrders.sort((a, b) => b.orders - a.orders);
            
            for (const store of storesWithOrders) {                
                // Only spawn cars from houses that match the store color
                const matchingHouses = houses.filter(h => h.color === store.color);
                if (matchingHouses.length === 0) continue;
                
                // Only allow up to 2 cars per house, and add a cooldown between spawns
                let house = null;
                const currentTime = Date.now();
                const availableHouses = matchingHouses.filter(h => {
                    const houseKey = `${h.x},${h.y}`;
                    const carCount = carsPerHouse.get(houseKey) || 0;
                    const lastSpawn = houseLastSpawn.get(houseKey) || 0;
                    const timeSinceSpawn = currentTime - lastSpawn;
                    return carCount < 2 && timeSinceSpawn >= 4000;
                });
                
                if (availableHouses.length === 0) continue;
                
                house = availableHouses[Math.floor(Math.random() * availableHouses.length)];
                const houseKey = `${house.x},${house.y}`;
                
                // Find adjacent road tiles for house and store
                const houseRoad = Roads.getAdjacentRoad(house.x, house.y);
                const storeRoad = Roads.getAdjacentRoad(store.x, store.y);
                
                if (!houseRoad || !storeRoad) continue;
                
                // Use A* pathfinding to get routes
                const pathToStore = Roads.findPath(houseRoad.x, houseRoad.y, storeRoad.x, storeRoad.y);
                if (!pathToStore) continue;
                
                // Get return path for car
                const pathToHome = Roads.findPath(storeRoad.x, storeRoad.y, houseRoad.x, houseRoad.y);
                if (!pathToHome) continue;
                
                // Convert grid coordinates to pixel coordinates
                const tileSize = Roads.tileSize;
                const pathToStorePixels = pathToStore.map(p => ({
                    x: (p.x + 0.5) * tileSize,
                    y: (p.y + 0.5) * tileSize
                }));
                const pathToHomePixels = pathToHome.map(p => ({
                    x: (p.x + 0.5) * tileSize,
                    y: (p.y + 0.5) * tileSize
                }));
                
                // Car starts at house position
                const startPos = [(house.x + 0.5) * tileSize, (house.y + 0.5) * tileSize];
                
                // Car goes to store, then returns home
                const fullPath = [...pathToStorePixels, ...pathToHomePixels];
                const storeWaypointIndex = pathToStorePixels.length;
                
                const carInstance = new Car(
                    store.color, 
                    startPos, 
                    fullPath, 
                    () => {
                        // When car finishes, remove it and update house car count
                        carInstance.destroy();
                        const currentCount = carsPerHouse.get(houseKey) || 0;
                        carsPerHouse.set(houseKey, Math.max(0, currentCount - 1));
                    },
                    () => {
                        // When car reaches store, remove one order
                        Roads.removeOrder(store.x, store.y);
                    },
                    storeWaypointIndex
                );
                
                activeCars.push(carInstance);
                
                // Track how many cars are active for this house
                const currentCount = carsPerHouse.get(houseKey) || 0;
                carsPerHouse.set(houseKey, currentCount + 1);
                
                // Track last spawn time for cooldown
                houseLastSpawn.set(houseKey, Date.now());
                
                houseLastSpawn.set(houseKey, Date.now());
                break; // Only spawn one car per update
            }
        }
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

    // Shows how many roads are placed
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