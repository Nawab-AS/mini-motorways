export default function loadRoads(...args) {
    class roads {
        roadColor = '#a0826d';
        tileSize = 32;
        static size = [40, 23]
        constructor() {
            this.map = roads.getMap();
            this.roads = new Map();
            this.houses = new Map();
            this.stores = new Map();
            this.grid = false;
        }

        static getMap(){
            let map = [];
            for (let y = 0; y < roads.size[1]; y++) {
                map.push([]);
                for (let x = 0; x < roads.size[0]; x++) {
                    if (x == 0 || x == roads.size[0] - 1 || y == 0 || y == roads.size[1] - 1) {
                        map[y].push(false);
                        continue;
                    }
                    map[y].push(true);
                }
            }
            return map;
        }

        drawMap() {
            for (let y = 0; y < this.map.length; y++) {
                for (let x = 0; x < this.map[y].length; x++) {
                    const char = this.map[y][x];
                    add([
                        pos(x * this.tileSize, y * this.tileSize - 8),
                        color(char ? '#78cd6f' : '#8ca7ae'),
                        rect(this.tileSize, this.tileSize),
                        z(-1),
                    ]);
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

            // Add the road
            this.roads.set(key, true);
            this.#generateRoads();
            return true;
        }

        removeRoad(x, y) {
            const key = `${x},${y}`;
            
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
                    z(1)
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
                    z(1),
                ]);
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
    }

    // load images
    for (let color of ['blue', 'red', 'green']) {       
        loadSprite(`${color}House`, `/houses/${color}House.png`);
    }
    return new roads(...args);
}