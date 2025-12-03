export default function loadRoads(...args) {
    class roads {
        roadColor = '#393939';
        tileSize = 32;
        static size = [40, 23]
        constructor() {
            this.roads = new Map();
            this.houses = new Map();
            this.stores = new Map();
            this.orders = new Map();
            this.orderQueue = []; // Queue of pending orders {storeX, storeY, color, timestamp}
            this.totalRoads = 50;
            this.protectedRoads = new Set();
            this.score = 0;
            this.warningStores = new Map(); // Stores with > 5 orders
            this.storeTimers = new Map(); // Timers for warning stores
        }

        resetMap() {
            this.roads = new Map();
            this.houses = new Map();
            this.stores = new Map();
            this.orders = new Map();
            this.protectedRoads = new Set();
            this.score = 0;
            this.warningStores = new Map();
            this.storeTimers = new Map();
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
            
            // Pick 1 random color
            const randomIndex = Math.floor(Math.random() * availableColors.length);
            selectedColors.push(availableColors[randomIndex]);
            
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

            // Give player 5-15 additional roads when a house spawns
            const bonusRoads = Math.floor(Math.random() * 11) + 5; // 5 to 15
            this.totalRoads += bonusRoads;

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
            // Draw all houses
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
            // Draw all stores
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
            get("warning-indicator").forEach(display => destroy(display));
            get("timer-indicator").forEach(display => destroy(display));

            for (const [key, orderCount] of this.orders) {
                if (orderCount === 0) continue;
                
                const [x, y] = key.split(',').map(Number);
                const px = x * this.tileSize;
                const py = y * this.tileSize;
                
                // Warning state if > 5 orders
                const isWarning = orderCount > 5;
                const textColor = isWarning ? [255, 0, 0] : [255, 200, 0];
                
                // Display order count as number
                add([
                    pos(px + this.tileSize, py + this.tileSize / 2),
                    text(`${orderCount}`, { size: 20, font: "monospace" }),
                    color(...textColor),
                    anchor("center"),
                    "order-indicator",
                    z(3),
                ]);
                
                // Add warning background and countdown for stores with > 5 orders
                if (isWarning) {
                    add([
                        pos(px, py),
                        rect(this.tileSize * 2, this.tileSize * 2),
                        color(255, 0, 0),
                        opacity(0.3),
                        anchor("topleft"),
                        "warning-indicator",
                        z(1.5),
                    ]);
                    
                    // Show countdown timer
                    const startTime = this.warningStores.get(key);
                    if (startTime) {
                        const elapsed = (Date.now() - startTime) / 1000;
                        const remaining = Math.max(0, 30 - elapsed);
                        add([
                            pos(px + this.tileSize, py + this.tileSize * 1.5),
                            text(`${remaining.toFixed(1)}s`, { size: 16, font: "monospace" }),
                            color(255, 255, 255),
                            anchor("center"),
                            "timer-indicator",
                            z(3),
                        ]);
                    }
                }
            }
        }

        addOrder(x, y) {
            const key = `${x},${y}`;
            if (!this.stores.has(key)) return false;
            
            const currentOrders = this.orders.get(key) || 0;
            this.orders.set(key, currentOrders + 1);
            
            // Add to order queue
            const storeData = this.stores.get(key);
            this.orderQueue.push({
                storeX: x,
                storeY: y,
                color: storeData.color,
                timestamp: Date.now()
            });
            
            // Start timer if exceeds 5 orders
            if (currentOrders + 1 > 5 && !this.warningStores.has(key)) {
                this.warningStores.set(key, Date.now());
                this.startStoreTimer(key);
            }
            
            this.#generateOrderIndicators();
            return true;
        }

        removeOrder(x, y) {
            const key = `${x},${y}`;
            if (!this.stores.has(key)) return false;
            
            const currentOrders = this.orders.get(key) || 0;
            if (currentOrders > 0) {
                this.orders.set(key, currentOrders - 1);
                this.score++; // Increment score for completed order
                
                // Clear warning if orders drop to 5 or below
                if (currentOrders - 1 <= 5 && this.warningStores.has(key)) {
                    this.warningStores.delete(key);
                    if (this.storeTimers.has(key)) {
                        clearTimeout(this.storeTimers.get(key));
                        this.storeTimers.delete(key);
                    }
                }
                
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
            return storesWithOrders;
        }

        getNextOrderFromQueue(color, houseX, houseY) {
            // Find all pending orders for this color
            const colorOrders = this.orderQueue.filter(order => order.color === color);
            if (colorOrders.length === 0) return null;
            
            // Group by store and count orders
            const storeOrderCounts = new Map();
            for (const order of colorOrders) {
                const key = `${order.storeX},${order.storeY}`;
                if (!storeOrderCounts.has(key)) {
                    storeOrderCounts.set(key, { x: order.storeX, y: order.storeY, orders: 0 });
                }
                storeOrderCounts.get(key).orders++;
            }
            
            // Check connectivity and sort by order count
            const houseRoad = this.getAdjacentRoad(houseX, houseY);
            if (!houseRoad) return null;
            
            const connectedStores = [];
            for (const [key, storeInfo] of storeOrderCounts) {
                const storeRoad = this.getAdjacentRoad(storeInfo.x, storeInfo.y);
                if (!storeRoad) continue;
                
                const path = this.findPath(houseRoad.x, houseRoad.y, storeRoad.x, storeRoad.y);
                if (path) {
                    connectedStores.push(storeInfo);
                }
            }
            
            if (connectedStores.length === 0) return null;
            
            // Sort by order count (descending)
            connectedStores.sort((a, b) => b.orders - a.orders);
            
            // Pick one of top 3 at random
            const top3 = connectedStores.slice(0, Math.min(3, connectedStores.length));
            const chosen = top3[Math.floor(Math.random() * top3.length)];
            
            // Remove the order from queue
            const orderIndex = this.orderQueue.findIndex(
                order => order.storeX === chosen.x && order.storeY === chosen.y && order.color === color
            );
            if (orderIndex !== -1) {
                this.orderQueue.splice(orderIndex, 1);
            }
            
            return { x: chosen.x, y: chosen.y, color: color };
        }

        findPath(startX, startY, endX, endY) {
            // A* pathfinding for cars
            const openSet = [{ x: startX, y: startY, g: 0, h: 0, f: 0, parent: null }];
            const closedSet = new Set();
            const heuristic = (x, y) => Math.abs(x - endX) + Math.abs(y - endY);
            while (openSet.length > 0) {
                openSet.sort((a, b) => a.f - b.f);
                const current = openSet.shift();
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
                for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                    const nx = current.x + dx;
                    const ny = current.y + dy;
                    const nKey = `${nx},${ny}`;
                    if (closedSet.has(nKey)) continue;
                    if (!this.roads.has(nKey)) continue;
                    const g = current.g + 1;
                    const h = heuristic(nx, ny);
                    const f = g + h;
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
            return null;
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

        startBuildingGeneration() {
            let buildingCount = 0;
            
            const addBuilding = () => {
                const availableColors = ['blue', 'red', 'green'];
                const orientations = ['up', 'down', 'left', 'right'];
                
                // Get colors currently on the grid
                const existingColors = new Set();
                for (const [_, houseData] of this.houses) {
                    existingColors.add(houseData.color);
                }
                for (const [_, storeData] of this.stores) {
                    existingColors.add(storeData.color);
                }
                
                const existingColorsArray = Array.from(existingColors);
                const unusedColors = availableColors.filter(c => !existingColors.has(c));
                
                // Decide what to add (1, 2, or 3)
                const options = [];
                
                // Option 1: house of existing color (if we have existing colors)
                if (existingColorsArray.length > 0) {
                    options.push(1);
                }
                
                // Option 2: store of existing color (if we have existing colors)
                if (existingColorsArray.length > 0) {
                    options.push(2);
                }
                
                // Option 3: house + store of new color (if we have unused colors)
                if (unusedColors.length > 0) {
                    options.push(3);
                }
                
                if (options.length === 0) return;
                
                const choice = options[Math.floor(Math.random() * options.length)];
                
                const findValidPosition = (minDistance = 5) => {
                    const maxAttempts = 100;
                    for (let attempt = 0; attempt < maxAttempts; attempt++) {
                        const x = Math.floor(Math.random() * (roads.size[0] - 4)) + 2;
                        const y = Math.floor(Math.random() * (roads.size[1] - 4)) + 2;
                        
                        let tooClose = false;
                        for (const [key, _] of this.houses) {
                            const [hx, hy] = key.split(',').map(Number);
                            if (Math.abs(x - hx) + Math.abs(y - hy) < minDistance) {
                                tooClose = true;
                                break;
                            }
                        }
                        
                        if (!tooClose) {
                            for (const [key, _] of this.stores) {
                                const [sx, sy] = key.split(',').map(Number);
                                if (Math.abs(x - sx) + Math.abs(y - sy) < minDistance) {
                                    tooClose = true;
                                    break;
                                }
                            }
                        }
                        
                        if (!tooClose) {
                            return { x, y };
                        }
                    }
                    return null;
                };
                
                if (choice === 1) {
                    // Add house of existing color
                    const color = existingColorsArray[Math.floor(Math.random() * existingColorsArray.length)];
                    const pos = findValidPosition();
                    if (pos) {
                        const orientation = orientations[Math.floor(Math.random() * orientations.length)];
                        this.addHouse(pos.x, pos.y, orientation, color);
                    }
                } else if (choice === 2) {
                    // Add store of existing color
                    const color = existingColorsArray[Math.floor(Math.random() * existingColorsArray.length)];
                    const pos = findValidPosition();
                    if (pos) {
                        const orientation = orientations[Math.floor(Math.random() * orientations.length)];
                        this.addStore(pos.x, pos.y, orientation, color);
                    }
                } else {
                    // Add house + store of new color
                    const color = unusedColors[Math.floor(Math.random() * unusedColors.length)];
                    const housePos = findValidPosition();
                    if (housePos) {
                        const houseOrientation = orientations[Math.floor(Math.random() * orientations.length)];
                        this.addHouse(housePos.x, housePos.y, houseOrientation, color);
                        
                        // Find position for store near the house
                        let storePos = null;
                        const maxAttempts = 100;
                        for (let attempt = 0; attempt < maxAttempts; attempt++) {
                            const pos = findValidPosition();
                            if (pos) {
                                const distance = Math.abs(pos.x - housePos.x) + Math.abs(pos.y - housePos.y);
                                if (distance <= 9 && distance >= 3) {
                                    storePos = pos;
                                    break;
                                }
                            }
                        }
                        
                        if (storePos) {
                            const storeOrientation = orientations[Math.floor(Math.random() * orientations.length)];
                            this.addStore(storePos.x, storePos.y, storeOrientation, color);
                        }
                    }
                }
                
                buildingCount++;
                
                // Dynamic delay based on building count
                let delay;
                if (buildingCount <= 3) {
                    delay = 5000 + Math.random() * 5000; // 5-10 seconds
                } else if (buildingCount <= 7) {
                    delay = 10000 + Math.random() * 10000; // 10-20 seconds
                } else {
                    delay = 20000 + Math.random() * 20000; // 20-40 seconds
                }
                
                this.buildingTimer = setTimeout(addBuilding, delay);
            };
            
            // Start first building after 5-10 seconds
            const initialDelay = 5000 + Math.random() * 5000;
            this.buildingTimer = setTimeout(addBuilding, initialDelay);
        }

        stopBuildingGeneration() {
            if (this.buildingTimer) {
                clearTimeout(this.buildingTimer);
                this.buildingTimer = null;
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
                    color(this.roadColor),
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
            // Find a road tile next to this position
            for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const nx = x + dx;
                const ny = y + dy;
                if (this.roads.has(`${nx},${ny}`)) {
                    return { x: nx, y: ny };
                }
            }
            return null;
        }

        // Timer and game over methods
        startStoreTimer(storeKey) {
            const timer = setTimeout(() => {
                // Check if store still has > 5 orders
                const orderCount = this.orders.get(storeKey) || 0;
                if (orderCount > 5) {
                    this.triggerGameOver();
                }
            }, 30000); // 30 seconds
            
            this.storeTimers.set(storeKey, timer);
        }

        triggerGameOver() {
            this.cleanup();
            go("gameover", { score: this.score });
        }

        getScore() {
            return this.score;
        }

        // Game management methods
        initGame() {
            this.editMode = false;
            this.editButton = null;
            this.roadCounter = null;
            this.scoreDisplay = null;
            this.clickHandler = null;
            
            this.resetMap();
            this.setTotalRoads(50);
            this.generateLevel();

            // Start order generation after 10 seconds
            setTimeout(() => {
                this.startOrderGeneration();
            }, 11500);

            // Start building generation
            this.startBuildingGeneration();
        }

        setupUI() {
            // Create edit button
            this.editButton = add([
                pos(width()/2, 10),
                anchor("center"),
                rect(150, 30),
                color(12, 72, 212, 1),
                z(1000),
                area(),
            ]);

            this.editButton.add([
                text("Edit Roads", { size: 24, font: "monospace" }),
                pos(0, 4),
                color(255, 255, 255),
                anchor("center"),
                z(this.editButton.z - 100),
            ]);

            this.editButton.onClick(() => {
                this.toggleEditMode();
            });

            // Road counter UI
            this.roadCounter = add([
                text("", { size: 20, font: "monospace" }),
                pos(width()/2 + 140, 4),
                z(1000),
                opacity(0),
            ]);

            // Score display
            this.scoreDisplay = add([
                text("Score: 0", { size: 24, font: "monospace" }),
                pos(10, 10),
                z(1000),
                color(255, 255, 255),
            ]);
        }

        toggleEditMode() {
            this.editMode = !this.editMode;
            this.editButton.get("text")[0].text = this.editMode ? "Done Editing" : "Edit Roads";
            this.editButton.width = this.editButton.get("text")[0].width + 20;
            this.roadCounter.opacity = this.editMode ? 1 : 0;
            if (this.editMode) {
                this.showEditMode();
            } else {
                this.hideEditMode();
            }
        }

        setupClickHandler() {
            this.clickHandler = onClick((_) => {
                if (!this.editMode) return;
                const pos = mousePos();
                const x = Math.floor(pos.x / this.tileSize);
                const y = Math.floor(pos.y / this.tileSize);
                if (this.isProtectedRoad(x, y)) return;
                // Toggle road
                if (this.hasRoad(x, y)) {
                    this.removeRoad(x, y);
                } else {
                    this.addRoad(x, y);
                }
            });
        }

        updateUI() {
            if (this.roadCounter) {
                this.roadCounter.text = `Roads: ${this.getRoadCount()}/${this.getTotalRoads()}`;
            }
            if (this.scoreDisplay) {
                this.scoreDisplay.text = `Score: ${this.score}`;
            }
            // Update order indicators to refresh countdown timers
            if (this.warningStores.size > 0) {
                this.#generateOrderIndicators();
            }
        }

        cleanup() {
            this.stopOrderGeneration();
            this.stopBuildingGeneration();
            
            // Clear all store timers
            for (const [key, timer] of this.storeTimers) {
                clearTimeout(timer);
            }
            this.storeTimers.clear();
            
            if (this.editButton) destroy(this.editButton);
            if (this.roadCounter) destroy(this.roadCounter);
            if (this.scoreDisplay) destroy(this.scoreDisplay);
        }
    }

    // load images
    for (let color of ['blue', 'red', 'green']) {       
        loadSprite(`${color}House`, `/houses/${color}House.png`);
    }
    return new roads(...args);
}