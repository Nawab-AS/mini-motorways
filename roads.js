export default function loadRoads(...args) {
    class roads {
        roadColor = '#a0826d';
        tileSize = 32;
        static size = [40, 23]
        constructor() {
            this.map = roads.getMap();
            this.roads = new Map();
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
            
            if (!this.roads.has(key)) return false; // road exists

            // Remove the road
            this.roads.delete(key);
            this.#generateRoads();
            return true;
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
                ]);

                for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    const neighborKey = `${Math.floor(x / tileSize) + dx},${Math.floor(y / tileSize) + dy}`;
                    if (!this.roads.has(neighborKey)) continue; // no neighbour
                    if (dx !== 0) { // horizontal
                        add([
                            pos(x + (dx * roadWidth / 2), y),
                            color(this.roadColor),
                            rect(roadWidth, roadWidth),
                            anchor("center"),
                            "road",
                        ]);
                    } else { // vertical
                        add([
                            pos(x, y + (dy * roadWidth / 2)),
                            color(this.roadColor),
                            rect(roadWidth, roadWidth),
                            anchor("center"),
                            "road",
                        ]);
                    }
                }
            }
        }
    }

    return new roads(...args);
}