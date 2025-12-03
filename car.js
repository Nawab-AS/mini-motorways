export default function loadCars() {
    class car {
        static colors = ["red", "blue", "green"];
        shadowDistance = 5;
        scale = 0.04;
        speed = 50;
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

            // Car shadow and sprite
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

            // Wait at store for a bit before returning
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

            // Move towards next waypoint
            const direction = targetPos.sub(currentPos);
            const distance = direction.len();

            if (distance < 2) {
                this.pathIndex++;
                // If halfway, pause at store
                if (this.pathIndex === this.storeWaypointIndex) {
                    this.waitingAtStore = true;
                    this.waitTime = 0;
                    return;
                }
                // If finished, call onComplete
                if (this.pathIndex >= this.path.length) {
                    if (this.onComplete) this.onComplete();
                    return;
                }
            } else {
                const normalized = direction.unit();
                const moveDistance = Math.min(this.speed * dt, distance);
                this.object.pos = currentPos.add(normalized.scale(moveDistance));
                this.shadow.pos = this.object.pos.add(this.shadowDistance, this.shadowDistance);
                // Rotate sprite to face direction
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
            // Move car in direction it's facing
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


    // Load car sprites
    for (const color of car.colors) {
        loadSprite(`${color}Car`, `/cars/${color}Car.png`);
    }
    loadSprite("carShadow", "/cars/carShadow.png");

    return car;
}