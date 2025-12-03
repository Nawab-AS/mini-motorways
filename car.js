export default function loadCars() {
    class car {
        static colors = ["red", "blue", "green"];
        shadowDistance = 3;
        scale = 0.04;
        speed = 70;
        constructor(color, position=[0,0], path=[], onComplete=null, onReachStore=null, storeWaypointIndex=0) {
            if (!car.colors.includes(color)) {throw new Error(`Invalid car color: ${color}`)}
            this.color = color;
            this.path = path;
            this.pathIndex = 0;
            this.onComplete = onComplete;
            this.onReachStore = onReachStore;
            this.storeWaypointIndex = storeWaypointIndex;
            this.waitingAtStore = false;
            this.waitTime = 0;
            this.active = true;

                // Create car shadow and sprite
            this.shadow = add([
                pos(position[0] + this.shadowDistance, position[1] + this.shadowDistance),
                rotate(0),
                scale(this.scale),
                anchor("center"),
                sprite("carShadow"),
                z(0.5),
            ]);

            this.object = add([
                pos(position[0], position[1]),
                rotate(0),
                scale(this.scale),
                anchor("center"),
                sprite(`${color}Car`),
                "car",
                color,
                z(1),
            ]);
        }

        update(dt) {
            if (!this.active || !this.path || this.pathIndex >= this.path.length) return;

                // Pause at store for a short time before heading home
            if (this.waitingAtStore) {
                this.waitTime += dt;
                if (this.waitTime >= 0.5) {
                    this.waitingAtStore = false;
                    if (this.onReachStore) this.onReachStore();
                }
                return;
            }

            const target = this.path[this.pathIndex];
            const targetPos = vec2(target.x, target.y);
            const currentPos = this.object.pos;

                // Move car towards the next waypoint
            const direction = targetPos.sub(currentPos);
            const distance = direction.len();

            if (distance < 2) {
                this.pathIndex++;
                    // Pause at store when halfway through path
                if (this.pathIndex === this.storeWaypointIndex) {
                    this.waitingAtStore = true;
                    this.waitTime = 0;
                    return;
                }
                    // Call onComplete when car finishes its path
                if (this.pathIndex >= this.path.length) {
                    if (this.onComplete) this.onComplete();
                    return;
                }
            } else {
                const normalized = direction.unit();
                const moveDistance = Math.min(this.speed * dt, distance);
                this.object.pos = currentPos.add(normalized.scale(moveDistance));
                this.shadow.pos = this.object.pos.add(this.shadowDistance, this.shadowDistance);
                    // Rotate car sprite to face direction
                const targetAngle = Math.atan2(normalized.y, normalized.x) * 180 / Math.PI;
                this.object.angle = targetAngle;
                this.shadow.angle = targetAngle;
            }
        }

        destroy() {
            this.active = false;
            destroy(this.object);
            destroy(this.shadow);
        }

        move(d) {
                // Move car in the direction it's facing
            const angleRad = this.object.angle * Math.PI / 180;
            this.object.move(Math.cos(angleRad) * d, Math.sin(angleRad) * d);
            this.shadow.pos = this.object.pos.add(this.shadowDistance, this.shadowDistance);
        }

        rotate(angle) {
                // Rotate car sprite
            this.object.angle += angle;
            this.object.angle %= 360;
            this.shadow.angle = this.object.angle;
        }
    }

    class CarManager {
        constructor() {
            this.activeCars = [];
            this.carsPerHouse = new Map();
            this.houseLastSpawn = new Map();
            this.carSpawnTimer = 0.5;
            this.timeSinceLastCheck = 0;
            this.lastTime = Date.now();
            this.roads = null;
        }

        init(roads) {
            this.roads = roads;
            this.activeCars = [];
            this.carsPerHouse = new Map();
            this.houseLastSpawn = new Map();
            this.timeSinceLastCheck = 0;
            this.lastTime = Date.now();
        }

        update() {
            const now = Date.now();
            const dt = (now - this.lastTime) / 1000;
            this.lastTime = now;

                // Update all cars currently in the game
            for (let i = this.activeCars.length - 1; i >= 0; i--) {
                const carInstance = this.activeCars[i];
                carInstance.update(dt);
                if (!carInstance.active) {
                    this.activeCars.splice(i, 1);
                }
            }

                // Check if new cars should be spawned for orders
            this.timeSinceLastCheck += dt;
            if (this.timeSinceLastCheck >= this.carSpawnTimer) {
                this.timeSinceLastCheck = 0;
                this.spawnCars();
            }
        }

        spawnCars() {
            if (!this.roads) return;
            const houses = this.roads.getHousePositions();
            const currentTime = Date.now();
            
                // Group houses by color and check if they can spawn cars
            const availableHousesByColor = new Map();
            for (const house of houses) {
                const houseKey = `${house.x},${house.y}`;
                const carCount = this.carsPerHouse.get(houseKey) || 0;
                const lastSpawn = this.houseLastSpawn.get(houseKey) || 0;
                const timeSinceSpawn = currentTime - lastSpawn;
                
                if (carCount < 2 && timeSinceSpawn >= 4000) {
                    if (!availableHousesByColor.has(house.color)) {
                        availableHousesByColor.set(house.color, []);
                    }
                    availableHousesByColor.get(house.color).push(house);
                }
            }
            
            // Try to spawn cars for each color that has available houses
            for (const [color, availableHouses] of availableHousesByColor) {
                if (availableHouses.length === 0) continue;
                
                    // Pick a random house that can spawn a car
                const house = availableHouses[Math.floor(Math.random() * availableHouses.length)];
                const houseKey = `${house.x},${house.y}`;
                
                    // Get the next order for this color and house
                const orderInfo = this.roads.getNextOrderFromQueue(color, house.x, house.y);
                if (!orderInfo) continue;
                
                const store = { x: orderInfo.x, y: orderInfo.y, color: orderInfo.color };
                
                const houseRoad = this.roads.getAdjacentRoad(house.x, house.y);
                const storeRoad = this.roads.getAdjacentRoad(store.x, store.y);
                if (!houseRoad || !storeRoad) continue;
                
                const pathToStore = this.roads.findPath(houseRoad.x, houseRoad.y, storeRoad.x, storeRoad.y);
                if (!pathToStore) continue;
                
                const pathToHome = this.roads.findPath(storeRoad.x, storeRoad.y, houseRoad.x, houseRoad.y);
                if (!pathToHome) continue;
                
                const tileSize = this.roads.tileSize;
                const pathToStorePixels = pathToStore.map(p => ({
                    x: (p.x + 0.5) * tileSize,
                    y: (p.y + 0.5) * tileSize
                }));
                const pathToHomePixels = pathToHome.map(p => ({
                    x: (p.x + 0.5) * tileSize,
                    y: (p.y + 0.5) * tileSize
                }));
                const startPos = [(house.x + 0.5) * tileSize, (house.y + 0.5) * tileSize];
                const fullPath = [...pathToStorePixels, ...pathToHomePixels];
                const storeWaypointIndex = pathToStorePixels.length;
                
                const carInstance = new car(
                    store.color,
                    startPos,
                    fullPath,
                    () => {
                        carInstance.destroy();
                        const currentCount = this.carsPerHouse.get(houseKey) || 0;
                        this.carsPerHouse.set(houseKey, Math.max(0, currentCount - 1));
                    },
                    () => {
                        this.roads.removeOrder(store.x, store.y);
                    },
                    storeWaypointIndex
                );
                this.activeCars.push(carInstance);
                const currentCount = this.carsPerHouse.get(houseKey) || 0;
                this.carsPerHouse.set(houseKey, currentCount + 1);
                this.houseLastSpawn.set(houseKey, Date.now());
            }
        }
    }

    // Load car sprites
    for (const color of car.colors) {
        loadSprite(`${color}Car`, `/cars/${color}Car.png`);
    }
    loadSprite("carShadow", "/cars/carShadow.png");

        // Return the car manager instance
    return new CarManager();
}