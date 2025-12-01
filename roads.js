export default function loadRoads(...args) {
    class roads {
        loaded = false;
        tileSize = 32;
        constructor(maps) {
            this.maps = {};
            this.currentMap = null;
            this.roads = [];
            this.grid = false;
            for (const path of maps) {
                this.#loadMap(path, maps.indexOf(path) == maps.length - 1);
            }
        }

        #loadMap(path, setLoaded){
            if (setLoaded) this.loaded = false;
            fetch(`./assets/maps/${path}`).then(res => res.text())
                .then(text => {
                    this.maps[path] = text.trim().split("\n").map(row => row.split(""));
                    if (setLoaded) this.loaded = true;
            });
        }

        async setMap(path) {
            while (!this.loaded) { await new Promise(resolve => setTimeout(resolve, 100)); }
            if (!this.maps[path]) throw new Error(`Map not loaded: ${path}`);
            this.currentMap = this.maps[path];


            // draw Tiles
            const legend = {
                '░': '#22CC55', // grass
                '▒': '#964B00', // dirt
                '▓': '#555555', // mountain
                '~': '#0000FF', // water
            };

            for (let y = 0; y < this.currentMap.length; y++) {
                for (let x = 0; x < this.currentMap[y].length; x++) {
                    const char = this.currentMap[y][x];
                    if (!legend[char]) continue;
                    let points = [];
                    const tileSize = this.tileSize;

                    const corners = [
                        { dx: -1, dy: -1, px: 0, py: 0, ex: tileSize/2, ey: 0 }, // top-left
                        { dx: 1, dy: -1, px: tileSize, py: 0, ex: tileSize, ey: tileSize/2 }, // top-right
                        { dx: 1, dy: 1, px: tileSize, py: tileSize, ex: tileSize/2, ey: tileSize }, // bottom-right
                        { dx: -1, dy: 1, px: 0, py: tileSize, ex: tileSize/2, ey: 0 }, // bottom-left
                    ];

                    for (const { dx, dy, px, py, ex, ey } of corners) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (
                            nx < 0 || ny < 0 ||
                            nx >= this.currentMap[y].length ||
                            ny >= this.currentMap.length
                        ) {
                            points.push(vec2(px, py));
                        } else if (this.currentMap[ny][nx] == char) {
                            points.push(vec2(px, py));
                        }

                        points.push(vec2(ex, ey));
                    }

                    if (points.length <= 2) continue;

                    add([
                        pos(x * tileSize, y * tileSize),
                        color(legend[char]),
                        polygon(points),
                    ]);
                }
            }
        }
    }

    return new roads(...args);
}