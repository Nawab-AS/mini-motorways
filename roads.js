export default function loadRoads(...args) {
    class roads {
        roadColor = '#a0826d';
        tileSize = 32;
        static size = [40, 23]
        constructor() {
            this.roads = new Map();
            this.houses = new Map();
            this.stores = new Map();
            this.orders = new Map();
            this.totalRoads = 50;
            this.protectedRoads = new Set();
        }

        resetMap() {
            this.roads = new Map();
            this.houses = new Map();
            this.stores = new Map();
            this.orders = new Map();
            this.protectedRoads = new Set();
            get("bg").forEach(display => destroy(display));

            add([
                pos(0, 0),
                color('#8ca7ae'),
                rect(roads.size[0] * this.tileSize, roads.size[1] * this.tileSize),
                z(-2),
                "bg"
            ])
            add([
                pos(this.tileSize, this.tileSize),
                color('#78cd6f'),
                rect((roads.size[0]-2) * this.tileSize, (roads.size[1]-2) * this.tileSize),
                z(-1),
                "bg"
            ])
        }

        generateLevel() {
            const availableColors = ['blue', 'red', 'green'];
            const selectedColors = [];
            
            // Pick 2 random colors
            for (let i = 0; i < 2; i++) {
                const randomIndex = Math.floor(Math.random() * availableColors.length);
                selectedColors.push(availableColors[randomIndex]);
                availableColors.splice(randomIndex, 1);
            }
            
            const orientations = ['up', 'down', 'left', 'right'];
            const minDistance = 5;
            const placedPositions = [];
            
            // Helper function to check if position is far enough from existing placements
            const isFarEnough = (x, y) => {
                for (const pos of placedPositions) {
                    const distance = Math.abs(pos.x - x) + Math.abs(pos.y - y);
                    if (distance < minDistance) return false;
                }
                return true;
            };
            
            // Helper function to find valid position
            const findValidPosition = (isStore = false) => {
                const maxAttempts = 100;
                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    const x = Math.floor(Math.random() * (roads.size[0] - 4)) + 2;
                    const y = Math.floor(Math.random() * (roads.size[1] - 4)) + 2;
                    
                    if (isFarEnough(x, y)) {
                        return { x, y };
                    }
                }
                return null;
            };
            
            // Place houses
            for (const color of selectedColors) {
                const pos = findValidPosition();
                if (!pos) continue;
                
                const orientation = orientations[Math.floor(Math.random() * orientations.length)];
                const success = this.addHouse(pos.x, pos.y, orientation, color);
                
                if (success) {
                    placedPositions.push(pos);
                }
            }
            
            // Place stores (1-2 stores per color)
            for (const color of selectedColors) {
                const storeCount = Math.floor(Math.random() * 2) + 1;
                
                for (let i = 0; i < storeCount; i++) {
                    const pos = findValidPosition(true);
                    if (!pos) continue;
                    
                    const orientation = orientations[Math.floor(Math.random() * orientations.length)];
                    const success = this.addStore(pos.x, pos.y, orientation, color);
                    
                    if (success) {
                        placedPositions.push(pos);
                    }
                }
            }
        }

        placeHouse() {
            while (true) {
                const pos = [rand(0, roads.size[0] - 1), rand(0, roads.size[1] - 1)];
                if (!this.map[pos[1]][pos[0]]) continue; // border

            }
        }

        addRoad(x, y) {
            // position in range
            if (x <= 0 || x >= roads.size[0] - 1 || y <= 0 || y >= roads.size[1] - 1) {
                return false;
            }

            const key = `${x},${y}`;
            if (this.roads.has(key)) return false; // road exists
            if (this.roads.size >= this.totalRoads) return false;

            // Add the road
            this.roads.set(key, true);
            this.#generateRoads();
            return true;
        }

        removeRoad(x, y) {
            const key = `${x},${y}`;
            
            if (this.protectedRoads.has(key)) return false;
            
            // Remove road
            this.roads.delete(key);
            this.#generateRoads();
            return true;
        }

        addHouse(x, y, orientation, color) {
            if (!['up', 'down', 'left', 'right'].includes(orientation)) return false;
            if (color && !['blue', 'red', 'green'].includes(color)) return false;

            // valid position (not on border)
            if (x <= 0 || x >= roads.size[0] - 1 || y <= 0 || y >= roads.size[1] - 1) return false;
            
            const key = `${x},${y}`;
            if (this.houses.has(key)) return false;


            // Add house
            this.houses.set(key, { orientation, color });

            // Add road
            const offsets = {
                'up': [0, -1],
                'down': [0, 1],
                'left': [-1, 0],
                'right': [1, 0]
            };
            const [dx, dy] = offsets[orientation];
            this.roads.set(`${x + dx},${y + dy}`, true);
            this.protectedRoads.add(`${x + dx},${y + dy}`);

            this.#generateRoads();
            this.#generateHouses();
            return true;
        }

        removeHouse(x, y) {
            const key = `${x},${y}`;

            // House exists
            if (!this.houses.has(key)) {
                return false;
            }

            const houseData = this.houses.get(key);

            // Remove house
            this.houses.delete(key);

            // Remove connected road
            const offsets = {
                'up': [0, -1],
                'down': [0, 1],
                'left': [-1, 0],
                'right': [1, 0]
            };
            const [dx, dy] = offsets[houseData.orientation];
            this.roads.delete(`${x + dx},${y + dy}`);
            this.protectedRoads.delete(`${x + dx},${y + dy}`);

            this.#generateRoads();
            this.#generateHouses();
            return true;
        }

        addStore(x, y, orientation, color) {
            if (!['up', 'down', 'left', 'right'].includes(orientation)) return false;
            
            if (color && !['blue', 'red', 'green'].includes(color)) return false;

            // Position Valid (not on border)
            if (x <= 0 || x >= roads.size[0] - 2 || y <= 0 || y >= roads.size[1] - 2) return false;

            const key = `${x},${y}`;
            if (this.stores.has(key)) return false;

            // Add store
            this.stores.set(key, { orientation, color });
            this.orders.set(key, 0);

            // Add roads
            const offsets = {
                'up': [[0, -1], [1, -1]],
                'down': [[0, 2], [1, 2]],
                'left': [[-1, 0], [-1, 1]],
                'right': [[2, 0], [2, 1]]
            };
            const roadOffsets = offsets[orientation];
            for (const [dx, dy] of roadOffsets) {
                const available = this.addRoad(x + dx, y + dy);
                if (!available) { // Rollback
                    this.stores.delete(key);
                    for (const [rdx, rdy] of roadOffsets) {
                        this.removeRoad(x + rdx, y + rdy);
                    }
                    return false;
                }
                this.protectedRoads.add(`${x + dx},${y + dy}`);
            }

            this.#generateRoads();
            this.#generateStores();
            return true;
        }

        removeStore(x, y) {
            const key = `${x},${y}`;

            // Check if store exists
            if (!this.stores.has(key)) {
                return false;
            }

            const storeData = this.stores.get(key);

            // Remove the store
            this.stores.delete(key);
            this.orders.delete(key);

            // Remove roads
            const offsets = {
                'up': [[0, -1], [1, -1]],
                'down': [[0, 2], [1, 2]],
                'left': [[-1, 0], [-1, 1]],
                'right': [[2, 0], [2, 1]]
            };
            const roadOffsets = offsets[storeData.orientation];
            for (const [dx, dy] of roadOffsets) {
                this.roads.delete(`${x + dx},${y + dy}`);
                this.protectedRoads.delete(`${x + dx},${y + dy}`);
            }

            this.#generateRoads();
            this.#generateStores();
            return true;
        }

        #generateHouses() {
            get("house").forEach(display => destroy(display));

            for (const [key, houseData] of this.houses) {
                const [x, y] = key.split(',').map(Number);
                const px = x * this.tileSize;
                const py = y * this.tileSize;

                add([
                    pos(px + this.tileSize / 2, py + this.tileSize / 2),
                    sprite(`${houseData.color}House`),
                    anchor("center"),
                    scale(this.tileSize / 500),
                    "house",
                    z(2)
                ]);
            }
        }

        #generateStores() {
            get("store").forEach(display => destroy(display));

            for (const [key, storeData] of this.stores) {
                const [x, y] = key.split(',').map(Number);
                const px = x * this.tileSize;
                const py = y * this.tileSize;

                add([
                    pos(px + this.tileSize, py + this.tileSize),
                    sprite(`${storeData.color}House`),
                    anchor("center"),
                    scale(this.tileSize / 250),
                    "store",
                    z(2),
                ]);
            }
            
            this.#generateOrderIndicators();
        }

        #generateOrderIndicators() {
            get("order-indicator").forEach(display => destroy(display));

            for (const [key, orderCount] of this.orders) {
                if (orderCount === 0) continue;
                
                const [x, y] = key.split(',').map(Number);
                const px = x * this.tileSize;
                const py = y * this.tileSize;
                
                // Draw arrow indicators above the store
                const arrowSize = 8;
                const spacing = 12;
                const maxDisplay = Math.min(orderCount, 5);
                const startX = px + this.tileSize - (maxDisplay - 1) * spacing / 2;
                
                for (let i = 0; i < maxDisplay; i++) {
                    const arrowX = startX + i * spacing;
                    const arrowY = py + this.tileSize / 2 - 8;
                    
                    // Triangle pointing down
                    add([
                        pos(arrowX, arrowY),
                        polygon([
                            vec2(0, -arrowSize),
                            vec2(-arrowSize/2, 0),
                            vec2(arrowSize/2, 0),
                        ]),
                        color(255, 200, 0),
                        anchor("center"),
                        "order-indicator",
                        z(3),
                    ]);
                }
                
                // Show number if more than 5 orders
                if (orderCount > 5) {
                    add([
                        pos(px + this.tileSize, py + this.tileSize / 2 - 8),
                        text(`${orderCount}`, { size: 12, font: "monospace" }),
                        color(255, 200, 0),
                        anchor("center"),
                        "order-indicator",
                        z(3),
                    ]);
                }
            }
        }

        addOrder(x, y) {
            const key = `${x},${y}`;
            if (!this.stores.has(key)) return false;
            
            const currentOrders = this.orders.get(key) || 0;
            this.orders.set(key, currentOrders + 1);
            this.#generateOrderIndicators();
            return true;
        }

        removeOrder(x, y) {
            const key = `${x},${y}`;
            if (!this.stores.has(key)) return false;
            
            const currentOrders = this.orders.get(key) || 0;
            if (currentOrders > 0) {
                this.orders.set(key, currentOrders - 1);
                this.#generateOrderIndicators();
                return true;
            }
            return false;
        }

        getStorePositions() {
            const positions = [];
            for (const [key, storeData] of this.stores) {
                const [x, y] = key.split(',').map(Number);
                positions.push({ x, y, color: storeData.color });
            }
            return positions;
        }

        startOrderGeneration() {
            this.orderTimer = setInterval(() => {
                const storeKeys = Array.from(this.stores.keys());
                if (storeKeys.length === 0) return;
                
                // Randomly pick a store to add an order
                const randomKey = storeKeys[Math.floor(Math.random() * storeKeys.length)];
                const [x, y] = randomKey.split(',').map(Number);
                this.addOrder(x, y);
            }, 3000); // Add order every 3 seconds
        }

        stopOrderGeneration() {
            if (this.orderTimer) {
                clearInterval(this.orderTimer);
                this.orderTimer = null;
            }
        }

        #generateRoads() {
            get("road").forEach(display => destroy(display));
            const tileSize = this.tileSize;
            const roadWidth = tileSize * 0.75;

            for (const [key, _] of this.roads) {
                const [x, y] = key.split(',').map((num) => (parseInt(num)+0.5)*tileSize);
                
                add([
                    pos(x, y),
                    color('#a0826d'),
                    rect(roadWidth, roadWidth),
                    anchor("center"),
                    "road",
                    z(0)
                ]);

                for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    const neighborX = Math.floor(x / tileSize) + dx;
                    const neighborY = Math.floor(y / tileSize) + dy;
                    const neighborKey = `${neighborX},${neighborY}`;
                    
                    let hasConnection = this.roads.has(neighborKey);
                    
                    if (!hasConnection) {
                        const directionKey = `${dx},${dy}`;
                        const orientationMap = {
                            '-1,0': 'right',
                            '1,0': 'left',
                            '0,-1': 'down',
                            '0,1': 'up'
                        };
                        const requiredOrientation = orientationMap[directionKey];
                        const houseData = this.houses.get(neighborKey);
                        const storeData = this.stores.get(neighborKey);
                        
                        if ((houseData && houseData.orientation === requiredOrientation) || 
                            (storeData && storeData.orientation === requiredOrientation)) {
                            hasConnection = true;
                        }
                        
                        // stores
                        if (!hasConnection) {
                            const storeChecks = [
                                [neighborX, neighborY],
                                [neighborX - 1, neighborY],
                                [neighborX, neighborY - 1],
                                [neighborX - 1, neighborY - 1]
                            ];
                            
                            for (const [storeX, storeY] of storeChecks) {
                                const adjacentStoreKey = `${storeX},${storeY}`;
                                const adjacentStore = this.stores.get(adjacentStoreKey);
                                
                                if (adjacentStore && adjacentStore.orientation === requiredOrientation) {
                                    hasConnection = true;
                                    break;
                                }
                            }
                        }
                    }
                    
                    if (!hasConnection) continue;
                    
                    if (dx !== 0) { // horizontal
                        add([
                            pos(x + (dx * roadWidth / 2), y),
                            color(this.roadColor),
                            rect(roadWidth, roadWidth),
                            anchor("center"),
                            "road",
                            z(0),
                        ]);
                    } else { // vertical
                        add([
                            pos(x, y + (dy * roadWidth / 2)),
                            color(this.roadColor),
                            rect(roadWidth, roadWidth),
                            anchor("center"),
                            "road",
                            z(0),
                        ]);
                    }
                }
            }
        }

        showEditMode() {
            const [width, height] = roads.size;
            const tileSize = this.tileSize;
            
            // vertical lines
            for (let i = 0; i <= width; i++) {
                add([
                    pos(i * tileSize, tileSize),
                    rect(2, (height - 2) * tileSize),
                    color(200, 200, 200),
                    opacity(0.5),
                    anchor("top"),
                    "edit-mode",
                    z(999),
                ]);
            }
            
            // horizontal lines
            for (let i = 1; i <= height; i++) {
                add([
                    pos(tileSize, i * tileSize),
                    rect((width - 2) * tileSize, 2),
                    color(255, 255, 255),
                    opacity(0.5),
                    anchor("left"),
                    "edit-mode",
                    z(999),
                ]);
            }
            
            // Show protected roads overlay
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const key = `${x},${y}`;
                    if (this.protectedRoads.has(key)) {
                        add([
                            pos(x * tileSize, y * tileSize),
                            rect(tileSize, tileSize),
                            color(255, 0, 0),
                            opacity(0.3),
                            "edit-mode",
                            z(998),
                        ]);
                    }
                }
            }
        }


        // low-level helper functions (for index.js)

        hideEditMode() {
            get("edit-mode").forEach(display => destroy(display));
        }

        setTotalRoads(count) {
            this.totalRoads = count;
        }

        getTotalRoads() {
            return this.totalRoads;
        }

        getRoadCount() {
            return this.roads.size;
        }

        hasRoad(x, y) {
            return this.roads.has(`${x},${y}`);
        }

        isProtectedRoad(x, y) {
            return this.protectedRoads.has(`${x},${y}`);
        }
    }

    // load images
    for (let color of ['blue', 'red', 'green']) {       
        loadSprite(`${color}House`, `/houses/${color}House.png`);
    }
    return new roads(...args);
}