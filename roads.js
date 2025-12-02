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
                
                // Find houses of this color
                const colorHouses = [];
                for (const pos of placedPositions) {
                    const key = `${pos.x},${pos.y}`;
                    const houseData = this.houses.get(key);
                    if (houseData && houseData.color === color) {
                        colorHouses.push(pos);
                    }
                }
                
                for (let i = 0; i < storeCount; i++) {
                    let storePos = null;
                    const maxAttempts = 100;
                    
                    for (let attempt = 0; attempt < maxAttempts; attempt++) {
                        const pos = findValidPosition(true);
                        if (!pos) continue;
                        
                        // Check if within 9 tiles of any house of matching color
                        let withinRange = false;
                        for (const house of colorHouses) {
                            const distance = Math.abs(house.x - pos.x) + Math.abs(house.y - pos.y);
                            if (distance <= 9) {
                                withinRange = true;
                                break;
                            }
                        }
                        
                        if (withinRange) {
                            storePos = pos;
                            break;
                        }
                    }
                    
                    if (!storePos) continue;
                    
                    const orientation = orientations[Math.floor(Math.random() * orientations.length)];
                    const success = this.addStore(storePos.x, storePos.y, orientation, color);
                    
                    if (success) {
                        placedPositions.push(storePos);
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
                
                // Display order count as number
                add([
                    pos(px + this.tileSize, py + this.tileSize / 2),
                    text(`${orderCount}`, { size: 20, font: "monospace" }),
                    color(255, 200, 0),
                    anchor("center"),
                    "order-indicator",
                    z(3),
                ]);
            }
        }

        addOrder(x, y) {
            const key = `${x},${y}`;
            if (!this.stores.has(key)) return false;
            
            const currentOrders = this.orders.get(key) || 0;
            if (currentOrders >= 5) return false; // Max 5 orders per store
            
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

        getHousePositions() {
            const positions = [];
            for (const [key, houseData] of this.houses) {
                const [x, y] = key.split(',').map(Number);
                positions.push({ x, y, color: houseData.color });
            }
            return positions;
        }

        getStoresWithOrders() {
            const storesWithOrders = [];
            for (const [key, orderCount] of this.orders) {
                if (orderCount > 0) {
                    const [x, y] = key.split(',').map(Number);
                    const storeData = this.stores.get(key);
                    storesWithOrders.push({ x, y, color: storeData.color, orders: orderCount });
                }
            }
            storesWithOrders.sort((a, b) => b.orders - a.orders);
            return storesWithOrders;
        }

        findPath(startX, startY, endX, endY) {
            // A* pathfinding algorithm
            const openSet = [{ x: startX, y: startY, g: 0, h: 0, f: 0, parent: null }];
            const closedSet = new Set();
            
            const heuristic = (x, y) => Math.abs(x - endX) + Math.abs(y - endY);
            
            while (openSet.length > 0) {
                // Find node with lowest f score
                openSet.sort((a, b) => a.f - b.f);
                const current = openSet.shift();
                
                // Reached destination
                if (current.x === endX && current.y === endY) {
                    const path = [];
                    let node = current;
                    while (node) {
                        path.unshift({ x: node.x, y: node.y });
                        node = node.parent;
                    }
                    return path;
                }
                
                closedSet.add(`${current.x},${current.y}`);
                
                // Check neighbors
                for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                    const nx = current.x + dx;
                    const ny = current.y + dy;
                    const nKey = `${nx},${ny}`;
                    
                    // Skip if already visited
                    if (closedSet.has(nKey)) continue;
                    
                    // Skip if no road
                    if (!this.roads.has(nKey)) continue;
                    
                    const g = current.g + 1;
                    const h = heuristic(nx, ny);
                    const f = g + h;
                    
                    // Check if already in open set
                    const existing = openSet.find(n => n.x === nx && n.y === ny);
                    if (existing) {
                        if (g < existing.g) {
                            existing.g = g;
                            existing.f = f;
                            existing.parent = current;
                        }
                    } else {
                        openSet.push({ x: nx, y: ny, g, h, f, parent: current });
                    }
                }
            }
            
            return null; // No path found
        }

        startOrderGeneration() {
            
            const generateOrders = () => {
                // For each house, potentially generate an order for a matching store
                for (const [houseKey, houseData] of this.houses) {
                    // Find stores matching this house color
                    const matchingStores = [];
                    for (const [storeKey, storeData] of this.stores) {
                        if (storeData.color === houseData.color) {
                            matchingStores.push(storeKey);
                        }
                    }
                    
                    
                    if (matchingStores.length === 0) continue;
                    
                    // Randomly pick a matching store to add an order
                    const randomStoreKey = matchingStores[Math.floor(Math.random() * matchingStores.length)];
                    const [x, y] = randomStoreKey.split(',').map(Number);
                    this.addOrder(x, y);
                }
                
                // Schedule next order generation with random delay (5-10 seconds)
                const delay = 5000 + Math.random() * 5000;
                this.orderTimer = setTimeout(generateOrders, delay);
            };
            
            generateOrders();
        }

        stopOrderGeneration() {
            if (this.orderTimer) {
                clearTimeout(this.orderTimer);
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

        getAdjacentRoad(x, y) {
            // Find a road tile adjacent to this position
            for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const nx = x + dx;
                const ny = y + dy;
                if (this.roads.has(`${nx},${ny}`)) {
                    return { x: nx, y: ny };
                }
            }
            return null;
        }
    }

    // load images
    for (let color of ['blue', 'red', 'green']) {       
        loadSprite(`${color}House`, `/houses/${color}House.png`);
    }
    return new roads(...args);
}