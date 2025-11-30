export default function loadRoads(...args) {
    class roads {
        loaded = false;
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

        setMap(path) {
            if (!this.loaded) { // wait untill all maps are loaded
                setTimeout(() => this.setMap(path), 100);
                return;
            }
            if (!this.maps[path]) throw new Error(`Map not loaded: ${path}`);
            this.currentMap = this.maps[path];
        }

        drawTilemap(tileSize = 32) {
            const legend = {
                '░': 'grass',
                '▒': 'dirt',
                '▓': 'mountain',
                '~': 'water',
            };
            for (let y = 0; y < this.maps.length; y++) {
                for (let x = 0; x < this.maps[y].length; x++) {
                    const char = this.maps[y][x];
                    const tile = legend[char];
                    if (tile) {
                        add([
                            sprite(`tiles/${tile}.png`),
                            pos(x * tileSize, y * tileSize),
                            area(),
                            z(0),
                        ]);
                    }
                }
            }
        }
    }

    return new roads(...args);
}