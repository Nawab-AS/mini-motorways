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
                    if (legend[char]) {
                        add([
                            pos(x * this.tileSize, y * this.tileSize),
                            color(legend[char]),
                            rect(this.tileSize, this.tileSize),
                        ]);
                    }
                }
            }
        }
    }

    return new roads(...args);
}